# Build-Brief: Vorausschau-Motor (7-Tage-Priorisierung) — Hotel Seat Intelligence

> **Zweck dieses Dokuments:** Geordneter Bau-Fahrplan für die Umsetzung der
> mehrtägigen, vorausschauenden Tischvergabe in `hotel-seat-intelligence/standalone.html`.
> Anschlussfähig an den vorhandenen Code. Für eine spätere Arbeits-Session gedacht,
> die diesen Brief Schritt für Schritt abarbeitet.
>
> **Stand:** erstellt nach Analyse der zwei Hotelier-Dateien
> („Input für Tischplan-Software", „TischEigenschaften_2") am aktuellen App-Stand **v.25.06-ap**.
> Grundregeln gelten unverändert: **keine Änderung ohne Freigabe** (CLAUDE.md Regel 0),
> Push auf `main` **und** Live-Branch `claude/clario-premium-v3-hqr0fs`, Testpaket muss grün sein.

---

## 0. Kernidee in einem Satz

Statt „Wer sitzt **heute** wo?" beantwortet das System künftig „Wer sitzt in den nächsten
**7 Tagen** wo — und was muss **heute** passieren, damit es übermorgen aufgeht?"

Der Auslöser: Der Hotelier liefert künftig **täglich einen 7-Tage-Export** der Anreisen und
Abreisen aus dem PMS. Das ist der fehlende Treibstoff — das Datenmodell für Mehrtages-Planung
(`buildTableCalendar`, `isTableFreeForStay`) existiert im Code bereits.

---

## 1. Ausgangslage im Code (was schon da ist — nicht neu bauen)

| Vorhanden | Wo | Bedeutung für den Motor |
|---|---|---|
| Mehrtages-Kalender | `buildTableCalendar(guests,tables)` (~Z.3388) | Belegt jeden Tisch über `check_in`→`check_out`. Basis für das 7-Tage-Fenster. |
| Zukunfts-Blockade | `isTableFreeForStay(cal,id,ci,co)` + `findBestTable(...,cal)` (~Z.3177) | Ein Tisch mit künftiger Reservierung wird heute nicht doppelt vergeben. |
| Nächte→Kategorie | `getMaxKatForNights(nights)` + `nightsKatRules` (~Z.1719) | „Ab 5 Nächten mind. Kat 3" — einstellbar. |
| Score-Reihenfolge | `scoreGuest` / `scoreGewichte` | Wer bei gleicher Nächtezahl zuerst wählt. |
| Gruppen-Erkennung | `buildLinkedGruppen` | Res-ID, „zu #…", Nachname. |
| Export-Selbstprüfung | `buildFilledTischplanSheet` (~Z.4857) | Kein Gast darf verloren gehen (Export-Sperre). |
| Regressionstests | `tests/run-tests.js` | 39 Invarianten, Pflicht vor jedem Push. |

**Wichtig:** Das ist ein **Ausbau**, kein Neubau. Der Motor erweitert `runCalc` um einen
vorgelagerten Vorausschau-Pass, ändert aber die bestehende Tages-Vergabe nicht destruktiv.

---

## 2. FEHLT NOCH (Blocker für Schritt A): 7-Tage-Export-Format

Der Hotelier schickt ein **Muster** des 7-Tage-Exports (Anreisen + Abreisen) nach. Vor dem
Parser-Bau klären:
- **Eine Datei mit Datums-Spalte pro Zeile** ODER **7 einzelne Tagesdateien**?
- Gleiche Spalten wie die heutigen Tagesberichte (Zimmer, Gastname(n), Nächte, Personen,
  Bemerk., Res.-Status, Res.-Nr.)?
- Bei Abreisen: enthält der 7-Tage-Export weiterhin die Umzüge (die tauchen laut Fall #2 in
  der Abreiseliste auf)?

→ Bis das Muster da ist: Motor + Kalender + Reservierungslogik + Visualisierung lassen sich
bauen und mit **synthetischen 7-Tage-Fixtures** testen; nur der finale Parser wartet auf das Muster.

---

## 3. Stufenplan

