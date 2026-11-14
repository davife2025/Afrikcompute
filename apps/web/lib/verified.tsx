"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { VerificationResult } from "@afrikcompute/shared";

const KEY = "afrik.lastVerification";
const Ctx = createContext<{ result: VerificationResult | null; setResult: (r: VerificationResult | null) => void }>({
  result: null,
  setResult: () => {},
});

/** Holds the latest Verified panel result so the header badge can show it. Kept in this tab only. */
export function VerifiedProvider({ children }: { children: ReactNode }) {
  const [result, setState] = useState<VerificationResult | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);
  const setResult = (r: VerificationResult | null) => {
    setState(r);
    try {
      if (r) sessionStorage.setItem(KEY, JSON.stringify(r));
      else sessionStorage.removeItem(KEY);
    } catch {}
  };
  return <Ctx.Provider value={{ result, setResult }}>{children}</Ctx.Provider>;
}

export const useVerified = () => useContext(Ctx);
