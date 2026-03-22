"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain, Plus, Search, Trash2, Pencil, X, ChevronDown, ChevronUp, Tag,
  Clock, SortDesc, SortAsc, CalendarDays, LayoutGrid, AlignLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── MemoryArchitecturePanel ──────────────────────────────────────────────────
function MemoryArchitecturePanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-violet-300">How Memory Works</span>
          <span className="text-xs text-violet-400/60 hidden sm:inline">· Two layers, one team brain</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-violet-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-violet-400 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-violet-500/15 pt-4">
          {/* Two layers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#0f1219] border border-white/10 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">📄</span>
                <span className="text-xs font-semibold text-white">MEMORY.md — Long-Term Memory</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A curated markdown file per agent (e.g. <code className="bg-white/5 px-1 rounded text-violet-300">MEMORY.md</code> for Jupiter).
                Think of it as a personal journal — distilled wisdom, decisions, and context from past sessions.
                <strong className="text-slate-300"> Only read in a main session</strong> (never in group chats) because it contains private info.
                You read it, update it, and it travels with you as your long-term continuity.
              </p>
              <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-white/5">
                Location: workspace/MEMORY.md
              </div>
            </div>

            <div className="rounded-lg bg-[#0f1219] border border-white/10 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🧠</span>
                <span className="text-xs font-semibold text-white">Collective Memory — This Page</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A <strong className="text-slate-300">shared team brain</strong> stored in SQLite.
                Every agent can read and write to it. Jerome can see it here in real-time.
                It&apos;s for cross-agent knowledge: architecture decisions, lessons learned, team conventions,
                anything that should survive beyond a single agent&apos;s session.
              </p>
              <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-white/5">
                Storage: SQLite → memories table
              </div>
            </div>
          </div>

          {/* How entries get in */}
          <div className="rounded-lg bg-[#0f1219] border border-white/10 p-3 space-y-2">
            <div className="text-xs font-semibold text-white mb-1">How entries get written</div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-slate-400 font-mono flex-wrap">
              <span className="bg-white/5 px-2 py-1 rounded text-slate-300">write-memory.sh</span>
              <span className="text-slate-600 hidden sm:inline">→</span>
              <span className="bg-white/5 px-2 py-1 rounded text-slate-300">POST /api/memory</span>
              <span className="text-slate-600 hidden sm:inline">→</span>
              <span className="bg-white/5 px-2 py-1 rounded text-slate-300">SQLite memories table</span>
              <span className="text-slate-600 hidden sm:inline">→</span>
              <span className="bg-white/5 px-2 py-1 rounded text-violet-300">This page ✓</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Usage: <code className="bg-white/5 px-1 rounded">write-memory.sh &lt;agent_id&gt; &lt;importance&gt; &quot;Title&quot; &quot;Content&quot; &quot;tags&quot;</code><br />
              Any agent (Jupiter, Callisto, Europa, Io…) can call this script. Jerome can also add entries manually via the <strong className="text-slate-400">+ Add Memory</strong> button above.
              Memories are read at session start via <code className="bg-white/5 px-1 rounded">fetch-memories.sh critical,high</code>.
            </p>
          </div>

          {/* Importance levels */}
          <div className="rounded-lg bg-[#0f1219] border border-white/10 p-3">
            <div className="text-xs font-semibold text-white mb-2">Importance levels</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { level: "critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", desc: "Must-know for all agents. Always fetched first." },
                { level: "high", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", desc: "Very useful cross-agent context. Fetched by default." },
                { level: "normal", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", desc: "Good to know. Fetched on demand or when relevant." },
                { level: "low", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", desc: "Nice to have. Background context, rarely fetched proactively." },
              ].map(({ level, color, bg, desc }) => (
                <div key={level} className={cn("rounded-lg border p-2 space-y-1", bg)}>
                  <span className={cn("text-[11px] font-bold capitalize", color)}>{level}</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MEMORY.md vs Collective */}
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3">
            <div className="text-xs font-semibold text-amber-300 mb-1">MEMORY.md vs Collective Memory — at a glance</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-400">
              <div><span className="text-slate-300">Scope:</span> personal vs team-wide</div>
              <div><span className="text-slate-300">Format:</span> markdown file vs SQLite rows</div>
              <div><span className="text-slate-300">Access:</span> agent-private vs Jerome sees it live</div>
              <div><span className="text-slate-300">Loaded:</span> main session only vs every agent every session</div>
              <div><span className="text-slate-300">Written by:</span> owning agent vs any agent via script</div>
              <div><span className="text-slate-300">Purpose:</span> personal continuity vs shared team brain</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Importance = "low" | "normal" | "high" | "critical";
type SortOrder = "newest" | "oldest";
type ViewMode = "grid" | "timeline";

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

const IMPORTANCE_CONFIG: Record<Importance, { label: string; badge: string; border: string; dot: string; ring: string }> = {
  critical: {
    label: "Critical",
    badge: "bg-red-500/20 text-red-400 border border-red-500/40",
    border: "border-l-4 border-l-red-500",
    dot: "bg-red-500",
    ring: "ring-1 ring-red-500/30",
  },
  high: {
    label: "High",
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
    border: "border-l-4 border-l-amber-500",
    dot: "bg-amber-500",
    ring: "ring-1 ring-amber-500/30",
  },
  normal: {
    label: "Normal",
    badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    border: "",
    dot: "bg-blue-500",
    ring: "",
  },
  low: {
    label: "Low",
    badge: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
    border: "",
    dot: "bg-slate-400",
    ring: "",
  },
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

function absoluteDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateBucket(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - mDate.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

// ── TagPill ──────────────────────────────────────────────────────────────────
function TagPill({ tag, onClick, active }: { tag: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-all",
        tagColor(tag),
        active ? "ring-1 ring-white/30" : "hover:opacity-80"
      )}
    >
      <Tag className="w-2.5 h-2.5" />
      {tag}
    </button>
  );
}

// ── ImportanceBadge ──────────────────────────────────────────────────────────
function ImportanceBadge({ importance }: { importance: Importance }) {
  const cfg = IMPORTANCE_CONFIG[importance] ?? IMPORTANCE_CONFIG.normal;
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.badge)}>
      {cfg.label}
    </span>
  );
}

