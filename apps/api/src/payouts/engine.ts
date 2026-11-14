import type { PayoutStatus } from "@afrikcompute/shared";
import { AgentApiError, AgentApiUncertainError, type AgentApi } from "./agentApi";
import { PAYOUT_ASSETS, toAtomic } from "./amounts";

export interface PayoutRecord {
  id: string;
  amount: number;
  token: string;
  status: PayoutStatus;
  idempotency_key: string | null;
  correlation_id: string | null;
}

export interface PayoutUpdate {
  status: PayoutStatus;
  correlation_id?: string | null;
  failure_code?: string | null;
  tx_ref?: string | null;
}

export interface EngineDeps {
  api: AgentApi | null;
  mode: "simulate" | "live";
  maxAmount: number;
  /** Persist an update to the payout row. */
  save: (update: PayoutUpdate) => Promise<void>;
}

/** Layers whose refusals provably sent nothing. */
const NOTHING_SENT_LAYERS = new Set(["request", "auth", "grant", "policy", "budget", "balance"]);

export function mapStatus(status: string): PayoutStatus {
  switch (status) {
    case "SUCCESS":
      return "sent";
    case "FAILED":
    case "REFUNDED":
      return "failed";
    case "NEEDS_REVIEW":
      return "needs_review";
    default:
      // QUEUED, PROCESSING, PENDING_APPROVAL, UNCERTAIN: keep polling the SAME correlation id.
      return "processing";
  }
}

/**
 * Send (or resume) one payout. Safe to call repeatedly: it reuses the stored idempotency key and,
 * once a correlation id exists, only polls. It NEVER creates a new key for an existing payout.
 */
export async function executePayout(deps: EngineDeps, payout: PayoutRecord, recipient: string): Promise<PayoutStatus> {
  if (["sent", "failed", "simulated"].includes(payout.status)) return payout.status;

  const asset = PAYOUT_ASSETS[payout.token];
  if (!asset) {
    await deps.save({ status: "failed", failure_code: "unsupported_token" });
    return "failed";
  }
  if (payout.amount > deps.maxAmount) {
    await deps.save({ status: "failed", failure_code: "above_app_cap" });
    return "failed";
  }
  if (deps.mode === "simulate") {
    await deps.save({ status: "simulated", tx_ref: "simulated" });
    return "simulated";
  }
  if (!deps.api) {
    await deps.save({ status: "needs_review", failure_code: "payouts_not_configured" });
    return "needs_review";
  }
  if (!payout.idempotency_key) throw new Error("payout has no idempotency key; it must be stored before sending");

  let correlationId = payout.correlation_id;
  if (!correlationId) {
    try {
      const sent = await deps.api.transfer(
        { asset: asset.assetId, amount: toAtomic(payout.amount, asset.decimals), recipient },
        payout.idempotency_key,
      );
      correlationId = sent.correlation_id;
      await deps.save({ status: "processing", correlation_id: correlationId });
    } catch (e) {
      if (e instanceof AgentApiError) {
        const nothingSent = e.layer !== null && NOTHING_SENT_LAYERS.has(e.layer);
        await deps.save({ status: nothingSent ? "failed" : "needs_review", failure_code: e.code });
        return nothingSent ? "failed" : "needs_review";
      }
      if (e instanceof AgentApiUncertainError) {
        // May have been accepted. Keep the key; retry later with the same key and body.
        await deps.save({ status: "processing" });
        return "processing";
      }
      throw e;
    }
  }

  const st = await deps.api.getStatus(correlationId, 25_000);
  const mapped = mapStatus(st.status);
  await deps.save({
    status: mapped,
    failure_code: st.failure_code,
    tx_ref: mapped === "sent" ? correlationId : undefined,
  });
  return mapped;
}
