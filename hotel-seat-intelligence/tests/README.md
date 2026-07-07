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
| S4 | Blanco + **7-Tage-Echtdaten** (07.–13.07.) | Vorausschau-Motor: Prognosen erkannt, Prio-Reservierungen, Zeitleiste, PAX-Spalte, keine Prognose im Tagesplan; Ground-Truth **07.07.** |
| S5 | Blanco + **7-Tage-Echtdaten ab 08.07.** | Zweiter echter Hotelier-Tag (Anlernen/Stabilität). Ground-Truth **08.07.**, plus die drei Regel-Prüfsteine unten |

Alle Szenarien zusätzlich: 0 JS-Laufzeitfehler, 0 unplatzierte Gäste,
0 „Geister"-Zuweisungen, Export-Selbstprüfung `exportMissing === 0`.

### Angelernte Hotelier-Regeln als Prüfsteine (Baustein 1)

Aus dem Backtest gegen die echten Hotelier-Pläne gelernte Regeln werden bei **jedem**
Vorausschau-Tag (S4 **und** S5) automatisch geprüft — so kann keine künftige Änderung eine
gelernte Regel heimlich kaputtmachen:

| Regel | Prüfung |
|---|---|
| **A — Bleibegast-Treue** | Kein Gast, der schon gestern hier war (Vortags-Tisch, kein Neu-Anreisender), wird umgesetzt. Selbstprüfend, muss immer 0 sein — das Kernversprechen. |
| **B — Studio-Reserve (80x)** | Kein gutes Zimmer (Q≤6) landet auf 801/802/803, solange andere Tische frei sind (Fund 08.07.: gute Zimmer auf Ersatzreihe). |
| **C — Kurzes Tiny-Studio** | Tiny-Studio (Zimmer-Q8) mit ≤2 Nächten bekommt keinen Premium-Tisch (Kat≤2) — der Hotelier gibt kurzen Studios bewusst schlechtere Tische. |

**Mehrtägiges Anlernen (Baustein 2):** Neue Regeln werden nur eingebaut, wenn dieselbe
Abweichung an **mehreren** echten Tagen auftritt (echte Logik, nicht Tageslaune). Jeder Tag,
den der Hotelier schickt, wird als weiterer Ground-Truth-Tag ergänzt (`ground-truth-<tag>.json`
+ `arrN`/`depN`-Fixtures + Szenario in `run-tests.js`). Referenz-Schwellen je Tag über das
`groundTruth`-Feld der Szenario-Definition.

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
| `plan-di-anon.xlsx` | fertiger Hotelier-Tischplan Di 07.07. — **Referenz/Ground-Truth** 07.07. **und** „Vortag" für S5 |
| `arr8-anon.xlsx` | **7-Tage-Anreisen ab 08.07.** (08.–14.07.) — Eingabe für S5 |
| `dep8-anon.xlsx` | Abreisen 08.–09.07. — Eingabe für S5 |
| `ground-truth-mi.json` | Zimmer→Tisch des echten Hotelier-Plans **Mi 08.07.** — Referenz für S5. Reine Zahlen/Tische, **keine Namen** (kein PII). |
| `ground-truth-di.json` / `ground-truth-mo.json` | Zimmer→Tisch 07.07. / 06.07. (ebenfalls PII-frei) |

Erhaltene Test-Signale: verknüpfte Buchungen „zu #…" (17×), Kinder/„Ki" (17×),
Allergien, Tischwünsche, Zimmernummern, Nächte, Tischzuweisungen, Datumsspanne.

Verifikation (Skripte im Scratchpad der Erstell-Session): 0 echte Nachnamen,
0 Geburtsjahre, Grid `A1:O72` identisch zum Original.

## Neue Formate aufnehmen

Wenn der Hotelier eine neue Dateiart/Vorlage einführt: zuerst anonymisieren,
als Fixture ablegen, Szenario in `run-tests.js` ergänzen — **dann erst** die
App-Änderung bauen. Kein Format geht ungetestet in den Betrieb.
