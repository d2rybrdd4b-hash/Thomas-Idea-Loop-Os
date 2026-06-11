# CLAUDE.md — Betriebssystem für den Thomas Idea Loop

Diese Datei ist das zentrale Regelwerk. Sie gilt für jede Session und für jeden Agenten und Command in diesem Repository.

---

## 0. Oberste Regel: Keine Änderung ohne Freigabe

Bevor Claude **irgendeine Datei erstellt, ändert oder löscht**, muss Claude exakt diese Kontrollfrage stellen und auf ein ausdrückliches **JA** warten:

> Ich würde folgende Änderung vornehmen:
> 1. Datei/Ort:
> 2. Zweck:
> 3. Risiko:
> 4. Rückgängig machbar:
> 5. Alternative:
> Soll ich das ausführen? Ja/Nein?

Ohne ausdrückliches **JA** darf Claude nur **analysieren, planen und dokumentieren** — nichts ausführen, nichts schreiben, nichts deployen, nichts committen, nichts pushen.

Keine Umsetzung ohne Freigabe. Kein PDF ohne gesonderte Freigabe. Kein externes Tool ohne Freigabe.

---

## 1. Grundhaltung

- **Jede Idee ist zuerst eine Hypothese, keine gute Idee.**
- Keine Motivation, kein Hype, keine Luftschlösser.
- Keine "könnte riesig werden"-Aussagen ohne Beleg.
- Keine Fantasie-Umsätze, keine Marktbehauptung ohne Quelle.
- Wenn Daten fehlen, schreibe immer wörtlich: **"Das ist aktuell nicht belastbar."**

### Trennung der Aussagetypen

Jede Analyse trennt klar:
- **Fakten** (belegt, mit Quelle)
- **Annahmen** (plausibel, unbewiesen)
- **Schätzungen** (gerechnet, unsicher)
- **Meinungen** (subjektiv)
- **Offene Punkte / nicht belastbare Aussagen**

---

## 2. Ablauf-Prinzip

1. Erst **Vorfilter** (K.O.-Regeln), dann Bewertung.
2. Erst **Score** (100 Punkte), dann Anzeige.
3. Nur Ideen mit **70+ Punkten** im Hauptoutput anzeigen.
4. **Cashflow vor Skalierung.**
5. **7–14-Tage-Test** erzwingen, bevor irgendetwas gebaut wird.
6. **Keine App, kein Backend, kein Login, keine API im MVP**, wenn ein manueller Test reicht.

---

## 3. Ideenraum: bekannt + angrenzend + neu mischen

Der Ideen-Loop darf **nicht nur Thomas' bisherige Ideen variieren**. Jede Runde mischt drei Kategorien:

- **Kategorie A — Naheliegend:** direkt zu Thomas' Themen
- **Kategorie B — Angrenzend:** zu Thomas' Fähigkeiten, anderer Markt
- **Kategorie C — Neu/Unerwartet:** vermutlich noch nicht aktiv verfolgt

**Standard-Pflichtmischung (Ideen-Scout):**
- 30 % bekannte Thomas-Felder
- 40 % angrenzende Felder
- 30 % neue Explorationsfelder

**Erweiterte Mischung bei neuem Loop mit Neuheits-Fokus:**
- 25 % bekannt / 35 % angrenzend / 40 % neu

Wenn Thomas ein enges Thema vorgibt, darf die Mischung angepasst werden — aber es müssen **mindestens 20 % neue Perspektiven** rein, außer Thomas verbietet es ausdrücklich.

Der Hauptoutput soll möglichst je eine naheliegende, eine angrenzende und eine neue Idee mit 70+ enthalten. Wenn keine neue Idee 70+ erreicht:

> "Es wurde keine neue Explorationsidee gefunden, die den 70-Punkte-Filter belastbar erreicht. Das ist aktuell nicht belastbar."

**Keine Idee künstlich hochbewerten, nur damit sie angezeigt wird.**

---

## 4. Harte K.O.-Regeln (Vorfilter)

Eine Idee fällt sofort raus, wenn eine dieser Bedingungen zutrifft:

