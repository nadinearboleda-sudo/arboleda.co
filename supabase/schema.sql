-- arboleda.co — Supabase schema + row-level security
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent-ish: safe to
-- re-run after dropping, but review before running on data you care about.

-- ─────────────────────────────────────────────────────────── extensions
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────── tables
-- One row per client, keyed to their auth email.
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  company     text,
  created_at  timestamptz not null default now()
);

create table if not exists public.intakes (
  client_id   uuid primary key references public.clients(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.discovery (
  client_id   uuid primary key references public.clients(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- The engagement state machine. state/price/signoffs/payments are operator- or
-- webhook-authorised; clients may only set `focus`.
create table if not exists public.engagements (
  client_id   uuid primary key references public.clients(id) on delete cascade,
  focus       text check (focus in ('anatomy','aurora','alchemy','unsure')),
  state       text not null default 'discovery'
                check (state in ('discovery','proposal','step1_paid','step1_delivered','step2_paid','m2','m3')),
  price       integer,                       -- audit price in AUD dollars, operator-set
  signoffs    jsonb not null default '{}'::jsonb,
  payments    jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Immutable-ish audit log of payments (webhook writes; nobody updates/deletes).
create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  stage             text not null,            -- audit-deposit | audit-balance | step2 | m2 | m3
  amount            integer not null,         -- AUD dollars
  stripe_session_id text unique,
  paid_at           timestamptz not null default now()
);

-- Real deliverable files (Phase 2+). Files live in Storage; this is the index.
create table if not exists public.deliverables (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  stage         text not null,                -- step1 | m1 | m2 | m3
  key           text not null,                -- stable id e.g. 'sysmap'
  title         text not null,
  status        text not null default 'locked', -- locked | in_progress | ready
  storage_path  text,                          -- path in the 'deliverables' bucket
  version       text,
  as_at         date,
  updated_at    timestamptz not null default now(),
  unique (client_id, key)
);

-- ─────────────────────────────────────────────────────────── operator allowlist
-- An email in here is treated as staff (full read/write). Add yourself after deploy:
--   insert into public.operators(email) values ('you@arboleda.co');
create table if not exists public.operators (
  email text primary key
);

create or replace function public.is_operator()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.operators o
    where o.email = (auth.jwt() ->> 'email')
  );
$$;

-- Resolve the current auth user to a clients.id (by email).
create or replace function public.my_client_id()
returns uuid language sql stable as $$
  select c.id from public.clients c
  where c.email = (auth.jwt() ->> 'email')
  limit 1;
$$;

-- ─────────────────────────────────────────────────────────── RLS
alter table public.clients      enable row level security;
alter table public.intakes      enable row level security;
alter table public.discovery    enable row level security;
alter table public.engagements  enable row level security;
alter table public.payments     enable row level security;
alter table public.deliverables enable row level security;
alter table public.operators    enable row level security;

-- clients: a user sees/creates only their own row (matched by email); operators see all.
drop policy if exists clients_self on public.clients;
create policy clients_self on public.clients
  for all using (email = (auth.jwt() ->> 'email') or public.is_operator())
  with check (email = (auth.jwt() ->> 'email') or public.is_operator());

-- intakes / discovery: client owns their row; operator full access.
drop policy if exists intakes_own on public.intakes;
create policy intakes_own on public.intakes
  for all using (client_id = public.my_client_id() or public.is_operator())
  with check (client_id = public.my_client_id() or public.is_operator());

drop policy if exists discovery_own on public.discovery;
create policy discovery_own on public.discovery
  for all using (client_id = public.my_client_id() or public.is_operator())
  with check (client_id = public.my_client_id() or public.is_operator());

-- engagements: client may READ own + INSERT/UPDATE only the `focus` field.
-- state/price/signoffs/payments are changed by the service role (webhook/operator
-- functions) which bypasses RLS, or by an operator session.
drop policy if exists eng_read on public.engagements;
create policy eng_read on public.engagements
  for select using (client_id = public.my_client_id() or public.is_operator());

drop policy if exists eng_client_focus on public.engagements;
create policy eng_client_focus on public.engagements
  for insert with check (client_id = public.my_client_id() or public.is_operator());

drop policy if exists eng_operator_update on public.engagements;
create policy eng_operator_update on public.engagements
  for update using (public.is_operator()) with check (public.is_operator());

-- A trigger keeps clients honest on BOTH insert and update. A direct end-user write
-- (role 'authenticated'/'anon' via the anon key) who is not an operator may only ever
-- set `focus` (and their own client_id, enforced by RLS): protected columns are forced
-- to safe defaults on INSERT and frozen on UPDATE. The service role (webhook + operator
-- functions) and the dashboard/postgres roles are trusted and bypass the check — note
-- they must, since is_operator() reads an email claim the service-role JWT does not carry.
create or replace function public.guard_engagement_write()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_operator() then
    if tg_op = 'INSERT' then
      new.state    := 'discovery';
      new.price    := null;
      new.signoffs := '{}'::jsonb;
      new.payments := '[]'::jsonb;
    elsif tg_op = 'UPDATE' then
      if new.state is distinct from old.state
         or new.price is distinct from old.price
         or new.signoffs is distinct from old.signoffs
         or new.payments is distinct from old.payments then
        raise exception 'Only operators or the payment webhook may change engagement state.';
      end if;
    end if;
  end if;
  new.updated_at = now();
  return new;
end; $$;
drop trigger if exists trg_guard_engagement on public.engagements;
create trigger trg_guard_engagement before insert or update on public.engagements
  for each row execute function public.guard_engagement_write();
drop function if exists public.guard_engagement_update();

-- payments: read own / operator; writes only via service role (no client policy).
drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
  for select using (client_id = public.my_client_id() or public.is_operator());

-- deliverables: read own / operator; writes via service role / operator.
drop policy if exists deliverables_read on public.deliverables;
create policy deliverables_read on public.deliverables
  for select using (client_id = public.my_client_id() or public.is_operator());
drop policy if exists deliverables_operator on public.deliverables;
create policy deliverables_operator on public.deliverables
  for all using (public.is_operator()) with check (public.is_operator());

-- operators: only operators can read the list; nobody self-grants from the client.
drop policy if exists operators_read on public.operators;
create policy operators_read on public.operators
  for select using (public.is_operator());

-- ─────────────────────────────────────────────────────────── storage bucket
-- Run once; private bucket, served via signed URLs from the functions.
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;
