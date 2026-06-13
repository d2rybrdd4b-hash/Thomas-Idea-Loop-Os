import numpy as np
from typing import List

from models.guest import Guest
from config import ScoringConfig, GASTTYP_PUNKTE, DEFAULT_CONFIG


class PriorityScorer:
    def __init__(self, config: ScoringConfig = DEFAULT_CONFIG):
        self.config = config

    def score_all(self, guests: List[Guest]) -> List[Guest]:
        if not guests:
            return guests
        rates = [g.tagesrate for g in guests]
        rate_threshold = float(np.percentile(rates, self.config.rate_top_percentile))
        for guest in guests:
            guest.prioritaet_score = self._calculate(guest, rate_threshold)
        return sorted(guests, key=lambda g: g.prioritaet_score, reverse=True)

    def _calculate(self, guest: Guest, rate_threshold: float) -> float:
        return round(
            self._score_finanziell(guest, rate_threshold)
            + self._score_aufenthalt(guest)
            + self._score_gasttyp(guest)
            + self._score_anlass(guest)
            + self._score_praeferenz(guest),
            1,
        )

    def _score_finanziell(self, guest: Guest, rate_threshold: float) -> float:
        rate_ratio = min(guest.tagesrate / max(rate_threshold, 1), 1.0)
        kategorie_ratio = {
            "Presidential": 1.0,
            "Suite": 0.9,
            "Deluxe": 0.75,
            "Superior": 0.6,
            "Standard": 0.4,
        }.get(guest.zimmerkategorie, 0.5)
        combined = rate_ratio * 0.7 + kategorie_ratio * 0.3
        return round(combined * self.config.max_finanziell, 1)

    def _score_aufenthalt(self, guest: Guest) -> float:
        ratio = min(guest.verbleibende_naechte / 14.0, 1.0)
        return round(ratio * self.config.max_aufenthalt, 1)

    def _score_gasttyp(self, guest: Guest) -> float:
        punkte = GASTTYP_PUNKTE.get(guest.gast_typ, 5)
        if guest.wiederholungs_besuche >= 5:
            punkte = min(punkte + 3, self.config.max_gasttyp)
        elif guest.wiederholungs_besuche >= 2:
            punkte = min(punkte + 1, self.config.max_gasttyp)
        return float(punkte)

    def _score_anlass(self, guest: Guest) -> float:
        if not guest.besonderer_anlass:
            return 0.0
        mapping = {
            "Hochzeitstag": 15,
            "Honeymoon": 15,
            "Geburtstag": 12,
            "Jubilaeum": 12,
            "Abschluss": 8,
            "Sonstiges": 5,
        }
        return float(mapping.get(guest.besonderer_anlass, 5))

    def _score_praeferenz(self, guest: Guest) -> float:
        if not guest.praeferenzen:
            return 0.0
        return float(self.config.max_praeferenz * 0.5)
