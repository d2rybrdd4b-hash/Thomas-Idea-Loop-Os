# Anleitung für Thomas: Neues Repo „terra-loop" anlegen

Dauer insgesamt: ca. 15–20 Minuten. Alles per Handy oder Browser machbar, keine Kommandozeile nötig.

## Schritt 1 — Neues Repository anlegen (2 Min)

1. Auf **github.com** einloggen.
2. Oben rechts auf **+** tippen → **New repository**.
3. Repository name: **terra-loop**
4. **Private** auswählen (empfohlen — der Code ist dein Produkt).
5. Haken bei **Add a README file** setzen.
6. Grünen Button **Create repository** drücken. Fertig.

## Schritt 2 — Starter-Dateien übernehmen (5–10 Min)

Die Dateien liegen fertig in diesem Repo im Ordner `terra-loop/` (Branch `claude/terra-loop-repo-setup-g2rnj1`). Einfachster Weg:

1. Neue **Claude-Code-Session auf dem neuen Repo `terra-loop`** starten.
2. Diesen Auftrag geben (kopieren):
   > „Übernimm die Starter-Dateien für Terra Loop. Ich füge dir gleich den Inhalt der Dateien aus meinem Repo Thomas-Idea-Loop-Os, Ordner terra-loop/, per Copy-Paste ein. Lege sie mit gleichem Pfad an."
3. Dann jede Datei im alten Repo öffnen (Ordner `terra-loop/`), Inhalt kopieren und in die Session einfügen. Es sind nur 7 kleine Dateien.

*Alternative ohne Claude:* im neuen Repo auf **Add file → Create new file**, als Dateiname z. B. `CLAUDE.md` eintippen, Inhalt einfügen, **Commit changes** — für jede Datei wiederholen.

**Wichtig:** Die Datei `terra-loop/CLAUDE.md` muss im neuen Repo im **Hauptverzeichnis** als `CLAUDE.md` liegen (nicht in einem Unterordner), damit Claude Code sie automatisch liest.

## Schritt 3 — App-Code aus dem Artifact einfügen (5 Min, wichtigster Schritt!)

Ohne diesen Schritt kann Claude die App nicht analysieren und nicht weiterbauen:

1. Das Artifact im Browser öffnen: `claude.ai/public/artifacts/7889d366-...` (dein Link).
2. Oben/unten im Artifact-Fenster auf das **Code-Symbol** bzw. **„Copy code"** tippen und den kompletten Code kopieren.
   - Falls kein Copy-Button sichtbar: in claude.ai die Original-Unterhaltung öffnen, Artifact anklicken, dort Code anzeigen lassen und kopieren.
3. Im neuen Repo: **Add file → Create new file** → Dateiname: `app/index.html` → Code einfügen → **Commit changes**.

## Schritt 4 — Claude Code loslegen lassen (2 Min)

Neue Session auf `terra-loop` starten (Modell Fable 5) und als ersten Auftrag geben:

> „Lies CLAUDE.md und docs/produkt-analyse.md. Analysiere app/index.html vollständig (Features, Datenfelder, Bugs, was fehlt), trage das Ergebnis in docs/produkt-analyse.md ein und gleiche das Datenmodell mit db/schema.sql ab. Danach schlag mir die nächsten Schritte vor."

## Schritt 5 — Später: Supabase (erst wenn Claude es vorschlägt)

Das Datenbank-Konto bei supabase.com wird erst in Ausbaustufe 2 gebraucht (siehe `docs/backend.md`). Claude führt dich dann Schritt für Schritt durch — nicht vorab anlegen nötig.

---

**Hinweis:** Dieses alte Repo (Thomas-Idea-Loop-Os) bleibt unverändert dein Ideen-System. Terra Loop lebt ab jetzt komplett im neuen Repo.
