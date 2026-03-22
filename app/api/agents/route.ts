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
  const redisUrl = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
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

    if (!res.ok) {
        console.error(`Upstash GET failed: ${res.status} ${res.statusText}`);
        throw new Error(`Upstash GET failed: ${res.status}`);
    }

    const raw = await res.text(); // Get raw text first
    console.log("Raw Redis response:", raw); // Log raw response

    if (!raw || raw.trim() === "" || raw.trim() === "null" || raw.trim() === "undefined") {
      console.warn("Redis returned null or empty for agent-activity");
      return NextResponse.json(fallback());
    }
    
    let data;
    try {
      // Upstash GET returns a JSON object like {"result": "..."}
      // We need to parse the outer JSON
      data = JSON.parse(raw);
      console.log("Parsed outermost JSON:", data); // Log outermost JSON structure
    } catch (parseError) {
      console.error("Failed to parse outermost JSON:", parseError);
      return NextResponse.json(fallback());
    }

    if (!data.result) {
      console.warn("No result property in Upstash response, falling back.");
      return NextResponse.json(fallback());
    }

    let parsed;
    try {
      // Handle cases where Redis stores JSON strings (often the case with complex objects)
      parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
      console.log("Parsed inner result:", parsed); // Log parsed inner result
    } catch (parseError) {
      console.error("Failed to parse inner JSON result:", parseError);
      return NextResponse.json(fallback());
    }
    
    // Ensure the final response has an 'agents' array, otherwise use fallback
    if (typeof parsed !== 'object' || !Array.isArray(parsed.agents)) {
        console.warn("Parsed data does not have an 'agents' array, falling back.");
        return NextResponse.json(fallback());
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Redis fetch failed, falling back to static data:", e);
    return NextResponse.json(fallback());
  }
}
