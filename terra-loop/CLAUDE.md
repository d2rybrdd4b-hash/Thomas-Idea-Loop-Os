# CLAUDE.md — Terra Loop

Regelwerk für dieses Repository. Gilt für jede Claude-Code-Session (Modell: Fable 5 oder neuer).

## 1. Freigabe-Regel

Vor jeder Änderung an Dateien, Datenbank oder Deployment nennt Claude kurz:
**Was, warum, Risiko, rückgängig machbar?** — und wartet auf ein **JA**.
Ausnahme: Thomas hat die Aufgabe in derselben Session bereits ausdrücklich beauftragt; dann wird gearbeitet und am Ende sauber berichtet. Git-Push nur auf Arbeits-Branches, nie direkt auf `main` ohne Freigabe.

## 2. Produktziel

Terra Loop ist eine Pflanzen-App mit eigener Datenbank (Pflanzen, Bilder, Pflegedaten), die als Produkt **verkaufbar** sein soll. Jede Entscheidung wird daran gemessen:
1. Bringt es das Produkt näher an „verkaufbar"? (funktioniert zuverlässig, verständlich, DSGVO-sauber, bezahlbar betreibbar)
2. Ist es die **einfachste** Lösung, die dafür reicht?

## 3. Technik-Leitplanken

- **Frontend:** eine PWA (HTML/CSS/JS), wie Thomas' bisherige Apps. Kein Framework-Zwang; wenn ein Build-Schritt nötig wird, muss er in einem Satz begründet sein.
- **Datenbank/Backend:** Supabase (PostgreSQL + Storage + Auth) gemäß `db/schema.sql` und `docs/backend.md`. Keine eigene Server-Wartung.
- **Bilder:** immer verkleinert/komprimiert hochladen (max. Kantenlänge ~1600 px), Originale nicht ungefragt speichern.
- **Offline zuerst:** die App muss ohne Netz lesbar bleiben (lokaler Cache), Sync wenn online.
- **Keine sensiblen Daten:** keine Gesundheits-, Kinder-, Finanz- oder Standortdaten als Kern. Nur E-Mail für Login.
- Versionsnummer sichtbar in der App, Änderungen in `CHANGELOG.md`.

## 4. Arbeitsweise

- Fakten / Annahmen / Schätzungen / Meinungen trennen. Ohne Beleg: „Das ist aktuell nicht belastbar."
- Erst kleinster funktionierender Stand, dann erweitern. Kein Feature ohne Nutzen für zahlende Nutzer.
- Jede Session beginnt mit Blick in `docs/produkt-analyse.md` (offene Punkte) und endet mit deren Aktualisierung.
- Deutsch als Arbeits- und UI-Sprache; Englisch nur, wenn beauftragt.

## 5. Verkaufsreife-Checkliste (Definition von „fertig")

- [ ] Kernfunktionen fehlerfrei auf Handy und Desktop
- [ ] Login + Datentrennung pro Nutzer funktioniert
- [ ] Bilder-Upload, -Anzeige, -Löschen funktioniert
- [ ] Datenexport für Nutzer (DSGVO) vorhanden
- [ ] Impressum + Datenschutzerklärung eingebunden
- [ ] Preis/Bezahlmodell entschieden und technisch umgesetzt
- [ ] 7–14-Tage-Test mit echten Nutzern bestanden
