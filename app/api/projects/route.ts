import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.*, 
      COUNT(g.id) as goal_count,
      COUNT(CASE WHEN g.status = 'done' THEN 1 END) as goals_done,
      COALESCE(AVG(g.progress), 0) as avg_progress
    FROM projects p
    LEFT JOIN goals g ON g.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = body.id || generateId();

  db.prepare(`
    INSERT INTO projects (id, name, description, status, target_date, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.name, body.description || null, body.status || "active", body.target_date || null, body.color || "#6366f1");

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return NextResponse.json(project, { status: 201 });
}
