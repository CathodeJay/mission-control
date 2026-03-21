import { milestones } from "@/lib/data";

const priorityColors = {
  high: "text-red-400 border-red-500/30 bg-red-500/10",
  medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  low: "text-slate-400 border-slate-600/30 bg-slate-800/40",
};

const priorityDot = {
  high: "bg-red-400",
  medium: "bg-yellow-400",
  low: "bg-slate-500",
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function NextMilestones() {
  const sorted = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Next Milestones
      </h2>
      <div className="grid gap-2">
        {sorted.map((m) => {
          const days = daysUntil(m.dueDate);
          const overdue = days < 0;
          return (
            <div
              key={m.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors flex items-center gap-3"
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[m.priority]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-200 truncate">{m.title}</div>
                <div className="text-xs text-slate-600">{m.project}</div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`text-xs font-semibold ${
                    overdue ? "text-red-400" : days <= 7 ? "text-yellow-400" : "text-slate-400"
                  }`}
                >
                  {overdue ? `${Math.abs(days)}d overdue` : `${days}d`}
                </div>
                <div className="text-xs text-slate-700">{m.dueDate}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
