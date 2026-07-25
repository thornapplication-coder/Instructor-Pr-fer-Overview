// Lightweight i18n. Two languages: de (default) and en. t('key') falls back to the
// key itself if missing, so the app never crashes on an untranslated string.
export const LANGS = ['de', 'en']

const DICT = {
  // ---- generic / chrome
  appTitle: { de: 'Trainer & Prüfer Monitoring', en: 'Trainer & Examiner Monitoring' },
  asOf: { de: 'Stand', en: 'as of' },
  update: { de: 'Update', en: 'Update' },
  reload: { de: 'Neu laden', en: 'Reload' },
  saved: { de: 'Gespeichert', en: 'Saved' },
  darkMode: { de: 'Dunkelmodus', en: 'Dark mode' },
  lightMode: { de: 'Hellmodus', en: 'Light mode' },
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
  back: { de: 'Zurück', en: 'Back' },
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
  tab_capacity: { de: 'Kapazität', en: 'Capacity' },
  tab_pilots: { de: 'Other Pilots', en: 'Other Pilots' },
  tab_settings: { de: 'Einstellungen', en: 'Settings' },

  // ---- capacity & timeline
  capacity_title: { de: 'Kapazität & Timeline', en: 'Capacity & timeline' },
  capacity_hint: {
    de: 'FTE je Base (verfügbar vs. in Umschulung, nach Aircraft) und die Zieltermine der Umschulung im Zeitverlauf.',
    en: 'FTE per base (available vs. in conversion, by aircraft) and conversion target dates over time.'
  },
  capacity_byBase: { de: 'FTE-Kapazität je Base', en: 'FTE capacity per base' },
  capacity_byQual: { de: 'FTE-Kapazität je Qualifikation', en: 'FTE capacity per qualification' },
  capacity_byAircraft: { de: 'FTE-Kapazität je Aircraft', en: 'FTE capacity per aircraft' },
  capacity_edit: { de: 'Zieltermine & Umschulung bearbeiten', en: 'Edit target dates & conversion' },
  capacity_editHint: {
    de: 'Phase, Status und Zieltermin je Person direkt hier setzen – die Zeitachse unten und die Warnungen im Dashboard aktualisieren sich sofort.',
    en: 'Set phase, status and target date per person right here – the timeline below and the dashboard alerts update instantly.'
  },
  capacity_hideDone: { de: 'Freigegebene ausblenden', en: 'Hide released' },
  capacity_timeline: { de: 'Zieltermine je Monat', en: 'Target dates per month' },
  capacity_noTargets: {
    de: 'Noch keine Zieltermine gesetzt. Sobald du in der Umschulung Zieltermine vergibst, erscheinen sie hier auf der Zeitachse.',
    en: 'No target dates yet. As soon as you set conversion target dates, they show up here on the timeline.'
  },
  cap_head: { de: 'Köpfe', en: 'Head' },
  // Shown wherever an FTE figure appears, because "FTE" alone was ambiguous:
  // two places still use it for two different groups of people.
  fteDefinition: {
    de: 'FTE = Summe der Personen-FTE (Vollzeit 1,0 · 90 % 0,9 · 80 % 0,8 · 75 % 0,75 …), je Person im Trainer-Dialog überschreibbar. „In Umschulung" zählt nur SEN, TRE, TRI und LTC.',
    en: 'FTE = the sum of the per-person FTE (full time 1.0 · 90% 0.9 · 80% 0.8 · 75% 0.75 …), overridable per person in the trainer dialog. "In conversion" counts SEN, TRE, TRI and LTC only.'
  },
  cap_total: { de: 'FTE gesamt', en: 'FTE total' },
  cap_inConv: { de: 'in Umschulung', en: 'in conversion' },
  cap_avail: { de: 'verfügbar', en: 'available' },

  // ---- overview / KPIs
  kpi_totalTrainers: { de: 'Trainer & Prüfer', en: 'Trainers & Examiners' },
  kpi_released: { de: 'Auf 737 freigegeben', en: 'Released on 737' },
  kpi_inProgress: { de: 'In Umschulung', en: 'In conversion' },
  kpi_notStarted: { de: 'Noch nicht gestartet', en: 'Not started yet' },
  kpi_fteInConversion: { de: 'FTE in Umschulung', en: 'FTE in conversion' },
  kpi_fteAvailable: { de: 'FTE verfügbar', en: 'FTE available' },
  // Names the population behind the conversion FTE tiles, whose total is
  // smaller than the overall one because it covers the conversion quals only.
  fteConvScope: { de: '(Umschulungs-Pool)', en: '(conversion pool)' },
  fteInConversionShort: { de: 'FTE in Umschulung', en: 'FTE in conversion' },
  fteAvailableShort: { de: 'FTE verfügbar', en: 'FTE available' },
  chart_byQual: { de: 'Nach Qualifikation', en: 'By qualification' },
  chart_byBase: { de: 'Nach Base', en: 'By base' },
  chart_byOre: { de: 'ORE-Priorität (A–C)', en: 'ORE priority (A–C)' },
  chart_pipeline: { de: 'Umschulungs-Pipeline', en: 'Conversion pipeline' },
  chart_convProgress: { de: 'Umschulungs-Fortschritt', en: 'Conversion progress' },
  chart_qualByAircraft: { de: 'Qualifikation je Aircraft', en: 'Qualification by aircraft' },
  chart_role: { de: 'Captain / First Officer', en: 'Captain / First Officer' },
  chart_headFteBase: { de: 'Köpfe vs. FTE je Base', en: 'Heads vs. FTE per base' },
  chart_headFteAircraft: { de: 'Köpfe vs. FTE je Aircraft', en: 'Heads vs. FTE per aircraft' },
  metric_heads: { de: 'Köpfe', en: 'Heads' },
  metric_fte: { de: 'FTE', en: 'FTE' },
  headFteHint: {
    de: 'Der helle Balken sind die Köpfe, der dunkle die FTE darin. Der helle Rest ist der Teilzeit-Anteil.',
    en: 'The light bar is the headcount, the solid one the FTE within it. The light remainder is the part-time share.'
  },
  overallProgress: { de: 'Gesamtfortschritt', en: 'Overall progress' },
  chart_trend: { de: 'Fortschritt je Monat', en: 'Progress per month' },
  // ---- plan vs. actual
  plan_title: { de: 'Umschulungs-Ziele (Soll)', en: 'Conversion milestones (plan)' },
  plan_hint: {
    de: 'Ein Ziel je Monat: wie viele bis Ende dieses Monats auf der 737 freigegeben sein sollen. Das Dashboard vergleicht es mit dem Ist-Stand. Der Umschulungs-Pool umfasst derzeit {n} Personen.',
    en: 'One milestone per month: how many should be released on the 737 by the end of it. The dashboard compares that with reality. The conversion pool currently holds {n} people.'
  },
  plan_month: { de: 'Monat', en: 'Month' },
  plan_released: { de: 'Freigegeben (Soll)', en: 'Released (plan)' },
  plan_add: { de: 'Ziel setzen', en: 'Set milestone' },
  plan_remove: { de: 'Ziel löschen', en: 'Remove milestone' },
  chart_planVsActual: { de: 'Soll gegen Ist', en: 'Plan vs. actual' },
  plan_none: {
    de: 'Noch kein Ziel gesetzt. Unter „Kapazität" lässt sich je Monat festlegen, wie viele bis dahin freigegeben sein sollen – dann steht hier, ob ihr auf Kurs seid.',
    en: 'No milestone set yet. On the "Capacity" tab you can define per month how many should be released by then – this card will then say whether you are on course.'
  },
  plan_onTrack: { de: 'Im Plan', en: 'On track' },
  plan_atRisk: { de: 'Knapp hinterher', en: 'Slightly behind' },
  plan_behind: { de: 'Hinterher', en: 'Behind' },
  plan_targetDue: { de: 'Soll ({m})', en: 'Plan ({m})' },
  plan_actual: { de: 'Ist (freigegeben)', en: 'Actual (released)' },
  plan_gap: { de: 'Rückstand', en: 'Shortfall' },
  plan_ahead: { de: 'Vorsprung', en: 'Ahead by' },
  plan_next: { de: 'Nächstes Ziel: {n} bis {m}', en: 'Next milestone: {n} by {m}' },
  plan_slack: {
    de: 'Gelb heißt: bis zu einem Zehntel des Ziels hinterher (mindestens eine Person). Darüber wird es rot.',
    en: 'Amber means: behind by up to a tenth of the milestone (at least one person). Beyond that it turns red.'
  },
  plan_line: { de: 'Soll', en: 'Plan' },
  trend_markHint: {
    de: 'die gestrichelte Linie je Monat – dort sollte die dunkle Fläche stehen.',
    en: 'the dashed line per month – that is where the dark block should reach.'
  },
  trend_hint: {
    de: 'Je Säule ein Monat, von unten nach oben: freigegeben, in Umschulung, noch nicht gestartet. Der Verlauf wird ab sofort mitgeschrieben – jeder Monat hält den zuletzt bekannten Stand fest.',
    en: 'One column per month, bottom to top: released, in conversion, not started yet. The history is recorded from now on – each month keeps the last state known in it.'
  },
  trend_empty: {
    de: 'Der Verlauf beginnt mit diesem Monat. Sobald ein zweiter Monat dazukommt, zeigt die Kachel die Entwicklung – rückwirkend lässt sie sich nicht rekonstruieren, weil bisher nur der jeweils aktuelle Stand gespeichert war.',
    en: 'The history starts with this month. As soon as a second month is added, this card shows the development – it cannot be reconstructed retroactively, because only the current state was ever stored.'
  },

  // ---- dashboard sections + arrange mode
  section_overview: { de: 'Instruktoren & Prüfer Overview', en: 'Instructors & Examiners overview' },
  section_conversion: { de: 'B737 Umschulung', en: 'B737 conversion' },
  moveBack: { de: 'Nach vorne schieben', en: 'Move earlier' },
  moveForward: { de: 'Nach hinten schieben', en: 'Move later' },
  dashArrange: { de: 'Anordnen', en: 'Arrange' },
  dashDone: { de: 'Fertig', en: 'Done' },
  dashArrangeHint: {
    de: 'Kacheln und Diagramme lassen sich per Drag & Drop innerhalb ihrer Gruppe verschieben. Die Reihenfolge wird gespeichert.',
    en: 'Drag & drop tiles and charts to reorder them within their group. The order is saved.'
  },

  // ---- cloud sync
  sync_notConfigured: { de: 'Cloud-Sync nicht eingerichtet', en: 'Cloud sync not set up' },
  sync_notConfiguredHint: {
    de: 'Es ist kein Supabase-Projekt hinterlegt. Die App arbeitet vollständig lokal; Backup/Export in dieser Seite bleibt der Weg, Daten zu sichern.',
    en: 'No Supabase project is configured. The app works fully locally; backup/export on this page remains the way to secure your data.'
  },
  sync_signedOut: { de: 'Nicht angemeldet', en: 'Not signed in' },
  sync_offline: { de: 'Offline', en: 'Offline' },
  sync_syncing: { de: 'Synchronisiert …', en: 'Syncing …' },
  sync_synced: { de: 'Synchron', en: 'In sync' },
  sync_error: { de: 'Sync-Fehler', en: 'Sync error' },
  sync_errBusy: {
    de: 'Ein anderes Gerät hat gleichzeitig geschrieben. Es wurde nichts übertragen – der nächste Abgleich holt es nach.',
    en: 'Another device wrote at the same time. Nothing was sent – the next sync will catch up.'
  },
  sync_lastSync: { de: 'Zuletzt synchronisiert', en: 'Last synced' },
  sync_pending: { de: 'Änderungen noch nicht übertragen', en: 'changes not pushed yet' },
  sync_now: { de: 'Jetzt synchronisieren', en: 'Sync now' },
  sync_signIn: { de: 'Anmelden', en: 'Sign in' },
  sync_signOut: { de: 'Abmelden', en: 'Sign out' },
  sync_password: { de: 'Passwort', en: 'Password' },
  sync_mode: { de: 'Anmelden oder Konto anlegen', en: 'Sign in or create account' },
  sync_signUp: { de: 'Neu registrieren', en: 'Create account' },
  sync_createAccount: { de: 'Konto anlegen', en: 'Create account' },
  sync_signUpHint: {
    de: 'Beim ersten Mal: E-Mail und ein selbst gewähltes Passwort eintragen – das Konto wird damit neu angelegt.',
    en: 'First time: enter an email and a password of your choice – this creates the account.'
  },
  sync_errNoAccount: {
    de: 'E-Mail oder Passwort stimmen nicht – oder es gibt dieses Konto noch nicht. Ich habe oben auf „Neu registrieren" umgeschaltet: einfach nochmal auf „Konto anlegen" tippen.',
    en: 'Wrong email/password – or the account does not exist yet. Switched to “Create account” above: just press it again.'
  },
  sync_errNotConfirmed: {
    de: 'Das Konto muss noch per E-Mail bestätigt werden. Entweder den Link in der Mail öffnen – oder in Supabase unter Authentication → Sign In / Providers → Email die Option „Confirm email" ausschalten.',
    en: 'The account still needs email confirmation. Either open the link in the email – or switch off “Confirm email” in Supabase under Authentication → Sign In / Providers → Email.'
  },
  sync_errSignupOff: {
    de: 'Die Registrierung ist in Supabase deaktiviert. Unter Authentication → Sign In / Providers → Email „Allow new users to sign up" kurz einschalten, Konto anlegen, danach wieder ausschalten.',
    en: 'Sign-ups are disabled in Supabase. Under Authentication → Sign In / Providers → Email switch “Allow new users to sign up” on, create the account, then switch it off again.'
  },
  sync_errExists: {
    de: 'Dieses Konto gibt es bereits. Ich habe oben auf „Anmelden" umgeschaltet – bitte mit dem passenden Passwort anmelden.',
    en: 'That account already exists. Switched to “Sign in” above – please sign in with the matching password.'
  },
  sync_errPassword: {
    de: 'Das Passwort ist zu kurz – bitte mindestens 6 Zeichen verwenden.',
    en: 'Password too short – please use at least 6 characters.'
  },
  sync_errEmail: {
    de: 'Die E-Mail-Adresse hat kein gültiges Format.',
    en: 'That email address is not a valid format.'
  },
  sync_errNetwork: {
    de: 'Keine Verbindung zur Cloud. Internetverbindung prüfen und erneut versuchen.',
    en: 'Could not reach the cloud. Check your connection and try again.'
  },
  sync_signInHint: {
    de: 'Mit E-Mail und Passwort anmelden, um die Daten geräteübergreifend zu synchronisieren.',
    en: 'Sign in with email and password to sync your data across devices.'
  },
  sync_signInOk: { de: 'Angemeldet – Sync läuft.', en: 'Signed in – syncing.' },
  sync_signUpOk: {
    de: 'Registriert. Falls E-Mail-Bestätigung aktiv ist, bitte zuerst den Link in der E-Mail öffnen.',
    en: 'Registered. If email confirmation is enabled, open the link in the email first.'
  },
  sync_signInErr: { de: 'Anmeldung fehlgeschlagen.', en: 'Sign-in failed.' },
  sync_note: {
    de: 'Läuft von allein: beim Start, alle 2 Minuten, beim Zurückwechseln zur App, ein paar Sekunden nach jeder Änderung und noch einmal beim Schließen. Abgeglichen wird je Datensatz – Änderungen an verschiedenen Personen auf verschiedenen Geräten bleiben alle erhalten; nur bei derselben Person auf beiden Geräten gilt die neuere Änderung. Gelöschtes bleibt gelöscht. Lokal gespeichert wird immer, die App bleibt offline-fähig.',
    en: 'Runs on its own: at startup, every 2 minutes, when you return to the app, a few seconds after each change, and once more on closing. It reconciles record by record – edits to different people on different devices all survive; only for the same person on both devices does the newer edit win. Deletions stay deleted. Data is always stored locally, the app stays offline-capable.'
  },

  // ---- other pilots (company line pilots, not trainers)
  pilots_title: { de: 'Other Pilots – Piloten der Firma', en: 'Other pilots – company pilots' },
  pilots_hint: {
    de: 'Linienpiloten der Firma (keine Trainer/Prüfer): mit gültigem B737-Rating, mit abgelaufenem Rating oder mit Boeing-Erfahrung ohne aktuelles Rating.',
    en: 'Company line pilots (not trainers/examiners): holding a valid B737 rating, an expired rating, or Boeing experience without a current rating.'
  },
  pilots_empty: {
    de: 'Noch keine Piloten erfasst. Lege den ersten an oder importiere eine Excel-Datei in den Einstellungen.',
    en: 'No pilots yet. Add the first one or import an Excel file from Settings.'
  },
  pilots_none: { de: 'Keine Piloten gefunden.', en: 'No pilots found.' },
  pilots_overdueHint: {
    de: 'Als gültig markiert, das Datum liegt aber in der Vergangenheit.',
    en: 'Marked as valid, but the date is in the past.'
  },
  addPilot: { de: 'Pilot hinzufügen', en: 'Add pilot' },
  editPilot: { de: 'Pilot bearbeiten', en: 'Edit pilot' },
  deletePilotConfirm: { de: 'Diesen Piloten wirklich löschen?', en: 'Really delete this pilot?' },
  pilotNameRequired: { de: 'Bitte einen Namen eingeben.', en: 'Please enter a name.' },
  f_position: { de: 'Position', en: 'Position' },
  f_comment: { de: 'Anmerkung', en: 'Remark' },
  f_b737Status: { de: 'B737-Status', en: 'B737 status' },
  f_b737Until: { de: 'Gültig bis / abgelaufen am', en: 'Valid until / expired on' },
  f_b737ValidUntil: { de: 'Gültig bis', en: 'Valid until' },
  f_b737ExpiredOn: { de: 'Abgelaufen am', en: 'Expired on' },
  pilotsImport_title: { de: 'Other Pilots aus Excel importieren', en: 'Import other pilots from Excel' },
  pilotsImport_hint: {
    de: 'Spalten werden über die Überschriften erkannt: Name, TLC, Base, Position (Captain/FO), Status (gültig / abgelaufen / Erfahrung) und Datum. Bestehende Piloten werden per TLC (sonst Name) aktualisiert, neue ergänzt.',
    en: 'Columns are matched by header: name, TLC, base, position (captain/FO), status (valid / expired / experience) and date. Existing pilots are updated by TLC (else name), new ones added.'
  },
  pilotsImport_btn: { de: 'Excel/CSV wählen', en: 'Choose Excel/CSV' },

  // ---- cockpit role
  f_role: { de: 'Rolle (Cockpit)', en: 'Role (cockpit)' },
  role_captain: { de: 'Captain', en: 'Captain' },
  role_fo: { de: 'First Officer (FO)', en: 'First Officer (FO)' },
  role_captainShort: { de: 'CPT', en: 'CPT' },
  role_foShort: { de: 'FO', en: 'FO' },

  // ---- deadlines / alerts
  alerts_title: { de: 'Fristen & Warnungen', en: 'Deadlines & alerts' },
  alerts_none: { de: 'Alles im Plan – keine offenen Warnungen.', en: 'All on track – no open alerts.' },
  alert_overdue: { de: 'Zieltermin überfällig', en: 'target overdue' },
  alert_blocked: { de: 'blockiert', en: 'blocked' },
  alert_at_risk: { de: 'gefährdet', en: 'at risk' },
  alert_soon: { de: 'Zieltermin bald fällig', en: 'target due soon' },
  alert_daysLeft: { de: 'Tage', en: 'days' },
  alert_daysOver: { de: 'Tage über', en: 'days over' },
  alert_today: { de: 'heute', en: 'today' },

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
  f_trainerSince: { de: 'Trainer seit', en: 'Trainer since' },
  f_bFrom: { de: 'B ab', en: 'B from' },
  f_conversion: { de: 'Umschulung', en: 'Conversion' },
  f_fte: { de: 'FTE', en: 'FTE' },
  fteAutoHint: {
    de: 'Wird beim Ändern der Part-Time vorbefüllt (VZ = 1), bleibt aber editierbar.',
    en: 'Pre-filled when part-time changes (FT = 1), but stays editable.'
  },
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
  stage: { de: 'Phase', en: 'Stage' },
  status: { de: 'Status', en: 'Status' },
  targetDate: { de: 'Zieltermin', en: 'Target date' },
  clearDate: { de: 'Datum löschen', en: 'Clear date' },
  note: { de: 'Notiz', en: 'Note' },
  moveNext: { de: 'Nächste Phase', en: 'Next stage' },
  movePrev: { de: 'Zurück', en: 'Previous' },
  boardHint: {
    de: 'Karte antippen zum Bearbeiten · Pfeile verschieben die Phase',
    en: 'Tap a card to edit · arrows move the stage'
  },
  convScopeHint: {
    de: 'Umschulung betrifft nur {q}',
    en: 'Conversion applies to {q} only'
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
  month: { de: 'Monat', en: 'Month' },
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
  providerNameRequired: { de: 'Bitte einen Anbieternamen eingeben.', en: 'Please enter a provider name.' },
  deleteProviderAssignedConfirm: {
    de: 'Dieser Provider ist {n}× in der Planung zugewiesen. Beim Löschen werden diese Zuweisungen entfernt. Fortfahren?',
    en: 'This provider is assigned {n}× in planning. Deleting will clear those assignments. Continue?'
  },
  p_name: { de: 'Anbieter', en: 'Provider' },
  p_types: { de: 'Angebot', en: 'Offering' },
  p_courses: { de: 'Kurse', en: 'Courses' },
  p_simVersion: { de: 'SIM Version', en: 'SIM version' },
  addSimVersion: { de: 'SIM Version wählen …', en: 'Choose SIM version …' },
  manageSimVersions: { de: 'SIM Versionen bearbeiten', en: 'Edit SIM versions' },
  p_locations: { de: 'Standorte (ICAO)', en: 'Locations (ICAO)' },
  addIcao: { de: 'ICAO eingeben + Enter', en: 'Enter ICAO + Enter' },
  manageCourses: { de: 'Kurse bearbeiten', en: 'Edit courses' },
  p_location: { de: 'Standort', en: 'Location' },
  p_authority: { de: 'Zulassung / Behörde', en: 'Approval / authority' },
  p_contact: { de: 'Ansprechpartner', en: 'Contact person' },
  p_email: { de: 'E-Mail', en: 'Email' },
  p_phone: { de: 'Telefon', en: 'Phone' },
  p_website: { de: 'Website', en: 'Website' },
  p_price: { de: 'Preis / Konditionen', en: 'Price / terms' },
  p_capacity: { de: 'Kapazität / Konditionen', en: 'Capacity / terms' },
  p_slots: { de: 'Kapazität (Plätze, Anzahl)', en: 'Capacity (slots, number)' },
  p_status: { de: 'Status', en: 'Status' },
  p_notes: { de: 'Notizen', en: 'Notes' },
  prov_capacity: { de: 'Kapazität & Auslastung', en: 'Capacity & utilization' },
  prov_capacityHint: {
    de: 'Aktive Planungs-Zuweisungen je Provider gegenüber der Platz-Kapazität. Kapazität pro Provider im Bearbeiten-Dialog setzen; Zeile antippen zum Bearbeiten.',
    en: 'Active planning assignments per provider vs. the number of slots. Set the capacity per provider in the edit dialog; tap a row to edit.'
  },
  prov_assigned: { de: 'Zugewiesen', en: 'Assigned' },
  prov_slots: { de: 'Kapazität', en: 'Slots' },
  prov_util: { de: 'Auslastung', en: 'Utilization' },

  // ---- staff type & planning / assignments
  f_staffType: { de: 'Zugehörigkeit', en: 'Affiliation' },
  staff_internal: { de: 'intern', en: 'internal' },
  staff_external: { de: 'extern', en: 'external' },
  filterStaff: { de: 'Intern/Extern', en: 'Internal/External' },
  planning_title: { de: 'Planung – wer macht was, wo?', en: 'Planning – who does what, where?' },
  planning_view: { de: 'Ansicht', en: 'View' },
  planning_viewTable: { de: 'Tabelle', en: 'Table' },
  planning_viewCalendar: { de: 'Kalender', en: 'Calendar' },
  planning_calendar: { de: 'Kurskalender – Kursstarts je Monat', en: 'Course calendar – course starts per month' },
  planning_calendarStarts: { de: 'Kursstarts', en: 'course starts' },
  planning_calendarHint: {
    de: 'Jeder Eintrag zeigt Kürzel und Kurs am Starttermin. Termine werden in der Tabelle bzw. im Zuweisungs-Dialog gesetzt.',
    en: 'Each entry shows the TLC and course on its start date. Dates are set in the table / assignment dialog.'
  },
  planning_calendarEmpty: {
    de: 'Noch keine Termine gesetzt – sobald ein Kurs ein Datum hat, erscheint er hier.',
    en: 'No dates set yet – as soon as a course has a date it shows up here.'
  },
  resetFilters: { de: 'Filter zurücksetzen', en: 'Reset filters' },
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
  downloads: { de: 'Downloads & Export', en: 'Downloads & export' },
  downloadsHint: {
    de: 'Pro Seite wählen: als PDF oder Excel herunterladen oder direkt drucken. Alle Exporte sind gebrandet und enthalten die aktuellen Daten.',
    en: 'Choose per page: download as PDF or Excel, or print directly. All exports are branded and contain the current data.'
  },
  print: { de: 'Drucken', en: 'Print' },
  pdfErr: { de: 'Export fehlgeschlagen. Bitte erneut versuchen.', en: 'Export failed. Please try again.' },
  pdfPrintFellBack: {
    de: 'Druckfenster wurde blockiert – die PDF wurde stattdessen heruntergeladen.',
    en: 'Print window was blocked – the PDF was downloaded instead.'
  },
  dataMgmt: { de: 'Datenverwaltung', en: 'Data management' },
  exportData: { de: 'Alle Daten exportieren (JSON)', en: 'Export all data (JSON)' },
  importData: { de: 'Daten importieren (JSON)', en: 'Import data (JSON)' },
  importConfirm: {
    de: 'Import ersetzt alle aktuellen Daten. Fortfahren?',
    en: 'Import replaces all current data. Continue?'
  },
  importOk: { de: 'Daten erfolgreich importiert.', en: 'Data imported successfully.' },
  importErr: { de: 'Import fehlgeschlagen: ungültige Datei.', en: 'Import failed: invalid file.' },
  saveErr: {
    de: 'Speichern fehlgeschlagen – Speicher voll oder blockiert. Bitte ein Backup exportieren.',
    en: 'Save failed – storage full or blocked. Please export a backup.'
  },
  resetData: { de: 'Auf Auslieferungsstand zurücksetzen', en: 'Reset to shipped data' },
  xlsImport_title: { de: 'Trainer aus Excel/CSV importieren', en: 'Import trainers from Excel/CSV' },
  xlsImport_hint: {
    de: 'Aktualisierte Liste (.xlsx / .xls / .csv) hochladen. Spalten werden über die Überschriften erkannt (Name, TLC, Base, Qualifikation, Part-Time, ORE, Behörde, LTC/TRI/TRE …). Bestehende Trainer werden per TLC (sonst Name) aktualisiert, neue ergänzt – Umschulung & Planung bleiben erhalten.',
    en: 'Upload an updated list (.xlsx / .xls / .csv). Columns are matched by header (Name, TLC, Base, qualification, part-time, ORE, authority, LTC/TRI/TRE …). Existing trainers are updated by TLC (else name), new ones added – conversion & planning are preserved.'
  },
  xlsImport_btn: { de: 'Datei auswählen', en: 'Choose file' },
  xlsImport_confirm: {
    de: '{n} Zeilen erkannt. Trainerdaten jetzt aktualisieren bzw. ergänzen?',
    en: '{n} rows detected. Update / add trainer data now?'
  },
  xlsImport_ok: {
    de: 'Import erfolgreich: {u} aktualisiert, {a} neu hinzugefügt.',
    en: 'Import successful: {u} updated, {a} newly added.'
  },
  xlsImport_none: {
    de: 'Keine Trainerzeilen erkannt. Prüfe die Spaltenüberschriften (mind. „Name" und „TLC").',
    en: 'No trainer rows detected. Check the column headers (at least “Name” and “TLC”).'
  },
  xlsImport_err: { de: 'Import fehlgeschlagen: Datei konnte nicht gelesen werden.', en: 'Import failed: could not read the file.' },
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
  deleteCategoryConfirm: {
    de: 'Diese Kategorie wirklich löschen? Bestehende Einträge behalten den Wert, verlieren aber Farbe/Reihenfolge.',
    en: 'Really delete this category? Existing records keep the value but lose colour/order.'
  },
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
