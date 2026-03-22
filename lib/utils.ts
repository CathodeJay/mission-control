import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatRelativeTime(ts: number): string {
  const now = Date.now() / 1000;
  const diff = now - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const AGENT_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#3b82f6", // blue
  "#ec4899", // pink
  "#84cc16", // lime
];

export type AgentStatus = "idle" | "thinking" | "working" | "awaiting_approval" | "error";
export type CardColumn = "awaiting_approval" | "backlog" | "todo" | "in_progress" | "done";
export type CardPriority = "low" | "medium" | "high" | "critical";
export type ProjectStatus = "active" | "paused" | "done" | "concept" | "in-development";
export type GoalStatus = "not_started" | "in_progress" | "done" | "blocked";
