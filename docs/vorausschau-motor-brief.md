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

## 2. 7-Tage-Export-Format — GEKLÄRT (Muster vom 07.–13.07. analysiert)

- **Anreisen = EINE Datei** mit Datumsbereich (Kopf „Vom: 07.07.2026 / Bis: 13.07.2026"),
  Sheet `DynamicListReport_*`, Kopfzeile in Zeile 6. **Jede Zeile hat eine eigene
  Anreise-Spalte** (Spaltenindex 16, Format „07.07.26"). Weitere Spalten wie bisher:
  Zimmer(1), Gastname(n)(2), Nächte(5), Personen(6), Bemerk.(8), Bemerk.(Zi.)(11),
  Res.-Status(14), Res.-Nr.(15).
  → Parser: den bestehenden `parsePanoramaArrival` erweitern, sodass er **alle** Zeilen über
  das Fenster liest und pro Zeile das Datum aus Spalte 16 als `check_in` nimmt
  (`check_out = check_in + Nächte`).
- **Abreisen = EINE Datei** mit Datumsbereich, zusätzlich Spalten **Anreise(5), Abreise(7),
  Nächte(8), Kat.(10 = Zimmer-Kategorie z.B. „JS Garten"/„Tiny Studio"), Personen(11)**.
  → Die `Kat.`-Spalte ist direkt die **Zimmer-Qualität** (siehe §5a) und sollte mitgelesen werden.
- Verknüpfte Buchungen erscheinen als „zu #NNNNN" in Bemerk. (sehr häufig, siehe §5b).

→ Motor, Kalender, Reservierungslogik, Visualisierung + Parser können jetzt gebaut werden.
Fixtures: anonymisiertes 7-Tage-Muster (niemals echte Namen).

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
5. **Zimmer-Qualität in den Vergabe-Score aufnehmen** (§4a Punkt 2 — belegt aus Echtdaten):
   bei der Reihenfolge, wer zuerst den schöneren Tisch wählt, zählt die Zimmer-Kategorie
   **gleichwertig zu den Nächten**. Score-Gewicht ergänzen; Tiny Studio (Q8) deckelt nach unten.

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

## 4a. GELERNTE LOGIK aus zwei echten Tagesplänen (Mo 06.07. → Di 07.07.)

Aus dem Vergleich zweier fertiger Hotelier-Pläne rekonstruiert — das ist seine reale Logik:

**(1) Tisch-Treue ~100 %.** 54 von 58 bleibenden Gästen behielten den exakten Tisch,
**0 echte Umzüge**. Die 4 Zimmer-Diffs waren **Zimmer-Wechsel** (Abreise → neue Anreise in
derselben Zimmernummer). → Bleibegast-Regel hat oberste Priorität; nie ohne Grund umsetzen.

**(2) ⭐ Zimmer-Qualität steuert Tisch-Qualität (zentraler Treiber, Fall #19 belegt).**
Korrelation aus dem echten Plan:

| Zimmer-Q | Ø Tisch-Q | | Zimmer-Q | Ø Tisch-Q |
|---|---|---|---|---|
| Q1 | 1,0 | | Q5 | 2,7 |
| Q2 | 1,2 | | Q6–Q7 | 2,0–2,3 |
| Q3 | 2,6 | | **Q8 (Tiny Studio)** | **4,3 (bis 7)** |
| Q4 | 2,8 | | | |

→ **Der Vergabe-Score braucht die Zimmer-Kategorie als gleichwertige Priorität neben den
Nächten** (bisher nur Nächte). Bestes Zimmer → bester Tisch; Tiny Studio → einfacher Tisch.

**(3) Wünsche sind durch die Zimmer-Klasse gedeckelt.** Beispiel: Tiny-Studio-Gast wünscht
„ruhig mit Aussicht" → bekam einen Q4-Tisch (nicht erfüllt). → Wünsche gelten, aber die
Zimmer-Klasse setzt die Obergrenze; nicht über die Klasse „hochplatzieren".

**(4) Häufigkeit der Sonderfälle (aus den 7-Tage-Anreisen — Priorität der Umsetzung):**
verknüpfte Buchungen „zu #…" **17×** · Kinder/Baby **14×** · Allergien 6× · Geburtstage 6× ·
Honeymoon 3× · konkreter Tischwunsch 2× · ruhig/Aussicht 2×.
→ **Verknüpfte Buchungen und Familien zuerst perfekt machen** — das ist das Alltagsvolumen.

**(5) Keine feste Zimmer→Restaurant-Zuordnung.** Beide Restaurants mischen alle Zimmertypen
(~60/40). Nicht starr „Zimmer X → Restaurant Y" verdrahten.

---

## 5. Referenzdaten (aus den Hotelier-Dateien — direkt verwendbar)

### 5a. Zimmer-Qualität (Blatt „Qualität Zimmerkategorien" + Abreise-Spalte „Kat.")
Q1: 307 · Q2: 404,407,101,121,201,219 · Q3: 116–120,215–218 · Q4: 202–204,301,302,405,406,
501–518,105,206,205 · Q5: 106,107,401–403,102–104,113 · Q6: 208,108,109,207 · Q7: 110–112 ·
Q8: 2001–2010 (Tiny Studio).

### 5b. Weitere Referenzdaten

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
