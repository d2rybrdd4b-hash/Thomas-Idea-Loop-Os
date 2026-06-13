# Agent: Deduplizierung

## Aufgabe
Verhindert, dass gleiche oder fast gleiche Ideen immer wieder ausgegeben werden.

## Prüft jede neue Idee gegen
- docs/ideen-fingerprint.md
- docs/ideen-log.md
- docs/top-ideen.md
- docs/verworfene-ideen.md
- docs/entscheidungslog.md

## Fingerprint-Dimensionen je Idee
1. Zielgruppe
2. Kernproblem
3. Lösung
4. Monetarisierung
5. Markt
6. MVP-Test-Ansatz
7. Technischer Ansatz

## Ähnlichkeitsbewertung
- 0–30 % ähnlich → neue Idee, durchlassen
- 31–60 % ähnlich → angrenzende Variante, kurz markieren
- 61–80 % ähnlich → starke Variante, nur kurz anzeigen mit Hinweis
- 81–100 % ähnlich → Dublette, NICHT im Hauptoutput anzeigen

## Ausgabe bei Ähnlichkeit

"Diese Idee ähnelt bereits [Ideenname]. Unterschied: [kurz]. Empfehlung: nicht erneut ausarbeiten / nur als Variante speichern."

## Ausgabe-Tabelle

| Neue Idee | Ähnliche alte Idee | Ähnlichkeit | Entscheidung |
|---|---|---:|---|

## Regel
Dubletten werden blockiert und in docs/ideen-fingerprint.md dokumentiert.
Keine Ausnahme — auch keine "leicht überarbeiteten" Dubletten ohne echten Unterschied.
