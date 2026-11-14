process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test";
process.env.API_JWT_SECRET ??= "x".repeat(40);
process.env.DATA_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
export {};

async function main() {
  const { toAtomic } = await import("../payouts/amounts");
  const { executePayout, mapStatus } = await import("../payouts/engine");
  const { AgentApiError, AgentApiUncertainError } = await import("../payouts/agentApi");
  const r: [string, boolean][] = [];
  const throws = (f: () => unknown) => { try { f(); return false; } catch { return true; } };

  r.push(["2.5 -> 2500000", toAtomic(2.5, 6) === "2500000"]);
  r.push(["0.000001 -> 1", toAtomic("0.000001", 6) === "1"]);
  r.push(["1 -> 1000000", toAtomic(1, 6) === "1000000"]);
  r.push(["zero rejected", throws(() => toAtomic(0, 6))]);
  r.push(["7 decimals rejected", throws(() => toAtomic("0.0000011", 6))]);
  r.push(["garbage rejected", throws(() => toAtomic("1e6", 6))]);
  r.push(["status SUCCESS -> sent", mapStatus("SUCCESS") === "sent"]);
  r.push(["status UNCERTAIN -> processing", mapStatus("UNCERTAIN") === "processing"]);
  r.push(["status NEEDS_REVIEW -> needs_review", mapStatus("NEEDS_REVIEW") === "needs_review"]);

  const base = { id: "p1", amount: 2, token: "USDT", status: "pending" as const, idempotency_key: "afrik-k1", correlation_id: null };
  const mk = (over: Record<string, unknown>) => {
    const saved: any[] = []; const calls: any[] = [];
    const api = {
      transfer: async (req: any, key: string) => { calls.push({ req, key }); return { correlation_id: "op_1" }; },
      getStatus: async () => ({ correlation_id: "op_1", status: "SUCCESS", failure_code: null }),
      ...(over.api as object),
    };
    return { saved, calls, deps: { api: api as any, mode: "live" as const, maxAmount: 5, save: async (u: any) => { saved.push(u); }, ...over } };
  };

  { const t = mk({ mode: "simulate" }); const s = await executePayout(t.deps, base, "alice.near");
    r.push(["simulate mode never calls the API", s === "simulated" && t.calls.length === 0]); }
  { const t = mk({}); const s = await executePayout(t.deps, { ...base, amount: 9 }, "alice.near");
    r.push(["amount above cap refused, nothing sent", s === "failed" && t.calls.length === 0]); }
  { const t = mk({}); const s = await executePayout(t.deps, base, "alice.near");
    r.push(["live send reaches sent and uses stored key", s === "sent" && t.calls[0].key === "afrik-k1" && t.calls[0].req.amount === "2000000" && t.calls[0].req.recipient === "alice.near"]); }
  { const t = mk({}); await executePayout(t.deps, { ...base, status: "processing", correlation_id: "op_1" }, "alice.near");
    r.push(["existing correlation id: polls only, no second transfer", t.calls.length === 0]); }
  { const t = mk({ api: { transfer: async () => { throw new AgentApiError(400, "spend_budget_exceeded", "budget"); } } });
    const s = await executePayout(t.deps, base, "alice.near");
    r.push(["budget refusal -> failed", s === "failed"]); }
  { const t = mk({ api: { transfer: async () => { throw new AgentApiError(502, "provider_down", "provider"); } } });
    const s = await executePayout(t.deps, base, "alice.near");
    r.push(["provider-layer error -> needs_review (not blindly failed)", s === "needs_review"]); }
  { const t = mk({ api: { transfer: async () => { throw new AgentApiUncertainError("net"); } } });
    const s = await executePayout(t.deps, base, "alice.near");
    r.push(["network failure -> processing, key kept", s === "processing"]); }
  { const t = mk({}); const s = await executePayout(t.deps, { ...base, status: "sent" }, "alice.near");
    r.push(["finished payout is never re-sent", s === "sent" && t.calls.length === 0]); }

  for (const [n, ok] of r) console.log(`${ok ? "PASS" : "FAIL"}  ${n}`);
  process.exit(r.every(([, ok]) => ok) ? 0 : 1);
}
main();
