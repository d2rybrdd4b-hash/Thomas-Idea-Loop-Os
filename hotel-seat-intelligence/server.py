#!/usr/bin/env python3
"""
Hotel Seat Intelligence — Flask Server
Aufruf: python server.py
Öffnet automatisch http://localhost:5001 im Browser
"""
import os
import sys
import tempfile
import threading
import webbrowser

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify, render_template, send_file, Response

from models.guest import Guest
from models.table import Table
from algorithms.priority_scorer import PriorityScorer
from algorithms.seat_assigner import SeatAssigner
from data_io.csv_reader import read_guests, read_tables
from data_io.report_writer import write_html_report, write_daily_csv

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB

# ── In-memory state (single user, local app) ──────────────────────────────────
_state: dict = {
    "guests": [],
    "tables": [],
    "warnings": [],
    "assigned": False,
}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/upload/guests", methods=["POST"])
def upload_guests():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "Keine Datei"}), 400
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        f.save(tmp.name)
        guests = read_guests(tmp.name)
    os.unlink(tmp.name)
    _state["guests"] = guests
    _state["assigned"] = False
    return jsonify({
        "count": len(guests),
        "guests": [_g(g) for g in guests],
    })


@app.route("/api/upload/tables", methods=["POST"])
def upload_tables():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "Keine Datei"}), 400
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        f.save(tmp.name)
        tables = read_tables(tmp.name)
    os.unlink(tmp.name)
    _state["tables"] = tables
    _state["assigned"] = False
    return jsonify({
        "count": len(tables),
        "tables": [_t(t) for t in tables],
    })


@app.route("/api/assign", methods=["POST"])
def assign():
    guests = _state["guests"]
    tables = _state["tables"]
    if not guests or not tables:
        return jsonify({"error": "Gäste und Tische zuerst laden"}), 400

    for t in tables:
        t.reset()

    guests = PriorityScorer().score_all(guests)
    guests, warnings = SeatAssigner().assign(guests, tables)

    _state["guests"] = guests
    _state["tables"] = tables
    _state["warnings"] = warnings
    _state["assigned"] = True

    n_assigned = sum(1 for g in guests if g.zugewiesener_tisch)

    return jsonify({
        "guests": [_g(g) for g in guests],
        "tables": [_t(t) for t in tables],
        "warnings": warnings,
        "stats": {
            "total": len(guests),
            "assigned": n_assigned,
            "tables": len(tables),
            "fill_rate": int(n_assigned / max(len(tables), 1) * 100),
        },
    })


@app.route("/api/export/html")
def export_html():
    if not _state["assigned"]:
        return jsonify({"error": "Erst Zuweisung berechnen"}), 400
    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w") as tmp:
        tmp_path = tmp.name

    write_html_report(
        _state["guests"], _state["tables"], _state["warnings"],
        tmp_path, auto_open=False,
    )

    @app.after_request
    def _cleanup(response):
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        return response

    return send_file(tmp_path, as_attachment=True, download_name="tagesplan.html",
                     mimetype="text/html")


@app.route("/api/export/csv")
def export_csv():
    if not _state["assigned"]:
        return jsonify({"error": "Erst Zuweisung berechnen"}), 400
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False, mode="w",
                                     encoding="utf-8-sig") as tmp:
        tmp_path = tmp.name

    write_daily_csv(_state["guests"], tmp_path)
    return send_file(tmp_path, as_attachment=True, download_name="tagesplan.csv",
                     mimetype="text/csv")


# ── Serializers ───────────────────────────────────────────────────────────────

def _g(g: Guest) -> dict:
    return {
        "gast_id": g.gast_id,
        "nachname": g.nachname,
        "vorname": g.vorname,
        "zimmernummer": g.zimmernummer,
        "zimmerkategorie": g.zimmerkategorie,
        "tagesrate": g.tagesrate,
        "gast_typ": g.gast_typ,
        "anzahl_personen": g.anzahl_personen,
        "kinder_unter_12": g.kinder_unter_12,
        "besonderer_anlass": g.besonderer_anlass,
        "praeferenzen": g.praeferenzen,
        "vip": g.vip,
        "wiederholungs_besuche": g.wiederholungs_besuche,
        "prioritaet_score": g.prioritaet_score,
        "zugewiesene_zone": g.zugewiesene_zone,
        "zugewiesener_tisch": g.zugewiesener_tisch,
    }


def _t(t: Table) -> dict:
    return {
        "tisch_id": t.tisch_id,
        "zone": t.zone,
        "kapazitaet": t.kapazitaet,
        "fensterlage": t.fensterlage,
        "ruhig": t.ruhig,
        "familie_geeignet": t.familie_geeignet,
        "steckdose": t.steckdose,
        "barrierefrei": t.barrierefrei,
        "beschreibung": t.beschreibung,
        "aktiv": t.aktiv,
        "x_pos": t.x_pos,
        "y_pos": t.y_pos,
        "belegt": t.belegt,
    }


# ── Startup ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = 5001
    print(f"\n  Hotel Seat Intelligence")
    print(f"  ──────────────────────────────")
    print(f"  Browser öffnet sich automatisch …")
    print(f"  URL: http://localhost:{port}")
    print(f"  Stoppen: Strg+C\n")
    threading.Timer(1.2, lambda: webbrowser.open(f"http://localhost:{port}")).start()
    app.run(debug=False, port=port, use_reloader=False)
