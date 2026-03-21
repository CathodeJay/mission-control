import ActiveProjects from "@/components/ActiveProjects";
import AgentStatus from "@/components/AgentStatus";
import RevenueOverview from "@/components/RevenueOverview";
import NextMilestones from "@/components/NextMilestones";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { projects, totalMonthlyRevenue, agents } from "@/lib/data";

export default function Home() {
  const activeCount = projects.filter((p) => p.status === "active").length;
  const onlineAgents = agents.filter((a) => a.status === "online").length;

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm">
              ⚡
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100">
                Mission Control
              </span>
              <span className="ml-2 text-xs text-slate-600">
                Jerome&apos;s Empire
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{onlineAgents} agents online</span>
            </div>
            <div className="hidden sm:block text-slate-700">|</div>
            <div className="hidden sm:block">
              {activeCount} ventures active
            </div>
            <div className="hidden sm:block text-slate-700">|</div>
            <Link
              href="/chat"
              className="hidden sm:flex items-center gap-1.5 text-slate-500 hover:text-blue-400 transition-colors"
            >
              <span>💬</span>
              <span>Chat</span>
            </Link>
            <div className="hidden sm:block text-slate-700">|</div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Top KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: "Monthly Revenue",
              value: `$${totalMonthlyRevenue.toLocaleString()}`,
              sub: "CAD",
              color: "text-emerald-400",
            },
            {
              label: "Active Ventures",
              value: activeCount.toString(),
              sub: `of ${projects.length} total`,
              color: "text-blue-400",
            },
            {
              label: "Agents Online",
              value: `${onlineAgents}/${agents.length}`,
              sub: "operational",
              color: "text-purple-400",
            },
            {
              label: "MoM Growth",
              value: "+13.8%",
              sub: "revenue",
              color: "text-yellow-400",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
            >
              <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
              <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-slate-600 mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 grid gap-6">
            <ActiveProjects />
            <RevenueOverview />
          </div>

          {/* Right column */}
          <div className="grid gap-6 content-start">
            <AgentStatus />
            <NextMilestones />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-8 py-4 text-center text-xs text-slate-700">
        Mission Control v0.1 · Built by Mercury · Jerome&apos;s Empire
      </footer>
    </div>
  );
}
