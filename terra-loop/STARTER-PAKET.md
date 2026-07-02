# STARTER-PAKET Terra Loop — alle Dateien in einer

**Anweisung an Claude Code:** Lege aus diesem Paket die 4 unten enthaltenen Dateien mit exakt dem angegebenen Pfad an (Inhalt = alles zwischen den Trennzeilen). Lösche danach diese Datei (STARTER-PAKET.md). Committe auf main.

===== DATEI: CLAUDE.md =====
# CLAUDE.md — Terra Loop (terra-coach-grow)

Regelwerk für dieses Repository. Gilt für jede Claude-Code-Session (Modell: Fable 5 oder neuer).

## 1. Freigabe-Regel

Vor jeder Änderung an Dateien, Datenbank oder Deployment nennt Claude kurz:
**Was, warum, Risiko, rückgängig machbar?** — und wartet auf ein **JA**.
Ausnahme: Thomas hat die Aufgabe in derselben Session bereits ausdrücklich beauftragt; dann wird gearbeitet und am Ende sauber berichtet.

## 2. Produktziel

Terra Loop ist eine Pflanzen-App mit eigener Datenbank (Pflanzen, Bilder, Pflegedaten), die als Produkt **verkaufbar** sein soll. Jede Entscheidung wird daran gemessen:
1. Bringt es das Produkt näher an „verkaufbar"? (funktioniert zuverlässig, verständlich, DSGVO-sauber, bezahlbar betreibbar)
2. Ist es die **einfachste** Lösung, die dafür reicht?

## 3. Technik-Leitplanken

- **Herkunft:** Die App wurde mit Lovable gebaut (vermutlich React + Vite + TypeScript, Tailwind, shadcn/ui — beim ersten Lesen des Codes verifizieren und diesen Absatz präzisieren).
- **Lovable-Sync beachten:** Lovable und GitHub sind zwei-Wege-synchronisiert auf `main`. Vor jeder Session aktuellen Stand ziehen; Änderungen zügig auf `main` bringen, keine lang lebenden Branches. Von Lovable generierte Struktur nicht grundlos umbauen, sonst bricht der Sync-Komfort.
- **Datenbank/Backend:** Supabase (PostgreSQL + Storage + Auth) gemäß `db/schema.sql` und `docs/backend.md`. **Eigenes Supabase-Projekt nur für Terra Loop** — niemals die Datenbank einer anderen App mitbenutzen. Prüfen, ob der Code bereits eine Supabase-Anbindung enthält, bevor etwas Neues aufgesetzt wird.
- **Bilder:** vor dem Upload verkleinern/komprimieren (max. Kantenlänge ~1600 px), Originale nicht ungefragt speichern.
- **Offline zuerst:** die App muss ohne Netz lesbar bleiben (lokaler Cache), Sync wenn online.
- **Keine sensiblen Daten:** keine Gesundheits-, Kinder-, Finanz- oder Standortdaten als Kern. Nur E-Mail für Login.
- Versionsnummer sichtbar in der App, Änderungen in `CHANGELOG.md`.

## 4. Arbeitsweise

- Fakten / Annahmen / Schätzungen / Meinungen trennen. Ohne Beleg: „Das ist aktuell nicht belastbar."
- Erst kleinster funktionierender Stand, dann erweitern. Kein Feature ohne Nutzen für zahlende Nutzer.
- Jede Session beginnt mit Blick in `docs/produkt-analyse.md` (offene Punkte) und endet mit deren Aktualisierung.
- Deutsch als Arbeits- und UI-Sprache; Englisch nur, wenn beauftragt.

## 5. Verkaufsreife-Checkliste (Definition von „fertig")

- [ ] Kernfunktionen fehlerfrei auf Handy und Desktop
- [ ] Login + Datentrennung pro Nutzer funktioniert
- [ ] Bilder-Upload, -Anzeige, -Löschen funktioniert
- [ ] Datenexport für Nutzer (DSGVO) vorhanden
- [ ] Impressum + Datenschutzerklärung eingebunden
- [ ] Preis/Bezahlmodell entschieden und technisch umgesetzt
- [ ] 7–14-Tage-Test mit echten Nutzern bestanden
===== ENDE DATEI =====

