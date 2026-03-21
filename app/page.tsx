"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/AgentAvatar";
import { UpcomingTasks } from "@/components/UpcomingTasks";
import type { AgentStatus } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Users, CheckSquare, Clock, Zap, FolderOpen, Target, Activity,
  AlertTriangle, TrendingUp
} from "lucide-react";

type Metrics = {
  agents: { total: number; active: number; awaiting_approval: number };
  kanban: { by_column: Record<string, number>; completed_this_week: number; approvals_pending: number };
  projects: { by_status: Record<string, number> };
  goals: { overdue: number; in_progress: number };
  activity: { today: number };
  gateway: { connected: boolean };
};

type Agent = {
  id: string; name: string; role: string; status: AgentStatus;
  color: string; avatar_seed: string; current_task: string | null;
};

const COL_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  awaiting_approval: "Awaiting",
};

const COL_COLORS: Record<string, string> = {
  backlog: "#475569",
  todo: "#3b82f6",
  in_progress: "#8b5cf6",
  done: "#10b981",
  awaiting_approval: "#f59e0b",
};

function KpiCard({
  icon: Icon, label, value, sub, color = "violet",
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white/5 ${colorMap[color] || "text-violet-400"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className={`text-2xl font-bold font-mono ${colorMap[color] || "text-slate-100"}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  const fetchData = useCallback(async () => {
    const [m, a] = await Promise.all([
      fetch("/api/metrics").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
    ]);
    setMetrics(m);
    setAgents(a);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Live gateway events to update agent status in real-time
  useEffect(() => {
    const es = new EventSource("/api/gateway/events");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "agent.status" || data.type === "session.status") {
          setAgents((prev) =>
            prev.map((a) =>
              a.id === data.agentId || a.id === data.session_id
                ? { ...a, status: data.status, current_task: data.task || null }
                : a
            )
          );
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  const kanbanChartData = metrics
    ? ["backlog", "todo", "in_progress", "done"].map((col) => ({
        name: COL_LABELS[col],
        value: metrics.kanban.by_column[col] || 0,
        color: COL_COLORS[col],
      }))
    : [];

  const approvalsPending = metrics?.kanban.approvals_pending || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500">Real-time empire overview</p>
      </div>

      {/* Approval alert */}
      {approvalsPending > 0 && (
        <div className="approval-glow rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">
              {approvalsPending} approval{approvalsPending > 1 ? "s" : ""} pending
            </p>
            <p className="text-xs text-amber-400/70">
              Agent{approvalsPending > 1 ? "s are" : " is"} waiting for your decision
            </p>
          </div>
          <a
            href="/kanban"
            className="ml-auto text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review →
          </a>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Active Agents"
          value={`${metrics?.agents.active || 0}/${metrics?.agents.total || 0}`}
          sub={`${metrics?.agents.awaiting_approval || 0} awaiting approval`}
          color="violet"
        />
        <KpiCard
          icon={CheckSquare}
          label="Done This Week"
          value={metrics?.kanban.completed_this_week || 0}
          sub="Kanban cards completed"
          color="emerald"
        />
        <KpiCard
          icon={FolderOpen}
          label="Active Projects"
          value={metrics?.projects.by_status?.active || 0}
          sub={`${metrics?.projects.by_status?.concept || 0} in concept`}
          color="blue"
        />
        <KpiCard
          icon={Target}
          label="Goals In Progress"
          value={metrics?.goals.in_progress || 0}
          sub={`${metrics?.goals.overdue || 0} blocked`}
          color={metrics?.goals.overdue ? "red" : "amber"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kanban Summary Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Kanban Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={kanbanChartData} barSize={32}>
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {kanbanChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Agent Roster Quick View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.length === 0 && (
              <p className="text-sm text-slate-500">No agents yet.</p>
            )}
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <AgentAvatar
                  seed={agent.avatar_seed || agent.id}
                  name={agent.name}
                  status={agent.status}
                  color={agent.color}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{agent.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {agent.current_task || agent.role}
                  </p>
                </div>
                <AgentStatusBadge status={agent.status} />
              </div>
            ))}
            <a
              href="/agents"
              className="block text-xs text-violet-400 hover:text-violet-300 text-center mt-2 transition-colors"
            >
              View all agents →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Activity today + Gateway */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard
          icon={Activity}
          label="Activity Today"
          value={metrics?.activity.today || 0}
          sub="Events logged"
          color="violet"
        />
        <KpiCard
          icon={Clock}
          label="Gateway"
          value={metrics?.gateway.connected ? "Online" : "Offline"}
          sub="OpenClaw connection"
          color={metrics?.gateway.connected ? "emerald" : "red"}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Awaiting Approval"
          value={approvalsPending}
          sub="Kanban lane"
          color={approvalsPending > 0 ? "amber" : "violet"}
        />
      </div>

      {/* Upcoming Tasks widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UpcomingTasks />
      </div>
    </div>
  );
}

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const map: Record<AgentStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "outline" }> = {
    idle: { label: "Idle", variant: "default" },
    thinking: { label: "Thinking", variant: "info" },
    executing: { label: "Executing", variant: "success" },
    awaiting_approval: { label: "Waiting", variant: "warning" },
    error: { label: "Error", variant: "danger" },
  };
  const { label, variant } = map[status] || { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}
