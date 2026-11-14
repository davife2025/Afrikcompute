-- Session 8: requests are described by language, domain and modality.
-- Modality is text only for now; image and audio are on the roadmap and will relax this check.
alter table requests add column if not exists domain text not null default 'general'
  check (domain in ('general', 'agriculture', 'health', 'finance', 'education'));
alter table requests add column if not exists modality text not null default 'text'
  check (modality in ('text'));
create index if not exists requests_domain_idx on requests (domain, status);
