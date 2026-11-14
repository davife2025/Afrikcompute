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
