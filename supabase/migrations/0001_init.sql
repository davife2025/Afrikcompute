-- AfrikCompute core schema (Session 3)
-- Access model: ALL data access goes through apps/api using the service role key.
-- RLS is enabled with no policies, so the anon and authenticated roles can read nothing directly.

create extension if not exists pgcrypto;

create table if not exists languages (
  code        text primary key,
  name        text not null,
  native_name text
);

create table if not exists profiles (
  id              uuid primary key default gen_random_uuid(),
  near_account_id text not null unique,
  role            text not null default 'contributor' check (role in ('contributor', 'requester', 'both')),
  locale          text not null default 'en' check (locale in ('en', 'ha', 'yo', 'ig')),
  created_at      timestamptz not null default now()
);

create table if not exists requests (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles (id) on delete cascade,
  title         text not null,
  description   text,
  language_code text not null references languages (code),
  task_type     text not null check (task_type in ('label', 'translate', 'review', 'transcribe')),
  reward_amount numeric(18, 6) not null check (reward_amount > 0),
  reward_token  text not null default 'USDC',
  status        text not null default 'open' check (status in ('open', 'closed')),
  created_at    timestamptz not null default now()
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references requests (id) on delete cascade,
  payload     jsonb not null,
  status      text not null default 'open' check (status in ('open', 'assigned', 'submitted', 'approved', 'rejected')),
  assigned_to uuid references profiles (id),
  created_at  timestamptz not null default now()
);

-- NOTE: this table stores what contributors submit (the dataset is the product).
-- The "keep nothing server-side" promise applies to the private review step in Session 4, not to this table.
create table if not exists submissions (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references tasks (id) on delete cascade,
  contributor_id uuid not null references profiles (id) on delete cascade,
  content        jsonb not null,
  content_sha256 text not null,
  -- Result of the TEE review run (checks and pass/fail only, no raw inputs).
  verification   jsonb,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at     timestamptz not null default now()
);

create table if not exists payouts (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references submissions (id) on delete cascade,
  contributor_id uuid not null references profiles (id),
  amount         numeric(18, 6) not null check (amount > 0),
  token          text not null default 'USDC',
  status         text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  tx_ref         text,
  created_at     timestamptz not null default now()
);

create index if not exists requests_status_idx on requests (status, created_at desc);
create index if not exists tasks_request_idx on tasks (request_id, status);
create index if not exists submissions_task_idx on submissions (task_id);
create index if not exists payouts_contributor_idx on payouts (contributor_id);

alter table languages   enable row level security;
alter table profiles    enable row level security;
alter table requests    enable row level security;
alter table tasks       enable row level security;
alter table submissions enable row level security;
alter table payouts     enable row level security;

insert into languages (code, name, native_name) values
  ('ha',  'Hausa',          'Hausa'),
  ('yo',  'Yoruba',         'Yorùbá'),
  ('ig',  'Igbo',           'Igbo'),
  ('sw',  'Swahili',        'Kiswahili'),
  ('am',  'Amharic',        'አማርኛ'),
  ('zu',  'Zulu',           'isiZulu'),
  ('pcm', 'Nigerian Pidgin', 'Naijá')
on conflict (code) do nothing;