### Stufe 0 — Fundament: Tisch-Qualität & Eigenschaften laden (zuerst!)
Ohne definierte Tisch-Qualität ist „Premium" bedeutungslos. Die ausgefüllte Datei des
Hoteliers (`TischEigenschaften_2.xlsx`, Blatt „Tische") wird die **einzige Quelle** für
Qualität + Merkmale — ersetzt die hartcodierte `TISCH_KAT_MAP` (die bei **31 von 71 Tischen
falsch** war).

Aufgaben:
1. Upload/Einlese-Pfad für die Tisch-Eigenschaften-Datei (oder als zusätzliches Blatt der
   Tischplan-Vorlage). Felder je Tisch: `qualitaet(1–8)`, `fenster`, `ruhig`, `rollstuhl`,
   `familie`, `plaetze`, `stammtisch_fuer`, `bemerkung`.
2. `parseTables` / Tischobjekt um `qualitaet` + Merkmale erweitern; `TISCH_KAT_MAP` nur noch
   Fallback, wenn keine Eigenschaften-Datei geladen ist.
3. Zonen-/Wunsch-Logik in `getZoneForGuest` an echte Merkmale koppeln:
   - `kinder>0` **oder** Bemerkung „Familie/Kind" → nur `familie`-Tische
   - Bemerkung „Fenster/Aussicht" → nur `fenster`-Tische
   - Bemerkung „ruhig/abseits" → nur `ruhig`-Tische
   - Bemerkung „Rollstuhl/barrierefrei" → **nur** `rollstuhl`-Tische (harte Regel)
   - nicht erfüllbar → Hinweis statt stiller Ignoranz
4. Freilass-/Notfall-Tische (siehe §5) nur im Notfall vergeben.

### Stufe 1 — Vorausschau-Motor (der Wow-Effekt, heute-Abend-Ziel)
1. **7-Tage-Daten** einlesen (Format gemäß Muster) → alle künftigen Anreisen als Gäste mit
   künftigem `check_in`/`check_out`.
2. **Kalender auf 7 Tage heben:** `buildTableCalendar` über das gesamte Fenster, nicht nur heute.
3. **Prio-Reservierungs-Pass** (vor der normalen Tagesvergabe):
   - Künftige **Langzeit-Anreisen** (viele Nächte) ranken.
   - Für jede: passende **Premium-Tische** (beste Qualität, passende Plätze/Merkmale) im
     Kalender ab ihrem Anreisetag **reservieren/blocken**.
   - Effekt: Die heutige Vergabe setzt dort bewusst **Kurzaufenthalte**, damit der Tisch bis
     zur Langzeit-Anreise frei wird.
   - Reservierung **sichtbar** vermerken (Extras: „reserviert für Langzeit-Anreise TT.MM.").
4. **Früh-Warnungen** (Engpass-Erkennung über das Fenster):
   - „In X Tagen fehlen N Premium-Tische für Langzeitgäste."
   - „Tag X: Gruppe mit ≥ Y Pax — Kombitische 743–746 müssen frei sein."
   - „Tag X: viele 3+-Belegungen — zu wenige geeignete Tische."
   Als reguläre Hinweise (gelb) ins bestehende Warnsystem.
5. **7-Tage-Zeitleiste (Visualisierung):** neue Ansicht im App-Stil — Tisch × Tag, Belegung +
   Reservierungen farbig, Warnungen markiert. Das ist das Demo-Herzstück für den Hotelier.

### Stufe 2 — Aktives Umplanen (späteres, eigenes Projekt — NICHT heute)
Fälle #5, #6, #7, #8, #21: Abreisen gezielt platzieren, Tische tauschen, Kaskaden.
Das ist ein echtes Optimierungsproblem — bewusst separat entscheiden.

---

## 4. „Wow"-Leitplanken (damit der Hotelier die Logik versteht)

- Das System **erklärt seine Voraussicht in seinen Worten**, z. B.:
  „641–646 ab Freitag freigehalten — Sonntag reisen 20 Gäste mit 5+ Nächten an."
- Warnungen treffen **genau seine Fallbeispiele** (gleiche Sprache wie in „Input für
  Tischplan-Software").
- Jede vorausschauende Aktion ist **im Plan sichtbar vermerkt** (Fall #14: bewusste
  Platzierungen müssen erkennbar sein — „Finger weg").

---

## 5. Referenzdaten (aus den Hotelier-Dateien — direkt verwendbar)

**Tische entfernt / nur Notfall:** `627` (7. Tisch 620er-Box), `720` (zu eng), `804`
(nicht mehr geführt). Nicht in der Standard-Vergabe verwenden.

**Bewusst freilassen (Fall #22), nur bei Bedarf:** `616, 718, 721, 744, 748`.

**Enge Tische — max. 2 Pax (Hotelier-Mail + Kombi-Blatt):** `621, 623, 624, 631, 633`
(Reihe mit Bank in der 620er/630er-Box).

**Premium (Qualität 1, 19 Tische):**
`641, 642, 643, 644, 645, 646, 651, 652, 653, 654, 663, 664, 711, 712, 713, 714, 725, 726, 727`.

**Schlechteste (Q5–8):** `746, 749` (5) · `747, 750` (6) · `744, 745, 748` (7) · `802, 803` (8).

**Fenster = Premium-Treiber:** fast alle Q1 liegen am Fenster (641–654, 711–714, 725).

**Echte Tischkombinationen (Blatt „Tischkombinationen", ersetzt hartcodierte Kombis):**
612+613(4) · 611-613(8, 616/617 freilassen) · 622+extra(4) · 622+625(5) · 623+624(5) ·
632+extra(4) · 632+635(5) · 633+634(5) · 643+644(5, nur bes. Stammgäste) · 728+729(6) ·
730+731(6) · 732+733(6) · 743+744(6) · 745+746(7) · 744+745+746(9) · 743-746(13) ·
747+748(8) · 749+750(9).

> Regel #20: **Einzeltische vor Kombis** bevorzugen (4 Pax → 726 statt 732+733).

**Zimmer-Qualität (Blatt „Qualität Zimmerkategorien", für Tie-Break #19):** Qualität 1–8 →
Zimmernummern (70 Zimmer). Bei gleicher Nächtezahl entscheidet die Zimmer-Qualität, wer den
schöneren Tisch bekommt.

**Zimmerliste (Blatt „Zimmernummern", für Vollständigkeits-Check #12):**
101-113, 116-121, 201-208, 215-219, 301, 302, 307, 401-407, 501-518, 2001-2010.

---

## 6. Die 22 Fallbeispiele → Zuordnung zum Plan

| Fälle | Thema | Stufe |
|---|---|---|
| #12 | Zimmer-Vollständigkeit (Zimmerliste) | 0 |
| #19 | Tie-Break Zimmer-Qualität | 0 |
| #22 | Freilass-Tische | 0 |
| #20 | Einzeltisch vor Kombi | 0 |
| #9 | Allergien fett/farbig | 0 |
| #13 | 2× gleicher Nachname → Info | erledigt |
| #18 | längster Aufenthalt → schönster Tisch (Unterkategorisieren) | 0/1 |
| #3, #11 | Premium/Wunschtisch vorausschauend freihalten | 1 |
| #6, #21 | Engpass-/Gruppen-Vorwarnung | 1 (Warnung) / 2 (aktiv) |
| #1, #2 | Umzüge / Gesamtaufenthalt | 1 (erkennen) / 2 (voll) |
| #14, #16, #17 | Änderungs-Protokoll + Sortierung-Zimmer-Sync | 2 |
| #4, #5, #7, #8, #10, #15 | Tausch/Umsetzen am Tag | 2 |

---

## 7. Tests (Pflicht — erweitern, nicht ersetzen)

Neue Fixtures unter `tests/fixtures/` (synthetisch **oder** anonymisiertes 7-Tage-Muster,
sobald vorhanden — **niemals echte Gastnamen ins Repo**).

Neue Invarianten in `tests/run-tests.js`:
- Kalender: kein Tisch am selben Tag doppelt belegt.
- Reservierung: ein für eine Langzeit-Anreise reservierter Tisch ist am Anreisetag frei.
- Früh-Warnung feuert, wenn Premium-Engpass konstruiert wird; feuert **nicht** im Normalfall.
- Regression: bestehende 39 Checks bleiben grün (Stufe-0/1 dürfen den Tagesplan nicht brechen).

---

## 8. Reihenfolge für die Session

1. **Stufe 0 zuerst** (Tisch-Eigenschaften laden + Wunsch-Logik) — ohne das ist „Premium"
   undefiniert. Ist ohnehin die „Sofort-Stufe".
2. **Stufe 1** (Vorausschau-Motor + Warnungen + Zeitleiste) — der Wow-Effekt.
3. Tests grün → Version bumpen → `main` + Live-Branch pushen → Live-URL melden.
4. Parser für das echte 7-Tage-Format finalisieren, sobald das Muster vom Hotelier da ist.

**Offen bis Session-Start:** 7-Tage-Export-Muster vom Hotelier (Format-Entscheidung in §2).
