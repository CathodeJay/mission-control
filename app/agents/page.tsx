"use client";
import { useEffect, useState, useCallback } from "react";
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
import { Monitor, Coffee, Plus, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Agent = {
  id: string; name: string; role: string; bio: string | null;
  status: AgentStatus; color: string; avatar_seed: string;
  current_task: string | null; last_seen: number | null;
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Thinking...",
  working: "Working...",
  awaiting_approval: "Awaiting Approval",
  error: "Error",
};

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
                  <p className="text-xs text-slate-400 mb-1">{agent.role}</p>
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
