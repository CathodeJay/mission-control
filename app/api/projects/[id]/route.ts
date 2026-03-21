import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const goals = db.prepare("SELECT * FROM goals WHERE project_id = ? ORDER BY created_at").all(id);
  return NextResponse.json({ ...project as object, goals });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const allowed = ["name", "description", "status", "target_date", "color"];
  const keys = Object.keys(body).filter((k) => allowed.includes(k));
  if (keys.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  db.prepare(`UPDATE projects SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = unixepoch() WHERE id = ?`)
    .run(...keys.map((k) => body[k]), id);

  return NextResponse.json(db.prepare("SELECT * FROM projects WHERE id = ?").get(id));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
