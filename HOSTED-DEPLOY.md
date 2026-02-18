# Deploy Fitbit MCP for Poke AI

This guide covers deploying the Fitbit MCP server so you can connect it to [Poke AI](https://poke.com) and other remote MCP clients.

## Prerequisites

1. **Fitbit API credentials** from [dev.fitbit.com](https://dev.fitbit.com/)
   - Create an app with **OAuth 2.0 Application Type: Personal**
   - You'll add the callback URL after deployment
   - **Privacy Policy URL:** `https://github.com/KanhaKorgaonkar/mcp-fitbit-poke/blob/main/PRIVACY.md`
   - **Terms of Service URL:** `https://github.com/KanhaKorgaonkar/mcp-fitbit-poke/blob/main/TERMS.md`

2. **GitHub account** (for deployment)

## Deploy to Render (Recommended)

1. **Go to [Render](https://render.com)** and sign in with GitHub

2. **New → Web Service** and connect your repo (`KanhaKorgaonkar/mcp-fitbit-poke`)

3. **Configure:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node build/index-http.js`
   - **Plan:** Free (or paid for always-on)

4. **Add environment variables:**
   - `FITBIT_CLIENT_ID` — your Fitbit Client ID
   - `FITBIT_CLIENT_SECRET` — your Fitbit Client Secret
   - `MCP_API_KEY` — a secret key you choose (e.g. `sk-` + random string). **Required** to protect your health data — only requests with this key can access the MCP endpoint. For multiple keys (e.g. team sharing one deployment), use `MCP_API_KEYS` with comma-separated values instead.

5. **Deploy** — Render will build and start your service

6. **Get your URL** — e.g. `https://mcp-fitbit-xxxx.onrender.com`

7. **Update Fitbit app settings:**
   - Go to [dev.fitbit.com](https://dev.fitbit.com/) → your app
   - Add to **Callback URL:** `https://your-app-name.onrender.com/callback`
   - Save

8. **Authorize Fitbit:**
   - Visit `https://your-app-name.onrender.com/auth`
   - Log in to Fitbit and grant permissions
   - You'll see "Authorization successful!"

**Note:** Render's free tier spins down after ~15 min of inactivity (30–60s cold start when Poke next requests). For always-on, use a paid plan.

The `render.yaml` in this repo can auto-configure the service if Render detects it.

## Connect to Poke AI

1. Go to [poke.com/settings/connections/integrations/new](https://poke.com/settings/connections/integrations/new)

2. **Server URL:** `https://your-app-name.onrender.com/mcp` (use the `/mcp` path)

3. **API Key:** Enter the same value you set for `MCP_API_KEY` in Render. Poke will send this with every request so only you can access your data.

4. Test by asking Poke: *"Tell the subagent to use the Fitbit integration's get_profile tool"*

## Deploy to Railway (Alternative)

Railway keeps your app running 24/7 with no spin-down. Good if you want instant responses.

1. **Go to [Railway](https://railway.app)** → New Project → Deploy from GitHub repo

2. Add `FITBIT_CLIENT_ID`, `FITBIT_CLIENT_SECRET`, and `MCP_API_KEY` env vars

3. Generate a domain in Settings → Networking

4. Add your Railway URL + `/callback` to Fitbit, then visit `/auth` to authorize

5. In Poke, use your Railway URL + `/mcp` and the same `MCP_API_KEY`

The `railway.json` in this repo configures build and start commands automatically.

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
- Render free tier: ephemeral filesystem; token is lost on every deploy
- Railway: filesystem persists between requests but may reset on redeploy

## Troubleshooting

- **"No valid access token"** — Visit `/auth` to authorize
- **OAuth error** — Ensure the callback URL in Fitbit matches your deployment URL + `/callback`
- **Poke not connecting** — Verify the URL ends with `/mcp`
- **401 Unauthorized** — Ensure the API key in Poke exactly matches `MCP_API_KEY` (or is in `MCP_API_KEYS`) on your deployment
