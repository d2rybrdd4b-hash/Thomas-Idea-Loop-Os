from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class Guest:
    gast_id: str
    nachname: str
    vorname: str
    zimmernummer: str
    zimmerkategorie: str
    tagesrate: float
    check_in: date
    check_out: date
    verbleibende_naechte: int
    gast_typ: str
    anzahl_personen: int
    kinder_unter_12: int = 0
    besonderer_anlass: str = ""
    praeferenzen: str = ""
    gruppen_id: str = ""
    vip: bool = False
    wiederholungs_besuche: int = 0
    bemerkungen: str = ""
    mobilitaet: str = ""

    # Filled by scorer / assigner
    prioritaet_score: float = 0.0
    zugewiesene_zone: str = ""
    zugewiesener_tisch: str = ""

    @property
    def hat_kinder(self) -> bool:
        return self.kinder_unter_12 > 0

    @property
    def braucht_familienzone(self) -> bool:
        return self.hat_kinder or self.gast_typ == "Familie"

    @property
    def braucht_barrierefreiheit(self) -> bool:
        return bool(self.mobilitaet)

    @property
    def anzeige_name(self) -> str:
        return f"{self.nachname}, {self.vorname[:1]}."
