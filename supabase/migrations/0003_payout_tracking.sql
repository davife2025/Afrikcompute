-- Session 5: payout tracking for the Agents on Intents transfer flow.
alter table payouts add column if not exists idempotency_key text unique;
alter table payouts add column if not exists correlation_id text;
alter table payouts add column if not exists failure_code text;
alter table payouts add column if not exists updated_at timestamptz not null default now();

alter table payouts drop constraint if exists payouts_status_check;
alter table payouts add constraint payouts_status_check
  check (status in ('pending', 'processing', 'sent', 'failed', 'needs_review', 'simulated'));

-- One payout per submission.
create unique index if not exists payouts_submission_unique on payouts (submission_id);
