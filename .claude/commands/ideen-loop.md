# Command: /ideen-loop

Startet den vollständigen Ideen-Loop von Themeninput bis zu den Top 1–3 Ideen.

## Ablauf
1. Themeninput aus docs/input-themen.md lesen (oder aus aktuellem Chat)
2. Explorationsfelder öffnen (02-explorations-agent)
3. 20–50 Ideen erzeugen — Pflichtmischung: 30 % bekannt / 40 % angrenzend / 30 % neu (03-ideen-scout)
4. Dedupe prüfen: neue Ideen gegen Fingerprints abgleichen (17-dedupe-agent)
5. Vorfilter anwenden — K.O.-Regeln (04-vorfilter-agent)
6. Verbleibende Ideen scoren: Thomas-Fit / Problem / Geld / Technik / Risiko (05–12)
7. Deckel-Regeln anwenden
8. Nur Ideen mit 70+ anzeigen
9. Für 70+ Ideen: Markt/Quellen kurz prüfen (07-markt-quellen-agent)
10. Top 1–3 auswählen (13-final-entscheider)
11. MVP-Test für Top-Ideen vorschlagen (11-validierungs-agent)
12. Stoppen — Thomas fragen

## Pflichtausgabe-Struktur

# Ideen-Loop Ergebnis

## Themeninput
## Explorationsrichtung
## Harte Regeln

## Vorfilter-Statistik
- Erzeugte Ideen: X
- Davon Dubletten geblockt: X
- Davon K.O. verworfen: X (mit Kurzstatistik je Grund)
- Mit 70+ Punkten: X

## Top-Ideen

Für jede 70+ Idee:

### [Ideenname] — [Kategorie A/B/C] — [Score]/100 — [Ampel]
- Zielgruppe:
- Problem:
- Zahlungslogik:
- Thomas-Fit: X/15
- Technischer Aufwand: X/10
- Externe Abhängigkeit: X/10
- Datenschutz-/Risikorating:
- Markt-/Quellenstatus:
- Größtes Risiko:
- Kleinster 7–14-Tage-Test:
- Warum angezeigt:
- Kategorie: naheliegend / angrenzend / neu für Thomas

## Nicht angezeigt
Nur Statistik.

## Horizont-Check
- Wurde mindestens eine Kategorie-C-Idee geprüft? Ja/Nein
- Wurde mindestens eine Kategorie-C-Idee mit 70+ gefunden? Ja/Nein
- Falls nein: "Es wurde keine neue Explorationsidee gefunden, die den 70-Punkte-Filter belastbar erreicht. Das ist aktuell nicht belastbar."

## Empfehlung
Top 1–3 mit Begründung.

---
Am Ende fragen:
"Welche Idee soll ich als Nächstes validieren? Ich ändere nichts ohne deine Freigabe."
