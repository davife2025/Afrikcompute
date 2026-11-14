"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Language, PrivateReviewResponse, TaskType } from "@afrikcompute/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useVerified } from "@/lib/verified";
import { VerifiedPanel } from "@/components/VerifiedPanel";

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "translate", label: "Translate" },
  { value: "label", label: "Label" },
  { value: "review", label: "Review" },
  { value: "transcribe", label: "Transcribe" },
];

export default function Try() {
  const { session } = useAuth();
  const { result, setResult } = useVerified();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageCode, setLanguageCode] = useState("ha");
  const [taskType, setTaskType] = useState<TaskType>("translate");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<PrivateReviewResponse | null>(null);

  useEffect(() => {
    api.languages().then(setLanguages).catch(() => setLanguages([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError(null);
    setReview(null);
    try {
      const r = await api.privateReview(session.token, { text, languageCode, taskType });
      setReview(r);
      setResult(r.verification);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? "Private review is not configured on this server yet."
          : err instanceof Error ? err.message : "Review failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="band">
      <div className="wrap try-grid">
        <div>
          <h1 className="page-title">Try a private review</h1>
          <p className="lede">
            Your text goes to a model running inside a TEE on NEAR AI Cloud. This page keeps nothing: the text is not saved,
            and only the verdict and the Verified panel come back.
          </p>
          {!session ? (
            <p className="notice">Sign in with a NEAR wallet (top right) to run a review.</p>
          ) : (
            <form onSubmit={submit} className="form">
              <label>
                Language
                <select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)}>
                  {(languages.length ? languages : [{ code: "ha", name: "Hausa", nativeName: null }]).map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Task type
                <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
                  {TASK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Your text
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={4000} required />
              </label>
              <button className="btn solid" disabled={busy || text.trim().length === 0}>
                {busy ? "Reviewing in the TEE…" : "Run private review"}
              </button>
              {error ? <p className="notice bad" role="alert">{error}</p> : null}
            </form>
          )}

          {review ? (
            <div className="verdict" aria-live="polite">
              <h2>Verdict</h2>
              <p className={review.verdict.ok ? "ok" : "bad"}>
                {review.verdict.ok ? "Looks good" : "Needs changes"}. Score {review.verdict.score} out of 100.
              </p>
              {review.verdict.issues.length > 0 ? (
                <ul>{review.verdict.issues.map((i) => <li key={i}>{i}</li>)}</ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <VerifiedPanel result={result} />
      </div>
    </section>
  );
}
