# CLAUDE.md — hotel-seat-intelligence

Projektspezifische Regeln für die App `standalone.html`. Gilt zusätzlich zur übergeordneten `CLAUDE.md` im Repo-Root.

## Deployment

- Die Live-App des Hotels läuft über GitHub Pages **vom `main`-Branch**, nicht von Feature-/Arbeits-Branches.
- Ein Push auf einen Feature-Branch (z.B. `claude/...`) ändert **nichts** an dem, was der Hotelier sieht.
- Damit eine Code-Änderung beim Hotelier live ankommt, muss sie zwingend nach `main` gemergt und dorthin gepusht werden (nach Freigabe, siehe Oberste Regel der Haupt-`CLAUDE.md`).
- Live-URL der App, die der Hotelier nutzt:
  https://d2rybrdd4b-hash.github.io/Thomas-Idea-Loop-Os/hotel-seat-intelligence/standalone.html

## Standing-Freigabe: immer auf main pushen

Thomas hat am 2026-06-23 ausdrücklich festgelegt: **jede freigegebene Code-Änderung an
`standalone.html` soll automatisch auch nach `main` gemergt/gepusht werden**, damit die
Live-Seite immer den aktuellen Stand zeigt. Die normale Freigabe für die Code-Änderung
selbst (Kontrollfrage gemäß Oberste Regel) gilt weiterhin — der zusätzliche Schritt
"nach main pushen" braucht danach **keine separate Einzelfreigabe mehr**.

## Pflicht nach jedem Merge nach `main`

Sobald eine Änderung erfolgreich nach `main` gepusht wurde, **immer** die obige Live-URL erneut mitteilen, damit klar ist:
1. dass die Änderung jetzt deploybar/live ist (GitHub Pages braucht ca. 1–2 Min. zum Bauen),
2. unter welchem Link die aktuelle Version geprüft werden kann,
3. dass ggf. ein Hard-Reload (Cache umgehen) nötig ist, um die neue Version zu sehen.
