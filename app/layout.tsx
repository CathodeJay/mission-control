import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { GatewayStatus } from "@/components/GatewayStatus";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Jerome's empire ops dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="grid-bg">
        <Sidebar />
        {/* Main content — offset by sidebar */}
        <div className="pl-56 min-h-screen flex flex-col transition-all" id="main-content">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0f1219]/80 backdrop-blur-sm">
            <div className="text-xs text-slate-500 font-mono">mission-control v1.0</div>
            <GatewayStatus />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
