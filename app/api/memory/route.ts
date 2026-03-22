import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const agent = searchParams.get("agent") ?? "";
  const importance = searchParams.get("importance") ?? "";

  let sql = `
    SELECT m.*, a.name as agent_name, a.color as agent_color
    FROM memories m
    LEFT JOIN agents a ON a.id = m.agent_id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (q) {
    sql += ` AND (m.title LIKE ? OR m.content LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`);
  }
  if (agent) {
    sql += ` AND m.agent_id = ?`;
    params.push(agent);
  }
  if (importance) {
    sql += ` AND m.importance = ?`;
    params.push(importance);
  }
  if (tag) {
    sql += ` AND m.tags LIKE ?`;
    params.push(`%${tag}%`);
  }

  sql += ` ORDER BY m.created_at DESC`;

  const rows = db.prepare(sql).all(...params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { title, content, agent_id, tags = [], importance = "normal" } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO memories (id, title, content, agent_id, tags, importance)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title, content, agent_id ?? null, JSON.stringify(tags), importance);

  const row = db.prepare(`
    SELECT m.*, a.name as agent_name, a.color as agent_color
    FROM memories m
    LEFT JOIN agents a ON a.id = m.agent_id
    WHERE m.id = ?
  `).get(id);

  return NextResponse.json(row, { status: 201 });
}
