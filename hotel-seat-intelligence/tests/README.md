# Tests — hotel-seat-intelligence

Regressionstests gegen die **realen Dateiformate des Hotels** (anonymisiert).
Entstanden nach dem Panorama-Vorfall vom 01.07.2026: Bei der zweispaltigen
Hotelier-Vorlage („Tischplan_Blanco") schrieb der Export nur den linken
Spaltenblock — alle Tische ab 711 fehlten, 28 Gäste erschienen nirgends,
ohne jede Warnung.

## Regel (verbindlich)

**Vor JEDEM Push, der `standalone.html` ändert, muss dieser Testlauf grün sein:**

```bash
node tests/run-tests.js
```

Exit-Code `0` = pushen erlaubt. Alles andere = Fehler beheben, nicht pushen.

## Was geprüft wird

| Szenario | Vorlage | Kern-Invarianten |
|---|---|---|
| S1 | Blanco (zweispaltig, mit Platzzahlen) | 7xx-Zeilen im Export, keine Überbelegung, kein Gast verloren/falsch |
| S2 | Mappe3 (einspaltig, 3 Blätter) | dito (Regression Altformat) |
| S3 | keine (Vortag-Fallback) | Berechnung fehlerfrei, alle platziert |

Alle Szenarien zusätzlich: 0 JS-Laufzeitfehler, 0 unplatzierte Gäste,
0 „Geister"-Zuweisungen, Export-Selbstprüfung `exportMissing === 0`.

## Fixtures (Datenschutz)

`tests/fixtures/` enthält **ausschließlich anonymisierte** Dateien:
- Alle Gastnamen wurden durch deterministische Aliase ersetzt (konsistent über
  alle Dateien, damit Bleibegast-/Dedupe-Logik real getestet wird).
- Freitext-Bemerkungen (inkl. Gesundheitsangaben) wurden durch generische
  Testmuster ersetzt („Nussallergie", „Early Check in", …).
- Struktur, Tischnummern, Zimmer, Daten, Nächte, Pax und Formatierung
  (Spaltenblöcke, graue Bereiche) sind unverändert — das ist der Testgegenstand.
- `vorlage-blanco.xlsx` ist unverändert übernommen (enthält keine Personendaten).

**Echte PMS-Dateien mit Gastnamen dürfen NIEMALS in dieses Repository** —
es ist über GitHub Pages öffentlich erreichbar.

### 7-Tage-Fixtures (für den Vorausschau-Motor)

Zusätzlich liegen anonymisierte Echt-Daten für die mehrtägige Planung bereit
(Grid 1:1 wie die Originale, alle Gastnamen durch Aliase ersetzt, Freitexte auf
Wunsch-Signale reduziert, keine Geburtsdaten):

| Datei | Inhalt |
|---|---|
| `arr7-anon.xlsx` | **7-Tage-Anreisen** (07.–13.07.), Anreise-Datum je Zeile in Spalte 17 |
| `dep7-anon.xlsx` | Abreisen inkl. Zimmer-Kategorie-Spalte („Kat.") |
| `plan-mo-anon.xlsx` | fertiger Hotelier-Tischplan Mo 06.07. (zweispaltig) — als „Vortag" nutzbar |
| `plan-di-anon.xlsx` | fertiger Hotelier-Tischplan Di 07.07. — **Referenz/Ground-Truth** der echten Logik |

Erhaltene Test-Signale: verknüpfte Buchungen „zu #…" (17×), Kinder/„Ki" (17×),
Allergien, Tischwünsche, Zimmernummern, Nächte, Tischzuweisungen, Datumsspanne.

Verifikation (Skripte im Scratchpad der Erstell-Session): 0 echte Nachnamen,
0 Geburtsjahre, Grid `A1:O72` identisch zum Original.

## Neue Formate aufnehmen

Wenn der Hotelier eine neue Dateiart/Vorlage einführt: zuerst anonymisieren,
als Fixture ablegen, Szenario in `run-tests.js` ergänzen — **dann erst** die
App-Änderung bauen. Kein Format geht ungetestet in den Betrieb.