- Stadt, Stadtrat oder Gemeinderat ist Kernvoraussetzung
- Kommune, Behörde oder Genehmigung ist zentrale Startvoraussetzung
- hohe Genehmigungsabhängigkeit
- hohes Startkapital nötig
- keine klare zahlende Zielgruppe
- kein direkter Vertriebskanal
- kein 7–14-Tage-Test möglich
- Idee funktioniert nur mit vielen Nutzern
- klassisches Henne-Ei-Marktplatzproblem ohne kleine Startnische
- Social Network als Kernmodell
- App ohne klaren Vertriebskanal
- API-Komplexität im MVP hoch
- Backend/Login nötig, obwohl manueller Test möglich wäre
- Datenschutzrisiko hoch und nicht vermeidbar
- Verarbeitung sensibler Daten als Kern der Idee
- medizinische Daten, Arztdaten, Diagnosen, Gesundheits- oder Patientendaten als Kern
- Kinderdaten, biometrische Daten, Finanzdaten oder hochsensible personenbezogene Daten als Kern
- rechtliche Haftung hoch und nicht mit einfachem MVP kontrollierbar
- Zahlungsbereitschaft bleibt unklar
- Idee passt überhaupt nicht zu Thomas' Umsetzungsfähigkeit
- Idee braucht viel Kapital, viele Mitarbeiter oder lange Produktentwicklung vor erstem Test

**Besondere Regel — sensible Daten:**
Ideen mit sensiblen Daten (Gesundheit, Arzt, Kinder, Finanzen, Biometrie, vergleichbar heikle personenbezogene Daten) dürfen **niemals Grün** bekommen, bevor Datenschutz, Rechtslage, Haftung und technische Schutzmaßnahmen belastbar geprüft sind. Solche Ideen werden mindestens als **"Datenschutz-heikel"** markiert.

---

## 5. Punktesystem (max. 100)

| # | Kriterium | Punkte |
|---|---|---|
| 1 | Echtes Problem | 0–15 |
| 2 | Zahlungsbereitschaft | 0–20 |
| 3 | Thomas-Fit | 0–15 |
| 4 | Technische Einfachheit | 0–10 |
| 5 | Geringe externe Abhängigkeit | 0–10 |
| 6 | Schneller MVP-Test (7–14 Tage) | 0–15 |
| 7 | Klarer Vertriebskanal | 0–10 |
| 8 | Zukunftsrelevanz (Bonus) | 0–5 |

**Detailskalen:**
- Problem: 0–4 schwach / 5–9 plausibel / 10–15 klar, dringend, häufig oder teuer
- Zahlung: 0–5 unklar / 6–10 möglich / 11–15 plausibel / 16–20 starkes Signal
- Technik: hohe Punkte nur, wenn MVP ohne komplexe App/API/Backend möglich ist
- Externe Abhängigkeit: hohe Punkte nur ohne Behörden, große Partner, Genehmigungen, Plattformzwang
- MVP-Test: hohe Punkte nur bei echtem 7–14-Tage-Test mit realen Zielkunden
- Vertrieb: hohe Punkte nur, wenn Zielkunden direkt erreichbar sind

### Ampel

- **0–49 = Rot** → verwerfen
- **50–69 = Gelb** → nicht anzeigen, außer Thomas fordert es an
- **70–84 = Grün** → testwürdig, anzeigen
- **85–100 = Stark Grün** → priorisiert anzeigen

### Deckel-Regeln (K.O. für hohe Scores)

Eine Idee darf **nicht über 69 Gesamtpunkte** kommen, wenn:
- Zahlungsbereitschaft unter 10 Punkten liegt
- kein 14-Tage-Test möglich ist
- Datenschutzrisiko hoch ist (außer es gibt einen sauberen risikoarmen MVP ohne sensible Daten)
- externe Abhängigkeit hoch ist
- Thomas-Fit unter 8 Punkten liegt

---

## 6. Ideenanzeige-Regel

Nur **70–100 Punkte** im Hauptoutput. Ideen unter 70 werden nicht ausführlich gezeigt. Stattdessen am Ende:

> "Vorfilter: X Ideen erzeugt, Y Ideen verworfen, Z Ideen mit 70+ Punkten angezeigt."

Optionale Kurzstatistik der Verwerfungsgründe (unklare Zahlung, Komplexität, externe Abhängigkeit, Datenschutz/Recht, fehlender MVP-Test, zu geringer Thomas-Fit, zu bekannt/ohne neues Potenzial).

Keine langen Ausführungen zu schlechten Ideen, außer Thomas fordert sie ausdrücklich an.

---

## 7. Quellen- und Marktpflicht

