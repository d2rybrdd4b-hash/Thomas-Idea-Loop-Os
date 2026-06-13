# Command: /dedupe-check

Prüft neue oder bestehende Ideen gegen alle gespeicherten Ideen auf Ähnlichkeit.

## Ablauf
1. docs/ideen-fingerprint.md lesen
2. docs/ideen-log.md lesen
3. docs/top-ideen.md lesen
4. docs/verworfene-ideen.md lesen
5. Neue Idee (aus Chat oder Datei) als Fingerprint aufbereiten
6. Ähnlichkeit berechnen (7 Dimensionen)
7. Ergebnis ausgeben

## Ausgabe

# Dedupe-Check

| Neue Idee | Ähnliche alte Idee | Ähnlichkeit | Entscheidung |
|---|---|---:|---|

Bewertung:
- 0–30 %: neue Idee → durchlassen
- 31–60 %: angrenzende Variante → markieren
- 61–80 %: starke Variante → nur kurz zeigen
- 81–100 %: Dublette → blockieren

## Pflichtfrage bei Update des Fingerprints
"Ich würde docs/ideen-fingerprint.md aktualisieren. Soll ich das ausführen? Ja/Nein."
