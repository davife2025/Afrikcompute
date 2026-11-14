import { AUTH_MESSAGE, checkChallenge } from "./session";
import { nep413Hash, verifyEd25519 } from "./nep413";
import { env } from "../env";

export interface LoginInput {
  accountId: string;
  publicKey: string; // "ed25519:<base58>"
  signature: string; // base64, as returned by wallet-selector signMessage
  nonce: string; // hex, from /auth/challenge
  exp: number;
  token: string;
}

export type KeyChecker = (accountId: string, publicKey: string) => Promise<boolean>;

const ACCOUNT_ID = /^[a-z0-9._-]{2,64}$/;

/** Throws on any failure. Returns the verified NEAR account id. */
export async function verifyLogin(input: LoginInput, isFullAccessKey: KeyChecker): Promise<string> {
  if (!ACCOUNT_ID.test(input.accountId)) throw new Error("invalid account id");
  if (!checkChallenge(input.nonce, input.exp, input.token)) throw new Error("challenge invalid or expired");

  const nonce = Buffer.from(input.nonce, "hex");
  const hash = nep413Hash({ message: AUTH_MESSAGE, nonce, recipient: env.AUTH_RECIPIENT });
  const ok = verifyEd25519(input.publicKey, Buffer.from(input.signature, "base64"), hash);
  if (!ok) throw new Error("signature invalid");

  if (!(await isFullAccessKey(input.accountId, input.publicKey))) {
    throw new Error("public key is not a full access key of this account");
  }
  return input.accountId;
}