// ── MemoryCard ───────────────────────────────────────────────────────────────
function MemoryCard({
  memory, onDelete, onEdit, onTagClick, onAgentClick,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit: (m: Memory) => void;
  onTagClick: (tag: string) => void;
  onAgentClick?: (agentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tags = parseTags(memory.tags);
  const imp = IMPORTANCE_CONFIG[memory.importance] ?? IMPORTANCE_CONFIG.normal;

  return (
    <div className={cn(
      "rounded-xl bg-[#161b27] border border-white/10 p-4 flex flex-col gap-3 transition-all hover:border-white/20",
      imp.border,
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug">{memory.title}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ImportanceBadge importance={memory.importance} />
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
            <TagPill key={t} tag={t} onClick={() => onTagClick(t)} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
        <button
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          onClick={() => memory.agent_id && onAgentClick?.(memory.agent_id)}
        >
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
        </button>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] text-slate-600" title={absoluteDate(memory.created_at)}>
            {relativeDate(memory.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── TimelineEntry ────────────────────────────────────────────────────────────
function TimelineEntry({
  memory, onDelete, onEdit, onTagClick, onAgentClick, isLast,
}: {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit: (m: Memory) => void;
  onTagClick: (tag: string) => void;
  onAgentClick?: (agentId: string) => void;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const tags = parseTags(memory.tags);
  const imp = IMPORTANCE_CONFIG[memory.importance] ?? IMPORTANCE_CONFIG.normal;

  return (
    <div className="flex gap-3 min-w-0">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={cn("w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-[#0f1219]", imp.dot)} />
        {!isLast && <div className="w-px flex-1 bg-white/10 mt-1" />}
      </div>

      {/* Card */}
      <div className={cn(
        "flex-1 min-w-0 rounded-xl bg-[#161b27] border border-white/10 p-4 mb-4 hover:border-white/20 transition-all",
        imp.ring,
      )}>
        {/* Timestamp */}
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <CalendarDays className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="text-[11px] text-slate-500 font-mono truncate">{absoluteDate(memory.created_at)}</span>
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white text-sm leading-snug flex-1 min-w-0">{memory.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <ImportanceBadge importance={memory.importance} />
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
            "text-slate-400 text-sm leading-relaxed cursor-pointer mb-2",
            !expanded && "line-clamp-3"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {memory.content}
        </div>
        {memory.content.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mb-2"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
          </button>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((t) => (
              <TagPill key={t} tag={t} onClick={() => onTagClick(t)} />
            ))}
          </div>
        )}

        {/* Agent */}
        <div className="flex items-center pt-2 border-t border-white/5">
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => memory.agent_id && onAgentClick?.(memory.agent_id)}
          >
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
          </button>
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterImportance, setFilterImportance] = useState<Importance | "all">("all");
  const [filterTag, setFilterTag] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Memory | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

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

  function handleAgentClick(agentId: string) {
    setFilterAgent(filterAgent === agentId ? "" : agentId);
  }

  // Client-side filtering
  const filtered = memories
    .filter((m) => {
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
    })
    .sort((a, b) =>
      sortOrder === "newest" ? b.created_at - a.created_at : a.created_at - b.created_at
    );

  // Collect all tags for the tag cloud
  const allTags = Array.from(new Set(memories.flatMap((m) => parseTags(m.tags)))).sort();

  const importanceLevels: Array<Importance | "all"> = ["all", "critical", "high", "normal", "low"];

  // Group by date bucket for timeline
  const timelineGroups: { bucket: string; items: Memory[] }[] = [];
  filtered.forEach((m) => {
    const bucket = dateBucket(m.created_at);
    const existing = timelineGroups.find((g) => g.bucket === bucket);
    if (existing) existing.items.push(m);
    else timelineGroups.push({ bucket, items: [m] });
  });

  // Stats
  const criticalCount = memories.filter((m) => m.importance === "critical").length;
  const highCount = memories.filter((m) => m.importance === "high").length;

  return (
    <div className="min-h-screen bg-[#0f1219] text-white px-4 py-6 md:px-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-2">
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

      {/* Architecture explanation */}
      <MemoryArchitecturePanel />

      {/* Quick stats */}
      {!loading && memories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b27] border border-white/10 text-xs">
            <span className="text-slate-400 font-medium">{memories.length}</span>
            <span className="text-slate-600">total</span>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-red-400 font-medium">{criticalCount}</span>
              <span className="text-red-400/60">critical</span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-amber-400 font-medium">{highCount}</span>
              <span className="text-amber-400/60">high</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b27] border border-white/10 text-xs">
            <span className="text-slate-400 font-medium">{allTags.length}</span>
            <span className="text-slate-600">tags</span>
          </div>
        </div>
      )}

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

      {/* Filter + Controls bar */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Row 1: agent filter + importance chips + active tag */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Agent filter */}
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-[#161b27] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 max-w-full"
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

          {/* Tag filter active */}
          {filterTag && (
            <button
              onClick={() => setFilterTag("")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30"
            >
              <Tag className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{filterTag}</span>
              <X className="w-3 h-3 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Row 2: Sort + View toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[#161b27] border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {sortOrder === "newest" ? (
              <><SortDesc className="w-3.5 h-3.5" /> Newest first</>
            ) : (
              <><SortAsc className="w-3.5 h-3.5" /> Oldest first</>
            )}
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-[#161b27] border border-white/10 overflow-hidden">
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
                viewMode === "timeline" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors",
                viewMode === "grid" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Tags cloud */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-5">
          {allTags.map((t) => (
            <TagPill
              key={t}
              tag={t}
              active={filterTag === t}
              onClick={() => setFilterTag(filterTag === t ? "" : t)}
            />
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

      {/* Content */}
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
      ) : viewMode === "timeline" ? (
        /* Timeline view */
        <div>
          {timelineGroups.map((group) => (
            <div key={group.bucket} className="mb-6">
              {/* Date bucket header */}
              <div className="flex items-center gap-3 mb-3 min-w-0">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a2035] border border-white/10 text-xs text-slate-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {group.bucket}
                  <span className="text-slate-600">· {group.items.length}</span>
                </div>
                <div className="flex-1 h-px bg-white/5 min-w-0" />
              </div>
              {/* Timeline entries */}
              <div className="ml-1">
                {group.items.map((m, idx) => (
                  <TimelineEntry
                    key={m.id}
                    memory={m}
                    onDelete={handleDelete}
                    onEdit={openEdit}
                    onTagClick={(t) => setFilterTag(filterTag === t ? "" : t)}
                    onAgentClick={handleAgentClick}
                    isLast={idx === group.items.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MemoryCard
              key={m.id}
              memory={m}
              onDelete={handleDelete}
              onEdit={openEdit}
              onTagClick={(t) => setFilterTag(filterTag === t ? "" : t)}
              onAgentClick={handleAgentClick}
            />
          ))}
        </div>
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
