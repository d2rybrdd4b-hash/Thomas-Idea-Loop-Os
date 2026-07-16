-- ═══════════════════════════════════════════════════════════════
-- BOXENSTOPP — Datenbank-Setup (neues, eigenes Supabase-Projekt!)
-- Einmalig im SQL-Editor ausführen. "salons" = Werkstätten
-- (Tabellennamen bewusst identisch zu Slotly → maximale Code-Wiederverwendung)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  owner_name text,
  email text,
  plan text default 'team',
  whatsapp_number text,
  brand_color text,
  referred_by text,
  services_json text, staff_json text, avail_json text,
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null, color text, active boolean default true,
  sick boolean default false, phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null, duration int default 30, price numeric default 0, buffer int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  day_of_week int, start_time time, end_time time
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid references public.staff(id),
  service_id uuid references public.services(id),
  customer_name text not null, customer_phone text,
  license_plate text,
  date date not null, start_time text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_name text not null, customer_phone text not null,
  service_id text, service_name text, staff_name text,
  date_from date not null, date_to date not null,
  time_from time, time_to time,
  created_at timestamptz not null default now()
);

-- ── NEU für Boxenstopp: das Reifenlager ──
create table if not exists public.tire_sets (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  license_plate text not null,
  season text not null default 'Sommer',
  storage_spot text,
  stored_since date,
  note text,
  reminded boolean default false,
  created_at timestamptz not null default now()
);

-- ═══ Zugriffsregeln (RLS) — Lehren aus Slotly direkt eingebaut ═══
alter table public.salons enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.waitlist enable row level security;
alter table public.tire_sets enable row level security;

-- Werkstatt-Seite (öffentlich lesbar für Buchungsseite)
create policy "salons_public_read" on public.salons for select using (true);
create policy "salons_owner_insert" on public.salons for insert to authenticated with check (owner_id = auth.uid());
create policy "salons_owner_update" on public.salons for update to authenticated using (owner_id = auth.uid());

-- Staff/Services/Verfügbarkeit: öffentlich lesbar (Buchungsseite), schreiben nur Inhaber
create policy "staff_public_read" on public.staff for select using (true);
create policy "staff_owner_write" on public.staff for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()));
create policy "services_public_read" on public.services for select using (true);
create policy "services_owner_write" on public.services for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()));
create policy "availability_public_read" on public.availability for select using (true);
create policy "availability_owner_write" on public.availability for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()));

-- Buchungen: anonym anlegen + Zeiten lesen (für Frei-Prüfung), verwalten nur Inhaber
create policy "bookings_public_insert" on public.bookings for insert with check (true);
create policy "bookings_public_read" on public.bookings for select using (true);
create policy "bookings_owner_update" on public.bookings for update to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()));

-- Warteliste: anonym eintragen, lesen/löschen nur Inhaber
create policy "waitlist_public_insert" on public.waitlist for insert with check (true);
create policy "waitlist_owner_select" on public.waitlist for select to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()));
create policy "waitlist_owner_delete" on public.waitlist for delete to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()));

-- Reifenlager: NUR Inhaber (Kennzeichen + Namen gehören nicht öffentlich!)
create policy "tires_owner_all" on public.tire_sets for all to authenticated
  using (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.salons s where s.id = salon_id and s.owner_id = auth.uid()));
