"use client";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/utils";

interface AgentAvatarProps {
  seed: string;
  name: string;
  status: AgentStatus;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusRing: Record<AgentStatus, string> = {
  idle: "ring-slate-600",
  thinking: "ring-violet-500",
  working: "ring-emerald-500",
  awaiting_approval: "ring-amber-500",
  error: "ring-red-500",
};

const statusPulse: Record<AgentStatus, boolean> = {
  idle: false,
  thinking: true,
  working: true,
  awaiting_approval: true,
  error: false,
};

const statusGlow: Record<AgentStatus, string> = {
  idle: "",
  thinking: "shadow-[0_0_12px_rgba(139,92,246,0.4)]",
  working: "shadow-[0_0_12px_rgba(16,185,129,0.4)]",
  awaiting_approval: "shadow-[0_0_12px_rgba(245,158,11,0.5)]",
  error: "shadow-[0_0_12px_rgba(239,68,68,0.4)]",
};

const sizes = {
  sm: { container: "w-8 h-8", ring: "ring-1", text: "text-xs" },
  md: { container: "w-12 h-12", ring: "ring-2", text: "text-base" },
  lg: { container: "w-16 h-16", ring: "ring-2", text: "text-xl" },
};

// Generate initials from name for fallback avatar
function getInitials(name: string) {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Simple deterministic color picker based on seed
function seedToHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function AgentAvatar({ seed, name, status, color, size = "md", className }: AgentAvatarProps) {
  const sz = sizes[size];
  const safeSeed = seed || name || "agent";
  const safeStatus: AgentStatus = (status && status in statusRing) ? status : "idle";
  const hue = color ? undefined : seedToHue(safeSeed);
  const bg = color || `hsl(${hue}, 60%, 40%)`;

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold ring overflow-hidden",
          sz.container, sz.ring, sz.text,
          statusRing[safeStatus],
          statusGlow[safeStatus],
          statusPulse[safeStatus] && "animate-pulse"
        )}
        style={{ background: bg }}
        title={`${name || "Agent"} — ${safeStatus}`}
      >
        <span className="text-white select-none">{getInitials(name)}</span>
      </div>
      {/* Status dot */}
      <StatusDot status={safeStatus} />
    </div>
  );
}

function StatusDot({ status }: { status: AgentStatus }) {
  const colors: Record<AgentStatus, string> = {
    idle: "bg-slate-500",
    thinking: "bg-violet-400",
    working: "bg-emerald-400",
    awaiting_approval: "bg-amber-400",
    error: "bg-red-400",
  };
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0f1219]",
        colors[status]
      )}
    />
  );
}
