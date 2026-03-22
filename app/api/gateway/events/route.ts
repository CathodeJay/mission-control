// AGENT STATUS TRACKING — MANDATORY FOR ALL AGENTS
// Every agent MUST call agent-status.sh at the start and end of every task:
//   START: agent-status.sh <agent_id> <status> "<description>"
//   END:   agent-status.sh <agent_id> idle
// Example: agent-status.sh mercury executing "Building new feature"
//          agent-status.sh mercury idle
// Agent IDs: jupiter, callisto, europa
// Statuses: thinking, working, idle, awaiting_approval, error

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

      // Sync agent models from OpenClaw config on connect
      gateway.once("connected", () => {
        fetch("http://localhost:" + (process.env.MISSION_CONTROL_PORT || "3200") + "/api/agents/sync-models", { method: "POST" })
          .catch(() => {}); // best-effort
      });

      // ── Keepalive ping every 30s ───────────────────────────────────────────
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          // client disconnected
        }
      }, 30_000);

      // Handle gateway events
      function onEvent(event: { type: string; [key: string]: unknown }) {
        send(event);

        // ── Subagent completion → mark callisto idle ──────────────────────────
        // When a subagent session finishes, the parent session (Jupiter) receives
        // a subagent_announce event. We use this to reset the subagent's status
        // in the DB (agents don't always get to call agent-status.sh themselves).
        if (
          event.type === "event" &&
          (
            (event as any).event === "subagent_announce" ||
            (event as any).event === "subagent.complete" ||
            (event as any).event === "session.end"
          )
        ) {
          try {
            // Try to resolve the session key to an agent id
            const sessionKey = (event as any).session_id || (event as any).sessionId || (event as any).session?.key;
            let agentId: string | null = null;

            if (sessionKey) {
              const bySession = db.prepare("SELECT id FROM agents WHERE session_id = ?").get(sessionKey) as { id: string } | undefined;
              if (bySession) agentId = bySession.id;
              // Fallback: if it's a subagent key, default to callisto
              if (!agentId && typeof sessionKey === "string" && sessionKey.startsWith("agent:main:subagent:")) {
                agentId = "callisto";
              }
            }

            // If it's a generic subagent_announce without session info, try the agentId field
            if (!agentId && (event as any).agentId) {
              agentId = (event as any).agentId;
            }

            // If we know which agent completed, set it idle
            if (agentId) {
              db.prepare(
                "UPDATE agents SET status = 'idle', current_task = NULL, last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ? AND status != 'idle'"
              ).run(agentId);
              statusBus.emit("agent.status", { agentId, status: "idle", task: null });
            }
          } catch (err) {
            console.error("[SSE] Failed to update subagent status on completion:", err);
          }
        }

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

            // Build session_id → agent_id map from DB (set via bind-session endpoint at spawn time)
            // This is the authoritative mapping — no guessing, no hardcoded fallbacks.
            const allAgents = db.prepare("SELECT id, session_id FROM agents").all() as { id: string; session_id: string | null }[];
            const sessionIdMap: Record<string, string> = {};
            for (const a of allAgents) {
              if (a.session_id) sessionIdMap[a.session_id] = a.id;
            }

            for (const session of sessions) {
              // Ensure session object is valid before accessing properties
              if (!session || typeof session.key !== 'string') continue;

              // Resolve agent ID:
              //   agent:main:main → always jupiter (the main session)
              //   agent:main:subagent:* → only if session_id was registered via bind-session
              //   anything else → look up by session_id (future named agents)
              let agentId: string | null = null;
              if (session.key === "agent:main:main") {
                agentId = "jupiter";
              } else if (sessionIdMap[session.key]) {
                agentId = sessionIdMap[session.key];
              }
              // If no binding found for a subagent session, skip — don't guess.
              // The subagent_announce handler below will idle it on completion,
              // and bind-session registration happens at spawn time.
              if (!agentId) continue;

              // Agent is active if its session was updated recently (e.g., less than 15 seconds ago)
              const isActive = session.age < 15000; // 15 seconds threshold

              if (isActive) {
                // Update last_seen but DON'T override a precise status (working/awaiting_approval/error)
                // set via agent-status.sh — only promote idle→thinking if session is active.
                const current = db.prepare("SELECT status, current_task FROM agents WHERE id = ?").get(agentId) as { status: string; current_task: string | null } | undefined;
                if (current && current.status === "idle") {
                  // Session active but agent shows idle → bump to thinking
                  db.prepare("UPDATE agents SET status = 'thinking', last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ?")
                    .run(agentId);
                  send({ type: "agent.status", agentId, status: "thinking", task: current.current_task });
                } else if (current) {
                  // Just refresh last_seen so "Updated Xs ago" stays current
                  db.prepare("UPDATE agents SET last_seen = unixepoch() WHERE id = ?").run(agentId);
                }
              } else {
                // Session stale — if agent is still showing active, mark idle
                const current = db.prepare("SELECT status FROM agents WHERE id = ?").get(agentId) as { status: string } | undefined;
                if (current && current.status !== "idle") {
                  db.prepare("UPDATE agents SET status = 'idle', current_task = NULL, last_seen = unixepoch(), updated_at = unixepoch() WHERE id = ?")
                    .run(agentId);
                  send({ type: "agent.status", agentId, status: "idle", task: null });
                }
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
        clearInterval(pingInterval);
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
