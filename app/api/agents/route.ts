import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId, AGENT_COLORS } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const agents = db.prepare("SELECT * FROM agents ORDER BY name").all();
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = body.id || generateId();
  const color = body.color || AGENT_COLORS[Math.floor(Math.random() * AGENT_COLORS.length)];

  db.prepare(`
    INSERT OR REPLACE INTO agents (id, name, role, bio, color, avatar_seed, avatar_style)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.name, body.role, body.bio || null, color, body.avatar_seed || id, body.avatar_style || "bottts");

  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  return NextResponse.json(agent, { status: 201 });
}
