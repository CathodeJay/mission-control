import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { statusBus } from "@/lib/statusBus";

/**
 * POST /api/agents/bind-session
 *
 * Called by Jupiter (the parent agent) immediately after spawning a subagent.
 * Stores the subagent's session key in the DB so the health-event monitor can
 * reliably map session activity → agent status without guessing.
 *
 * Body: { agentId: string, sessionKey: string, task?: string }
 *
 * Example:
 *   curl -X POST http://localhost:3200/api/agents/bind-session \
 *     -H 'Content-Type: application/json' \
 *     -d '{"agentId":"callisto","sessionKey":"agent:main:subagent:abc123","task":"Building Kanban page"}'
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { agentId, sessionKey, task } = body as { agentId?: string; sessionKey?: string; task?: string };

  if (!agentId || !sessionKey) {
    return NextResponse.json({ error: "agentId and sessionKey are required" }, { status: 400 });
  }

  // Clear any stale bindings for this session key or agent
  db.prepare("UPDATE agents SET session_id = NULL WHERE session_id = ?").run(sessionKey);

  // Bind session key → agent and mark working
  db.prepare(`
    UPDATE agents
    SET session_id = ?, status = 'working', current_task = ?, last_seen = unixepoch(), updated_at = unixepoch()
    WHERE id = ?
  `).run(sessionKey, task || null, agentId);

  // Broadcast immediately so the UI updates without waiting for next health tick
  statusBus.emit("agent.status", { agentId, status: "working", task: task || null });

  const agent = db.prepare("SELECT id, status, current_task, session_id FROM agents WHERE id = ?").get(agentId);
  if (!agent) {
    return NextResponse.json({ error: `Agent '${agentId}' not found` }, { status: 404 });
  }

  return NextResponse.json({ ok: true, agent });
}
