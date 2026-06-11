from typing import List, Tuple

from models.guest import Guest
from models.table import Table
from config import ZONE_SCHWELLEN


class SeatAssigner:

    def assign(
        self, guests: List[Guest], tables: List[Table]
    ) -> Tuple[List[Guest], List[str]]:
        warnings: List[str] = []
        active = [t for t in tables if t.aktiv]

        # Hard overrides first, then by score descending
        families = [g for g in guests if g.braucht_familienzone]
        barrier = [g for g in guests if not g.braucht_familienzone and g.braucht_barrierefreiheit]
        normal = [g for g in guests if not g.braucht_familienzone and not g.braucht_barrierefreiheit]

        for guest in families + barrier + normal:
            zone = self._zone_for(guest)
            table = self._find_table(guest, zone, active)

            if table:
                self._assign(guest, table)
            else:
                fallback = self._find_fallback(guest, active)
                if fallback:
                    warnings.append(
                        f"⚠️  {guest.nachname}: Wunschzone {zone} voll → {fallback.zone}"
                    )
                    self._assign(guest, fallback)
                else:
                    warnings.append(
                        f"🔴 {guest.nachname}: Kein Tisch verfügbar! ({guest.anzahl_personen} Pers.)"
                    )

        return guests, warnings

    def _zone_for(self, guest: Guest) -> str:
        if guest.braucht_familienzone:
            return "F"
        score = guest.prioritaet_score
        if score >= ZONE_SCHWELLEN["A"]:
            return "A"
        if score >= ZONE_SCHWELLEN["B"]:
            return "B"
        return "C"

    def _find_table(self, guest: Guest, zone: str, tables: List[Table]) -> Table:
        candidates = [
            t for t in tables
            if t.verfuegbar
            and t.zone == zone
            and t.kapazitaet >= guest.anzahl_personen
            and (not guest.braucht_barrierefreiheit or t.barrierefrei)
        ]
        if not candidates:
            return None
        return max(candidates, key=lambda t: self._pref_score(guest, t))

    def _find_fallback(self, guest: Guest, tables: List[Table]) -> Table:
        candidates = [
            t for t in tables
            if t.verfuegbar
            and t.kapazitaet >= guest.anzahl_personen
            and (not guest.braucht_barrierefreiheit or t.barrierefrei)
        ]
        return candidates[0] if candidates else None

    def _pref_score(self, guest: Guest, table: Table) -> int:
        score = 0
        prefs = guest.praeferenzen.lower()
        if "fenster" in prefs and table.fensterlage:
            score += 3
        if "ruhig" in prefs and table.ruhig:
            score += 2
        if "steckdose" in prefs and table.steckdose:
            score += 1
        # Prefer tight fit over over-sized table
        score -= abs(table.kapazitaet - guest.anzahl_personen)
        return score

    @staticmethod
    def _assign(guest: Guest, table: Table):
        guest.zugewiesene_zone = table.zone
        guest.zugewiesener_tisch = table.tisch_id
        table.belegt = True
        table.belegte_personen = guest.anzahl_personen