===== DATEI: db/schema.sql =====
-- Terra Loop — Datenbankschema v1 (PostgreSQL / Supabase)
-- Einspielen: Supabase → SQL Editor → Inhalt einfügen → Run.
-- WICHTIG: Erst mit dem echten Datenmodell der App abgleichen
-- (docs/produkt-analyse.md) — enthält die App schon eine eigene
-- Supabase-Struktur, wird DIESES Schema angepasst, nicht die App.

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
===== ENDE DATEI =====

===== DATEI: docs/produkt-analyse.md =====
# Produkt-Analyse Terra Loop — Ist-Stand und offene Punkte

Stand: 2026-07-02. Diese Datei ist das Arbeitsjournal Richtung verkaufbares Produkt. Jede Session aktualisiert sie.

## 1. Was gesichert ist (Fakten)

- Die App wurde mit Lovable entwickelt und liegt vollständig in diesem Repo (`terra-coach-grow`), zwei-Wege-Sync mit Lovable auf `main` ist aktiv.
- Thomas' Supabase-Konto ist bereits mit Lovable verbunden (Konnektor einer anderen App). Ob DIESE App schon ein eigenes Supabase-Projekt nutzt: noch ungeprüft.
- Ziel laut Thomas: Pflanzen-App mit eigener Datenbank für Pflanzen und Bilder, Weiterentwicklung über Claude Code (Fable 5), Endziel verkaufbares Produkt.
- Datenmodell-Vorschlag (`db/schema.sql`) und Backend-Plan (`docs/backend.md`) liegen vor — noch nicht mit dem echten App-Code abgeglichen.

## 2. Was angenommen wird (Annahmen — in der ersten Analyse-Session prüfen)

| # | Annahme | Prüfen durch |
|---|---|---|
| A1 | Stack: React + Vite + TypeScript, Tailwind, shadcn/ui (Lovable-Standard) | Blick in package.json |
| A2 | Es gibt UI für Pflanzenliste, Detailansicht, evtl. Fotos und Pflege-Coaching | Code-Review src/ |
| A3 | Supabase-Anbindung evtl. schon im Code (Lovable bindet das oft ein) | Suche nach supabase im Code |
| A4 | Zielgruppe: Pflanzenbesitzer, die Pflege und Bestand dokumentieren wollen | Thomas bestätigen lassen |

## 3. Offene Punkte bis „verkaufbar" (Reihenfolge = Arbeitsreihenfolge)

1. **Code-Analyse:** Features, Screens, Datenfelder, vorhandene Supabase-Anbindung, Bugs, was fehlt — Ergebnis hier in Abschnitt 1 als Fakten nachtragen, Annahmen A1–A3 auflösen.
2. **Datenmodell abgleichen:** echtes Datenmodell der App gegen `db/schema.sql`; das Schema anpassen, nicht die App verbiegen.
3. **Supabase klären:** eigenes Projekt nur für Terra Loop (nie die DB einer anderen App mitbenutzen); Schema einspielen; Storage-Bucket `plant-photos` anlegen. *(Thomas mit Schritt-für-Schritt-Anleitung)*
4. **Backend fertig anbinden:** Login (E-Mail), Pflanzen-CRUD, Bild-Upload, Offline-Cache.
5. **Verkaufsreife-Checkliste** aus `CLAUDE.md` Punkt für Punkt abarbeiten (Recht, Export, Bezahlmodell).
6. **7–14-Tage-Test** mit 3–5 echten Nutzern; erst danach Preisentscheidung.

## 4. Nicht belastbar (Stand heute)

- Zielgruppe, Zahlungsbereitschaft, Preis, Konkurrenzlage: **Das ist aktuell nicht belastbar.** Keine geprüften Quellen, kein Nutzertest. Vor Verkaufsstart Markt-/Quellencheck (bestehende Pflanzen-Apps als Startpunkt der Recherche: z. B. Planta, PictureThis — unverifiziert).
- Umsatz: keine Schätzung, bevor Preis und Testergebnisse existieren.

