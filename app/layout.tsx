import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { GatewayStatus } from "@/components/GatewayStatus";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Jerome's empire ops dashboard",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="grid-bg">
        <Sidebar />
        {/* Main content — offset by sidebar on desktop, padded for bottom nav on mobile */}
        <div className="md:pl-56 min-h-screen flex flex-col transition-all pb-16 md:pb-0" id="main-content">
          {/* Top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/5 bg-[#0f1219]/80 backdrop-blur-sm">
            <div className="text-xs text-slate-500 font-mono">mission-control v1.0</div>
            <GatewayStatus />
          </header>
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
