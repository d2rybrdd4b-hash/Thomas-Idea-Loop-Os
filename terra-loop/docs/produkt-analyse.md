# Produkt-Analyse Terra Loop — Ist-Stand und offene Punkte

Stand: 2026-07-02. Diese Datei ist das Arbeitsjournal Richtung verkaufbares Produkt. Jede Session aktualisiert sie.

## 1. Was gesichert ist (Fakten)

- Es existiert ein App-Prototyp als Claude-Artifact (Link im README). **Der Code liegt noch nicht im Repo** und war aus der Cloud-Umgebung nicht abrufbar.
- Ziel laut Thomas: Pflanzen-App mit eigener Datenbank für Pflanzen und Bilder, Backend-Entwicklung über Claude Code (Fable 5), Endziel verkaufbares Produkt.
- Datenmodell (`db/schema.sql`) und Backend-Plan (`docs/backend.md`) liegen fertig vor.

## 2. Was angenommen wird (Annahmen — zu prüfen, sobald der App-Code im Repo ist)

| # | Annahme | Prüfen durch |
|---|---|---|
| A1 | Die App ist eine Standalone-HTML/JS-App (wie Clario/Hotel-Seat) mit lokaler Speicherung | Code-Review von `app/index.html` |
| A2 | Es gibt bereits UI für Pflanzenliste, Detailansicht, evtl. Foto-Aufnahme | Code-Review |
| A3 | Daten liegen bisher nur im Browser (localStorage/IndexedDB), kein Sync, kein Login | Code-Review |
| A4 | Zielgruppe: Pflanzenbesitzer, die Pflege und Bestand dokumentieren wollen | Thomas bestätigen lassen |

## 3. Offene Punkte bis „verkaufbar" (Reihenfolge = Arbeitsreihenfolge)

1. **App-Code ins Repo** (`app/index.html`) — blockiert alles Weitere. *(Thomas, manuell)*
2. **Code-Analyse:** Feature-Liste, Datenfelder, Bugs, was fehlt — Ergebnis hier in Abschnitt 2 als Fakten nachtragen.
3. **Datenmodell abgleichen:** Felder der App gegen `db/schema.sql`; Schema anpassen, nicht die App verbiegen.
4. **Supabase-Projekt anlegen** *(Thomas mit Anleitung, ~15 Min)* und Schema einspielen.
5. **Backend anbinden:** Login (E-Mail), Pflanzen-CRUD, Bild-Upload in Storage, Offline-Cache.
6. **Verkaufsreife-Checkliste** aus `CLAUDE.md` Punkt für Punkt abarbeiten (Recht, Export, Bezahlmodell).
7. **7–14-Tage-Test** mit 3–5 echten Nutzern; erst danach Preisentscheidung.

## 4. Nicht belastbar (Stand heute)

- Zielgruppe, Zahlungsbereitschaft, Preis, Konkurrenzlage: **Das ist aktuell nicht belastbar.** Es gibt dazu noch keine geprüften Quellen und keinen Nutzertest. Vor Verkaufsstart Markt-/Quellencheck durchführen (bestehende Pflanzen-Apps: z. B. Planta, PictureThis u. a. — Namen unverifiziert, als Startpunkt für die Recherche).
- Umsatz: keine Schätzung, bevor Preis und Testergebnisse existieren.

## 5. Entscheidungslog

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-07-02 | Eigenes Repo `terra-loop`, Backend mit Supabase, Schema v1 | Auftrag Thomas; einfachste betreibbare Lösung |
