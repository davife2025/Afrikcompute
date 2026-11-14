# AfrikCompute

Datasets for African languages, reviewed privately inside a TEE and paid for on NEAR.

**Hackathon track:** Privacy and Private AI (NEAR hackathon, November 2026).

Contributors write or translate short texts in Hausa, Yoruba, Igbo, Swahili and more, across four domains: agriculture, health, financial inclusion, and education and government services. Each contribution is reviewed by a model running on NEAR AI Cloud (TEE-hosted), and the app shows a **Verified panel** listing which attestation checks passed and which are not checked yet. Approved work is paid out through the NEAR Intents Agent API.

Why this design: African-language data is scarce, sensitive health and finance text should not leak, and data workers are often paid late or not at all. Research notes are at the end of this file.

## What is real and what is not (read this first)

| Part | Status |
| --- | --- |
| Private review on NEAR AI Cloud with a fresh attestation nonce on every call | Built. Needs your `NEAR_AI_API_KEY` and a model id. |
| Attestation checks: nonce echoed, Intel TDX quote (DCAP), signing key and nonce bound to the report, debug off, NVIDIA GPU attestation | Built. Not yet confirmed against the live service by the author (see limitations). |
| Attestation checks NOT done yet: event log replay, compose hash, pinned model identity, per-response signature | Listed in the Verified panel as "Not checked yet". |
| Encrypted storage of submissions (AES-256-GCM) | Built and tested. |
| NEAR wallet sign-in (NEP-413) on testnet | Built. Verified offline with a local key; not yet tried with a real wallet. |
| Payouts through the NEAR Intents Agent API | Built. Default mode is `simulate` (nothing is sent). `live` moves real mainnet funds. |
| Request, task, submit, approve and payout screens (`/requests`, `/requests/new`, `/requests/[id]`, `/dashboard`) | Built. Tested in a browser against a mock API (18 flow checks); not yet against your live Supabase and NEAR AI Cloud. |
| Text tasks only | Images and audio are roadmap. |

## How privacy works

- **Private review (`apps/api/src/private/`)** keeps nothing server-side. Input lives in local variables for the length of one request. The folder has no database access, no file access and no logging, and `pnpm --filter @afrikcompute/api privacy:check` fails if that changes.
- **The Verified panel** is built from a real attestation fetched with a fresh random nonce for every review. It never says "Verified" before a review has run, and it lists what is not checked.
- **Stored submissions** are the dataset, so they are stored, but encrypted before they reach the database. This protects against a leaked database or backup. The API holds the key, so it does not protect against a compromised API server.
- **Database access** goes only through the API (service role key). Row-level security is on with no policies, so the browser cannot read tables.
- The model sees untrusted contributor text as data, inside delimiters, and is told never to follow instructions inside it.

## Architecture

```
apps/web  (Next.js)  --->  apps/api  (Express + TypeScript)  --->  NEAR AI Cloud (TEE model + attestation)
   wallet sign-in               |                                   NEAR Intents Agent API (payouts)
   /try, /docs, landing         +-->  Supabase (Postgres, encrypted submissions)
packages/shared: types, domains, fictional samples
```

## Quick start (Windows PowerShell)

Needs Node 20 or 22 (the project was tested on Node 22), a Supabase project, a NEAR AI Cloud API key and a NEAR testnet wallet (Meteor or MyNearWallet).

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
Copy-Item .env.example .env
Copy-Item apps/web/.env.local.example apps/web/.env.local
```

1. In the Supabase SQL editor run, in order: `supabase/migrations/0001_init.sql`, `0002_encrypt_submissions.sql`, `0003_payout_tracking.sql`, `0004_domains.sql`, then `supabase/seed/sample_data.sql` (fictional requests and tasks).
2. Fill `.env` (see the table below) and `apps/web/.env.local`.
3. Find a model id: `pnpm --filter @afrikcompute/api near:check` prints the models list, sends one completion and prints the Verified panel. Put a TEE-hosted model id in `NEAR_AI_MODEL`.
4. Start everything: `pnpm dev` (web on http://localhost:3000, API on http://localhost:4000/health).

| Variable (`.env`) | Needed for |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | API start-up |
| `API_JWT_SECRET` (32+ chars), `DATA_ENCRYPTION_KEY` (32 bytes, base64) | API start-up. `.env.example` shows how to generate them |
| `NEAR_NETWORK` (`testnet`), `AUTH_RECIPIENT` | Wallet sign-in |
| `NEAR_AI_API_KEY`, `NEAR_AI_MODEL` | Private review |
| `PAYOUT_MODE` (`simulate` by default) and the `NEAR_INTENTS_*`, `PAYOUT_*` values | Payouts (live mode only) |
| `HF_TOKEN` | Reserved for non-sensitive tasks with Kimi K2 through Hugging Face. Not used yet. |

`apps/web/.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Contributor and requester flows

