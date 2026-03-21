"use client";
import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentAvatar } from "@/components/AgentAvatar";
import { formatRelativeTime } from "@/lib/utils";
import type { AgentStatus } from "@/lib/utils";
import {
  Activity, Check, X, AlertTriangle, Move, Plus, RefreshCw
} from "lucide-react";

type ActivityItem = {
  id: string;
  type: string;
  agent_id: string | null;
  agent_name: string | null;
  description: string;
  metadata: string | null;
  created_at: number;
};

type Agent = { id: string; name: string; color: string; status: AgentStatus };

const TYPE_ICONS: Record<string, React.ElementType> = {
  approval_requested: AlertTriangle,
  approval_approved: Check,
  approval_denied: X,
  card_moved: Move,
  card_created: Plus,
};

const TYPE_COLORS: Record<string, string> = {
  approval_requested: "text-amber-400",
  approval_approved: "text-emerald-400",
  approval_denied: "text-red-400",
  card_moved: "text-blue-400",
  card_created: "text-violet-400",
};

const TYPE_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  approval_requested: "warning",
  approval_approved: "success",
  approval_denied: "danger",
  card_moved: "info",
  card_created: "outline",
};

function ActivityRow({ item, agents }: { item: ActivityItem; agents: Agent[] }) {
  const Icon = TYPE_ICONS[item.type] || Activity;
  const color = TYPE_COLORS[item.type] || "text-slate-400";
  const agent = agents.find((a) => a.id === item.agent_id);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0 group hover:bg-white/3 px-2 -mx-2 rounded-lg transition-colors">
      <div className={`mt-0.5 p-1.5 rounded-lg bg-white/5 flex-shrink-0 ${color}`}>
        <Icon className="w-3 h-3" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug">{item.description}</p>
        <div className="flex items-center gap-3 mt-1">
          {agent && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: agent.color }}
              />
              <span className="text-xs text-slate-500">{agent.name}</span>
            </div>
          )}
          {!agent && item.agent_name && (
            <span className="text-xs text-slate-500">{item.agent_name}</span>
          )}
          <span className="text-xs text-slate-600 font-mono">
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
      </div>

      <Badge variant={TYPE_VARIANTS[item.type] || "default"} className="hidden sm:inline-flex flex-shrink-0 text-xs">
        {item.type.replace("_", " ")}
      </Badge>
    </div>
  );
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterAgent && filterAgent !== "all") params.set("agent_id", filterAgent);
    if (filterType && filterType !== "all") params.set("type", filterType);

    const [acts, agts] = await Promise.all([
      fetch(`/api/activity?${params}`).then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ]);
    setItems(acts);
    setAgents(agts);
    setLoading(false);
  }, [filterAgent, filterType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live updates
  useEffect(() => {
    const es = new EventSource("/api/gateway/events");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "exec.approval.requested") {
          setTimeout(fetchData, 500);
        }
      } catch {}
    };
    return () => es.close();
  }, [fetchData]);

  const eventTypes = [
    "approval_requested", "approval_approved", "approval_denied",
    "card_moved", "card_created",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Activity</h1>
          <p className="text-sm text-slate-500">Chronological event log</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="min-h-[44px] flex-shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="w-full sm:w-48">
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger>
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feed */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No activity yet.</p>
            <p className="text-xs mt-1">Events from Gateway and user actions will appear here.</p>
          </div>
        )}
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} agents={agents} />
        ))}
      </div>
    </div>
  );
}
