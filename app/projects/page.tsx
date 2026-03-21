"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProjectStatus, GoalStatus } from "@/lib/utils";
import { Plus, Edit2, Trash2, Target, ChevronDown, ChevronRight } from "lucide-react";

type Goal = {
  id: string; project_id: string; name: string; description: string | null;
  progress: number; status: GoalStatus;
};

type Project = {
  id: string; name: string; description: string | null;
  status: ProjectStatus; target_date: number | null; color: string;
  goal_count: number; goals_done: number; avg_progress: number;
  goals?: Goal[];
};

const STATUS_VARIANTS: Record<ProjectStatus, "default" | "success" | "info" | "warning" | "outline"> = {
  active: "success",
  paused: "warning",
  done: "info",
  concept: "outline",
  "in-development": "info",
};

const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

const GOAL_STATUS_VARIANTS: Record<GoalStatus, "default" | "success" | "warning" | "danger" | "info" | "outline"> = {
  not_started: "default",
  in_progress: "info",
  done: "success",
  blocked: "danger",
};

function ProgressBar({ value, color = "#8b5cf6" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

function ProjectForm({
  initial, onSave, onClose,
}: {
  initial?: Partial<Project>;
  onSave: (data: Partial<Project>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    status: (initial?.status || "active") as ProjectStatus,
    color: initial?.color || "#6366f1",
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
        onClose();
      }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Name *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Description</label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in-development">In Development</SelectItem>
              <SelectItem value="concept">Concept</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Color</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-9 w-full rounded-md border border-white/10 bg-white/5 px-1 cursor-pointer"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

function GoalForm({
  projectId, initial, onSave, onClose,
}: {
  projectId: string;
  initial?: Partial<Goal>;
  onSave: (data: Partial<Goal>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    progress: initial?.progress || 0,
    status: (initial?.status || "not_started") as GoalStatus,
    project_id: projectId,
  });
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
        onClose();
      }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Goal Name *</label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Description</label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Progress (%)</label>
          <Input
            type="number" min={0} max={100}
            value={form.progress}
            onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Status</label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as GoalStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

function ProjectCard({ project, onEdit, onDelete, onRefresh }: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [addGoal, setAddGoal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    const g = await fetch(`/api/goals?project_id=${project.id}`).then((r) => r.json());
    setGoals(g);
  }, [project.id]);

  const handleExpand = () => {
    if (!expanded) fetchGoals();
    setExpanded(!expanded);
  };

  const createGoal = async (data: Partial<Goal>) => {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchGoals();
    onRefresh();
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchGoals();
    onRefresh();
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await fetchGoals();
    onRefresh();
  };

  const progress = Math.round(project.avg_progress || 0);

  return (
    <Card className="group">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: project.color }} />
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">{project.name}</CardTitle>
              {project.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-white/10">
              <Edit2 className="w-3 h-3 text-slate-400" />
            </button>
            <button onClick={onDelete} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-white/10">
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={STATUS_VARIANTS[project.status] || "default"}>
            {project.status}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Target className="w-3 h-3" />
            {project.goals_done}/{project.goal_count} goals
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Progress</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <ProgressBar value={progress} color={project.color} />
        </div>

        {/* Goals section */}
        <button
          onClick={handleExpand}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Goals ({project.goal_count})
        </button>

        {expanded && (
          <div className="space-y-2 pt-1 border-t border-white/5">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-start gap-2 group/goal">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-300 flex-1">{goal.name}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover/goal:opacity-100 transition-opacity">
                      <button onClick={() => setEditGoal(goal)} className="p-0.5 rounded hover:bg-white/10">
                        <Edit2 className="w-2.5 h-2.5 text-slate-500" />
                      </button>
                      <button onClick={() => deleteGoal(goal.id)} className="p-0.5 rounded hover:bg-white/10">
                        <Trash2 className="w-2.5 h-2.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <ProgressBar value={goal.progress} color={project.color} />
                    <span className="text-xs font-mono text-slate-600 w-8 text-right flex-shrink-0">
                      {goal.progress}%
                    </span>
                  </div>
                  <Badge variant={GOAL_STATUS_VARIANTS[goal.status]} className="text-xs">
                    {GOAL_STATUS_LABELS[goal.status]}
                  </Badge>
                </div>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-6"
              onClick={() => setAddGoal(true)}
            >
              <Plus className="w-3 h-3" /> Add Goal
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Goal Dialogs */}
      <Dialog open={addGoal} onOpenChange={setAddGoal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
          <GoalForm projectId={project.id} onSave={createGoal} onClose={() => setAddGoal(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editGoal} onOpenChange={(o) => !o && setEditGoal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Goal</DialogTitle></DialogHeader>
          {editGoal && (
            <GoalForm
              projectId={project.id}
              initial={editGoal}
              onSave={(data) => updateGoal(editGoal.id, data)}
              onClose={() => setEditGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    const p = await fetch("/api/projects").then((r) => r.json());
    setProjects(p);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data: Partial<Project>) => {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchProjects();
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchProjects();
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project and all its goals?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await fetchProjects();
  };

  const statusGroups = ["active", "in-development", "concept", "paused", "done"] as ProjectStatus[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Projects</h1>
          <p className="text-sm text-slate-500">Track ventures and goals</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {["active", "concept", "done"].map((status) => (
          <div key={status} className="rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
            <p className="text-xs text-slate-500 capitalize">{status}</p>
            <p className="text-xl md:text-2xl font-bold font-mono text-slate-100">
              {projects.filter((p) => p.status === status).length}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={() => setEditProject(project)}
            onDelete={() => deleteProject(project.id)}
            onRefresh={fetchProjects}
          />
        ))}
        {projects.length === 0 && (
          <p className="text-slate-500 col-span-3 text-center py-8">
            No projects yet. Add your first one.
          </p>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <ProjectForm onSave={createProject} onClose={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProject} onOpenChange={(o) => !o && setEditProject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editProject?.name}</DialogTitle></DialogHeader>
          {editProject && (
            <ProjectForm
              initial={editProject}
              onSave={(data) => updateProject(editProject.id, data)}
              onClose={() => setEditProject(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
