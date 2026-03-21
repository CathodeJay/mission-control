"use client";

import { useEffect, useState, useCallback } from "react";
import { AgentStatusBadge } from "./StatusBadge";
import { agents as staticAgents } from "@/lib/data";
import type { Agent } from "@/lib/data";

interface LiveAgent extends Omit<Agent, "lastActive"> {
  lastActive: string; // ISO string from Upstash
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (isNaN(then)) return iso; // pass-through for legacy "now" strings
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// Static fallback shaped as LiveAgent
const fallbackAgents: LiveAgent[] = staticAgents.map((a) => ({
  ...a,
  lastActive: new Date().toISOString(),
}));

export default function AgentStatus() {
  const [agents, setAgents] = useState<LiveAgent[]>(fallbackAgents);
  const [tick, setTick] = useState(0); // used to re-render relative times
  const [error, setError] = useState(false);

  const fetchAgents = useCallback(async () => {
    const upstashUrl = process.env.NEXT_PUBLIC_UPSTASH_REST_URL;
    const upstashToken = process.env.NEXT_PUBLIC_UPSTASH_REST_TOKEN;

    if (!upstashUrl || !upstashToken) {
      setError(true);
      return;
    }

    try {
      const res = await fetch(`${upstashUrl}/get/agent-activity`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
      const data = await res.json();
      if (!data.result) throw new Error("No result in Upstash response");
      const parsed =
        typeof data.result === "string"
          ? JSON.parse(data.result)
          : data.result;
      setAgents(parsed.agents);
      setError(false);
    } catch {
      setError(true);
      // keep current agents (or fallback on first load)
    }
  }, []);

  // Initial fetch + 60s polling
  useEffect(() => {
    fetchAgents();
    const pollId = setInterval(fetchAgents, 60_000);
    return () => clearInterval(pollId);
  }, [fetchAgents]);

  // Tick every 30s to refresh relative timestamps
  useEffect(() => {
    const tickId = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(tickId);
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Agent Status
        </h2>
        {error && (
          <span className="text-xs text-yellow-600">using cached data</span>
        )}
      </div>
      <div className="grid gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {agent.name}
                </div>
                <div className="text-xs text-slate-500">{agent.role}</div>
              </div>
              <AgentStatusBadge status={agent.status} />
            </div>
            <div className="text-xs text-slate-500 bg-slate-800/40 rounded-lg px-3 py-2">
              <span className="text-slate-600">Task: </span>
              {agent.currentTask}
            </div>
            {/* tick dependency forces re-render every 30s */}
            <div className="mt-2 text-xs text-slate-700" data-tick={tick}>
              Last active: {relativeTime(agent.lastActive)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
