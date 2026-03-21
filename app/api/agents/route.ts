import { NextResponse } from "next/server";
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

const fallback = (): AgentActivityData => ({
  agents: staticAgents.map((a) => ({
    ...a,
    lastActive: new Date().toISOString(),
  })),
  updatedAt: new Date().toISOString(),
});

export async function GET() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return NextResponse.json(fallback());
  }

  try {
    const res = await fetch(`${redisUrl}/get/agent-activity`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Redis GET failed: ${res.status}`);

    const json = await res.json();
    if (!json.result) return NextResponse.json(fallback());

    const data: AgentActivityData =
      typeof json.result === "string"
        ? JSON.parse(json.result)
        : json.result;

    return NextResponse.json(data);
  } catch (e) {
    console.error("Redis fetch failed:", e);
    return NextResponse.json(fallback());
  }
}
