import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { Payout } from "@afrikcompute/shared";
import { supabase } from "../supabase";
import { env } from "../env";
import { requireAuth } from "../auth/session";
import { createAgentApi } from "../payouts/agentApi";
import { executePayout, type PayoutRecord, type PayoutUpdate } from "../payouts/engine";

export const payouts = Router();
const api = createAgentApi();

/* eslint-disable @typescript-eslint/no-explicit-any */
const toPayout = (r: any): Payout => ({
  id: r.id,
  submissionId: r.submission_id,
  contributorId: r.contributor_id,
  amount: Number(r.amount),
  token: r.token,
  status: r.status,
  txRef: r.tx_ref,
  failureCode: r.failure_code,
  createdAt: r.created_at,
});

async function run(payoutRow: any, recipient: string) {
  const record: PayoutRecord = {
    id: payoutRow.id,
    amount: Number(payoutRow.amount),
    token: payoutRow.token,
    status: payoutRow.status,
    idempotency_key: payoutRow.idempotency_key,
    correlation_id: payoutRow.correlation_id,
  };
  return executePayout(
    {
      api,
      mode: env.PAYOUT_MODE,
      maxAmount: env.PAYOUT_MAX_AMOUNT,
      save: async (u: PayoutUpdate) => {
        await supabase.from("payouts").update({ ...u, updated_at: new Date().toISOString() }).eq("id", record.id);
      },
    },
    record,
    recipient,
  );
}

/** Load a submission with its request owner and the contributor's NEAR account. */
async function loadSubmission(id: string) {
  const { data } = await supabase
    .from("submissions")
    .select("id, status, contributor_id, task_id, tasks ( id, requests ( requester_id, reward_amount, reward_token ) ), profiles ( near_account_id )")
    .eq("id", id)
    .single();
  return data as any;
}

// Requester approves a submission: creates ONE payout row (with its idempotency key stored first), then sends.
payouts.post("/submissions/:id/approve", requireAuth, async (req, res) => {
  const s = await loadSubmission(req.params.id as string);
  const request = s?.tasks?.requests;
  if (!s || request?.requester_id !== req.user!.id) return res.status(404).json({ error: "not found" });
  if (s.status !== "pending") return res.status(409).json({ error: `submission is already ${s.status}` });

  const { data: row, error } = await supabase
    .from("payouts")
    .insert({
      submission_id: s.id,
      contributor_id: s.contributor_id,
      amount: request.reward_amount,
      token: request.reward_token,
      status: "pending",
      idempotency_key: `afrik-${randomUUID()}`, // stored BEFORE any send, never regenerated
    })
    .select()
    .single();
  if (error || !row) return res.status(409).json({ error: "payout already exists for this submission" });

  await supabase.from("submissions").update({ status: "approved" }).eq("id", s.id);
  await supabase.from("tasks").update({ status: "approved" }).eq("id", s.task_id);

  await run(row, s.profiles.near_account_id);
  const { data: fresh } = await supabase.from("payouts").select("*").eq("id", row.id).single();
  res.status(201).json(toPayout(fresh));
});

payouts.post("/submissions/:id/reject", requireAuth, async (req, res) => {
  const s = await loadSubmission(req.params.id as string);
  if (!s || s.tasks?.requests?.requester_id !== req.user!.id) return res.status(404).json({ error: "not found" });
  if (s.status !== "pending") return res.status(409).json({ error: `submission is already ${s.status}` });
  await supabase.from("submissions").update({ status: "rejected" }).eq("id", s.id);
  await supabase.from("tasks").update({ status: "rejected" }).eq("id", s.task_id);
  res.json({ id: s.id, status: "rejected" });
});

// Refresh or resume a payout (same idempotency key, same body). Contributor or request owner.
payouts.get("/payouts/:id", requireAuth, async (req, res) => {
  const { data: row } = await supabase
    .from("payouts")
    .select("*, submissions ( tasks ( requests ( requester_id ) ) ), profiles ( near_account_id )")
    .eq("id", req.params.id)
    .single();
  const r = row as any;
  const requesterId = r?.submissions?.tasks?.requests?.requester_id;
  if (!r || (r.contributor_id !== req.user!.id && requesterId !== req.user!.id)) {
    return res.status(404).json({ error: "not found" });
  }
  if (r.status === "processing" || r.status === "pending") {
    await run(r, r.profiles.near_account_id);
    const { data: fresh } = await supabase.from("payouts").select("*").eq("id", r.id).single();
    return res.json(toPayout(fresh));
  }
  res.json(toPayout(r));
});

payouts.get("/payouts", requireAuth, async (req, res) => {
  const { data: rows } = await supabase
    .from("payouts")
    .select("*")
    .eq("contributor_id", req.user!.id)
    .order("created_at", { ascending: false })
    .limit(50);
  res.json((rows ?? []).map(toPayout));
});
