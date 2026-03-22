# Mission Control — Architecture

**Version:** 1.0.0  
**Stack:** Next.js 16.2, Tailwind v4, TypeScript, SQLite (better-sqlite3)  
**Hosting:** Self-hosted via Tailscale — NOT on Vercel

---

## Overview

Mission Control is Jerome's empire operations dashboard. It tracks AI agents, projects, goals, kanban tasks, and real-time gateway events. It runs as a Next.js app on the host machine (macOS) and is accessed remotely via Tailscale.

```
Browser (Tailscale) ──→ Next.js on :3200 ──→ SQLite (data/mission-control.db)
                                         └──→ OpenClaw Gateway (ws://127.0.0.1:18789)
```

---

## How the App Starts

### Development
```bash
npm run dev
# Starts on port $MISSION_CONTROL_PORT (default: 3200)
# Hot reload enabled, Turbopack bundler
```

### Production
```bash
npm run build    # Compile Next.js app
npm run start    # Serve on 0.0.0.0:$MISSION_CONTROL_PORT
```

The `start` script binds to `0.0.0.0` (all interfaces) so Tailscale can route to it.

### Tailscale Expose
```bash
tailscale serve --bg https+insecure://localhost:3200
```

This makes the dashboard available at your Tailscale hostname (e.g., `https://solar-clawd.tail3445ba.ts.net`).

### Docker (optional)
```bash
docker-compose up -d
# Builds image, mounts data/ volume, exposes port 3100
```

---

## Directory Structure

```
mission-control/
├── app/                      # Next.js App Router pages + API routes
│   ├── layout.tsx            # Root layout (Sidebar, GatewayStatus header)
│   ├── page.tsx              # Dashboard (metrics, agent status, kanban chart)
│   ├── agents/page.tsx       # Agent roster + office scene + hierarchy view
│   ├── kanban/page.tsx       # Drag-and-drop kanban + approval swimlane
│   ├── projects/page.tsx     # Projects + nested goals CRUD
│   ├── activity/page.tsx     # Filterable chronological activity feed
│   ├── memory/page.tsx       # Collective memories browser
│   ├── journal/page.tsx      # Daily journal entries
│   ├── calendar/page.tsx     # Calendar view
│   ├── chat/page.tsx         # Chat interface
│   ├── login/page.tsx        # Login page
│   └── api/                  # API routes (server-side)
│       ├── agents/           # CRUD agents, status updates, model sync
│       ├── kanban/           # CRUD kanban cards, approval resolution
│       ├── projects/         # CRUD projects
│       ├── goals/            # CRUD goals
│       ├── activity/         # Activity feed reads/writes
│       ├── memory/           # Memories CRUD
│       ├── journal/          # Journal entries CRUD
│       ├── calendar/         # Calendar events
│       ├── metrics/          # Dashboard KPI aggregation
│       ├── gateway/events/   # SSE endpoint (gateway → browser bridge)
│       └── auth/             # Login/logout session management
├── components/               # React UI components
│   ├── AgentStatus.tsx
│   ├── GatewayStatus.tsx     # Gateway connection indicator (SSE-driven)
│   ├── Sidebar.tsx           # Navigation sidebar
│   └── ui/                   # shadcn-style base components
├── lib/                      # Server-side shared utilities
│   ├── db.ts                 # SQLite connection + schema init + migrations
│   ├── gateway.ts            # WebSocket client to OpenClaw gateway (singleton)
│   ├── statusBus.ts          # In-process EventEmitter for agent status
│   ├── auth.ts               # Session token creation/verification (HMAC)
│   ├── data.ts               # Static fallback data (legacy, pre-DB)
│   └── utils.ts              # cn(), generateId(), type definitions
├── data/                     # Persisted data (gitignored in prod)
│   └── mission-control.db    # SQLite database
├── next.config.ts            # Next.js config (port, allowed origins, sqlite)
├── package.json              # Scripts and dependencies
├── Dockerfile                # Docker build (node:22-slim, builds Next.js)
├── docker-compose.yml        # Docker compose (mounts data/, exposes port)
└── proxy.ts                  # Stub (auth middleware disabled for now)
```

---

## Database

**Engine:** SQLite via `better-sqlite3` (synchronous, no connection pool needed)  
**Path:** `{cwd}/data/mission-control.db` (created automatically on first start)  
**WAL mode:** Enabled for concurrent reads

### Schema

| Table | Purpose |
|---|---|
| `agents` | AI agent registry (id, name, role, status, current_task, model, color) |
| `projects` | Ventures/projects (id, name, description, status, color) |
| `goals` | Nested goals under projects (progress, status) |
| `kanban_cards` | Task cards (column, priority, assigned agent, approval state) |
| `activity_feed` | Chronological event log (type, agent, description, metadata) |
| `metrics_snapshots` | Historical metrics (not heavily used yet) |
| `memories` | Collective agent memories (title, content, tags, importance) |
| `journal_entries` | Daily journal (one row per date, multiple text fields) |

### Migrations

