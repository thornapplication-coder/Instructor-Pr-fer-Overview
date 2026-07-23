// Single source of truth for the app version and its changelog.
// Rule: every push is a new version, starting at 1.0.0 (semantic versioning).
//   - MAJOR (x.0.0): large reworks / breaking changes
//   - MINOR (1.x.0): new features / tabs
//   - PATCH (1.0.x): fixes, small tweaks, data updates
// Keep this in sync with package.json "version".
export const APP_VERSION = '1.0.0'
export const APP_BUILD_DATE = '2026-07-23'

// Newest entry first. Shown in Settings → "Version & Changelog".
export const CHANGELOG = [
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
