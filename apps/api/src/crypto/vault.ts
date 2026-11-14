import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../env";

/**
 * Encryption at rest for submissions (AES-256-GCM).
 * This protects against a leaked database or backup. The API process holds the key, so it is NOT
 * protection against a compromised API server.
 * `aad` binds a ciphertext to its row (e.g. the task id) so it cannot be swapped between rows.
 */

const key = () => Buffer.from(env.DATA_ENCRYPTION_KEY, "base64");

export function encryptText(plain: string, aad: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(".");
}

export function decryptText(blob: string, aad: string): string {
  const [v, iv, tag, ct] = blob.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("bad ciphertext format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]).toString("utf8");
}

export const sha256Hex = (s: string) => createHash("sha256").update(s).digest("hex");
