import { DEFAULT_LANGUAGES, DOMAINS } from "@afrikcompute/shared";

export const languageName = (code: string) => DEFAULT_LANGUAGES.find((l) => l.code === code)?.name ?? code;
export const domainLabel = (code: string) => DOMAINS.find((d) => d.code === code)?.label ?? code;
export const money = (amount: number, token: string) => `${amount} ${token}`;
