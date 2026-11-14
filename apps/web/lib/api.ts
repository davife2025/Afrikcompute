import type { AuthChallenge, AuthSession, DataRequest, Language, PrivateReviewResponse, TaskType } from "@afrikcompute/shared";

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
  privateReview: (token: string, b: { text: string; languageCode: string; taskType: TaskType }) =>
    call<PrivateReviewResponse>("/private/review", { method: "POST", token, body: JSON.stringify(b) }),
};
