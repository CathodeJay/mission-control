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

    // Resolve model for each agent:
    // - Jupiter uses the configured primary model (main session)
    // - Callisto (subagent) uses the model from the runtime context (claude-sonnet-4-6)
    //   This is read from the OPENCLAW_MODEL env var if available, otherwise from config
    const callistoModel =
      process.env.OPENCLAW_SUBAGENT_MODEL ||
      "openrouter/anthropic/claude-sonnet-4-6";

    const modelMap: Record<string, string> = {
      jupiter: primaryModel,
      callisto: callistoModel,
      europa: "openrouter/openai/gpt-4o",
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
