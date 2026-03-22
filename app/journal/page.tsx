"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Pencil, ChevronDown, ChevronUp, RefreshCw, Trash2, Search, X } from "lucide-react";

type JournalEntry = {
  id: string;
  date: string;
  accomplishments: string;
  lessons_learned: string;
  open_items: string;
  agent_notes: string;
  created_at: number;
  updated_at: number;
};

type EntryForm = {
  date: string;
  accomplishments: string;
  lessons_learned: string;
  open_items: string;
  agent_notes: string;
};

const EMPTY_FORM: EntryForm = {
  date: new Date().toISOString().slice(0, 10),
  accomplishments: "",
  lessons_learned: "",
  open_items: "",
  agent_notes: "",
};

function preview(text: string, max = 120): string {
  if (!text.trim()) return "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

function Section({ label, content }: { label: string; content: string }) {
  if (!content.trim()) return null;
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</h4>
      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: (e: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasContent =
    entry.accomplishments || entry.lessons_learned || entry.open_items || entry.agent_notes;

  const summaryText =
    preview(entry.accomplishments) ||
    preview(entry.lessons_learned) ||
    preview(entry.open_items) ||
    "No content yet.";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/7 transition-colors">
      {/* Card header */}
      <button
        className="w-full flex items-start gap-4 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-100 font-mono">{entry.date}</span>
            {!hasContent && (
              <span className="text-xs text-slate-600 italic">empty</span>
            )}
          </div>
          {!expanded && (
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{summaryText}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="border-t border-white/5 pt-4 space-y-4">
            <Section label="✅ Accomplishments" content={entry.accomplishments} />
            <Section label="💡 Lessons Learned" content={entry.lessons_learned} />
            <Section label="📋 Open Items" content={entry.open_items} />
            <Section label="🤖 Agent Notes" content={entry.agent_notes} />
            {!hasContent && (
              <p className="text-sm text-slate-600 italic">No content recorded for this day.</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(entry)}
              className="gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(entry.id)}
              className="gap-1.5 text-red-400 border-red-400/30 hover:bg-red-400/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
            <span className="text-xs text-slate-600 ml-auto font-mono">
              Updated {new Date(entry.updated_at * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function EntryFormDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: EntryForm & { id?: string };
  onClose: () => void;
  onSave: (form: EntryForm & { id?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState<EntryForm & { id?: string }>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial, open]);

  function set(field: keyof EntryForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Journal Entry" : "New Journal Entry"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              disabled={!!form.id}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 disabled:opacity-50"
            />
          </div>

          {/* Accomplishments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ✅ Accomplishments
            </label>
            <Textarea
              rows={4}
              placeholder="What was completed today?"
              value={form.accomplishments}
              onChange={(e) => set("accomplishments", e.target.value)}
            />
          </div>

          {/* Lessons Learned */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              💡 Lessons Learned
            </label>
            <Textarea
              rows={3}
              placeholder="New decisions, insights, or mistakes to avoid…"
              value={form.lessons_learned}
              onChange={(e) => set("lessons_learned", e.target.value)}
            />
          </div>

          {/* Open Items */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              📋 Open Items
            </label>
            <Textarea
              rows={3}
              placeholder="Carried over or flagged for next day…"
              value={form.open_items}
              onChange={(e) => set("open_items", e.target.value)}
            />
          </div>

          {/* Agent Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              🤖 Agent Notes
            </label>
            <Textarea
              rows={2}
              placeholder="Which agent did what, if relevant…"
              value={form.agent_notes}
              onChange={(e) => set("agent_notes", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.date}>
              {saving ? "Saving…" : "Save Entry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Time-grouping helpers ─────────────────────────────────────────────────────

type GroupLabel =
  | "This Week"
  | "Last Week"
  | "Last Month"
  | "Past Months"
  | "Past Years";

function getGroupLabel(dateStr: string, now: Date): GroupLabel {
  const entry = new Date(dateStr + "T00:00:00");

  // Week boundaries (Monday-based)
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = (dayOfWeek + 6) % 7; // days since last Monday
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - mondayOffset);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  if (entry >= thisMonday) return "This Week";
  if (entry >= lastMonday) return "Last Week";

  // "Last Month" = the calendar month immediately before the current month
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const lastMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  if (
    entry.getFullYear() === lastMonthYear &&
    entry.getMonth() === lastMonthIndex
  ) {
    return "Last Month";
  }

  // "Past Months" = same year, but older than last month
  if (entry.getFullYear() === now.getFullYear()) return "Past Months";

  return "Past Years";
}

const GROUP_ORDER: GroupLabel[] = [
  "This Week",
  "Last Week",
  "Last Month",
  "Past Months",
  "Past Years",
];

// ─────────────────────────────────────────────────────────────────────────────

function GroupedEntryList({
  groupedEntries,
  onEdit,
  onDelete,
}: {
  groupedEntries: Record<GroupLabel, JournalEntry[]>;
  onEdit: (e: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  // All groups expanded by default
  const [collapsed, setCollapsed] = useState<Partial<Record<GroupLabel, boolean>>>({});

  function toggleGroup(label: GroupLabel) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="space-y-8">
      {GROUP_ORDER.map((label) => {
        const group = groupedEntries[label];
        if (!group || group.length === 0) return null;
        const isCollapsed = !!collapsed[label];
        return (
          <div key={label} className="space-y-3">
            {/* Clickable group header */}
            <button
              onClick={() => toggleGroup(label)}
              className="w-full flex items-center gap-3 group text-left"
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">
                {label}
              </h2>
              <div className="flex-1 border-t border-white/5" />
              <span className="text-xs text-slate-600 tabular-nums">
                {group.length}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-all duration-200 ${
                  isCollapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
            </button>
            {/* Entries in this group */}
            {!isCollapsed && (
              <div className="space-y-3">
                {group.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={onEdit}
                    onDelete={onDelete}
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

// ─────────────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<(EntryForm & { id?: string }) | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/journal").then((r) => r.json());
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ── Search filtering ───────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.accomplishments, e.lessons_learned, e.open_items, e.agent_notes]
        .some((field) => field?.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  // ── Time grouping ──────────────────────────────────────────────────────────
  const groupedEntries = useMemo(() => {
    const now = new Date();
    const groups: Record<GroupLabel, JournalEntry[]> = {
      "This Week": [],
      "Last Week": [],
      "Last Month": [],
      "Past Months": [],
      "Past Years": [],
    };
    for (const entry of filteredEntries) {
      groups[getGroupLabel(entry.date, now)].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  function openNew() {
    setEditEntry({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function openEdit(entry: JournalEntry) {
    setEditEntry({
      id: entry.id,
      date: entry.date,
      accomplishments: entry.accomplishments,
      lessons_learned: entry.lessons_learned,
      open_items: entry.open_items,
      agent_notes: entry.agent_notes,
    });
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry?")) return;
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  async function handleSave(form: EntryForm & { id?: string }) {
    if (form.id) {
      await fetch(`/api/journal/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setDialogOpen(false);
    setEditEntry(null);
    fetchEntries();
  }

  const totalFiltered = filteredEntries.length;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Journal</h1>
          <p className="text-sm text-slate-500">Daily team standup log — what we built, learned, and left open</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading} className="min-h-[44px]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={openNew} className="min-h-[44px] gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Entry</span>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search journal entries…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search result count */}
      {isSearching && (
        <p className="text-xs text-slate-500">
          {totalFiltered === 0
            ? "No entries match your search."
            : `${totalFiltered} entr${totalFiltered === 1 ? "y" : "ies"} found`}
        </p>
      )}

      {/* Empty state */}
      {entries.length === 0 && !loading && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-medium">No journal entries yet</p>
          <p className="text-sm text-slate-600 mt-1">
            Start logging daily standups to track progress and lessons.
          </p>
          <Button size="sm" onClick={openNew} className="mt-4 gap-1.5">
            <Plus className="w-4 h-4" />
            Create first entry
          </Button>
        </div>
      )}

      {/* No search results (but entries exist) */}
      {entries.length > 0 && totalFiltered === 0 && isSearching && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
          <Search className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 font-medium">No matching entries</p>
          <p className="text-sm text-slate-600 mt-1">Try a different search term.</p>
        </div>
      )}

      {/* Grouped entry list */}
      {totalFiltered > 0 && (
        <GroupedEntryList
          groupedEntries={groupedEntries}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Form dialog */}
      {editEntry && (
        <EntryFormDialog
          open={dialogOpen}
          initial={editEntry}
          onClose={() => {
            setDialogOpen(false);
            setEditEntry(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
