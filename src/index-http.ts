#!/usr/bin/env node

/**
 * HTTP/Streamable MCP server for Fitbit.
 * Deploy to Render, Railway, or similar for use with Poke AI and other remote MCP clients.
 *
 * Set BASE_URL to your deployment URL (e.g. https://mcp-fitbit-xxx.onrender.com)
 * Add that URL + /callback to your Fitbit app's allowed callback URLs.
 */

import { randomUUID } from 'node:crypto';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import {
  initializeAuth,
  getAccessToken,
} from './auth.js';
import { createOAuthRouter } from './auth-hosted.js';
import { registerWeightTool } from './weight.js';
import { registerSleepTool } from './sleep.js';
import { registerProfileTool } from './profile.js';
import { registerActivitiesTool } from './activities.js';
import { registerHeartRateTools } from './heart-rate.js';
import { registerNutritionTools } from './nutrition.js';
import { registerDailyActivityTool } from './daily-activity.js';
import { registerActivityGoalsTool } from './activity-goals.js';
import { registerActivityTimeSeriesTool } from './activity-timeseries.js';
import { registerAzmTimeSeriesTool } from './azm-timeseries.js';
import './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

function validateEnvironment(): void {
  const requiredVars = {
    FITBIT_CLIENT_ID: process.env.FITBIT_CLIENT_ID,
    FITBIT_CLIENT_SECRET: process.env.FITBIT_CLIENT_SECRET,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Set FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET.');
    process.exit(1);
  }
}

validateEnvironment();

// In-memory event store for MCP session resumability
class InMemoryEventStore {
  private events = new Map<string, { streamId: string; message: unknown }>();

  generateEventId(streamId: string): string {
    return `${streamId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  getStreamIdFromEventId(eventId: string): string {
    const parts = eventId.split('_');
    return parts.length > 0 ? parts[0] : '';
  }

  async storeEvent(streamId: string, message: unknown): Promise<string> {
    const eventId = this.generateEventId(streamId);
    this.events.set(eventId, { streamId, message });
    return eventId;
  }

  async replayEventsAfter(
    lastEventId: string,
    { send }: { send: (eventId: string, message: unknown) => Promise<void> }
  ): Promise<string> {
    if (!lastEventId || !this.events.has(lastEventId)) return '';
    const streamId = this.getStreamIdFromEventId(lastEventId);
    if (!streamId) return '';

    let foundLastEvent = false;
    const sorted = [...this.events.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [eventId, { streamId: s, message }] of sorted) {
      if (s !== streamId) continue;
      if (eventId === lastEventId) {
        foundLastEvent = true;
        continue;
      }
      if (foundLastEvent) await send(eventId, message);
    }
    return streamId;
  }
}

function createMcpServer() {
  const server = new McpServer({
    name: 'fitbit',
    version: '1.0.0',
    capabilities: { resources: {}, tools: {} },
  });

  registerWeightTool(server, getAccessToken);
  registerSleepTool(server, getAccessToken);
  registerProfileTool(server, getAccessToken);
  registerActivitiesTool(server, getAccessToken);
  registerHeartRateTools(server, getAccessToken);
  registerNutritionTools(server, getAccessToken);
  registerDailyActivityTool(server, getAccessToken);
  registerActivityGoalsTool(server, getAccessToken);
  registerActivityTimeSeriesTool(server, getAccessToken);
  registerAzmTimeSeriesTool(server, getAccessToken);

  return server;
}

const transports: Record<string, InstanceType<typeof StreamableHTTPServerTransport>> = {};

async function main() {
  await initializeAuth();

  const port = parseInt(process.env.PORT || '3000', 10);
  const baseUrl =
    process.env.BASE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : null) ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${port}`;
  const app = express();
  app.use(express.json());

  // OAuth routes for Fitbit authorization
  app.use(createOAuthRouter(baseUrl));

  // Health check
  app.get('/', (_req, res) => {
    res.json({
      name: 'Fitbit MCP Server',
      version: '1.0.0',
      mcp: `${baseUrl}/mcp`,
      auth: `${baseUrl}/auth`,
      status: 'running',
    });
  });

  // MCP Streamable HTTP endpoint
  app.post('/mcp', async (req, res) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport = sessionId ? transports[sessionId] : undefined;

      if (sessionId && transport) {
        await transport.handleRequest(req, res, req.body);
        return;
      }

      if (!sessionId && isInitializeRequest(req.body)) {
        const eventStore = new InMemoryEventStore();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          eventStore,
          onsessioninitialized: (sid) => {
            transports[sid] = transport!;
          },
        });

        transport.onclose = () => {
          const sid = transport!.sessionId;
          if (sid && transports[sid]) delete transports[sid];
        };

        const server = createMcpServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID' },
        id: null,
      });
    } catch (error) {
      console.error('MCP request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Fitbit MCP Server running at ${baseUrl}`);
    console.log(`  MCP endpoint: ${baseUrl}/mcp`);
    console.log(`  OAuth: Visit ${baseUrl}/auth to authorize Fitbit`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
