import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const db = getDb();
  const projectId = req.nextUrl.searchParams.get("project_id");
  const goals = projectId
    ? db.prepare("SELECT * FROM goals WHERE project_id = ? ORDER BY created_at").all(projectId)
    : db.prepare("SELECT * FROM goals ORDER BY created_at DESC").all();
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = generateId();

  db.prepare(`
    INSERT INTO goals (id, project_id, name, description, progress, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.project_id, body.name, body.description || null, body.progress || 0, body.status || "not_started");

  return NextResponse.json(db.prepare("SELECT * FROM goals WHERE id = ?").get(id), { status: 201 });
}
