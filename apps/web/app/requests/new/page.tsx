"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LANGUAGES, DOMAINS, type Domain, type TaskType } from "@afrikcompute/shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SignInGate } from "@/components/SignInGate";

const TASK_TYPES: TaskType[] = ["translate", "label", "review", "transcribe"];

function NewRequestForm({ token }: { token: string }) {
  const router = useRouter();
  const { session } = useAuth();
  const [role, setRole] = useState(session?.profile.role ?? "contributor");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [languageCode, setLanguageCode] = useState("ha");
  const [domain, setDomain] = useState<Domain>("general");
  const [taskType, setTaskType] = useState<TaskType>("translate");
  const [reward, setReward] = useState("1");
  const [rewardToken, setRewardToken] = useState("USDT");
  const [taskText, setTaskText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = taskText.split("\n").map((l) => l.trim()).filter(Boolean);
  const canPost = role === "requester" || role === "both";

  async function becomeRequester() {
    setBusy(true);
    setError(null);
    try {
      const p = await api.setRole(token, "both");
      setRole(p.role);
      // Keep the stored profile in step so other pages see the new role.
      try {
        const raw = localStorage.getItem("afrik.session");
        if (raw) localStorage.setItem("afrik.session", JSON.stringify({ ...JSON.parse(raw), profile: p }));
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change role");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const rq = await api.createRequest(token, {
        title,
        description: description || undefined,
        languageCode,
        taskType,
        domain,
        rewardAmount: Number(reward),
        rewardToken,
      });
      const failed: number[] = [];
      for (const [i, text] of lines.entries()) {
        try {
          await api.createTask(token, rq.id, text);
        } catch {
          failed.push(i + 1);
        }
      }
      if (failed.length) setError(`Request created, but task line(s) ${failed.join(", ")} failed. You can open the request and try again.`);
      router.push(`/requests/${rq.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post the request");
      setBusy(false);
    }
  }

  if (!canPost) {
    return (
      <div className="notice">
        <p>Your account is a contributor account. Switch to a combined contributor and requester account to post requests.</p>
        <button className="btn solid" onClick={becomeRequester} disabled={busy}>Enable posting requests</button>
        {error ? <p role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={120} required /></label>
      <label>Description (optional)<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} /></label>
      <div className="form-row">
        <label>Language
          <select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)}>
            {DEFAULT_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </label>
        <label>Domain
          <select value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
            {DOMAINS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
        </label>
        <label>Task type
          <select value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
            {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>Reward per task
          <input type="number" min="0.01" step="0.01" value={reward} onChange={(e) => setReward(e.target.value)} required />
        </label>
        <label>Token
          <select value={rewardToken} onChange={(e) => setRewardToken(e.target.value)}>
            <option>USDT</option>
            <option>USDC</option>
          </select>
        </label>
      </div>
      <label>Tasks, one per line (the text contributors will work on)
        <textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} rows={6} placeholder={"Check the maize leaves after the rain.\\nRemove weeds before they flower."} />
        <span className="sample-note">{lines.length} task{lines.length === 1 ? "" : "s"}. Rewards are paid from the platform's payout agent, not from a deposit by you (deposits are on the roadmap).</span>
      </label>
      <button className="btn solid" disabled={busy || !title || Number(reward) <= 0}>{busy ? "Posting…" : "Post request"}</button>
      {error ? <p className="notice bad" role="alert">{error}</p> : null}
    </form>
  );
}

export default function NewRequest() {
  return (
    <section className="band">
      <div className="wrap narrow">
        <h1 className="page-title">Post a request</h1>
        <p className="lede">Describe the data you need and add the tasks. Contributors see the reward before they start.</p>
        <SignInGate>{(token) => <NewRequestForm token={token} />}</SignInGate>
      </div>
    </section>
  );
}
