import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const db = getDb();
  const cards = db.prepare(`
    SELECT c.*, a.name as agent_name, a.color as agent_color, p.name as project_name
    FROM kanban_cards c
    LEFT JOIN agents a ON a.id = c.assigned_agent_id
    LEFT JOIN projects p ON p.id = c.project_id
    ORDER BY c.column, c.position, c.created_at DESC
  `).all();
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = generateId();

  const maxPos = db.prepare(
    "SELECT COALESCE(MAX(position), -1) as m FROM kanban_cards WHERE column = ?"
  ).get(body.column || "backlog") as { m: number };

  db.prepare(`
    INSERT INTO kanban_cards (id, title, description, column, priority, assigned_agent_id, project_id, goal_id, approval_request_id, approval_command, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.title, body.description || null,
    body.column || "backlog", body.priority || "medium",
    body.assigned_agent_id || null, body.project_id || null, body.goal_id || null,
    body.approval_request_id || null, body.approval_command || null,
    maxPos.m + 1
  );

  // Log activity
  if (body.column === "awaiting_approval") {
    db.prepare(`
      INSERT INTO activity_feed (id, type, agent_id, agent_name, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(generateId(), "approval_requested", body.assigned_agent_id || null, body.agent_name || null,
      `Approval requested: ${body.title}`, JSON.stringify({ card_id: id }));
  }

  return NextResponse.json(db.prepare(`
    SELECT c.*, a.name as agent_name, a.color as agent_color, p.name as project_name
    FROM kanban_cards c
    LEFT JOIN agents a ON a.id = c.assigned_agent_id
    LEFT JOIN projects p ON p.id = c.project_id
    WHERE c.id = ?
  `).get(id), { status: 201 });
}
