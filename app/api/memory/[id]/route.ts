import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const { title, content, agent_id, tags, importance } = body;

  const existing = db.prepare("SELECT * FROM memories WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare(`
    UPDATE memories SET
      title = ?,
      content = ?,
      agent_id = ?,
      tags = ?,
      importance = ?,
      updated_at = unixepoch()
    WHERE id = ?
  `).run(
    title ?? existing.title,
    content ?? existing.content,
    agent_id !== undefined ? (agent_id ?? null) : existing.agent_id,
    tags !== undefined ? JSON.stringify(tags) : existing.tags,
    importance ?? existing.importance,
    id
  );

  const row = db.prepare(`
    SELECT m.*, a.name as agent_name, a.color as agent_color
    FROM memories m
    LEFT JOIN agents a ON a.id = m.agent_id
    WHERE m.id = ?
  `).get(id);

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;

  const existing = db.prepare("SELECT id FROM memories WHERE id = ?").get(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM memories WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
