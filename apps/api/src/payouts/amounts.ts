/** Token symbols we pay in, mapped to NEAR Intents asset ids (asset ids from the Agent API docs). */
export const PAYOUT_ASSETS: Record<string, { assetId: string; decimals: number }> = {
  USDT: { assetId: "nep141:usdt.tether-token.near", decimals: 6 },
  USDC: {
    assetId: "nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near",
    decimals: 6,
  },
};

/** "2.5" with 6 decimals -> "2500000". String math only, no floating point. */
export function toAtomic(amount: number | string, decimals: number): string {
  const s = typeof amount === "number" ? amount.toFixed(decimals) : amount.trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error("invalid amount");
  const [whole = "0", frac = ""] = s.split(".");
  if (frac.length > decimals && /[1-9]/.test(frac.slice(decimals))) throw new Error("too many decimals");
  const atomic = BigInt(whole + frac.padEnd(decimals, "0").slice(0, decimals));
  if (atomic <= 0n) throw new Error("amount must be positive");
  return atomic.toString();
}
