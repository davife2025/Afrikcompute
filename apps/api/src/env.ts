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
  // Optional until the sessions that use them.
  HF_TOKEN: z.string().optional(),
  NEAR_AI_API_KEY: z.string().optional(),
  NEAR_AI_BASE_URL: z.string().url().default("https://cloud-api.near.ai/v1"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
