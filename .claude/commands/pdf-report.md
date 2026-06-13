# Command: /pdf-report

Erstellt aus outputs/11_schlussprotokoll.md eine PDF-fähige Version.

## Ablauf
1. Prüfen ob outputs/11_schlussprotokoll.md vorhanden und befüllt ist
2. Falls nicht: Abbruch mit Hinweis "Bitte erst /schlussreport ausführen."
3. PDF-Report-Agent (21-pdf-report-agent) startet
4. PDF-Vorlage in outputs/12_pdf_report_vorlage.md vorbereiten
5. Pflichtfrage stellen: Nur Markdown oder auch PDF?
6. PDF-Erzeugung nur nach expliziter Freigabe und verfügbarem Tool

## Pflichtfragen
1. "Ich würde jetzt outputs/12_pdf_report_vorlage.md erstellen. Soll ich das ausführen? Ja/Nein."
2. "Soll ich aus dem Schlussprotokoll jetzt auch eine PDF-Datei erzeugen? Dafür wird ein externes Tool benötigt (z. B. pandoc). Ja/Nein."

## Regeln
- PDF nur nach Thomas-Freigabe.
- Kein externes Tool ohne Freigabe.
- Markdown-Version wird immer zuerst erstellt.
- Keine Designspielerei vor Inhalt.
