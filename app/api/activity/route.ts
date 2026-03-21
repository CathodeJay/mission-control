import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const db = getDb();
  const agentId = req.nextUrl.searchParams.get("agent_id");
  const type = req.nextUrl.searchParams.get("type");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

  let query = "SELECT * FROM activity_feed WHERE 1=1";
  const args: (string | number)[] = [];

  if (agentId) {
    query += " AND agent_id = ?";
    args.push(agentId);
  }
  if (type) {
    query += " AND type = ?";
    args.push(type);
  }

  // Prune old entries > 30 days
  db.prepare("DELETE FROM activity_feed WHERE created_at < unixepoch() - 2592000").run();

  query += " ORDER BY created_at DESC LIMIT ?";
  args.push(limit);

  return NextResponse.json(db.prepare(query).all(...args));
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = generateId();

  db.prepare(`
    INSERT INTO activity_feed (id, type, agent_id, agent_name, description, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.type, body.agent_id || null, body.agent_name || null, body.description, JSON.stringify(body.metadata || {}));

  return NextResponse.json(db.prepare("SELECT * FROM activity_feed WHERE id = ?").get(id), { status: 201 });
}
