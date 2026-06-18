# SongLingua

Privates Englisch-Sprachlern-Tool, verbunden mit Spotify. Zeigt deinen
aktuell laufenden Song, du fügst einen kurzen Textausschnitt ein, eine KI
(Claude) übersetzt und erklärt ihn. Alles läuft nur in deinem Browser
(localStorage), es gibt keine Datenbank und kein Login außer Spotify.

Diese Anleitung ist für **iPhone + Safari**, ohne Mac, ohne Xcode, ohne
Terminal-Kenntnisse.

---

## Was funktioniert sofort, was braucht einen Key?

| Funktion | Voraussetzung |
|---|---|
| App öffnen, Design, Verlauf | Funktioniert sofort, ohne jeden Key |
| "Mit Spotify verbinden", aktueller Song | Braucht **Spotify Client ID** + Redirect URI |
| Textausschnitt analysieren/übersetzen | Braucht **Claude API Key** (Anthropic) |

Ohne Keys lässt sich die App ansehen, aber Spotify-Login und Übersetzung
zeigen ehrlich "nicht verbunden" bzw. einen Fehler an — keine Fake-Daten.

---

## Schritt 1 — Projekt auf GitHub bringen

Der Code liegt bereits in diesem Repository im Ordner `songlingua/`
(Branch `claude/songlingua-spotify-app-mtexnm`, wird direkt gepusht). Du
musst nichts manuell hochladen. Prüfen kannst du es so:

1. GitHub-App öffnen (oder github.com im Safari-Browser)
2. Dein Repository öffnen
3. Ordner `songlingua/` sollte sichtbar sein

Falls du es irgendwann in ein **eigenes, separates Repository** verschieben
willst, sag einfach Bescheid — das ist eine bewusste spätere Entscheidung.

---

## Schritt 2 — Bei Vercel deployen (empfohlen für Next.js)

Vercel ist die Firma hinter Next.js, der Import-Flow ist auf dem iPhone gut
nutzbar. (Netlify geht alternativ ähnlich, siehe Hinweis unten.)

1. Gehe im Safari-Browser auf **vercel.com**
2. **Sign Up** → **Continue with GitHub** → mit deinem GitHub-Account anmelden und Zugriff erlauben
3. Im Vercel-Dashboard: **Add New…** → **Project**
4. Dein Repository (`...Thomas-Idea-Loop-Os` bzw. dein SongLingua-Repo) auswählen → **Import**
5. Bei **Root Directory** auf **Edit** tippen und `songlingua` eintragen (wichtig, da die App nicht im Repo-Hauptordner liegt!)
6. Framework Preset: Next.js wird automatisch erkannt
7. Bei **Environment Variables** (siehe Schritt 5) — kannst du auch später nachtragen
8. **Deploy** antippen und warten (1–2 Minuten)
9. Du bekommst eine URL wie `https://songlingua-xyz.vercel.app` — das ist deine echte App-URL

**Wichtig:** Diese URL brauchst du gleich für Spotify (Schritt 4) und für
die Umgebungsvariable `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI`.

---

## Schritt 3 — Claude API Key erstellen (console.anthropic.com)

1. Gehe auf **console.anthropic.com**
2. Account erstellen / einloggen
3. Links im Menü: **API Keys** (oder **Get API Keys**)
4. **Create Key** antippen
5. Name vergeben (z.B. "SongLingua"), Key wird einmalig angezeigt
6. **Sofort kopieren und sicher speichern** — er wird danach nicht mehr vollständig angezeigt
7. Du bekommst i.d.R. 5$ Startguthaben. Bei ca. 0,003$ pro Analyse reicht das für ca. 1.500 Analysen

Dieser Key beginnt mit `sk-ant-...` und ist **geheim** — er kommt nur in
die Umgebungsvariablen, niemals in den Code.

---

## Schritt 4 — Spotify Client ID erstellen (developer.spotify.com)

### Genaue Schritte

1. Gehe auf **developer.spotify.com/dashboard**
2. Mit deinem normalen Spotify-Account einloggen
3. Falls aktuelle **Developer Terms of Service** angezeigt werden: Häkchen setzen und **Accept/Agree** antippen — danach erst wird das Dashboard nutzbar
4. Auf der Dashboard-Seite: oben rechts (oder direkt unter der Überschrift) ein **grüner Button "Create app"**
5. Formular ausfüllen:
   - **App name:** z.B. `SongLingua`
   - **App description:** z.B. `Privates Englisch-Lerntool`
   - **Redirect URI:** hier **exakt** deine Vercel-URL + `/callback` eintragen, z.B.
     `https://songlingua-xyz.vercel.app/callback`
     (genau wie in Schritt 2 erhalten — kein Tippfehler, kein fehlender/zusätzlicher Slash)
   - **Which API/SDKs are you planning to use?:** Häkchen bei **Web API**
   - Nutzungsbedingungen-Häkchen setzen
