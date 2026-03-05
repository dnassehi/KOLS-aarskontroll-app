import { NextRequest } from "next/server";

export function logApi(req: NextRequest, route: string, status: number, startedAt: number, extra?: Record<string, unknown>) {
  const ms = Date.now() - startedAt;
  const payload = {
    t: new Date().toISOString(),
    route,
    method: req.method,
    status,
    ms,
    ip: req.headers.get("x-forwarded-for") || "-",
    ...extra,
  };
  // Lightweight structured logging for debugging/perf in app logs
  console.log("[api]", JSON.stringify(payload));
}
