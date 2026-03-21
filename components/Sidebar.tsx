"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, KanbanSquare, FolderKanban,
  Activity, ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agents", icon: Users, label: "Agents" },
  { href: "/kanban", icon: KanbanSquare, label: "Kanban" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/activity", icon: Activity, label: "Activity" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-30 flex flex-col border-r border-white/10 bg-[#0d1117] transition-all duration-200",
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
  );
}
