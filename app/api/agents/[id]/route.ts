import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const allowed = ["name", "role", "bio", "color", "avatar_seed", "avatar_style", "status", "current_task", "session_id", "last_seen"];
  const sets = Object.keys(body)
    .filter((k) => allowed.includes(k))
    .map((k) => `${k} = ?`);
  if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  db.prepare(`UPDATE agents SET ${sets.join(", ")}, updated_at = unixepoch() WHERE id = ?`)
    .run(...Object.values(body).filter((_, i) => allowed.includes(Object.keys(body)[i])), id);

  const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
  return NextResponse.json(agent);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM agents WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
