// Single source of truth for the app version and its changelog.
// Rule: every push is a new version, starting at 1.0.0 (semantic versioning).
//   - MAJOR (x.0.0): large reworks / breaking changes
//   - MINOR (1.x.0): new features / tabs
//   - PATCH (1.0.x): fixes, small tweaks, data updates
// Keep this in sync with package.json "version".
export const APP_VERSION = '1.1.0'
export const APP_BUILD_DATE = '2026-07-23'

// Newest entry first. Shown in Settings → "Version & Changelog".
export const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-07-23',
    type: 'minor',
    changes: {
      de: [
        'Neuer Reiter „Planung": Matrix, in der du pro Person Provider/Ort für Type Rating, TRI-Kurs, LIFUS und Examiner-Prüfung (TRE) zuweist – inkl. Status und Termin.',
        'Zuweisungen greifen auf den Provider-Reiter zu (gefiltert nach Angebot TR/TRI/TRE).',
        'Neue Kennzeichnung intern/extern pro Person (Spalte, Filter, Formular, Statistik).',
        'Umschulungs-Board zeigt jetzt zusätzlich die zugewiesenen Provider und intern/extern auf den Karten.'
      ],
      en: [
        'New “Planning” tab: a matrix to assign provider/location per person for Type Rating, TRI course, LIFUS and examiner check (TRE) – incl. status and date.',
        'Assignments pull from the Providers tab (filtered by offering TR/TRI/TRE).',
        'New internal/external classification per person (column, filter, form, statistics).',
        'Conversion board cards now also show the assigned providers and internal/external.'
      ]
    }
  },
  {
    version: '1.0.3',
    date: '2026-07-23',
    type: 'patch',
    changes: {
      de: ['Deploy-Workflow bereinigt: automatisches Pages-Aktivieren entfernt (der GitHub-Actions-Token darf die Pages-Site nicht anlegen). Pages muss einmalig manuell aktiviert werden.'],
      en: ['Cleaned up the deploy workflow: removed Pages auto-enable (the GitHub Actions token cannot create the Pages site). Pages must be enabled manually once.']
    }
  },
  {
    version: '1.0.2',
    date: '2026-07-23',
    type: 'patch',
    changes: {
      de: ['GitHub Pages wird im Deploy-Workflow automatisch aktiviert (kein manueller Schalter nötig).'],
      en: ['GitHub Pages is auto-enabled in the deploy workflow (no manual toggle needed).']
    }
  },
  {
    version: '1.0.1',
    date: '2026-07-23',
    type: 'patch',
    changes: {
      de: ['GitHub-Pages-Basispfad an die Repo-Schreibweise angepasst (Groß-/Kleinschreibung), damit PWA und Service Worker sauber laden.'],
      en: ['Fixed the GitHub Pages base path to match the repository name casing so the PWA and service worker load correctly.']
    }
  },
  {
    version: '1.0.0',
    date: '2026-07-23',
    type: 'major',
    changes: {
      de: [
        'Erste Version: PWA im Eurowings-Style, installierbar auf Desktop/iPhone/iPad.',
        'Reiter Overview mit KPI-Kacheln und Diagrammen (angelehnt an das LH-Referenz-Dashboard).',
        'Reiter Trainer: 50 Trainer/Prüfer aus der Excel vorbefüllt, editierbar (anlegen/ändern/löschen, Suche & Filter).',
        'Reiter Umschulung: Meilenstein-Pipeline A320 → 737 MAX mit Status pro Trainer.',
        'Reiter Statistik: Live-Auswertungen (Qualifikation, Base, ORE, Behörde, Part-Time, Funktion).',
        'Reiter Provider: editierbare Liste externer Anbieter (TR/TRI/TRE).',
        'DE/EN-Umschaltung, Export/Import aller Daten, Versions-Tracking und Update-Button.'
      ],
      en: [
        'Initial release: Eurowings-style PWA, installable on desktop/iPhone/iPad.',
        'Overview tab with KPI tiles and charts (inspired by the LH reference dashboard).',
        'Trainers tab: 50 instructors/examiners pre-loaded from Excel, editable (add/edit/delete, search & filter).',
        'Conversion tab: A320 → 737 MAX milestone pipeline with per-trainer status.',
        'Statistics tab: live breakdowns (qualification, base, ORE, authority, part-time, function).',
        'Providers tab: editable list of external providers (TR/TRI/TRE).',
        'DE/EN toggle, full data export/import, version tracking and update button.'
      ]
    }
  }
]
