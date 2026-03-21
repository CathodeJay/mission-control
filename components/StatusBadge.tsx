import { ProjectStatus, AgentStatus } from "@/lib/data";

const projectColors: Record<ProjectStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  planning: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "in-development": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  concept: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const projectLabels: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  planning: "Planning",
  shipped: "Shipped",
  "in-development": "In Dev",
  concept: "Concept",
};

const agentColors: Record<AgentStatus, string> = {
  online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  idle: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const dots: Record<AgentStatus, string> = {
  online: "bg-emerald-400 animate-pulse",
  idle: "bg-yellow-400",
  offline: "bg-slate-500",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${projectColors[status]}`}
    >
      {projectLabels[status]}
    </span>
  );
}

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${agentColors[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}
