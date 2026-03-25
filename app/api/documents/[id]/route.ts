import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const allowed = ["title", "content", "project_id"];
  const keys = Object.keys(body).filter((k) => allowed.includes(k));
  if (keys.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  db.prepare(
    `UPDATE documents SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = unixepoch() WHERE id = ?`
  ).run(...keys.map((k) => (body as Record<string, unknown>)[k]), id);

  return NextResponse.json(db.prepare("SELECT * FROM documents WHERE id = ?").get(id));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM documents WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
