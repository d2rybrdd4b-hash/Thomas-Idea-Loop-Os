# Command: /buildprompt

Erstellt den finalen Bauprompt für Claude, Lovable, Cursor oder Replit.

## Voraussetzung
- docs/produkt-spezifikation.md befüllt
- docs/design-briefing.md befüllt
- Thomas hat ausdrücklich Freigabe gegeben

## Ablauf
1. Produktspezifikation und Design-Briefing lesen
2. Buildprompt-Agent (16-buildprompt-agent) starten
3. Vollständigen Bauprompt erstellen
4. Pflichtfrage stellen
5. Erst nach JA in docs/build-prompt.md und outputs/10_build_prompt.md schreiben

## Pflichtfrage
"Ich würde jetzt den Bauprompt in docs/build-prompt.md speichern. Soll ich das ausführen? Ja/Nein."

## Regeln
- Nur nach Thomas-Freigabe.
- Bauprompt muss vollständig sein — keine Lücken für die empfangende KI.
- Keine sensiblen Daten im MVP, wenn vermeidbar.
