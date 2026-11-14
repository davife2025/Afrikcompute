/** PRIVATE REVIEW endpoint. Keeps nothing: see the rules at the top of review.ts. */
import { Router } from "express";
import { z } from "zod";
import { env } from "../env";
import { requireAuth } from "../auth/session";
import { reviewContribution } from "./review";

export const privateRoutes = Router();

const body = z.object({
  text: z.string().min(1).max(4000),
  languageCode: z.string().min(2).max(8),
  taskType: z.enum(["label", "translate", "review", "transcribe"]),
});

privateRoutes.post("/private/review", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const parsed = body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad request" });
  if (!env.NEAR_AI_API_KEY || !env.NEAR_AI_MODEL) {
    return res.status(503).json({ error: "private review is not configured" });
  }
  try {
    const result = await reviewContribution(
      { NEAR_AI_API_KEY: env.NEAR_AI_API_KEY, NEAR_AI_BASE_URL: env.NEAR_AI_BASE_URL, NEAR_AI_MODEL: env.NEAR_AI_MODEL },
      parsed.data,
    );
    res.json(result);
  } catch {
    // Deliberately no error details or request content in logs or responses.
    res.status(502).json({ error: "private review failed" });
  }
});
