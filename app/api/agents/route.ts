import { NextResponse } from "next/server";
import agentActivity from "@/data/agent-activity.json";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(agentActivity);
}
