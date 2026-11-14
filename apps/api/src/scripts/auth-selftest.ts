/**
 * Offline self-test of sign-in: builds a NEP-413 signature with a local ed25519 key and runs verifyLogin.
 * Run: pnpm --filter @afrikcompute/api auth:selftest
 * (Uses dummy env values; never touches Supabase or NEAR.)
 */
process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test";
process.env.API_JWT_SECRET ??= "x".repeat(40);
process.env.DATA_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
export {};

async function main() {
  const { generateKeyPairSync, sign } = await import("node:crypto");
  const { createChallenge, issueSessionToken, readSessionToken, AUTH_MESSAGE } = await import("../auth/session");
  const { verifyLogin } = await import("../auth/login");
  const { nep413Hash } = await import("../auth/nep413");
  const { env } = await import("../env");

  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const b58 = (buf: Buffer) => {
    let n = BigInt("0x" + buf.toString("hex"));
    let out = "";
    while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
    for (const byte of buf) { if (byte === 0) out = "1" + out; else break; }
    return out;
  };

  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = (publicKey.export({ format: "der", type: "spki" }) as Buffer).subarray(-32);
  const pk = `ed25519:${b58(raw)}`;

  const ch = createChallenge();
  const hash = nep413Hash({ message: AUTH_MESSAGE, nonce: Buffer.from(ch.nonce, "hex"), recipient: env.AUTH_RECIPIENT });
  const sig = sign(null, hash, privateKey).toString("base64");

  const input = { accountId: "alice.near", publicKey: pk, signature: sig, nonce: ch.nonce, exp: ch.exp, token: ch.token };
  const yes = async () => true;
  const no = async () => false;

  const results: [string, boolean][] = [];
  results.push(["valid signature accepted", (await verifyLogin(input, yes).catch(() => "")) === "alice.near"]);
  results.push(["non-full-access key rejected", await verifyLogin(input, no).then(() => false, () => true)]);
  results.push(["tampered signature rejected", await verifyLogin({ ...input, signature: Buffer.alloc(64).toString("base64") }, yes).then(() => false, () => true)]);
  results.push(["tampered challenge token rejected", await verifyLogin({ ...input, token: "00".repeat(32) }, yes).then(() => false, () => true)]);
  results.push(["expired challenge rejected", await verifyLogin({ ...input, exp: 1 }, yes).then(() => false, () => true)]);

  const session = await issueSessionToken({ id: "11111111-1111-1111-1111-111111111111", nearAccountId: "alice.near" });
  const user = await readSessionToken(session);
  results.push(["session token round trip", user.nearAccountId === "alice.near"]);

  for (const [name, ok] of results) console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  process.exit(results.every(([, ok]) => ok) ? 0 : 1);
}
main();
