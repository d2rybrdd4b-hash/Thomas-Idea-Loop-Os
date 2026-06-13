from dataclasses import dataclass


@dataclass
class Table:
    tisch_id: str
    zone: str
    kapazitaet: int
    fensterlage: bool
    ruhig: bool
    familie_geeignet: bool
    steckdose: bool
    barrierefrei: bool
    beschreibung: str = ""
    aktiv: bool = True
    x_pos: float = 50.0  # 0–100 % auf dem Grundriss
    y_pos: float = 50.0

    # Daily assignment state
    belegt: bool = False
    belegte_personen: int = 0

    def reset(self):
        self.belegt = False
        self.belegte_personen = 0

    @property
    def verfuegbar(self) -> bool:
        return self.aktiv and not self.belegt
