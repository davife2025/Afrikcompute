import { env } from "../env";

const DEFAULT_RPC = {
  mainnet: "https://rpc.mainnet.near.org",
  testnet: "https://rpc.testnet.near.org",
} as const;

/** True only if `publicKey` is a full-access key of `accountId` on the configured network. */
export async function isFullAccessKey(accountId: string, publicKey: string): Promise<boolean> {
  const rpc = env.NEAR_RPC_URL ?? DEFAULT_RPC[env.NEAR_NETWORK];
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "afrikcompute",
        method: "query",
        params: { request_type: "view_access_key", finality: "final", account_id: accountId, public_key: publicKey },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json()) as { error?: unknown; result?: { error?: unknown; permission?: unknown } };
    if (body.error || body.result?.error) return false;
    return body.result?.permission === "FullAccess";
  } catch {
    return false;
  }
}
