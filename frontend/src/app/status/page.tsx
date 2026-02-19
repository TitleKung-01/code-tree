"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, RefreshCw, Globe, Database, Shield, ScrollText } from "lucide-react";
import Link from "next/link";

type ServiceStatus = "loading" | "ok" | "error";

interface HealthResponse {
  status: string;
  service: string;
}

export default function StatusPage() {
  const [backendStatus, setBackendStatus] = useState<ServiceStatus>("loading");
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_GRPC_URL || "http://localhost:8080";

  async function checkHealth() {
    setChecking(true);
    const start = performance.now();
    try {
      const res = await fetch(`${backendUrl}/health`, { cache: "no-store" });
      const data: HealthResponse = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setBackendStatus(data.status === "ok" ? "ok" : "error");
    } catch {
      setBackendStatus("error");
      setLatency(null);
    }
    setLastChecked(new Date());
    setChecking(false);
  }

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusConfig = {
    loading: { color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Checking..." },
    ok: { color: "text-green-500", bg: "bg-green-500/10", label: "Operational" },
    error: { color: "text-red-500", bg: "bg-red-500/10", label: "Down" },
  };

  const overall = backendStatus;
  const config = statusConfig[overall];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Header */}
      <div className="text-center">
        <div className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${config.bg}`}>
          <Activity className={`h-8 w-8 ${config.color}`} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${config.bg} ${config.color}`}>
          {overall === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : overall === "error" ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4 animate-spin" />
          )}
          {overall === "ok" ? "All Systems Operational" : overall === "error" ? "Service Disruption" : "Checking..."}
        </div>
      </div>

      {/* Services */}
      <div className="mt-10 space-y-3">
        <ServiceRow
          icon={<Globe className="h-4 w-4" />}
          name="Backend API"
          description={backendUrl}
          status={backendStatus}
          latency={latency}
        />
        <ServiceRow
          icon={<Database className="h-4 w-4" />}
          name="Database"
          description="Supabase PostgreSQL"
          status={backendStatus}
          note="Via backend health check"
        />
        <ServiceRow
          icon={<Shield className="h-4 w-4" />}
          name="Authentication"
          description="Supabase Auth"
          status={backendStatus}
          note="Via backend health check"
        />
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {lastChecked
            ? `Last checked: ${lastChecked.toLocaleTimeString("th-TH")}`
            : "Checking..."}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/status/log"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-colors hover:bg-accent"
          >
            <ScrollText className="h-3 w-3" />
            Health Log
          </Link>
          <button
            onClick={checkHealth}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-colors hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({
  icon,
  name,
  description,
  status,
  latency,
  note,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  status: ServiceStatus;
  latency?: number | null;
  note?: string;
}) {
  const dot = {
    loading: "bg-yellow-500 animate-pulse",
    ok: "bg-green-500",
    error: "bg-red-500",
  };

  const label = {
    loading: "Checking",
    ok: "Operational",
    error: "Down",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {note || description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {latency != null && status === "ok" && (
          <span className="text-xs text-muted-foreground">{latency}ms</span>
        )}
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${dot[status]}`} />
          <span className="text-xs font-medium">{label[status]}</span>
        </div>
      </div>
    </div>
  );
}
