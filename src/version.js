// Single source of truth for the app version and its changelog.
// Rule: every push is a new version, starting at 1.0.0 (semantic versioning).
//   - MAJOR (x.0.0): large reworks / breaking changes
//   - MINOR (1.x.0): new features / tabs
//   - PATCH (1.0.x): fixes, small tweaks, data updates
// Keep this in sync with package.json "version".
export const APP_VERSION = '1.9.1'
export const APP_BUILD_DATE = '2026-07-24'
export const COPYRIGHT = '© Copyright by Patrick Thorn'

// Newest entry first. Shown in Settings → "Version & Changelog".
export const CHANGELOG = [
  {
    version: '1.9.1',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        '„new TRI" entfällt: alle bisherigen „new TRI" zählen jetzt als „TRI" – auch in bestehenden Daten (automatische Umstellung) und in der Statistik.',
        'Qualifikations-Rangfolge jetzt: SEN → TRE → TRI → LTC → SFI → TKI.'
      ],
      en: [
        '“new TRI” removed: all former “new TRI” now count as “TRI” – including existing data (auto-migrated) and the statistics.',
        'Qualification ranking is now: SEN → TRE → TRI → LTC → SFI → TKI.'
      ]
    }
  },
  {
    version: '1.9.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Export-Auswahl pro Seite: PDF herunterladen, Excel herunterladen (wo sinnvoll) oder direkt Drucken.',
        'Auch die Excel-Exporte sind jetzt gebrandet (737-TRAINER-Kopf, Report-Titel, Datum, Copyright).',
        'Datum in allen Exporten ohne Uhrzeit.'
      ],
      en: [
        'Per-page export choice: download PDF, download Excel (where useful) or print directly.',
        'Excel exports are now branded too (737-TRAINER header, report title, date, copyright).',
        'Date in all exports without time.'
      ]
    }
  },
  {
    version: '1.8.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'PDF-Export komplett neu: echte, gebrandete PDF-Dateien direkt aus den aktuellen Daten – kein „Drucken" mehr. Dadurch immer die richtige Seite mit aktuellen Daten, zuverlässig auf iPhone, iPad und Desktop.',
        'Jede Seite als eigener Report (Dashboard, Umschulung, Kapazität, Trainer, Planung, Provider) mit Kopf-/Fußzeile: 737-TRAINER-Kopf, Datum, Copyright und Seitenzahl.'
      ],
      en: [
        'PDF export rebuilt: real, branded PDF files generated directly from the current data – no more “print”. Always the right page with current data, reliable on iPhone, iPad and desktop.',
        'Each page as its own report (dashboard, conversion, capacity, trainers, planning, providers) with header/footer: 737-TRAINER banner, date, copyright and page number.'
      ]
    }
  },
  {
    version: '1.7.1',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        'iPhone: breite Tabellen laufen nicht mehr aus dem Bildschirm – sie scrollen jetzt sauber horizontal.',
        'Kapazität: „je Qualifikation" steht jetzt oben; beide Tabellen sind spaltenweise sortierbar.',
        'Qualifikationen erscheinen überall in fester Rangfolge: SEN → TRE → TRI → new TRI → LTC → SFI → TKI.',
        'Provider-Tabellen (Liste & Auslastung) sind jetzt ebenfalls sortierbar.'
      ],
      en: [
        'iPhone: wide tables no longer overflow the screen – they scroll horizontally instead.',
        'Capacity: “per qualification” is now on top; both tables are sortable by column.',
        'Qualifications appear everywhere in a fixed ranking: SEN → TRE → TRI → new TRI → LTC → SFI → TKI.',
        'Provider tables (list & utilization) are now sortable too.'
      ]
    }
  },
  {
    version: '1.7.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Provider: neue „Kapazität & Auslastung" – aktive Planungs-Zuweisungen je Provider (nach Kurs) gegenüber der Platz-Kapazität, mit Auslastungsbalken (grün/gelb/rot bei Überbuchung).',
        'Provider: neues Feld „Kapazität (Plätze)" im Bearbeiten-Dialog.'
      ],
      en: [
        'Providers: new “Capacity & utilization” – active planning assignments per provider (by course) vs. the number of slots, with a utilization bar (green/amber/red when over-booked).',
        'Providers: new “Capacity (slots)” field in the edit dialog.'
      ]
    }
  },
  {
    version: '1.6.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Kapazität ist jetzt editierbar: neue Tabelle „Zieltermine & Umschulung bearbeiten" – Phase, Status und Zieltermin je Person direkt setzen (mit Suche/Filter). Timeline und Warnungen aktualisieren sich sofort.',
        'Neu: „FTE-Kapazität je Qualifikation" – TRI und new TRI werden zu einer Gruppe „TRI" zusammengefasst.'
      ],
      en: [
        'Capacity is now editable: new “Edit target dates & conversion” table – set phase, status and target date per person (with search/filter). Timeline and alerts update instantly.',
        'New: “FTE capacity per qualification” – TRI and new TRI are combined into one “TRI” group.'
      ]
    }
  },
  {
    version: '1.5.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Neu: Trainer aus Excel/CSV importieren (Einstellungen). Spalten werden über die Überschriften erkannt; bestehende Trainer werden per TLC (sonst Name) aktualisiert, neue ergänzt.',
        'Umschulungs-Status und Planung bleiben beim Import erhalten – nur die Stammdaten werden aufgefrischt.'
      ],
      en: [
        'New: import trainers from Excel/CSV (Settings). Columns are matched by header; existing trainers are updated by TLC (else name), new ones added.',
        'Conversion status and planning are preserved on import – only the master data is refreshed.'
      ]
    }
  },
  {
    version: '1.4.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Neuer Reiter „Kapazität": FTE je Base – verfügbar vs. in Umschulung, aufgeschlüsselt nach Aircraft (A320/B737) inkl. Gesamtzeile.',
        'Kapazitäts-Timeline: die Zieltermine der Umschulung als Zeitachse je Monat, farblich nach Dringlichkeit (überfällig/gefährdet).'
      ],
      en: [
        'New “Capacity” tab: FTE per base – available vs. in conversion, split by aircraft (A320/B737) incl. a totals row.',
        'Capacity timeline: conversion target dates on a per-month axis, coloured by urgency (overdue/at-risk).'
      ]
    }
  },
  {
    version: '1.3.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Neu: „Fristen & Warnungen" auf dem Dashboard – überfällige/gefährdete/blockierte Umschulungen und bald fällige Zieltermine auf einen Blick (rot/gelb).',
        'Im Umschulungs-Board werden überfällige/gefährdete Karten farblich hervorgehoben.'
      ],
      en: [
        'New: “Deadlines & alerts” on the dashboard – overdue/at-risk/blocked conversions and targets due soon at a glance (red/amber).',
        'The conversion board now highlights overdue/at-risk cards.'
      ]
    }
  },
  {
    version: '1.2.1',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        'FTE ergibt sich jetzt automatisch aus der Part-Time (VZ = 1, 80 % = 0,8 …) – kein separates Eintragen mehr nötig.',
        'Feld „B ab" bei den Trainern entfernt.'
      ],
      en: [
        'FTE is now derived automatically from part-time (FT = 1, 80% = 0.8 …) – no separate entry needed.',
        'Removed the “B from” field on trainers.'
      ]
    }
  },
  {
    version: '1.2.0',
    date: '2026-07-23',
    type: 'minor',
    changes: {
      de: [
        'Alle Downloads zentral in den Einstellungen – im Eurowings-Style: jede Seite als PDF (Dashboard, Umschulung, Trainer, Planung, Provider) und die Tabellen zusätzlich als Excel.',
        'Die Export-Buttons in den einzelnen Reitern wurden entfernt (aufgeräumte Toolbars).',
        '„Trainer seit" (LTC/TRI/TRE) jetzt klar gruppiert in den Trainer-Details – nur dort sichtbar, nicht in der Tabelle.'
      ],
      en: [
        'All downloads centralized in Settings – Eurowings-styled: every page as PDF (dashboard, conversion, trainers, planning, providers) plus the tables as Excel.',
        'Removed the per-tab export buttons (cleaner toolbars).',
        '“Trainer since” (LTC/TRI/TRE) now clearly grouped in the trainer details – shown there only, not in the table.'
      ]
    }
  },
  {
    version: '1.1.0',
    date: '2026-07-23',
    type: 'minor',
    changes: {
      de: [
        'Neuer Save-Button oben (mit Bestätigung) neben Reload.',
        'Dunkelmodus zum Umschalten oben in der Kopfzeile (bleibt gespeichert).',
        'Jede Seite einzeln exportierbar: PDF (Dashboard, Umschulung, Trainer, Planung, Provider) und Excel für die Tabellen (Trainer, Planung, Provider).',
        'Provider-Status korrigiert – Auswahl: leer / in use / no agreement.',
        'Alphabetische Sortierung überall in Dropdowns nochmals geprüft.'
      ],
      en: [
        'New Save button in the header (with confirmation) next to Reload.',
        'Dark mode toggle in the header (persisted).',
        'Each page exportable individually: PDF (dashboard, conversion, trainers, planning, providers) and Excel for the tables (trainers, planning, providers).',
        'Provider status fixed – choices: empty / in use / no agreement.',
        'Re-checked alphabetical ordering across all dropdowns.'
      ]
    }
  },
  {
    version: '1.0.0',
    date: '2026-07-23',
    type: 'major',
    changes: {
      de: [
        'Erstes Release nach vollständigem Code-Audit (Versionierung neu gestartet).',
        'PWA „737 TRAINER": installierbar auf Desktop/iPhone/iPad, offline-fähig, DE/EN, Reload-Button, Update-Hinweis als Popup unten.',
        'Dashboard: KPI-Kacheln (inkl. FTE in Umschulung / FTE verfügbar) und Live-Auswertungen (Qualifikation, Base, Aircraft, ORE, Behörde, Part-Time, Funktion, Intern/Extern).',
        'Trainer: 50 Personen vorbefüllt, editierbar, sortierbar, Filter & Suche; FTE pro Person (Default 1 = 100%); intern/extern.',
        'Umschulung: Board mit editierbaren Phasen (Farbe, Reihenfolge, Drag & Drop), Ziel wählbar (A320 → B737); Aircraft folgt automatisch der Phase und fließt in die Statistik ein.',
        'Planung: Matrix pro Person für Type Rating, TRI-Kurs, LIFUS und Examiner-Prüfung – Provider/Ort/Status („n/a" möglich)/Termin, Spalten editierbar.',
        'Provider: BAA, CAE, CATC, LAT, SunEx, TUI vorbefüllt; Kurse als Mehrfachauswahl (inkl. „SIM only"), mehrere Standorte je Anbieter als ICAO-Codes.',
        'Datensicherheit: persistenter Speicher, Backup/Export & Import aller Daten, Sofort-Speicherung auch bei Reload.',
        'Berechtigungen in Reihenfolge SEN · TRE · TRI · new TRI · LTC · SFI · TKI – wie alle Kategorien frei editierbar (umbenennen, Farbe, sortieren, hinzufügen/löschen).'
      ],
      en: [
        'First release after a full code audit (versioning restarted).',
        '“737 TRAINER” PWA: installable on desktop/iPhone/iPad, offline-capable, DE/EN, reload button, update prompt as a bottom popup.',
        'Dashboard: KPI tiles (incl. FTE in conversion / FTE available) and live breakdowns (qualification, base, aircraft, ORE, authority, part-time, function, internal/external).',
        'Trainers: 50 people prefilled, editable, sortable, filters & search; FTE per person (default 1 = 100%); internal/external.',
        'Conversion: board with editable stages (colour, order, drag & drop), selectable target (A320 → B737); aircraft follows the stage automatically and feeds the statistics.',
        'Planning: per-person matrix for Type Rating, TRI course, LIFUS and examiner check – provider/location/status (“n/a” available)/date, editable columns.',
        'Providers: BAA, CAE, CATC, LAT, SunEx, TUI prefilled; courses as multi-select (incl. “SIM only”), multiple locations per provider as ICAO codes.',
        'Data safety: persistent storage, backup/export & import of all data, immediate save even on reload.',
        'Qualifications ordered SEN · TRE · TRI · new TRI · LTC · SFI · TKI – like all categories fully editable (rename, colour, reorder, add/delete).'
      ]
    }
  }
]
