# Deploy Fitbit MCP for Poke AI

This guide covers deploying the Fitbit MCP server so you can connect it to [Poke AI](https://poke.com) and other remote MCP clients.

## Prerequisites

1. **Fitbit API credentials** from [dev.fitbit.com](https://dev.fitbit.com/)
   - Create an app with **OAuth 2.0 Application Type: Personal**
   - You'll add the callback URL after deployment

2. **GitHub account** (for deployment)

## Deploy to Railway (Recommended)

Railway keeps your app running 24/7 — no spin-down like Render's free tier.

1. **Go to [Railway](https://railway.app)** and sign in with GitHub

2. **New Project** → **Deploy from GitHub repo** → select your repo

3. **Add environment variables** (in the service → Variables tab):
   - `FITBIT_CLIENT_ID` — your Fitbit Client ID
   - `FITBIT_CLIENT_SECRET` — your Fitbit Client Secret

4. **Generate a domain** — Service → Settings → Networking → **Generate Domain**
   - You'll get a URL like `https://mcp-fitbit-production-xxxx.up.railway.app`

5. **Update Fitbit app settings:**
   - Go to [dev.fitbit.com](https://dev.fitbit.com/) → your app
   - Add to **Callback URL:** `https://your-railway-domain.up.railway.app/callback`
   - Save

6. **Authorize Fitbit:**
   - Visit `https://your-railway-domain.up.railway.app/auth`
   - Log in to Fitbit and grant permissions
   - You'll see "Authorization successful!"

The `railway.json` in this repo configures the build and start commands automatically.

## Connect to Poke AI

1. Go to [poke.com/settings/connections/integrations/new](https://poke.com/settings/connections/integrations/new)

2. Add your MCP server URL: `https://your-railway-domain.up.railway.app/mcp`

3. **Important:** Use the `/mcp` path — Poke expects that endpoint

4. Test by asking Poke: *"Tell the subagent to use the Fitbit integration's get_profile tool"*

## Deploy to Render (Alternative)

Render's free tier spins down after ~15 min of inactivity (30–60s cold start on next request).

1. **Go to [Render](https://render.com)** → New → Web Service → connect your repo

2. **Configure:** Build Command `npm install && npm run build`, Start Command `node build/index-http.js`

3. Add `FITBIT_CLIENT_ID` and `FITBIT_CLIENT_SECRET` env vars

4. Deploy, then add your Render URL + `/callback` to Fitbit, and visit `/auth` to authorize

## Local Testing

Before deploying, test locally:

```bash
cd mcp-fitbit
npm run build
BASE_URL=http://localhost:3000 npm run start:http
```

Then visit http://localhost:3000 — you should see the server info. Add `http://localhost:3000/callback` to your Fitbit app for local testing.

## Token Storage

- Tokens are stored in `.fitbit-token.json` on the server
- On redeploy, the token may be cleared — visit `/auth` again to re-authorize
- Railway: filesystem persists between requests but may reset on redeploy
- Render: free tier has ephemeral filesystem; token is lost on every deploy

## Troubleshooting

- **"No valid access token"** — Visit `/auth` to authorize
- **OAuth error** — Ensure the callback URL in Fitbit matches your deployment URL + `/callback`
- **Poke not connecting** — Verify the URL ends with `/mcp`
