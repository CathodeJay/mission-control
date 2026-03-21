# Mission Control — Status

**Version:** 1.0.0  
**Built by:** Mercury 🪐  
**Status:** ✅ Full rebuild — all features shipped  
**Last updated:** 2026-03-21

---

## What Was Built (v1.0 — Full Rebuild)

### Stack
- Next.js 16.2 (App Router, TypeScript)
- Tailwind CSS v4, dark theme (#0f1219)
- SQLite via `better-sqlite3` (`data/mission-control.db`)
- Gateway WebSocket → SSE bridge for real-time events

### Pages
| Route | Description |
|---|---|
| `/` | Metrics dashboard (KPIs, kanban chart, agent status, approval alert) |
| `/agents` | Agent roster + office scene visualization |
| `/kanban` | Drag-and-drop kanban with approval swimlane |
| `/projects` | CRUD projects + nested goals with progress bars |
| `/activity` | Filterable chronological event log |

### Features
- ✅ **Agent Roster** — DiceBear-style initials avatars, status rings (idle/thinking/executing/awaiting/error), office scene
- ✅ **Office Visualization** — Active agents at workstations, idle agents in rest area
- ✅ **Gateway WebSocket** — Connects to OpenClaw, auto-creates approval cards from `exec.approval.requested`
- ✅ **Kanban** — 4 columns + Awaiting Approval swimlane, DnD via @dnd-kit, approve/deny resolves Gateway
- ✅ **Projects & Goals** — CRUD, progress bars, goal status tracking
- ✅ **Metrics Dashboard** — KPI cards, recharts bar chart, auto-refresh 30s
- ✅ **Activity Feed** — SSE live updates, filterable, 30-day retention
- ✅ **SQLite** — All data persisted locally
- ✅ **Docker** — `docker-compose.yml` included
- ✅ **README** — Tailscale expose command included

### Running
```bash
npm run dev    # http://localhost:3100
npm run build  # production build
npm run start  # serve production build on port 3100
```

### Tailscale
```bash
tailscale serve --bg https+insecure://localhost:3100
```
