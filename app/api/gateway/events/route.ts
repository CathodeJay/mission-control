// Track agent activity from health event session timestamps
        // Gateway sends health events every ~5s with session updatedAt/age data
        if (event.type === "event" && (event as any).event === "health") {
          try {
            const payload = (event as any).payload || {};
            // Ensure sessions and sessions.recent exist and is an array before iterating
            const sessions: Array<{ key: string; updatedAt: number; age: number }> =
              Array.isArray(payload.sessions?.recent) ? payload.sessions.recent : [];

            // Map session keys → agent IDs
            const sessionAgentMap: Record<string, string> = {
              "agent:main:main": "jupiter",
            };

            for (const session of sessions) {
              // Ensure session object is valid before accessing properties
              if (!session || typeof session.key !== 'string') continue;

              const agentId = sessionAgentMap[session.key] || (session.key.startsWith("agent:main:subagent:") ? "mercury" : null);
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
