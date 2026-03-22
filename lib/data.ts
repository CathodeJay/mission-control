// Mission Control — Static data layer (MVP)
// Replace with API routes + SQLite in Phase 2

export type ProjectStatus = "active" | "paused" | "planning" | "shipped" | "in-development" | "concept";
export type AgentStatus = "online" | "idle" | "offline";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  category: string;
  revenue: number; // monthly CAD
  revenueLabel?: string; // override label (e.g. "Ongoing")
  nextMilestone: string;
  milestoneDate: string;
  tags: string[];
  priority: "high" | "medium" | "ongoing" | "low";
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string;
  lastActive: string;
}

export interface Milestone {
  id: string;
  project: string;
  title: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

export interface RevenueEntry {
  month: string;
  amount: number;
}

export const projects: Project[] = [
  {
    id: "rivls",
    name: "RIVLS",
    description:
      'Funny POD brand built around "pick a side" debates — dogs vs cats, ketchup vs mustard, etc. Targeting Gen-Z and young adults.',
    status: "in-development",
    category: "Print on Demand",
    revenue: 0,
    nextMilestone: "Define product lineup + validate design direction",
    milestoneDate: "2026-04-15",
    tags: ["print-on-demand", "gen-z", "brand"],
    priority: "high",
  },
  {
    id: "ambient-youtube",
    name: "Ambient YouTube Channel",
    description:
      'Original ambient / relaxing / ASMR audio content. 2 videos uploaded — "Empty Office Sound" getting traction. 5,000+ views. Needs 1k subs + 4k watch hours to monetize.',
    status: "active",
    category: "Content Creation",
    revenue: 0,
    nextMilestone: "Increase upload cadence + SEO audit on existing videos",
    milestoneDate: "2026-04-01",
    tags: ["youtube", "ambient", "asmr", "content"],
    priority: "high",
  },
  {
    id: "ai-consulting",
    name: "AI Consulting",
    description:
      "Help local businesses in the Quebec City area with AI tools, website upgrades, and automation workflows.",
    status: "concept",
    category: "Consulting",
    revenue: 0,
    nextMilestone: "Define service offer + identify first target businesses",
    milestoneDate: "2026-05-01",
    tags: ["consulting", "ai", "local", "automation"],
    priority: "medium",
  },
  {
    id: "investing",
    name: "Investing",
    description:
      "Capital allocation focused on compounding machines and high-growth opportunities.",
    status: "active",
    category: "Investing",
    revenue: 0,
    revenueLabel: "Ongoing",
    nextMilestone: "Research pipeline — identify next positions",
    milestoneDate: "2026-04-30",
    tags: ["investing", "compounding", "growth"],
    priority: "ongoing",
  },
];

export const agents: Agent[] = [
  {
    id: "jupiter",
    name: "Jupiter 🪐",
    role: "COO",
    status: "online",
    currentTask: "Strategic planning + project oversight",
    lastActive: "now",
  },
  {
    id: "callisto",
    name: "Callisto",
    role: "Full Stack Dev",
    status: "online",
    currentTask: "Mission Control development",
    lastActive: "now",
  },
];

export const milestones: Milestone[] = [
  {
    id: "m1",
    project: "Ambient YouTube Channel",
    title: "Increase upload cadence + SEO audit on existing videos",
    dueDate: "2026-04-01",
    priority: "high",
  },
  {
    id: "m2",
    project: "RIVLS",
    title: "Define product lineup + validate design direction",
    dueDate: "2026-04-15",
    priority: "high",
  },
  {
    id: "m3",
    project: "Investing",
    title: "Research pipeline — identify next positions",
    dueDate: "2026-04-30",
    priority: "medium",
  },
  {
    id: "m4",
    project: "AI Consulting",
    title: "Define service offer + identify first target businesses",
    dueDate: "2026-05-01",
    priority: "medium",
  },
];

// Revenue history — all ventures pre-revenue as of Q1 2026
export const revenueHistory: RevenueEntry[] = [
  { month: "Oct", amount: 0 },
  { month: "Nov", amount: 0 },
  { month: "Dec", amount: 0 },
  { month: "Jan", amount: 0 },
  { month: "Feb", amount: 0 },
  { month: "Mar", amount: 0 },
];

export const totalMonthlyRevenue = projects.reduce(
  (sum, p) => sum + p.revenue,
  0
);
