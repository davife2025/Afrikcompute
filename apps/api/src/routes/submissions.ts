import { Router } from "express";
import { z } from "zod";
import type { SubmissionView } from "@afrikcompute/shared";
import { supabase } from "../supabase";
import { env } from "../env";
import { requireAuth } from "../auth/session";
import { decryptText, encryptText, sha256Hex } from "../crypto/vault";
import { reviewContribution } from "../private/review";

export const submissions = Router();

// Requester adds a task to one of their requests.
submissions.post("/requests/:id/tasks", requireAuth, async (req, res) => {
  const body = z.object({ payload: z.record(z.unknown()) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "bad request" });
  const { data: request } = await supabase.from("requests").select("id, requester_id").eq("id", req.params.id).single();
  if (!request || request.requester_id !== req.user!.id) return res.status(404).json({ error: "request not found" });
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ request_id: request.id, payload: body.data.payload })
    .select()
    .single();
  if (error || !task) return res.status(400).json({ error: error?.message ?? "insert failed" });
  res.status(201).json({ id: task.id, status: task.status });
});

// Contributor submits. The text goes through the private review first; only encrypted content is stored.
submissions.post("/tasks/:id/submissions", requireAuth, async (req, res) => {
  const body = z.object({ content: z.string().min(1).max(4000) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "bad request" });
  if (!env.NEAR_AI_API_KEY || !env.NEAR_AI_MODEL) return res.status(503).json({ error: "private review is not configured" });

  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, requests ( language_code, task_type, status )")
    .eq("id", req.params.id)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const request = (task as any)?.requests;
  if (!task || !request || task.status !== "open" || request.status !== "open") {
    return res.status(404).json({ error: "task not available" });
  }

  let review;
  try {
    review = await reviewContribution(
      { NEAR_AI_API_KEY: env.NEAR_AI_API_KEY, NEAR_AI_BASE_URL: env.NEAR_AI_BASE_URL, NEAR_AI_MODEL: env.NEAR_AI_MODEL },
      { text: body.data.content, languageCode: request.language_code, taskType: request.task_type },
    );
  } catch {
    return res.status(502).json({ error: "private review failed" });
  }
  if (!review.verdict.ok) return res.status(422).json(review); // not stored

  const { data: row, error } = await supabase
    .from("submissions")
    .insert({
      task_id: task.id,
      contributor_id: req.user!.id,
      content_encrypted: encryptText(body.data.content, `submission:${task.id}`),
      content_sha256: sha256Hex(body.data.content),
      verification: review,
    })
    .select("id")
    .single();
  if (error || !row) return res.status(500).json({ error: "could not store submission" });
  await supabase.from("tasks").update({ status: "submitted", assigned_to: req.user!.id }).eq("id", task.id);
  res.status(201).json({ id: row.id, ...review });
});

// The contributor, or the owner of the request, can read a submission (decrypted here).
submissions.get("/submissions/:id", requireAuth, async (req, res) => {
  const { data: s } = await supabase
    .from("submissions")
    .select("*, tasks ( id, requests ( requester_id ) )")
    .eq("id", req.params.id)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requesterId = (s as any)?.tasks?.requests?.requester_id;
  if (!s || (s.contributor_id !== req.user!.id && requesterId !== req.user!.id)) {
    return res.status(404).json({ error: "not found" });
  }
  try {
    const view: SubmissionView = {
      id: s.id,
      taskId: s.task_id,
      contributorId: s.contributor_id,
      content: decryptText(s.content_encrypted, `submission:${s.task_id}`),
      status: s.status,
      review: s.verification ?? null,
      createdAt: s.created_at,
    };
    res.json(view);
  } catch {
    res.status(500).json({ error: "could not decrypt submission" });
  }
});
