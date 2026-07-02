# Terra Loop

Pflanzen-App mit eigener Datenbank (Pflanzen, Bilder, Pflege). Ziel: ein fertiges, verkaufbares Produkt.

**Status: Nicht fertig.** Dieses Verzeichnis ist das Starter-Paket für das neue GitHub-Repository `terra-loop`. Es enthält alles, was Claude Code (Fable 5) braucht, um die App mit Backend und Datenbank fertig zu entwickeln — **außer dem bisherigen App-Code** (siehe unten).

## Inhalt

| Datei | Zweck |
|---|---|
| `CLAUDE.md` | Regelwerk für das neue Repo (Arbeitsweise, Freigaben, Qualität) |
| `ANLEITUNG-GITHUB.md` | Schritt-für-Schritt für Thomas: neues Repo anlegen und befüllen |
| `docs/produkt-analyse.md` | Ist-Stand, offene Punkte, Weg zum verkaufbaren Produkt |
| `docs/datenbank.md` | Datenmodell: Pflanzen, Bilder, Pflege — erklärt |
| `db/schema.sql` | Fertiges Datenbankschema (PostgreSQL/Supabase-kompatibel) |
| `docs/backend.md` | Backend-Empfehlung und Ausbaustufen |
| `app/` | **Hier den bisherigen App-Code aus dem Claude-Artifact einfügen** |

## Wichtigste offene Lücke

Der bisherige App-Stand existiert nur als Claude-Artifact
(`https://claude.ai/public/artifacts/7889d366-56fb-42d3-83ad-ab8dd6d5774b`).
Dieses Artifact ist für Claude Code aus der Cloud-Umgebung **nicht abrufbar** (Bot-Schutz).
Der Code muss einmal manuell als `app/index.html` eingefügt werden — Anleitung in `ANLEITUNG-GITHUB.md`, Schritt 3. Erst danach ist eine belastbare Analyse der App möglich.

## Grundsätze (aus dem Idea-Loop-OS übernommen)

- Fakten, Annahmen, Schätzungen und Meinungen werden getrennt ausgewiesen.
- Fehlt ein Beleg: „Das ist aktuell nicht belastbar."
- Cashflow vor Skalierung; so einfach wie möglich bauen.
- Keine sensiblen personenbezogenen Daten als Kern der App.
