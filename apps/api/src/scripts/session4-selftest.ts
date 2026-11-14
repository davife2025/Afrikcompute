process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test";
process.env.API_JWT_SECRET ??= "x".repeat(40);
process.env.DATA_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
export {};
process.env.DATA_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");

async function main() {
  const { encryptText, decryptText } = await import("../crypto/vault");
  const { parseVerdict } = await import("../private/review");
  const r: [string, boolean][] = [];
  const throws = (f: () => unknown) => { try { f(); return false; } catch { return true; } };

  const blob = encryptText("Ina kwana, abokina", "submission:t1");
  r.push(["encrypt/decrypt round trip", decryptText(blob, "submission:t1") === "Ina kwana, abokina"]);
  r.push(["plaintext not visible in blob", !blob.includes("Ina")]);
  r.push(["wrong row (aad) rejected", throws(() => decryptText(blob, "submission:t2"))]);
  const parts = blob.split(".");
  parts[3] = Buffer.from("tampered").toString("base64");
  r.push(["tampered ciphertext rejected", throws(() => decryptText(parts.join("."), "submission:t1"))]);
  r.push(["two encryptions differ (random iv)", encryptText("a", "x") !== encryptText("a", "x")]);

  r.push(["verdict parses plain JSON", parseVerdict('{"score": 88.4, "ok": true, "issues": []}').score === 88]);
  r.push(["verdict parses fenced JSON", parseVerdict('```json\n{"score":40,"ok":false,"issues":["wrong language"]}\n```').ok === false]);
  r.push(["verdict rejects prose", throws(() => parseVerdict("Looks good to me!"))]);
  r.push(["verdict rejects out-of-range score", throws(() => parseVerdict('{"score":500,"ok":true}'))]);

  for (const [n, ok] of r) console.log(`${ok ? "PASS" : "FAIL"}  ${n}`);
  process.exit(r.every(([, ok]) => ok) ? 0 : 1);
}
main();
