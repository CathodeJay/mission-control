import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getGatewayClient } from "@/lib/gateway";

export async function GET() {
  const db = getDb();

  // Today's window
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const weekStart = todayStart - 6 * 86400;

  // Agents
  const agents = db.prepare("SELECT * FROM agents").all() as Array<{ status: string }>;
  const activeAgents = agents.filter((a) => a.status !== "idle").length;
  const awaitingApproval = agents.filter((a) => a.status === "awaiting_approval").length;

  // Kanban
  const kanbanCols = db.prepare(`
    SELECT \`column\`, COUNT(*) as count FROM kanban_cards GROUP BY \`column\`
  `).all() as Array<{ column: string; count: number }>;

  const kanbanByCol: Record<string, number> = {};
  kanbanCols.forEach((r) => { kanbanByCol[r.column] = r.count; });

  const completedThisWeek = (db.prepare(`
    SELECT COUNT(*) as n FROM kanban_cards WHERE \`column\` = 'done' AND updated_at >= ?
  `).get(weekStart) as { n: number }).n;

  // Projects
  const projectStats = db.prepare(`
    SELECT status, COUNT(*) as count FROM projects GROUP BY status
  `).all() as Array<{ status: string; count: number }>;

  // Goals
  const overdueGoals = (db.prepare(`
    SELECT COUNT(*) as n FROM goals WHERE status NOT IN ('done') AND status = 'blocked'
  `).get() as { n: number }).n;

  const goalsInProgress = (db.prepare(`
    SELECT COUNT(*) as n FROM goals WHERE status = 'in_progress'
  `).get() as { n: number }).n;

  // Activity counts today
  const activityToday = (db.prepare(`
    SELECT COUNT(*) as n FROM activity_feed WHERE created_at >= ?
  `).get(todayStart) as { n: number }).n;

  // Approvals pending
  const approvalsPending = (db.prepare(`
    SELECT COUNT(*) as n FROM kanban_cards WHERE \`column\` = 'awaiting_approval'
  `).get() as { n: number }).n;

  // Gateway status
  const gateway = getGatewayClient();

  return NextResponse.json({
    agents: {
      total: agents.length,
      active: activeAgents,
      awaiting_approval: awaitingApproval,
    },
    kanban: {
      by_column: kanbanByCol,
      completed_this_week: completedThisWeek,
      approvals_pending: approvalsPending,
    },
    projects: {
      by_status: projectStats.reduce((acc, r) => ({ ...acc, [r.status]: r.count }), {} as Record<string, number>),
    },
    goals: {
      overdue: overdueGoals,
      in_progress: goalsInProgress,
    },
    activity: {
      today: activityToday,
    },
    gateway: {
      connected: gateway.isConnected(),
    },
    timestamp: Math.floor(Date.now() / 1000),
  });
}
