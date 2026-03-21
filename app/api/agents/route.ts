import { NextResponse } from "next/server";
import { agents as staticAgents } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const redisUrl = process.env.NEXT_PUBLIC_UPSTASH_REST_URL;
  const redisToken = process.env.NEXT_PUBLIC_UPSTASH_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error("Upstash Redis URL or Token not configured");
    return NextResponse.json(fallback());
  }

  try {
    const res = await fetch(`${redisUrl}/get/agent-activity`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);

    const raw = await res.text(); // Get raw text first
    console.log("Raw Redis response:", raw); // Log raw response

    if (!raw || raw === "null" || raw === "undefined") {
      console.warn("Redis returned null or empty for agent-activity");
      return NextResponse.json(fallback());
    }
    
    // Upstash GET returns a JSON object like {"result": "..."}
    // We need to parse the outer JSON, then potentially parse the inner string result
    const data = JSON.parse(raw);
    if (!data.result) throw new Error("No result property in Upstash response");

    const parsed =
      typeof data.result === "string"
        ? JSON.parse(data.result)
        : data.result;

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Redis fetch failed, falling back to static data:", e);
    return NextResponse.json(fallback());
  }
}
