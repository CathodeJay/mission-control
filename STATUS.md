# Mission Control — Status

**Version:** 0.5.0  
**Built by:** Mercury 🪐  
**Status:** ✅ Native WebSocket chat UI — builds & runs  
**Last updated:** 2026-03-20

---

## What Was Built

### Stack
- Next.js 16.2 (App Router, TypeScript)
- Tailwind CSS v4
- Static data layer (`lib/data.ts`) — flat TypeScript objects

### Pages
- `/` — Full dashboard (protected, redirects to `/login` if unauthenticated)
- `/login` — Dark-themed auth gate, command-center aesthetic
- `/chat` — Native WebSocket chat UI (protected; requires Tailscale)

### Components
| Component | Description |
|---|---|
| `ActiveProjects` | Cards for all ventures with status badge, revenue, next milestone, tags |
| `AgentStatus` | Live agent cards with animated online indicator and current task |
| `RevenueOverview` | KPI total, MoM%, bar chart history, per-venture breakdown |
| `NextMilestones` | Sorted milestone list with countdown, priority dots, overdue detection |
| `StatusBadge` | Reusable badges for project/agent status |
| `LogoutButton` | Client component in header — POSTs to `/api/auth/logout`, redirects to `/login` |

### UI
- Dark command-center aesthetic (`#0a0c10` background, slate palette)
- Subtle grid background texture
- KPI strip at top (revenue, active ventures, agents online, MoM growth)
- Responsive: 1-col mobile → 2-col desktop (3-col with sidebar)
- Sticky header with live agent count

### Data (v0.3.0 — Real Ventures)
- **4 ventures:** RIVLS (POD, in dev), Ambient YouTube (active), AI Consulting (concept), Investing (active)
- **2 agents:** Jupiter 🪐 (COO), Mercury 🪐 (Full Stack Dev)
- **4 milestones** mapped to actual next actions
- Revenue history reflects pre-revenue status (Q1 2026 — no ventures monetized yet)
- New project statuses added: `in-development`, `concept`
- `StatusBadge` updated with human-readable labels + orange/slate colors for new statuses
- `ActiveProjects` updated to show `revenueLabel` override (e.g. "Ongoing" for Investing)

---

## What's Next (Phase 2)

- [ ] **Live data** — Replace static `lib/data.ts` with API routes + SQLite (`better-sqlite3`)
- [ ] **CRUD** — Add/edit projects and milestones via dashboard UI
- [ ] **Agent activity log** — Real task history from agent sessions
- [ ] **Revenue tracking** — Connect actual income sources (Shopify webhook, manual entry)
- [ ] **Notifications** — Flag overdue milestones, revenue drops
- [x] **Auth** — Cookie-based session gate (jerome / @lphons3), signed HMAC token, proxy middleware
- [x] **Chat** — `/chat` route with native WebSocket chat UI (streaming, history, dark-themed bubbles, auto-reconnect)
- [ ] **Deploy** — Vercel or self-hosted on VPS

---

## Running Locally

```bash
npm run dev    # http://localhost:3000
npm run build  # production build
npm start      # serve production build
```