## 5. Entscheidungslog

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-07-02 | Produkt-Repo = terra-coach-grow (Lovable-Export); Backend-Ziel Supabase; Schema-v1-Vorschlag liegt vor | Auftrag Thomas; Lovable-Version ist der beste App-Stand |
===== ENDE DATEI =====

===== DATEI: docs/backend.md =====
# Backend Terra Loop — Empfehlung und Ausbaustufen

## Empfehlung: Supabase (Meinung, begründet)

Für eine verkaufbare Pflanzen-App mit Login, Datenbank und Bildern ist **Supabase** die einfachste betreibbare Lösung — und Lovable arbeitet ohnehin nativ damit:

| Anforderung | Supabase liefert |
|---|---|
| Datenbank | PostgreSQL, Schema aus `db/schema.sql` per Copy-Paste einspielbar |
| Bilder | Storage-Buckets mit Zugriffsregeln |
| Login | E-Mail-Login fertig eingebaut (Auth) |
| Zugriff aus der App | fertige JS-Bibliothek (supabase-js), kein eigener Server nötig |
| Datentrennung | Row Level Security direkt in der Datenbank |
| Kosten | Free-Tier zum Start; Preise vor Verkaufsstart prüfen — **Kostenangaben hier sind nicht belastbar, aktuelle Preisseite gilt** |

**Wichtigste Regel:** Terra Loop bekommt ein **eigenes** Supabase-Projekt. Die Datenbank einer anderen App wird niemals mitbenutzt (Datenschutz, Backups, spätere Verkaufbarkeit).

## Architektur

```
React-App (Lovable, dieses Repo)
   │  supabase-js (HTTPS)
   ▼
Supabase: Auth (E-Mail) · PostgreSQL (RLS) · Storage (plant-photos)
```

Kein eigener Server. Die App spricht direkt und verschlüsselt mit Supabase; die Sicherheit liegt in den RLS-Regeln der Datenbank, nicht im Client.

## Datenmodell (Kurzfassung, Details in docs/datenbank.md … bzw. db/schema.sql)

- **species** — Pflanzenarten-Katalog (Pflegewissen), für alle Nutzer lesbar
- **plants** — konkrete Pflanzen eines Nutzers (Name, Standort, Intervalle, Notizen)
- **photos** — Bild-Metadaten; Dateien liegen im Storage-Bucket `plant-photos` unter `{user_id}/{plant_id}/{photo_id}.jpg`, vor Upload auf ~1600 px verkleinern
- **care_logs** — Pflege-Tagebuch (gegossen, gedüngt, umgetopft …), Basis für Erinnerungen

Löscht ein Nutzer eine Pflanze, werden Fotos-Metadaten und Pflegeeinträge automatisch mitgelöscht (on delete cascade); die Storage-Dateien löscht die App im selben Vorgang. Row Level Security stellt sicher, dass jeder Nutzer nur seine eigenen Daten sieht.

## Ausbaustufen

1. **Stufe 1 — läuft:** App aus Lovable funktioniert lokal/als Web-App; Analyse abgeschlossen (docs/produkt-analyse.md).
2. **Stufe 2 — Sync:** eigenes Supabase-Projekt, Schema eingespielt, Login + Pflanzen/Fotos/Pflege in der Cloud, Offline-Cache.
3. **Stufe 3 — verkaufbar:** Datenexport, Impressum/Datenschutz, Bezahlmodell (Empfehlung: einmalig oder Jahresabo über Stripe Payment Links — einfachste Variante, Entscheidung bei Thomas), Nutzertest 7–14 Tage.

## Was Thomas einmalig tun muss (je ~15 Minuten, Claude führt Schritt für Schritt)

1. Auf supabase.com ein **neues Projekt** „terra-loop" erstellen (Konto existiert schon).
2. SQL Editor → Inhalt von `db/schema.sql` (nach Abgleich!) einfügen → Run.
3. Storage → Bucket `plant-photos` anlegen (nicht öffentlich).
4. Projekt-URL + „anon key" in die App-Konfiguration eintragen (Claude sagt genau wohin) — bzw. in Lovable das Supabase-Projekt diesem Lovable-Projekt zuordnen.
===== ENDE DATEI =====
