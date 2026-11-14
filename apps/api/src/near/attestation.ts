import { randomBytes } from "node:crypto";
import { getCollateralAndVerify } from "@phala/dcap-qvl";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { VerificationCheck, VerificationResult } from "@afrikcompute/shared";
import type { AttestationReport, ModelAttestation } from "./client";

/** Fresh random 32-byte nonce, hex (64 chars). Create a new one for every verification. */
export const freshNonce = () => randomBytes(32).toString("hex");

// Intel TCB statuses we accept. Anything else is reported as a failed check, with the status shown.
const ACCEPTED_TCB = ["UpToDate", "SWHardeningNeeded"];

// NVIDIA Remote Attestation Service. UNTESTED against the live service: confirm these URLs against NEAR's docs.
const NRAS_ATTEST_URL = "https://nras.attestation.nvidia.com/v3/attest/gpu";
const NRAS_JWKS_URL = "https://nras.attestation.nvidia.com/.well-known/jwks.json";

const hex = (s: string) => Buffer.from(s.replace(/^0x/i, ""), "hex");

/** Byte offsets inside a TDX v4 quote: 48-byte header, then the 584-byte TD report body. */
const OFFSET = { tdAttributes: 48 + 120, reportData: 48 + 520 } as const;

function pass(id: string, label: string, detail?: string): VerificationCheck {
  return { id, label, passed: true, detail };
}
function fail(id: string, label: string, detail: string): VerificationCheck {
  return { id, label, passed: false, detail };
}

async function checkGpu(att: ModelAttestation, nonce: string): Promise<VerificationCheck> {
  const label = "NVIDIA GPU attestation (NRAS)";
  try {
    const res = await fetch(NRAS_ATTEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: att.nvidia_payload,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return fail("gpu", label, `NRAS returned ${res.status}`);
    const body = (await res.json()) as [[string, string], Record<string, string>];
    const overall = body[0][1];
    const jwks = createRemoteJWKSet(new URL(NRAS_JWKS_URL));
    const { payload } = await jwtVerify(overall, jwks);
    if (payload["x-nvidia-overall-att-result"] !== true) {
      return fail("gpu", label, "NRAS overall attestation result is not true");
    }
    const echoed = payload["eat_nonce"];
    if (typeof echoed === "string" && echoed.toLowerCase() !== nonce.toLowerCase()) {
      return fail("gpu", label, "GPU evidence nonce does not match our nonce");
    }
    return pass("gpu", label, "NRAS token signature and overall result verified");
  } catch (e) {
    return fail("gpu", label, e instanceof Error ? e.message : String(e));
  }
}

/** Verify one model attestation report against the nonce we generated. */
export async function verifyModelAttestation(
  report: AttestationReport,
  model: string,
  nonce: string,
): Promise<VerificationResult> {
  const checks: VerificationCheck[] = [];
  const att = report.model_attestations[0];

  const base = {
    model,
    nonce,
    notChecked: [
      "dstack event log replay into RTMR3",
      "docker-compose hash matches MR config",
      "pinned model and image identity (policy)",
      "per-response signature (GET /v1/signature/{chat_id})",
    ],
    verifiedAt: new Date().toISOString(),
  };

  if (!att) {
    return { ...base, verified: false, signingAddress: null, checks: [fail("report", "Attestation report", "no model attestation returned")] };
  }

  // 1. The report must echo the nonce we sent (stops replay of an old report).
  checks.push(
    att.request_nonce.toLowerCase() === nonce.toLowerCase()
      ? pass("nonce", "Fresh nonce echoed", "report nonce matches the one we generated")
      : fail("nonce", "Fresh nonce echoed", "report nonce differs from ours"),
  );

  const quote = hex(att.intel_quote);

  // 2. Intel signature chain and TCB status (DCAP).
  let tdxOk = false;
  try {
    const v = await getCollateralAndVerify(quote);
    tdxOk = ACCEPTED_TCB.includes(v.status);
    checks.push(
      tdxOk
        ? pass("tdx", "Intel TDX quote signature (DCAP)", `TCB status: ${v.status}`)
        : fail("tdx", "Intel TDX quote signature (DCAP)", `TCB status: ${v.status}`),
    );
  } catch (e) {
    checks.push(fail("tdx", "Intel TDX quote signature (DCAP)", e instanceof Error ? e.message : String(e)));
  }

  // 3. Only trust fields we read out of the quote bytes after DCAP succeeded.
  const isTdxV4 = quote.length > 632 && quote.readUInt16LE(0) === 4 && quote.readUInt32LE(4) === 0x81;
  if (!isTdxV4) {
    checks.push(fail("quote-format", "TDX v4 quote format", "quote is not a TDX v4 quote"));
  } else {
    const reportData = quote.subarray(OFFSET.reportData, OFFSET.reportData + 64);
    const addr = hex(att.signing_address);
    const zeros = Buffer.alloc(12);
    const bindsKey = addr.length === 20 && reportData.subarray(0, 20).equals(addr) && reportData.subarray(20, 32).equals(zeros);
    const bindsNonce = reportData.subarray(32, 64).equals(hex(nonce));
    checks.push(
      bindsKey && bindsNonce
        ? pass("report-data", "Signing key and nonce bound to hardware report", "report_data = signing address + nonce")
        : fail("report-data", "Signing key and nonce bound to hardware report", "report_data does not match signing address and nonce"),
    );

    const debugOff = (quote[OFFSET.tdAttributes] ?? 1) % 2 === 0;
    checks.push(
      debugOff
        ? pass("debug", "Debug mode disabled", "TD debug attribute is off")
        : fail("debug", "Debug mode disabled", "TD debug attribute is ON"),
    );
  }

  // 4. GPU evidence through NVIDIA's attestation service.
  checks.push(await checkGpu(att, nonce));

  return {
    ...base,
    verified: checks.every((c) => c.passed),
    signingAddress: att.signing_address,
    checks,
  };
}
