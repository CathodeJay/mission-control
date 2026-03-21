"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Calendar, Clock, Play, ToggleLeft, ToggleRight,
  AlertCircle, CheckCircle, Loader2, RefreshCw, Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CronJob, CalendarResponse, CalendarStatus } from "@/app/api/calendar/route";

const REFRESH_INTERVAL = 30_000;

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="default">Idle</Badge>;
  if (status === "ok") return (
    <Badge variant="success">
      <CheckCircle className="w-3 h-3 mr-1" /> OK
    </Badge>
  );
  if (status === "error") return (
    <Badge variant="danger">
      <AlertCircle className="w-3 h-3 mr-1" /> Error
    </Badge>
  );
  if (status === "running") return (
    <Badge variant="warning">
      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running
    </Badge>
  );
  if (status === "skipped") return <Badge variant="outline">Skipped</Badge>;
  if (status === "disabled") return <Badge variant="outline">Disabled</Badge>;
  return <Badge variant="default">{status}</Badge>;
}

function ScheduleIcon({ job }: { job: CronJob }) {
  const cls = job.enabled
    ? "text-amber-400 bg-amber-400/10"
    : "text-slate-500 bg-slate-500/10";
  return (
    <div className={`p-2 rounded-lg ${cls}`}>
      <Calendar className="w-4 h-4" />
    </div>
  );
}

function JobCard({
  job,
  onToggle,
  onRunNow,
}: {
  job: CronJob;
  onToggle: (id: string, enable: boolean) => Promise<void>;
  onRunNow: (id: string) => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(job.id, !job.enabled);
    } finally {
      setToggling(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await onRunNow(job.id);
    } finally {
      setRunning(false);
    }
  };

  const statusColor =
    !job.enabled
      ? "border-white/5"
      : job.lastStatus === "error"
      ? "border-red-500/30"
      : job.lastStatus === "ok"
      ? "border-emerald-500/20"
      : "border-amber-500/20";

  return (
    <Card className={`border ${statusColor} transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <ScheduleIcon job={job} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-100 truncate">{job.name}</h3>
              {!job.enabled && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                  Disabled
                </span>
              )}
              {job.deleteAfterRun && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-violet-900/40 text-violet-400">
                  One-shot
                </span>
              )}
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-400">{job.scheduleHuman}</span>
            </div>

            {/* Next / Last run */}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {job.enabled && job.nextRunRelative && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Next:</span>
                  <span className="text-xs font-mono text-amber-400">{job.nextRunRelative}</span>
                </div>
              )}
              {job.lastRunRelative && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Last run:</span>
                  <span className="text-xs font-mono text-slate-400">{job.lastRunRelative}</span>
                </div>
              )}
              {job.lastStatus && (
                <StatusBadge status={job.lastStatus} />
              )}
              {job.consecutiveErrors > 1 && (
                <span className="text-xs text-red-400 font-mono">{job.consecutiveErrors}× errors</span>
              )}
            </div>

            {/* Last error */}
            {job.lastError && (
              <div className="mt-2 flex items-start gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400 font-mono break-all">{job.lastError}</p>
              </div>
            )}

            {/* Agent / target info */}
            {(job.agentId || job.sessionTarget) && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {job.agentId && (
                  <span className="text-xs text-slate-500">
                    Agent: <span className="text-violet-400 font-mono">{job.agentId}</span>
                  </span>
                )}
                {job.sessionTarget && (
                  <span className="text-xs text-slate-500">
                    Target: <span className="text-blue-400 font-mono">{job.sessionTarget}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRunNow}
              disabled={running}
              title="Run now"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors disabled:opacity-40"
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleToggle}
              disabled={toggling}
              title={job.enabled ? "Disable" : "Enable"}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : job.enabled ? (
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SchedulerStatus({ status }: { status: CalendarStatus | null }) {
  if (!status) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-2 h-2 rounded-full ${
          status.enabled ? "bg-emerald-400" : "bg-red-400"
        }`}
      />
      <span className="text-slate-400">
        Scheduler {status.enabled ? "enabled" : "disabled"} · {status.totalJobs} job{status.totalJobs !== 1 ? "s" : ""}
      </span>
      {status.nextWakeAtMs && (
        <span className="text-slate-500">
          · Next wake: {new Date(status.nextWakeAtMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch("/api/calendar");
      const json: CalendarResponse = await res.json();
      setData(json);
      setError(json.error ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggle = async (id: string, enable: boolean) => {
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: enable ? "enable" : "disable", jobId: id }),
    });
    await fetchData();
  };

  const handleRunNow = async (id: string) => {
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run", jobId: id }),
    });
    await fetchData();
  };

  const jobs = data?.jobs ?? [];
  const enabledJobs = jobs.filter((j) => j.enabled);
  const disabledJobs = jobs.filter((j) => !j.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Scheduled cron jobs via Gateway</p>
        </div>
        <div className="flex items-center gap-3">
          <SchedulerStatus status={data?.status ?? null} />
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Gateway error</p>
            <p className="text-xs text-red-400/70 font-mono mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="p-4 rounded-2xl bg-amber-400/10">
            <Calendar className="w-8 h-8 text-amber-400/60" />
          </div>
          <p className="text-slate-400 font-medium">No scheduled jobs</p>
          <p className="text-slate-500 text-sm text-center max-w-sm">
            Use <code className="text-violet-400 font-mono bg-violet-400/10 px-1 rounded">openclaw cron add</code> to schedule recurring agent tasks.
          </p>
        </div>
      )}

      {/* Active jobs */}
      {!loading && enabledJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Active ({enabledJobs.length})
          </h2>
          {enabledJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onToggle={handleToggle}
              onRunNow={handleRunNow}
            />
          ))}
        </div>
      )}

      {/* Disabled jobs */}
      {!loading && disabledJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
            Disabled ({disabledJobs.length})
          </h2>
          {disabledJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onToggle={handleToggle}
              onRunNow={handleRunNow}
            />
          ))}
        </div>
      )}

      {/* Auto-refresh notice */}
      {!loading && jobs.length > 0 && (
        <p className="text-xs text-slate-600 text-center">
          Auto-refreshes every 30s
        </p>
      )}
    </div>
  );
}
