import csv
import webbrowser
from datetime import date
from typing import List

from models.guest import Guest
from models.table import Table
from config import ZONE_COLORS, ZONE_LABELS


def write_html_report(
    guests: List[Guest],
    tables: List[Table],
    warnings: List[str],
    output_path: str,
    auto_open: bool = True,
):
    html = _build_html(guests, tables, warnings)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    if auto_open:
        webbrowser.open(f"file://{output_path}")


def write_daily_csv(guests: List[Guest], output_path: str):
    sorted_g = sorted(guests, key=lambda g: g.prioritaet_score, reverse=True)
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["#", "Nachname", "Vorname", "Zimmer", "Personen",
                    "Score", "Zone", "Tisch", "GastTyp", "Anlass"])
        for i, g in enumerate(sorted_g, 1):
            w.writerow([
                i, g.nachname, g.vorname, g.zimmernummer, g.anzahl_personen,
                f"{g.prioritaet_score:.0f}",
                g.zugewiesene_zone or "—",
                g.zugewiesener_tisch or "—",
                g.gast_typ,
                g.besonderer_anlass or "—",
            ])


# ─── HTML builder ────────────────────────────────────────────────────────────

def _build_html(guests, tables, warnings):
    today = date.today().strftime("%d.%m.%Y")
    assigned = [g for g in guests if g.zugewiesener_tisch]
    fill = int(len(assigned) / max(len(tables), 1) * 100)

    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hotel Seat Intelligence — {today}</title>
