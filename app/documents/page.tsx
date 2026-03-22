import { FileText } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-violet-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Documents</h1>
      <p className="text-slate-400 max-w-md leading-relaxed">
        Coming soon — this section will store project documents, briefs, and reference materials.
      </p>
      <div className="mt-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-slate-500 tracking-wide uppercase">
        In Progress
      </div>
    </div>
  );
}
