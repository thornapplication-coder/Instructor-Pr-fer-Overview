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
| **Übersicht** | KPI-Kacheln + Diagramme (angelehnt an das LH-Referenz-Dashboard) |
| **Trainer** | Editierbare Liste aller Trainer/Prüfer (aus der Excel vorbefüllt) – anlegen/ändern/löschen, Suche & Filter |
| **Umschulung** | Meilenstein-Pipeline A320 → 737 MAX (Board) mit Status je Trainer – die Steuerungsebene |
| **Statistik** | Live-Auswertungen (deckungsgleich mit dem Excel-Tab „Statistik_Daten") |
| **Provider** | Editierbare Liste externer Anbieter (Type Rating / TRI / TRE) |
| **Einstellungen** | Sprache, Export/Import, Reset, Cloud-Status, Version & Changelog |

## Entwicklung

```bash
npm install
npm run dev        # lokaler Dev-Server
npm run build      # Produktions-Build nach dist/
npm run preview    # Build lokal ansehen
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

Jeder Push ist eine neue Version (SemVer, Start bei `1.0.0`). Die Version wird
in `src/version.js` und `package.json` gepflegt und in der App angezeigt. Nach
einem neuen Deploy erkennt der Service Worker die neue Version und blendet einen
**Update-Button** ein. Details siehe [CHANGELOG.md](./CHANGELOG.md).

## Daten & Sync

- **Standard:** Daten liegen lokal im Browser (localStorage), voll offline.
  **Export/Import** aller Daten als JSON im Reiter *Einstellungen* – so lassen
  sich Geräte manuell abgleichen und Backups ziehen.
- **Automatischer Cloud-Sync (Supabase):** aktiv. In *Einstellungen →
  Cloud-Sync* anmelden, danach gleicht die App den kompletten Datenstand
  automatisch zwischen allen Geräten ab. Der Sync-Status steht oben in der
  Kopfzeile. Ändern beide Seiten seit dem letzten Abgleich, fragt die App nach,
  statt still zu überschreiben.
  - Verbindung: `src/lib/cloudConfig.js` (Projekt-URL + öffentlicher anon-Key).
    `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` überschreiben beides als
    Paar (nur eines von beiden zu setzen schaltet den Sync ab, statt die
    Projekte zu vermischen). Für einen reinen Offline-Build `DEFAULT_URL` in
    `cloudConfig.js` leeren.
  - Schema: `supabase/migrations/0001_app_state.sql` (eine jsonb-Zeile je
    Benutzer, abgesichert per Row Level Security).
  - **Betriebshinweis:** Da der anon-Key öffentlich ist, schützt allein die RLS
    die Daten. Nach dem Anlegen des eigenen Kontos sollte in Supabase unter
    *Authentication → Sign In / Providers → Email* die Registrierung neuer
    Benutzer deaktiviert werden – sonst kann sich jeder Besucher der Seite ein
    Konto anlegen und Speicher im Projekt belegen.

## PWA-Installation

- **Desktop (Chrome/Edge):** Installations-Symbol in der Adressleiste.
- **iPhone/iPad (Safari):** Teilen → „Zum Home-Bildschirm".
