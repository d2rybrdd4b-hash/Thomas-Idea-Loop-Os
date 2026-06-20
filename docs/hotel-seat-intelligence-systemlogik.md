# Hotel Seat Intelligence — Systemlogik & Priorisierung

**Stand:** 20.06.2026
**Zweck dieses Dokuments:** Nachvollziehbare Erklärung, nach welcher Logik die App Gäste den Tischen zuweist — zum Zeigen an Hoteliers, als Vertrauens- und Transparenznachweis.

---

## 1. Überblick

Hotel Seat Intelligence weist Restaurant-Tische automatisch anhand einer dokumentierten, im Hotel selbst einstellbaren Regellogik zu. Es gibt **keine externe Branchen-Norm oder Zertifizierung**, auf der dieses System „basiert" — eine solche Behauptung wäre nicht belegbar und wird hier bewusst nicht aufgestellt. Was es gibt, ist eine vollständig dokumentierte, hausinterne Regellogik, die der Hotelier selbst einsehen, verstehen und anpassen kann. Diese Transparenz ist das eigentliche Qualitätsmerkmal.

---

## 2. Die vier Phasen der Tischzuweisung

Die Berechnung läuft in fester Reihenfolge ab:

| Phase | Wer wird zugewiesen | Grundprinzip |
|---|---|---|
| 1 — Bleibegäste | Gäste, die schon einen Tisch hatten und bleiben | Bekommen denselben Tisch zurück, sofern frei |
| 2 — Prognose-Gäste | Gäste mit zukünftigem, bereits bekanntem Aufenthalt | Tisch wird vorausschauend für die gesamte Aufenthaltsdauer reserviert |
| 3a — Gruppen/Familien | Neue Gäste mit gleichem Nachnamen, unterschiedlichen Zimmern | Größte Gruppen zuerst, möglichst ein gemeinsamer Tisch |
| 3b — Einzelgäste | Alle übrigen neuen Gäste | Zuweisung nach Priorisierungs-Punktesystem (siehe Abschnitt 3) |

Erst wenn eine frühere Phase abgeschlossen ist, beginnt die nächste. Das stellt sicher, dass bestehende Gäste nicht durch neue Buchungen verdrängt werden.

---

## 3. Priorisierungs-Punktesystem

Für neue Einzelgäste (Phase 3b) wird ein Punktwert berechnet. Wer mehr Punkte hat, bekommt bei knappen Tischen Vorrang.

| Kriterium | Standardwert | Vom Hotelier einstellbar? |
|---|---|---|
| VIP-Gast | +20 Punkte | Ja |
| Stammgast | +15 Punkte | Ja |
| Langzeit-Aufenthalt (≥ 7 Nächte) | +15 Punkte | Ja |
| Frühbucher (Buchung > 30 Tage im Voraus) | +8 Punkte | Ja |
| Gruppe (≥ 4 Personen) | +6 Punkte | Ja |
| Suite/Premium-Zimmerkategorie | +10 Punkte | Nein (fest im System hinterlegt) |

Beispiele aus der kombinierten Wirkung:
- VIP-Gast: 20 Punkte
- VIP + Stammgast: 35 Punkte
- Stammgast + Langzeit: 30 Punkte

Alle einstellbaren Werte werden direkt in den Einstellungen der App verändert und wirken sich sofort auf die nächste Berechnung aus.

---

## 4. Tischkategorie nach Aufenthaltsdauer

Tische sind in Kategorien eingeteilt (Kategorie 1 = beste Tische). Eine zusätzliche Regel kann festlegen: Ab wie vielen Nächten Aufenthalt bekommt ein Gast garantiert einen Tisch aus einer bestimmten Kategorie oder besser?

**Standardregel:** Ab 5 Nächten Aufenthalt → mindestens Kategorie 3.

Diese Regel ist frei konfigurierbar; es lassen sich beliebig viele Stufen ergänzen (z. B. ab 10 Nächten → Kategorie 2).

---

## 5. Anlässe (Geburtstag, Hochzeit, Verlobung, Jubiläum)

Erkannte Anlässe (aus Notiz-/Bemerkungsfeldern der Gästedaten) geben **keinen zusätzlichen Punktbonus**, verschaffen dem Gast aber einen Rang-Vorteil innerhalb der Sortierung — er wird bei der Tischvergabe bevorzugt behandelt. Jeder Anlasstyp lässt sich einzeln ein- oder ausschalten.

---

## 6. Harte Regeln — haben Vorrang vor dem Punktesystem

Zusätzlich zum Punktesystem lassen sich harte, zwingende Regeln definieren:

- **Zimmerregeln:** z. B. „Zimmer 101 bekommt immer Tisch A03" oder „Zimmer-Zone X nur Zone-Y-Tische". Diese Regeln werden **vor** dem Punktesystem geprüft und haben Vorrang.
- **Tischregeln:** z. B. „Tisch B02 maximal 2 Personen". Diese Regel schließt einen Tisch komplett aus, wenn die Personenzahl nicht passt — unabhängig vom Punktestand des Gastes.

Das Punktesystem entscheidet also nur dort, wo keine harte Regel bereits eine eindeutige Vorgabe macht.

---

## 7. Datenhaltung & Datenschutz

**Fakt (im Code verifiziert):** Die App enthält keinerlei Netzwerkaufrufe, die Gästedaten an einen Server senden (keine `fetch`-, `XMLHttpRequest`- oder vergleichbaren Aufrufe vorhanden). Sämtliche Daten — Tischpläne, Gästedaten, Einstellungen — werden ausschließlich lokal im Browser des verwendeten Geräts gespeichert (`localStorage`). Es findet keine Übertragung an externe Server statt.

---

## 8. Einordnung

Diese Dokumentation beschreibt die tatsächliche, im Quellcode nachvollziehbare Logik der App — keine Marketingaussage. Es handelt sich um eine selbst entwickelte, vollständig transparente und vom Hotelier einsehbare Regellogik, keine externe Zertifizierung oder Branchen-Norm. Genau diese Nachvollziehbarkeit — jede Regel ist dokumentiert, jeder Wert einstellbar, keine Black Box — ist der eigentliche Qualitäts- und Vertrauensnachweis gegenüber dem Hotelier.
