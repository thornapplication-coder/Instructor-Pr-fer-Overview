// Single source of truth for the app version and its changelog.
// Rule: every push is a new version, starting at 1.0.0 (semantic versioning).
//   - MAJOR (x.0.0): large reworks / breaking changes
//   - MINOR (1.x.0): new features / tabs
//   - PATCH (1.0.x): fixes, small tweaks, data updates
// Keep this in sync with package.json "version".
export const APP_VERSION = '1.5.0'
export const APP_BUILD_DATE = '2026-07-23'
export const COPYRIGHT = '© Copyright by Patrick Thorn'

// Newest entry first. Shown in Settings → "Version & Changelog".
export const CHANGELOG = [
  {
    version: '1.5.0',
    date: '2026-07-23',
    type: 'minor',
    changes: {
      de: [
        'FTE-Kapazität: „FTE in Umschulung" und „FTE verfügbar" – passen sich automatisch an, sobald Personen in eine Umschulungs-Phase geschoben werden.',
        'Neue KPI-Kacheln im Dashboard + FTE-Zusammenfassung direkt im Umschulungs-Board.'
      ],
      en: [
        'FTE capacity: “FTE in conversion” and “FTE available” – auto-adjust as soon as people are moved into a conversion stage.',
        'New dashboard KPI tiles + an FTE summary directly on the conversion board.'
      ]
    }
  },
  {
    version: '1.4.0',
    date: '2026-07-23',
    type: 'minor',
    changes: {
      de: [
        'Logo-Hintergrund jetzt reines Burgundy (Icon + Header).',
        'Übersicht und Statistik zusammengeführt: erster Reiter heißt „Dashboard" – keine Doppelungen.',
        'Neues Feld „Aircraft" pro Trainer (A320 / B737) – als Spalte, Filter, Suche und im Dashboard; zieht sich durch alle Reiter.',
        'Alle Trainer auf 1 FTE gesetzt; FTE-Standard ist 1 (100%).',
        'Trainer-Tabelle: SIM-Sessions und LIFUS-Legs entfernt.',
        'Alle Dropdowns alphabetisch sortiert und mit leerer Auswahlzeile oben.',
        'Reload-Symbol als klares Kreispfeil-Icon.'
      ],
      en: [
        'Logo background is now pure burgundy (icon + header).',
        'Overview and Statistics merged: the first tab is now “Dashboard” – no duplicates.',
        'New “Aircraft” field per trainer (A320 / B737) – as column, filter, search and on the dashboard; carried across all tabs.',
        'All trainers set to 1 FTE; the FTE default is 1 (100%).',
        'Trainer table: removed SIM sessions and LIFUS legs.',
        'All dropdowns sorted alphabetically with an empty option at the top.',
        'Reload control is now a clean circular-arrow icon.'
      ]
    }
  },
  {
    version: '1.3.0',
    date: '2026-07-23',
    type: 'minor',
    changes: {
      de: [
        'Neues Logo (weißes „737", darunter „TRAINER" in Blau) – überall inkl. Homescreen-Icon; „EWL" entfernt.',
        'Trainer-Tabelle überall sortierbar (Spaltenkopf antippen: Name, Qualifikation, Base, FTE …).',
        'FTE pro Person editierbar (Default 1 = 100%), eigene Spalte + KPI nutzt diese Werte.',
        'Umschulungs-Suche filtert jetzt auch nach Qualifikation und intern/extern.',
        'Planung: Spalten frei editierbar (umbenennen/Farbe/hinzufügen/löschen/sortieren), Matrix sortierbar, Status „n/a" verfügbar.',
        'Reload-Button oben neben DE/EN; Version steht jetzt unten mittig.',
        'Copyright „© Copyright by Patrick Thorn" unten und in allen Exporten (mit Version).'
      ],
      en: [
        'New logo (white “737” with blue “TRAINER”) everywhere incl. home-screen icon; “EWL” removed.',
        'Trainer table sortable everywhere (click a header: name, qualification, base, FTE …).',
        'Editable FTE per person (default 1 = 100%), own column + KPI uses these values.',
        'Conversion search now also filters by qualification and internal/external.',
        'Planning: fully editable columns (rename/colour/add/delete/reorder), sortable matrix, “n/a” status.',
        'Reload button next to DE/EN; version now shown bottom-centre.',
        'Copyright “© Copyright by Patrick Thorn” at the bottom and in all exports (with version).'
      ]
    }
  },
  {
    version: '1.2.1',
    date: '2026-07-23',
    type: 'patch',
    changes: {
      de: [
        'Lokaler Speicher abgesichert: App fordert „persistenten Speicher" an (verhindert automatisches Löschen durch den Browser, v. a. auf iPad/Safari).',
        'Neue Sektion „Datensicherheit" in den Einstellungen mit Status, Warnhinweis und Ein-Klick-Backup.',
        'Hinweis: Ein bewusstes „Websitedaten/Cookies löschen" kann nur der (kommende) Cloud-Sync vollständig absichern.'
      ],
      en: [
        'Hardened local storage: the app requests “persistent storage” (prevents automatic browser eviction, esp. on iPad/Safari).',
        'New “Data safety” section in Settings with status, a warning and a one-click backup.',
        'Note: a manual “clear site data/cookies” can only be fully protected by the (upcoming) cloud sync.'
      ]
    }
  },
  {
    version: '1.2.0',
    date: '2026-07-23',
    type: 'minor',
    changes: {
      de: [
        'Neues, klareres App-Logo (eigene Wave-Bildmarke) statt der dunklen Kachel.',
        'Berechtigungen jetzt in fester Reihenfolge SEN · TRE · TRI · new TRI · LTC · SFI · TKI – frei editierbar (umbenennen, Farbe, hinzufügen/löschen, sortieren). „TRE/SEN" wurde zu „SEN".',
        'Editierbare Kategorien mit Farbe überall: Umschulungs-Phasen, Berechtigungen, Provider-Angebotstypen und Provider-Status – jeweils per „Verwalten"-Button.',
        'Drag & Drop: Trainer im Umschulungs-Board per Ziehen zwischen Phasen verschieben; Kategorien per Ziehen/Pfeilen sortieren.',
        'Alphabetische Sortierung (Namen nach Nachname) durchgängig.',
        'Statistik entschlackt: die doppelte Tabelle unter jedem Diagramm entfällt, Werte stehen im Diagramm.'
      ],
      en: [
        'New, cleaner app logo (custom wave mark) instead of the dark tile.',
        'Qualifications now in fixed order SEN · TRE · TRI · new TRI · LTC · SFI · TKI – fully editable (rename, colour, add/delete, reorder). “TRE/SEN” became “SEN”.',
        'Editable colour-coded categories everywhere: conversion stages, qualifications, provider offering types and provider status – each via a “Manage” button.',
        'Drag & drop: move trainers between stages on the conversion board; reorder categories by dragging/arrows.',
        'Alphabetical sorting (names by last name) throughout.',
        'Statistics decluttered: the duplicate table under each chart is gone, values live in the chart.'
      ]
    }
  },
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
