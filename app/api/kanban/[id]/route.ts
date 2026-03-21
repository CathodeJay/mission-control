import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getGatewayClient } from "@/lib/gateway";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  const allowed = ["title", "description", "column", "priority", "assigned_agent_id", "project_id", "goal_id", "position", "approval_note"];
  const keys = Object.keys(body).filter((k) => allowed.includes(k));
  if (keys.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  db.prepare(`UPDATE kanban_cards SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = unixepoch() WHERE id = ?`)
    .run(...keys.map((k) => body[k]), id);

  // Handle approval resolution
  if (body.approved !== undefined) {
    const card = db.prepare("SELECT * FROM kanban_cards WHERE id = ?").get(id) as { approval_request_id: string; title: string } | undefined;
    if (card?.approval_request_id) {
      const gateway = getGatewayClient();
      gateway.resolve(card.approval_request_id, body.approved, body.approval_note);

      const newCol = body.approved ? "in_progress" : "backlog";
      db.prepare("UPDATE kanban_cards SET column = ?, updated_at = unixepoch() WHERE id = ?").run(newCol, id);

      // Log activity
      db.prepare(`
        INSERT INTO activity_feed (id, type, description, metadata)
        VALUES (?, ?, ?, ?)
      `).run(generateId(), body.approved ? "approval_approved" : "approval_denied",
        `${body.approved ? "Approved" : "Denied"}: ${card.title}`,
        JSON.stringify({ card_id: id, note: body.approval_note }));
    }
  }

  return NextResponse.json(db.prepare(`
    SELECT c.*, a.name as agent_name, a.color as agent_color, p.name as project_name
    FROM kanban_cards c
    LEFT JOIN agents a ON a.id = c.assigned_agent_id
    LEFT JOIN projects p ON p.id = c.project_id
    WHERE c.id = ?
  `).get(id));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM kanban_cards WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
