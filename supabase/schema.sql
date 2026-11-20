-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Row Level Security is ON and there are NO public policies, so only the server (service key) can read or write.

create table if not exists public.subscriptions (
  id          bigint generated always as identity primary key,
  email       text not null,
  name        text,
  phone       text,
  service     text not null,
  plan        text not null,
  months      int  not null check (months between 1 and 60),
  start_date  date not null,
  end_date    date not null,
  source      text not null default 'admin',   -- 'admin' or 'online'
  order_ref   text,
  line_idx    int,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (order_ref, line_idx)
);
-- Login details of the delivered account (password is stored encrypted by the server)
alter table public.subscriptions add column if not exists acct_email text;
alter table public.subscriptions add column if not exists acct_pass  text;
alter table public.subscriptions add column if not exists acct_otp   boolean not null default false;
create index if not exists subscriptions_email_idx on public.subscriptions (email);

create table if not exists public.orders (
  mtid        text primary key,
  email       text not null,
  name        text,
  phone       text,
  lines       jsonb not null,
  paid        boolean not null default false,
  paid_at     timestamptz,
  delivery    text not null default 'pending',
  delivered_at timestamptz,
  created_at  timestamptz not null default now()
);
-- For projects created before delivery tracking:
alter table public.orders add column if not exists paid boolean not null default false;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists delivery text not null default 'pending';
alter table public.orders add column if not exists delivered_at timestamptz;

create table if not exists public.login_links (
  email       text primary key,
  sent_at     timestamptz not null default now()
);

-- One-time sign-in codes (6 digits, stored only as a keyed hash).
create table if not exists public.login_codes (
  email       text primary key,
  code_hash   text not null,
  expires_at  timestamptz not null,
  tries       int  not null default 0,
  sent_at     timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.orders        enable row level security;
alter table public.login_links   enable row level security;
alter table public.login_codes   enable row level security;

-- Let the server (service_role) use these tables. Needed because "Grant API access to new tables automatically" was off.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.subscriptions, public.orders, public.login_links, public.login_codes to service_role;
grant usage, select on all sequences in schema public to service_role;
