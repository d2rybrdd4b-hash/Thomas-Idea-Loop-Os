import csv
from datetime import datetime
from typing import List

from models.guest import Guest
from models.table import Table

DATE_FORMAT = "%Y-%m-%d"


def _bool(val: str) -> bool:
    return val.strip().lower() in ("ja", "yes", "1", "true")


def _int(val: str, default: int = 0) -> int:
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return default


def read_guests(filepath: str) -> List[Guest]:
    guests = []
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for i, row in enumerate(reader, 2):
            try:
                guests.append(
                    Guest(
                        gast_id=row["GastID"].strip(),
                        nachname=row["Nachname"].strip(),
                        vorname=row["Vorname"].strip(),
                        zimmernummer=row.get("Zimmernummer", "").strip(),
                        zimmerkategorie=row.get("Zimmerkategorie", "Standard").strip(),
                        tagesrate=float(
                            row.get("Tagesrate", "0").replace(",", ".")
                        ),
                        check_in=datetime.strptime(
                            row.get("CheckIn", "2026-01-01").strip(), DATE_FORMAT
                        ).date(),
                        check_out=datetime.strptime(
                            row.get("CheckOut", "2026-01-02").strip(), DATE_FORMAT
                        ).date(),
                        verbleibende_naechte=_int(row.get("VerbleibendeNaechte", "1"), 1),
                        gast_typ=row.get("GastTyp", "Einzelgast").strip(),
                        anzahl_personen=_int(row.get("AnzahlPersonen", "1"), 1),
                        kinder_unter_12=_int(row.get("KinderUnter12", "0")),
                        besonderer_anlass=row.get("BesondererAnlass", "").strip(),
                        praeferenzen=row.get("Praeferenzen", "").strip(),
                        gruppen_id=row.get("GruppenID", "").strip(),
                        vip=_bool(row.get("VIP", "")),
                        wiederholungs_besuche=_int(row.get("WiederholungsBesuche", "0")),
                        bemerkungen=row.get("Bemerkungen", "").strip(),
                        mobilitaet=row.get("Mobilitaet", "").strip(),
                    )
                )
            except (KeyError, ValueError) as e:
                print(f"  Zeile {i} übersprungen: {e}")
    return guests


def read_tables(filepath: str) -> List[Table]:
    tables = []
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        for i, row in enumerate(reader, 2):
            try:
                tables.append(
                    Table(
                        tisch_id=row["TischID"].strip(),
                        zone=row["Zone"].strip(),
                        kapazitaet=int(row.get("Kapazitaet", "2")),
                        fensterlage=_bool(row.get("Fensterlage", "")),
                        ruhig=_bool(row.get("Ruhig", "")),
                        familie_geeignet=_bool(row.get("FamilieGeeignet", "")),
                        steckdose=_bool(row.get("Steckdose", "")),
                        barrierefrei=_bool(row.get("Barrierefrei", "")),
                        beschreibung=row.get("Beschreibung", "").strip(),
                        aktiv=_bool(row.get("Aktiv", "Ja")),
                        x_pos=float(row.get("X", "50").replace(",", ".")),
                        y_pos=float(row.get("Y", "50").replace(",", ".")),
                    )
                )
            except (KeyError, ValueError) as e:
                print(f"  Tisch Zeile {i} übersprungen: {e}")
    return tables
