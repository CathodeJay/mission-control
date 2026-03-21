import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
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

export async function GET() {
  try {
    const data = await redis.get<AgentActivityData>("agent-activity");
    if (data) {
      return NextResponse.json(data);
    }
  } catch (e) {
    console.error("Redis read failed, falling back to static data", e);
  }

  // Fallback to static data
  const fallback: AgentActivityData = {
    agents: staticAgents.map((a) => ({
      ...a,
      lastActive: new Date().toISOString(),
    })),
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(fallback);
}
