# Command: /quellen-check

Prüft alle aktuellen Behauptungen auf Quellenpflicht.

## Ablauf
1. Aktuelle Outputs und docs lesen
2. Alle Markt-, Preis-, Trend- und Wettbewerbsaussagen identifizieren
3. Je Aussage prüfen: Quelle vorhanden? Aktuell? Belastbar?
4. Quellen-Cache prüfen (docs/quellen-cache.md)

## Ausgabe

# Quellen-Check

| Aussage | Quelle | Alter | Belastbar? | Empfehlung |
|---|---|---|---|---|

## Regel
Keine Quelle = "Das ist aktuell nicht belastbar." — diese Kennzeichnung muss in den betroffenen Abschnitt eingefügt werden.

Quellen älter als 90 Tage bei Markt-/Preis-/Tool-Daten: neu prüfen empfohlen.
