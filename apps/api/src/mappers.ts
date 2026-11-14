import type { DataRequest, Language, Profile } from "@afrikcompute/shared";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toProfile = (r: any): Profile => ({
  id: r.id,
  nearAccountId: r.near_account_id,
  role: r.role,
  locale: r.locale,
  createdAt: r.created_at,
});

export const toLanguage = (r: any): Language => ({ code: r.code, name: r.name, nativeName: r.native_name });

export const toRequest = (r: any): DataRequest => ({
  id: r.id,
  requesterId: r.requester_id,
  title: r.title,
  description: r.description,
  languageCode: r.language_code,
  taskType: r.task_type,
  rewardAmount: Number(r.reward_amount),
  rewardToken: r.reward_token,
  status: r.status,
  createdAt: r.created_at,
});
