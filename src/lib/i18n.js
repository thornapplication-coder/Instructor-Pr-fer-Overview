// Lightweight i18n. Two languages: de (default) and en. t('key') falls back to the
// key itself if missing, so the app never crashes on an untranslated string.
export const LANGS = ['de', 'en']

const DICT = {
  // ---- generic / chrome
  appTitle: { de: '737 Trainer & Prüfer Monitoring', en: '737 Trainer & Examiner Monitoring' },
  appSubtitle: { de: 'Boeing 737 MAX Phase-In · Instruktoren & Prüfer', en: 'Boeing 737 MAX Phase-In · Instructors & Examiners' },
  asOf: { de: 'Stand', en: 'as of' },
  update: { de: 'Update', en: 'Update' },
  reload: { de: 'Neu laden', en: 'Reload' },
  updateAvailable: { de: 'Neue Version verfügbar', en: 'New version available' },
  updateNow: { de: 'Jetzt aktualisieren', en: 'Update now' },
  later: { de: 'Später', en: 'Later' },
  offlineReady: { de: 'App ist offline verfügbar', en: 'App ready to work offline' },
  save: { de: 'Speichern', en: 'Save' },
  cancel: { de: 'Abbrechen', en: 'Cancel' },
  delete: { de: 'Löschen', en: 'Delete' },
  edit: { de: 'Bearbeiten', en: 'Edit' },
  add: { de: 'Hinzufügen', en: 'Add' },
  close: { de: 'Schließen', en: 'Close' },
  confirm: { de: 'Bestätigen', en: 'Confirm' },
  search: { de: 'Suchen…', en: 'Search…' },
  all: { de: 'Alle', en: 'All' },
  none: { de: '–', en: '–' },
  total: { de: 'Gesamt', en: 'Total' },
  yes: { de: 'Ja', en: 'Yes' },
  no: { de: 'Nein', en: 'No' },

  // ---- tabs
  tab_overview: { de: 'Übersicht', en: 'Overview' },
  tab_dashboard: { de: 'Dashboard', en: 'Dashboard' },
  tab_trainers: { de: 'Trainer', en: 'Trainers' },
  tab_conversion: { de: 'Umschulung', en: 'Conversion' },
  tab_statistics: { de: 'Statistik', en: 'Statistics' },
  tab_providers: { de: 'Provider', en: 'Providers' },
  tab_planning: { de: 'Planung', en: 'Planning' },
  tab_settings: { de: 'Einstellungen', en: 'Settings' },

  // ---- overview / KPIs
  kpi_totalTrainers: { de: 'Trainer & Prüfer', en: 'Trainers & Examiners' },
  kpi_active: { de: 'Aktiv (ohne Rente)', en: 'Active (excl. retiring)' },
  kpi_examiners: { de: 'Prüfer (TRE)', en: 'Examiners (TRE)' },
  kpi_instructors: { de: 'Instruktoren (TRI/LTC)', en: 'Instructors (TRI/LTC)' },
  kpi_released: { de: 'Auf 737 freigegeben', en: 'Released on 737' },
  kpi_inProgress: { de: 'In Umschulung', en: 'In conversion' },
  kpi_notStarted: { de: 'Noch nicht gestartet', en: 'Not started yet' },
  kpi_retiring: { de: 'Rente', en: 'Retiring' },
  kpi_fteInConversion: { de: 'FTE in Umschulung', en: 'FTE in conversion' },
  kpi_fteAvailable: { de: 'FTE verfügbar', en: 'FTE available' },
  fteInConversionShort: { de: 'FTE in Umschulung', en: 'FTE in conversion' },
  fteAvailableShort: { de: 'FTE verfügbar', en: 'FTE available' },
  chart_byQual: { de: 'Nach Qualifikation', en: 'By qualification' },
  chart_byBase: { de: 'Nach Base', en: 'By base' },
  chart_byOre: { de: 'ORE-Priorität (A–C)', en: 'ORE priority (A–C)' },
  chart_pipeline: { de: 'Umschulungs-Pipeline', en: 'Conversion pipeline' },
  chart_convProgress: { de: 'Umschulungs-Fortschritt', en: 'Conversion progress' },
  overallProgress: { de: 'Gesamtfortschritt', en: 'Overall progress' },

  // ---- trainer fields
  f_qual: { de: 'Qualifikation', en: 'Qualification' },
  f_base: { de: 'Base', en: 'Base' },
  f_tlc: { de: 'TLC', en: 'TLC' },
  f_name: { de: 'Name', en: 'Name' },
  f_remark: { de: 'Funktion / Anmerkung', en: 'Function / remark' },
  f_partTime: { de: 'Part-Time', en: 'Part-time' },
  f_sim: { de: 'SIM-Sessions', en: 'SIM sessions' },
  f_lifus: { de: 'LIFUS-Legs', en: 'LIFUS legs' },
  f_ore: { de: 'ORE A–C', en: 'ORE A–C' },
  f_ltc: { de: 'LTC seit', en: 'LTC since' },
  f_tri: { de: 'TRI seit', en: 'TRI since' },
  f_tre: { de: 'TRE seit', en: 'TRE since' },
  f_authority: { de: 'Ausstellende Behörde', en: 'Issuing authority' },
  f_bFrom: { de: 'B ab', en: 'B from' },
  f_conversion: { de: 'Umschulung', en: 'Conversion' },
  f_fte: { de: 'FTE', en: 'FTE' },
  f_aircraft: { de: 'Aircraft', en: 'Aircraft' },
  filterAircraft: { de: 'Aircraft', en: 'Aircraft' },
  stat_aircraft: { de: 'Aktuelles Aircraft', en: 'Current aircraft' },

  trainers_title: { de: 'Trainer & Prüfer', en: 'Trainers & Examiners' },
  addTrainer: { de: 'Trainer hinzufügen', en: 'Add trainer' },
  editTrainer: { de: 'Trainer bearbeiten', en: 'Edit trainer' },
  deleteTrainerConfirm: { de: 'Diesen Trainer wirklich löschen?', en: 'Really delete this trainer?' },
  noTrainers: { de: 'Keine Trainer gefunden.', en: 'No trainers found.' },
  filterBase: { de: 'Base', en: 'Base' },
  filterQual: { de: 'Qual', en: 'Qual' },
  filterOre: { de: 'ORE', en: 'ORE' },
  filterStage: { de: 'Phase', en: 'Stage' },
  showing: { de: 'angezeigt', en: 'showing' },

  // ---- conversion
  conversion_title: { de: 'Umschulung', en: 'Conversion' },
  conv_targetHint: {
    de: 'Ab der 2. Phase wird das Aircraft automatisch auf das Ziel gesetzt.',
    en: 'From the 2nd stage on, aircraft is set to the target automatically.'
  },
  stage: { de: 'Phase', en: 'Stage' },
  status: { de: 'Status', en: 'Status' },
  targetDate: { de: 'Zieltermin', en: 'Target date' },
  note: { de: 'Notiz', en: 'Note' },
  moveNext: { de: 'Nächste Phase', en: 'Next stage' },
  movePrev: { de: 'Zurück', en: 'Previous' },
  boardHint: {
    de: 'Karte antippen zum Bearbeiten · Pfeile verschieben die Phase',
    en: 'Tap a card to edit · arrows move the stage'
  },

  // ---- statistics
  statistics_title: { de: 'Statistik', en: 'Statistics' },
  stat_qual: { de: 'Trainer-Qualifikation', en: 'Trainer qualification' },
  stat_base: { de: 'Base', en: 'Base' },
  stat_ore: { de: 'ORE A–C (Priorität)', en: 'ORE A–C (priority)' },
  stat_authority: { de: 'Ausstellende Behörde', en: 'Issuing authority' },
  stat_partTime: { de: 'Part-Time', en: 'Part-time' },
  stat_function: { de: 'Funktion (Remark)', en: 'Function (remark)' },
  stat_hint: {
    de: 'Live berechnet aus den Trainerdaten (entspricht dem Excel-Tab „Statistik_Daten").',
    en: 'Computed live from trainer data (matches the Excel tab “Statistik_Daten”).'
  },
  category: { de: 'Kategorie', en: 'Category' },
  count: { de: 'Anzahl', en: 'Count' },
  withFunction: { de: 'Office/MGMT/Funktion', en: 'Office/MGMT/function' },
  withoutFunction: { de: 'Ohne Funktion', en: 'Without function' },

  // ---- providers
  providers_title: { de: 'Externe Provider (TR / TRI / TRE)', en: 'External providers (TR / TRI / TRE)' },
  addProvider: { de: 'Provider hinzufügen', en: 'Add provider' },
  editProvider: { de: 'Provider bearbeiten', en: 'Edit provider' },
  noProviders: {
    de: 'Noch keine Provider erfasst. Lege den ersten an.',
    en: 'No providers yet. Add your first one.'
  },
  deleteProviderConfirm: { de: 'Diesen Provider wirklich löschen?', en: 'Really delete this provider?' },
  p_name: { de: 'Anbieter', en: 'Provider' },
  p_types: { de: 'Angebot', en: 'Offering' },
  p_location: { de: 'Standort', en: 'Location' },
  p_authority: { de: 'Zulassung / Behörde', en: 'Approval / authority' },
  p_contact: { de: 'Ansprechpartner', en: 'Contact person' },
  p_email: { de: 'E-Mail', en: 'Email' },
  p_phone: { de: 'Telefon', en: 'Phone' },
  p_website: { de: 'Website', en: 'Website' },
  p_price: { de: 'Preis / Konditionen', en: 'Price / terms' },
  p_capacity: { de: 'Kapazität / Slots', en: 'Capacity / slots' },
  p_status: { de: 'Status', en: 'Status' },
  p_notes: { de: 'Notizen', en: 'Notes' },

  // ---- staff type & planning / assignments
  f_staffType: { de: 'Zugehörigkeit', en: 'Affiliation' },
  staff_internal: { de: 'intern', en: 'internal' },
  staff_external: { de: 'extern', en: 'external' },
  filterStaff: { de: 'Intern/Extern', en: 'Internal/External' },
  planning_title: { de: 'Planung – wer macht was, wo?', en: 'Planning – who does what, where?' },
  planning_hint: {
    de: 'Weise pro Person Provider/Ort für Type Rating, TRI-Kurs, LIFUS und Examiner-Prüfung zu. Zelle antippen zum Bearbeiten.',
    en: 'Assign a provider/location per person for Type Rating, TRI course, LIFUS and examiner check. Tap a cell to edit.'
  },
  planning_noProviders: {
    de: 'Tipp: Lege im Reiter „Provider" Anbieter an – dann kannst du sie hier auswählen. Ein freier Ort geht auch ohne.',
    en: 'Tip: add providers in the “Providers” tab to pick them here. A free-text location also works without.'
  },
  assign: { de: 'zuweisen', en: 'assign' },
  provider: { de: 'Provider', en: 'Provider' },
  location: { de: 'Ort (frei)', en: 'Location (free text)' },
  noProvider: { de: '– kein Provider –', en: '– no provider –' },
  step_tr: { de: 'Type Rating', en: 'Type Rating' },
  step_tri: { de: 'TRI-Kurs', en: 'TRI Course' },
  step_lifus: { de: 'LIFUS', en: 'LIFUS' },
  step_tre: { de: 'Examiner-Prüfung', en: 'Examiner Check' },
  assignmentsFor: { de: 'Zuweisungen für', en: 'Assignments for' },

  // ---- settings
  settings_title: { de: 'Einstellungen', en: 'Settings' },
  language: { de: 'Sprache', en: 'Language' },
  dataMgmt: { de: 'Datenverwaltung', en: 'Data management' },
  exportData: { de: 'Alle Daten exportieren (JSON)', en: 'Export all data (JSON)' },
  importData: { de: 'Daten importieren (JSON)', en: 'Import data (JSON)' },
  importConfirm: {
    de: 'Import ersetzt alle aktuellen Daten. Fortfahren?',
    en: 'Import replaces all current data. Continue?'
  },
  importOk: { de: 'Daten erfolgreich importiert.', en: 'Data imported successfully.' },
  importErr: { de: 'Import fehlgeschlagen: ungültige Datei.', en: 'Import failed: invalid file.' },
  resetData: { de: 'Auf Auslieferungsstand zurücksetzen', en: 'Reset to shipped data' },
  resetConfirm: {
    de: 'Wirklich alle Änderungen verwerfen und Excel-Auslieferungsstand laden?',
    en: 'Really discard all changes and load the shipped Excel data?'
  },
  cloudSync: { de: 'Cloud-Sync', en: 'Cloud sync' },
  cloudNotConfigured: {
    de: 'Noch nicht aktiv. Sobald ein Supabase-Slot frei ist, wird der Sync freigeschaltet – dann gleiche Daten automatisch auf allen Geräten.',
    en: 'Not active yet. Once a Supabase slot is free, sync gets enabled – same data on all devices automatically.'
  },
  versionChangelog: { de: 'Version & Changelog', en: 'Version & changelog' },
  currentVersion: { de: 'Aktuelle Version', en: 'Current version' },
  installHint: { de: 'Als App installieren', en: 'Install as app' },
  installHintText: {
    de: 'Desktop (Chrome/Edge): Symbol in der Adressleiste. iPhone/iPad (Safari): Teilen → „Zum Home-Bildschirm".',
    en: 'Desktop (Chrome/Edge): icon in the address bar. iPhone/iPad (Safari): Share → “Add to Home Screen”.'
  },
  lastSaved: { de: 'Zuletzt gespeichert', en: 'Last saved' },

  // ---- data safety / persistence
  dataSafety: { de: 'Datensicherheit', en: 'Data safety' },
  persistGranted: {
    de: 'Persistenter Speicher: aktiv – der Browser löscht die Daten nicht von selbst (auch nicht bei „Cache leeren").',
    en: 'Persistent storage: on – the browser will not evict data on its own (also survives “clear cache”).'
  },
  persistDenied: {
    de: 'Persistenter Speicher: nicht garantiert – der Browser könnte Daten bei Speicherdruck entfernen.',
    en: 'Persistent storage: not guaranteed – the browser may evict data under storage pressure.'
  },
  persistWarning: {
    de: 'Wichtig: Ein bewusstes „Cookies und Websitedaten löschen" entfernt ALLE lokalen Daten – das übersteht kein lokaler Speicher. Nur der Cloud-Sync sichert alle Daten dagegen ab. Bis dahin: regelmäßig ein Backup herunterladen.',
    en: 'Important: a manual “clear cookies and site data” removes ALL local data – no local storage survives that. Only cloud sync protects everything. Until then: download a backup regularly.'
  },
  backupNow: { de: '⤓ Jetzt Backup herunterladen', en: '⤓ Download backup now' },
  storageUsage: { de: 'Belegt', en: 'Used' },

  // ---- category management (editable taxonomies)
  addCategory: { de: 'Eintrag hinzufügen', en: 'Add entry' },
  manage: { de: 'Verwalten', en: 'Manage' },
  manageStages: { de: 'Phasen bearbeiten', en: 'Edit stages' },
  manageQuals: { de: 'Berechtigungen bearbeiten', en: 'Edit qualifications' },
  manageProviderTypes: { de: 'Angebots-Typen bearbeiten', en: 'Edit offering types' },
  manageProviderStatus: { de: 'Status bearbeiten', en: 'Edit statuses' },
  manageSteps: { de: 'Spalten bearbeiten', en: 'Edit columns' },
  dragHint: { de: 'Ziehen (⠿) oder Pfeile zum Sortieren · Farbe links', en: 'Drag (⠿) or arrows to reorder · colour on the left' },
  categoriesEditableHint: {
    de: 'Balken oben, Werte im Diagramm – die Tabelle darunter entfällt. Berechtigungen/Phasen sind editierbar (umbenennen, Farbe).',
    en: 'Bars above with values in the chart – the duplicate table is gone. Qualifications/stages are editable (rename, colour).'
  }
}

export function translate(lang, key) {
  const entry = DICT[key]
  if (!entry) return key
  return entry[lang] ?? entry.de ?? key
}
