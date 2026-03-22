import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const entry = db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const now = Math.floor(Date.now() / 1000);

  const existing = db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.prepare(`
    UPDATE journal_entries
    SET accomplishments = ?, lessons_learned = ?, open_items = ?, agent_notes = ?, updated_at = ?
    WHERE id = ?
  `).run(
    body.accomplishments ?? (existing as Record<string, unknown>).accomplishments,
    body.lessons_learned ?? (existing as Record<string, unknown>).lessons_learned,
    body.open_items ?? (existing as Record<string, unknown>).open_items,
    body.agent_notes ?? (existing as Record<string, unknown>).agent_notes,
    now,
    id
  );

  const updated = db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(id);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const existing = db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.prepare("DELETE FROM journal_entries WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
