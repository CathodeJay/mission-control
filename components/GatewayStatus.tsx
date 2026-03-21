"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function GatewayStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/gateway/events");

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "connected") {
          setConnected(data.connected);
        }
      } catch {}
    };

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  if (connected === null) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          connected ? "bg-emerald-400 shadow-[0_0_4px_#34d399]" : "bg-slate-600"
        )}
      />
      <span className={connected ? "text-emerald-400" : "text-slate-500"}>
        {connected ? "Gateway" : "Disconnected"}
      </span>
    </div>
  );
}
