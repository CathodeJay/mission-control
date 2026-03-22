import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const db = getDb();
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
  const date = req.nextUrl.searchParams.get("date");

  if (date) {
    const entry = db.prepare("SELECT * FROM journal_entries WHERE date = ?").get(date);
    return NextResponse.json(entry || null);
  }

  const entries = db
    .prepare("SELECT * FROM journal_entries ORDER BY date DESC LIMIT ?")
    .all(limit);

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  if (!body.date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const id = generateId();
  const now = Math.floor(Date.now() / 1000);

  // Upsert: if entry for this date already exists, update it
  const existing = db.prepare("SELECT id FROM journal_entries WHERE date = ?").get(body.date) as { id: string } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE journal_entries
      SET accomplishments = ?, lessons_learned = ?, open_items = ?, agent_notes = ?, updated_at = ?
      WHERE date = ?
    `).run(
      body.accomplishments || "",
      body.lessons_learned || "",
      body.open_items || "",
      body.agent_notes || "",
      now,
      body.date
    );
    const updated = db.prepare("SELECT * FROM journal_entries WHERE date = ?").get(body.date);
    return NextResponse.json(updated, { status: 200 });
  }

  db.prepare(`
    INSERT INTO journal_entries (id, date, accomplishments, lessons_learned, open_items, agent_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    body.date,
    body.accomplishments || "",
    body.lessons_learned || "",
    body.open_items || "",
    body.agent_notes || "",
    now,
    now
  );

  const entry = db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(id);
  return NextResponse.json(entry, { status: 201 });
}
