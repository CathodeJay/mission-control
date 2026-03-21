"use client";
import { useEffect, useState, useCallback } from "react";
import { CalendarClock, Clock, CheckCircle, AlertCircle, Loader2, ToggleLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CronJob, CalendarResponse } from "@/app/api/calendar/route";

const REFRESH_INTERVAL = 30_000;

function JobStatusDot({ status }: { status: string | null }) {
  if (!status || status === "idle") return <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />;
  if (status === "ok") return <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />;
  if (status === "error") return <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />;
  if (status === "running") return <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />;
}

function JobRow({ job }: { job: CronJob }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <JobStatusDot status={job.lastStatus} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{job.name}</p>
        <p className="text-xs text-slate-500 truncate">{job.scheduleHuman}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        {job.enabled && job.nextRunRelative ? (
          <span className="text-xs font-mono text-amber-400">{job.nextRunRelative}</span>
        ) : (
          <span className="text-xs text-slate-600">disabled</span>
        )}
      </div>
    </div>
  );
}

export function UpcomingTasks() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar");
      const json: CalendarResponse = await res.json();
      setJobs(json.jobs ?? []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Show top 3: enabled first, then by next run
  const preview = jobs.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-amber-400" />
          Upcoming Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6">
            <CalendarClock className="w-6 h-6 text-slate-600" />
            <p className="text-xs text-slate-500">No scheduled jobs</p>
          </div>
        )}

        {!loading && preview.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}

        {!loading && jobs.length > 0 && (
          <a
            href="/calendar"
            className="block text-xs text-amber-400 hover:text-amber-300 text-center mt-2 transition-colors pt-1"
          >
            View all {jobs.length} job{jobs.length !== 1 ? "s" : ""} →
          </a>
        )}
      </CardContent>
    </Card>
  );
}
