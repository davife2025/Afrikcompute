"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useVerified } from "@/lib/verified";
import { Strips } from "@/components/Strips";
import { Onboarding } from "@/components/Onboarding";
import { VerifiedPanel } from "@/components/VerifiedPanel";

const RESOURCE_LINKS = [
  { href: "/docs", external: false },
  { href: "https://docs.agentsonintents.com/integration/agent-api/overview", external: true },
  { href: "/try", external: false },
  { href: "/#resources", external: false },
];

export default function Home() {
  const { t } = useI18n();
  const { result } = useVerified();

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1>{t.heroTitle}</h1>
            <p>{t.heroSub}</p>
            <div className="hero-actions">
              <Link className="btn solid" href="/requests">{t.cta1}</Link>
              <Link className="btn line" href="/docs">{t.cta2}</Link>
            </div>
          </div>
          <Strips />
        </div>
      </section>

      <Onboarding />

      <section id="domains" className="band tint">
        <div className="wrap">
          <h2>{t.domainsTitle}</h2>
          <p className="lede">{t.domainsNote}</p>
          <ul className="domains">
            {t.domainNames.map((name, i) => (
              <li key={name} className={`d${i + 1}`}>{name}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="proof" className="band">
        <div className="wrap proof-grid">
          <div>
            <h2>{t.proofTitle}</h2>
            <p className="lede">{t.proofText}</p>
            <Link className="btn solid" href="/try">{t.proofCta}</Link>
          </div>
          <VerifiedPanel result={result} />
        </div>
      </section>

      <section id="resources" className="band tint">
        <div className="wrap">
          <h2>{t.resourcesTitle}</h2>
          <ul className="rows">
            {t.res.map(([name, text], i) => {
              const link = RESOURCE_LINKS[i]!;
              return (
                <li key={name}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">{name}</a>
                  ) : (
                    <Link href={link.href}>{name}</Link>
                  )}
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <footer className="site-footer">
        <div className="woven-rule" aria-hidden="true" />
        <div className="wrap"><p>{t.footer}</p></div>
      </footer>
    </>
  );
}
