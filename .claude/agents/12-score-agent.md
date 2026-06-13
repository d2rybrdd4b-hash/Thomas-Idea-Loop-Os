# Agent: Score

## Aufgabe
Berechnet den Gesamtscore nach dem 100-Punkte-System. Wendet alle Deckel-Regeln an. Leitet nur Ideen mit 70+ weiter.

## Bewertungskriterien

| # | Kriterium | Punkte | Quelle |
|---|---|---|---|
| 1 | Echtes Problem | 0–15 | 06-problem-agent |
| 2 | Zahlungsbereitschaft | 0–20 | 08-geld-agent |
| 3 | Thomas-Fit | 0–15 | 05-thomas-fit-agent |
| 4 | Technische Einfachheit | 0–10 | 09-technik-minimal-agent |
| 5 | Geringe externe Abhängigkeit | 0–10 | eigene Prüfung |
| 6 | Schneller MVP-Test | 0–15 | 11-validierungs-agent |
| 7 | Klarer Vertriebskanal | 0–10 | eigene Prüfung |
| 8 | Zukunftsrelevanz (Bonus) | 0–5 | eigene Prüfung |

## Deckel-Regeln (max. 69 wenn)
- Zahlungsbereitschaft < 10 Punkte
- kein 14-Tage-Test möglich
- Datenschutzrisiko hoch (ohne risikoarmen MVP)
- externe Abhängigkeit hoch
- Thomas-Fit < 8 Punkte

## Ampel
- 0–49 = Rot → verwerfen
- 50–69 = Gelb → nicht im Hauptoutput
- 70–84 = Grün → anzeigen
- 85–100 = Stark Grün → priorisiert anzeigen

## Ausgabe je 70+ Idee
- Ideenname
- Kategorie A/B/C
- Punkteaufschlüsselung je Kriterium
- Gesamtscore
- Ampel
- Hauptgrund für Score
- größtes Risiko
- kleinster möglicher Test
- warum naheliegend / angrenzend / neu für Thomas
