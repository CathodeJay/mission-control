# Mission Control

Jerome's empire ops dashboard — self-hosted, Tailscale-exposed, no Vercel required.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** + custom dark theme
- **SQLite** via `better-sqlite3` — local file at `data/mission-control.db`
- **WebSocket** → OpenClaw Gateway for live agent status + approvals
- **@dnd-kit** for drag-and-drop Kanban
- **recharts** for metrics charts

## Quick Start

```bash
# Install
npm install

# Dev (port 3100)
npm run dev

# Production
npm run build
npm run start
```

## Features

### 🏢 Agent Roster & Office
- Visual office scene: agents appear at workstations when active, rest area when idle
- Real-time status updates from OpenClaw Gateway
- Status rings: green=active, gray=idle, amber=awaiting approval, red=error
- SQLite-backed agent profiles with customizable colors

### 📋 Kanban Board
- Columns: Backlog → To Do → In Progress → Done
- **Awaiting Approval** swimlane (amber glow) at top
- Gateway events auto-create approval cards
- Approve/Deny from the card → resolves back to Gateway
- Drag-and-drop cards between columns

### 📁 Projects & Goals
- CRUD for Projects and nested Goals
- Progress bars, completion %, goal status tracking
- Everything in SQLite

### 📊 Metrics Dashboard (Home)
- KPI cards: active agents, completed this week, active projects, goals in progress
- Kanban breakdown bar chart (recharts)
- Real-time agent status list
- Auto-refreshes every 30s, live-updates from Gateway SSE

### 📰 Activity Feed
- Chronological log of all agent events and card actions
- Filter by agent and event type
- Auto-pruned at 30 days, stored in SQLite

## Environment

```env
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=<your-token>
MISSION_CONTROL_PORT=3100
```

## Tailscale Exposure

```bash
# Expose over Tailscale HTTPS
tailscale serve --bg https+insecure://localhost:3100

# Access from anywhere on your tailnet
# e.g. https://your-machine.tail12345.ts.net
```

## Docker

```bash
docker compose up -d
```

App runs on port 3100. SQLite data persisted in `./data/` volume.

## Gateway WebSocket Protocol

Mission Control connects to the Gateway on startup and listens for:

| Event | Action |
|---|---|
| `exec.approval.requested` | Creates card in Awaiting Approval lane |
| `agent.status` | Updates agent status in real-time |
| `session.status` | Maps session to agent, updates status |

Approval resolution sends `exec.approval.resolve` back to Gateway.

## Ports

| Service | Port |
|---|---|
| Next.js dev/prod | 3100 |
| OpenClaw Gateway | 18789 (WS) |

---

Built by Mercury 🪐 for Jerome's empire.
