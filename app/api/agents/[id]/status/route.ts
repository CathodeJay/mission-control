import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { statusBus } from "@/lib/statusBus";

// Internal endpoint for agents to self-report status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const { status, current_task } = body;

  const valid = ["idle", "thinking", "executing", "awaiting_approval", "error"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  db.prepare(
    "UPDATE agents SET status = ?, current_task = ?, last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ?"
  ).run(status, current_task || null, id);

  // If agent goes idle, move their in_progress cards to done
  if (status === "idle") {
    db.prepare(`
      UPDATE kanban_cards SET column = 'done', updated_at = unixepoch()
      WHERE assigned_agent_id = ? AND column = 'in_progress'
      AND approval_request_id IS NULL
    `).run(id);
  }

  // If agent becomes active and has a task, update their in_progress card description
  if (status !== "idle" && current_task) {
    const card = db.prepare(
      "SELECT id FROM kanban_cards WHERE assigned_agent_id = ? AND column = 'in_progress' ORDER BY updated_at DESC LIMIT 1"
    ).get(id) as { id: string } | undefined;
    if (card) {
      db.prepare("UPDATE kanban_cards SET description = ?, updated_at = unixepoch() WHERE id = ?")
        .run(current_task, card.id);
    }
  }

  // Broadcast to all SSE subscribers immediately
  statusBus.emit("agent.status", { agentId: id, status, task: current_task || null });

  return NextResponse.json({ ok: true, id, status });
}