6. **Save** antippen
7. In der App-Übersicht: **Settings** öffnen → dort siehst du die **Client ID** (kopieren). Den **Client Secret** brauchst du NICHT (siehe unten, "Warum kein Client Secret?")

### Falls der "Create app"-Button auf dem iPhone nicht sichtbar ist

Das Dashboard ist nicht für schmale Bildschirme optimiert. Lösung:

1. Adressleiste in Safari antippen → das **"aA"-Symbol** links in der Adressleiste antippen
2. **"Desktop-Website anfordern"** auswählen
3. Seite neu laden — jetzt sollte die Desktop-Ansicht mit sichtbarem "Create app"-Button erscheinen

Falls das immer noch nicht klappt: in den Safari-Einstellungen unter
**Safari → Desktop-Website verlangen → Alle Websites** einmalig umstellen.

### Sehr wichtiger Punkt: Development Mode / User Management

Eine neu erstellte Spotify-App läuft im **Development Mode**. In diesem
Modus können sich **nur Spotify-Konten einloggen, die du vorher explizit
freigeschaltet hast** (bis zu 25 Nutzer) — sonst bekommst du beim Login
einen Fehler.

So fügst du dich selbst hinzu:

1. In deiner App im Dashboard → **Settings** (oder **User Management**, je nach Ansicht)
2. **Add new user** / **Users** → deinen Spotify-Account (E-Mail-Adresse, mit der du bei Spotify registriert bist) eintragen
3. Speichern

Da SongLingua rein privat ist (kein App-Store-Release), reicht der
Development Mode dauerhaft aus.

### Warum kein Client Secret?

SongLingua nutzt den **PKCE-Flow** (Authorization Code with PKCE) — das ist
der von Spotify empfohlene, sicherere Standard für Apps, die im Browser
laufen. Bei PKCE wird kein Client Secret benötigt; die Client ID ist
bewusst öffentlich und darf im Code/Browser sichtbar sein.

---

## Schritt 5 — Umgebungsvariablen eintragen

Du brauchst drei Werte, die du in Vercel unter
**Project → Settings → Environment Variables** einträgst:

| Name | Wert | Geheim? |
|---|---|---|
| `ANTHROPIC_API_KEY` | dein Key aus Schritt 3 (`sk-ant-...`) | Ja, geheim |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | deine Client ID aus Schritt 4 | Nein, öffentlich |
| `NEXT_PUBLIC_SPOTIFY_REDIRECT_URI` | exakt deine `.../callback`-URL aus Schritt 4 | Nein, öffentlich |

Nach dem Eintragen:

1. Im Vercel-Projekt zu **Deployments** gehen
2. Beim letzten Deployment die drei Punkte (…) antippen → **Redeploy**
   (Umgebungsvariablen werden erst beim nächsten Deployment aktiv)

### Falls du lokal testen willst (optional, später)

Datei `.env.local.example` im Ordner `songlingua/` zu `.env.local` kopieren
und dort die echten Werte eintragen. Diese Datei wird nie zu GitHub
hochgeladen (siehe `.gitignore`).

---

## Alternative: Netlify statt Vercel

Falls du lieber Netlify nutzt:

1. netlify.com → **Sign up** → **GitHub**
2. **Add new site** → **Import an existing project** → Repository wählen
3. **Base directory:** `songlingua`
4. Build command: `npm run build`, Publish directory: `.next` (Netlify erkennt Next.js i.d.R. automatisch und schlägt das passende Next.js-Runtime-Plugin vor — Vorschlag annehmen)
5. Umgebungsvariablen unter **Site configuration → Environment variables** eintragen (gleiche drei wie oben)
6. Deploy auslösen, danach die Netlify-URL als Redirect URI bei Spotify eintragen

---

## Nach dem Deployment: Kurzer Funktionstest

1. App-URL öffnen
2. "Mit Spotify verbinden" antippen → Spotify-Login-Seite → erlauben
3. Du landest zurück in der App, Verbindung sollte stehen
4. Spotify auf deinem Handy einen Song abspielen → in SongLingua sollte er innerhalb von 10 Sekunden erscheinen
5. Einen kurzen Textausschnitt einfügen → "Analysieren" → Übersetzung sollte erscheinen

---

## Architektur (für später, falls du etwas änderst)

- `services/spotifyService.ts` — Verbindung, aktueller Song, Trennen
- `services/translationService.ts` — ruft `/api/translate` (Claude-Proxy) auf
- `services/lyricsProviderService.ts` — austauschbare Schnittstelle, V1 = manuelle Eingabe
- `services/storageService.ts` — Verlauf in localStorage
- `app/api/spotify/*` — Backend-Proxy zu Spotify (Token-Austausch, Refresh, aktueller Song)
- `app/api/translate` — Backend-Proxy zu Claude, hält `ANTHROPIC_API_KEY` serverseitig

Keine Lyrics werden automatisch geladen oder gescraped. Kein Mikrofon.
Keine Datenbank, kein Server-Login — alles läuft client-seitig mit
Spotifys eigenem OAuth-Token im Browser-Speicher.
