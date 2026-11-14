/** Single source for the /docs page and the Ctrl K search. Mirrors the routes in apps/api. */
export interface Endpoint {
  method: "GET" | "POST" | "PATCH";
  path: string;
  auth: "public" | "signed in" | "request owner";
  summary: string;
}

export const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/health", auth: "public", summary: "API and Supabase status" },
  { method: "POST", path: "/auth/challenge", auth: "public", summary: "Get a sign-in challenge for the wallet to sign" },
  { method: "POST", path: "/auth/verify", auth: "public", summary: "Verify the NEP-413 signature, get a session token" },
  { method: "GET", path: "/me", auth: "signed in", summary: "Your profile" },
  { method: "PATCH", path: "/me", auth: "signed in", summary: "Set your role and language" },
  { method: "GET", path: "/languages", auth: "public", summary: "Supported languages" },
  { method: "GET", path: "/requests", auth: "public", summary: "Open data requests" },
  { method: "GET", path: "/requests/:id", auth: "public", summary: "One data request" },
  { method: "GET", path: "/requests/:id/tasks", auth: "signed in", summary: "Open tasks (everyone) or all tasks and submissions (request owner)" },
  { method: "GET", path: "/me/submissions", auth: "signed in", summary: "Your submissions with payout status" },
  { method: "GET", path: "/me/requests", auth: "signed in", summary: "Your requests with task counts" },
  { method: "POST", path: "/requests", auth: "signed in", summary: "Post a data request with language, domain and task type (requesters)" },
  { method: "POST", path: "/requests/:id/tasks", auth: "request owner", summary: "Add a task to your request" },
  { method: "POST", path: "/private/review", auth: "signed in", summary: "Private TEE review, returns verdict and Verified panel data. Stores nothing" },
  { method: "POST", path: "/tasks/:id/submissions", auth: "signed in", summary: "Submit work; reviewed privately, stored encrypted" },
  { method: "GET", path: "/submissions/:id", auth: "signed in", summary: "Read a submission (contributor or request owner)" },
  { method: "POST", path: "/submissions/:id/approve", auth: "request owner", summary: "Approve and start the payout" },
  { method: "POST", path: "/submissions/:id/reject", auth: "request owner", summary: "Reject a submission; the task reopens" },
  { method: "GET", path: "/payouts", auth: "signed in", summary: "Your payouts" },
  { method: "GET", path: "/payouts/:id", auth: "signed in", summary: "Payout status (refreshes it)" },
];

export const endpointAnchor = (e: Endpoint) => `${e.method}-${e.path}`.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
