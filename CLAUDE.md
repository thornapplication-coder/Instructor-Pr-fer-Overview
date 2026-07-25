# 737 TRAINER – Arbeitsnotizen

Steuerung des A320 → B737-MAX-Phase-In für Instruktoren und Prüfer bei
Eurowings. React/Vite-PWA, offline-fähig, mit optionalem Cloud-Sync.

**Sprache:** Der Nutzer (Patrick Thorn) schreibt und liest Deutsch. Antworten,
Changelog-Einträge und Oberflächentexte auf Deutsch; Quelltext-Kommentare und
Commit-Nachrichten auf Englisch.

## Wo was liegt

| Pfad | Inhalt |
|---|---|
| `src/lib/store.jsx` | Zustand, `normalize()`, `patch()`, alle Migrationen. Der einzige Ort, an dem Daten hineinkommen. |
| `src/lib/merge.js` | Zusammenführung je Datensatz für den Sync (`stampChanges`, `mergeBlobs`, `stable`). |
| `src/lib/cloudSync.js` | Sync-Ablauf: wann abgeglichen wird, Wiederholungen, Zustände. |
| `src/lib/supabaseSync.js` | Supabase-Aufrufe (`pull`, `pushCas`, `createRow`, `pushOnUnload`). |
| `src/lib/palette.js` | **Alle** Farben. Nirgends sonst ein Hex-Wert für Daten. |
| `src/lib/i18n.js` | DE/EN, ein flaches Wörterbuch. |
| `src/data/*.js` | Startdaten und Kategorien (Phasen, Berechtigungen, Provider, Piloten). |
| `src/tabs/*.jsx` | Je Reiter eine Datei. |
| `src/version.js` | Version **und** Changelog (wird in den Einstellungen angezeigt). |
| `test/` | `npm test` – Zusammenführung + Abdeckungs-Wächter, reines Node. |
| `test/browser/` | `npm run test:browser` – Playwright gegen den echten Build. |

## Befehle

```bash
npm run dev            # Entwicklung
npm test               # Logik: Zusammenführung + Abdeckungs-Wächter (Sekunden)
npm run build          # muss vor jedem Commit durchlaufen
npm run test:browser   # nach dem Build: echter Browser, dauert einige Minuten
npm run preview -- --port 4329
```

`npm run test:browser` startet die Vorschau selbst und fährt sie wieder herunter.
Es prüft die Dinge, die es erst gerendert gibt: Kopfzeile und Zahnrad, Breite der
Trainer-Tabelle, die Kacheln, Stempel und Grabsteine im Speicher, Farben im
Dunkelmodus, Kartenbreiten im Board und die Seitenzahl des Dashboard-PDF.

Playwright ist **keine** Abhängigkeit des Projekts — fehlt es, meldet der Lauf
das und endet mit Erfolg, statt einen sonst gesunden Checkout rot zu färben. In
dieser Sandbox liegt es unter `/opt/node22/lib/node_modules/playwright`.

Der Lauf braucht mehrere Minuten (zwei PDF-Exporte, viele Neuladungen) — im
Zweifel im Hintergrund starten. Aufräumen mit `fuser -k <port>/tcp`; **nie**
`pkill` in einer verketteten Zeile, das trifft auch den eigenen Prozess.

## Regeln, die schon einmal wehgetan haben

**Jeder Push ist eine neue Version.** `src/version.js` (APP_VERSION *und*
CHANGELOG-Eintrag), `CHANGELOG.md`, `package.json`, `package-lock.json` — alle
vier, sonst driften sie auseinander.

**Farben kommen aus `palette.js`.** Kategorien = Identität, Statusfarben
(grün/amber/rot) sind reserviert und nie Serienfarbe, Phasen sind *ordinal*
(eine Farbe hell → dunkel). Hell und dunkel haben eigene Stufen. Geprüft mit dem
Validator der `dataviz`-Skill; Einzelreihen-Balkendiagramme sind einfarbig.

**Sync-Schreibvorgänge sind immer bedingt.** Nie ein blindes `upsert` auf
`app_state` — das hat schon einmal die Änderungen eines anderen Geräts gelöscht.
`pushCas()` verlangt den Vergleichszeitstempel; verliert es, wird neu gelesen
und erneut zusammengeführt. Beim Schließen gilt dasselbe per `PATCH …
&updated_at=eq.<zuletzt gesehen>` (Zeitstempel **muss** URL-kodiert werden, das
`+00:00` würde sonst zum Leerzeichen).

**Im Sync-Ablauf den Store nach dem `pull` lesen, nie davor.** Sonst fällt eine
Änderung, die während des Ladens gemacht wird, aus der Zusammenführung und wird
danach überschrieben.

**Neue Liste im Datenbestand? In `MERGE_LISTS` eintragen.** Sonst fällt sie
still auf „ganzer Bestand, neuerer gewinnt" zurück. `npm test` fängt das ab.

**Stempel entstehen nur in `patch()`** (`stampChanges` vergleicht vorher/nachher).
Kein Aufrufer setzt `_at` selbst.

**Migrationen sind durch ein Flag abgesichert** (`_provSeeded`, `_courseSeed2`,
`_provStatus2`, `_qualMerge`, `_roleSeed`, `_palette3`) und fassen nur an, was
noch den alten Standardwert trägt — selbst gewählte Werte bleiben.

**`vite.config.js` leitet den Basispfad aus `GITHUB_REPOSITORY` ab.** Nicht
wieder fest verdrahten: eine Umbenennung des Repositories hat die App schon
einmal komplett offline genommen.

**Dialoge:** Der Fokus-Effekt in `Modal.jsx` hängt an `onCloseRef`, nicht an
`onClose`. Mit `[onClose]` lief er nach jedem Tastendruck neu — man konnte genau
ein Zeichen tippen.

## Deployment

GitHub Pages, automatisch bei jedem Push auf
`claude/737-instructor-monitoring-dashboard-2ox5gd` (das ist auch der
Standard-Branch). Adresse:
<https://thornapplication-coder.github.io/Instructor-Pr-fer-Overview/>

Das Repository heißt `Instructor-Pr-fer-Overview`; der lokale Ordner und die
Git-Remote sagen noch `TESTREPO`. Beides ist korrekt, GitHub leitet um.

Kommt nach einem Deploy die alte Fassung: GitHub Pages lässt HTML 10 Minuten im
Browser-Cache. `?v=<version>` an die URL hängen umgeht das.

## Cloud-Sync in Kürze

Ein `jsonb`-Datensatz je Benutzer in `app_state`, abgesichert durch Row Level
Security (`supabase/migrations/0001_app_state.sql`). Projekt und öffentlicher
anon-Key stehen fest in `src/lib/cloudConfig.js` — das ist Absicht und sicher,
siehe Kommentar dort.

Abgeglichen wird beim Start, alle 2 Minuten, beim Zurückwechseln zur App, rund
2 Sekunden nach jeder Änderung und beim Schließen. Zusammengeführt wird je
Datensatz; Löschungen hinterlassen einen Grabstein in `_tomb` (180 Tage).

## Umgebung

Aus dieser Sandbox sind `*.supabase.co` und `*.github.io` durch den Proxy
gesperrt (403). Die laufende Seite lässt sich also nicht selbst abrufen — Zustand
über die GitHub-API prüfen, nicht per `curl` auf die Seite. `cdn.sheetjs.com` ist
ebenfalls gesperrt.

## Offen

- In Supabase unter *Authentication → Sign In / Providers → Email* die Option
  „Allow new users to sign up" abschalten, sobald das Konto steht. Der anon-Key
  ist öffentlich, sonst kann sich jeder registrieren.
