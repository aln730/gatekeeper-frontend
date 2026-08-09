# gatekeeper-frontend

Web interface for [gatekeeper-mqtt](https://github.com/ComputerScienceHouse/gatekeeper-mqtt). Lets CSH members view door status and trigger unlocks, and RTPs browse access logs, from a browser.

Built with Next.js 15, next-auth v5 (CSH SSO), react-bootstrap, and [csh-material-bootstrap](https://github.com/ComputerScienceHouse/csh-material-bootstrap).

## Features

### Doors

- **Doors dashboard** — live online/offline status for all doors, updated every 30 seconds
- **Unlock** — send an unlock command to any door with a single click
- **Access feedback** — door-specific error messages on 403 (e.g. safety seminar, RTP status)

### Logs

- **Access logs** — log viewer for door access events

### Keys

- **Keys Management** — Disable/Delete user keys using a simple lookup

### AccessGate

- Enforce RTPs to state a reason in order to access Keys/Logs page

### Audit

- **Audit Logs** — log viewer for page access events

## Prerequisites

- Node.js 20+
- A running instance of [gatekeeper-mqtt](https://github.com/ComputerScienceHouse/gatekeeper-mqtt)
- A CSH SSO OIDC client (register at [sso.csh.rit.edu](https://sso.csh.rit.edu))

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:

| Variable              | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the gatekeeper-mqtt API, no trailing slash (e.g. `http://localhost:3001`) |
| `AUTH_SECRET`         | Session encryption secret — generate with `openssl rand -base64 32`                   |
| `AUTH_OIDC_ID`        | OIDC client ID from CSH SSO                                                           |
| `AUTH_OIDC_SECRET`    | OIDC client secret from CSH SSO                                                       |

The OIDC client must have `http://localhost:3000/api/auth/callback/csh` in its allowed redirect URIs (replace `localhost:3000` with your deployment URL in production).

## Development

Note: For developing new features or fixes, refer to the [gatekeeper-mqtt API docs](https://github.com/ComputerScienceHouse/gatekeeper-mqtt/blob/main/docs.org) for available endpoints.

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000). Unauthenticated requests are redirected to CSH SSO automatically.

## Testing

```bash
npm test
```

## Production Build

```bash
npm run build
npm start
```
