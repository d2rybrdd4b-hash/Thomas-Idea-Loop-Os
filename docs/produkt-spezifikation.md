# Produktspezifikation: Hotel Seat Intelligence

**Version:** 1.0  
**Datum:** 2026-06-11  
**Status:** Validierungsbereit  
**Bewertung:** 82/100 Punkte (Grün)

---

## Ziel

Ein lokales Desktop-Programm für Hoteliers, das täglich automatisch die optimale Tischzuweisung im Restaurant berechnet — basierend auf Gäste-Prioritätsscore, Zonenlogik und PMS-CSV-Import. Kein Login, keine Cloud, keine Komplexität.

---

## Nutzerrollen

| Rolle | Aufgabe |
|---|---|
| Hotelier / Restaurantleiter | Startet täglichen Lauf, prüft Grundriss, druckt Tagesplan |
| Rezeption | Exportiert CSV aus PMS (einmalige Einrichtung) |
| Servicepersonal | Liest Tagesplan ab — kein eigener Systemzugang nötig |

---

## Kernfunktionen

### 1. CSV-Import
- Gäste-CSV aus Hotel-PMS (Semicolon, UTF-8-BOM)
- Tische-CSV mit Grundriss-Koordinaten (einmalig konfigurieren)
- Robustes Parsing (Komma/Punkt als Dezimaltrenner, fehlende Felder tolerant)

### 2. Prioritäts-Algorithmus (5 Blöcke, 0–100 Punkte)

**Block 1 — Finanzieller Wert (0–30 Punkte)**
- Tagesrate relativ zum Percentile-Durchschnitt aller anwesenden Gäste
- Zimmerkategorie-Bonus (Presidential > Suite > Deluxe > Superior > Standard)
- Gewichtung: 70% Rate / 30% Kategorie

**Block 2 — Aufenthaltsdauer (0–20 Punkte)**
- Verbleibende Nächte normiert auf 14 Tage
- Längerer Aufenthalt = höhere Loyalitätschance = höhere Priorität

**Block 3 — Gasttyp (0–25 Punkte)**

| Gasttyp | Punkte |
|---|---|
| Honeymoon | 25 |
| Geburtstag / Jubiläum | 22 |
| VIP | 20 |
| Stammgast (2+ Besuche) | 15 + Bonus |
| Familie | 12 |
| Einzelgast | 8 |
| Gruppe | 6 |

**Block 4 — Besonderer Anlass (0–15 Punkte)**

| Anlass | Punkte |
|---|---|
| Hochzeitstag / Honeymoon | 15 |
| Geburtstag / Jubiläum | 12 |
| Abschluss | 8 |
| Sonstiges | 5 |

**Block 5 — Präferenzen (0–10 Punkte)**
- Angabe vorhanden = 5 Basispunkte; Matching bei Tischauswahl

### 3. Zonen-Logik

| Zone | Beschreibung | Score-Schwelle |
|---|---|---|
| A | Premium / Fenster | ≥ 85 |
| B | Standard-Plus | 70–84 |
| C | Standard | < 70 |
| F | Familie | Override — immer wenn Kinder < 12 |
| Q | Ruhig | Override — auf Präferenz-Anfrage |

Barrierefreiheit wird vor Score-Logik geprüft (harter Override).

### 4. Visueller Grundriss (tkinter GUI)
- Farbkodierte Tisch-Rechtecke nach Zone
- Gästename + Prioritätsscore bei belegten Tischen
- Echtzeit-Update nach Zuweisung

### 5. HTML-Report-Export
- Visueller Grundriss als eingebettetes SVG
- Prioritätsliste aller Gäste (sortiert nach Score)
- Hinweise / Warnungen bei Engpässen
- Druckoptimiert

---

## Nicht-Funktionen (bewusst ausgeschlossen im MVP)

- Kein Backend, kein Server, keine Datenbank
- Kein Login, keine Benutzerrechte
- Keine Cloud-Synchronisation
- Keine Echtzeit-PMS-Integration (CSV reicht für MVP-Test)
- Keine automatische PDF-Erstellung (HTML drucken reicht)
- Kein Multi-Restaurant-Betrieb

