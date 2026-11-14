import type { NearConfig } from "./config";

/** Thin client for NEAR AI Cloud's OpenAI-compatible API. Keeps nothing. */

async function getJson<T>(cfg: NearConfig, pathAndQuery: string): Promise<T> {
  const res = await fetch(`${cfg.NEAR_AI_BASE_URL}${pathAndQuery}`, {
    headers: { Authorization: `Bearer ${cfg.NEAR_AI_API_KEY}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`GET ${pathAndQuery} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export async function listModels(cfg: NearConfig): Promise<string[]> {
  const body = await getJson<{ data: { id: string }[] }>(cfg, "/models");
  return body.data.map((m) => m.id);
}

export interface ChatResult {
  id: string;
  content: string;
}

export async function chat(cfg: NearConfig, model: string, prompt: string): Promise<ChatResult> {
  const res = await fetch(`${cfg.NEAR_AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.NEAR_AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], stream: false }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`chat/completions failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { id: string; choices: { message: { content: string } }[] };
  return { id: body.id, content: body.choices[0]?.message.content ?? "" };
}

export interface ModelAttestation {
  signing_address: string;
  request_nonce: string;
  intel_quote: string;
  nvidia_payload: string;
}

export interface AttestationReport {
  model_attestations: ModelAttestation[];
}

export function getAttestationReport(cfg: NearConfig, model: string, nonceHex: string) {
  const q = new URLSearchParams({ model, signing_algo: "ecdsa", nonce: nonceHex });
  return getJson<AttestationReport>(cfg, `/attestation/report?${q.toString()}`);
}
