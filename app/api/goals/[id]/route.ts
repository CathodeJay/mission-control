import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const allowed = ["name", "description", "progress", "status"];
  const keys = Object.keys(body).filter((k) => allowed.includes(k));
  if (keys.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  db.prepare(`UPDATE goals SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = unixepoch() WHERE id = ?`)
    .run(...keys.map((k) => body[k]), id);

  return NextResponse.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(id));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM goals WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
