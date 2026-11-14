"use client";

import type { VerificationResult } from "@afrikcompute/shared";
import { useI18n } from "@/lib/i18n";

/** The checks our verifier runs. Shown before any run so people know what the panel will prove. */
const PLANNED = [
  "Fresh nonce echoed",
  "Intel TDX quote signature (DCAP)",
  "Signing key and nonce bound to hardware report",
  "Debug mode disabled",
  "NVIDIA GPU attestation (NRAS)",
];

export function VerifiedPanel({ result }: { result: VerificationResult | null }) {
  const { t } = useI18n();
  const title = !result ? t.proofNone : result.verified ? t.proofOk : t.proofBad;

  return (
    <section className="ledger" aria-label="Verified panel">
      <h3 className={`ledger-title ${result ? (result.verified ? "ok" : "bad") : ""}`}>{title}</h3>
      {result ? (
        <p className="ledger-meta">
          Model {result.model}. Fresh nonce {result.nonce.slice(0, 12)}… Checked {new Date(result.verifiedAt).toLocaleString()}.
        </p>
      ) : (
        <p className="ledger-meta">These checks run on every private review.</p>
      )}
      <ul className="ledger-rows">
        {(result ? result.checks : PLANNED.map((label) => ({ id: label, label, passed: null as boolean | null, detail: "" }))).map((c) => (
          <li key={c.id} className={c.passed === null ? "pending" : c.passed ? "pass" : "fail"}>
            <span className="state">{c.passed === null ? "Not run yet" : c.passed ? "Passed" : "Failed"}</span>
            <span className="what">
              {c.label}
              {c.detail ? <small>{c.detail}</small> : null}
            </span>
          </li>
        ))}
      </ul>
      {result && result.notChecked.length > 0 ? (
        <div className="ledger-not">
          <strong>Not checked yet</strong>
          <ul>
            {result.notChecked.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