<style>
:root{{--gold:#FFD700;--green:#90EE90;--gray:#D3D3D3;--blue:#87CEEB;--plum:#DDA0DD;
      --dark:#1A252F;--mid:#2C3E50;--accent:#2980B9;--bg:#F5F2EC}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'Helvetica Neue',Arial,sans-serif;background:var(--bg);color:var(--dark)}}
header{{background:var(--dark);color:#fff;padding:18px 40px;display:flex;justify-content:space-between;align-items:center}}
header h1{{font-size:1.4rem;font-weight:300;letter-spacing:3px;text-transform:uppercase}}
header .date{{font-size:.85rem;color:#BDC3C7}}
.container{{max-width:1380px;margin:0 auto;padding:28px 20px}}
.stats{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}}
.stat{{background:#fff;border-radius:8px;padding:18px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.07)}}
.stat .val{{font-size:2rem;font-weight:700;color:var(--accent)}}
.stat .lbl{{font-size:.72rem;color:#999;text-transform:uppercase;letter-spacing:1px;margin-top:4px}}
.grid2{{display:grid;grid-template-columns:1fr 340px;gap:18px;margin-bottom:26px}}
.card{{background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.07);overflow:hidden}}
.card-hd{{background:var(--mid);color:#fff;padding:13px 18px;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:1px}}
.card-bd{{padding:18px}}
.fp-wrap{{background:#F9F5EA;border:1px solid #E0DDD0}}
table{{width:100%;border-collapse:collapse}}
th{{background:#F0ECE4;font-size:.7rem;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;color:#666;position:sticky;top:0}}
td{{padding:9px 12px;border-bottom:1px solid #F0ECE4;font-size:.83rem}}
tr:hover td{{background:#FAF8F3}}
.badge{{display:inline-block;padding:2px 9px;border-radius:10px;font-size:.72rem;font-weight:700;color:#1A252F}}
.bar-wrap{{display:flex;align-items:center;gap:7px}}
.bar{{height:5px;border-radius:3px;background:var(--accent);min-width:2px}}
.legend{{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:14px}}
.leg-item{{display:flex;align-items:center;gap:7px;font-size:.82rem}}
.leg-dot{{width:14px;height:14px;border-radius:3px;border:1px solid rgba(0,0,0,.12);flex-shrink:0}}
.warn-wrap{{margin-top:14px}}
.warn{{padding:8px 12px;margin-bottom:5px;font-size:.8rem;border-left:3px solid #FFC107;background:#FFF8E1;border-radius:0 4px 4px 0}}
.warn.crit{{border-color:#E74C3C;background:#FDECEA}}
.ok{{color:#27AE60;font-size:.85rem}}
footer{{text-align:center;padding:18px;color:#AAA;font-size:.72rem;margin-top:10px}}
@media print{{body{{background:#fff}}.no-print{{display:none}}}}
</style>
</head>
<body>
<header>
  <h1>🏨  Hotel Seat Intelligence</h1>
  <div class="date">Tagesplan — {today}</div>
</header>
<div class="container">
  <div class="stats">
    <div class="stat"><div class="val">{len(guests)}</div><div class="lbl">Gäste</div></div>
    <div class="stat"><div class="val">{len(assigned)}</div><div class="lbl">Zugewiesen</div></div>
    <div class="stat"><div class="val">{len(tables)}</div><div class="lbl">Tische</div></div>
    <div class="stat"><div class="val">{fill}%</div><div class="lbl">Auslastung</div></div>
  </div>
  <div class="grid2">
    <div class="card">
      <div class="card-hd">Restaurant — Grundriss</div>
      <div class="fp-wrap">{_svg_floor_plan(guests, tables)}</div>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-hd">Zonen-Legende</div>
        <div class="card-bd">
          <div class="legend">{''.join(f'<div class="leg-item"><div class="leg-dot" style="background:{c}"></div><span>Zone {z} — {ZONE_LABELS[z]}</span></div>' for z, c in ZONE_COLORS.items())}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-hd">Hinweise ({len(warnings)})</div>
        <div class="card-bd">
          {_warnings_html(warnings)}
        </div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-hd">Tischzuweisung — Prioritätsliste</div>
    <div style="overflow-x:auto">
      <table>
        <thead><tr>
          <th>#</th><th>Score</th><th>Gast</th><th>Zimmer</th>
          <th>Typ</th><th>Pers.</th><th>Anlass</th><th>Zone</th><th>Tisch</th>
        </tr></thead>
        <tbody>{_guest_rows(guests)}</tbody>
      </table>
    </div>
  </div>
</div>
<footer>Hotel Seat Intelligence &nbsp;|&nbsp; {today} &nbsp;|&nbsp; Nur für internen Hotelbetrieb</footer>
</body></html>"""


def _svg_floor_plan(guests, tables):
    W, H, M = 800, 480, 38
    fw, fh = W - 2 * M, H - 2 * M
    by_table = {g.zugewiesener_tisch: g for g in guests if g.zugewiesener_tisch}

    parts = [
        f'<svg width="100%" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" style="display:block;max-height:480px">',
        f'<rect width="{W}" height="{H}" fill="#F9F5EA"/>',
        # Window side highlight
        f'<rect x="{M}" y="{M}" width="{fw*0.19:.0f}" height="{fh}" fill="#FFF8DC" opacity="0.6"/>',
        f'<rect x="{M}" y="{M}" width="{fw}" height="{fh}" fill="none" stroke="#CCC" stroke-width="1.5" rx="4"/>',
        f'<text x="{M+6}" y="{M-9}" font-size="9" fill="#999" font-family="Arial">← Fensterfront</text>',
    ]

    for t in tables:
        if not t.aktiv:
            continue
        cx = M + (t.x_pos / 100) * fw
        cy = M + (t.y_pos / 100) * fh
        tw = 52 if t.kapazitaet <= 2 else (64 if t.kapazitaet <= 4 else 76)
        th = 36 if t.kapazitaet <= 2 else (44 if t.kapazitaet <= 4 else 52)
        x1, y1 = cx - tw / 2, cy - th / 2

        guest = by_table.get(t.tisch_id)
        fill = ZONE_COLORS.get(t.zone, "#DDD") if guest else "#FEFEFE"
        stroke = ZONE_COLORS.get(t.zone, "#AAA")

        parts.append(
            f'<rect x="{x1:.1f}" y="{y1:.1f}" width="{tw}" height="{th}" '
            f'rx="6" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'
        )
        parts.append(
            f'<text x="{cx:.1f}" y="{cy - 9:.1f}" text-anchor="middle" '
            f'font-size="8" font-weight="bold" fill="#444" font-family="Arial">{t.tisch_id}</text>'
        )
        if guest:
            name = guest.nachname[:9] + ("…" if len(guest.nachname) > 9 else "")
            parts.append(
                f'<text x="{cx:.1f}" y="{cy + 4:.1f}" text-anchor="middle" '
                f'font-size="7.5" fill="#1A252F" font-family="Arial">{name}</text>'
            )
            parts.append(
                f'<text x="{cx:.1f}" y="{cy + 15:.1f}" text-anchor="middle" '
                f'font-size="8" font-weight="bold" fill="#333" font-family="Arial">'
                f'★ {guest.prioritaet_score:.0f}</text>'
            )
        else:
            seats = "· " * min(t.kapazitaet, 5)
            parts.append(
                f'<text x="{cx:.1f}" y="{cy + 7:.1f}" text-anchor="middle" '
                f'font-size="9" fill="#CCC" font-family="Arial">{seats.strip()}</text>'
            )
        icons = ("W" if t.fensterlage else "") + ("♿" if t.barrierefrei else "")
        if icons:
            parts.append(
                f'<text x="{x1+tw-2:.1f}" y="{y1+10:.1f}" text-anchor="end" '
                f'font-size="7" fill="#888" font-family="Arial">{icons}</text>'
            )

    parts.append("</svg>")
    return "\n".join(parts)


def _guest_rows(guests):
    rows = []
    for i, g in enumerate(
        sorted(guests, key=lambda x: x.prioritaet_score, reverse=True), 1
    ):
        z = g.zugewiesene_zone or "—"
        t = g.zugewiesener_tisch or "—"
        color = ZONE_COLORS.get(z, "#EEE")
        bar_w = min(int(g.prioritaet_score), 100)
        kinder = f" +{g.kinder_unter_12}K" if g.kinder_unter_12 else ""
        anlass = g.besonderer_anlass or "—"
        rows.append(
            f"<tr>"
            f"<td style='color:#BBB'>{i}</td>"
            f"<td><div class='bar-wrap'><div class='bar' style='width:{bar_w}px'></div>"
            f"<b>{g.prioritaet_score:.0f}</b></div></td>"
            f"<td><b>{g.nachname}</b>, {g.vorname}</td>"
            f"<td>{g.zimmernummer}</td>"
            f"<td>{g.gast_typ}</td>"
            f"<td style='text-align:center'>{g.anzahl_personen}{kinder}</td>"
            f"<td>{anlass}</td>"
            f"<td><span class='badge' style='background:{color}'>Zone {z}</span></td>"
            f"<td><b>{t}</b></td>"
            f"</tr>"
        )
    return "\n".join(rows)


def _warnings_html(warnings):
    if not warnings:
        return '<span class="ok">✓ Alle Gäste optimal zugewiesen.</span>'
    items = []
    for w in warnings:
        cls = "warn crit" if "🔴" in w else "warn"
        items.append(f'<div class="{cls}">{w}</div>')
    return "\n".join(items)
