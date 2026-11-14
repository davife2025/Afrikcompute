import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// Load the root .env (works from src/ in dev and dist/ after build).
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Signs session tokens and sign-in challenges. Use a long random string (32+ chars).
  API_JWT_SECRET: z.string().min(32),
  // Must match the `recipient` the web app passes to the wallet's signMessage.
  AUTH_RECIPIENT: z.string().min(1).default("afrikcompute"),
  NEAR_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
  NEAR_RPC_URL: z.string().url().optional(),
  // 32 random bytes, base64. Encrypts submissions at rest (AES-256-GCM).
  DATA_ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "must be 32 bytes, base64 encoded"),
  // Optional until the sessions that use them.
  HF_TOKEN: z.string().optional(),
  NEAR_AI_API_KEY: z.string().optional(),
  NEAR_AI_BASE_URL: z.string().url().default("https://cloud-api.near.ai/v1"),
  NEAR_AI_MODEL: z.string().optional(),
  // Payouts through the NEAR Intents Agent API (Session 5). MAINNET ONLY: real funds in live mode.
  NEAR_INTENTS_AGENT_API_KEY: z.string().optional(),
  NEAR_INTENTS_AGENT_API_URL: z.string().url().default("https://api.agentsonintents.com"),
  PAYOUT_AGENT_ID: z.string().optional(),
  PAYOUT_GRANT_TOKEN: z.string().optional(),
  // simulate = never calls the Agent API, records payouts as "simulated". live = moves real funds.
  PAYOUT_MODE: z.enum(["simulate", "live"]).default("simulate"),
  // Hard cap per payout, in token units (app-level guard on top of the owner-signed policy).
  PAYOUT_MAX_AMOUNT: z.coerce.number().positive().default(5),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
