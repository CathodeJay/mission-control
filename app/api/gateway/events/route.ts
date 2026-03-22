import { NextResponse } from "next/server";
import { getGatewayClient } from "@/lib/gateway";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { statusBus } from "@/lib/statusBus";

export const runtime = "nodejs"; // Force Node.js runtime for ReadableStream compatibility

// SSE endpoint — clients subscribe here to receive gateway events
export async function GET() {
  const gateway = getGatewayClient();
  const db = getDb();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(data: unknown) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      }

      // Send initial connected state
      send({ type: "connected", connected: gateway.isConnected() });

      // Handle gateway events
      function onEvent(event: { type: string; [key: string]: unknown }) {
        send(event);

        // Handle approval requests
        if (event.type === "exec.approval.requested") {
          try {
            const id = generateId();
            const maxPos = (db.prepare(
              "SELECT COALESCE(MAX(position), -1) as m FROM kanban_cards WHERE `column` = 'awaiting_approval'"
            ).get() as { m: number }).m;

            db.prepare(`
              INSERT INTO kanban_cards (id, title, description, column, priority, assigned_agent_id, approval_request_id, approval_command, position)
              VALUES (?, ?, ?, 'awaiting_approval', 'high', ?, ?, ?, ?)
            `).run(
              id,
              `Approval: ${(event.command as string)?.slice(0, 80) || "Unknown command"}`,
              (event.description as string) || null,
              (event.agentId as string) || (event.session_id as string) || null,
              (event.requestId as string) || null,
              (event.command as string) || null,
              maxPos + 1
            );

            if (event.agentId || event.session_id) {
              db.prepare("UPDATE agents SET status = 'awaiting_approval', updated_at = unixepoch() WHERE id = ? OR session_id = ?")
                .run(event.agentId || null, event.session_id || null);
            }

            db.prepare(`INSERT INTO activity_feed (id, type, agent_id, description, metadata) VALUES (?, ?, ?, ?, ?)`)
              .run(generateId(), "approval_requested", event.agentId || null,
                `Approval requested: ${(event.command as string)?.slice(0, 60)}`,
                JSON.stringify({ card_id: id, request_id: event.requestId }));

          } catch (err) {
            console.error("[SSE] Failed to create approval card:", err);
          }
        }

        // Track agent activity from health event session timestamps
        // Gateway sends health events every ~5s with session updatedAt/age data
        if (event.type === "event" && (event as any).event === "health") {
          try {
            const payload = (event as any).payload || {};
            // Ensure sessions and sessions.recent exist and is an array before iterating
            const sessions: Array<{ key: string; updatedAt: number; age: number }> =
              Array.isArray(payload.sessions?.recent) ? payload.sessions.recent : [];

            // Dynamically resolve session keys → agent IDs from DB
            // agent:main:main → jupiter (main session)
            // agent:main:subagent:* → look up which subagent is currently active
            // Future agents: any agent with a matching session_id in DB
            const allAgents = db.prepare("SELECT id, session_id FROM agents").all() as { id: string; session_id: string | null }[];
            const sessionIdMap: Record<string, string> = {};
            for (const a of allAgents) {
              if (a.session_id) sessionIdMap[a.session_id] = a.id;
            }

            // Track which subagent session is most recently active
            let latestSubagentKey: string | null = null;
            let latestSubagentAge = Infinity;
            for (const session of sessions) {
              if (session?.key?.startsWith("agent:main:subagent:") && session.age < latestSubagentAge) {
                latestSubagentAge = session.age;
                latestSubagentKey = session.key;
              }
            }

            for (const session of sessions) {
              // Ensure session object is valid before accessing properties
              if (!session || typeof session.key !== 'string') continue;

              // Resolve agent ID: main session = jupiter, subagent = mercury (most recent), others by session_id
              let agentId: string | null = null;
              if (session.key === "agent:main:main") {
                agentId = "jupiter";
              } else if (session.key.startsWith("agent:main:subagent:") && session.key === latestSubagentKey) {
                // Map most recently active subagent to mercury
                agentId = sessionIdMap[session.key] || "mercury";
              } else if (sessionIdMap[session.key]) {
                agentId = sessionIdMap[session.key];
              }
              if (!agentId) continue;

              // Agent is active if its session was updated recently (e.g., less than 15 seconds ago)
              const isActive = session.age < 15000; // 15 seconds threshold
              let newStatus: string = 'idle';
              let newTask: string | null = null;

              if (isActive) {
                newStatus = "thinking";
                // Use task from payload if available, otherwise default to "Processing..."
                newTask = payload.task || "Processing...";
              } else {
                newStatus = "idle";
                newTask = null;
              }

              const current = db.prepare("SELECT status, current_task FROM agents WHERE id = ?").get(agentId) as { status: string, current_task: string | null } | undefined;
              
              // Update DB and broadcast if status or task has changed
              if (current && (current.status !== newStatus || current.current_task !== newTask)) {
                db.prepare("UPDATE agents SET status = ?, current_task = ?, last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ?")
                  .run(newStatus, newTask, agentId);
                send({ type: "agent.status", agentId, status: newStatus, task: newTask });
              }
            }
          } catch (err) {
            console.error("[SSE] Agent status update failed:", err);
          }
        }
      }

      gateway.on("event", onEvent);

      // Also listen for direct agent status updates from self-report API
      function onStatusUpdate(data: { agentId: string; status: string; task: string | null }) {
        send({ type: "agent.status", agentId: data.agentId, status: data.status, task: data.task });
      }
      statusBus.on("agent.status", onStatusUpdate);

      return () => {
        gateway.off("event", onEvent);
        statusBus.off("agent.status", onStatusUpdate);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
