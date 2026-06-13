import os
import sys
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from models.guest import Guest
from models.table import Table
from algorithms.priority_scorer import PriorityScorer
from algorithms.seat_assigner import SeatAssigner
from data_io.csv_reader import read_guests, read_tables
from data_io.report_writer import write_html_report, write_daily_csv
from config import ZONE_COLORS, ZONE_LABELS

# ─── Color palette ───────────────────────────────────────────────────────────
BG_DARK = "#1A252F"
BG_MID = "#2C3E50"
BG_PANEL = "#34495E"
ACCENT = "#2980B9"
GREEN = "#27AE60"
PURPLE = "#8E44AD"
TEXT_LIGHT = "#ECF0F1"
TEXT_DIM = "#BDC3C7"
FLOOR_BG = "#F9F5EA"


class HotelSeatApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Hotel Seat Intelligence")
        self.root.geometry("1320x840")
        self.root.configure(bg=BG_DARK)
        self.root.minsize(900, 600)

        self.guests: list[Guest] = []
        self.tables: list[Table] = []
        self.warnings: list[str] = []
        self.assigned = False

        self._setup_styles()
        self._build_header()
        self._build_main()

    # ─── Layout ──────────────────────────────────────────────────────────────

    def _build_header(self):
        hdr = tk.Frame(self.root, bg=BG_DARK, height=56)
        hdr.pack(fill="x", side="top")
        hdr.pack_propagate(False)
        tk.Label(
            hdr, text="🏨  Hotel Seat Intelligence",
            font=("Helvetica", 17, "bold"), fg=TEXT_LIGHT, bg=BG_DARK,
        ).pack(side="left", padx=22, pady=14)
        self._date_label = tk.Label(
            hdr, text=f"Datum: {date.today().strftime('%d.%m.%Y')}",
            font=("Helvetica", 11), fg=TEXT_DIM, bg=BG_DARK,
        )
        self._date_label.pack(side="right", padx=22)

    def _build_main(self):
        frame = tk.Frame(self.root, bg=BG_MID)
        frame.pack(fill="both", expand=True, padx=8, pady=8)
        self._build_left(frame)
        self._build_floor_plan(frame)
        self._build_right(frame)

    def _build_left(self, parent):
        panel = tk.Frame(parent, bg=BG_PANEL, width=230)
        panel.pack(side="left", fill="y", padx=(0, 6))
        panel.pack_propagate(False)

        self._section(panel, "IMPORT")
        btn_cfg = dict(font=("Helvetica", 10), relief="flat", cursor="hand2",
                       pady=7, padx=10, anchor="w")
        self._btn_guests = tk.Button(
            panel, text="📋  Gäste-CSV laden",
            bg=ACCENT, fg="white", command=self._import_guests, **btn_cfg)
        self._btn_guests.pack(fill="x", padx=12, pady=3)

        self._btn_tables = tk.Button(
            panel, text="🗺  Tische-CSV laden",
            bg=ACCENT, fg="white", command=self._import_tables, **btn_cfg)
        self._btn_tables.pack(fill="x", padx=12, pady=3)

        self._sep(panel)

        self._btn_run = tk.Button(
            panel, text="▶  Zuweisung berechnen",
            bg=GREEN, fg="white", command=self._run,
            state="disabled", **btn_cfg)
        self._btn_run.pack(fill="x", padx=12, pady=3)

        self._btn_export_html = tk.Button(
            panel, text="🌐  HTML-Report öffnen",
            bg=PURPLE, fg="white", command=self._export_html,
            state="disabled", **btn_cfg)
        self._btn_export_html.pack(fill="x", padx=12, pady=3)

        self._btn_export_csv = tk.Button(
            panel, text="💾  CSV-Export",
            bg="#7F8C8D", fg="white", command=self._export_csv,
            state="disabled", **btn_cfg)
        self._btn_export_csv.pack(fill="x", padx=12, pady=3)

        self._sep(panel)
        self._section(panel, "STATISTIK")

        self._stat_frame = tk.Frame(panel, bg=BG_PANEL)
        self._stat_frame.pack(fill="x", padx=12, pady=4)
        self.sv_guests = self._stat_row("Gäste:", "0")
        self.sv_tables = self._stat_row("Tische:", "0")
        self.sv_assigned = self._stat_row("Zugewiesen:", "—")
        self.sv_fill = self._stat_row("Auslastung:", "—")

        self._sep(panel)
        self._section(panel, "ZONEN")
        leg = tk.Frame(panel, bg=BG_PANEL)
        leg.pack(fill="x", padx=12, pady=4)
        for zone, color in ZONE_COLORS.items():
            row = tk.Frame(leg, bg=BG_PANEL)
            row.pack(fill="x", pady=2)
            tk.Canvas(row, width=14, height=14, bg=color,
                      highlightbackground="#777", highlightthickness=1
                      ).pack(side="left")
            tk.Label(row, text=f"  Zone {zone} — {ZONE_LABELS[zone]}",
                     font=("Helvetica", 8), fg=TEXT_LIGHT, bg=BG_PANEL,
                     ).pack(side="left")

        self._sep(panel)
        self._section(panel, "HINWEISE")
        self._warn_box = tk.Text(
            panel, height=7, bg=BG_MID, fg="#E74C3C",
            font=("Courier", 8), relief="flat", state="disabled", wrap="word")
        self._warn_box.pack(fill="x", padx=12, pady=4)

    def _build_floor_plan(self, parent):
        center = tk.Frame(parent, bg=BG_MID)
        center.pack(side="left", fill="both", expand=True)

        tk.Label(center, text="GRUNDRISS — RESTAURANT",
                 font=("Helvetica", 10, "bold"), fg=TEXT_DIM, bg=BG_MID,
                 ).pack(pady=(2, 4))

        self.canvas = tk.Canvas(center, bg=FLOOR_BG, highlightthickness=0)
        self.canvas.pack(fill="both", expand=True, padx=2, pady=2)
        self.canvas.bind("<Configure>", lambda e: self._redraw())

    def _build_right(self, parent):
        panel = tk.Frame(parent, bg=BG_PANEL, width=270)
        panel.pack(side="right", fill="y", padx=(6, 0))
        panel.pack_propagate(False)

        self._section(panel, "PRIORITÄTSLISTE")

        cols = ("Score", "Name", "Zone", "Tisch")
        self._tree = ttk.Treeview(panel, columns=cols, show="headings", height=36)

        sty = ttk.Style()
        sty.theme_use("clam")
        sty.configure("Treeview", background=BG_MID, fieldbackground=BG_MID,
                       foreground=TEXT_LIGHT, rowheight=22, font=("Helvetica", 9))
        sty.configure("Treeview.Heading", background=BG_DARK,
                       foreground=TEXT_DIM, font=("Helvetica", 8, "bold"))
        sty.map("Treeview", background=[("selected", ACCENT)])

        self._tree.heading("Score", text="Score")
        self._tree.heading("Name", text="Name")
        self._tree.heading("Zone", text="Zone")
        self._tree.heading("Tisch", text="Tisch")
        self._tree.column("Score", width=46, anchor="center")
        self._tree.column("Name", width=118)
        self._tree.column("Zone", width=42, anchor="center")
        self._tree.column("Tisch", width=48, anchor="center")

        sb = ttk.Scrollbar(panel, orient="vertical", command=self._tree.yview)
        self._tree.configure(yscrollcommand=sb.set)
        self._tree.pack(side="left", fill="both", expand=True, padx=(12, 0), pady=6)
        sb.pack(side="right", fill="y", pady=6)

    # ─── Helpers ─────────────────────────────────────────────────────────────

    def _section(self, parent, text):
        tk.Label(parent, text=text, font=("Helvetica", 8, "bold"),
                 fg=TEXT_DIM, bg=BG_PANEL).pack(anchor="w", padx=12, pady=(10, 2))

    def _sep(self, parent):
        f = tk.Frame(parent, bg="#4A6278", height=1)
        f.pack(fill="x", padx=12, pady=6)

    def _stat_row(self, label, init):
        frame = tk.Frame(self._stat_frame, bg=BG_PANEL)
        frame.pack(fill="x", pady=1)
        tk.Label(frame, text=label, font=("Helvetica", 8), fg=TEXT_DIM,
                 bg=BG_PANEL, width=13, anchor="w").pack(side="left")
        var = tk.StringVar(value=init)
        tk.Label(frame, textvariable=var, font=("Helvetica", 8, "bold"),
                 fg=TEXT_LIGHT, bg=BG_PANEL).pack(side="left")
        return var

    def _setup_styles(self):
        style = ttk.Style(self.root)
        style.theme_use("clam")

    # ─── Actions ─────────────────────────────────────────────────────────────

    def _import_guests(self):
        path = filedialog.askopenfilename(
            title="Gäste-CSV wählen",
            filetypes=[("CSV", "*.csv"), ("Alle", "*.*")])
        if not path:
            return
        try:
            self.guests = read_guests(path)
            self.sv_guests.set(str(len(self.guests)))
            self._check_ready()
            messagebox.showinfo("Import", f"✓ {len(self.guests)} Gäste geladen.")
        except Exception as e:
            messagebox.showerror("Fehler", str(e))

    def _import_tables(self):
        path = filedialog.askopenfilename(
            title="Tische-CSV wählen",
            filetypes=[("CSV", "*.csv"), ("Alle", "*.*")])
        if not path:
            return
        try:
            self.tables = read_tables(path)
            self.sv_tables.set(str(len(self.tables)))
            self._check_ready()
            self._redraw()
            messagebox.showinfo("Import", f"✓ {len(self.tables)} Tische geladen.")
        except Exception as e:
            messagebox.showerror("Fehler", str(e))

    def _check_ready(self):
        if self.guests and self.tables:
            self._btn_run.config(state="normal")

    def _run(self):
        for t in self.tables:
            t.reset()

        scorer = PriorityScorer()
        self.guests = scorer.score_all(self.guests)

        assigner = SeatAssigner()
        self.guests, self.warnings = assigner.assign(self.guests, self.tables)
        self.assigned = True

        n_assigned = sum(1 for g in self.guests if g.zugewiesener_tisch)
        self.sv_assigned.set(str(n_assigned))
        self.sv_fill.set(f"{int(n_assigned / max(len(self.tables), 1) * 100)}%")

        self._update_warn_box()
        self._update_tree()
        self._redraw()
        self._btn_export_html.config(state="normal")
        self._btn_export_csv.config(state="normal")

    def _export_html(self):
        path = filedialog.asksaveasfilename(
            title="HTML speichern", defaultextension=".html",
            filetypes=[("HTML", "*.html"), ("Alle", "*.*")])
        if path:
            try:
                write_html_report(self.guests, self.tables, self.warnings, path)
            except Exception as e:
                messagebox.showerror("Fehler", str(e))

    def _export_csv(self):
        path = filedialog.asksaveasfilename(
            title="CSV speichern", defaultextension=".csv",
            filetypes=[("CSV", "*.csv"), ("Alle", "*.*")])
        if path:
            try:
                write_daily_csv(self.guests, path)
                messagebox.showinfo("Export", f"✓ Gespeichert: {path}")
            except Exception as e:
                messagebox.showerror("Fehler", str(e))

    # ─── Floor plan ──────────────────────────────────────────────────────────

    def _redraw(self):
        self.canvas.delete("all")
        if not self.tables:
            self.canvas.create_text(
                self.canvas.winfo_width() // 2 or 300,
                self.canvas.winfo_height() // 2 or 200,
                text="Tische-CSV laden um Grundriss anzuzeigen",
                fill="#AAA", font=("Helvetica", 12))
            return

        W = self.canvas.winfo_width()
        H = self.canvas.winfo_height()
        if W < 40 or H < 40:
            return

        M = 36
        FW, FH = W - 2 * M, H - 2 * M

        # Floor background
        self.canvas.create_rectangle(M, M, M + FW, M + FH,
                                     fill=FLOOR_BG, outline="#CCC", width=1)

        # Window highlight (left strip)
        self.canvas.create_rectangle(
            M, M, M + FW * 0.18, M + FH,
            fill="#FFF8DC", outline="", stipple="gray25")

        # Zone F corner
        self.canvas.create_rectangle(
            M + FW * 0.72, M + FH * 0.6, M + FW, M + FH,
            fill="#F0F8FF", outline="", stipple="gray25")

        # Labels
        self.canvas.create_text(M + 4, M - 11, text="← Fensterfront",
                                anchor="w", font=("Helvetica", 7), fill="#AAA")
        self.canvas.create_text(M + FW * 0.86, M + FH * 0.63,
                                text="Familie", anchor="nw",
                                font=("Helvetica", 7), fill="#AAA")

        # Guest lookup
        by_table = {g.zugewiesener_tisch: g
                    for g in self.guests if g.zugewiesener_tisch}

        for table in self.tables:
            if not table.aktiv:
                continue
            cx = M + (table.x_pos / 100) * FW
            cy = M + (table.y_pos / 100) * FH
            tw = 52 if table.kapazitaet <= 2 else (64 if table.kapazitaet <= 4 else 76)
            th = 36 if table.kapazitaet <= 2 else (44 if table.kapazitaet <= 4 else 52)
            x1, y1, x2, y2 = cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2

            zone_color = ZONE_COLORS.get(table.zone, "#DDD")
            guest = by_table.get(table.tisch_id)
            fill = zone_color if guest else "#FAFAFA"

            # Rounded rect via polygon
            r = 5
            self.canvas.create_polygon(
                x1 + r, y1, x2 - r, y1, x2, y1 + r, x2, y2 - r,
                x2 - r, y2, x1 + r, y2, x1, y2 - r, x1, y1 + r,
                fill=fill, outline=zone_color, width=2, smooth=True)

            # Table ID
            self.canvas.create_text(
                cx, cy - 9, text=table.tisch_id,
                font=("Helvetica", 7, "bold"), fill="#555")

            if guest:
                name = guest.nachname[:9] + ("…" if len(guest.nachname) > 9 else "")
                self.canvas.create_text(
                    cx, cy + 3, text=name,
                    font=("Helvetica", 7), fill="#1A252F")
                self.canvas.create_text(
                    cx, cy + 14, text=f"★ {guest.prioritaet_score:.0f}",
                    font=("Helvetica", 8, "bold"), fill="#333")
            else:
                seats = "· " * min(table.kapazitaet, 5)
                self.canvas.create_text(
                    cx, cy + 5, text=seats.strip(),
                    font=("Helvetica", 9), fill="#CCC")

            # Feature icons
            icons = ("W " if table.fensterlage else "") + ("♿" if table.barrierefrei else "")
            if icons:
                self.canvas.create_text(
                    x2 - 2, y1 + 8, text=icons.strip(),
                    anchor="ne", font=("Helvetica", 6), fill="#888")

    # ─── Right panel updates ─────────────────────────────────────────────────

    def _update_tree(self):
        for item in self._tree.get_children():
            self._tree.delete(item)

        for g in sorted(self.guests, key=lambda x: x.prioritaet_score, reverse=True):
            zone = g.zugewiesene_zone or "—"
            tisch = g.zugewiesener_tisch or "—"
            tag = f"z_{zone}"
            self._tree.insert("", "end",
                values=(f"{g.prioritaet_score:.0f}", g.anzeige_name, zone, tisch),
                tags=(tag,))

        for zone, color in ZONE_COLORS.items():
            self._tree.tag_configure(f"z_{zone}",
                background=color, foreground="#1A252F")

    def _update_warn_box(self):
        self._warn_box.config(state="normal")
        self._warn_box.delete("1.0", "end")
        if self.warnings:
            self._warn_box.insert("end", "\n".join(self.warnings))
        else:
            self._warn_box.config(fg="#27AE60")
            self._warn_box.insert("end", "✓ Alle Gäste optimal platziert.")
        self._warn_box.config(state="disabled")


def run():
    root = tk.Tk()
    app = HotelSeatApp(root)
    root.mainloop()