---

## MVP-Scope

```
Woche 1: Excel-Version → manueller Test mit echten PMS-Daten
Woche 2: Python-MVP lokal beim Testhotelier → Feedback
Woche 3: Zahlungsbereitschaft testen (Schein-Rechnung 99€)
```

---

## Datenmodell

### Gast (Guest)
```
gast_id, nachname, vorname, zimmernummer, zimmerkategorie,
tagesrate, check_in, check_out, verbleibende_naechte,
gast_typ, anzahl_personen, kinder_unter_12,
besonderer_anlass, praeferenzen, gruppen_id,
vip, wiederholungs_besuche, bemerkungen, mobilitaet,
[berechnete Felder:] prioritaet_score, zugewiesene_zone, zugewiesener_tisch
```

### Tisch (Table)
```
tisch_id, zone, kapazitaet, fensterlage, ruhig,
familie_geeignet, steckdose, barrierefrei,
beschreibung, aktiv,
x_pos, y_pos  ← Grundriss-Koordinaten (0–100%)
```

---

## CSV-Import-Schema

### Gäste-CSV (Semicolon-getrennt, UTF-8-BOM)
```
GastID;Nachname;Vorname;Zimmernummer;Zimmerkategorie;Tagesrate;
CheckIn;CheckOut;VerbleibendeNaechte;GastTyp;AnzahlPersonen;
KinderUnter12;BesondererAnlass;Praeferenzen;GruppenID;VIP;
WiederholungsBesuche;Bemerkungen;Mobilitaet
```

### Tische-CSV
```
TischID;Zone;Kapazitaet;Fensterlage;Ruhig;FamilieGeeignet;
Steckdose;Barrierefrei;Beschreibung;Aktiv;X;Y
```

---

## Datenschutz

- Alle Daten lokal (kein Cloud-Sync, kein Internet)
- Keine Weitergabe an Dritte
- DSGVO: reine interne Verarbeitungshilfe
- Keine biometrischen, medizinischen oder Finanzdaten als Kern
- Keine persistente Datenhaltung (täglich neu geladen)

---

## Technischer Stack

| Komponente | Technologie |
|---|---|
| Sprache | Python 3.10+ |
| GUI | tkinter (Standard-Bibliothek) |
| Daten | CSV |
| Visualisierung (App) | tkinter Canvas |
| Visualisierung (Export) | HTML + eingebettetes SVG |
| Numerik | pandas, numpy |

---

## Konkurrenz

| Anbieter | Preis/Monat | Schwäche für kleine Hotels |
|---|---|---|
| SevenRooms | ~500–2.000 € | Zu teuer, zu komplex |
| OpenTable | 39–449 € | Kein Prioritätssystem, Cloud-only |
| ResDiary | 99–299 € | Kein PMS-Link, kein Zonenalgorithmus |

**Lücke:** Kein Produkt unter 300€/Monat bietet automatische Gäste-Priorität mit PMS-CSV-Import für kleine Luxushotels.

---

## Umsatzszenarien (Schätzung)

*Das ist eine Schätzung, keine belastbare Prognose. Belastbar wird sie erst nach echtem Kundentest.*

| Szenario | Preis/Monat | Kunden | Monatsumsatz | Jahresumsatz |
|---|---|---|---|---|
| Konservativ | 99 € | 10 | 990 € | ~11.880 € |
| Realistisch | 149 € | 30 | 4.470 € | ~53.640 € |
| Optimistisch | 199 € | 80 | 15.920 € | ~191.040 € |

Nicht belastbar: Zahlungsbereitschaft ist Annahme, kein Kundentest erfolgt.

---

## Offene Fragen

- Welches PMS nutzt das Testhotel? (Protel, Fidelio, Mews, Apaleo?)
- Wie viele Tische hat das Testrestaurant?
- Gibt es bereits eine Zonenlogik im Betrieb?
- Würde Hotelier 99€ oder 149€ zahlen — und wofür genau?
