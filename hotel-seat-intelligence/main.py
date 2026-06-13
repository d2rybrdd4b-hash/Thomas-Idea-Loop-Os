#!/usr/bin/env python3
"""
Hotel Seat Intelligence
Aufruf: python main.py                      → GUI
Aufruf: python main.py gaeste.csv tische.csv [output.html]  → CLI
"""
import sys
import os

# Ensure imports work from project root
sys.path.insert(0, os.path.dirname(__file__))

from data_io.csv_reader import read_guests, read_tables
from algorithms.priority_scorer import PriorityScorer
from algorithms.seat_assigner import SeatAssigner
from data_io.report_writer import write_html_report, write_daily_csv


def cli(guests_csv: str, tables_csv: str, output: str = "tagesplan.html"):
    print("Hotel Seat Intelligence — Tages-Zuweisung")
    print("=" * 46)

    guests = read_guests(guests_csv)
    tables = read_tables(tables_csv)
    print(f"Geladen: {len(guests)} Gäste, {len(tables)} Tische")

    guests = PriorityScorer().score_all(guests)

    guests, warnings = SeatAssigner().assign(guests, tables)

    n = sum(1 for g in guests if g.zugewiesener_tisch)
    print(f"Zugewiesen: {n}/{len(guests)} Gäste")

    if warnings:
        print(f"\n{len(warnings)} Hinweis(e):")
        for w in warnings:
            print(f"  {w}")

    write_html_report(guests, tables, warnings, output)
    print(f"\n→ Report: {output}")

    csv_out = output.replace(".html", ".csv")
    write_daily_csv(guests, csv_out)
    print(f"→ CSV:    {csv_out}")


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        cli(
            sys.argv[1],
            sys.argv[2],
            sys.argv[3] if len(sys.argv) > 3 else "tagesplan.html",
        )
    else:
        import tkinter as tk
        from ui.app import HotelSeatApp
        root = tk.Tk()
        HotelSeatApp(root)
        root.mainloop()
