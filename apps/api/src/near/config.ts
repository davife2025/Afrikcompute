import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const schema = z.object({
  NEAR_AI_API_KEY: z.string().min(1, "NEAR_AI_API_KEY is empty. Put it in the root .env"),
  NEAR_AI_BASE_URL: z.string().url().default("https://cloud-api.near.ai/v1"),
  /** Optional. If empty, the check script lists models and uses the first one. */
  NEAR_AI_MODEL: z.string().optional(),
});

export function loadNearConfig() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export type NearConfig = ReturnType<typeof loadNearConfig>;
