            // Map session keys → agent IDs
            let agentId: string | null = null;
            if (session.key === "agent:main:main") {
              agentId = "jupiter";
            } else if (session.key.startsWith("agent:main:subagent:")) {
              agentId = "mercury"; // Map subagent sessions to Mercury
            }

            if (agentId) {
              // Agent is active if its session was updated recently (e.g., less than 15 seconds ago)
              const isActive = session.age < 15000;
              let newStatus: string = 'idle';
              let newTask: string | null = null;

              if (isActive) {
                newStatus = "thinking";
                // Use task from payload if available, otherwise default to "Processing..."
                // Clear task if agent goes idle.
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