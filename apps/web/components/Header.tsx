"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LOCALES, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useVerified } from "@/lib/verified";
import { CommandPalette } from "./CommandPalette";
import { VerifiedPanel } from "./VerifiedPanel";

export function Header() {
  const { t, locale, setLocale } = useI18n();
  const { session, walletAccount, busy, error, connect, signIn, signOut, ready } = useAuth();
  const { result } = useVerified();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const badge = !result ? t.proofNone : result.verified ? t.proofOk : t.proofBad;
  const badgeClass = !result ? "" : result.verified ? "ok" : "bad";

  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="AfrikCompute home">
        <span className="wordmark-mark" aria-hidden="true" />
        AfrikCompute
      </Link>

      <button className="search-trigger" onClick={() => setPaletteOpen(true)} aria-label={t.searchLabel}>
        <span>{t.searchPlaceholder}</span>
        <kbd>Ctrl K</kbd>
      </button>

      <nav className="site-nav" aria-label="Main">
        <Link href="/#start">{t.start}</Link>
        <Link href="/#resources">{t.resources}</Link>
        <Link href="/try">{t.proof}</Link>
      </nav>

      <div className="header-tools">
        <label className="visually-hidden" htmlFor="lang">Language</label>
        <select id="lang" value={locale} onChange={(e) => setLocale(e.target.value as typeof locale)}>
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        <details className="proof-badge">
          <summary className={badgeClass}>{badge}</summary>
          <div className="proof-pop">
            <VerifiedPanel result={result} />
          </div>
        </details>

        {session ? (
          <details className="account">
            <summary>{session.profile.nearAccountId}</summary>
            <div className="account-pop"><button onClick={signOut}>{t.signOut}</button></div>
          </details>
        ) : walletAccount ? (
          <button className="primary" onClick={signIn} disabled={busy}>{t.signIn}</button>
        ) : (
          <details className="account">
            <summary className="primary-summary">{t.connect}</summary>
            <div className="account-pop">
              <button onClick={() => connect("meteor-wallet")} disabled={!ready || busy}>Meteor Wallet</button>
              <button onClick={() => connect("my-near-wallet")} disabled={!ready || busy}>MyNearWallet</button>
            </div>
          </details>
        )}
      </div>
      {error ? <p className="header-error" role="alert">{error}</p> : null}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}
