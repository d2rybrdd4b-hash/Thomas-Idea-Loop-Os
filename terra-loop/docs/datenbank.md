# Datenmodell Terra Loop — erklärt

Das Schema liegt fertig in `db/schema.sql` (PostgreSQL, für Supabase). Vier Tabellen:

```
species (Pflanzenarten-Katalog, für alle)
   ▲
plants (deine konkreten Pflanzen)  ──►  photos (Bilder-Metadaten)
   │
   └──►  care_logs (Pflege-Protokoll: gegossen, gedüngt, umgetopft …)
```

## Die Tabellen in einem Satz

- **species** — Wissens-Katalog: „Wie pflegt man eine Monstera?" Einmal gepflegt, von allen Nutzern lesbar.
- **plants** — die konkrete Pflanze eines Nutzers: Name, Standort, Gieß-/Dünge-Intervall, Notizen.
- **photos** — pro Pflanze beliebig viele Bilder mit Datum; so entsteht ein Wachstums-Verlauf.
- **care_logs** — Tagebuch: was wurde wann gemacht. Grundlage für Erinnerungen („zuletzt gegossen vor 9 Tagen").

## Bilder: so funktioniert es

Die Bild-**Dateien** liegen nicht in der Datenbank, sondern im Supabase **Storage** (Bucket `plant-photos`), die Datenbank speichert nur den Pfad. Ablage pro Nutzer und Pflanze: `{user_id}/{plant_id}/{photo_id}.jpg`. Die App verkleinert Fotos vor dem Upload (max. ~1600 px Kante), damit Speicher und Ladezeit klein bleiben.

## Datenschutz

- Row Level Security ist im Schema aktiviert: jeder Nutzer kann technisch nur seine eigenen Pflanzen, Fotos und Einträge lesen/ändern.
- Es werden keine sensiblen Daten gespeichert; einziges personenbezogenes Datum ist die Login-E-Mail (liegt bei Supabase Auth).
- Löscht ein Nutzer eine Pflanze, werden Fotos-Metadaten und Pflegeeinträge automatisch mitgelöscht (`on delete cascade`); die Storage-Dateien löscht die App beim selben Vorgang.

## Bewusst noch NICHT im Schema (erst bei Bedarf)

Erinnerungs-Push, Teilen/Community, Pflanzen-Erkennung per KI, Mehrsprachigkeit. Grund: erst Kernprodukt fertig und getestet — Cashflow vor Skalierung.