1. A requester opens **Post a request** (`/requests/new`), sets language, domain, task type and reward, and adds tasks (one source text per line). A contributor account can switch itself to "both" on that page.
2. A contributor opens **Requests**, picks a request and works on an open task. The text goes through the private TEE review. If the review does not accept it, the verdict is shown and nothing is stored. If it does, the text is stored encrypted and the task becomes "submitted".
3. The requester opens the request, views the submission (decrypted for them only), then approves or rejects it. Approving creates one payout and sends it (simulated by default). Rejecting reopens the task for someone else.
4. **My work** (`/dashboard`) shows a contributor their submissions and payout status, and a requester their requests with task counts.

Rewards are paid from the platform's payout agent. Requester deposits are not built yet.

## Demo script (about 90 seconds, no real data)

1. Open the landing page. Switch the language toggle (Hausa, Yoruba and Igbo text is a draft). Press Ctrl K and search for "private".
2. Connect a testnet wallet, then sign in.
3. Open **Proof** (`/try`). Pick the sample **Good: health-yo-ok**. Run the private review. Open the Verified panel in the header and read which checks passed and which are not checked yet.
4. Pick **Should be flagged: bad-personal-data** and run it. The review should flag the phone number. (Model verdicts can vary between runs.)
5. Show `pnpm --filter @afrikcompute/api privacy:check`, then open `apps/api/src/private/review.ts` to show the "keeps nothing" rules.

## Sample data

All sample data is fictional. `samples/contributions.json` holds 8 sample contributions (6 good, 2 that should be flagged) covering all four domains. They are also built into the `/try` page. `supabase/seed/sample_data.sql` adds fictional requests and tasks. The sample sentences in Hausa, Yoruba, Igbo and Swahili are short drafts that a native speaker should check.

## API

See `/docs` in the web app, or `apps/web/lib/endpoints.ts`. Send `Authorization: Bearer <token>` after signing in.

## Tests

```powershell
pnpm check
```

Runs the typecheck, the auth, encryption, review-parsing and payout self-tests, the privacy check, and the sample export. These use local keys and fake services: they do not call NEAR, Supabase or NVIDIA.

## Payouts

`PAYOUT_MODE=simulate` (default) never calls the Agent API and records payouts as `simulated`. The Agent API is a mainnet-only beta, and live mode moves real funds, so start with tiny amounts (`PAYOUT_MAX_AMOUNT`, default 5). One-time setup (partner key, agent, grant, funding) is in NEAR's docs: https://docs.agentsonintents.com/integration/agent-api/overview. Safety rules in code: the idempotency key is stored before any send and never regenerated, a payout with a correlation id is only polled, and there is one payout per submission.

## Troubleshooting

- **`pnpm install` fails with `ERR_INVALID_THIS` or `ERR_PNPM_META_FETCH_FAIL`.** This looks like a pnpm and Node version mismatch, usually on a very new Node release. Use Node 22 LTS (check with `node --version`). On Vercel, set Project Settings, Node.js Version, to 22.x. A newer pnpm (`corepack prepare pnpm@10 --activate`) may also work; that was not tested here.
- **The page says "Session 1 scaffold".** You are running an early session's folder. Use the complete project, stop the dev server, delete `apps/web/.next` and start again.
- **The API will not start.** It needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `API_JWT_SECRET` and `DATA_ENCRYPTION_KEY` in the root `.env`.

## Known limitations

- Attestation: the NVIDIA verification URLs in `apps/api/src/near/attestation.ts` were written from documentation and are not confirmed against the live service. Four checks are not implemented (listed above).
- Wallet sign-in has not been tried with real wallets. Redirect wallets finish sign-in from the URL hash after they return.
- Sign-in challenges are stateless, so a captured signed login could be replayed within its 5 minute window.
- Session tokens are kept in localStorage.
- No rate limiting. Each review makes paid model calls.
- Requesters do not deposit rewards; payouts come from the operator's agent balance.
- Two contributors can submit to the same open task at the same moment; the task is not locked.
- The request, task and dashboard pages are English only. The interface strings that exist in Hausa, Yoruba and Igbo are drafts.
- Fair pay: rewards are set by requesters and we do not enforce a minimum rate yet.
- Hausa, Yoruba and Igbo interface text and sample sentences are unreviewed drafts.
- Domain labels in the `/try` page are English only.

## Roadmap

Image and audio contributions (crop and skin images, speech), expert reviewer roles (agronomists, clinicians), a minimum reward, the missing attestation checks, per-response signatures, rate limiting, and native-speaker review of all translations.

## Research notes

- Language data is already collected by domain: Masakhane's hub targets agriculture, government services, health, education and economic inclusion.
- Crop image data is plentiful but expert labels are scarce: one open crop dataset has about 7.5 million images and only about 40 thousand with organ-level annotations.
- Health AI is limited by missing annotated, shared datasets rather than algorithms, and models trained on foreign data lose accuracy in African settings.
- Kenya has no law specific to data-annotation work, and Fairwork's first principle is pay on time and in full.

## Repo layout

```
apps/api            Express API, NEAR AI Cloud client, attestation verifier, payouts, auth
apps/web            Next.js app: landing, /try, /docs, wallet sign-in, Verified panel
packages/shared     Shared types, domains and fictional samples
supabase/           Migrations 0001 to 0004 and fictional seed data
samples/            Fictional sample contributions (JSON)
docs/               Pitch deck (AfrikCompute-pitch-deck.pptx)
```
