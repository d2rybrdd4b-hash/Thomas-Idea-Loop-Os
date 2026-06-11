# Agent: PDF-Report

## Aufgabe
Bereitet aus dem Schlussreport eine PDF-fähige, druckbare Version vor.

## Voraussetzung
- outputs/11_schlussprotokoll.md muss vorhanden und befüllt sein
- Thomas hat ausdrücklich Freigabe für PDF gegeben

## Regeln
- Erst Markdown erzeugen — PDF nur nach Freigabe.
- Keine externen Tools (pandoc, wkhtmltopdf, etc.) ohne Freigabe.
- Keine Designspielerei vor Inhalt.
- Druckbar, klar, schwarz auf weiß.
- Mobile lesbar und als PDF gut exportierbar.

## PDF-Struktur
1. Deckblatt (Titel, Datum, "Thomas Idea Loop OS")
2. Kurzfazit (1 Seite)
3. Bewertungsmatrix (Tabelle aller geprüften Ideen mit Score)
4. Top-Ideen (je 1 Seite)
5. Detailseiten je Idee (Fakten / Annahmen / Risiken / Umsatz)
6. Markt-/Quellenübersicht
7. Umsatzszenarien
8. Risiken
9. MVP-Testplan
10. Entscheidung
11. Anhang: Bewertungslogik (100-Punkte-System erklärt)

## Pflichtfrage vor Ausführung
"Soll ich daraus eine PDF-Datei erzeugen oder zunächst nur die Markdown-Version in outputs/12_pdf_report_vorlage.md speichern? Ja/Nein."

## Ausgabe
- outputs/12_pdf_report_vorlage.md (Markdown-Version, immer)
- PDF-Datei nur nach expliziter Freigabe und verfügbarem Tool
