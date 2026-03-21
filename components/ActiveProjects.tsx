import { projects } from "@/lib/data";
import { ProjectStatusBadge } from "./StatusBadge";

export default function ActiveProjects() {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
        Active Projects
      </h2>
      <div className="grid gap-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-100 truncate">
                    {project.name}
                  </h3>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-emerald-400">
                  {project.revenueLabel
                    ? project.revenueLabel
                    : project.revenue > 0
                    ? `$${project.revenue.toLocaleString()}/mo`
                    : "—"}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{project.category}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="text-slate-600">→</span>
                <span>{project.nextMilestone}</span>
                <span className="ml-auto text-slate-600">
                  {project.milestoneDate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
