"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain, Plus, Search, Trash2, Pencil, X, ChevronDown, ChevronUp, Tag,
  ArrowUpDown, LayoutGrid, AlignJustify
} from "lucide-react";
import { cn } from "@/lib/utils";

type Importance = "low" | "normal" | "high" | "critical";

interface Memory {
  id: string;
  title: string;
  content: string;
  agent_id: string | null;
  agent_name: string | null;
  agent_color: string | null;
  tags: string; // JSON array
  importance: Importance;
  created_at: number;
  updated_at: number;
}

interface Agent {
  id: string;
  name: string;
  color: string;
}

const IMPORTANCE_CONFIG: Record<Importance, { label: string; badge: string; border: string }> = {
  critical: { label: "Critical", badge: "bg-red-500/20 text-red-400 border border-red-500/30", border: "border-l-4 border-l-red-500" },
  high:     { label: "High",     badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30", border: "border-l-4 border-l-amber-500" },
  normal:   { label: "Normal",   badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30", border: "" },
  low:      { label: "Low",      badge: "bg-slate-500/20 text-slate-400 border border-slate-500/30", border: "" },
};

const TAG_COLORS = [
  "bg-violet-500/20 text-violet-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-pink-500/20 text-pink-300",
  "bg-orange-500/20 text-orange-300",
  "bg-teal-500/20 text-teal-300",
];

function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % TAG_COLORS.length;
  return TAG_COLORS[h];
}

function relativeDate(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString();
}

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

// ── MemoryCard ───────────────────────────────────────────────────────────────
function MemoryCard({
  memory, onDelete, onEdit, onTagClick,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit: (m: Memory) => void;
  onTagClick: (tag: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tags = parseTags(memory.tags);
  const imp = IMPORTANCE_CONFIG[memory.importance] ?? IMPORTANCE_CONFIG.normal;

  return (
    <div className={cn(
      "rounded-xl bg-[#161b27] border border-white/10 p-4 flex flex-col gap-3 transition-all",
      imp.border,
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug">{memory.title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(memory)}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(memory.id)}
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          "text-slate-400 text-sm leading-relaxed cursor-pointer",
          !expanded && "line-clamp-3"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {memory.content}
      </div>
      {memory.content.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 w-fit"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
        </button>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => onTagClick(t)}
              className={cn("text-xs px-2 py-0.5 rounded-full flex items-center gap-1 hover:opacity-80 transition-opacity", tagColor(t))}
            >
              <Tag className="w-2.5 h-2.5" />
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
        <div className="flex items-center gap-2">
          {memory.agent_name ? (
            <>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: memory.agent_color ?? "#6366f1" }}
              >
                {memory.agent_name[0].toUpperCase()}
              </div>
              <span className="text-xs text-slate-500">{memory.agent_name}</span>
            </>
          ) : (
            <span className="text-xs text-slate-600 italic">No agent</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", imp.badge)}>{imp.label}</span>
          <span className="text-[10px] text-slate-600">{relativeDate(memory.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ── MemoryModal ──────────────────────────────────────────────────────────────
function MemoryModal({
  initial,
  agents,
  onClose,
  onSave,
}: {
  initial?: Memory | null;
  agents: Agent[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [agentId, setAgentId] = useState(initial?.agent_id ?? "");
  const [tagsRaw, setTagsRaw] = useState(() => parseTags(initial?.tags ?? "[]").join(", "));
  const [importance, setImportance] = useState<Importance>(initial?.importance ?? "normal");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const body = { title, content, agent_id: agentId || null, tags, importance };

    if (initial) {
      await fetch(`/api/memory/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">{initial ? "Edit Memory" : "Add Memory"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-[#0f1219] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
              placeholder="Memory title..."
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              className="w-full bg-[#0f1219] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
              placeholder="What should be remembered..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Agent</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-[#0f1219] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="">None</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Importance</label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as Importance)}
                className="w-full bg-[#0f1219] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tags <span className="text-slate-600">(comma-separated)</span></label>
            <input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              className="w-full bg-[#0f1219] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
              placeholder="e.g. ops, infra, auth"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : initial ? "Save Changes" : "Add Memory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── TimelineView ─────────────────────────────────────────────────────────────
type GroupKey = "today" | "yesterday" | "thisWeek" | "thisMonth" | "older";

const GROUP_ORDER: GroupKey[] = ["today", "yesterday", "thisWeek", "thisMonth", "older"];

const GROUP_LABELS: Record<GroupKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  thisMonth: "This Month",
  older: "Older",
};

function getGroupKey(ts: number): GroupKey {
  const now = new Date();
  const d = new Date(ts * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const startOfYesterday = startOfToday - 86400;
  const startOfWeek = startOfToday - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 86400;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;

  if (ts >= startOfToday) return "today";
  if (ts >= startOfYesterday) return "yesterday";
  if (ts >= startOfWeek) return "thisWeek";
  if (ts >= startOfMonth) return "thisMonth";
  return "older";
}

function TimelineView({
  memories, onDelete, onEdit, onTagClick,
}: {
  memories: Memory[];
  onDelete: (id: string) => void;
  onEdit: (m: Memory) => void;
  onTagClick: (tag: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Partial<Record<GroupKey, boolean>>>({});

  const groups = GROUP_ORDER.reduce<Record<GroupKey, Memory[]>>((acc, k) => {
    acc[k] = [];
    return acc;
  }, {} as Record<GroupKey, Memory[]>);

  for (const m of memories) {
    const key = getGroupKey(m.created_at);
    groups[key].push(m);
  }

  return (
    <div className="flex flex-col gap-6">
      {GROUP_ORDER.map((key) => {
        if (groups[key].length === 0) return null;
        const isCollapsed = collapsed[key];
        return (
          <div key={key}>
            {/* Group header */}
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
              className="flex items-center gap-2 mb-3 w-full text-left group"
            >
              <ChevronDown className={cn(
                "w-3.5 h-3.5 text-slate-500 transition-transform flex-shrink-0",
                isCollapsed && "-rotate-90"
              )} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
                {GROUP_LABELS[key]}
              </span>
              <span className="text-xs text-slate-600">({groups[key].length})</span>
              <div className="flex-1 h-px bg-white/5 ml-2" />
            </button>

            {/* Cards */}
            {!isCollapsed && (
              <div className="flex flex-col gap-3">
                {groups[key].map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onTagClick={onTagClick}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterImportance, setFilterImportance] = useState<Importance | "all">("all");
  const [filterTag, setFilterTag] = useState("");
  const [sortDesc, setSortDesc] = useState(true); // true = newest first
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);

  const fetchData = useCallback(async () => {
    const [memRes, agentRes] = await Promise.all([
      fetch("/api/memory"),
      fetch("/api/agents"),
    ]);
    const [mems, agts] = await Promise.all([memRes.json(), agentRes.json()]);
    setMemories(mems);
    setAgents(agts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this memory?")) return;
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    fetchData();
  }

  function openEdit(m: Memory) {
    setEditTarget(m);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditTarget(null);
  }

  // Client-side filtering + sorting
  const filtered = [...memories].filter((m) => {
    if (filterAgent && m.agent_id !== filterAgent) return false;
    if (filterImportance !== "all" && m.importance !== filterImportance) return false;
    if (filterTag) {
      const tags = parseTags(m.tags);
      if (!tags.includes(filterTag)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!m.title.toLowerCase().includes(q) && !m.content.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => sortDesc ? b.created_at - a.created_at : a.created_at - b.created_at);

  // Collect all tags for the tag cloud
  const allTags = Array.from(new Set(memories.flatMap((m) => parseTags(m.tags)))).sort();

  const importanceLevels: Array<Importance | "all"> = ["all", "low", "normal", "high", "critical"];

  return (
    <div className="min-h-screen bg-[#0f1219] text-white px-4 py-6 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Collective Memory</h1>
            <p className="text-xs text-slate-500">Shared knowledge base for all agents</p>
          </div>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Memory</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search memories..."
          className="w-full bg-[#161b27] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Agent dropdown */}
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="bg-[#161b27] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Importance chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {importanceLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterImportance(lvl)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                filterImportance === lvl
                  ? "bg-violet-600 text-white"
                  : "bg-[#161b27] border border-white/10 text-slate-400 hover:text-white"
              )}
            >
              {lvl === "all" ? "All" : IMPORTANCE_CONFIG[lvl].label}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortDesc((d) => !d)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[#161b27] border border-white/10 text-slate-400 hover:text-white transition-colors"
          title={sortDesc ? "Newest first → Oldest first" : "Oldest first → Newest first"}
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortDesc ? "Newest" : "Oldest"}
        </button>

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              viewMode === "grid" ? "bg-violet-600 text-white" : "text-slate-500 hover:text-white"
            )}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              viewMode === "timeline" ? "bg-violet-600 text-white" : "text-slate-500 hover:text-white"
            )}
            title="Timeline view"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tag filter clear */}
        {filterTag && (
          <button
            onClick={() => setFilterTag("")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30"
          >
            <Tag className="w-3 h-3" />
            {filterTag}
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tags cloud */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-5">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setFilterTag(filterTag === t ? "" : t)}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-all",
                tagColor(t),
                filterTag === t ? "ring-1 ring-white/30" : "opacity-70 hover:opacity-100"
              )}
            >
              <Tag className="w-2.5 h-2.5" />
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-slate-600 mb-4">
          {filtered.length} {filtered.length === 1 ? "memory" : "memories"}
          {filtered.length !== memories.length && ` (filtered from ${memories.length})`}
        </p>
      )}

      {/* Grid vs Timeline view */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-[#161b27] border border-white/10 p-4 h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#161b27] border border-white/10 flex items-center justify-center mb-4">
            <Brain className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">No memories found</h3>
          <p className="text-xs text-slate-600 max-w-xs">
            {search || filterAgent || filterImportance !== "all" || filterTag
              ? "Try adjusting your filters or search query."
              : "Start building the collective knowledge base. Add your first memory!"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onDelete={handleDelete}
              onEdit={openEdit}
              onTagClick={(t) => setFilterTag(filterTag === t ? "" : t)}
            />
          ))}
        </div>
      ) : (
        // Timeline view — group by time period
        <TimelineView memories={filtered} onDelete={handleDelete} onEdit={openEdit} onTagClick={(t) => setFilterTag(filterTag === t ? "" : t)} />
      )}

      {/* Modal */}
      {showModal && (
        <MemoryModal
          initial={editTarget}
          agents={agents}
          onClose={closeModal}
          onSave={fetchData}
        />
      )}
    </div>
  );
}
