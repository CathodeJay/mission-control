"use client";
import { useEffect, useState, useCallback } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CardColumn, CardPriority } from "@/lib/utils";
import {
  AlertTriangle, Check, X, Plus, GripVertical, Clock, User, Flag
} from "lucide-react";

type KanbanCard = {
  id: string; title: string; description: string | null;
  column: CardColumn; priority: CardPriority;
  assigned_agent_id: string | null; agent_name: string | null; agent_color: string | null;
  project_id: string | null; project_name: string | null;
  approval_request_id: string | null; approval_command: string | null; approval_note: string | null;
  created_at: number;
};

type Agent = { id: string; name: string; color: string };
type Project = { id: string; name: string };

const COLUMNS: { id: CardColumn; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "text-slate-400" },
  { id: "todo", label: "To Do", color: "text-blue-400" },
  { id: "in_progress", label: "In Progress", color: "text-violet-400" },
  { id: "done", label: "Done", color: "text-emerald-400" },
];

const PRIORITY_STYLES: Record<CardPriority, string> = {
  low: "text-slate-400",
  medium: "text-blue-400",
  high: "text-amber-400",
  critical: "text-red-400",
};

const PRIORITY_DOT: Record<CardPriority, string> = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-red-500",
};

function PriorityBadge({ priority }: { priority: CardPriority }) {
  return (
    <div className={cn("flex items-center gap-1 text-xs", PRIORITY_STYLES[priority])}>
      <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_DOT[priority])} />
      {priority}
    </div>
  );
}

function ApprovalCard({ card, onApprove, onDeny }: {
  card: KanbanCard;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  return (
    <div className="approval-glow rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-200 line-clamp-2">{card.title}</p>
          {card.approval_command && (
            <code className="block mt-1 text-xs font-mono bg-black/30 rounded px-2 py-1 text-amber-300 truncate">
              {card.approval_command}
            </code>
          )}
          {card.agent_name && (
            <p className="text-xs text-amber-400/60 mt-1 flex items-center gap-1">
              <User className="w-3 h-3" /> {card.agent_name}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="success"
          className="flex-1 h-7 text-xs"
          onClick={() => onApprove(card.id)}
        >
          <Check className="w-3 h-3" /> Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1 h-7 text-xs"
          onClick={() => onDeny(card.id)}
        >
          <X className="w-3 h-3" /> Deny
        </Button>
      </div>
    </div>
  );
}

function CardComponent({ card, dragging }: { card: KanbanCard; dragging?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-white/5 p-3 space-y-2 cursor-grab active:cursor-grabbing",
        dragging && "opacity-50 rotate-1 shadow-2xl"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-200 line-clamp-2 flex-1">{card.title}</p>
        <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
      </div>
      {card.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{card.description}</p>
      )}
      <div className="flex items-center justify-between">
        <PriorityBadge priority={card.priority} />
        <div className="flex items-center gap-2 text-xs text-slate-600">
          {card.agent_name && (
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: card.agent_color || "#6366f1" }}
              />
              {card.agent_name}
            </span>
          )}
          <Clock className="w-3 h-3" />
          {new Date(card.created_at * 1000).toLocaleDateString()}
        </div>
      </div>
      {card.project_name && (
        <Badge variant="outline" className="text-xs">{card.project_name}</Badge>
      )}
    </div>
  );
}

function SortableCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardComponent card={card} dragging={isDragging} />
    </div>
  );
}

