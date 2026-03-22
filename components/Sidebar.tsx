"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, KanbanSquare, FolderKanban,
  BookOpen, ChevronLeft, ChevronRight, Zap, CalendarClock, Brain, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agents", icon: Users, label: "Agents" },
  { href: "/kanban", icon: KanbanSquare, label: "Kanban" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/calendar", icon: CalendarClock, label: "Calendar" },
  { href: "/memory", icon: Brain, label: "Memory" },
  { href: "/documents", icon: FileText, label: "Documents" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-full z-30 flex-col border-r border-white/10 bg-[#0d1117] transition-all duration-200",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-2 px-3 py-4 border-b border-white/10", collapsed && "justify-center")}>
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-white tracking-tight">Mission Control</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-violet-600/20 text-violet-400 font-medium"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                  collapsed && "justify-center"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="m-2 p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* ── Mobile bottom nav ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d1117] border-t border-white/10 pb-safe">
        <div className="grid grid-cols-4">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2 transition-colors",
                  active
                    ? "text-violet-400"
                    : "text-slate-500 active:text-slate-300"
                )}
              >
                <Icon className={cn("w-4 h-4", active && "drop-shadow-[0_0_6px_rgba(139,92,246,0.8)]")} />
                <span className="text-[9px] leading-tight truncate max-w-full">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
