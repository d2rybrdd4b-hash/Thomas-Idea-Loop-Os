# Backend Terra Loop — Empfehlung und Ausbaustufen

## Empfehlung: Supabase (Meinung, begründet)

Für eine verkaufbare Pflanzen-App mit Login, Datenbank und Bildern ist **Supabase** die einfachste betreibbare Lösung:

| Anforderung | Supabase liefert |
|---|---|
| Datenbank | PostgreSQL, Schema aus `db/schema.sql` per Copy-Paste einspielbar |
| Bilder | Storage-Buckets mit Zugriffsregeln |
| Login | E-Mail-Login fertig eingebaut (Auth) |
| Zugriff aus der App | fertige JS-Bibliothek, kein eigener Server nötig |
| Datentrennung | Row Level Security direkt in der Datenbank |
| Kosten | Free-Tier zum Start; Preise vor Verkaufsstart prüfen — **Kostenangaben hier sind nicht belastbar, aktuelle Preisseite gilt** |

Warum kein eigener Server (Node/Express + eigene DB): mehr Wartung, mehr Sicherheitsverantwortung, kein Vorteil für dieses Produkt. Warum kein Firebase: NoSQL passt schlechter zum relationalen Modell (Pflanze → Fotos → Pflegeeinträge), und SQL bleibt mit Claude Code leichter wart- und exportierbar.

## Architektur

```
PWA (app/index.html, offline-fähig)
   │  supabase-js (HTTPS)
   ▼
Supabase: Auth (E-Mail) · PostgreSQL (RLS) · Storage (plant-photos)
```

Kein eigener Server. Die App spricht direkt und verschlüsselt mit Supabase; die Sicherheit liegt in den RLS-Regeln der Datenbank, nicht im Client.

## Ausbaustufen

1. **Stufe 1 — läuft lokal:** App-Code im Repo, Daten in IndexedDB (offline). Kein Account nötig. → sofort testbar.
2. **Stufe 2 — Sync:** Supabase-Anbindung: Login, Pflanzen/Fotos/Pflege in die Cloud, IndexedDB bleibt als Offline-Cache.
3. **Stufe 3 — verkaufbar:** Datenexport, Impressum/Datenschutz, Bezahlmodell (Empfehlung: einmalig oder Jahresabo über Stripe Payment Links — einfachste Variante, Entscheidung bei Thomas), Nutzertest 7–14 Tage.

## Was Thomas einmalig tun muss (je ~15 Minuten, Anleitung folgt bei Bedarf Schritt für Schritt)

1. Konto auf supabase.com anlegen, neues Projekt „terra-loop" erstellen.
2. SQL Editor öffnen → Inhalt von `db/schema.sql` einfügen → Run.
3. Storage → Bucket `plant-photos` anlegen (nicht öffentlich).
4. Projekt-URL + „anon key" aus den Projekteinstellungen in die App-Konfiguration eintragen (Claude Code sagt genau wohin).
