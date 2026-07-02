-- Terra Loop — Datenbankschema v1 (PostgreSQL / Supabase)
-- Einspielen: Supabase → SQL Editor → Inhalt einfügen → Run.
-- Annahme A1–A3 (siehe docs/produkt-analyse.md): Schema wird nach der
-- Code-Analyse der App bei Bedarf angepasst.

-- ============================================================
-- Stammdaten: Pflanzenarten (gemeinsamer Katalog, von allen lesbar)
-- ============================================================
create table if not exists species (
  id            uuid primary key default gen_random_uuid(),
  name_de       text not null,             -- z. B. "Monstera"
  name_bot      text,                      -- botanischer Name
  licht         text,                      -- z. B. "hell, kein direktes Mittagslicht"
  wasser        text,                      -- Gießhinweis
  erde          text,                      -- Substrat
  temperatur    text,
  giftig        boolean,                   -- für Haustiere/Kinder relevant
  hinweise      text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Nutzer-Pflanzen: konkrete Pflanze eines Nutzers
-- ============================================================
create table if not exists plants (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  species_id    uuid references species(id) on delete set null,
  name          text not null,             -- Spitzname, z. B. "Monstera Wohnzimmer"
  standort      text,                      -- z. B. "Wohnzimmer Süd-Fenster"
  erworben_am   date,
  notizen       text,
  giess_intervall_tage  int,               -- für Erinnerungen
  duenge_intervall_tage int,
  archiviert    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- Bilder: Metadaten; Datei selbst liegt im Supabase Storage
-- Bucket "plant-photos", Pfad: {user_id}/{plant_id}/{photo_id}.jpg
-- ============================================================
create table if not exists photos (
  id            uuid primary key default gen_random_uuid(),
  plant_id      uuid not null references plants(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  storage_path  text not null,             -- Pfad im Bucket
  aufgenommen_am date default current_date,
  beschreibung  text,
  ist_titelbild boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Pflege-Protokoll: was wurde wann gemacht
-- ============================================================
create table if not exists care_logs (
  id            uuid primary key default gen_random_uuid(),
  plant_id      uuid not null references plants(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  aktion        text not null check (aktion in
                  ('giessen','duengen','umtopfen','schneiden','schaedlinge','sonstiges')),
  datum         date not null default current_date,
  notiz         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_plants_user     on plants(user_id);
create index if not exists idx_photos_plant    on photos(plant_id);
create index if not exists idx_care_logs_plant on care_logs(plant_id, datum desc);

-- ============================================================
-- Row Level Security: jeder Nutzer sieht nur seine eigenen Daten
-- ============================================================
alter table species   enable row level security;
alter table plants    enable row level security;
alter table photos    enable row level security;
alter table care_logs enable row level security;

create policy "species lesbar für alle Angemeldeten"
  on species for select to authenticated using (true);

create policy "eigene Pflanzen" on plants
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "eigene Fotos" on photos
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "eigene Pflegeeinträge" on care_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
