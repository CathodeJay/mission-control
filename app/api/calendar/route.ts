import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const OPENCLAW_BIN = "/opt/homebrew/bin/openclaw";

export type CronJob = {
  id: string;
  name: string;
  agentId: string | null;
  sessionKey: string | null;
  enabled: boolean;
  schedule: {
    kind: "at" | "every" | "cron";
    at?: string;
    everyMs?: number;
    expr?: string;
    tz?: string;
  };
  scheduleHuman: string;
  nextRunAtMs: number | null;
  nextRunRelative: string | null;
  lastRunAtMs: number | null;
  lastRunRelative: string | null;
  lastStatus: string | null;
  lastError: string | null;
  consecutiveErrors: number;
  payload: {
    kind: string;
    message?: string;
    model?: string;
  } | null;
  sessionTarget: string | null;
  deleteAfterRun: boolean;
  createdAtMs: number;
  updatedAtMs: number;
};

export type CalendarStatus = {
  enabled: boolean;
  storePath: string | null;
  totalJobs: number;
  nextWakeAtMs: number | null;
};

export type CalendarResponse = {
  jobs: CronJob[];
  status: CalendarStatus | null;
  error?: string;
};

function formatDurationHuman(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

function formatScheduleHuman(schedule: CronJob["schedule"]): string {
  if (!schedule) return "Unknown";
  if (schedule.kind === "at" && schedule.at) {
    const d = new Date(schedule.at);
    return `Once at ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (schedule.kind === "every" && schedule.everyMs) {
    return `Every ${formatDurationHuman(schedule.everyMs)}`;
  }
  if (schedule.kind === "cron" && schedule.expr) {
    return `Cron: ${schedule.expr}${schedule.tz ? ` (${schedule.tz})` : ""}`;
  }
  return JSON.stringify(schedule);
}

function formatRelative(ms: number | null | undefined): string | null {
  if (!ms) return null;
  const now = Date.now();
  const delta = ms - now;
  const abs = Math.abs(delta);
  let label: string;
  if (abs < 60_000) label = `${Math.round(abs / 1000)}s`;
  else if (abs < 3_600_000) label = `${Math.round(abs / 60_000)}m`;
  else if (abs < 86_400_000) label = `${Math.round(abs / 3_600_000)}h`;
  else label = `${Math.round(abs / 86_400_000)}d`;
  return delta >= 0 ? `in ${label}` : `${label} ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapJob(job: any): CronJob {
  const state = job.state ?? {};
  const enabled = job.enabled === true;

  const rawStatus = state.lastStatus ?? state.lastRunStatus ?? null;
  const lastStatus = enabled && rawStatus === "disabled" ? null : rawStatus;

  return {
    id: job.id,
    name: job.name ?? job.id,
    agentId: job.agentId ?? null,
    sessionKey: job.sessionKey ?? null,
    enabled,
    schedule: job.schedule ?? { kind: "at" },
    scheduleHuman: formatScheduleHuman(job.schedule ?? {}),
    nextRunAtMs: state.nextRunAtMs ?? null,
    nextRunRelative: formatRelative(state.nextRunAtMs),
    lastRunAtMs: state.lastRunAtMs ?? null,
    lastRunRelative: formatRelative(state.lastRunAtMs),
    lastStatus,
    lastError: state.lastError ?? null,
    consecutiveErrors: state.consecutiveErrors ?? 0,
    payload: job.payload ?? null,
    sessionTarget: job.sessionTarget ?? null,
    deleteAfterRun: job.deleteAfterRun ?? false,
    createdAtMs: job.createdAtMs ?? 0,
    updatedAtMs: job.updatedAtMs ?? 0,
  };
}

async function fetchViaCliSubprocess(): Promise<CalendarResponse> {
  try {
    const [listOut, statusOut] = await Promise.allSettled([
      execAsync(`${OPENCLAW_BIN} cron list --json --all`, { timeout: 15000 }),
      execAsync(`${OPENCLAW_BIN} cron status --json`, { timeout: 15000 }),
    ]);

    let jobs: CronJob[] = [];
    let listError: string | undefined;
    if (listOut.status === "fulfilled") {
      const parsed = JSON.parse(listOut.value.stdout);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobs = (parsed.jobs ?? []).map((j: any) => mapJob(j));
    } else {
      const reason = listOut.reason;
      listError = reason instanceof Error ? reason.message : String(reason);
    }

    let status: CalendarStatus | null = null;
    if (statusOut.status === "fulfilled") {
      const parsed = JSON.parse(statusOut.value.stdout);
      status = {
        enabled: parsed.enabled ?? true,
        storePath: parsed.storePath ?? null,
        totalJobs: parsed.jobs ?? jobs.length,
        nextWakeAtMs: parsed.nextWakeAtMs ?? null,
      };
    }

    // Sort: enabled first, then by nextRunAtMs asc
    jobs.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      const an = a.nextRunAtMs ?? Number.MAX_SAFE_INTEGER;
      const bn = b.nextRunAtMs ?? Number.MAX_SAFE_INTEGER;
      return an - bn;
    });

    return { jobs, status, ...(listError ? { error: listError } : {}) };
  } catch (err) {
    return {
      jobs: [],
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET(): Promise<NextResponse> {
  const data = await fetchViaCliSubprocess();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const { action, jobId } = body as { action: string; jobId?: string };

  if (!action || !jobId) {
    return NextResponse.json({ error: "Missing action or jobId" }, { status: 400 });
  }

  try {
    if (action === "run") {
      await execAsync(`${OPENCLAW_BIN} cron run ${jobId}`, { timeout: 10000 });
      return NextResponse.json({ ok: true });
    }

    if (action === "enable") {
      await execAsync(`${OPENCLAW_BIN} cron enable ${jobId}`, { timeout: 10000 });
      return NextResponse.json({ ok: true });
    }

    if (action === "disable") {
      await execAsync(`${OPENCLAW_BIN} cron disable ${jobId}`, { timeout: 10000 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
