import { NextResponse } from "next/server";
import { getGatewayClient } from "@/lib/gateway";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { statusBus } from "@/lib/statusBus";

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
            const sessions: Array<{ key: string; updatedAt: number; age: number }> =
              payload.sessions?.recent || [];

            // Map session keys → agent ids
            const sessionAgentMap: Record<string, string> = {
              "agent:main:main": "jupiter",
            };

            for (const session of sessions) {
              const agentId = sessionAgentMap[session.key] || (session.key.startsWith("agent:main:subagent:") ? "mercury" : null);
              if (!agentId) continue;

              // Active = session updated within last 15 seconds
              const isActive = session.age < 15000;
              const newStatus = isActive ? "thinking" : "idle";

              const current = db.prepare("SELECT status FROM agents WHERE id = ?").get(agentId) as { status: string } | undefined;
              if (current && current.status !== newStatus) {
                db.prepare("UPDATE agents SET status = ?, last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ?")
                  .run(newStatus, agentId);
                send({ type: "agent.status", agentId, status: newStatus, task: null });
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
