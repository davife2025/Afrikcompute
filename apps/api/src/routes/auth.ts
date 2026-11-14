import { Router } from "express";
import { z } from "zod";
import type { AuthSession } from "@afrikcompute/shared";
import { supabase } from "../supabase";
import { createChallenge, issueSessionToken } from "../auth/session";
import { verifyLogin } from "../auth/login";
import { isFullAccessKey } from "../auth/nearRpc";
import { toProfile } from "../mappers";

export const auth = Router();

auth.post("/auth/challenge", (_req, res) => {
  res.json(createChallenge());
});

const verifyBody = z.object({
  accountId: z.string(),
  publicKey: z.string(),
  signature: z.string(),
  nonce: z.string().regex(/^[0-9a-f]{64}$/),
  exp: z.number().int(),
  token: z.string(),
});

auth.post("/auth/verify", async (req, res) => {
  const body = verifyBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "bad request" });

  try {
    const accountId = await verifyLogin(body.data, isFullAccessKey);
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ near_account_id: accountId }, { onConflict: "near_account_id" })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "profile upsert failed");

    const profile = toProfile(data);
    const session: AuthSession = {
      token: await issueSessionToken({ id: profile.id, nearAccountId: profile.nearAccountId }),
      profile,
    };
    res.json(session);
  } catch (e) {
    res.status(401).json({ error: e instanceof Error ? e.message : "sign-in failed" });
  }
});
