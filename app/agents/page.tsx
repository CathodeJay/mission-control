// AGENT STATUS TRACKING — MANDATORY FOR ALL AGENTS
// Every agent MUST call agent-status.sh at the start and end of every task:
//   START: agent-status.sh <agent_id> <status> "<description>"
//   END:   agent-status.sh <agent_id> idle
// Example: agent-status.sh mercury executing "Building new feature"
//          agent-status.sh mercury idle
// Agent IDs: jupiter, callisto, europa
// Statuses: thinking, working, idle, awaiting_approval, error

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/AgentAvatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgentStatus } from "@/lib/utils";
import { AGENT_COLORS } from "@/lib/utils";
import { Monitor, Coffee, Edit2, ChevronDown, Crown, Code2, GitBranch, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Agent = {
  id: string; name: string; role: string; bio: string | null;
  status: AgentStatus; color: string; avatar_seed: string;
  current_task: string | null; model: string | null; last_seen: number | null;
  updated_at: number | null;
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Thinking...",
  working: "Working...",
  awaiting_approval: "Awaiting Approval",
  error: "Error",
};

// Hoisted here so HierarchyNode can use it
function StatusBadge({ status }: { status: AgentStatus }) {
  const map: Record<AgentStatus, { variant: "default" | "success" | "warning" | "danger" | "info" | "outline"; label: string }> = {
    idle: { variant: "default", label: "Idle" },
    thinking: { variant: "info", label: "Thinking" },
    working: { variant: "success", label: "Working" },
    awaiting_approval: { variant: "warning", label: "Awaiting Approval" },
    error: { variant: "danger", label: "Error" },
  };
  const { variant, label } = map[status] || { variant: "default", label: status };
  return (
    <div className="flex items-center gap-1.5">
      {status !== "idle" && (
        <span
          className={cn(
            "inline-block w-2 h-2 rounded-full animate-pulse",
            status === "thinking" && "bg-blue-400",
            status === "working" && "bg-emerald-400",
            status === "awaiting_approval" && "bg-amber-400",
            status === "error" && "bg-red-400",
          )}
        />
      )}
      <Badge variant={variant}>{label}</Badge>
    </div>
  );
}

/** Format unix timestamp (seconds) as relative time, e.g. "2m ago" */
function relativeTime(unixSecs: number | null): string | null {
  if (!unixSecs) return null;
  const diffMs = Date.now() - unixSecs * 1000;
  if (diffMs < 0) return "just now";
  if (diffMs < 60_000) return `${Math.floor(diffMs / 1000)}s ago`;
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

// ── Team Hierarchy ────────────────────────────────────────────────────────────

const KNOWN_HIERARCHY: Record<string, { rank: number; icon: React.ElementType; reportsTo: string | null; badge: string }> = {
  jupiter: { rank: 0, icon: Crown, reportsTo: null, badge: "COO" },
  callisto: { rank: 1, icon: Code2, reportsTo: "jupiter", badge: "Dev" },
  europa: { rank: 2, icon: Search, reportsTo: "jupiter", badge: "Research" },
};

function getHierarchyInfo(agentId: string) {
  const lc = agentId.toLowerCase();
  return KNOWN_HIERARCHY[lc] || null;
}

function HierarchyNode({ agent, agents, depth = 0 }: { agent: Agent; agents: Agent[]; depth?: number }) {
  const hInfo = getHierarchyInfo(agent.id);
  const Icon = hInfo?.icon || GitBranch;
  const directReports = agents.filter((a) => {
    const h = getHierarchyInfo(a.id);
    return h?.reportsTo === agent.id.toLowerCase();
  });

  const isActive = agent.status !== "idle";
  const isWorking = agent.status === "working";
  const isThinking = agent.status === "thinking";
  const hasActiveReport = directReports.some((r) => r.status !== "idle");

  // Find parent agent for the "working under X" label
  const parentAgentId = hInfo?.reportsTo;
  const parentAgent = parentAgentId ? agents.find((a) => a.id.toLowerCase() === parentAgentId) : null;

  return (
    <div className={cn("relative", depth > 0 && "ml-8 md:ml-12")}>
      {/* Connector line from parent */}
      {depth > 0 && (
        <div className="absolute -left-8 md:-left-12 top-5 w-8 md:w-12 flex items-center">
          {/* Animated connector when subagent is active */}
          {isActive ? (
            <div className="relative w-full h-5">
              {/* Base line */}
              <div
                className={cn(
                  "absolute inset-0 border-l-2 border-b-2 rounded-bl-lg w-full h-full transition-colors duration-500",
                  isWorking ? "border-emerald-500/70" : isThinking ? "border-blue-500/70" : "border-amber-500/70",
                )}
              />
              {/* Animated pulse overlay */}
              <div
                className={cn(
                  "absolute inset-0 border-l-2 border-b-2 rounded-bl-lg w-full h-full animate-pulse",
                  isWorking ? "border-emerald-400/50" : isThinking ? "border-blue-400/50" : "border-amber-400/50",
                )}
              />
            </div>
          ) : (
            <div className="border-l-2 border-b-2 border-slate-700 rounded-bl-lg w-full h-5" />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3 md:p-4 transition-all duration-300",
          depth === 0
            ? cn(
                "border-violet-500/30 bg-violet-500/5 shadow-lg shadow-violet-500/5",
                hasActiveReport && "border-violet-400/50 bg-violet-500/10 shadow-violet-500/10",
              )
            : cn(
                "border-white/10 bg-white/3",
                isWorking && "border-emerald-500/40 bg-emerald-500/5 shadow-md shadow-emerald-500/10",
                isThinking && "border-blue-500/40 bg-blue-500/5 shadow-md shadow-blue-500/10",
                agent.status === "awaiting_approval" && "border-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/10",
                agent.status === "error" && "border-red-500/40 bg-red-500/5",
              ),
        )}
      >
        {/* Role icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
            depth === 0
              ? cn("bg-violet-500/20", hasActiveReport && "bg-violet-500/30")
              : cn(
                  "bg-slate-800",
                  isWorking && "bg-emerald-500/20",
                  isThinking && "bg-blue-500/20",
                ),
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4 transition-colors duration-300",
              depth === 0
                ? cn("text-violet-400", hasActiveReport && "text-violet-300")
                : cn(
                    "text-slate-400",
                    isWorking && "text-emerald-400",
                    isThinking && "text-blue-400",
                  ),
            )}
          />
        </div>

        <AgentAvatar
          seed={agent.avatar_seed || agent.id}
          name={agent.name}
          status={agent.status}
          color={agent.color}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "font-semibold text-sm transition-colors duration-300",
              depth === 0
                ? cn("text-violet-100", hasActiveReport && "text-violet-50")
                : cn(
                    "text-slate-200",
                    isWorking && "text-emerald-100",
                    isThinking && "text-blue-100",
                  ),
            )}>
              {agent.name}
            </span>
            {hInfo && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider transition-all duration-300",
                  depth === 0
                    ? "bg-violet-500/20 text-violet-300"
                    : cn(
                        "bg-slate-700 text-slate-400",
                        isWorking && "bg-emerald-500/20 text-emerald-400",
                        isThinking && "bg-blue-500/20 text-blue-400",
                      ),
                )}
              >
                {hInfo.badge}
              </span>
            )}
            {/* "Working under X" dynamic label */}
            {depth > 0 && isActive && parentAgent && (
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full font-medium tracking-wide flex items-center gap-0.5 transition-all duration-300",
                isWorking ? "bg-emerald-900/50 text-emerald-400 border border-emerald-500/30"
                  : isThinking ? "bg-blue-900/50 text-blue-400 border border-blue-500/30"
                  : "bg-amber-900/50 text-amber-400 border border-amber-500/30",
              )}>
                <span className="inline-block w-1 h-1 rounded-full bg-current animate-pulse mr-0.5" />
                under {parentAgent.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{agent.role}</p>
          {/* Current task preview in hierarchy */}
          {depth > 0 && isActive && agent.current_task && (
            <p className={cn(
              "text-[10px] mt-0.5 truncate font-mono",
              isWorking ? "text-emerald-500/80" : isThinking ? "text-blue-500/80" : "text-amber-500/80",
            )}>
              ↳ {agent.current_task}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="shrink-0">
          <StatusBadge status={agent.status} />
        </div>
      </div>

      {/* Direct reports */}
      {directReports.length > 0 && (
        <div className="mt-2 space-y-2 relative">
          {/* Vertical connector line — animates when any child is active */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 -translate-x-8 md:-translate-x-12 w-0.5 transition-colors duration-500",
              hasActiveReport ? "bg-gradient-to-b from-violet-500/50 to-transparent" : "bg-slate-700",
            )}
          />
          {/* Animated flow dot when reports are active */}
          {hasActiveReport && (
            <div
              className="absolute left-0 -translate-x-8 md:-translate-x-12 w-0.5 overflow-hidden"
              style={{ top: 0, height: "100%" }}
            >
              <div
                className="w-full bg-violet-400 rounded-full"
                style={{
                  height: "20%",
                  animation: "slideDown 1.5s ease-in-out infinite",
                }}
              />
            </div>
          )}
          {directReports.map((report) => (
            <HierarchyNode key={report.id} agent={report} agents={agents} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamHierarchy({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) return null;

  // Find agents that have no parent (top of hierarchy or unknown hierarchy)
  const knownChildren = new Set(
    agents
      .map((a) => getHierarchyInfo(a.id)?.reportsTo)
      .filter(Boolean) as string[]
  );

  const roots = agents.filter((a) => {
    const h = getHierarchyInfo(a.id);
    if (!h) {
      // Unknown agent: treat as root if no known parent points to it
      return !knownChildren.has(a.id.toLowerCase());
    }
    return h.reportsTo === null;
  });

  // Agents not reachable from roots (orphaned unknowns that are children of known nodes)
  // will be picked up by the HierarchyNode recursive rendering

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden p-4 md:p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <GitBranch className="w-4 h-4 text-slate-500" />
        <p className="text-xs text-slate-500 uppercase tracking-wider">Command Structure</p>
        <div className="flex-1 border-t border-slate-800" />
        <span className="text-xs text-slate-600">{agents.length} agent{agents.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="space-y-2">
        {roots.map((root) => (
          <HierarchyNode key={root.id} agent={root} agents={agents} depth={0} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-4 text-[11px] text-slate-600 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Crown className="w-3 h-3 text-violet-400" />
          <span>Main session agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Code2 className="w-3 h-3 text-slate-500" />
          <span>Coding subagent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Search className="w-3 h-3 text-slate-500" />
          <span>Research subagent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ChevronDown className="w-3 h-3 text-slate-600" />
          <span>Reports to</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Actively working under parent</span>
        </div>
      </div>
    </div>
  );
}

// Simple office scene
function OfficeScene({ agents }: { agents: Agent[] }) {
  const activeAgents = agents.filter((a) => a.status !== "idle");
  const idleAgents = agents.filter((a) => a.status === "idle");

  return (
    <div className="relative rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden p-4 md:p-6 mb-6">
      {/* Grid floor effect */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Office</p>

        <div className="flex flex-wrap gap-4 md:gap-8">
          {/* Workstations — active agents */}
          {activeAgents.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                <Monitor className="w-3 h-3" />
                Workstations
              </div>
              <div className="flex gap-3 md:gap-4 flex-wrap">
                {activeAgents.map((agent) => (
                  <WorkStation key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}

          {/* Rest area — idle agents */}
          {idleAgents.length > 0 && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
                <Coffee className="w-3 h-3" />
                Rest Area
              </div>
              <div className="flex gap-3 md:gap-4 flex-wrap">
                {idleAgents.map((agent) => (
                  <RestAgent key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          )}

          {agents.length === 0 && (
            <p className="text-sm text-slate-600 italic">No agents registered.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkStation({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-col items-center gap-2 group">
      {/* Monitor */}
      <div
        className="w-16 h-12 rounded-md border-2 flex items-center justify-center relative"
        style={{ borderColor: agent.color + "60", background: agent.color + "10" }}
      >
        <div className="w-10 h-7 rounded bg-black/60 flex items-center justify-center">
          {agent.status === "thinking" && (
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-violet-400"
                  style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          )}
          {agent.status === "working" && (
            <div className="w-6 h-1 rounded-full bg-emerald-400 animate-pulse" />
          )}
          {agent.status === "awaiting_approval" && (
            <span className="text-amber-400 text-xs">?</span>
          )}
        </div>
        {/* Monitor stand */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 bg-slate-700 rounded-b" />
      </div>
      {/* Agent */}
      <AgentAvatar seed={agent.avatar_seed} name={agent.name} status={agent.status} color={agent.color} size="sm" />
      <div className="text-center max-w-[100px]">
        <p className="text-xs text-slate-300 font-medium">{agent.name}</p>
        <p className="text-xs text-slate-500">{STATUS_LABELS[agent.status]}</p>
      </div>
    </div>
  );
}

function RestAgent({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Coffee cup icon */}
      <div className="w-8 h-6 rounded border border-slate-700 bg-slate-800 flex items-center justify-center">
        <Coffee className="w-3 h-3 text-slate-500" />
      </div>
      <AgentAvatar seed={agent.avatar_seed} name={agent.name} status="idle" color={agent.color} size="sm" />
      <div className="text-center">
        <p className="text-xs text-slate-400">{agent.name}</p>
        <p className="text-xs text-slate-600">Idle</p>
      </div>
    </div>
  );
}

function AgentForm({
  initial, onSave, onClose,
}: {
  initial?: Partial<Agent>;
  onSave: (data: Partial<Agent>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    role: initial?.role || "",
    bio: initial?.bio || "",
    color: initial?.color || AGENT_COLORS[0],
    model: initial?.model || "",
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
        onClose();
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Name</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Role</label>
        <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Bio</label>
        <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Color</label>
        <div className="flex gap-2 flex-wrap">
          {AGENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={cn(
                "w-6 h-6 rounded-full transition-all",
                form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1f2e] scale-110" : "opacity-70 hover:opacity-100"
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [, setTick] = useState(0); // force re-render for relative timestamps

  const fetchAgents = useCallback(async () => {
    const a = await fetch("/api/agents").then((r) => r.json());
    setAgents(Array.isArray(a) ? a : (a.agents ?? [a].filter(Boolean)));
  }, []);

  useEffect(() => {
    fetchAgents();

    // ── SSE connection with reconnect logic ───────────────────────────────────
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 500; // start at 500ms, back off up to 10s
    let destroyed = false;

    function connect() {
      if (destroyed) return;
      es = new EventSource("/api/gateway/events");

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          // Real-time agent status update from Gateway turn events
          if (data.type === "agent.status") {
            setAgents((prev) =>
              prev.map((a) =>
                a.id === data.agentId
                  ? { ...a, status: data.status, current_task: data.task || null, updated_at: Math.floor(Date.now() / 1000) }
                  : a
              )
            );
          }
          // Reset backoff on any successful message
          reconnectDelay = 500;
        } catch {}
      };

      es.onerror = () => {
        // Stream dropped — close and schedule reconnect with exponential backoff
        es?.close();
        es = null;
        if (!destroyed) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 10_000);
            connect();
          }, reconnectDelay);
        }
      };
    }

    connect();

    // Fallback: re-fetch agents every 4s to catch any missed events
    const interval = setInterval(fetchAgents, 4000);
    // Tick every 10s to refresh relative timestamps ("Xs ago")
    const tickInterval = setInterval(() => setTick((t) => t + 1), 10_000);

    return () => {
      destroyed = true;
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(interval);
      clearInterval(tickInterval);
    };
  }, [fetchAgents]);

  const updateAgent = async (id: string, data: Partial<Agent>) => {
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchAgents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Agents</h1>
          <p className="text-sm text-slate-500">Your AI team</p>
        </div>
      </div>

      {/* Office scene */}
      <OfficeScene agents={agents} />

      {/* Team hierarchy — command structure */}
      <TeamHierarchy agents={agents} />

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="group">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AgentAvatar
                  seed={agent.avatar_seed || agent.id}
                  name={agent.name}
                  status={agent.status}
                  color={agent.color}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-100">{agent.name}</p>
                    <button
                      onClick={() => setEditAgent(agent)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-white/10 transition-all"
                    >
                      <Edit2 className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-0.5">{agent.role}</p>
                  {agent.model && (
                    <p className="text-[10px] text-slate-600 font-mono mb-1">
                      {agent.model.replace(/^openrouter\//, "")}
                    </p>
                  )}
                  <StatusBadge status={agent.status} />
                  {agent.current_task && agent.status !== "idle" ? (
                    <div className="mt-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50">
                      <p className="text-[11px] text-slate-300 truncate" title={agent.current_task}>
                        📌 {agent.current_task}
                      </p>
                    </div>
                  ) : null}
                  {(agent.updated_at || agent.last_seen) && (
                    <p className="text-[10px] text-slate-600 mt-1">
                      Updated {relativeTime(agent.updated_at ?? agent.last_seen)}
                    </p>
                  )}
                  {agent.bio && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{agent.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editAgent} onOpenChange={(o) => !o && setEditAgent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editAgent?.name}</DialogTitle></DialogHeader>
          {editAgent && (
            <AgentForm
              initial={editAgent}
              onSave={(data) => updateAgent(editAgent.id, data)}
              onClose={() => setEditAgent(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
