"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { MyRequest, MySubmission, Profile } from "@afrikcompute/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SignInGate } from "@/components/SignInGate";
import { domainLabel, languageName, money } from "@/components/labels";

const ROLES: { value: Profile["role"]; label: string }[] = [
  { value: "contributor", label: "Contributor" },
  { value: "requester", label: "Requester" },
  { value: "both", label: "Both" },
];

function Dashboard({ token }: { token: string }) {
  const { session } = useAuth();
  const [role, setRole] = useState<Profile["role"]>(session?.profile.role ?? "contributor");
  const [subs, setSubs] = useState<MySubmission[] | null>(null);
  const [reqs, setReqs] = useState<MyRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showContrib = role === "contributor" || role === "both";
  const showReq = role === "requester" || role === "both";

  const load = useCallback(() => {
    setError(null);
    api.mySubmissions(token).then(setSubs).catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
    api.myRequests(token).then(setReqs).catch(() => {});
  }, [token]);
  useEffect(load, [load]);

  async function changeRole(r: Profile["role"]) {
    setRole(r);
    try {
      const p = await api.setRole(token, r);
      const raw = localStorage.getItem("afrik.session");
      if (raw) localStorage.setItem("afrik.session", JSON.stringify({ ...JSON.parse(raw), profile: p }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change role");
    }
  }

  return (
    <>
      <div className="role-switch" role="group" aria-label="Your role">
        {ROLES.map((r) => (
          <button key={r.value} aria-pressed={role === r.value} onClick={() => changeRole(r.value)}>{r.label}</button>
        ))}
      </div>
      {error ? <p className="notice bad" role="alert">{error}</p> : null}

      {showContrib ? (
        <>
          <h2 className="sub">My submissions</h2>
          {subs === null ? <p className="lede">Loading…</p> : subs.length === 0 ? (
            <p className="notice">Nothing submitted yet. <Link href="/requests">Browse open requests</Link>.</p>
          ) : (
            <div className="table-scroll">
              <table className="endpoints">
                <thead><tr><th scope="col">Request</th><th scope="col">Your status</th><th scope="col">Reward</th><th scope="col">Payout</th></tr></thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id}>
                      <td><Link href={`/requests/${s.requestId}`}>{s.requestTitle}</Link><br /><small>{languageName(s.languageCode)}, {domainLabel(s.domain)}</small></td>
                      <td><span className={`chip ${s.status}`}>{s.status}</span></td>
                      <td>{money(s.rewardAmount, s.rewardToken)}</td>
                      <td>{s.payout ? `${s.payout.status}` : s.status === "approved" ? "starting" : "none yet"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {showReq ? (
        <>
          <h2 className="sub">My requests</h2>
          {reqs === null ? <p className="lede">Loading…</p> : reqs.length === 0 ? (
            <p className="notice">No requests yet. <Link href="/requests/new">Post one</Link>.</p>
          ) : (
            <ul className="req-list">
              {reqs.map((r) => (
                <li key={r.id}>
                  <Link href={`/requests/${r.id}`} className="req-title">{r.title}</Link>
                  <span className="req-meta">
                    {Object.entries(r.taskCounts).map(([k, v]) => `${v} ${k}`).join(", ") || "no tasks"}
                  </span>
                  <span className="req-reward">{money(r.rewardAmount, r.rewardToken)} per task</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </>
  );
}

export default function DashboardPage() {
  return (
    <section className="band">
      <div className="wrap narrow">
        <h1 className="page-title">My work</h1>
        <SignInGate>{(token) => <Dashboard token={token} />}</SignInGate>
      </div>
    </section>
  );
}
