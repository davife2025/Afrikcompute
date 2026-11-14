import { Router } from "express";
import type { HealthResponse } from "@afrikcompute/shared";
import { env } from "../env";

export const health = Router();

async function supabaseReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY },
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

health.get("/health", async (_req, res) => {
  const body: HealthResponse = {
    status: "ok",
    service: "api",
    time: new Date().toISOString(),
    supabase: (await supabaseReachable()) ? "reachable" : "unreachable",
  };
  res.json(body);
});
