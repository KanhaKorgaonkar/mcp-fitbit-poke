# Privacy Policy

**Last updated:** February 2025

## Overview

mcp-fitbit-poke is a self-hosted application that connects your Fitbit account to AI assistants (such as Poke). When you deploy and run this software, **you** are the operator. This policy describes how the software handles data when you use it.

## Data Handling

### Fitbit Data

- **OAuth tokens** — Stored locally on the server you deploy (e.g., in `.fitbit-token.json`). These are used to access your Fitbit data on your behalf.
- **Health data** — Retrieved from Fitbit’s API only when you or your AI assistant requests it. Data is not stored long-term; it is fetched on demand and passed to the requesting client.
- **No third-party sharing** — Your Fitbit data is not sent to the developers of this software, advertisers, or any other third parties.

### Who Has Access

- **You** — As the deployer, you control the server and any data on it.
- **Fitbit** — Subject to [Fitbit’s Privacy Policy](https://www.fitbit.com/global/us/legal/privacy-policy).
- **AI clients** — Only clients you connect (e.g., Poke) receive data you explicitly request through them.

## Self-Hosted Use

If you deploy this on Railway, Render, or your own infrastructure:

- Tokens and any transient data stay on your deployment.
- The maintainers of this repository do not collect, store, or process your data.
- You are responsible for securing your deployment and environment variables.

## Fitbit’s Policies

Use of Fitbit data is also governed by Fitbit’s terms and privacy policy. Review them at:

- [Fitbit Terms of Service](https://www.fitbit.com/global/us/legal/terms-of-service)
- [Fitbit Privacy Policy](https://www.fitbit.com/global/us/legal/privacy-policy)

## Changes

This policy may be updated. The “Last updated” date at the top reflects the latest version. Continued use of the software after changes constitutes acceptance of the updated policy.

## Contact

For questions about this software, open an issue at [github.com/KanhaKorgaonkar/mcp-fitbit-poke](https://github.com/KanhaKorgaonkar/mcp-fitbit-poke).
