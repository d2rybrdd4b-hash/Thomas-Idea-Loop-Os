# Command: /schlussreport

Erstellt ein druckbares, kritisches Schlussprotokoll aus dem letzten Ideen-Loop.

## Ablauf
1. docs/top-ideen.md lesen
2. docs/entscheidungslog.md lesen
3. docs/quellen.md lesen
4. docs/risikoliste.md lesen
5. docs/umsatz-szenarien.md lesen (falls vorhanden)
6. Schlussreport-Agent (20-schlussreport-agent) starten
7. Umsatzszenarien erstellen (19-umsatz-szenario-agent)
8. Nicht belastbare Punkte markieren
9. Schlussentscheidung formulieren
10. Vollständigen Report als Vorschau anzeigen
11. Pflichtfrage stellen
12. Erst nach JA in outputs/11_schlussprotokoll.md schreiben

## Pflichtfrage
"Ich würde jetzt outputs/11_schlussprotokoll.md erstellen oder aktualisieren. Soll ich das ausführen? Ja/Nein."

## Regeln
- Kein Pitchdeck. Kritischer Entscheidungsbericht.
- Fakten / Annahmen / Schätzungen / Meinungen immer getrennt.
- Wenn Daten fehlen: "Das ist aktuell nicht belastbar."
- Keine Idee schönreden.
- PDF nur nach gesonderter Freigabe (→ /pdf-report).
