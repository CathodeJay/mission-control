import { NextResponse } from "next/server";
import { getGatewayClient } from "@/lib/gateway";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

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

        // Handle specific event types
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

            // Update agent status
            if (event.agentId || event.session_id) {
              db.prepare("UPDATE agents SET status = 'awaiting_approval', updated_at = unixepoch() WHERE id = ? OR session_id = ?")
                .run(event.agentId || null, event.session_id || null);
            }

            // Log activity
            db.prepare(`INSERT INTO activity_feed (id, type, agent_id, description, metadata) VALUES (?, ?, ?, ?, ?)`)
              .run(generateId(), "approval_requested", event.agentId || null,
                `Approval requested: ${(event.command as string)?.slice(0, 60)}`,
                JSON.stringify({ card_id: id, request_id: event.requestId }));

          } catch (err) {
            console.error("[SSE] Failed to create approval card:", err);
          }
        }

        // Agent status updates from Gateway turn events
        // Gateway sends: {type:"event", event:"turn.start"|"turn.end"|"tool.start"|"tool.end", payload:{sessionKey,...}}
        if (event.type === "event") {
          const evtName = (event as any).event as string;
          const payload = (event as any).payload || {};
          const sessionKey = payload.sessionKey as string || "";

          try {
            // Map session key to agent id
            let agentId: string | null = null;
            if (sessionKey === "agent:main:main") agentId = "jupiter";
            else if (sessionKey.includes("subagent")) agentId = "mercury";

            if (agentId) {
              let newStatus: string | null = null;
              let newTask: string | null = null;

              if (evtName === "turn.start") {
                newStatus = "thinking";
                newTask = payload.message?.slice(0, 100) || "Processing...";
              } else if (evtName === "tool.start") {
                newStatus = "executing";
                newTask = `Using tool: ${payload.tool || "unknown"}`;
              } else if (evtName === "turn.end" || evtName === "tool.end") {
                newStatus = "idle";
                newTask = null;
              }

              if (newStatus) {
                db.prepare("UPDATE agents SET status = ?, current_task = ?, last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ?")
                  .run(newStatus, newTask, agentId);
                // Emit agent.status event so UI updates instantly without polling
                send({ type: "agent.status", agentId, status: newStatus, task: newTask });
              }
            }
          } catch {}
        }
      }

      gateway.on("event", onEvent);

      // Cleanup when client disconnects
      return () => {
        gateway.off("event", onEvent);
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
