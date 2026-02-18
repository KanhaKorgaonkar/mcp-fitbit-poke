/**
 * OAuth routes for hosted/HTTP deployment.
 * Mount these on the main Express app when BASE_URL is set.
 */
import express, { Request, Response } from 'express';
import { AuthorizationCode } from 'simple-oauth2';
import { FITBIT_OAUTH_CONFIG } from './config.js';

import { saveTokenFromOAuth } from './auth.js';

export { getAccessToken, initializeAuth } from './auth.js';

// Fitbit OAuth2 Configuration
function getFitbitConfig() {
  return {
    client: {
      id: process.env.FITBIT_CLIENT_ID || '',
      secret: process.env.FITBIT_CLIENT_SECRET || '',
    },
    auth: {
      tokenHost: 'https://api.fitbit.com',
      authorizePath: 'https://www.fitbit.com/oauth2/authorize',
      tokenPath: 'https://api.fitbit.com/oauth2/token',
    },
    options: {
      authorizationMethod: 'header' as const,
    },
  };
}

export function createOAuthRouter(baseUrl: string): express.Router {
  const router = express.Router();
  const fitbitConfig = getFitbitConfig();
  const oauthClient = new AuthorizationCode(fitbitConfig);

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/callback`;

  router.get('/auth', (_req: Request, res: Response) => {
    if (!fitbitConfig.client.id || !fitbitConfig.client.secret) {
      res.status(500).send('Fitbit credentials not configured.');
      return;
    }
    const authorizationUri = oauthClient.authorizeURL({
      redirect_uri: redirectUri,
      scope: FITBIT_OAUTH_CONFIG.SCOPES,
    });
    res.redirect(authorizationUri);
  });

  router.get('/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('Error: Authorization code missing.');
      return;
    }

    try {
      const tokenResult = await oauthClient.getToken({
        code,
        redirect_uri: redirectUri,
      });
      await saveTokenFromOAuth(tokenResult.token);
      res.send(
        '<h1>Authorization successful!</h1><p>You can close this window. Your Fitbit MCP server is now authenticated.</p>'
      );
    } catch (error) {
      console.error('Error obtaining access token:', error);
      res.status(500).send('Error obtaining access token. Please try again.');
    }
  });

  return router;
}
