import { createHash, createPublicKey, verify } from "node:crypto";

/** NEP-413 (NEAR signMessage) hashing and ed25519 verification. No external deps. */

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Decode(s: string): Buffer {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("invalid base58");
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  for (const c of s) {
    if (c !== "1") break;
    bytes.unshift(0);
  }
  return Buffer.from(bytes);
}

const TAG = 2147484061; // 2^31 + 413

const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const borshString = (s: string) => {
  const d = Buffer.from(s, "utf8");
  return Buffer.concat([u32(d.length), d]);
};

export interface Nep413Payload {
  message: string;
  nonce: Buffer; // 32 bytes
  recipient: string;
  callbackUrl?: string;
}

/** SHA-256 of tag + borsh(payload). This is the exact byte string the wallet signs. */
export function nep413Hash(p: Nep413Payload): Buffer {
  if (p.nonce.length !== 32) throw new Error("nonce must be 32 bytes");
  const payload = Buffer.concat([
    u32(TAG),
    borshString(p.message),
    p.nonce,
    borshString(p.recipient),
    p.callbackUrl ? Buffer.concat([Buffer.from([1]), borshString(p.callbackUrl)]) : Buffer.from([0]),
  ]);
  return createHash("sha256").update(payload).digest();
}

const SPKI_ED25519_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** publicKey is NEAR format: "ed25519:<base58>". */
export function verifyEd25519(publicKey: string, signature: Buffer, message: Buffer): boolean {
  if (!publicKey.startsWith("ed25519:")) return false;
  const raw = base58Decode(publicKey.slice("ed25519:".length));
  if (raw.length !== 32 || signature.length !== 64) return false;
  const key = createPublicKey({ key: Buffer.concat([SPKI_ED25519_PREFIX, raw]), format: "der", type: "spki" });
  return verify(null, message, key, signature);
}
