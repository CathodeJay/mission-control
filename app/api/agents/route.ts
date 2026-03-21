import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { agents as staticAgents } from "@/lib/data";

export const dynamic = "force-dynamic";

export interface AgentActivityData {
  agents: {
    id: string;
    name: string;
    role: string;
    status: "online" | "idle" | "offline";
    currentTask: string;
    lastActive: string;
  }[];
  updatedAt: string;
}

export function GET() {
  try {
    const filePath = join(process.cwd(), "data", "agent-activity.json");
    const raw = readFileSync(filePath, "utf-8");
    const data: AgentActivityData = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    // Fallback to static data if JSON file is unavailable
    const fallback: AgentActivityData = {
      agents: staticAgents.map((a) => ({
        ...a,
        lastActive: new Date().toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(fallback);
  }
}
