"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Pause,
  Play,
  Trash2,
  Clock,
  Zap,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type LogStatus = "ok" | "error";

interface LogEntry {
  id: number;
  timestamp: Date;
  status: LogStatus;
  latency: number | null;
  statusCode: number | null;
  error?: string;
}

interface Stats {
  total: number;
  ok: number;
  errors: number;
  uptimePercent: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
}

const INTERVALS = [
  { label: "5s", value: 5_000 },
  { label: "10s", value: 10_000 },
  { label: "30s", value: 30_000 },
  { label: "1m", value: 60_000 },
];

const MAX_LOG_ENTRIES = 200;
const MAX_CHART_BARS = 60;

export default function HealthLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(true);
  const [interval, setIntervalMs] = useState(5_000);
  const [checking, setChecking] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const backendUrl =
    process.env.NEXT_PUBLIC_GRPC_URL || "http://localhost:8080";

  const ping = useCallback(async () => {
    setChecking(true);
    const start = performance.now();
    let entry: LogEntry;

    try {
      const res = await fetch(`${backendUrl}/health`, { cache: "no-store" });
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      entry = {
        id: ++idRef.current,
        timestamp: new Date(),
        status: data.status === "ok" ? "ok" : "error",
        latency: elapsed,
        statusCode: res.status,
      };
    } catch (err) {
      entry = {
        id: ++idRef.current,
        timestamp: new Date(),
        status: "error",
        latency: null,
        statusCode: null,
        error: err instanceof Error ? err.message : "Network error",
      };
    }

    setLogs((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
    setChecking(false);
  }, [backendUrl]);

  useEffect(() => {
    const timeout = setTimeout(ping, 0);
    if (!running) return () => clearTimeout(timeout);
    const id = globalThis.setInterval(ping, interval);
    return () => {
      clearTimeout(timeout);
      globalThis.clearInterval(id);
    };
  }, [running, interval, ping]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const stats: Stats = (() => {
    if (logs.length === 0)
      return {
        total: 0,
        ok: 0,
        errors: 0,
        uptimePercent: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
      };

    const ok = logs.filter((l) => l.status === "ok");
    const latencies = ok.map((l) => l.latency!).filter(Boolean);

    return {
      total: logs.length,
      ok: ok.length,
      errors: logs.length - ok.length,
      uptimePercent: Math.round((ok.length / logs.length) * 100 * 10) / 10,
      avgLatency: latencies.length
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
      minLatency: latencies.length ? Math.min(...latencies) : 0,
      maxLatency: latencies.length ? Math.max(...latencies) : 0,
    };
  })();

  const chartData = logs.slice(-MAX_CHART_BARS);
  const chartMax = Math.max(
    ...chartData.map((l) => l.latency ?? 0),
    100
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Navigation */}
      <Link
        href="/status"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Status
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time health check monitoring &mdash;{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {backendUrl}/health
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {checking && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <div
            className={`h-3 w-3 rounded-full ${
              logs.length === 0
                ? "animate-pulse bg-yellow-500"
                : logs[logs.length - 1].status === "ok"
                  ? "bg-green-500"
                  : "bg-red-500"
            }`}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Uptime"
          value={stats.total > 0 ? `${stats.uptimePercent}%` : "—"}
          sub={`${stats.ok}/${stats.total} checks`}
          color={
            stats.uptimePercent >= 99
              ? "text-green-500"
              : stats.uptimePercent >= 90
                ? "text-yellow-500"
                : "text-red-500"
          }
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Avg Latency"
          value={stats.avgLatency > 0 ? `${stats.avgLatency}ms` : "—"}
          sub={
            stats.minLatency > 0
              ? `${stats.minLatency}–${stats.maxLatency}ms`
              : "no data"
          }
          color="text-blue-500"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Success"
          value={String(stats.ok)}
          sub="checks passed"
          color="text-green-500"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label="Errors"
          value={String(stats.errors)}
          sub="checks failed"
          color={stats.errors > 0 ? "text-red-500" : "text-muted-foreground"}
        />
      </div>

      {/* Latency Chart */}
      {chartData.length > 1 && (
        <div className="mb-6 rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Latency Timeline
            </div>
            <span className="text-xs text-muted-foreground">
              last {chartData.length} checks
            </span>
          </div>
          <div className="flex items-end gap-[2px]" style={{ height: 80 }}>
            {chartData.map((entry) => {
              const h =
                entry.latency != null
                  ? Math.max((entry.latency / chartMax) * 100, 4)
                  : 100;
              return (
                <div
                  key={entry.id}
                  className="group relative flex-1 cursor-default"
                  style={{ height: "100%" }}
                >
                  <div
                    className={`absolute bottom-0 w-full rounded-sm transition-all ${
                      entry.status === "ok"
                        ? "bg-green-500/60 group-hover:bg-green-500"
                        : "bg-red-500/60 group-hover:bg-red-500"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md group-hover:block">
                    {entry.latency != null ? `${entry.latency}ms` : "err"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            {running ? (
              <>
                <Pause className="h-3 w-3" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" /> Resume
              </>
            )}
          </button>
          <button
            onClick={ping}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${checking ? "animate-spin" : ""}`}
            />
            Ping Now
          </button>
          <button
            onClick={() => setLogs([])}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          {INTERVALS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setIntervalMs(opt.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                interval === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-2 border-b bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Timestamp</span>
          <span className="text-center">Status</span>
          <span className="text-center">Code</span>
          <span className="text-right">Latency</span>
        </div>

        <div className="max-h-112 overflow-y-auto">
          {logs.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              Waiting for first health check...
            </div>
          )}

          {logs.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[1fr_5rem_5rem_5rem] items-center gap-2 border-b border-border/50 px-4 py-2 text-xs last:border-0 hover:bg-muted/30"
            >
              <span className="font-mono text-muted-foreground">
                {entry.timestamp.toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
                <span className="ml-1 text-[10px] opacity-50">
                  .{String(entry.timestamp.getMilliseconds()).padStart(3, "0")}
                </span>
              </span>

              <span className="text-center">
                {entry.status === "ok" ? (
                  <span className="inline-flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-3 w-3" /> OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-500">
                    <XCircle className="h-3 w-3" /> ERR
                  </span>
                )}
              </span>

              <span
                className={`text-center font-mono ${
                  entry.statusCode === 200
                    ? "text-green-500"
                    : entry.statusCode
                      ? "text-yellow-500"
                      : "text-red-500"
                }`}
              >
                {entry.statusCode ?? "—"}
              </span>

              <span className="text-right font-mono">
                {entry.latency != null ? (
                  <span
                    className={
                      entry.latency < 200
                        ? "text-green-500"
                        : entry.latency < 500
                          ? "text-yellow-500"
                          : "text-red-500"
                    }
                  >
                    {entry.latency}ms
                  </span>
                ) : (
                  <span className="text-red-500">—</span>
                )}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        {running ? (
          <>
            Auto-checking every{" "}
            <strong>{interval < 60_000 ? `${interval / 1000}s` : "1m"}</strong>
            {" · "}Max {MAX_LOG_ENTRIES} entries
          </>
        ) : (
          "Paused — click Resume to continue"
        )}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
