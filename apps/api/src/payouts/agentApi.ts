import { env } from "../env";

/**
 * Minimal client for the NEAR Intents Agent API, over plain HTTPS (the docs say every endpoint is plain JSON).
 * We skip the official SDK because it needs Node 24+ and is ESM-only.
 * Response error shapes below are handled defensively: confirm against the docs' Status & Errors page.
 */

export interface TransferRequest {
  asset: string; // asset id, e.g. nep141:usdt.tether-token.near
  amount: string; // atomic units
  recipient: string; // NEAR Intents account, e.g. alice.near
}

export interface ExecutionStatus {
  correlation_id: string;
  status: string; // QUEUED | PROCESSING | PENDING_APPROVAL | SUCCESS | FAILED | REFUNDED | UNCERTAIN | NEEDS_REVIEW
  failure_code: string | null;
}

export class AgentApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public layer: string | null,
  ) {
    super(`agent api error ${status} ${code}`);
  }
}

/** Thrown when the request may or may not have reached the API (network failure, timeout). */
export class AgentApiUncertainError extends Error {}

export interface AgentApi {
  transfer(req: TransferRequest, idempotencyKey: string): Promise<{ correlation_id: string }>;
  getStatus(correlationId: string, waitMs: number): Promise<ExecutionStatus>;
}

export function createAgentApi(): AgentApi | null {
  const { NEAR_INTENTS_AGENT_API_KEY: apiKey, PAYOUT_AGENT_ID: agentId, PAYOUT_GRANT_TOKEN: grant } = env;
  if (!apiKey || !agentId || !grant) return null;
  const base = env.NEAR_INTENTS_AGENT_API_URL;

  return {
    async transfer(req, idempotencyKey) {
      let res: Response;
      try {
        res = await fetch(`${base}/v1/agents/${encodeURIComponent(agentId)}/transfer`, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "X-Grant-Token": grant,
            "Idempotency-Key": idempotencyKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req),
          signal: AbortSignal.timeout(150_000),
          redirect: "error",
        });
      } catch {
        throw new AgentApiUncertainError("transfer request may have been sent");
      }
      const body = (await res.json().catch(() => ({}))) as {
        correlation_id?: string;
        code?: string;
        errors?: { code?: string; layer?: string }[];
      };
      if (res.ok && body.correlation_id) return { correlation_id: body.correlation_id };
      if (res.status >= 500) throw new AgentApiUncertainError(`server error ${res.status}`);
      throw new AgentApiError(res.status, body.errors?.[0]?.code ?? body.code ?? "unknown", body.errors?.[0]?.layer ?? null);
    },

    async getStatus(correlationId, waitMs) {
      const q = new URLSearchParams({ correlation_id: correlationId, wait_ms: String(Math.min(waitMs, 30_000)) });
      const res = await fetch(`${base}/v1/status?${q.toString()}`, {
        headers: { "X-API-Key": apiKey },
        signal: AbortSignal.timeout(65_000),
        redirect: "error",
      });
      if (!res.ok) throw new Error(`status failed: ${res.status}`);
      const b = (await res.json()) as ExecutionStatus;
      return { correlation_id: b.correlation_id, status: b.status, failure_code: b.failure_code ?? null };
    },
  };
}
