from dataclasses import dataclass

@dataclass
class ScoringConfig:
    max_finanziell: int = 30
    max_aufenthalt: int = 20
    max_gasttyp: int = 25
    max_anlass: int = 15
    max_praeferenz: int = 10
    rate_top_percentile: float = 75.0

GASTTYP_PUNKTE = {
    "Honeymoon": 25,
    "Geburtstag": 22,
    "Jubilaeum": 22,
    "VIP": 20,
    "Stammgast": 15,
    "Familie": 12,
    "Einzelgast": 8,
    "Gruppe": 6,
}

ZONE_SCHWELLEN = {
    "A": 85,
    "B": 70,
    "C": 0,
}

ZONE_COLORS = {
    "A": "#FFD700",
    "B": "#90EE90",
    "C": "#D3D3D3",
    "F": "#87CEEB",
    "Q": "#DDA0DD",
}

ZONE_LABELS = {
    "A": "Premium / Fenster",
    "B": "Standard-Plus",
    "C": "Standard",
    "F": "Familie",
    "Q": "Ruhig",
}

DEFAULT_CONFIG = ScoringConfig()
