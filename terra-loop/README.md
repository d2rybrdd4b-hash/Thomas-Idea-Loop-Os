# Terra Loop

Pflanzen-App mit eigener Datenbank (Pflanzen, Bilder, Pflege). Ziel: ein fertiges, verkaufbares Produkt.

> **⚠️ Stand 2026-07-02: Dieses Verzeichnis ist erledigt und nur noch Archiv.**
> Das Produkt lebt jetzt im Repo **[d2rybrdd4b-hash/terra-coach-grow](https://github.com/d2rybrdd4b-hash/terra-coach-grow)** (Lovable-Export, beste App-Version). Das Starter-Paket wurde als `STARTER-PAKET.md` dorthin übertragen. Alle weitere Arbeit an Terra Loop findet in Claude-Code-Sessions auf `terra-coach-grow` statt — nicht hier.

Ursprünglicher Zweck dieses Ordners: Starter-Paket für das neue Terra-Loop-Repository, damit Claude Code (Fable 5) die App mit Backend und Datenbank fertig entwickeln kann.

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
