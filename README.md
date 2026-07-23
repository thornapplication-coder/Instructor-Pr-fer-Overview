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

Die App wird dann unter `https://thornapplication-coder.github.io/TESTREPO/`
ausgeliefert. Der Pfad ist case-sensitiv und muss zur Repo-Schreibweise passen.
Wird das Repository umbenannt, `base` in `vite.config.js` und die Pfade in
`index.html` entsprechend anpassen.

## Versionierung

Jeder Push ist eine neue Version (SemVer, Start bei `1.0.0`). Die Version wird
in `src/version.js` und `package.json` gepflegt und in der App angezeigt. Nach
einem neuen Deploy erkennt der Service Worker die neue Version und blendet einen
**Update-Button** ein. Details siehe [CHANGELOG.md](./CHANGELOG.md).

## Daten & Sync

- **Standard:** Daten liegen lokal im Browser (localStorage), voll offline.
  **Export/Import** aller Daten als JSON im Reiter *Einstellungen* – so lassen
  sich Geräte manuell abgleichen und Backups ziehen.
- **Optional – automatischer Cloud-Sync (Supabase):** noch nicht aktiviert (der
  Supabase-Free-Tier-Slot war beim Bau belegt). Zum Aktivieren siehe
  Kommentar-Anleitung in `src/lib/supabaseSync.js` und `.env.example`. Danach
  gleiche Daten automatisch auf allen Geräten, geschützt per Login.

## PWA-Installation

- **Desktop (Chrome/Edge):** Installations-Symbol in der Adressleiste.
- **iPhone/iPad (Safari):** Teilen → „Zum Home-Bildschirm".
