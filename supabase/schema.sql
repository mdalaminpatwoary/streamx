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
alter table public.subscriptions add column if not exists acct_profile text;
alter table public.subscriptions add column if not exists acct_pin     text;
alter table public.subscriptions add column if not exists acct_mode    text;
alter table public.subscriptions add column if not exists acct_phone   text;
alter table public.subscriptions add column if not exists acct_family  text;
alter table public.subscriptions add column if not exists vpn_required boolean not null default false;
alter table public.subscriptions add column if not exists vpn_country  text;
alter table public.subscriptions add column if not exists gift_code    text;
alter table public.subscriptions add column if not exists gift_region  text;
alter table public.subscriptions add column if not exists gift_amount  text;
alter table public.subscriptions add column if not exists acct_devices    jsonb;
alter table public.subscriptions add column if not exists acct_changed_at timestamptz;
alter table public.subscriptions add column if not exists acct_change     text;
alter table public.subscriptions add column if not exists acct_seen_at    timestamptz;
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

-- Notice board (admin announcements shown to every customer; only raises the bell count, never pops up)
create table if not exists public.notices (
  id         bigint generated always as identity primary key,
  title      text not null,
  message    text not null default '',
  kind       text not null default 'info',   -- info | offer | maintenance | important
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notices enable row level security;
grant select, insert, update, delete on public.notices to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Customer profile (display name and photo) edited from My account.
create table if not exists public.profiles (
  email      text primary key,
  name       text,
  picture    text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security; -- no policies: only the server (service key) can read or write
grant select, insert, update, delete on public.profiles to service_role;

-- Wishlist and watched titles (one status per title per customer). Run this once in the Supabase SQL Editor.
create table if not exists public.watchlist (
  email text not null,
  kind text not null check (kind in ('movie','tv')),
  tmdb_id integer not null,
  status text not null check (status in ('wish','watched')),
  title text,
  poster text,
  year text,
  rating numeric,
  added_at timestamptz not null default now(),
  primary key (email, kind, tmdb_id)
);
create index if not exists watchlist_email_idx on public.watchlist (email, added_at desc);
alter table public.watchlist enable row level security; -- no policies: only the server (service key) can read or write
grant select, insert, update, delete on public.watchlist to service_role;
notify pgrst, 'reload schema';

-- Sign-in log (one row per successful sign-in). Run once in the Supabase SQL Editor.
create table if not exists public.login_events (
  id bigint generated always as identity primary key,
  email text not null,
  method text not null,
  created_at timestamptz not null default now()
);
create index if not exists login_events_email_idx on public.login_events (email, created_at desc);
alter table public.login_events enable row level security; -- no policies: only the server (service key) can read or write
grant select, insert on public.login_events to service_role;
grant usage, select on all sequences in schema public to service_role;
notify pgrst, 'reload schema';

alter table public.login_events add column if not exists name text;
notify pgrst, 'reload schema';

-- Payment details for purchases the admin adds by hand (shown in the customer's Orders tab). Run once.
alter table public.subscriptions add column if not exists price numeric;
alter table public.subscriptions add column if not exists pay_method text;
alter table public.subscriptions add column if not exists txn_id text;
notify pgrst, 'reload schema';

-- Where an admin-added purchase came from (WhatsApp, Facebook, Instagram...). Run once.
alter table public.subscriptions add column if not exists channel text;
notify pgrst, 'reload schema';
