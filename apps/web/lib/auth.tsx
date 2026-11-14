"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Buffer } from "buffer";
import type { BrowserWallet, WalletSelector } from "@near-wallet-selector/core";
import type { AuthSession } from "@afrikcompute/shared";
import { api } from "./api";

/**
 * NEAR wallet sign-in (NEP-413). UNTESTED with real wallets: test Meteor and MyNearWallet on testnet.
 * Popup wallets return the signature directly. Redirect wallets come back to this page with
 * accountId, publicKey, signature and state in the URL hash; we finish sign-in from there.
 */
const SESSION_KEY = "afrik.session";
// Wallet selector asks for a contract when signing in. Only the login signature is used, never a contract call.
const WALLET_CONTRACT_ID = process.env.NEXT_PUBLIC_WALLET_CONTRACT_ID ?? "guest-book.testnet";

export type WalletId = "meteor-wallet" | "my-near-wallet";

interface AuthValue {
  session: AuthSession | null;
  walletAccount: string | null;
  ready: boolean;
  busy: boolean;
  error: string | null;
  connect: (id: WalletId) => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

type Signed = { accountId: string; publicKey: string; signature: string };
type ChallengeState = { nonce: string; exp: number; token: string };

export function AuthProvider({ children }: { children: ReactNode }) {
  const selector = useRef<WalletSelector | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback(async (signed: Signed, ch: ChallengeState) => {
    const s = await api.verify({ ...signed, ...ch });
    setSession(s);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}

    let cancelled = false;
    (async () => {
      try {
        const { setupWalletSelector } = await import("@near-wallet-selector/core");
        const { setupMeteorWallet } = await import("@near-wallet-selector/meteor-wallet");
        const { setupMyNearWallet } = await import("@near-wallet-selector/my-near-wallet");
        const sel = await setupWalletSelector({
          network: "testnet",
          modules: [setupMeteorWallet(), setupMyNearWallet()],
        });
        if (cancelled) return;
        selector.current = sel;
        const first = sel.store.getState().accounts[0];
        setWalletAccount(first?.accountId ?? null);
        sel.store.observable.subscribe((state) => setWalletAccount(state.accounts[0]?.accountId ?? null));

        // Return from a redirect wallet's signMessage page.
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accountId = params.get("accountId");
        const publicKey = params.get("publicKey");
        const signature = params.get("signature")?.replace(/ /g, "+"); // '+' is turned into ' ' by URLSearchParams
        const state = params.get("state");
        if (accountId && publicKey && signature && state) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
          setBusy(true);
          try {
            await finish({ accountId, publicKey, signature }, JSON.parse(state) as ChallengeState);
          } catch (e) {
            setError(e instanceof Error ? e.message : "sign-in failed");
          } finally {
            setBusy(false);
          }
        }
        setReady(true);
      } catch (e) {
        setError("Wallet support failed to load");
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [finish]);

  const connect = useCallback(async (id: WalletId) => {
    if (!selector.current) return;
    setError(null);
    setBusy(true);
    try {
      const wallet = await selector.current.wallet<BrowserWallet>(id);
      await wallet.signIn({ contractId: WALLET_CONTRACT_ID });
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not connect wallet");
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    if (!selector.current) return;
    setError(null);
    setBusy(true);
    try {
      const ch = await api.challenge();
      const wallet = await selector.current.wallet();
      if (!wallet.signMessage) throw new Error("This wallet cannot sign messages. Use Meteor or MyNearWallet.");
      const state: ChallengeState = { nonce: ch.nonce, exp: ch.exp, token: ch.token };
      const signed = await wallet.signMessage({
        message: ch.message,
        recipient: ch.recipient,
        nonce: Buffer.from(ch.nonce, "hex"),
        callbackUrl: window.location.origin + window.location.pathname,
        state: JSON.stringify(state),
      });
      // Redirect wallets return nothing here: the page reloads and the hash handler above finishes sign-in.
      if (signed) await finish(signed, state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "sign-in failed");
    } finally {
      setBusy(false);
    }
  }, [finish]);

  const signOut = useCallback(async () => {
    setSession(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    try {
      const wallet = await selector.current?.wallet();
      await wallet?.signOut();
    } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ session, walletAccount, ready, busy, error, connect, signIn, signOut }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
