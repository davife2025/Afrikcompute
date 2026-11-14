import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { AuthChallenge } from "@afrikcompute/shared";
import { env } from "../env";

export const AUTH_MESSAGE = "Sign in to AfrikCompute";
const CHALLENGE_TTL_SECONDS = 300;
const SESSION_TTL = "7d";

export interface AuthUser {
  id: string; // profiles.id
  nearAccountId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const secretKey = () => new TextEncoder().encode(env.API_JWT_SECRET);
const mac = (nonce: string, exp: number) =>
  createHmac("sha256", env.API_JWT_SECRET).update(`challenge.${nonce}.${exp}`).digest("hex");

/** Stateless challenge: nothing is stored. The HMAC proves we issued it. */
export function createChallenge(): AuthChallenge {
  const nonce = randomBytes(32).toString("hex");
  const exp = Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS;
  return { nonce, exp, token: mac(nonce, exp), message: AUTH_MESSAGE, recipient: env.AUTH_RECIPIENT };
}

export function checkChallenge(nonce: string, exp: number, token: string): boolean {
  if (exp < Math.floor(Date.now() / 1000)) return false;
  const a = Buffer.from(mac(nonce, exp));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function issueSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({ acct: user.nearAccountId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  if (!payload.sub || typeof payload["acct"] !== "string") throw new Error("bad token");
  return { id: payload.sub, nearAccountId: payload["acct"] };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    req.user = await readSessionToken(token);
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}
