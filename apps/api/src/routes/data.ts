import { Router } from "express";
import { z } from "zod";
import { supabase } from "../supabase";
import { requireAuth } from "../auth/session";
import { toLanguage, toProfile, toRequest } from "../mappers";

export const data = Router();

data.get("/languages", async (_req, res) => {
  const { data: rows, error } = await supabase.from("languages").select("*").order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json((rows ?? []).map(toLanguage));
});

data.get("/me", requireAuth, async (req, res) => {
  const { data: row, error } = await supabase.from("profiles").select("*").eq("id", req.user!.id).single();
  if (error || !row) return res.status(404).json({ error: "profile not found" });
  res.json(toProfile(row));
});

const meBody = z.object({
  role: z.enum(["contributor", "requester", "both"]).optional(),
  locale: z.enum(["en", "ha", "yo", "ig"]).optional(),
});

data.patch("/me", requireAuth, async (req, res) => {
  const body = meBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "bad request" });
  const { data: row, error } = await supabase
    .from("profiles")
    .update(body.data)
    .eq("id", req.user!.id)
    .select()
    .single();
  if (error || !row) return res.status(500).json({ error: error?.message ?? "update failed" });
  res.json(toProfile(row));
});

data.get("/requests", async (_req, res) => {
  const { data: rows, error } = await supabase
    .from("requests")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json((rows ?? []).map(toRequest));
});

const requestBody = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  languageCode: z.string().min(2).max(8),
  taskType: z.enum(["label", "translate", "review", "transcribe"]),
  rewardAmount: z.number().positive(),
  rewardToken: z.string().min(1).max(12).default("USDC"),
});

data.post("/requests", requireAuth, async (req, res) => {
  const body = requestBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "bad request" });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", req.user!.id).single();
  if (!me || (me.role !== "requester" && me.role !== "both")) {
    return res.status(403).json({ error: "only requesters can post requests" });
  }

  const b = body.data;
  const { data: row, error } = await supabase
    .from("requests")
    .insert({
      requester_id: req.user!.id,
      title: b.title,
      description: b.description ?? null,
      language_code: b.languageCode,
      task_type: b.taskType,
      reward_amount: b.rewardAmount,
      reward_token: b.rewardToken,
    })
    .select()
    .single();
  if (error || !row) return res.status(400).json({ error: error?.message ?? "insert failed" });
  res.status(201).json(toRequest(row));
});