function KanbanColumn({
  column, cards, onAddCard,
}: {
  column: { id: CardColumn; label: string; color: string };
  cards: KanbanCard[];
  onAddCard: (col: CardColumn) => void;
}) {
  return (
    <div className="flex flex-col gap-3 min-w-[260px] w-64">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", column.color)}>{column.label}</span>
          <span className="text-xs font-mono text-slate-600 bg-white/5 rounded px-1">{cards.length}</span>
        </div>
        <button
          onClick={() => onAddCard(column.id)}
          className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 rounded-xl border border-white/8 bg-white/3 p-2 min-h-[400px] space-y-2">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-32 text-xs text-slate-700 italic">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}

function AddCardDialog({
  open, onClose, defaultColumn, agents, projects, onAdd,
}: {
  open: boolean; onClose: () => void;
  defaultColumn: CardColumn;
  agents: Agent[]; projects: Project[];
  onAdd: (card: Partial<KanbanCard>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium" as CardPriority,
    assigned_agent_id: "", project_id: "", column: defaultColumn,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, column: defaultColumn }));
  }, [defaultColumn]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Card</DialogTitle></DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onAdd(form);
            setSaving(false);
            setForm({ title: "", description: "", priority: "medium", assigned_agent_id: "", project_id: "", column: defaultColumn });
            onClose();
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as CardPriority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Column</label>
              <Select value={form.column} onValueChange={(v) => setForm({ ...form, column: v as CardColumn })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {agents.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Assign Agent</label>
              <Select value={form.assigned_agent_id} onValueChange={(v) => setForm({ ...form, assigned_agent_id: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {projects.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Link Project</label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Adding..." : "Add Card"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function KanbanPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [addDialogCol, setAddDialogCol] = useState<CardColumn | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchAll = useCallback(async () => {
    const [c, a, p] = await Promise.all([
      fetch("/api/kanban").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]);
    setCards(c);
    setAgents(a);
    setProjects(p);
  }, []);

  useEffect(() => {
    fetchAll();
    // Listen for new approval cards from Gateway
    const es = new EventSource("/api/gateway/events");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "exec.approval.requested") {
          // Refresh cards to show new approval
          setTimeout(fetchAll, 500);
        }
      } catch {}
    };
    return () => es.close();
  }, [fetchAll]);

  const approvalCards = cards.filter((c) => c.column === "awaiting_approval");
  const colCards = (col: CardColumn) => cards.filter((c) => c.column === col);

  const handleDragStart = (e: DragStartEvent) => {
    const card = cards.find((c) => c.id === e.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const draggedCard = cards.find((c) => c.id === active.id);
    const overCard = cards.find((c) => c.id === over.id);
    if (!draggedCard || !overCard) return;

    // Move to new column if different
    if (draggedCard.column !== overCard.column) {
      await fetch(`/api/kanban/${draggedCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ column: overCard.column }),
      });
      setCards((prev) =>
        prev.map((c) => c.id === draggedCard.id ? { ...c, column: overCard.column } : c)
      );
    }
  };

  const addCard = async (data: Partial<KanbanCard>) => {
    await fetch("/api/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchAll();
  };

  const handleApprove = async (id: string) => {
    await fetch(`/api/kanban/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true }),
    });
    await fetchAll();
  };

  const handleDeny = async (id: string) => {
    await fetch(`/api/kanban/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false, column: "backlog", approval_note: "Denied by user" }),
    });
    await fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Kanban</h1>
          <p className="text-sm text-slate-500">Task tracking & approvals</p>
        </div>
        <Button size="sm" onClick={() => setAddDialogCol("todo")}>
          <Plus className="w-4 h-4" /> New Card
        </Button>
      </div>

      {/* Awaiting Approval swimlane */}
      {approvalCards.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400">
              Awaiting Approval ({approvalCards.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {approvalCards.map((card) => (
              <ApprovalCard key={card.id} card={card} onApprove={handleApprove} onDeny={handleDeny} />
            ))}
          </div>
        </div>
      )}

      {/* Main kanban board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              cards={colCards(col.id)}
              onAddCard={(c) => setAddDialogCol(c)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <CardComponent card={activeCard} dragging />}
        </DragOverlay>
      </DndContext>

      <AddCardDialog
        open={!!addDialogCol}
        onClose={() => setAddDialogCol(null)}
        defaultColumn={addDialogCol || "todo"}
        agents={agents}
        projects={projects}
        onAdd={addCard}
      />
    </div>
  );
}
