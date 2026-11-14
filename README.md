# AfrikCompute: snapshot after Session 3 (Data model and wallet sign-in)

This is the project as it stood at the end of this session. Later sessions add to it. The complete project is `afrikcompute-complete.zip` (also the Session 7 zip).

## What is in this snapshot (cumulative)

1. Monorepo: `apps/api` (Express + TypeScript), `apps/web` (Next.js placeholder page), `packages/shared` (types), Supabase client, `/health` route that checks your Supabase project.
2. NEAR AI Cloud client and an attestation verifier (nonce echoed, Intel TDX quote, key and nonce bound to the report, debug off, NVIDIA GPU attestation). `pnpm --filter @afrikcompute/api near:check` sends one completion and prints a Verified panel. Needs `NEAR_AI_API_KEY`. Not yet confirmed against the live service by the author.
3. Supabase schema (`supabase/migrations/0001_init.sql`), NEAR wallet sign-in (NEP-413) on testnet, profiles, languages and requests endpoints. Needs `API_JWT_SECRET`.

## Setup (Windows PowerShell)

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
Copy-Item .env.example .env
```

Fill in `.env`. Starting the API needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, plus any variable listed for this session above.

Run in the Supabase SQL editor, in order: `supabase/migrations/0001_init.sql`.

## Run the checks for this session

```powershell
pnpm typecheck
pnpm --filter @afrikcompute/api auth:selftest
```

These use local keys and fake services. They do not call NEAR, Supabase or NVIDIA.

## Note

Snapshots are rebuilt from the final code with later sessions' features removed, so a few details (comments, wording) can differ slightly from what was delivered at the time. `pnpm-lock.yaml` is not included in early snapshots; `pnpm install` creates it.
