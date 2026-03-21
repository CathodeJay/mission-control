import { revenueHistory, totalMonthlyRevenue, projects } from "@/lib/data";

export default function RevenueOverview() {
  const max = Math.max(...revenueHistory.map((e) => e.amount));
  const activeRevenue = projects.filter((p) => p.status === "active");

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Revenue Overview
      </h2>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        {/* Summary */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-3xl font-bold text-white">
              ${totalMonthlyRevenue.toLocaleString()}
              <span className="text-base font-normal text-slate-500">/mo</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {activeRevenue.length} revenue-generating ventures
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">MoM</div>
            <div className="text-sm font-semibold text-emerald-400">+13.8%</div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-16">
          {revenueHistory.map((entry, i) => {
            const isLast = i === revenueHistory.length - 1;
            const height = Math.round((entry.amount / max) * 100);
            return (
              <div key={entry.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative" style={{ height: "52px" }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-all ${
                      isLast
                        ? "bg-blue-500"
                        : "bg-slate-700"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600">{entry.month}</span>
              </div>
            );
          })}
        </div>

        {/* Per-venture breakdown */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid gap-2">
          {projects
            .filter((p) => p.revenue > 0)
            .map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div className="text-xs text-slate-400 min-w-0 flex-1 truncate">
                  {p.name}
                </div>
                <div className="w-24 bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-blue-500/70 h-1.5 rounded-full"
                    style={{
                      width: `${Math.round((p.revenue / totalMonthlyRevenue) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-slate-400 text-right w-16 shrink-0">
                  ${p.revenue.toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
