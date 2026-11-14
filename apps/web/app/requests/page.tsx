"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_LANGUAGES, DOMAINS, type DataRequest } from "@afrikcompute/shared";
import { api } from "@/lib/api";
import { domainLabel, languageName, money } from "@/components/labels";

export default function Requests() {
  const [rows, setRows] = useState<DataRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState("");
  const [domain, setDomain] = useState("");

  useEffect(() => {
    api.requests().then(setRows).catch(() => setError("Could not load requests. Is the API running?"));
  }, []);

  const shown = useMemo(
    () => (rows ?? []).filter((r) => (!language || r.languageCode === language) && (!domain || r.domain === domain)),
    [rows, language, domain],
  );

  return (
    <section className="band">
      <div className="wrap">
        <div className="page-head">
          <div>
            <h1 className="page-title">Open requests</h1>
            <p className="lede">Pick a request, then submit text for one of its tasks. Every submission is reviewed privately before it is stored.</p>
          </div>
          <Link className="btn solid" href="/requests/new">Post a request</Link>
        </div>

        <div className="filters">
          <label>
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">All languages</option>
              {DEFAULT_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </label>
          <label>
            Domain
            <select value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">All domains</option>
              {DOMAINS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
            </select>
          </label>
        </div>

        {error ? <p className="notice bad" role="alert">{error}</p> : null}
        {rows === null && !error ? <p className="lede">Loading…</p> : null}
        {rows && shown.length === 0 ? (
          <p className="notice">No open requests match. {rows.length === 0 ? "Run the seed data in supabase/seed/sample_data.sql, or post one yourself." : "Try another filter."}</p>
        ) : null}

        <ul className="req-list">
          {shown.map((r) => (
            <li key={r.id}>
              <Link href={`/requests/${r.id}`} className="req-title">{r.title}</Link>
              <span className="req-meta">
                {languageName(r.languageCode)}, {domainLabel(r.domain)}, {r.taskType}
              </span>
              <span className="req-reward">{money(r.rewardAmount, r.rewardToken)} per task</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
