// Single source of truth for the app version and its changelog.
// Rule: every push is a new version, starting at 1.0.0 (semantic versioning).
//   - MAJOR (x.0.0): large reworks / breaking changes
//   - MINOR (1.x.0): new features / tabs
//   - PATCH (1.0.x): fixes, small tweaks, data updates
// Keep this in sync with package.json "version".
export const APP_VERSION = '1.14.0'
export const APP_BUILD_DATE = '2026-07-24'
export const COPYRIGHT = '© Copyright by Patrick Thorn'

// Newest entry first. Shown in Settings → "Version & Changelog".
export const CHANGELOG = [
  {
    version: '1.14.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Neuer Reiter „Other Pilots" (vor den Einstellungen): Linienpiloten der Firma – keine Trainer/Prüfer – mit gültigem B737-Rating, abgelaufenem Rating oder Boeing-Erfahrung.',
        'Je Pilot: Name, TLC, Base, Position (Captain / First Officer), B737-Status und das Datum („gültig bis" bzw. „abgelaufen am") sowie eine Anmerkung.',
        'Piloten sind vollständig editierbar: hinzufügen, bearbeiten, löschen – dazu Suche, Filter nach Base/Position/Status, sortierbare Spalten und Zähler je Status.',
        'Import aus Excel/CSV in den Einstellungen: Spalten werden über die Überschriften erkannt (DE/EN), bestehende Piloten werden per TLC (sonst Name) aktualisiert. Fehlt der Status, wird er aus dem Datum abgeleitet.',
        'Export als PDF (nach B737-Status gruppiert) und als Excel – wie gewohnt in den Einstellungen unter „Downloads".',
        'Ein als „gültig" markiertes Rating mit einem Datum in der Vergangenheit wird rot mit ⚠ hervorgehoben.',
        'Die Piloten sind bewusst von den Trainern getrennt: sie fließen in keine Trainer-Statistik, in die Umschulung oder die Kapazität ein.'
      ],
      en: [
        'New “Other Pilots” tab (before Settings): company line pilots – not trainers/examiners – holding a valid B737 rating, an expired rating, or Boeing experience.',
        'Per pilot: name, TLC, base, position (captain / first officer), B737 status and the date (“valid until” / “expired on”), plus a remark.',
        'Pilots are fully editable: add, edit, delete – with search, filters by base/position/status, sortable columns and per-status counters.',
        'Excel/CSV import in Settings: columns are matched by header (DE/EN), existing pilots are updated by TLC (else name). A missing status is derived from the date.',
        'Export as PDF (grouped by B737 status) and as Excel – as usual under “Downloads” in Settings.',
        'A rating marked “valid” whose date is already in the past is highlighted in red with ⚠.',
        'Pilots are deliberately kept apart from the trainers: they never feed the trainer statistics, the conversion or the capacity figures.'
      ]
    }
  },
  {
    version: '1.13.2',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        'Wichtig: In Dialogen konnte man nur ein Zeichen tippen – danach sprang der Cursor auf das ✕. Betraf Ort/Notiz in der Planung und alle Listen-Editoren (Phasen, Berechtigungen, Spalten, Kurse, SIM Versionen, Status). Behoben.',
        'Planung: die Umschaltung „Tabelle / Kalender" war im Hellmodus praktisch unsichtbar (weiß auf weiß) – jetzt deutlich sichtbar.',
        'Drucken: Kalender, Marken und Farbflächen kamen weiß auf weiß aus dem Drucker. Jetzt werden die Farben gedruckt; Kopfzeile, Reiter und Filterleisten erscheinen nicht mehr im Ausdruck.',
        'Provider: das ⚙ neben „Kurse" konnte bei knappem Danebenklicken versehentlich einen Kurs an-/abwählen. Außerdem wird eine im Dialog gelöschte Kategorie jetzt sauber aus dem Provider entfernt, statt als kryptische ID gespeichert zu werden.',
        'Dashboard-Anordnen: neben Drag & Drop gibt es jetzt ‹ ›-Buttons – dadurch auch auf iPhone/iPad und per Tastatur bedienbar. Der Verschiebe-Knopf überdeckt die „Gesamt"-Zahl nicht mehr.',
        'Excel-Import: beim Reimport eines eigenen Exports wurde die Qualifikation als Text statt als Kategorie gespeichert – die Person fiel dadurch aus der Umschulung. Behoben.',
        'Kapazität: „in Umschulung" zählt nur noch SEN/TRE/TRI/LTC, damit Tabelle und FTE-Anzeige oben übereinstimmen.',
        'Behörde: „EASA_Austria" und „EASA: Austria" werden jetzt ebenfalls korrekt auf das Land gekürzt.',
        'Neue Trainer starten in der ersten Phase der Pipeline – auch wenn die Standard-Phasen umbenannt oder gelöscht wurden.',
        'Bessere Lesbarkeit: „FO"-Marke mit ausreichendem Kontrast; Tabellenzeilen zeigen jetzt einen Tastatur-Fokusrahmen und werden von Screenreadern wieder als Tabelle vorgelesen.'
      ],
      en: [
        'Important: dialogs accepted only one character before the cursor jumped to the ✕. This affected location/note in Planning and every list editor (stages, qualifications, columns, courses, SIM versions, statuses). Fixed.',
        'Planning: the “Table / Calendar” switch was effectively invisible in light mode (white on white) – now clearly visible.',
        'Printing: calendars, badges and colour fills printed white on white. Colours now print, and the header, tabs and filter bars are excluded from the printout.',
        'Providers: the ⚙ next to “Courses” could toggle a course when narrowly mis-clicked. A category deleted from inside the dialog is now removed from the provider instead of being saved as a cryptic id.',
        'Dashboard arrange: ‹ › buttons alongside drag & drop, so it works on iPhone/iPad and by keyboard. The move control no longer covers the “Total” figure.',
        'Excel import: re-importing our own export stored the qualification as text rather than a category, dropping the person out of the conversion. Fixed.',
        'Capacity: “in conversion” counts SEN/TRE/TRI/LTC only, so the table and the FTE figures above agree.',
        'Authority: “EASA_Austria” and “EASA: Austria” are now shortened to the country as well.',
        'New trainers start in the pipeline’s first stage – even when the default stages were renamed or deleted.',
        'Readability: the “FO” badge now has sufficient contrast; table rows show a keyboard focus ring and are announced as a table again by screen readers.'
      ]
    }
  },
  {
    version: '1.13.1',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        'Provider: die Buttons „Kurse bearbeiten", „SIM Versionen bearbeiten" und „Status bearbeiten" liegen nicht mehr in der Toolbar. Ausgewählt wird direkt im Detail-Fenster; die Listen lassen sich dort über ein kleines ⚙ neben dem Feld erweitern.',
        'Kapazität: A320 und B737 werden in „FTE-Kapazität je Aircraft" immer angezeigt – auch wenn überall 0 steht.',
        'Trainer: bei „Ausstellende Behörde" wird das „EASA"-Präfix weggelassen, es steht nur noch das Land (z. B. „Austria"). Gilt für Tabelle, Dashboard-Statistik und alle Exporte.'
      ],
      en: [
        'Providers: the “Edit courses”, “Edit SIM versions” and “Edit statuses” buttons no longer sit in the toolbar. Selection happens in the detail dialog, where a small ⚙ next to each field extends the list.',
        'Capacity: A320 and B737 always appear in “FTE capacity per aircraft” – even when everything is 0.',
        'Trainers: the issuing authority drops the “EASA” prefix and shows the country only (e.g. “Austria”). Applies to the table, the dashboard statistic and every export.'
      ]
    }
  },
  {
    version: '1.13.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Planung: neuer Kurskalender – Monatsansicht mit allen Kursstarts (Kürzel + Kurs am Starttermin), umschaltbar über „Tabelle / Kalender". Im PDF wird der Kalender je Monat als eigene Übersicht ausgegeben.',
        'Planung zeigt garantiert alle Trainer – auch neu hinzugefügte. Ein Zähler „x / y angezeigt" und „Filter zurücksetzen" machen sofort sichtbar, wenn ein Filter etwas ausblendet.',
        'Provider: Spalte „Zulassung/Behörde" entfernt.',
        'Provider: neue Spalte „SIM Version" (Dropdown mit leerem Eintrag, Mehrfachauswahl – NG, MAX …). Die Auswahlliste ist über „SIM Versionen bearbeiten" erweiterbar.',
        'Kapazität: neue Statistik „FTE-Kapazität je Aircraft" (A320 / B737).',
        'Umschulung berücksichtigt nur noch SEN, TRE, TRI und LTC – SFI und TKI sind aus Board, KPIs, Timeline und Umschulungs-Export ausgenommen (in der Planung und den Kapazitätstabellen bleiben sie enthalten).'
      ],
      en: [
        'Planning: new course calendar – a monthly view of all course starts (TLC + course on the start date), switchable via “Table / Calendar”. The PDF renders the calendar as a per-month overview.',
        'Planning always lists every trainer, including newly added ones. An “x / y showing” counter and a “Reset filters” button make it obvious when a filter hides someone.',
        'Providers: the “authority” column has been removed.',
        'Providers: new “SIM version” column (dropdown with an empty entry, multi-select – NG, MAX …). The list can be extended via “Edit SIM versions”.',
        'Capacity: new “FTE capacity per aircraft” statistic (A320 / B737).',
        'Conversion now covers SEN, TRE, TRI and LTC only – SFI and TKI are excluded from the board, KPIs, timeline and conversion export (they remain in planning and the capacity tables).'
      ]
    }
  },
  {
    version: '1.12.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Neu bei den Personen: Rolle „Captain" oder „First Officer (FO)" – auswählbar im Bearbeiten-Dialog, als farbige CPT-/FO-Marke in der Tabelle und auf den Umschulungs-Karten, plus eigener Filter. Standard ist Captain; M7H und T9J sind als FO hinterlegt.',
        'Dashboard neu gegliedert: „Instruktoren & Prüfer Overview" und „B737 Umschulung" als eigene Rubriken.',
        'Dashboard ist jetzt editierbar: über „Anordnen" lassen sich Kacheln und Diagramme per Drag & Drop innerhalb ihrer Gruppe verschieben – die Reihenfolge wird gespeichert.',
        'Instruktoren-Kachel aufgeteilt in „Instruktoren (TRI)" und „Instruktoren (LTC)"; neue Kachel „Instruktoren (SFI/TKI)". Reihenfolge durchgängig SEN → TRE → TRI → LTC → SFI → TKI, jede Person zählt genau einmal.',
        'Neue Statistik „Qualifikation je Aircraft" (A320/B737) und neues Diagramm „Captain / First Officer".',
        '„Fristen & Warnungen" wurde vom Dashboard entfernt.',
        'Rolle ist auch in den Trainer-Exporten (PDF/Excel) enthalten und wird beim Excel-/CSV-Import übernommen.'
      ],
      en: [
        'New on persons: role “Captain” or “First Officer (FO)” – selectable in the edit dialog, shown as a colour-coded CPT/FO badge in the table and on conversion cards, plus its own filter. Captain is the default; M7H and T9J are set to FO.',
        'Dashboard restructured: “Instructors & Examiners overview” and “B737 conversion” as separate sections.',
        'The dashboard is now editable: use “Arrange” to drag & drop tiles and charts within their group – the order is saved.',
        'Instructor tile split into “Instructors (TRI)” and “Instructors (LTC)”; new “Instructors (SFI/TKI)” tile. Consistent order SEN → TRE → TRI → LTC → SFI → TKI, each person counted exactly once.',
        'New “Qualification by aircraft” statistic (A320/B737) and a new “Captain / First Officer” chart.',
        '“Deadlines & alerts” removed from the dashboard.',
        'The role is included in the trainer exports (PDF/Excel) and picked up by the Excel/CSV import.'
      ]
    }
  },
  {
    version: '1.11.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Datenverlust behoben: selbst angelegte Planungsspalten (eigene Schritte) gehen beim Neuladen oder Import nicht mehr verloren.',
        'Mehrere Tabs/Fenster: Änderungen werden nicht mehr von einem älteren offenen Tab überschrieben; fehlgeschlagene Speicherungen (voller/gesperrter Speicher) werden jetzt angezeigt statt still verschluckt.',
        'Qualifikationen und Kurse erscheinen überall mit ihrem Namen statt mit interner ID – in Tabellen, Board, Diagrammen, Suche und allen PDF-/Excel-Exporten.',
        'Umschulungs-Phasen: „nicht gestartet" und „freigegeben" richten sich nach der Position der Phase, nicht nach festen Namen – Phasen umbenennen/löschen bricht KPIs, Warnungen und das Board nicht mehr.',
        '„Freigegeben" ↔ Status „erledigt" ist jetzt in allen Editoren konsistent (Board, Kapazitäts-Tabelle, Detail-Dialog) inkl. Zurücksetzen beim Verlassen der letzten Phase.',
        'Kapazität: Trainer in Rente zählen nicht mehr als „verfügbare FTE" – konsistent mit Board und Timeline.',
        'Import robuster: deutsche Datumsangaben (TT.MM.JJJJ) und Dezimalkomma (0,8) werden korrekt gelesen, zweistellige Jahre richtig zugeordnet, die FTE-Spalte übernommen und Titel-/Kopfzeilen über der Tabelle übersprungen.',
        'Excel-Export gegen Formel-Einschleusung abgesichert; leere Planungszellen erscheinen im Export leer statt „[offen]".',
        'Provider löschen entfernt jetzt auch die zugehörigen Planungs-Zuweisungen (mit Warnung, wenn welche bestehen).',
        'Bedienung per Tastatur: Tabellenzeilen, Sortier-Überschriften und Dialoge sind jetzt per Tastatur bedienbar (Fokus im Dialog, Escape schließt); Drag & Drop funktioniert nun auch in Firefox.',
        'Kategorien löschen fragt jetzt nach; Dashboard-PDF erzeugt kein leeres Dokument mehr, sondern fällt auf die Tabellenansicht zurück.'
      ],
      en: [
        'Fixed data loss: self-added planning columns (custom steps) are no longer dropped on reload or import.',
        'Multiple tabs/windows: edits are no longer overwritten by an older open tab; failed saves (full/blocked storage) are now surfaced instead of silently swallowed.',
        'Qualifications and courses now show their name everywhere instead of an internal id – in tables, board, charts, search and all PDF/Excel exports.',
        'Conversion stages: “not started” and “released” are derived from stage position, not fixed names – renaming/deleting stages no longer breaks KPIs, alerts or the board.',
        '“Released” ↔ status “done” is now consistent across all editors (board, capacity table, detail dialog), including resetting when leaving the final stage.',
        'Capacity: retiring trainers no longer count as “available FTE” – consistent with the board and timeline.',
        'More robust import: German dates (DD.MM.YYYY) and decimal commas (0.8) read correctly, two-digit years mapped correctly, the FTE column applied, and title/header rows above the table skipped.',
        'Excel export hardened against formula injection; empty planning cells now export blank instead of “[open]”.',
        'Deleting a provider now also clears its planning assignments (with a warning when some exist).',
        'Keyboard support: table rows, sortable headers and dialogs are now keyboard-operable (focus trapped in dialog, Escape closes); drag & drop now works in Firefox too.',
        'Deleting categories now asks for confirmation; the dashboard PDF no longer produces a blank document but falls back to the table view.'
      ]
    }
  },
  {
    version: '1.10.4',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: ['Umschulungs-Board: zusätzlicher horizontaler Scrollbalken oberhalb der Spalten – seitwärts scrollen ohne erst ganz nach unten zu müssen.'],
      en: ['Conversion board: an extra horizontal scrollbar above the columns – scroll sideways without going all the way down first.']
    }
  },
  {
    version: '1.10.3',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: ['Diagramm-Legenden: lange Beschriftungen (z. B. „Office/MGMT/Funktion") brechen jetzt innerhalb der Karte um – der Wert wird nicht mehr abgeschnitten.'],
      en: ['Chart legends: long labels (e.g. “Office/MGMT/Funktion”) now wrap inside the card – the value is no longer clipped.']
    }
  },
  {
    version: '1.10.2',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        'Umschulung: der funktionslose A320→B737-Regler oben wurde entfernt (Aircraft wird pro Trainer gesetzt).',
        'Drucken: der Hinweis „Fenster blockiert – als PDF geladen" erscheint jetzt bei allen Seiten, nicht nur beim Dashboard.',
        'Import robuster: Anmerkungen wie „Senior 737 Trainer" führen nicht mehr dazu, dass eine Zeile übersprungen wird.'
      ],
      en: [
        'Conversion: removed the non-functional A320→B737 selector at the top (aircraft is set per trainer).',
        'Print: the “window blocked – downloaded as PDF” hint now appears for every page, not just the dashboard.',
        'More robust import: remarks like “Senior 737 Trainer” no longer cause a row to be skipped.'
      ]
    }
  },
  {
    version: '1.10.1',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: ['Dashboard-PDF passt jetzt vollständig auf eine Seite (statt auf zwei).'],
      en: ['The dashboard PDF now fits entirely on a single page (instead of two).']
    }
  },
  {
    version: '1.10.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Dashboard-PDF übernimmt jetzt das genaue Layout des Desktop-Dashboards (KPI-Kacheln + Diagramme) – auch beim Export vom iPhone/iPad wird das Desktop-Layout verwendet.'
      ],
      en: [
        'The dashboard PDF now mirrors the exact desktop dashboard layout (KPI tiles + charts) – the desktop layout is used even when exporting from iPhone/iPad.'
      ]
    }
  },
  {
    version: '1.9.3',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        'Fehler behoben: Beim erneuten Import eines aus der App exportierten Excels wurde fälschlich ein „Copyright"-Trainer angelegt – das passiert nicht mehr.',
        '„Drucken" öffnet jetzt zuverlässig (auch auf iPhone/iPad/Safari); falls das Fenster blockiert wird, lädt die PDF herunter und es erscheint ein Hinweis.',
        'Excel-Exporte vollständig lokalisiert (Datum + „Stand"/„as of" je Sprache, Datum ohne Uhrzeit); Dateinamen mit lokalem Datum.',
        'Export-Buttons zeigen den laufenden Export an; klare Fehlermeldung, wenn ein Export fehlschlägt.',
        'Kleinere Aufräumarbeiten (Darkmode-Druckbutton, gemeinsame Marken-/Farbquelle, Speicher-Freigabe).'
      ],
      en: [
        'Fixed: re-importing an Excel that was exported from the app wrongly added a “Copyright” trainer – no longer happens.',
        'Print now opens reliably (incl. iPhone/iPad/Safari); if the window is blocked, the PDF downloads and a hint is shown.',
        'Excel exports fully localized (date + “Stand”/“as of” by language, date without time); filenames use the local date.',
        'Export buttons show which export is running; clear error message when an export fails.',
        'Minor cleanups (dark-mode print button, shared brand/colour source, memory release).'
      ]
    }
  },
  {
    version: '1.9.2',
    date: '2026-07-24',
    type: 'patch',
    changes: {
      de: [
        'FTE und Aircraft je Trainer sind jetzt direkt editierbar (nicht mehr schreibgeschützt). FTE wird beim Ändern der Part-Time weiterhin vorbefüllt, kann aber überschrieben werden.',
        'Base ist jetzt ein Dropdown aller bekannten Bases – alphabetisch, mit leerer Zelle ganz oben.'
      ],
      en: [
        'FTE and aircraft per trainer are now directly editable (no longer read-only). FTE is still pre-filled when part-time changes but can be overridden.',
        'Base is now a dropdown of all known bases – alphabetical, with an empty entry at the top.'
      ]
    }
  },
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
