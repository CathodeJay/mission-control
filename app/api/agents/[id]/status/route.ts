import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Internal endpoint for agents to self-report status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const { status, current_task } = body;

  const valid = ["idle", "thinking", "executing", "awaiting_approval", "error"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  db.prepare(
    "UPDATE agents SET status = ?, current_task = ?, last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ?"
  ).run(status, current_task || null, id);

  return NextResponse.json({ ok: true, id, status });
}
