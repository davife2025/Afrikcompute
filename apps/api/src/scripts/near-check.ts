/**
 * Session 2 check: one completion on NEAR AI Cloud + attestation verification.
 * Run: pnpm --filter @afrikcompute/api near:check
 * Nothing is written to disk or a database. Output goes to the console only.
 */
import { loadNearConfig } from "../near/config";
import { chat, getAttestationReport, listModels } from "../near/client";
import { freshNonce, verifyModelAttestation } from "../near/attestation";

async function main() {
  const cfg = loadNearConfig();

  const models = await listModels(cfg);
  console.log(`Models available (${models.length}):`);
  for (const m of models.slice(0, 40)) console.log(`  - ${m}`);

  const model = cfg.NEAR_AI_MODEL ?? models[0];
  if (!model) throw new Error("No models returned and NEAR_AI_MODEL is not set");
  console.log(`\nUsing model: ${model}${cfg.NEAR_AI_MODEL ? "" : "  (first in list; set NEAR_AI_MODEL to choose)"}`);

  const reply = await chat(cfg, model, "Reply with the single word: ready.");
  console.log(`\nCompletion id: ${reply.id}`);
  console.log(`Completion: ${reply.content.trim()}`);

  const nonce = freshNonce();
  console.log(`\nFetching attestation with fresh nonce ${nonce}`);
  const report = await getAttestationReport(cfg, model, nonce);
  const result = await verifyModelAttestation(report, model, nonce);

  console.log("\nVerified panel");
  for (const c of result.checks) {
    console.log(`  [${c.passed ? "PASS" : "FAIL"}] ${c.label}${c.detail ? ` : ${c.detail}` : ""}`);
  }
  console.log("\nNot checked yet:");
  for (const n of result.notChecked) console.log(`  - ${n}`);
  console.log(`\nOverall: ${result.verified ? "VERIFIED" : "NOT VERIFIED"}`);
  process.exit(result.verified ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
