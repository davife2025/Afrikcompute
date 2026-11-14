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

export type TaskType = "label" | "translate" | "review" | "transcribe";

export interface Profile {
  id: string;
  nearAccountId: string;
  role: Role | "both";
  locale: Locale;
  createdAt: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string | null;
}

export interface DataRequest {
  id: string;
  requesterId: string;
  title: string;
  description: string | null;
  languageCode: string;
  taskType: TaskType;
  rewardAmount: number;
  rewardToken: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface AuthChallenge {
  nonce: string; // 32 bytes, hex
  exp: number; // unix seconds
  token: string; // opaque, send back unchanged
  message: string;
  recipient: string;
}

export interface AuthSession {
  token: string; // bearer token for the API
  profile: Profile;
}
