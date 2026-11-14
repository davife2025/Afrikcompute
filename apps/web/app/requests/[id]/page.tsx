"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { DataRequest, PayoutStatus, PrivateReviewResponse, SubmissionView, TaskView } from "@afrikcompute/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useVerified } from "@/lib/verified";
import { SignInGate } from "@/components/SignInGate";
import { domainLabel, languageName, money } from "@/components/labels";

function Verdict({ review }: { review: PrivateReviewResponse }) {
  return (
    <div className="verdict" aria-live="polite">
      <p className={review.verdict.ok ? "ok" : "bad"}>
        {review.verdict.ok ? "Accepted by the private review" : "Not accepted"}. Score {review.verdict.score} out of 100.
      </p>
      {review.verdict.issues.length > 0 ? <ul>{review.verdict.issues.map((i) => <li key={i}>{i}</li>)}</ul> : null}
      <p className="sample-note">
        Verification: {review.verification.verified ? "all checks passed" : "not fully verified"}. Open the badge at the top for details.
      </p>
    </div>
  );
}

function ContributorTask({ task, token, onDone }: { task: TaskView; token: string; onDone: () => void }) {
  const { setResult } = useVerified();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<PrivateReviewResponse | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    setReview(null);
    try {
      const r = await api.submit(token, task.id, text);
      setReview(r);
      setResult(r.verification);
      setAccepted(true);
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        const r = e.body as PrivateReviewResponse;
        setReview(r);
        setResult(r.verification);
      } else {
        setError(e instanceof Error ? e.message : "Submission failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="task">
      <p className="task-text">{task.text}</p>
      {accepted ? null : open ? (
        <div className="form">
          <label>
            Your submission
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={4000} />
          </label>
          <div className="actions">
            <button className="btn solid" onClick={submit} disabled={busy || text.trim().length === 0}>
              {busy ? "Reviewing in the TEE…" : "Submit for private review"}
            </button>
            <button className="btn plain" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn solid small" onClick={() => setOpen(true)}>Work on this task</button>
      )}
      {error ? <p className="notice bad" role="alert">{error}</p> : null}
      {review ? <Verdict review={review} /> : null}
      {accepted ? <p className="notice">Submitted. The requester will approve or reject it. Check My work for the status.</p> : null}
    </li>
  );
}

const payoutText = (s: PayoutStatus) =>
  ({ pending: "pending", processing: "processing", sent: "sent", failed: "failed", needs_review: "needs review", simulated: "simulated (nothing was sent)" })[s];

function OwnerTask({ task, token, onChanged }: { task: TaskView; token: string; onChanged: () => void }) {
  const pending = (task.submissions ?? []).find((s) => s.status === "pending");
  const [view, setView] = useState<SubmissionView | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!pending) return;
    setError(null);
    try {
      setView(await api.submission(token, pending.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the submission");
    }
  }

  async function act(kind: "approve" | "reject") {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === "approve") {
        const p = await api.approve(token, pending.id);
        setNote(`Approved. Payout of ${money(p.amount, p.token)}: ${payoutText(p.status)}.`);
      } else {
        await api.reject(token, pending.id);
        setNote("Rejected. The task is open again.");
      }
      setView(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="task">
      <p className="task-text">{task.text}</p>
      <p className="task-meta"><span className={`chip ${task.status}`}>{task.status}</span></p>
      {pending && !view ? <button className="btn solid small" onClick={load}>View submission</button> : null}
      {view ? (
        <div className="submission">
          <p className="task-meta">Submission</p>
          <p className="task-text">{view.content}</p>
          {view.review ? (
            <p className="sample-note">
              Private review score {view.review.verdict.score} out of 100. Verification: {view.review.verification.verified ? "all checks passed" : "not fully verified"}.
            </p>
          ) : null}
          <div className="actions">
            <button className="btn solid small" onClick={() => act("approve")} disabled={busy}>Approve and pay</button>
            <button className="btn plain small" onClick={() => act("reject")} disabled={busy}>Reject</button>
          </div>
        </div>
      ) : null}
      {note ? <p className="notice">{note}</p> : null}
      {error ? <p className="notice bad" role="alert">{error}</p> : null}
    </li>
  );
}

function Tasks({ request, token, profileId }: { request: DataRequest; token: string; profileId: string }) {
  const [tasks, setTasks] = useState<TaskView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const owner = request.requesterId === profileId;

  const load = useCallback(() => {
    api.tasks(token, request.id).then(setTasks).catch((e) => setError(e instanceof Error ? e.message : "Could not load tasks"));
  }, [token, request.id]);
  useEffect(load, [load]);

  if (error) return <p className="notice bad" role="alert">{error}</p>;
  if (!tasks) return <p className="lede">Loading tasks…</p>;
  if (tasks.length === 0) return <p className="notice">{owner ? "This request has no tasks yet." : "No open tasks right now."}</p>;

  return (
    <>
      <h2 className="sub">{owner ? "Your tasks" : "Open tasks"}</h2>
      <ul className="tasks">
        {tasks.map((t) =>
          owner ? (
            <OwnerTask key={t.id} task={t} token={token} onChanged={load} />
          ) : (
            <ContributorTask key={t.id} task={t} token={token} onDone={() => setTimeout(load, 1500)} />
          ),
        )}
      </ul>
    </>
  );
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [request, setRequest] = useState<DataRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.request(id).then(setRequest).catch(() => setError("Request not found."));
  }, [id]);

  return (
    <section className="band">
      <div className="wrap narrow">
        <p><Link href="/requests">All requests</Link></p>
        {error ? <p className="notice bad" role="alert">{error}</p> : null}
        {request ? (
          <>
            <h1 className="page-title">{request.title}</h1>
            <p className="req-meta">
              {languageName(request.languageCode)}, {domainLabel(request.domain)}, {request.taskType}. Reward {money(request.rewardAmount, request.rewardToken)} per approved task.
            </p>
            {request.description ? <p className="lede">{request.description}</p> : null}
            <SignInGate>{(token, profileId) => <Tasks request={request} token={token} profileId={profileId} />}</SignInGate>
            {session && request.requesterId === session.profile.id ? null : (
              <p className="sample-note">Rewards are set by the requester and paid per approved task. No minimum rate is enforced yet.</p>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
