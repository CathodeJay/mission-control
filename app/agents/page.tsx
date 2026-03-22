"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/AgentAvatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgentStatus } from "@/lib/utils";
import { AGENT_COLORS } from "@/lib/utils";
import { Monitor, Coffee, Plus, Edit2, ChevronDown, Crown, Code2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

type Agent = {
  id: string; name: string; role: string; bio: string | null;
  status: AgentStatus; color: string; avatar_seed: string;
  current_task: string | null; model: string | null; last_seen: number | null;
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
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Team Hierarchy ────────────────────────────────────────────────────────────

const KNOWN_HIERARCHY: Record<string, { rank: number; icon: React.ElementType; reportsTo: string | null; badge: string }> = {
  jupiter: { rank: 0, icon: Crown, reportsTo: null, badge: "COO" },
  callisto: { rank: 1, icon: Code2, reportsTo: "jupiter", badge: "Dev" },
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
  // Unknown agents not in hierarchy at top level
  const isLeaf = directReports.length === 0;

  return (
    <div className={cn("relative", depth > 0 && "ml-8 md:ml-12")}>
      {/* Connector line from parent */}
      {depth > 0 && (
        <div className="absolute -left-8 md:-left-12 top-5 w-8 md:w-12 flex items-center">
          <div className="border-l-2 border-b-2 border-slate-700 rounded-bl-lg w-full h-5" />
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3 md:p-4 transition-all",
          depth === 0
            ? "border-violet-500/30 bg-violet-500/5 shadow-lg shadow-violet-500/5"
            : "border-white/10 bg-white/3",
        )}
      >
        {/* Role icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            depth === 0 ? "bg-violet-500/20" : "bg-slate-800",
          )}
        >
          <Icon className={cn("w-4 h-4", depth === 0 ? "text-violet-400" : "text-slate-400")} />
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
            <span className={cn("font-semibold text-sm", depth === 0 ? "text-violet-100" : "text-slate-200")}>
              {agent.name}
            </span>
            {hInfo && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider",
                  depth === 0 ? "bg-violet-500/20 text-violet-300" : "bg-slate-700 text-slate-400",
                )}
              >
                {hInfo.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{agent.role}</p>
        </div>

        {/* Status */}
        <div className="shrink-0">
          <StatusBadge status={agent.status} />
        </div>
      </div>

      {/* Direct reports */}
      {directReports.length > 0 && (
        <div className="mt-2 space-y-2 relative">
          {/* Vertical connector */}
          <div className="absolute left-0 top-0 bottom-0 -translate-x-8 md:-translate-x-12 w-0.5 bg-slate-700" />
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
          <ChevronDown className="w-3 h-3 text-slate-600" />
          <span>Reports to</span>
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
  const [addOpen, setAddOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);

  const fetchAgents = useCallback(async () => {
    const a = await fetch("/api/agents").then((r) => r.json());
    setAgents(Array.isArray(a) ? a : (a.agents ?? [a].filter(Boolean)));
  }, []);

  useEffect(() => {
    fetchAgents();
    // Live status updates
    const es = new EventSource("/api/gateway/events");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // Real-time agent status update from Gateway turn events
        if (data.type === "agent.status") {
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agentId
                ? { ...a, status: data.status, current_task: data.task || null }
                : a
            )
          );
        }
      } catch {}
    };
    // Fallback: re-fetch agents every 15s to catch any missed events
    const interval = setInterval(fetchAgents, 15000);
    return () => { es.close(); clearInterval(interval); };
  }, [fetchAgents]);

  const createAgent = async (data: Partial<Agent>) => {
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchAgents();
  };

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
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4" /> Add Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Agent</DialogTitle></DialogHeader>
            <AgentForm onSave={createAgent} onClose={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Team hierarchy — command structure */}
      <TeamHierarchy agents={agents} />

      {/* Office scene */}
      <OfficeScene agents={agents} />

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
