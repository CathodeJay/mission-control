import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const db = getDb();
  const projectId = req.nextUrl.searchParams.get("project_id");

  const docs = projectId
    ? db.prepare("SELECT * FROM documents WHERE project_id = ? ORDER BY updated_at DESC").all(projectId)
    : db.prepare("SELECT * FROM documents ORDER BY updated_at DESC").all();

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = generateId();

  db.prepare(`
    INSERT INTO documents (id, title, content, project_id)
    VALUES (?, ?, ?, ?)
  `).run(id, body.title, body.content || null, body.project_id || null);

  return NextResponse.json(db.prepare("SELECT * FROM documents WHERE id = ?").get(id), { status: 201 });
}
