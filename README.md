# Thomas Idea Loop OS

## Zweck
Dieses System erzeugt, filtert und bewertet Geschäftsideen für Thomas. Es sortiert hart vor, prüft quellenbasiert, bewertet mit einem 100-Punkte-System und zeigt nur Ideen, die wirklich tragen.

## Wichtigste Regel
**Nur Ideen mit 70+ Punkten werden angezeigt.**

## Zweite wichtige Regel
Der Ideen-Loop nutzt nicht nur bekannte Thomas-Themen, sondern prüft bewusst auch **neue, angrenzende und unerwartete** Geschäftsfelder.

## Dritte wichtige Regel
**Keine Umsetzung ohne Freigabe.** Claude ändert keine Datei, bevor Thomas ausdrücklich **JA** sagt.

---

## Handy-Nutzung
1. GitHub-Repo öffnen
2. Claude Code mit Repo verbinden
3. Themen in `docs/input-themen.md` eintragen oder direkt im Chat nennen
4. `/ideen-loop` starten
5. Top-Ideen prüfen
6. `/explorieren` nutzen, wenn neue Geschäftsfelder gesucht werden
7. `/validieren` für eine Idee starten
8. erst nach echtem Test `/produkt-spezifikation` nutzen
9. erst danach `/design-briefing`
10. erst danach `/buildprompt`

## Standardablauf
```
Thema → Exploration → Ideen-Loop → Top 70+ → Validierung →
Entscheidung → Produktspezifikation → Design → Build-Prompt
```

---

## Commands

| Command | Zweck |
|---|---|
| `/ideen-loop` | Kompletter Loop: Ideen erzeugen, filtern, scoren, Top 1–3 zeigen |
| `/explorieren` | Nur neue, ungewohnte Geschäftsfelder suchen |
| `/thema-setzen` | Themenfelder und Einschränkungen festlegen |
| `/regeln-setzen` | Neue harte Regel hinzufügen oder verschärfen |
| `/top3` | Top 3 Ideen mit 70+ aus dem letzten Loop |
| `/validieren` | 7–14-Tage-Test für eine Idee (keine Umsetzung) |
| `/produkt-spezifikation` | Produktspezifikation (nur nach Freigabe) |
| `/design-briefing` | Design-/UI-Briefing (nur nach Freigabe) |
| `/buildprompt` | Finaler Bauprompt für Claude/Lovable/Cursor/Replit (nur nach Freigabe) |
| `/quellen-check` | Alle Behauptungen auf Quellenpflicht prüfen |
| `/entscheidung` | Harte Entscheidungsvorlage mit Ampel |
| `/schlussreport` | Druckbares Schlussprotokoll erstellen |
| `/pdf-report` | PDF-Version vorbereiten (nur nach Freigabe) |
| `/dedupe-check` | Neue Ideen gegen alte prüfen |
| `/token-sparmodus` | Kompakte, token-schonende Analyse |
| `/tiefencheck` | Tiefe Analyse einer einzelnen Idee (nur nach Freigabe) |
| `/umsatz-szenario` | Konservativ/realistisch/optimistisch für eine Idee |

---

## Schlussprotokoll und PDF

Nach einem Ideen-Loop kann mit folgendem Befehl ein Schlussprotokoll erstellt werden:

```
/schlussreport
```

Dieses Protokoll zeigt:
- Top-Ideen
- Score
- Bewertungskriterien
- Marktstatus
- Risiken
- Umsatzszenarien
- nicht belastbare Punkte
- MVP-Test
- Entscheidung

Optional kann danach ein PDF vorbereitet werden:

```
/pdf-report
```

**PDF-Erzeugung erfolgt nur nach Freigabe.**

---

## Token sparen

Für schnelle neue Ideen:
```
/token-sparmodus
/ideen-loop
```

Für Tiefenprüfung nur einer Idee:
```
/tiefencheck
```

---

## Wiederholungen vermeiden

Das System nutzt:
- `docs/ideen-fingerprint.md`
- `docs/ideen-log.md`
- `docs/top-ideen.md`
- `docs/verworfene-ideen.md`

Damit ähnliche Ideen nicht ständig erneut ausgearbeitet werden.

---

## Verboten
- Keine Umsetzung ohne Freigabe.
- Keine sensiblen Daten im MVP, wenn vermeidbar.
- Keine App, wenn manueller Test reicht.
- Keine künstliche Hochbewertung neuer Ideen.
- Kein PDF ohne gesonderte Freigabe.
