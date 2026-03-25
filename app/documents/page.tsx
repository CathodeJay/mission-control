"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Plus, Trash2, Edit2, ChevronDown, ChevronRight, Clock, FolderOpen, Search, X,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  color: string;
  status: string;
};

type Document = {
  id: string;
  title: string;
  content: string | null;
  project_id: string | null;
  created_at: number;
  updated_at: number;
};

// ---------- helpers ----------
function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-CA", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function wordCount(text: string | null) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---------- DocumentForm ----------
function DocumentForm({
  initial,
  projectId,
  projects,
  onSave,
  onClose,
}: {
  initial?: Partial<Document>;
  projectId: string;
  projects: Project[];
  onSave: (data: { title: string; content: string; project_id: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    project_id: initial?.project_id ?? projectId,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          await onSave({ title: form.title, content: form.content, project_id: form.project_id });
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to save document");
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Title *</label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Document title"
          required
        />
      </div>
      {/* Project selector — allows moving doc between projects */}
      {projects.length > 1 && (
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Project</label>
          <select
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0d1117]">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Content</label>
        <Textarea
          value={form.content ?? ""}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="Write your document here…"
          rows={10}
          className="font-mono text-sm resize-y"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>
      )}
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}

// ---------- DocumentViewer ----------
function DocumentViewer({
  doc,
  projectColor,
  onEdit,
  onClose,
}: {
  doc: Document;
  projectColor: string;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Updated {fmtDate(doc.updated_at)}
        </span>
        <span>·</span>
        <span>{wordCount(doc.content)} words</span>
      </div>

      <div
        className="rounded-lg border border-white/10 bg-white/5 p-4 min-h-[120px] text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed"
        style={{ borderLeftColor: projectColor, borderLeftWidth: 3 }}
      >
        {doc.content || <span className="text-slate-600 italic">No content yet.</span>}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button onClick={onEdit}>
          <Edit2 className="w-4 h-4" /> Edit
        </Button>
      </div>
    </div>
  );
}

// ---------- ProjectSection ----------
function ProjectSection({
  project,
  documents,
  projects,
  searchQuery,
  onDocumentSaved,
  onDocumentDeleted,
}: {
  project: Project;
  documents: Document[];
  projects: Project[];
  searchQuery: string;
  onDocumentSaved: () => void;
  onDocumentDeleted: (deletedId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [editDoc, setEditDoc] = useState<Document | null>(null);

  // Filter docs by search query
  const filteredDocs = searchQuery
    ? documents.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.content ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  // Auto-expand when searching
  const isExpanded = searchQuery ? filteredDocs.length > 0 : expanded;

  const createDoc = async (data: { title: string; content: string; project_id: string }) => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create document");
    onDocumentSaved();
  };

  const updateDoc = async (id: string, data: { title: string; content: string; project_id: string }) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update document");
    onDocumentSaved();
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    // Close dialogs if they reference the deleted doc
    if (viewDoc?.id === id) setViewDoc(null);
    if (editDoc?.id === id) setEditDoc(null);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete document");
    onDocumentDeleted(id);
  };

  // Hide section entirely if searching and no matches
  if (searchQuery && filteredDocs.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => !searchQuery && setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project.color }} />
          <span className="font-medium text-slate-200">{project.name}</span>
          <Badge variant="outline" className="text-xs">
            {filteredDocs.length} {filteredDocs.length === 1 ? "doc" : "docs"}
            {searchQuery && filteredDocs.length !== documents.length && (
              <span className="ml-1 text-slate-500">of {documents.length}</span>
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setAddOpen(true); }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
          {!searchQuery && (
            isExpanded
              ? <ChevronDown className="w-4 h-4 text-slate-500" />
              : <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Document list */}
      {isExpanded && (
        <div className="border-t border-white/5">
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center gap-2">
              <FolderOpen className="w-8 h-8 text-slate-600" />
              <p className="text-sm text-slate-500">No documents yet</p>
              <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Add first document
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                >
                  {/* Color accent */}
                  <div
                    className="w-0.5 h-8 rounded-full flex-shrink-0 opacity-60"
                    style={{ background: project.color }}
                  />
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />

                  {/* Main content — clickable to view */}
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => setViewDoc(doc)}
                  >
                    <p className="text-sm text-slate-200 truncate font-medium">{doc.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {doc.content
                        ? doc.content.slice(0, 80).replace(/\n/g, " ") + (doc.content.length > 80 ? "…" : "")
                        : <span className="italic">Empty</span>}
                    </p>
                  </button>

                  <div className="flex items-center gap-1 text-xs text-slate-600 ml-2 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{fmtDate(doc.updated_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setEditDoc(doc)}
                      className="p-1.5 rounded hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => deleteDoc(doc.id)}
                      className="p-1.5 rounded hover:bg-white/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
              New Document — {project.name}
            </DialogTitle>
          </DialogHeader>
          <DocumentForm
            projectId={project.id}
            projects={projects}
            onSave={createDoc}
            onClose={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              {viewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          {viewDoc && (
            <DocumentViewer
              doc={viewDoc}
              projectColor={project.color}
              onEdit={() => { setEditDoc(viewDoc); setViewDoc(null); }}
              onClose={() => setViewDoc(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(o) => !o && setEditDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
              Edit — {editDoc?.title}
            </DialogTitle>
          </DialogHeader>
          {editDoc && (
            <DocumentForm
              initial={editDoc}
              projectId={project.id}
              projects={projects}
              onSave={(data) => updateDoc(editDoc.id, data)}
              onClose={() => setEditDoc(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Main Page ----------
export default function DocumentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [docsByProject, setDocsByProject] = useState<Record<string, Document[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAll = useCallback(async () => {
    const [projs, docs] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()) as Promise<Project[]>,
      fetch("/api/documents").then((r) => r.json()) as Promise<Document[]>,
    ]);
    setProjects(projs);

    // Group docs by project_id
    const grouped: Record<string, Document[]> = {};
    for (const p of projs) grouped[p.id] = [];
    for (const doc of docs) {
      if (doc.project_id && grouped[doc.project_id]) {
        grouped[doc.project_id].push(doc);
      }
    }
    setDocsByProject(grouped);
    setLoading(false);
  }, []);

  // After delete, optimistically remove the doc from state (avoids full refetch)
  const handleDocumentDeleted = useCallback((deletedId: string) => {
    setDocsByProject((prev) => {
      const next = { ...prev };
      for (const pid of Object.keys(next)) {
        next[pid] = next[pid].filter((d) => d.id !== deletedId);
      }
      return next;
    });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalDocs = Object.values(docsByProject).reduce((sum, arr) => sum + arr.length, 0);

  const matchingDocCount = searchQuery
    ? Object.values(docsByProject).reduce(
        (sum, docs) =>
          sum +
          docs.filter(
            (d) =>
              d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (d.content ?? "").toLowerCase().includes(searchQuery.toLowerCase())
          ).length,
        0
      )
    : totalDocs;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-slate-500 text-sm">Loading documents…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Documents</h1>
          <p className="text-sm text-slate-500">
            {totalDocs} document{totalDocs !== 1 ? "s" : ""} across {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
          <p className="text-xs text-slate-500">Total Docs</p>
          <p className="text-xl md:text-2xl font-bold font-mono text-slate-100">{totalDocs}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
          <p className="text-xs text-slate-500">Projects</p>
          <p className="text-xl md:text-2xl font-bold font-mono text-slate-100">{projects.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
          <p className="text-xs text-slate-500">Active Projects</p>
          <p className="text-xl md:text-2xl font-bold font-mono text-slate-100">
            {projects.filter((p) => p.status === "active").length}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents by title or content…"
          className="pl-9 pr-9"
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

      {/* Search results summary */}
      {searchQuery && (
        <p className="text-xs text-slate-500">
          {matchingDocCount === 0
            ? "No documents match your search"
            : `${matchingDocCount} document${matchingDocCount !== 1 ? "s" : ""} matching "${searchQuery}"`}
        </p>
      )}

      {/* Project sections */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <FileText className="w-12 h-12 text-slate-700" />
          <p className="text-slate-400">No projects found.</p>
          <p className="text-sm text-slate-600">Create a project first, then add documents to it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectSection
              key={project.id}
              project={project}
              documents={docsByProject[project.id] ?? []}
              projects={projects}
              searchQuery={searchQuery}
              onDocumentSaved={fetchAll}
              onDocumentDeleted={handleDocumentDeleted}
            />
          ))}
          {searchQuery && matchingDocCount === 0 && (
            <div className="flex flex-col items-center py-10 text-center gap-2">
              <Search className="w-10 h-10 text-slate-700" />
              <p className="text-slate-500 text-sm">No documents found for "{searchQuery}"</p>
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>Clear search</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
