import { FlaskConical } from "lucide-react";

export default function ResearchLabPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* Icon */}
      <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-600/15 border border-violet-500/20">
        <FlaskConical className="w-10 h-10 text-violet-400" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
        Research Lab
      </h1>

      {/* Subtitle */}
      <p className="text-slate-400 text-base max-w-md leading-relaxed mb-8">
        Coming soon — this section will be used for research and discovery.
      </p>

      {/* Decorative badge */}
      <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-medium tracking-wide uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        In Development
      </span>
    </div>
  );
}
