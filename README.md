# Fitbit MCP for Poke AI

**This is a derivative of [mcp-fitbit](https://github.com/TheDigitalNinja/mcp-fitbit) by [Russell "TheDigitalNinja" Perkins](https://github.com/TheDigitalNinja).** All core Fitbit integration, OAuth, and tool logic is their work. This repo adds remote HTTP hosting so you can connect it to [Poke AI](https://poke.com) and other MCP clients that require a hosted endpoint.

---

This adds **Streamable HTTP transport** on top of the original, so your Poke AI agent can access your Fitbit data — sleep patterns, activity, heart rate, nutrition, etc. — from a deployed server.

## Attribution & License

- **Original project:** [TheDigitalNinja/mcp-fitbit](https://github.com/TheDigitalNinja/mcp-fitbit)
- **Original author:** Russell "TheDigitalNinja" Perkins
- **License:** MIT (see [LICENSE](LICENSE)) — same as the original

The modifications in this repo (HTTP transport, hosted OAuth routes, deployment configs) are additive. Consider [opening a fork](https://github.com/TheDigitalNinja/mcp-fitbit/fork) of the original on GitHub to maintain a clear connection to the source.

## What's different?

The original mcp-fitbit runs locally via stdio. This adds:

- **Streamable HTTP transport** — deploy to Railway, Render, or any Node.js host
- **Remote MCP endpoint** — connect Poke AI and other MCP clients to your hosted server
- **OAuth for hosted deployment** — authorize Fitbit at your deployment URL

## What it does

😴 **Sleep Analysis** — Retrieve sleep patterns and quality metrics  
🏃 **Exercise & Activities** — Get detailed workout logs and activity data  
❤️ **Heart Rate Data** — Monitor heart rate patterns and zones  
⚖️ **Weight Tracking** — Access weight trends over time  
🍎 **Nutrition Logs** — Review food intake, calories, and macros  
👤 **Profile Info** — Access basic Fitbit profile details

## Quick Start (Deploy for Poke)

1. **Get Fitbit API credentials** at [dev.fitbit.com](https://dev.fitbit.com/)
   - OAuth 2.0 Application Type: `Personal`
   - You'll add the callback URL after deployment

2. **Deploy to Render:**
   - Go to [render.com](https://render.com) → New → Web Service → connect this repo
   - Build: `npm install && npm run build`, Start: `node build/index-http.js`
   - Add env vars: `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET`

3. **Add callback to Fitbit:** `https://your-app.onrender.com/callback`

4. **Authorize:** Visit `https://your-app.onrender.com/auth`

5. **Connect to Poke:** Add `https://your-app.onrender.com/mcp` at [poke.com/settings/connections/integrations/new](https://poke.com/settings/connections/integrations/new)

See [HOSTED-DEPLOY.md](HOSTED-DEPLOY.md) for full instructions.

## Local use (Cursor, Claude Desktop)

Works like the original — run locally and add to your MCP config:

```bash
npm install && npm run build
# Add FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET to .env
npm start
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_sleep_by_date_range` | Sleep logs for date range (max 100 days) |
| `get_weight` | Weight data over time periods |
| `get_exercises` | Activity/exercise logs |
| `get_heart_rate` | Heart rate for time period |
| `get_food_log` | Complete nutrition data for a day |
| `get_profile` | User profile information |
| ...and more | See [original repo](https://github.com/TheDigitalNinja/mcp-fitbit#available-tools) |
