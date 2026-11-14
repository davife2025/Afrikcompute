"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export function Onboarding() {
  const { t } = useI18n();
  const [role, setRole] = useState<"contributor" | "requester">("contributor");
  const steps = role === "contributor" ? t.contributor : t.requester;

  return (
    <section id="start" className="band">
      <div className="wrap">
        <h2>{t.startTitle}</h2>
        <p className="lede">{t.startSub}</p>
        <div role="tablist" aria-label={t.startTitle} className="tabs">
          <button role="tab" id="tab-contributor" aria-selected={role === "contributor"} aria-controls="panel-steps" onClick={() => setRole("contributor")}>
            {t.tabContributor}
          </button>
          <button role="tab" id="tab-requester" aria-selected={role === "requester"} aria-controls="panel-steps" onClick={() => setRole("requester")}>
            {t.tabRequester}
          </button>
        </div>
        <ol id="panel-steps" role="tabpanel" aria-labelledby={`tab-${role}`} className="steps">
          {steps.map(([title, text], i) => (
            <li key={title + i} className={`step t${i + 1}`}>
              <span className="step-no" aria-hidden="true">{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        {role === "contributor" ? <p className="notice fair">{t.fairPay}</p> : null}
      </div>
    </section>
  );
}
