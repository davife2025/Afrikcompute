-- Session 4: submissions are stored encrypted (AES-256-GCM, done in apps/api).
-- Run once. Fails if submissions already has rows (there should be none yet).
alter table submissions add column if not exists content_encrypted text;
alter table submissions drop column if exists content;
alter table submissions alter column content_encrypted set not null;
-- verification now holds: { "verdict": {score, ok, issues}, "verification": {checks...} }
