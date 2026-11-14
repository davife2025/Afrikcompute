import type { AuthChallenge, AuthSession, DataRequest, Domain, Language, MyRequest, MySubmission, Payout, PrivateReviewResponse, Profile, SubmissionView, TaskType, TaskView } from "@afrikcompute/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? `request failed (${res.status})`, body);
  return body as T;
}

export const api = {
  challenge: () => call<AuthChallenge>("/auth/challenge", { method: "POST" }),
  verify: (b: { accountId: string; publicKey: string; signature: string; nonce: string; exp: number; token: string }) =>
    call<AuthSession>("/auth/verify", { method: "POST", body: JSON.stringify(b) }),
  languages: () => call<Language[]>("/languages"),
  requests: () => call<DataRequest[]>("/requests"),
  privateReview: (token: string, b: { text: string; languageCode: string; taskType: TaskType; domain?: Domain }) =>
    call<PrivateReviewResponse>("/private/review", { method: "POST", token, body: JSON.stringify(b) }),
  request: (id: string) => call<DataRequest>(`/requests/${id}`),
  tasks: (token: string, id: string) => call<TaskView[]>(`/requests/${id}/tasks`, { token }),
  createRequest: (
    token: string,
    b: { title: string; description?: string; languageCode: string; taskType: TaskType; domain: Domain; rewardAmount: number; rewardToken: string },
  ) => call<DataRequest>("/requests", { method: "POST", token, body: JSON.stringify(b) }),
  createTask: (token: string, requestId: string, text: string) =>
    call<{ id: string }>(`/requests/${requestId}/tasks`, { method: "POST", token, body: JSON.stringify({ payload: { text } }) }),
  submit: (token: string, taskId: string, content: string) =>
    call<{ id: string } & PrivateReviewResponse>(`/tasks/${taskId}/submissions`, { method: "POST", token, body: JSON.stringify({ content }) }),
  submission: (token: string, id: string) => call<SubmissionView>(`/submissions/${id}`, { token }),
  approve: (token: string, id: string) => call<Payout>(`/submissions/${id}/approve`, { method: "POST", token }),
  reject: (token: string, id: string) => call<{ id: string; status: string }>(`/submissions/${id}/reject`, { method: "POST", token }),
  mySubmissions: (token: string) => call<MySubmission[]>("/me/submissions", { token }),
  myRequests: (token: string) => call<MyRequest[]>("/me/requests", { token }),
  setRole: (token: string, role: Profile["role"]) => call<Profile>("/me", { method: "PATCH", token, body: JSON.stringify({ role }) }),
};