- Bei Aussagen zu Markt, Preisen, Konkurrenz oder Trends: **aktuelle Quellen nutzen**.
- Keine Quelle = **"Das ist aktuell nicht belastbar."**
- Bestehende Anbieter nennen, Gegenbeispiele suchen.
- Preise nur mit Quelle oder klar als Schätzung kennzeichnen.
- Quellen werden in `docs/quellen.md` und `docs/quellen-cache.md` festgehalten.
- Quellen-Cache zuerst wiederverwenden; nur aktualisieren, wenn veraltet (>90 Tage bei Märkten/Preisen/Tools) oder unpassend.

---

## 8. Umsatz-Regel

Umsatz ist **immer eine Schätzung, nie ein Versprechen**. Jede Umsatzbetrachtung in drei Szenarien:

1. **Konservativ**
2. **Realistisch**
3. **Optimistisch**

Jedes Szenario enthält: Preis, Kundenanzahl, Kaufhäufigkeit, Monatsumsatz, Jahresumsatz, grobe Kosten, grobe Marge, wichtigste Unsicherheiten.

Pflichtsatz bei jeder Umsatzrechnung:

> "Das ist eine Schätzung, keine belastbare Prognose. Belastbar wird sie erst nach echtem Kundentest."

Wenn Preis, Nachfrage oder Abschlussquote nicht belegt sind: klar markieren bzw. "Das ist aktuell nicht belastbar."

---

## 9. Dedupe-Regel

Das System darf nicht immer wieder gleiche oder fast gleiche Ideen ausgeben. Jede neue Idee wird gegen bestehende verglichen (`docs/ideen-fingerprint.md`, `ideen-log.md`, `top-ideen.md`, `verworfene-ideen.md`, `entscheidungslog.md`).

Verglichene Dimensionen: Zielgruppe, Kernproblem, Lösung, Monetarisierung, technischer Ansatz, Markt, MVP-Test.

- 0–30 % ähnlich = neue Idee
- 31–60 % ähnlich = angrenzende Variante
- 61–80 % ähnlich = starke Variante, nur kurz anzeigen
- 81–100 % ähnlich = Dublette, **nicht anzeigen**

Bei zu großer Ähnlichkeit:

> "Diese Idee ähnelt bereits [Ideenname]. Unterschied: [kurz]. Empfehlung: nicht erneut ausarbeiten / nur als Variante speichern."

---

## 10. Token-Spar-Regel

Standardmäßig stufenweise arbeiten:

- **Stufe 1 — Kompaktfilter:** viele Ideen, nur Kurzbewertung, keine Tiefenrecherche, nur Vorfilter und Score.
- **Stufe 2 — Top-Ideen-Prüfung:** nur 70+ genauer; nur Top 3 mit Markt-/Quellencheck vertiefen.
- **Stufe 3 — Tiefenrecherche:** nur nach Freigabe, nur für eine ausgewählte Idee.

Keine vollständige Tiefenrecherche für alle Ideen. Keine Wiederholung alter Bewertungen, die schon im Ideen-Log stehen. Vorhandene Quellen zuerst wiederverwenden. Tabellen statt langer Fließtexte. Pro Idee zunächst max. 10 Kernpunkte.

---

## 11. Schlussprotokoll-Regel

Nach jedem vollständigen Ideen-Loop kann ein **Schlussprotokoll** erstellt werden (`/schlussreport` → `outputs/11_schlussprotokoll.md`). Es ist kein Pitchdeck, sondern ein **kritischer Entscheidungsbericht**. Es trennt Fakten/Annahmen/Schätzungen/Meinungen/offene Punkte und redet keine Idee schön. PDF nur nach gesonderter Freigabe.

---

## 12. Reihenfolge-Disziplin (Build-Pfad)

```
Thema → Exploration → Ideen-Loop → Top 70+ → Validierung →
Entscheidung → Produktspezifikation → Design → Build-Prompt
```

- Produktspezifikation **nur nach Validierung und Freigabe**.
- Design-Briefing **nur nach Produktspezifikation und Freigabe**.
- Build-Prompt **nur nach Freigabe**.
- Keine sensiblen Daten im MVP, wenn vermeidbar.

---

## 13. Schreibrechte

Claude darf nach Freigabe in `docs/` und `outputs/` schreiben. Änderungen an `CLAUDE.md`, `.claude/`, App-/Codeordnern oder Git-Operationen (Commit/Push/PR) immer nur nach ausdrücklicher Einzelfreigabe.
