"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

/** Shows children only when signed in; otherwise explains how to sign in. */
export function SignInGate({ children }: { children: (token: string, profileId: string) => ReactNode }) {
  const { session, walletAccount, ready } = useAuth();
  if (session) return <>{children(session.token, session.profile.id)}</>;
  return (
    <p className="notice">
      {!ready
        ? "Loading wallet support…"
        : walletAccount
          ? "Wallet connected. Press Sign in at the top right to finish."
          : "Connect a NEAR wallet at the top right to continue."}
    </p>
  );
}
