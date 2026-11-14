/** Roles shown as tabs on the landing page. */
export type Role = "contributor" | "requester";

/** Interface languages (landing page toggle). */
export type Locale = "en" | "ha" | "yo" | "ig";

export interface HealthResponse {
  status: "ok";
  service: "api";
  time: string;
  supabase: "reachable" | "unreachable";
}

/** One line in the "Verified" panel. */
export interface VerificationCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

/** Result of verifying a NEAR AI Cloud model attestation. */
export interface VerificationResult {
  verified: boolean;
  model: string;
  nonce: string;
  signingAddress: string | null;
  checks: VerificationCheck[];
  /** Checks the verifier does NOT perform yet. Shown honestly in the panel. */
  notChecked: string[];
  verifiedAt: string;
}
