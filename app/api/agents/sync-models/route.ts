import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Reads the actual model from OpenClaw config and syncs to DB
export async function POST() {
  const db = getDb();

  try {
    const configPath = join(homedir(), ".openclaw", "openclaw.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const primaryModel = config?.agents?.defaults?.model?.primary || "unknown";

    // All agents currently use the same primary model (Jupiter = main, others = subagents via openrouter)
    const modelMap: Record<string, string> = {
      jupiter: primaryModel,
      mercury: "openrouter/auto",
      saturn: "openrouter/auto",
    };

    for (const [agentId, model] of Object.entries(modelMap)) {
      db.prepare("UPDATE agents SET model = ? WHERE id = ?").run(model, agentId);
    }

    return NextResponse.json({ ok: true, models: modelMap });
  } catch (e) {
    console.error("Failed to sync models:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