`lib/db.ts` runs migrations on every startup via `runMigrations()`. Uses try/catch per statement (SQLite doesn't support `IF NOT EXISTS` for columns).

### Seeding

Default agents (jupiter, callisto) and sample projects (RIVLS, Ambient YouTube, AI Consulting) are inserted on first run via `INSERT OR IGNORE`.

---

## Gateway Connection

### How It Works

`lib/gateway.ts` maintains a **singleton WebSocket client** to the OpenClaw gateway. On first use (any API route calling `getGatewayClient()`), it connects and stays connected for the process lifetime.

**Connection flow:**
1. Connect to `ws://127.0.0.1:18789`
2. Receive `connect.challenge` event → respond with `connect` handshake (token auth)
3. Receive `hello-ok` → subscribe to `sessions.subscribe` for all sessions
4. Forward all gateway events to in-process `EventEmitter`

**Reconnection:** Auto-reconnects every 5 seconds on disconnect.

### SSE Bridge (Browser ← Gateway)

`app/api/gateway/events/route.ts` is the SSE endpoint browsers subscribe to. It:
- Opens a `ReadableStream` and attaches listeners to the gateway EventEmitter
- Forwards gateway events to all connected browser clients
- Handles `exec.approval.requested` events → auto-creates kanban cards in the `awaiting_approval` column
- Tracks agent activity from `health` events (session age → agent status update)
- Also listens on `statusBus` for direct agent status reports

**Approval flow:**
```
Gateway → exec.approval.requested
  → SSE route creates kanban card in "awaiting_approval"
  → Browser shows amber alert + approval card
  → User clicks Approve/Deny
  → PATCH /api/kanban/[id] { approved: true/false }
  → gateway.resolve(requestId, approved) sends response back to gateway
  → Card moves to "in_progress" or "backlog"
```

---

## Agent Status Tracking

Agents report status via two mechanisms:

### 1. Self-Report API (`agent-status.sh`)
Agents call `/api/agents/[id]/status` (POST) with `{ status, current_task }`. The `agent-status.sh` script in the workspace does this via curl. The API:
- Updates the DB
- Emits to `statusBus` → SSE subscribers update in real-time

### 2. Gateway Health Events
The gateway sends periodic `health` events with session data (age in ms). The SSE route parses these:
- Session age < 15s → agent is `thinking`
- Session age ≥ 15s → agent is `idle`
- Session key mapping: `agent:main:main` → jupiter, `agent:main:subagent:*` → callisto

### Status Values
- `idle` — not doing anything
- `thinking` — reasoning/planning
- `working` — actively executing
- `awaiting_approval` — blocked on user approval
- `error` — something failed

---

## Authentication

Simple HMAC-based session auth:
- `lib/auth.ts` uses `crypto.subtle` (Web Crypto API) to sign a fixed string
- Login: POST `/api/auth/login` with `{ username, password }` → sets `mc_session` cookie
- Cookie is `httpOnly`, 7-day expiry
- Credentials hardcoded in `lib/auth.ts` (jerome / @lphons3)
- **Note:** The middleware (`proxy.ts`) currently has auth disabled — all routes are public

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MISSION_CONTROL_PORT` | `3200` | Port the app listens on |
| `OPENCLAW_GATEWAY_URL` | `ws://127.0.0.1:18789` | OpenClaw gateway WebSocket URL |
| `OPENCLAW_GATEWAY_TOKEN` | `""` | Auth token for gateway connection |
| `OPENCLAW_SUBAGENT_MODEL` | `openrouter/anthropic/claude-sonnet-4-6` | Model label for Callisto (subagent) |

Set these in a `.env.local` file (not committed) or in your shell environment.

### Example `.env.local`
```env
MISSION_CONTROL_PORT=3200
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your-token-here
```

---

## Real-Time Updates

The browser uses **Server-Sent Events (SSE)** — not WebSocket — for live updates:

```
Browser → EventSource("/api/gateway/events")
       ← SSE stream (gateway events + agent status changes)
```

Multiple components open independent SSE connections:
- `GatewayStatus` — reads `connected` events to show gateway indicator
- `app/page.tsx` (Dashboard) — reads `agent.status` events for live agent status
- `app/agents/page.tsx` — reads `agent.status` events for agent cards
- `app/kanban/page.tsx` — reads `exec.approval.requested` to trigger card refresh

Polling fallbacks exist where needed (agents page: 15s interval, dashboard: 30s).

---

## Model Sync

`/api/agents/sync-models` reads `~/.openclaw/openclaw.json` to get the configured model and updates agent records in the DB. Called automatically when the gateway connects. This keeps the agent card model labels accurate.

---

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Set environment (optional — defaults work for local)
cp .env.example .env.local  # if example exists, or create manually

# 3. Run dev server
npm run dev
# → http://localhost:3200

# 4. Or build + serve production
npm run build
npm run start
# → http://0.0.0.0:3200

# 5. Expose via Tailscale
tailscale serve --bg https+insecure://localhost:3200
```

The `data/` directory and SQLite DB are created automatically on first start.

---

## Key Patterns & Notes

- **`better-sqlite3` is synchronous** — all DB calls are blocking (no async/await). This is fine for a single-user dashboard with low concurrency.
- **Singleton pattern** used for both DB (`getDb()`) and gateway (`getGatewayClient()`). First call initializes; subsequent calls return the same instance.
- **`export const runtime = "nodejs"`** is required on API routes that use `better-sqlite3` — without it, Next.js may try to run them in the Edge runtime where native modules don't work.
- **`export const dynamic = "force-dynamic"`** is set on some routes to prevent static caching.
- **`serverExternalPackages: ["better-sqlite3"]`** in `next.config.ts` prevents Next.js from bundling the native module.
- **`lib/data.ts`** contains static fallback data from the original MVP. It's no longer the primary data source (SQLite is) but is still imported in some legacy components.
