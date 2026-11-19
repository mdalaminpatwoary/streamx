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
create index if not exists subscriptions_email_idx on public.subscriptions (email);

create table if not exists public.orders (
  mtid        text primary key,
  email       text not null,
  name        text,
  phone       text,
  lines       jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.login_links (
  email       text primary key,
  sent_at     timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.orders        enable row level security;
alter table public.login_links   enable row level security;
