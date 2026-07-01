# CLAUDE.md — hotel-seat-intelligence

Projektspezifische Regeln für die App `standalone.html`. Gilt zusätzlich zur übergeordneten `CLAUDE.md` im Repo-Root.

## Deployment — WICHTIG: Live-Branch ist NICHT `main`

- Die Live-App des Hotels läuft über GitHub Pages **vom Branch `claude/clario-premium-v3-hqr0fs`**.
  Das ist der Branch, den GitHub Pages für dieses Repo ausliefert. **Nur** was auf diesem
  Branch liegt, sieht der Hotelier.
- **Ein Push nur nach `main` ändert NICHTS an der Live-Seite** — das war am 2026-07-01 die Ursache
  dafür, dass mehrere Versionen (ah/ai/aj) nicht live ankamen, obwohl sie in `main` waren.
- Historischer Hintergrund: In diesem Repo liegen zwei verschiedene Apps (Hotel-Seat-Intelligence
  und die Clario-App). GitHub Pages kann pro Repo nur **einen** Branch ausliefern; darum teilen
  sich beide Apps zwangsläufig diesen Deploy-Branch. Der Branch-Name (`clario…`) ist deshalb
  irreführend, ist aber der tatsächliche Live-Branch. Künftige Projekte sollen ein **eigenes Repo**
  bekommen, damit sich Apps nicht mehr einen Branch teilen.
- Arbeits-/Referenz-Branch für die Hotel-App: `main` (dort wird gepflegt, dann auf den Live-Branch
  vorgezogen).
- Live-URL der App, die der Hotelier nutzt:
  https://d2rybrdd4b-hash.github.io/Thomas-Idea-Loop-Os/hotel-seat-intelligence/standalone.html

## Standing-Freigabe: freigegebene Änderungen IMMER auf BEIDE Branches pushen

Thomas hat am 2026-06-23 festgelegt, dass jede freigegebene Code-Änderung automatisch live gehen
soll. Am 2026-07-01 präzisiert, weil `main` **nicht** der Deploy-Branch ist:

- **Jede freigegebene Änderung an `standalone.html` (bzw. `sw.js`) wird an BEIDE Branches gepusht:**
  1. `main` (Arbeits-/Referenzstand)
  2. `claude/clario-premium-v3-hqr0fs` (Live-Deploy-Branch)
- So ist die Live-Seite immer aktuell, egal welchen Branch Pages nutzt.
- Der Push auf den Live-Branch ist in der Regel ein **Fast-Forward** von `main` aus
  (`git push origin main:claude/clario-premium-v3-hqr0fs`) — es werden dabei **nur** die
  Hotel-Dateien unter `hotel-seat-intelligence/` verändert, die Clario-App bleibt unberührt.
- Die normale Freigabe für die Code-Änderung selbst (Kontrollfrage gemäß Oberste Regel) gilt
  weiterhin — der zusätzliche Schritt "auf beide Branches pushen" braucht danach **keine
  separate Einzelfreigabe mehr**.
- Bei jeder Version die Cache-Version in `sw.js` erhöhen, damit der Service Worker die neue
  Version wirklich zieht.

## Pflicht nach jedem Live-Push

Sobald eine Änderung erfolgreich auf den Live-Branch gepusht wurde, **immer** die obige Live-URL
erneut mitteilen, damit klar ist:
1. dass die Änderung jetzt deploybar/live ist (GitHub Pages braucht ca. 1–2 Min. zum Bauen),
2. unter welchem Link die aktuelle Version geprüft werden kann,
3. dass ggf. ein Hard-Reload (Cache umgehen) nötig ist, um die neue Version zu sehen — wegen des
   Service Workers manchmal **zweimal** neu laden.
