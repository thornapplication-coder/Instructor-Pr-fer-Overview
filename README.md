# EWL 737 Trainer & Examiner Monitoring

Eine **PWA** (Progressive Web App) im **Eurowings-Style** zur Überwachung und
**Steuerung der Instruktoren und Prüfer** für den **Boeing 737 MAX Phase-In** –
die schrittweise Umschulung der aktuellen A320-Trainer auf die 737 MAX.

Installierbar auf **Desktop, iPhone und iPad**, voll **offline-fähig**, mit
**DE/EN-Umschaltung**, **Export/Import** aller Daten und automatischem
**Update-Button** bei jeder neuen Version.

## Reiter

| Reiter | Inhalt |
|--------|--------|
| **Dashboard** | Kennzahlen und Diagramme: Kopfzahl und FTE, Berechtigungen, Rolle, Base, Muster, Behörde, Teilzeit, intern/extern – dazu der Umschulungs-Abschnitt mit Pipeline, Fortschritt und ORE |
| **Trainer** | Editierbare Liste aller Trainer/Prüfer – anlegen/ändern/löschen, Suche und sieben Filter, Sortierung, am Handy als Karten |
| **Umschulung** | Drei Ansichten unter einem Reiter: **Board** (Meilenstein-Pipeline A320 → 737 MAX je Person, mit Zählern für überfällig/gefährdet), **Planung** (Buchungsraster Person × Kursschritt) und **Kalender** |
| **Kapazität** | FTE-Kapazität je Berechtigung, Muster und Base; Zieltermine je Monat; Umschulungs-Editor |
| **Provider** | Editierbare Liste externer Anbieter samt Plätzen insgesamt und je Monat, mit Auslastung |
| **Other Pilots** | Linienpiloten der Firma (keine Trainer): B737-Ratings, abgelaufen oder mit Boeing-Erfahrung |
| **Einstellungen** | Sprache, Downloads & Export, Import, Pick-Listen, Cloud-Sync, Reset, Version & Changelog |

Der Reiter *Einstellungen* sitzt hinter dem Zahnrad in der Kopfzeile, nicht in
der Reiter-Leiste.

## Entwicklung

```bash
npm install
npm run dev        # lokaler Dev-Server
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
npm test           # Logik-Tests (reines Node, Sekunden) – gaten den Deploy
npm run test:browser  # Playwright gegen den echten Build (mehrere Minuten)
```

Tech-Stack: **Vite + React**, handgemachte SVG-Charts (keine schweren Chart-Libs),
`vite-plugin-pwa` (Service Worker + Manifest). Die Trainerdaten liegen in
`src/data/seed.js` (aus der Excel normalisiert generiert).

## Deployment (GitHub Pages)

Bei jedem Push auf den Entwicklungs-Branch baut und deployt der Workflow
`.github/workflows/deploy.yml` automatisch nach GitHub Pages.

**Einmalige Einrichtung durch den Repo-Owner:**
*Settings → Pages → Source: „GitHub Actions"*.

Die App wird dann unter
`https://thornapplication-coder.github.io/Instructor-Pr-fer-Overview/`
ausgeliefert – GitHub Pages hängt den Repo-Namen an, case-sensitiv.

Der Build ermittelt diesen Pfad selbst aus `GITHUB_REPOSITORY` (setzt GitHub
Actions automatisch), eine Umbenennung des Repositories zieht also von allein
nach. Nur für Sonderfälle gibt es Schalter:

- `VITE_BASE=/` – eigene Domain (Repo-Name entfällt im Pfad)
- lokaler Build ohne Actions: Fallback ist der aktuelle Repo-Name in
  `vite.config.js`

## Versionierung

Jeder Push ist eine neue Version (SemVer, Start bei `1.0.0`). Die Version steht
an **vier** Stellen und muss überall gleich sein: `src/version.js` (`APP_VERSION`
*und* ein `CHANGELOG`-Eintrag), `CHANGELOG.md`, `package.json` und
`package-lock.json`. Angezeigt wird sie in der App unter *Einstellungen*. Nach
einem neuen Deploy erkennt der Service Worker die neue Version und blendet einen
**Update-Button** ein. Details siehe [CHANGELOG.md](./CHANGELOG.md).

## Daten & Sync

- **Standard:** Daten liegen lokal im Browser (localStorage), voll offline.
  **Export/Import** aller Daten als JSON im Reiter *Einstellungen* – so lassen
  sich Geräte manuell abgleichen und Backups ziehen.
- **Automatischer Cloud-Sync (Supabase):** aktiv. In *Einstellungen →
  Cloud-Sync* anmelden, danach gleicht die App den kompletten Datenstand
  automatisch zwischen allen Geräten ab. Der Sync-Status steht oben in der
  Kopfzeile. Zusammengeführt wird **je Datensatz**, ohne Rückfrage: Änderungen
  an verschiedenen Personen auf verschiedenen Geräten bleiben alle erhalten;
  nur wenn dieselbe Person auf beiden Seiten geändert wurde, gewinnt die
  neuere Änderung. Gelöschtes bleibt gelöscht (Grabstein, 180 Tage).
  - Verbindung: `src/lib/cloudConfig.js` (Projekt-URL + öffentlicher anon-Key).
    `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` überschreiben beides als
    Paar (nur eines von beiden zu setzen schaltet den Sync ab, statt die
    Projekte zu vermischen). Für einen reinen Offline-Build `DEFAULT_URL` in
    `cloudConfig.js` leeren.
  - Schema: `supabase/migrations/0001_app_state.sql` (eine jsonb-Zeile je
    Benutzer, abgesichert per Row Level Security).
  - **Nur-Lese-Link (optional, standardmäßig aus):**
    `supabase/migrations/0002_shared_read.sql` erlaubt dem `anon`-Rollenprofil,
    genau die Zeilen zu lesen, die `shared = true` tragen. Wer die Seite dann
    ohne Konto öffnet, sieht den aktuellen Stand und kann nichts ändern (die
    App schaltet in den Nur-Lese-Modus, sichtbar am Banner). Solange keine
    Zeile geflaggt ist, ändert die Migration nichts.
    **Wichtig:** Der anon-Key steckt im JavaScript jeder Auslieferung. Eine
    geflaggte Zeile ist damit für *jeden* lesbar, der die Seite erreicht — nicht
    nur für die, denen man den Link gegeben hat. Flaggen also nur, wenn der
    Inhalt so weit sichtbar sein darf.
  - **Betriebshinweis:** Da der anon-Key öffentlich ist, schützt allein die RLS
    die Daten. Die Registrierung neuer Benutzer ist in Supabase deshalb bereits
    abgeschaltet (*Authentication → Sign In / Providers → Email*: „Allow new
    users to sign up", „manual linking" und „anonymous sign-ins" aus, „Confirm
    email" an). Ein weiteres Gerät meldet sich mit dem bestehenden Konto an;
    ein zusätzlicher Benutzer geht nur über *Authentication → Users → Add
    user*.

## PWA-Installation

- **Desktop (Chrome/Edge):** Installations-Symbol in der Adressleiste.
- **iPhone/iPad (Safari):** Teilen → „Zum Home-Bildschirm".
