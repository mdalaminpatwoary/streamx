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

-- Customer mobile number on the profile (required when an account is first set up).
alter table public.profiles add column if not exists phone text;
notify pgrst, 'reload schema';

-- Customer reviews (managed from Admin → Reviews). The 8 demo reviews are inserted once so you can delete them from the admin page.
create table if not exists public.reviews (
  id         bigint generated always as identity primary key,
  name       text not null,
  role       text not null default '',
  company    text not null default '',
  loc        text not null default '',
  services   jsonb not null default '[]',
  rating     int  not null default 5,
  body       text not null,
  photo      text not null default '',
  proof_kind text not null default '',   -- '' | 'image' | 'link'  (the "View original review" proof)
  proof_url  text not null default '',   -- link to the original review (kind = link)
  proof_img  text not null default '',   -- screenshot of the original review, stored as a small JPEG data URL (kind = image)
  has_img    boolean not null default false,
  popular    boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
grant select, insert, update, delete on public.reviews to service_role;
grant usage, select on all sequences in schema public to service_role;
insert into public.reviews (name, role, company, loc, services, rating, body, popular)
select * from (values
  ('Rafiq Hasan','Software Engineer','CodeNest Technologies','Dhaka','["Netflix","Spotify"]'::jsonb,5,'Got my Netflix in 5 minutes. Very fast and honest service. Highly recommended!',true),
  ('Tania Akter','University Student','','Chattogram','["Spotify"]'::jsonb,5,'Spotify price is great and support replied quickly on WhatsApp. Smooth payment with bKash.',false),
  ('Sabbir Mahmud','Video Editor','FrameLab Studio','Dhaka','["YouTube Premium","CapCut"]'::jsonb,5,'YouTube Premium works perfectly. I renewed for 12 months and saved a lot.',true),
  ('Nusrat Jahan','Medical Student','','Sylhet','["ChatGPT"]'::jsonb,5,'Bought ChatGPT for my studies. Delivery was instant and the team is very polite.',true),
  ('Imran Khan','Business Owner','Khan Traders','Dhaka','["Entertainment Combo"]'::jsonb,4,'Good prices and clear process. Had a small issue, they replaced it within minutes.',false),
  ('Mehjabin Sultana','Boutique Owner','Mehjabin''s Boutique','Khulna','["Canva"]'::jsonb,5,'Canva for my small business. Trusted seller, 24/7 support is real.',true),
  ('Fahim Rahman','Graphic Designer','Studio Fahim','Rajshahi','["CapCut","Canva"]'::jsonb,5,'Bought Canva and CapCut together. Genuine service and very fair price.',false),
  ('Sadia Islam','Digital Marketer','GrowMore Agency','Dhaka','["Disney+"]'::jsonb,5,'Fast reply even late at night. My Disney+ account was ready in minutes.',false)
) as d(name, role, company, loc, services, rating, body, popular)
where not exists (select 1 from public.reviews);

-- Public notice board (/notices/): more types, pinned posts and an optional link
alter table public.notices add column if not exists pinned     boolean not null default false;
alter table public.notices add column if not exists link       text    not null default '';
alter table public.notices add column if not exists link_label text    not null default '';

-- Coupon codes (managed from Admin → Coupons). The discount is calculated on the server at checkout.
create table if not exists public.coupons (
  id           bigint generated always as identity primary key,
  code         text not null unique,                 -- stored in capitals, e.g. EID10
  kind         text not null default 'percent',      -- percent | fixed
  value        int  not null,                        -- percent (1-100) or taka off
  max_discount int  not null default 0,              -- cap for percent coupons (0 = no cap)
  min_order    int  not null default 0,              -- minimum cart subtotal in taka (0 = none)
  max_uses     int  not null default 0,              -- total paid uses allowed (0 = unlimited)
  per_email    boolean not null default true,        -- one use per customer email
  services     jsonb not null default '[]',          -- limit to these services (empty = whole cart)
  expires_at   timestamptz,
  active       boolean not null default true,
  note         text not null default '',
  created_at   timestamptz not null default now()
);
alter table public.coupons enable row level security;
grant select, insert, update, delete on public.coupons to service_role;
grant usage, select on all sequences in schema public to service_role;
alter table public.orders add column if not exists coupon   text;
alter table public.orders add column if not exists discount int not null default 0;

-- Reviews: student / institution, country, expatriate and an uploaded customer photo
alter table public.reviews add column if not exists kind        text    not null default 'pro';   -- pro | student
alter table public.reviews add column if not exists institution text    not null default '';
alter table public.reviews add column if not exists country     text    not null default '';      -- 2-letter code, e.g. BD, GB, AE
alter table public.reviews add column if not exists expat       boolean not null default false;   -- Bangladeshi living abroad
alter table public.reviews add column if not exists photo_img   text    not null default '';      -- uploaded customer photo (small JPEG data URL)
alter table public.reviews add column if not exists has_photo   boolean not null default false;

-- Manual IDs (1, 2, 3, ...) for purchases added by hand with "Add subscription". Run once in the Supabase SQL Editor.
alter table public.subscriptions add column if not exists manual_id text;
create unique index if not exists subscriptions_manual_id_key on public.subscriptions (manual_id) where manual_id is not null;
with n as (select id, row_number() over (order by id) rn from public.subscriptions where source = 'admin' and manual_id is null)
update public.subscriptions s set manual_id = ((select coalesce(max(manual_id::int), 0) from public.subscriptions where manual_id is not null) + n.rn)::text from n where s.id = n.id;

-- Partial refunds after delivery (admin records the amount returned to the customer)
alter table public.subscriptions add column if not exists refund_amount numeric(12,2);
alter table public.subscriptions add column if not exists refund_method text;
alter table public.subscriptions add column if not exists refund_note   text;
alter table public.subscriptions add column if not exists refunded_at   timestamptz;
