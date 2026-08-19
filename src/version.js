// Single source of truth for the app version and its changelog.
// Rule: every push is a new version, starting at 1.0.0 (semantic versioning).
//   - MAJOR (x.0.0): large reworks / breaking changes
//   - MINOR (1.x.0): new features / tabs
//   - PATCH (1.0.x): fixes, small tweaks, data updates
// Keep this in sync with package.json "version".
export const APP_VERSION = '1.54.0'
export const APP_BUILD_DATE = '2026-08-19'
export const COPYRIGHT = '© Copyright by Patrick Thorn'

// Newest entry first. Shown in Settings → "Version & Changelog".
export const CHANGELOG = [
  {
    version: '1.54.0',
    date: '2026-08-19',
    type: 'minor',
    changes: {
      de: [
        'Wartung: Eine Startprüfung bringt den Arbeitsstand vor jeder Sitzung auf den Stand des Servers. Sitzungen sind wiederholt auf einem alten Abbild vom 27.07. gestartet — Stand 1.35.1 — was für sich genommen nur veraltet ist; gefährlich wurde es dadurch, dass es wie „unversicherte Änderungen" aussah und ein Commit darauf die App um achtzehn Versionen zurückgeworfen hätte.',
        'Die Prüfung holt, legt Vorhandenes in einen Stash (nichts wird gelöscht) und spult nur vorwärts. Echte lokale Arbeit bleibt unangetastet: ein Vorspulen kann keinen Commit überschreiben, und wenn es nicht geht, sagt sie es und lässt alles stehen.'
      ],
      en: [
        'Housekeeping: a start-up check brings the workspace up to the server state before each session. Sessions repeatedly began on an old image from 27 July - v1.35.1 - which on its own is merely stale; what made it dangerous is that it looked like "uncommitted changes", and committing them would have rolled the app back eighteen versions.',
        'The check fetches, puts anything present into a stash (nothing is discarded) and only fast-forwards. Genuine local work is left alone: a fast-forward cannot overwrite a commit, and where it cannot run it says so and changes nothing.'
      ]
    }
  },
  {
    version: '1.53.0',
    date: '2026-08-19',
    type: 'minor',
    changes: {
      de: [
        'Die Schriftart kommt jetzt von dieser Seite statt von Google. Offline konnte das Google-Stylesheet nicht laden — die Oberfläche fiel auf die Systemschrift zurück, und jede Breite in dieser App ist gegen Mulish gemessen, bis hin zur Seitenzahl des PDF-Exports. Außerdem ging bei jedem Aufruf die IP-Adresse des Lesers an Google, aus einem Werkzeug mit den Namen von Kollegen. Vier Dateien, 118 KB, im Offline-Speicher.',
        'Tippziele: Von 25 zu kleinen Bedienelementen sind alle auf 44 px gebracht. Wo Platz war, ist der Knopf gewachsen (Kopfzeile, Ansichtsumschalter, Schaltflächen, Formularfelder). Wo die Breite auf den Pixel festgelegt ist, wächst nur die tastbare Fläche — der Knopf zeichnet weiter 30×26, der Finger bekommt 44.',
        'Phasen bekommen ihre Farbe jetzt aus der Position. Eine siebte Phase kam vorher burgunderrot heraus und stand damit irgendwo in der Reihe; die Hell-nach-Dunkel-Ordnung war dahin. Der Farbwähler in der Phasen-Verwaltung ist weg — er bot eine Wahl an, die der Speicher überschrieben hat.',
        'Aufgeräumt: 40 unbenutzte Wörterbuch-Einträge, 24 tote CSS-Regeln und 6 Funktionen ohne Leser. Kein Verhalten ändert sich, die nächste Änderung wird leichter.'
      ],
      en: [
        'The typeface now comes from this site instead of Google. Offline the Google stylesheet could not load, the interface fell back to the system font, and every width in this app is measured against Mulish - down to the page count of the PDF export. It also sent the reader\'s IP address to Google on every load of a tool holding colleagues\' names. Four files, 118 KB, in the offline cache.',
        'Touch targets: all 25 undersized controls now reach 44px. Where there was room the button grew (top bar, view switch, buttons, form fields). Where the width is pinned to the pixel only the hit area grew - the button still draws 30x26, the finger gets 44.',
        'A conversion phase takes its colour from its position now. A seventh phase used to come out plain burgundy and sat anywhere in the sequence, which is the light-to-dark ordering gone. The colour picker in the phase editor is gone with it - it offered a choice the store overruled.',
        'Cleared out: 40 unused dictionary entries, 24 dead CSS rules and 6 functions with no reader. Nothing behaves differently; the next change is easier.'
      ]
    }
  },
  {
    version: '1.52.0',
    date: '2026-08-19',
    type: 'minor',
    changes: {
      de: [
        'FTE steht in der Trainer-Liste jetzt mit Komma: „0,8" statt „0.8". Auf demselben Bildschirm stand daneben „44,7" — zwei Schreibweisen für dieselbe Art Zahl, genau der Fehler, den der Changelog schon einmal behoben geglaubt hat. Betrifft auch das Trainer-PDF und den Excel-Export.',
        'Die drei Kapazitäts-Tabellen lassen sich am Handy wieder sortieren. Unterhalb von 1000 px verschwindet die Kopfzeile, und mit ihr war das Sortieren unerreichbar — die Auswahlliste, die jede andere Karten-Tabelle dafür hat, fehlte hier.',
        'Wer eine Berechtigung trägt, die selbst „extern" heißt (TRE extern / TRI extern), steht nicht mehr in der Planung. Das war die letzte Ansicht, die nur nach der Zugehörigkeit gefragt hat.',
        '„Jetzt aktualisieren" landet zuverlässig auf der neuen Fassung. Nach einem harten Neuladen hat die Schaltfläche die neue Version zwar aktiviert, die Seite aber nicht neu geladen — und genau zu einem harten Neuladen rät die Seite, wenn sie alt aussieht.',
        'Der Nur-Lese-Link gibt die Benutzer-Kennung nicht mehr mit heraus: der Lesezugriff ist auf die Felder eingeschränkt, die die App tatsächlich liest.',
        'README und Arbeitsnotizen stimmen wieder. Die Reiter-Tabelle beschrieb eine App von vor 48 Versionen, der Cloud-Sync-Abschnitt versprach eine Rückfrage bei Konflikten, die es seit 1.16.0 nicht mehr gibt, und der geteilte Lese-Zugang kam in keiner Datei vor.'
      ],
      en: [
        'FTE on the trainer list now uses the reader\'s notation - "0,8" in German, not "0.8". The dashboard next to it already said "44,7": two notations for one kind of figure, the very defect the changelog once recorded as fixed. The trainer PDF and the Excel export follow.',
        'The three capacity tables can be sorted on a phone again. Below 1000px the header row goes and sorting went with it - the picker every other card table has was missing here.',
        'Somebody on a grade that says "extern" in its own name (TRE extern / TRI extern) is out of the planning grid. It was the last view still asking only about the affiliation.',
        '"Update now" reliably lands on the new build. After a hard reload the button activated the new version but did not reload the page - and a hard reload is exactly what the page suggests when it looks stale.',
        'The read-only link no longer hands out the user id: anonymous read is restricted to the fields the app actually reads.',
        'The README and the working notes are true again. The tab table described the app of 48 versions ago, the cloud-sync section promised a conflict prompt that has not existed since 1.16.0, and the shared read-only access appeared in no file at all.'
      ]
    }
  },
  {
    version: '1.51.0',
    date: '2026-08-19',
    type: 'minor',
    changes: {
      de: [
        'Neue Karte auf dem Dashboard: „Externe & Nicht-Trainer" — TRE extern, TRI extern, No Trainer und EIS Pilot, jede Gruppe mit Kopfzahl und FTE.',
        'Als Zahlen, nicht als Balken. Am Ende des Berechtigungs-Diagramms standen die vier als leere Streifen, und ein leerer Streifen sagt nicht „keiner" — er sieht aus wie ein Diagramm, das nicht geladen hat. Ein Balken hat für Nichts keine Länge; eine Zahl schon.',
        'Zwei Zahlen je Gruppe, weil sie verschiedene Fragen beantworten: vier externe Instruktoren in Teilzeit sind vier Köpfe und zwei FTE — und geplant wird mit der zweiten.',
        'Eine Gruppe bei null bleibt stehen und tritt nur zurück. Welche der vier leer ist, ist selbst die Auskunft.',
        'Im Dashboard-PDF steht dieselbe Aufstellung als Tabelle, mit Summenzeile.',
        'Die Karte lässt sich wie jede andere per „⠿ Anordnen" verschieben.'
      ],
      en: [
        'A new dashboard card: "External & non-trainers" - TRE extern, TRI extern, No Trainer and EIS Pilot, each group with its head count and its FTE.',
        'As figures, not bars. At the tail of the qualification chart the four drew empty tracks, and an empty track does not say "none" - it looks like a chart that failed to load. A bar has no length for nothing; a number does.',
        'Two figures per group, because they answer different questions: four external instructors on part time are four people and two FTE - and it is the second one that plans.',
        'A group at zero stays visible and merely steps back. Which of the four is empty is itself the information.',
        'The dashboard PDF carries the same breakdown as a table, with a total row.',
        'The card can be moved like any other under "⠿ Anordnen".'
      ]
    }
  },
  {
    version: '1.50.0',
    date: '2026-08-19',
    type: 'minor',
    changes: {
      de: [
        'Bei „extern" stehen ORE, Seniorität und Umschulung nicht mehr auf der Karte. Alle drei sind Plätze in unseren eigenen Listen — der ORE-Priorität, der Firmen-Seniorität, der Umschulungs-Kette. Ein Angestellter eines anderen Betriebs hat dort keinen, und drei Überschriften über drei Strichen sind drei Fragen, die niemand gestellt hat.',
        'Der Dialog fragt auch nicht mehr danach. Der Umschulungs-Block war seit 1.48.0 schon weg, ORE und Seniorität folgen jetzt.',
        'In der Tabelle am Rechner bleiben die drei Spalten stehen und zeigen einen Strich — eine Spalte gehört zur Liste, nicht zur Zeile, und alle anderen Zeilen brauchen sie.',
        'Sortieren und der ORE-Filter gehen durch dieselbe Regel: Wer den Wert nicht angezeigt bekommt, wird auch nicht danach einsortiert oder gefiltert.',
        'PDF und Excel lassen die drei Felder bei Externen ebenfalls leer. Ein Export, der etwas anderes sagt als der Bildschirm, ist der, dem geglaubt wird.',
        'Gelöscht wird wie immer nichts: Wer zurück auf „intern" stellt, sieht alle drei Werte wieder.'
      ],
      en: [
        'For an external trainer, ORE, seniority and the conversion phase are gone from the card. All three are places in lists of our own - the ORE priority, the company seniority, the conversion pipeline. Somebody else\'s employee holds none of them, and three headings over three dashes are three questions nobody asked.',
        'The dialog stops asking for them too. The conversion block went in 1.48.0; ORE and seniority follow now.',
        'In the desktop table the three columns stay and print a dash - a column belongs to the list, not to the row, and every other row still needs it.',
        'Sorting and the ORE filter go through the same rule: a value that is not shown does not order or filter the row either.',
        'The PDF and the Excel export leave the three fields blank for external trainers as well. An export that disagrees with the screen is the one people believe.',
        'Nothing is cleared, as ever: switching back to internal brings all three values back.'
      ]
    }
  },
  {
    version: '1.49.0',
    date: '2026-08-19',
    type: 'minor',
    changes: {
      de: [
        'Das Umschulungs-Board sagt jetzt selbst, wo es hakt: zwei Zähler über den Spalten — „N überfällig" und „M gefährdet". Antippen lässt nur diese Karten stehen. Die Rechnung dahinter gab es seit Langem, sie war nur an keine Ansicht angeschlossen; bei fünfzig Karten über sieben Bildschirme hieß „ist jemand überfällig?" bisher: alle lesen.',
        'Die Wahl zwischen Board, Planung und Kalender bleibt erhalten. Ein Blick aufs Dashboard und zurück warf einen vorher auf das Board — und die eigentliche Buchungsarbeit passiert in der Planung. Sie steht jetzt in der Adresse (#/conversion/table) und übersteht damit auch ein Neuladen.',
        'Ein Dialog setzt den Cursor nicht mehr auf das ✕ in der Kopfzeile. Das erste Enter nach dem Öffnen hat den Dialog geschlossen, statt etwas zu tun.',
        'Wer einen Dialog mit ungespeicherten Änderungen über das ✕, Escape oder einen Tipp neben den Dialog verlässt, wird gefragt. „Abbrechen" fragt weiter nicht — das sagt ja, was es tut.',
        'Bedienelemente, die für eine Vorlesefunktion namenlos waren, haben Namen: SIM-Version, Status und Kursarten im Anbieter-Dialog, fünf Felder in den Kursterminen, Farbe und Bezeichnung in jeder Listen-Verwaltung. Die Pfeile und das ✕ dort heißen jetzt auch auf Deutsch „Nach oben", „Nach unten", „Löschen".',
        'In der Kurstermin-Karte am Handy stand das ✕ ohne Überschrift direkt neben „BELEGT" — es sah aus, als lösche es die Buchungen. Es hat jetzt seine Überschrift „Löschen".',
        'Ein Sync-Fehler erscheint auf Deutsch. „TypeError: Failed to fetch" stand bisher wörtlich in den Einstellungen.',
        '„Keine Trainer gefunden" unterscheidet jetzt zwischen leerer Liste und einem Filter, der niemanden trifft — mit einer Schaltfläche, die die Filter zurücksetzt.',
        'Der Hinweis „App ist offline verfügbar" verschwindet nach ein paar Sekunden von selbst. Er hat unten Karten verdeckt und musste weggetippt werden, obwohl er nichts fragt.'
      ],
      en: [
        'The conversion board now says where it hurts: two counters above the columns - "N overdue" and "M at risk". Tapping one leaves only those cards standing. The calculation had been there for a long time, wired to no screen at all; with fifty cards over seven screens, "is anybody overdue" meant reading all of them.',
        'The Board / Planung / Kalender choice is kept. A glance at the dashboard and back used to drop you onto the board - and the booking work lives in Planung. It now sits in the address (#/conversion/table), so a reload keeps it too.',
        'A dialog no longer puts the cursor on the ✕ in its header. The first Enter after opening closed the dialog instead of doing anything.',
        'Leaving a dialog that has unsaved changes - via the ✕, Escape or a tap beside it - now asks first. "Cancel" still does not ask: it says what it does.',
        'Controls that were nameless to a screen reader have names: SIM version, status and course types in the provider dialog, five fields in the course dates, colour and label in every list editor. The arrows and the ✕ there are now called "Move up", "Move down", "Delete" in the interface language.',
        'On the phone card for a course date the ✕ sat captionless right beside "BOOKED" - it read as "clear the bookings". It now carries its "Delete" caption.',
        'A sync failure is shown in the interface language. "TypeError: Failed to fetch" used to appear verbatim in the settings.',
        '"No trainers found" now tells an empty list from a filter that matches nobody - with a button that clears the filters.',
        'The "app is available offline" notice takes itself off after a few seconds. It covered cards at the bottom of the screen and had to be tapped away although it asks nothing.'
      ]
    }
  },
  {
    version: '1.48.0',
    date: '2026-08-19',
    type: 'minor',
    changes: {
      de: [
        'Bei „extern" ist der Umschulungs-Block im Trainer-Dialog nicht mehr da — weder Phase noch Status, Zieltermin oder Notiz. Nach etwas zu fragen, das seit der letzten Version keine Ansicht mehr liest, wäre eine Einladung, Zahlen einzutragen, die nirgends ankommen.',
        'Dasselbe gilt für die Qualifikationen „TRE extern" und „TRI extern".',
        'Die Werte werden dabei nicht gelöscht: Wer zurück auf „intern" stellt, sieht sie wieder.'
      ],
      en: [
        'For an external trainer the conversion block is gone from the dialog - no phase, status, target date or note. Asking for something that no view has read since the last version would invite figures that go nowhere.',
        'The same holds for the "TRE extern" and "TRI extern" qualifications.',
        'Nothing is cleared: switching back to internal brings the values back.'
      ]
    }
  },
  {
    version: '1.47.0',
    date: '2026-07-29',
    type: 'minor',
    changes: {
      de: [
        'Externe Trainer werden nicht mehr umgeschult. Sie sind bereits auf dem Muster qualifiziert, also stehen sie nicht mehr auf dem Board, zählen in keiner Umschulungs-Kennzahl, belegen keinen Kursplatz und tauchen in der Planung nicht mehr auf. Die Regel steht an einer Stelle, durch die Board, Dashboard, Kapazität, Planung und alle drei Umschulungs-PDFs gehen.',
        'Die Kapazitäts-Spalte „in Umschulung" rechnet sie ebenfalls heraus — sonst hätte sie den Kacheln darüber widersprochen.',
        'Auf der Karte am Handy ist jetzt sichtbar, wer extern ist: ein Merkzeichen neben dem Namen, mit der Firma. Die Zugehörigkeits-Spalte gehört zu den fünf Feldern, die auf der Karte dem Dialog weichen — genau dort war „extern" also unsichtbar.',
        'Am Rechner bleibt das Merkzeichen aus: dort steht die Spalte ohnehin, und die Tabelle hat keine Breite übrig, um es zweimal zu sagen.',
        'Die Texte, die den Umschulungs-Kreis beschreiben, sagen die neue Regel mit: auf dem Board, an den FTE-Kacheln und in der FTE-Erklärung.',
        'Zwei weitere Qualifikationen: „TRE extern" und „TRI extern". Auch sie zählen nicht zur Umschulung — dafür braucht es keine eigene Regel, sie sind schlicht keine Umschulungs-Qualifikation. In der Kapazität stehen sie weiterhin mit eigener Zeile, denn Kapazität sind sie.',
        'Reihenfolge der Qualifikationen: erst die sechs Trainer-Stufen, dann die beiden externen, dann „No Trainer" und „EIS Pilot". Diese Reihenfolge ist die Rangfolge, nach der Tabelle und Diagramme sortieren.'
      ],
      en: [
        'External trainers are no longer converted. They are already qualified on the type, so they are off the board, out of every conversion figure, take no course seat and are gone from the planning grid. The rule lives in one place, which the board, the dashboard, the capacity figures, planning and all three conversion PDFs read.',
        'The capacity column "in conversion" leaves them out too - otherwise it would have contradicted the tiles above it.',
        'On a phone card you can now see who is external: a badge beside the name, with the company. The affiliation column is one of the five fields that step aside for the dialog there, which is exactly where "external" was invisible.',
        'On a desktop the badge stays hidden: the column is there anyway, and the table has no width to spare for saying it twice.',
        'The wording that describes the conversion pool now carries the new rule: on the board, on the FTE tiles and in the FTE definition.',
        'Two more qualifications: "TRE extern" and "TRI extern". They are out of the conversion too - which needs no rule of its own, they simply are not a conversion qualification. They keep their own row in the capacity tab, because capacity is what they are.',
        'The order of the qualifications: the six trainer grades, then the two external ones, then "No Trainer" and "EIS Pilot". That order is the ranking the table and the charts sort by.'
      ]
    }
  },
  {
    version: '1.46.0',
    date: '2026-07-29',
    type: 'minor',
    changes: {
      de: [
        'Am iPhone war der Speichern-Knopf nicht mehr erreichbar, sobald die Tastatur aufging: iOS verkleinert dabei weder das Fenster noch „dvh", nur den sichtbar gebliebenen Bereich — der Dialog behielt seine volle Höhe und die Fußzeile lag unter der Tastatur. Er richtet sich jetzt nach dem tatsächlich sichtbaren Bereich; die Felder scrollen, Kopf- und Fußzeile bleiben stehen. Nebenbei rutscht die Überschrift nicht mehr unter die Uhr.',
        'ORE ist bei neuen Einträgen leer statt „C". Eine vorausgefüllte Priorität ist eine Behauptung, die niemand aufgestellt hat — und das ORE-Diagramm zählt sie mit.',
        'Bei „extern" lässt sich jetzt die Firma angeben: TUI, SunExpress, Others. Sie erscheint nur, wenn jemand auf extern steht, steht in der Liste neben dem Chip, und ist in Excel und PDF dabei. Die Auswahl ist in den Einstellungen erweiterbar.',
        'Zwei neue Qualifikationen ganz am Ende der Liste: „No Trainer" und „EIS Pilot". Ans Ende, weil die Reihenfolge dieser Liste die Rangfolge ist, nach der jede Auswertung sortiert.'
      ],
      en: [
        'On an iPhone the Save button became unreachable as soon as the keyboard appeared: iOS shrinks neither the layout viewport nor "dvh" for it, only the visible area — so the dialog kept its full height and the footer sat under the keyboard. It now sizes itself from what is actually visible; the fields scroll, the head and the footer stay. The title no longer slides under the clock either.',
        'ORE starts empty on a new record instead of "C". A pre-filled priority is a claim nobody made — and the ORE chart counts it.',
        '"External" can now say which company: TUI, SunExpress, Others. It appears only for an external trainer, shows next to the chip in the list, and is in the Excel and PDF exports. The list is extensible in the settings.',
        'Two more qualifications, at the very end: "No Trainer" and "EIS Pilot". At the end because the order of that list IS the ranking every view sorts by.'
      ]
    }
  },
  {
    version: '1.45.0',
    date: '2026-07-29',
    type: 'minor',
    changes: {
      de: [
        'Der Link lässt sich weitergeben: Wer ihn öffnet, sieht den aktuellen Stand — ohne Konto, ohne Anmeldung, und er aktualisiert sich von allein (beim Öffnen, beim Zurückwechseln zur App und alle 2 Minuten).',
        'Ändern kann weiterhin nur, wer angemeldet ist. Die Sperre sitzt an der einen Stelle, durch die alle Daten in die App kommen — kein Bildschirm kann halb geschützt sein, und ein Knopf, den jemand zu verstecken vergisst, kann nichts ausrichten.',
        'Sichtbar statt kaputt: Besucher bekommen ein Band „Nur-Lese-Ansicht" mit dem Stand-Zeitpunkt, und die Schaltflächen zum Anlegen, Speichern und Löschen sind weg. Suche, Filter, Sortierung, das Öffnen eines Datensatzes und alle PDF- und Excel-Ausgaben bleiben.',
        'Nichts ändert sich, solange in der Datenbank kein Datensatz als geteilt markiert ist — die Nur-Lese-Ansicht schaltet sich erst ein, wenn wirklich ein geteilter Stand gefunden wurde. Wer die App bisher rein lokal benutzt, merkt nichts.',
        'Die dafür nötige Datenbank-Regel liegt als supabase/migrations/0002_shared_read.sql bei. Sie erlaubt anonym ausschließlich Lesen; eine Schreibregel gibt es nicht.'
      ],
      en: [
        'The link can be handed on: whoever opens it sees the current state - no account, no sign-in - and it refreshes on its own (on load, on returning to the app, and every 2 minutes).',
        'Changing it still requires a sign-in. The block sits at the single place all data enters the app, so no screen can be half-protected and a control somebody forgets to hide can do nothing.',
        'Visible rather than broken: visitors get a "view only" band with the timestamp, and the add, save and delete controls are gone. Search, filters, sorting, opening a record and every PDF and Excel export stay.',
        'Nothing changes while no row in the database is flagged as shared - view-only switches on only once a shared state was actually found. Anyone using the app purely locally notices nothing.',
        'The database rule ships as supabase/migrations/0002_shared_read.sql. It grants anonymous SELECT only; there is no write policy.'
      ]
    }
  },
  {
    version: '1.44.0',
    date: '2026-07-29',
    type: 'minor',
    changes: {
      de: [
        'Neue Spalte „Seniorität" bei den Trainern, gefüllt aus der Firmenliste (Stand 03.07.2026). Sortierbar, im Dialog änderbar, in Excel und PDF.',
        'Nur die Leute, die in der App stehen: das Dokument führt 416 Cockpit-Crew, davon sind 47 unserer 50 dort zu finden. Es ist ein Nachschlagewerk, kein Import — es wird niemand angelegt, und ein selbst eingetragenes Datum gewinnt.',
        'Drei Trainer stehen nicht in der Liste (Essbauer, Beverage, Hüsser) und bleiben leer. Ein geratenes Datum wäre schlimmer als keines: es sieht nicht falsch aus, es sortiert sich nur an die falsche Stelle. Beim Sortieren stehen leere Felder deshalb hinten, nicht vorn.',
        'Zwei wurden von Hand zugeordnet, weil App und Firmenliste sie unterschiedlich schreiben (ein Buchstabe im Nachnamen, „Joe"/„Jose"). Base und Funktion stimmen in beiden Fällen überein.',
        'Der Sortierpfeil steht nur noch auf der Spalte, nach der wirklich sortiert wird. Auf den übrigen war er Zierde und kostete gemessen 83 px — genau der Betrag, um den die fünfzehn Spalten sonst über die Seitenbreite hinausgelaufen wären.',
        'Geprüft auf iPhone (390), iPad hoch (820 und 834) und iPad quer (1024): das Datum steht auf der Karte, mit seiner Überschrift, in derselben Zeile wie die Umschulungs-Phase — keine zusätzliche Kartenzeile, nichts verdeckt.'
      ],
      en: [
        'New "Seniority" column on the trainers, filled from the company list (as of 03.07.2026). Sortable, editable in the dialog, in the Excel and PDF exports.',
        'Only the people already in the app: the document lists 416 cockpit crew, 47 of our 50 among them. It is a lookup, not an import - nobody is added, and a date typed by hand wins.',
        'Three trainers are not in the list (Essbauer, Beverage, Huesser) and stay blank. A guessed date would be worse than none: it does not look wrong, it just sorts into the wrong place. Blanks therefore sort last, not first.',
        'Two were matched by hand because the app and the company list spell them differently (one letter in a surname, "Joe"/"Jose"). Base and rank agree in both cases.',
        'The sort mark now appears only on the column actually being sorted. On the others it was decoration and cost a measured 83px - exactly the amount by which fifteen columns would otherwise have run past the page width.',
        'Checked on iPhone (390), iPad portrait (820 and 834) and iPad landscape (1024): the date is on the card, with its heading, on the same line as the conversion phase - no extra card line, nothing hidden.'
      ]
    }
  },
  {
    version: '1.43.0',
    date: '2026-07-28',
    type: 'minor',
    changes: {
      de: [
        'Die Monatsübersicht ist jetzt eine Grafik und steht direkt unter der Provider-Liste: ein Balken je Monat, aufgeteilt nach Kursart, in den Farben, die die Kursarten auch auf dem Board tragen. Rechts die Summe des Monats, unten die Summe je Kursart.',
        'Vorher war sie eine Zahlentabelle ganz unten im Kapazitäts-Reiter — gemessen 2776 px weit unten am Handy, also 3,3 Bildschirmlängen hinter drei FTE-Tabellen. Wer die Zahlen eingetragen hatte und das Ergebnis suchte, fand nichts. Jetzt 1381 px am Handy und 500 px am Rechner, im selben Reiter, in dem die Zahlen entstehen.',
        'Leere Monate bleiben als Zeile stehen. In einer Tabelle war das eine graue Zeile, in der Grafik ist es eine Lücke in der Achse — und genau die soll man sehen.',
        'Der Zeitraum kommt weiter aus den Einstellungen; ein Ende vor dem Anfang wird benannt, statt eine leere Grafik zu zeichnen.'
      ],
      en: [
        'The monthly overview is a chart now, directly under the provider list: one bar per month, split by course type, in the colours those course types carry on the board. The month total is on the right, the per-course totals in the legend.',
        'It used to be a number table at the very bottom of the capacity tab — measured 2776px down on a phone, 3.3 screens behind three FTE tables. Someone who entered the figures and went looking for the result found nothing. It is 1381px down on a phone and 500px on a desktop now, in the same tab the figures are created in.',
        'Empty months keep their row. In a table that was a dimmed line; in a chart it is a gap in the axis — which is the thing worth seeing.',
        'The window still comes from the settings; an end before its start is named rather than drawing an empty chart.'
      ]
    }
  },
  {
    version: '1.42.0',
    date: '2026-07-28',
    type: 'minor',
    changes: {
      de: [
        'Provider-Plätze sind jetzt eine Gesamtzahl, keine Monatsrate mehr. „Plätze / Monat" hieß: jeder Monat gleich. Die Monate sind aber nicht gleich — 4 Type Ratings im November 2026, 2 im Dezember, 6 im März 2027 — und eine Rate konnte das nicht sagen.',
        'Neu im Anbieter-Dialog: eine Zeitleiste. Je Monat eine Zeile, je Kursart ein Feld. Nur die Monate, in denen es etwas gibt — über „+ Monat" hinzugefügt, ein bereits eingetragener Monat verschwindet aus der Auswahl.',
        'Verteilt die Zeitleiste mehr, als bei „Plätze insgesamt" steht, sagt die App das — je Kursart und in Summe. Ein Hinweis, kein Riegel: ein Anbieter findet auch mal einen Platz mehr.',
        'Neu im Kapazitäts-Reiter: „Provider-Plätze je Monat". Monate untereinander, Kursarten nebeneinander, wahlweise alle Anbieter oder einer. Leere Monate bleiben als graue Zeile stehen — die Lücke ist die Information.',
        'Der Zeitraum steht in den Einstellungen, voreingestellt bis Ende 2027. Start leer heißt „ab dem laufenden Monat", dann wandert er von allein mit.',
        'Die Auslastungs-Chips im Provider-Reiter rechnen nicht mehr in Monate um: Bedarf und Plätze sind jetzt beides Gesamtzahlen und werden direkt verglichen. Fehlen Plätze, steht dort, wie viele.',
        'Zeitleiste und Gesamtzahlen stehen im PDF und in der Excel-Ausgabe.'
      ],
      en: [
        'Provider seats are a total now, not a monthly rate. "Seats / month" meant every month alike. The months are not alike — 4 type ratings in November 2026, 2 in December, 6 in March 2027 — and a rate could not say that.',
        'New in the provider dialog: a timeline. One row per month, one field per course type. Only the months that hold something, added through "+ month"; a month already listed drops out of the picker.',
        'If the timeline distributes more than the "seats in total" figure allows, the app says so — per course type and overall. A hint, not a block: a provider really can find one more slot.',
        'New in the capacity tab: "Provider seats per month". Months down the side, course types across, all providers or one. Empty months stay as a dimmed row — the gap is the information.',
        'The window is set in the settings, defaulting to the end of 2027. An empty start means "from the current month", so it moves along on its own.',
        'The utilisation chips in the provider tab no longer convert to months: demand and seats are both totals and compare directly. Where seats are short, it says by how many.',
        'The timeline and the totals are in the PDF and the Excel export.'
      ]
    }
  },
  {
    version: '1.41.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Der Kapazitäts-Reiter als Karten am Handy und am iPad — der letzte, der noch Spalten versteckte (bis zu 423 px in den Zahlentabellen, 342 px im Bearbeiten-Teil). Je Zeile eine Karte: oben die Qualifikation, Base oder das Muster, darunter die Zahlen, jede mit ihrer Spaltenüberschrift.',
        'Die Zahlen stehen zeilenweise bündig. Die längste Überschrift („In Umschulung") umbricht, statt zu „IN UMSCHULU…" abgeschnitten zu werden, und jede Überschrift reserviert zwei Zeilen — sonst rutscht eine umgebrochene ihre eigene Zahl unter die Nachbarn.',
        'Mini-Knöpfe im Dunkelmodus: sie hatten Weiß fest verdrahtet und leuchteten als helle Kästchen auf fast schwarzer Seite. Betraf alle — Board-Pfeile, Listen-Editor, Löschen im Dialog. Jetzt Kartengrau mit hellem Magenta (Kontrast 6,0 statt 2,6).'
      ],
      en: [
        'The capacity tab becomes cards on a phone and an iPad — the last one still hiding columns (up to 423px in the figure tables, 342px in the editor). One card per row: the qualification, base or type on top, then the figures, each with the heading its column carried.',
        'The figures line up across each line. The longest heading wraps instead of being clipped to "IN UMSCHULU…", and every heading reserves two lines — otherwise a wrapped one drops its own figure below its neighbours.',
        'Mini buttons in dark mode: they had white hard-coded and glowed as bright boxes on a near-black page. All of them — board arrows, list editors, the delete in each dialog. Now card grey with the lighter magenta (contrast 6.0 instead of 2.6).'
      ]
    }
  },
  {
    version: '1.40.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Sortieren am Handy und am iPad. Wo eine Liste zur Karte wird, verschwindet die Kopfzeile — und mit ihr war bisher jede Sortiermöglichkeit weg. Jetzt steht dort ein Auswahlfeld „Sortieren" mit einem Pfeil für die Richtung. Betrifft Trainer, Other Pilots, Provider, die Kapazitäts-Liste und die Planung.',
        'Besonders die Kapazitäts-Liste: sie beantwortet „wer ist der Engpass", und das ist eine Frage nach der Reihenfolge. Am Handy war sie vorher auf Name-aufsteigend eingefroren.',
        'Am Rechner ändert sich nichts: dort bleibt die Kopfzeile, und das Auswahlfeld erscheint gar nicht erst.',
        'Spaltenköpfe werden Screenreadern wieder als Spaltenköpfe angesagt. Sie trugen die Rolle „Schaltfläche\u0022, was die Kopfzeilen-Bedeutung ersetzt — gemessen waren damit alle acht Spaltenköpfe der Piloten-Liste für einen Screenreader keine mehr. Der Kopf ist jetzt wieder ein Kopf, gedrückt wird ein Knopf darin.',
        'Die Karten-Tabellen benennen ihre Struktur (Tabelle, Zeile, Zelle) ausdrücklich. In Chromium war das nicht nötig, dort bleibt sie ohnehin erhalten; für Engines, die sie beim Umbau verlieren, ist es die Absicherung.'
      ],
      en: [
        'Sorting on a phone and an iPad. Where a list becomes a card the header row goes away — and with it, until now, every way to sort. There is a "Sort by" picker with a direction arrow instead. Trainers, Other Pilots, Providers, the capacity list and Planning.',
        'The capacity list most of all: it answers "who is the bottleneck", which is a question about order. On a phone it was frozen at name-ascending.',
        'Nothing changes on a desktop: the header row stays and the picker never appears.',
        'Column headers are announced as column headers again. They carried the role "button", which replaces the columnheader role — measured, that left all eight headers of the roster as no headers at all. The header is a header again and the thing you press is a button inside it.',
        'The card tables state their structure (table, row, cell) explicitly. Chromium keeps it through the layout change anyway; this is insurance for engines that do not.'
      ]
    }
  },
  {
    version: '1.39.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Die Planungs-Ansicht am Handy und am iPad als Karten. Sie ist eine Matrix (Personen mal Kursschritte), deshalb ist die Karte die Person: oben Name, Base, Qualifikation und Aircraft mit dem Intern/Extern-Chip, darunter je Kursschritt eine beschriftete Zeile mit Provider, Status und Zeitraum. Am iPhone lagen vorher 528 px hinter dem seitlichen Schieben, am iPad 114 bis 166 px.',
        'Auf dem Tablet stehen zwei Buchungen nebeneinander, das halbiert die Kartenhöhe.',
        'Der Kurstermin-Dialog war auf 720 px gedeckelt, seine Tabelle braucht aber 818 px — Plätze, Belegt und der Löschen-Knopf lagen bei JEDER Fenstergröße hinter dem seitlichen Schieben, auch am Rechner. Ein Kurstermin ließ sich also anlegen, aber nicht entfernen, ohne die Tabelle seitlich zu schieben. Der Dialog ist jetzt breiter.',
        'Unter 900 px wird auch dieser Dialog zur Karte: ein gestapeltes kleines Formular, jedes Feld mit eigener Beschriftung. Unter 480 px bekommen „von" und „bis" je eine eigene Zeile, weil ein Datumsfeld in einer halben Handybreite das Datum selbst abschneidet.'
      ],
      en: [
        'The planning view becomes cards on a phone and an iPad. It is a matrix (people by course steps), so the card is the person: name, base, qualification and aircraft on top with the internal/external chip, then one labelled line per course step with provider, status and period. An iPhone had 528px behind a sideways scroll, an iPad 114 to 166px.',
        'On a tablet two bookings sit side by side, which halves the card height.',
        'The course-date dialog was capped at 720px while its table wants 818px — seats, booked and the delete button sat behind a sideways scroll at EVERY window size, desktop included. A course date could be added but not removed without knowing to swipe. The dialog is wider now.',
        'Below 900px that dialog becomes a card too: a small stacked form, every field with its own label. Below 480px the two dates take a line each, because a date field in half a phone clips the date itself.'
      ]
    }
  },
  {
    version: '1.38.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Ein langer, selbst benannter Provider-Status lief auf der Karte nach links über den Anbieternamen und machte beides unlesbar. Der Chip umbricht jetzt in seiner eigenen Hälfte.',
        'Provider-Karten auf dem iPad: die Felder haben feste Breiten statt Hälften: ein ICAO-Kürzel stand vorher allein in 460 px, der Status klebte weit weg vom Namen.',
        'Leere Kurs- und Standort-Listen zeigen jetzt ein „–" statt einer Überschrift über leerem Raum. Auf einer frischen Installation betraf das jede Karte.',
        'Strg+P druckt wieder die echte Tabelle mit Kopfzeile. A4 ist schmaler als der Karten-Umschaltpunkt, dadurch kamen Karten ohne Spaltenüberschriften aufs Papier — das galt auch für Trainer und Other Pilots.',
        'Eine sehr lange E-Mail-Adresse hat den seitlichen Scroll zurückgebracht, den die Karte abschaffen sollte. Sie umbricht jetzt.',
        'Antippen färbt die ganze Karte statt einzelner Textkästen — in beiden Farbschemata.',
        'Das Karten-Layout stand dreimal kopiert im Stylesheet und war bereits auseinandergelaufen (unterschiedliche Abstände). Es steht jetzt an einer Stelle, dadurch sehen die drei Listen gleich aus.'
      ],
      en: [
        'A long, user-named provider status painted leftward over the provider name on the card, making both unreadable. The chip now wraps inside its own half.',
        'Provider cards on an iPad: the fields have fixed widths instead of halves — an ICAO code used to sit alone in 460px and the status was thrown far from the name.',
        'Empty course and location lists now say "–" instead of leaving a heading over blank space. On a fresh install that was every card.',
        'Ctrl+P prints the real table with its header row again. A4 is narrower than the card breakpoint, so cards with no column headings reached the paper — this affected Trainers and Other Pilots too.',
        'A very long e-mail address handed back the sideways scroll the card exists to remove. It now wraps.',
        'Tapping highlights the whole card rather than loose text boxes, in both colour schemes.',
        'The card layout was copy-pasted three times in the stylesheet and had already drifted apart (different spacing). It now lives in one place, so the three lists look alike.'
      ]
    }
  },
  {
    version: '1.37.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Die beiden Provider-Tabellen am Handy und am iPad als Karten. Hier war das Problem ein anderes als bei den vorigen Reitern: die Tabelle passte, aber die Kurs-Chips wurden in ein Sechstel der Bildschirmbreite gequetscht — „Type Rating + Base Training" brach auf vier Zeilen um und ein einzelner Provider wurde höher als der Bildschirm.',
        'Auf der Karte bekommen die Chip-Listen die volle Breite, dadurch steht jeder Kurs auf einer Zeile. Die höchste Zeile ist von rund 350 px auf 204 px geschrumpft, ohne dass ein Feld weggefallen ist.',
        'Aufbau je Karte: oben Anbieter und Status, darunter Standorte und SIM-Version nebeneinander, dann die Kurse über die volle Breite, unten der Ansprechpartner. Die Kapazitäts-Tabelle darunter genauso.',
        'Ab 1000 px Breite bleiben beide Tabellen wie gewohnt.'
      ],
      en: [
        'Both provider tables become cards on a phone and an iPad. The problem here was a different one: the table fitted, but the course chips were squeezed into a sixth of the screen — "Type Rating + Base Training" broke over four lines and a single provider grew taller than the display.',
        'On the card the chip lists get the full width, so each course sits on one line. The tallest row shrank from about 350px to 204px without dropping a single field.',
        'Per card: provider and status on top, then locations and SIM version side by side, then the courses across the full width, and the contact at the bottom. The capacity table below it works the same way.',
        'From 1000px wide both tables stay as they were.'
      ]
    }
  },
  {
    version: '1.36.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Die Trainer-Liste am Handy und am iPad im Hochformat: aus vierzehn Spalten, von denen vier auf den Bildschirm passten, wird je Person eine Karte. Oben Name und Qualifikations-Chip, darunter Base, TLC, Rolle, FTE, Aircraft, ORE-Stufe und die Umschulungs-Phase.',
        'Teilzeit, Intern/Extern, Behörde, Anmerkung und Notiz stehen nicht auf der Karte, sondern im Dialog, der sich beim Antippen öffnet — vierzehn Felder mal fünfzig Personen wären am Handy nicht mehr überblickbar. In der Tabelle, in der Suche und in allen Exporten sind sie unverändert enthalten.',
        'Ab 1280 px Breite bleibt die gewohnte Tabelle mit allen vierzehn Spalten — gemessen brauchen die vierzehn Spalten 1234 px, ein iPad im Querformat (1024 px) ist noch 245 px zu schmal und bekommt deshalb ebenfalls Karten.'
      ],
      en: [
        'The trainer list on a phone and on an iPad in portrait: fourteen columns, of which four fitted the screen, become one card per person. Name and qualification chip on top, then base, TLC, role, FTE, aircraft, ORE tier and the conversion stage.',
        'Part-time, internal/external, authority, remark and note are not on the card but in the dialog that opens on tap — fourteen fields times fifty people stopped being readable on a phone. They are unchanged in the table, in the search and in every export.',
        'From 1280px wide the familiar table with all fourteen columns stays — measured, those columns want 1234px, so an iPad in landscape (1024px) is still 245px short and gets cards as well.'
      ]
    }
  },
  {
    version: '1.35.1',
    date: '2026-07-27',
    type: 'patch',
    changes: {
      de: [
        'Other Pilots am iPad: die Kartenansicht griff erst unter 780 px. Ein iPad Air oder Pro im Hochformat ist 820 px breit und bekam deshalb weiter die abgeschnittene Tabelle — die acht Spalten brauchen gemessene 966 px. Umgeschaltet wird jetzt unter 1000 px; im Querformat (1024 px) bleibt die echte Tabelle.',
        'Auf dem Tablet zog die Karte die Spalten „Gültig" und „Abgelaufen" auf über 200 px auseinander, das × stand weit weg von seiner Überschrift. Die Felder bekommen jetzt feste Breiten, der Rest bleibt frei.',
        'Im Piloten-Dialog am Handy stand das Lösch-× einer Berechtigung direkt über dem Muster-Feld der nächsten — verwechslungsgefährlich. Jede Berechtigung hat jetzt einen eigenen Rahmen.'
      ],
      en: [
        'Other Pilots on an iPad: the card layout only started below 780px. An iPad Air or Pro in portrait is 820px wide and so kept the cut-off table — the eight columns need a measured 966px. The switch is now below 1000px; in landscape (1024px) the real table stays.',
        'On a tablet the card stretched the "valid" and "expired" columns past 200px each, leaving the × far from its heading. The fields now have fixed widths and the slack is left empty.',
        'In the pilot dialog on a phone the delete × of one rating sat directly above the next rating\'s type field, inviting a mis-tap. Each rating now has its own frame.'
      ]
    }
  },
  {
    version: '1.35.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Other Pilots am Handy: acht Spalten passen nicht auf ein iPhone — die Tabelle hörte nach dem Namen auf, der Rest lag hinter einem seitlichen Scrollen, das niemand findet. Unter 780 px wird jede Zeile jetzt eine Karte: Name oben, darunter Base, TLC und Boeing Erfahrung, darunter Muster, Gültigkeit, Gültig und Abgelaufen — mit derselben Zeilenausrichtung wie am Rechner.',
        'Jedes Feld trägt seine eigene Überschrift, weil die Kopfzeile auf der Karte fehlt.',
        'Alle übrigen Tabellen zeigen am Rand einen Schatten, solange dahinter noch Spalten liegen — damit sichtbar ist, dass man sie seitlich schieben kann.',
        'Die korrigierte Piloten-Liste (TLC, Base, Cockpit-Rolle) erreicht jetzt auch Geräte, die schon die erste Fassung bekommen hatten. Selbst eingetragene Datensätze bleiben unangetastet.'
      ],
      en: [
        'Other Pilots on a phone: eight columns do not fit an iPhone — the table ended after the name and the rest sat behind a sideways scroll nobody finds. Below 780 px every row becomes a card: name on top, then base, TLC and Boeing experience, then type, validity, valid and expired — with the same line alignment as on the desktop.',
        'Each field carries its own heading, because the card has no header row.',
        'Every other table now shades its edge while there are still columns behind it, so it is visible that it can be pushed sideways.',
        'The corrected pilot roster (TLC, base, cockpit role) now also reaches devices that had already taken the first one. Records edited by hand are left alone.'
      ]
    }
  },
  {
    version: '1.34.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Other Pilots: das × steht jetzt in derselben Zeile wie das Datum, auf das es sich bezieht. Bei zwei Mustern stand beides auf der ersten Zeile.',
        'Die drei Kreuz-Spalten (Boeing Erfahrung, Gültig, Abgelaufen) sind zentriert.',
        'Ein Datum, das noch hält, ist grün; ein abgelaufenes bleibt rot.',
        'Die korrigierte Liste ist übernommen: 64 Personen, 70 Berechtigungen, mit TLC und Cockpit-Rolle aus der Datei.',
        'Ein Tab-Wechsel beginnt wieder oben auf der Seite, statt die Scroll-Position der vorigen Seite zu behalten.',
        'Der offene Reiter steht in der Adresse. Ein Refresh bleibt damit auf der Seite, statt aufs Dashboard zu springen — und der Zurück-Knopf funktioniert.'
      ],
      en: [
        'Other Pilots: the × now sits on the same line as the date it refers to. With two ratings both marks landed on the first line.',
        'The three marked columns (Boeing experience, valid, expired) are centred.',
        'A date that still holds is green; a lapsed one stays red.',
        'The corrected roster is in: 64 people, 70 ratings, with the TLC and the cockpit role from the file.',
        'Switching tabs starts at the top of the page again instead of keeping the previous page scroll position.',
        'The open tab is in the address. A refresh therefore stays on the page instead of jumping to the dashboard, and the back button works.'
      ]
    }
  },
  {
    version: '1.33.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Other Pilots ist neu aufgebaut, im Stil der Trainer-Liste: Base, TLC, Name, Type, Gültigkeit, Boeing Erfahrung, Gültig, Abgelaufen.',
        'Die 65 Personen aus der Excel-Datei sind übernommen (71 Berechtigungen).',
        'Eine Person kann mehrere Muster mit unterschiedlicher Gültigkeit haben. Beide stehen untereinander in der Zeile und sind einzeln änderbar; wer eines abgelaufen und eines gültig hat, bekommt in beiden Spalten ein x.',
        '"Gültig" und "Abgelaufen" sind keine Felder, sondern werden immer gegen das heutige Datum gerechnet. Ein gespeichertes Kennzeichen wäre am Morgen danach falsch.',
        'Base und Type sind Dropdowns mit leerer Auswahl und in den Einstellungen editierbar (neue Listen "Bases" und "Muster").',
        'TLC ist auf drei Zeichen begrenzt und wird direkt bei der Eingabe groß geschrieben. Name im Format "Nachname, Vorname".',
        'PDF, Excel und Druck im selben Stil wie die übrigen Exporte: eine Zeile je Berechtigung, wie in der Vorlage, plus eine Zusammenfassung im PDF.',
        'Die früheren Felder "B737-Status" und "gültig bis" wandern automatisch in eine 737-Berechtigung bzw. in das Kennzeichen "Boeing Erfahrung".'
      ],
      en: [
        'Other Pilots rebuilt in the style of the trainer list: base, TLC, name, type, expiry, Boeing experience, valid, expired.',
        'The 65 people from the spreadsheet are in (71 ratings).',
        'A person can hold several types with different expiry dates. Both are stacked in the row and editable one by one; somebody with one lapsed and one current rating gets an x in both columns.',
        '"Valid" and "expired" are not fields: they are worked out against today every time. A stored flag would be wrong the morning after.',
        'Base and type are dropdowns with an empty choice, editable in the settings (new "Bases" and "Types" lists).',
        'TLC is held to three characters and upper-cased as it is typed. Names read "Surname, First name".',
        'PDF, Excel and print in the same style as the other exports: one row per rating, as in the source, plus a summary in the PDF.',
        'The former "B737 status" and "valid until" fields migrate into one 737 rating or into the Boeing-experience flag.'
      ]
    }
  },
  {
    version: '1.32.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Die Spalte „Auslastung" in der Provider-Kapazität ist entfernt.',
        'Neu in den Einstellungen: „Auswahllisten" — alle zwölf Auswahlfelder der App an einer Stelle, umbenennbar, umfärbbar, sortierbar.',
        'Aircraft und ORE-Stufen sind damit erstmals editierbar; bisher standen sie fest im Code. Ein neu angelegtes Muster erscheint sofort in jedem Filter.',
        'Bei vier Listen (Umschulungs-Status, Zuweisungs-Status, Piloten-Status, Intern/Extern) steuert der gespeicherte Wert das Verhalten der App — „absolviert" zählt zum Beispiel nicht mehr als offener Bedarf. Dort lassen sich Name und Farbe ändern, aber keine Einträge hinzufügen oder löschen; die Karte sagt das dazu.',
        'Alle Listen werden wie die übrigen Datensätze je Eintrag synchronisiert: eine Umbenennung auf dem iPad und ein neues Muster am Laptop überleben beide.',
        'Das Umschulungs-PDF enthält jetzt alle drei Ansichten des Reiters: Board, Planungsraster und Kalender in einer Datei (Querformat, damit das Raster hineinpasst).'
      ],
      en: [
        'The "Utilisation" column is gone from the provider capacity table.',
        'New in the settings: "Pick lists" - all twelve of the app\'s dropdowns in one place, renameable, recolourable, reorderable.',
        'Aircraft and ORE tiers are editable for the first time; they used to be fixed in code. A newly added type shows up in every filter immediately.',
        'In four lists (conversion status, assignment status, pilot status, internal/external) the stored value drives behaviour - a completed step stops counting as open demand. There the name and colour can change but entries cannot be added or removed, and the card says so.',
        'Every list syncs per entry like the rest of the data: a rename on the iPad and a new type on the laptop both survive.',
        'The Conversion PDF now contains all three views of the tab: board, planning grid and calendar in one file (landscape, so the grid fits).'
      ]
    }
  },
  {
    version: '1.31.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Vier Kacheln sind aus dem Dashboard entfernt: „Fortschritt je Monat", „Soll gegen Ist", „Eingehende Trainer je Monat" und „Ø Dauer je Kursart".',
        'Mit ihnen entfällt alles, was es nur für sie gab: die Monats-Zielsetzung unter „Kapazität", der Monats-Recorder, die Soll-Dauer je Kursart sowie die zugehörigen Bibliotheken, Texte, Stile und Tests. Es bleibt keine Einstellung stehen, die nirgends mehr wirkt.',
        'Die Umschulungs-Pipeline ist jetzt ein Balkendiagramm: eine Zeile je Phase mit voll ausgeschriebenem Namen. Die Phasenfarben sind unverändert. Eine Phase bei null zeichnet keinen Balken mehr statt eines farbigen Stummels.',
        'Exporte überarbeitet: Kurstermine haben jetzt ein eigenes PDF (samt Teilnehmerlisten je Kurs) und ein eigenes Excel-Blatt — die Daten kamen bisher in keinem Export vor.',
        'Das Provider-PDF zählt Buchungen über Kurstermine jetzt mit (vorher las es die meistbeschäftigten Provider als „keine Nachfrage") und druckt die Kapazität je Kursart.',
        'Planungs-PDF und -Excel drucken jetzt Name UND Zeitraum je Zelle, wie der Bildschirm.',
        'Provider-Kapazität: die Kachel je Kursart zeigt jetzt, wie viele Monate der offene Bedarf braucht. Rot erst ab mehr als drei Monaten — „mehr als ein Monat" ist bei einem Phase-In der Normalfall und hätte alles markiert.',
        'Farben vereinheitlicht: Captain/First Officer, Aircraft und ORE holen ihre Farbe überall aus derselben Quelle. First Officer war auf Karten blau und im Diagramm rosa, und die Rosa-Variante überschrieb versehentlich die Dunkelmodus-Stufe der Phasenfarben.',
        'Behoben: Kalender-Farben im Dunkelmodus, das Datum in der Board-Kachel jetzt formatiert statt roh, Kurstermin wählen löscht den alten Provider-Eintrag der Person, Kurstermin-Provider werden wie im Zuweisungs-Dialog nach Kursart gefiltert.',
        'Neu: eine Überschneidungs-Warnung im Zuweisungs-Dialog, wenn sich zwei gebuchte Zeiträume derselben Person überlappen.'
      ],
      en: [
        'Four cards are gone from the dashboard: Progress per month, Plan vs. actual, Incoming trainers per month and Avg. duration by course type.',
        'With them goes everything that existed only for them: the monthly milestone editor on the Capacity tab, the monthly recorder, the per-course-type target duration, and the matching libraries, strings, styles and tests. No setting is left that no longer does anything.',
        'The conversion pipeline is a bar chart now: one row per stage with its full name. The stage colours are unchanged. A stage at zero draws no bar instead of a coloured stub.',
        'Exports reworked: course dates now have their own PDF (with an attendee list per course) and their own Excel sheet - the data appeared in no export at all.',
        'The provider PDF counts bookings made through a course date (it read the busiest providers as no demand) and prints the capacity per course type.',
        'The planning PDF and Excel print the name AND the period per cell, like the screen.',
        'Provider capacity: the per-course-type chip now says how many months the open backlog needs. Red only above three months - more than one month is the normal state of a phase-in and would have marked everything.',
        'Colours unified: Captain/First Officer, aircraft and ORE take their colour from one source everywhere. First Officer was blue on a card and pink in a chart, and the pink variant was accidentally overwriting the stage ramp dark-mode step.',
        'Fixed: calendar colours in dark mode; the board chip date is formatted rather than raw; choosing a course date clears the stale provider entry; course-date providers are filtered by course type like the assign dialog.',
        'New: an overlap warning in the assign dialog when two booked periods for the same person run into each other.'
      ]
    }
  },
  {
    version: '1.30.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Die Kapazität eines Providers heißt jetzt ausdrücklich **Plätze / Monat** — vorher war die Zahl ohne Zeitbezug und damit nicht vergleichbar.',
        'Zusätzlich je Kursart: wie viele Personen der Provider pro Monat im Type Rating, im TRI-Kurs, im LIFUS usw. aufnehmen kann. Ein Gesamtwert allein verdeckt genau den Engpass — sechs Type Ratings im Monat, aber nur zwei TRI-Kurse.',
        'In der Kapazitätstabelle steht je Kursart „Bedarf / Plätze". Ist der Bedarf höher als die Plätze, wird die Kursart rot markiert. Gesperrt wird nichts.',
        'Ist kein Gesamtwert eingetragen, gilt die Summe der Aufteilung — die Zahl muss also nicht zweimal getippt werden. Verspricht die Aufteilung mehr als der Gesamtwert, wird gewarnt, aber nichts korrigiert.',
        'Das Freitextfeld „Kapazität / Konditionen" ist entfallen (die Zahl und „Preis / Konditionen" decken es ab). Was dort stand, wandert automatisch in die Notizen, statt gelöscht zu werden.',
        'Behoben: Die Karten auf dem Umschulungs-Board standen in Speicher-Reihenfolge statt alphabetisch. Ebenso stand die Auswahl der Kurstermine im Zuweisungs-Dialog in Eingabereihenfolge statt nach Datum.'
      ],
      en: [
        'A provider’s capacity is now explicitly **seats / month** – the figure had no time reference before, which made it incomparable.',
        'Broken down per course type as well: how many people the provider can take per month in the type rating, the TRI course, LIFUS and so on. A single total hides exactly the bottleneck – six type ratings a month, but only two TRI courses.',
        'The capacity table shows "demand / seats" per course type. Where demand beats the seats, the course type turns red. Nothing is blocked.',
        'With no overall figure entered, the breakdown is the total – so the number never has to be typed twice. Where the breakdown promises more than the total, it warns but corrects nothing.',
        'The free-text "Capacity / conditions" field is gone (the number and "Price / conditions" cover it between them). Whatever was typed there moves into the notes rather than being deleted.',
        'Fixed: the cards on the conversion board came out in storage order rather than alphabetically. The same for the course-date dropdown in the assign dialog, which was in entry order rather than by date.'
      ]
    }
  },
  {
    version: '1.29.1',
    date: '2026-07-27',
    type: 'patch',
    changes: {
      de: [
        'Behoben: In der Kachel „Ø Dauer je Kursart" ließ sich die Ansicht „% vom Soll" nicht mehr verlassen, wenn keine Kursart eine Soll-Dauer trug — die leere Ansicht nahm den Umschalter mit sich.',
        'Der Umschalter hängt jetzt daran, ob es überhaupt Daten gibt, nicht an der gerade gewählten Ansicht. Ohne gesetzte Soll-Dauer steht in der Prozent-Ansicht, was fehlt und wo es zu setzen ist.'
      ],
      en: [
        'Fixed: in the "Avg. duration by course type" card the "% of target" view could not be left again when no course type carried a target duration – the empty view took the switch with it.',
        'The switch now depends on whether there is any data at all, not on the current view. With no target set, the percentage view says what is missing and where to set it.'
      ]
    }
  },
  {
    version: '1.29.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Board, Planung und Kalender liegen jetzt unter **einem** Reiter „Umschulung", umschaltbar oben rechts. Der eigene Reiter „Planung" entfällt.',
        'An den Daten ändert sich nichts. Jede Ansicht behält ihre eigene Filterleiste — das Board filtert Personen, das Raster filtert Zeilen, und das sind zwei verschiedene Fragen. Geteilt sind nur Titel und Umschalter.',
        'Grund: beide beschreiben denselben Weg derselben Person. Getrennt konnten sie sich widersprechen, ohne dass es jemandem auffiel — ein Schritt in der Planung auf „absolviert", während die Karte auf dem Board noch in einer früheren Spalte hing.'
      ],
      en: [
        'Board, planning grid and calendar now live under **one** "Conversion" tab, switchable top right. The separate "Planning" tab is gone.',
        'Nothing about the data changes. Each view keeps its own filter bar – the board filters people, the grid filters rows, and those are two different questions. Only the title and the view switch are shared.',
        'The reason: both describe the same journey of the same person. Kept apart they could disagree unnoticed – a step marked completed in Planning while the card still sat in an earlier column on the board.'
      ]
    }
  },
  {
    version: '1.28.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Neue Kachel „Ø Dauer je Kursart" in der B737-Umschulung: Monate auf der x-Achse, eine Linie je Kursart, umschaltbar zwischen **Tagen** und **% vom Soll**.',
        'Gezählt wird je Kurs, nicht je Kopf. Ein Kurstermin mit zwölf Teilnehmern hat einmal stattgefunden — pro Kopf gerechnet hätte er den Monat zwölffach bestimmt und jeden anderen Kurs übertönt.',
        'In der Tagen-Ansicht bekommt jede Kursart ihre gestrichelte Soll-Linie in der eigenen Farbe; in der Prozent-Ansicht gibt es stattdessen eine neutrale 100-%-Linie, weil dort alle Soll-Linien dieselbe wären.',
        'Ein Monat ohne Kurs ist eine Lücke, keine Null: die Linie wird unterbrochen, ein einzelner Messpunkt bleibt als Punkt stehen.',
        'Laufende Kurse (Start ohne Ende) werden nicht mitgerechnet — sonst zöge ein begonnener Kurs den Schnitt gegen null. Wie viele es sind, steht unter dem Diagramm.',
        'Der Zieltermin bekommt ein Urteil: auf jeder Board-Karte steht neben dem Zieltermin, ob das letzte gebuchte Kursende ihn hält (grün) oder um wie viele Tage darüber liegt (rot).',
        'Solange nicht jeder Schritt ein Enddatum hat, steht dort „3/4" statt einer Farbe. Ein halb erfasster Plan sagt immer einen frühen Abschluss voraus — das wäre eine schmeichelnde Aussage, keine Messung.',
        'Kurslängen und Achsenwerte laufen durch dieselbe Zahlenformatierung wie die FTE-Werte („11,3" statt „11.3").'
      ],
      en: [
        'New card "Avg. duration by course type" in the B737 conversion: months on the x axis, one line per course type, switchable between **days** and **% of target**.',
        'Counted per course, not per head. A course date with twelve attendees happened once – per head it would have decided its month twelve times over and drowned out every other course.',
        'In the days view each course type gets its dashed target line in its own colour; the percentage view has a single neutral 100 % line instead, because there every target line would be the same one.',
        'A month with no course is a gap, not a zero: the line breaks, and a lone reading stays as a dot.',
        'Courses still running (a start with no end) are left out – otherwise a course that has begun would drag the average towards nothing. How many there are is stated under the chart.',
        'The target date finally gets a verdict: every board card says next to it whether the last booked course end holds it (green) or by how many days it is over (red).',
        'Until every step has an end date it reads "3/4" instead of a colour. A half-entered plan always forecasts an early finish, which would be flattering rather than measured.',
        'Course lengths and axis values run through the same number formatting as the FTE figures ("11,3" rather than "11.3").'
      ]
    }
  },
  {
    version: '1.27.0',
    date: '2026-07-27',
    type: 'minor',
    changes: {
      de: [
        'Neu: **Kurstermine**. Ein Kurstermin ist ein konkreter Durchlauf — Kursart, Provider, Ort, Zeitraum von–bis und Plätze. Anzulegen unter *Planung → 🗓 Kurstermine*.',
        'In der Planung wird eine Person auf einen Kurstermin gebucht, statt Provider und Datum je Person einzutippen. Der Zeitraum wird damit einmal erfasst, nicht fünfzig Mal — und derselbe Kurs kann nicht mehr drei verschiedene Enddaten haben.',
        'Weicht jemand ab (später eingestiegen, früher raus), lassen sich Start und Ende für diese eine Person überschreiben. Die Abweichung wird im Dialog ausdrücklich benannt.',
        'Plätze je Kurstermin mit Warnung: mehr Zuordnungen als Plätze markiert die Zahl rot. Gesperrt wird nichts — ein Kurs kann eine neunte Person aufnehmen.',
        'Bestehende Einträge bleiben unverändert: wer Provider und Datum direkt in der Zelle stehen hat, behält das. Ohne Kurstermin gibt es jetzt zusätzlich ein Feld „Bis“.',
        'Soll-Dauer je Kursart (in Tagen), einzustellen unter *Spalten bearbeiten*. Sie ist die Vergleichslinie für die Dauer-Auswertung.',
        'Kalender, Provider-Auslastung, Board-Karten sowie PDF- und Excel-Export lesen den aufgelösten Zeitraum — eine über einen Kurstermin gebuchte Person fällt nirgends mehr aus der Anzeige.'
      ],
      en: [
        'New: **course dates**. A course date is one concrete run – course type, provider, location, period from–to and seats. Managed under *Planning → 🗓 Course dates*.',
        'In the planning grid a person is booked onto a course date instead of typing a provider and a date per person. The period is recorded once, not fifty times – and the same course can no longer carry three different end dates.',
        'Where somebody deviates (joined late, left early), their own start and end can override the course. The dialog says so explicitly.',
        'Seats per course date with a warning: more bookings than seats turns the number red. Nothing is blocked – a course really can take a ninth person.',
        'Existing entries are untouched: whoever has a provider and a date typed into the cell keeps them. Without a course date there is now an additional "To" field.',
        'Target duration per course type (in days), set under *Edit columns*. It is the reference line for the duration analysis.',
        'The calendar, provider utilisation, board cards and both the PDF and Excel exports read the resolved period – somebody booked through a course date no longer drops out of any view.'
      ]
    }
  },
  {
    version: '1.26.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Die Umschulungs-Ziele unter „Kapazität" sind jetzt ein Raster: sechs Monate nebeneinander, jeder Monat mit eigenem Feld für „Freigegeben (Soll)" und „Trainer/Monat (Soll)". Direkt eintippen statt Monat für Monat über ein Formular hinzuzufügen.',
        'Ein Schieberegler (plus ‹ ›-Knöpfe) verschiebt das Sechs-Monats-Fenster bis Ende 2027 – in der Zielsetzung wie im Dashboard-Diagramm.',
        'Jeder Monat hat sein eigenes Ziel: ein leeres Feld heißt „kein Ziel gesetzt" und zeichnet keine Linie. Bisher wurde das letzte gesetzte Ziel stillschweigend in alle Folgemonate übernommen – das sah aus wie eine Entscheidung, die niemand getroffen hatte.',
        'Das Diagramm zeigt auch Monate ohne Zugang als leere Säule, damit das Fenster seine Form behält und ruhige Monate nicht einfach übersprungen werden.',
        'Behoben: lag ein Monatsziel über dem höchsten Balken, wurde die Ziellinie an den oberen Rand geklemmt – drei verschiedene Ziele lagen dann auf einer Höhe und sahen aus wie ein flacher Plan. Die Skala schließt die Ziellinie jetzt ein.'
      ],
      en: [
        'The conversion milestones on the Capacity tab are now a grid: six months side by side, each with its own field for "Released (plan)" and "Trainers/month (plan)". Type straight in instead of adding month after month through a form.',
        'A slider (plus ‹ › buttons) moves the six-month window through to the end of 2027 – both in the editor and in the dashboard chart.',
        'Every month owns its target: an empty field means "no target set" and draws no line. Previously the last target set was silently carried into every following month, which looked like a decision nobody had made.',
        'The chart keeps months with no intake as empty columns, so the window holds its shape and quiet months are not simply skipped.',
        'Fixed: a monthly target above the tallest bar was clamped to the top edge – three different targets then drew at the same height and read as one flat plan. The scale now includes the target line.'
      ]
    }
  },
  {
    version: '1.25.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Neu in der B737-Umschulung: „Eingehende Trainer je Monat". Je Säule ein Monat, aufgeteilt in Captain und First Officer, mit der Zahl direkt im Balken. Grundlage sind die Zieltermine der Personen.',
        'Dazu ein Monatsziel: unter „Kapazität → Umschulungs-Ziele" lässt sich je Monat neben dem bisherigen Gesamt-Meilenstein jetzt auch „Trainer/Monat (Soll)" setzen. Es erscheint als gestrichelte Linie über den Säulen.',
        'Die beiden Ziele liegen im selben Monats-Datensatz, meinen aber Verschiedenes: der Meilenstein ist kumulativ („bis Oktober 15 fertig"), das Monatsziel ein Durchsatz („26 Trainer im Oktober"). Sie überschreiben einander nicht, und erst wenn beide leer sind, verschwindet der Monat aus der Liste.',
        'Captain und First Officer tragen hier dieselben zwei Farben wie der Captain/First-Officer-Ring weiter oben – eine Sache, eine Farbe.'
      ],
      en: [
        'New in the B737 conversion section: "Incoming trainers per month". One column per month, split into Captain and First Officer, with the figure inside the bar. It is built from the people\'s target dates.',
        'With a monthly target: under "Capacity → Conversion milestones" you can now set "Trainers/month (plan)" per month alongside the existing cumulative milestone. It appears as a dashed line across the columns.',
        'Both targets live in the same month record but mean different things: the milestone is cumulative ("15 done by October"), the monthly target is throughput ("26 trainers in October"). They do not overwrite each other, and the month only disappears from the list once both are empty.',
        'Captain and First Officer carry the same two colours here as the Captain/First-Officer ring above – one thing, one colour.'
      ]
    }
  },
  {
    version: '1.24.1',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Behoben: In der Planung führte ein Klick auf „+ zuweisen" zu einer weißen Seite ohne Fehlermeldung. Der Dialog griff auf eine Farbfunktion zu, die es in seinem Gültigkeitsbereich nicht gab – das reißt in React die ganze Oberfläche ab, deshalb weiß und stumm.',
        'Die Planung hatte bisher keinen einzigen Browser-Test, weshalb ein Absturz beim wichtigsten Knopf des Reiters unbemerkt durchging. Neu: ein Test, der den Dialog öffnet, einen Provider und ein Datum setzt, speichert, schließt und wieder öffnet.'
      ],
      en: [
        'Fixed: in Planning, clicking "+ assign" produced a white page with no error message. The dialog reached for a colour helper that was not in its scope – in React that tears down the entire interface, hence blank and silent.',
        'Planning had no browser test at all, which is how a crash on the tab\'s main button slipped through. New: a test that opens the dialog, sets a provider and a date, saves, closes and reopens.'
      ]
    }
  },
  {
    version: '1.24.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'PDF: die Fußzeile entfällt ganz – weder Version noch Seitenzahl. Die Ränder sind von 40 auf 24 Punkt geschrumpft, dadurch nutzt die Tabelle das Blatt deutlich besser aus.',
        'Trainer-Tabelle: „Funktion / Anmerkung" heißt jetzt nur noch „Funktion" und steht am Ende der Tabelle, hinter der Umschulungs-Phase.',
        'Neue Spalte „Anmerkungen" ganz rechts: freier Text, rein zur Information. Sie fließt in keine Statistik und in keine Auswertung ein – im Gegensatz zu „Funktion", die weiterhin die Dashboard-Kachel „Funktion" speist. Bearbeitet wird sie im Trainer-Dialog; sie steht auch im Excel- und PDF-Export.',
        'Damit die Tabelle mit der 14. Spalte weiterhin ohne Querscrollen auf den Bildschirm passt, ist der seitliche Zellenabstand von 8 auf 6 Punkt geschrumpft.',
        'Beim Excel-Import gehen die Spaltenüberschriften „Anmerkung(en)", „Bemerkung(en)", „Kommentar" jetzt in die neue Spalte; die alte kombinierte Überschrift „Funktion / Anmerkung" bleibt bei „Funktion".',
        'B737-Umschulung: alle fünf Kacheln schreiben jetzt dazu, wen sie zählen – „von 50 im Umschulungs-Pool (SEN/TRE/TRI/LTC)". Ohne den Zusatz las sich „50 noch nicht gestartet" wie eine Aussage über alle.',
        'ORE-Priorität: das Diagramm zählt nur noch A, B und C. Personen ohne Stufe waren bisher als vierte Kategorie „—" dabei, wodurch die Gesamtzahl in der Überschrift nicht mehr zu den Segmenten passte.'
      ],
      en: [
        'PDF: the footer is gone entirely – neither version nor page number. Margins shrank from 40 to 24 points, so the table uses much more of the sheet.',
        'Trainer table: "Function / remark" is now just "Function" and sits at the end of the table, after the conversion stage.',
        'New "Notes" column on the far right: free text, purely informational. It feeds no statistic and no evaluation – unlike "Function", which still drives the dashboard\'s "Function" card. Edited in the trainer dialog; included in the Excel and PDF exports.',
        'So the table still fits on screen without sideways scrolling with a 14th column, horizontal cell padding went from 8 to 6 points.',
        'On Excel import the headers "Anmerkung(en)", "Bemerkung(en)" and "Kommentar" now go to the new column; the old combined header "Funktion / Anmerkung" still maps to "Function".',
        'B737 conversion: all five tiles now state whom they count – "of 50 in the conversion pool (SEN/TRE/TRI/LTC)". Without it, "50 not started yet" read as a statement about everybody.',
        'ORE priority: the chart counts A, B and C only. People without a tier used to appear as a fourth "—" category, which made the total in the heading disagree with the segments.'
      ]
    }
  },
  {
    version: '1.23.1',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Aus allen Exporten ist der Copyright-Hinweis entfernt: PDF-Fußzeile, Excel-Fußzeile und die JSON-Sicherung. In der Fußzeile steht jetzt nur noch die Version – auf einem ausgedruckten Blatt ist das die einzige Möglichkeit zu erkennen, aus welchem Stand die Zahlen stammen.',
        'Der Excel-Import erkennt die neue Fußzeile und wirft sie beim Wiedereinlesen weg – sonst wäre daraus ein Trainer namens „v1.23.1" geworden. Ältere Dateien mit der alten Copyright-Fußzeile werden weiterhin erkannt.',
        'In der App selbst (Fußzeile unten am Bildschirm) steht der Hinweis weiterhin – dort war er nicht gemeint.'
      ],
      en: [
        'The copyright notice is gone from every export: PDF footer, Excel footer and the JSON backup. The footer now carries the version only – on a printed page that is the only way to tell which build the numbers came from.',
        'The Excel import recognises the new footer and drops it on re-import – otherwise it would have become a trainer named "v1.23.1". Older files with the previous copyright footer are still recognised.',
        'In the app itself (the footer at the bottom of the screen) the notice stays – that was not what was meant.'
      ]
    }
  },
  {
    version: '1.23.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        '„Rente" ist als ORE-Stufe komplett entfernt – aus den Auswahlfeldern in Trainer und Planung, aus der Sortierung, aus dem ORE-Diagramm und aus jeder Filterung.',
        'Niemand wird gelöscht: wer die Stufe noch trug, behält seinen Datensatz und verliert nur die Markierung. Beim ersten Start passiert das automatisch, auf jedem Gerät.',
        'Damit zählen alle 50 Personen zur Kapazität. Die FTE-Gesamtzahl steigt von 42,9 auf 44,7 – das ist kein Rechenfehler, sondern genau die Kapazität, die vorher ausgeklammert war. Auch Umschulungs-Board, Zeitachse, Warnungen und PDF lassen jetzt niemanden mehr aus.',
        'Alle Zusätze „ohne Rente" sind weg, weil es nichts mehr auszuklammern gibt. Im Übersichts-Band stehen wieder zwei Zahlen: Köpfe und FTE – die dritte („Aktiv ohne Rente") wäre jetzt dieselbe Zahl unter anderem Namen.'
      ],
      en: [
        '"Rente" (retirement) is gone as an ORE tier – from the dropdowns in Trainers and Planning, from sorting, from the ORE chart and from every filter.',
        'Nobody is deleted: anyone still carrying the tier keeps their record and simply loses the marker. This happens automatically on first start, on every device.',
        'All 50 people therefore count towards capacity. The total FTE rises from 42.9 to 44.7 – not an arithmetic error but exactly the capacity that used to be left out. The conversion board, timeline, alerts and PDF no longer skip anybody either.',
        'Every "excl. retirees" qualifier is gone, because there is nothing left to exclude. The summary band is back to two figures, heads and FTE – the third ("Active excl. retirees") would now be the same number under a different name.'
      ]
    }
  },
  {
    version: '1.22.1',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Termine lassen sich wieder löschen. Ein gesetzter Zieltermin ließ sich auf dem iPad nicht mehr entfernen – das Datumsfeld von Safari bietet dafür schlicht keine Möglichkeit, und am Rechner half nur das kleine ✕, das Chrome von sich aus zeichnet.',
        'Jedes Datumsfeld hat jetzt einen eigenen Löschen-Knopf, der erscheint, sobald ein Datum drinsteht. Das betrifft alle acht Felder: Zieltermin (Umschulung, Kapazität, Trainer-Dialog), die Termine der Planung, LTC-/TRI-/TRE-Datum und „737 bis" bei den Other Pilots.'
      ],
      en: [
        'Dates can be removed again. A target date, once set, could not be taken back on the iPad – Safari\'s date field offers no way to do it, and on the desktop only the small ✕ that Chrome draws by itself helped.',
        'Every date field now carries its own clear button, which appears as soon as there is a date in it. That covers all eight: target date (conversion, capacity, trainer dialog), the planning dates, LTC/TRI/TRE dates and "737 until" for other pilots.'
      ]
    }
  },
  {
    version: '1.22.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Neu: Umschulungs-Ziele. Unter „Kapazität" lässt sich je Monat festlegen, wie viele bis dahin auf der 737 freigegeben sein sollen – ein Ziel je Monat, mehr braucht es nicht.',
        'Neu im Dashboard: die Kachel „Soll gegen Ist" mit Ampel. Grün heißt Ziel erreicht, Gelb bis zu einem Zehntel des Ziels hinterher (mindestens eine Person), Rot darüber. Dazu Soll, Ist und der Rückstand in Personen sowie das nächste Ziel.',
        'Gemessen wird immer gegen das zuletzt fällige Ziel, nicht gegen das nächstgelegene: ein verpasstes Oktober-Ziel verschwindet im November nicht aus dem Blick – dann zählt es erst recht.',
        'Im Verlaufsdiagramm zeigt eine gestrichelte Linie je Monat das Soll. Dort sollte die dunkle Fläche stehen.',
        'Auch die Ziele werden je Datensatz zusammengeführt: zwei Geräte können unterschiedliche Monate planen, ohne sich gegenseitig zu überschreiben.'
      ],
      en: [
        'New: conversion milestones. On the "Capacity" tab you can set per month how many should be released on the 737 by then – one milestone per month, nothing more is needed.',
        'New on the dashboard: the "Plan vs. actual" card with a traffic light. Green means the milestone is met, amber up to a tenth of it behind (at least one person), red beyond that. Plus plan, actual, the shortfall in people and the next milestone.',
        'It always measures against the last milestone that fell due, not the nearest one: a missed October target does not drop out of sight in November – that is exactly when it counts.',
        'On the progress chart a dashed line marks the plan for each month. That is where the dark block should reach.',
        'Milestones are merged per record too: two devices can plan different months without overwriting each other.'
      ]
    }
  },
  {
    version: '1.21.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Neu im Dashboard: „Fortschritt je Monat". Je Säule ein Monat, von unten nach oben freigegeben / in Umschulung / noch nicht gestartet – damit ist auf einen Blick zu sehen, ob das Tempo reicht.',
        'Der Verlauf schreibt sich selbst mit: die App hält bei jedem Start den Stand des laufenden Monats fest und aktualisiert ihn, bis der Monat vorbei ist. Zurückliegende Monate lassen sich nicht rekonstruieren – gespeichert war bisher nur der jeweils aktuelle Stand. Solange erst ein Monat vorliegt, sagt die Kachel das, statt eine einzelne Säule wie ein fertiges Diagramm aussehen zu lassen.',
        'Der Verlauf wird wie alle anderen Listen je Datensatz zusammengeführt: zwei Geräte im selben Monat vertragen sich, und ein Monat, den nur ein Gerät gesehen hat, geht nicht verloren.',
        '„Aktiv (ohne Rente)" ist zurück – als dritte Zahl im Übersichts-Band, wo sie neben Köpfen und FTE hingehört.',
        'Der Deploy führt jetzt vor dem Bauen die Tests aus. Eine kaputte Rechen- oder Sync-Logik kommt damit gar nicht mehr auf die Seite.'
      ],
      en: [
        'New on the dashboard: "Progress per month". One column per month, bottom to top released / in conversion / not started yet – so you can see at a glance whether the pace is enough.',
        'The history records itself: on every start the app captures the state of the current month and keeps it up to date until the month is over. Past months cannot be reconstructed – only the current state was ever stored. While there is just one month, the card says so instead of letting a single column look like a finished chart.',
        'History is merged per record like every other list: two devices in the same month get along, and a month only one device saw is not lost.',
        '"Active (excl. retirees)" is back – as the third figure in the summary band, next to heads and FTE where it belongs.',
        'The deploy now runs the tests before building. Broken arithmetic or sync logic no longer reaches the live site at all.'
      ]
    }
  },
  {
    version: '1.20.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Dashboard aufgeräumt: die sieben Kacheln „Aktiv", „Prüfer (SEN/TRE)", „Instruktoren (TRI/LTC/SFI/TKI)", „Captain" und „First Officer" sind weg – dieselben Zahlen stehen direkt darunter in den Diagrammen (Trainer-Qualifikation bzw. Captain/First-Officer-Ring).',
        'Stattdessen ein breites Übersichts-Band mit den beiden Zahlen, die sonst nirgends auf der Seite stehen: Köpfe gesamt und FTE (ohne Rente), durch eine feine Linie getrennt. Auf schmalen Bildschirmen stapelt es sich.',
        'Das Dashboard-PDF zieht mit: die Übersichts-Tabelle nennt nur noch Köpfe und FTE; Qualifikations- und Captain/FO-Tabellen im selben PDF tragen den Rest wie bisher.'
      ],
      en: [
        'Dashboard decluttered: the seven tiles "Active", "Examiners (SEN/TRE)", "Instructors (TRI/LTC/SFI/TKI)", "Captain" and "First Officer" are gone – the same numbers sit right below in the charts (trainer qualification and the Captain/First-Officer ring).',
        'In their place a wide summary band with the two figures that appear nowhere else on the page: total heads and FTE (excl. retirees), separated by a hairline. On narrow screens it stacks.',
        'The dashboard PDF follows suit: its overview table lists only heads and FTE; the qualification and Captain/FO tables in the same PDF carry the rest as before.'
      ]
    }
  },
  {
    version: '1.19.4',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'FTE-Summen stimmen jetzt überall überein. Dieselben Personen wurden je nach Kachel als 42,8, 42,9 oder 43 angezeigt.',
        'Ursache 1 – die Reihenfolge der Addition: die Daten ergeben exakt 42,85 und liegen damit genau auf der Rundungsgrenze. Person für Person addiert kam der Computer auf 42,8499…, Base für Base auf 42,85 – das eine rundet ab, das andere auf. Gerechnet wird jetzt durchgehend in Hundertsteln, damit gibt es nur noch ein Ergebnis.',
        'Ursache 2 – drei verschiedene Personenkreise hießen alle nur „FTE": alle 50 Personen (44,7), alle ohne Rente (42,9) und der Umschulungs-Pool. Jede Zahl trägt jetzt dazu, wen sie zählt.',
        'Ursache 3 – die Legende der Kachel „Köpfe vs. FTE je Base" hat die bereits gerundeten Zeilen noch einmal zusammengezählt und kam so auf 43 statt 42,9. Sie zeigt jetzt die echte Gesamtsumme.',
        'Ursache 4 – in der Kapazitäts-Tabelle konnte „verfügbar" um 0,1 neben „FTE gesamt minus in Umschulung" liegen, weil jede Spalte für sich gerundet wurde. Die Spalte wird jetzt aus den angezeigten Zahlen gebildet, die Zeile geht also immer auf.',
        'Im PDF stand unter „FTE Gesamt" die Summe inklusive Rente, also eine größere Zahl als auf demselben Dashboard. Außerdem standen dort und im Umschulungs-Board Zahlen mit Punkt statt Komma. Beides korrigiert.',
        'Neu unter jeder FTE-Zahl: eine Erklärung, wie sie zustande kommt (Vollzeit 1,0 · 90 % 0,9 · 80 % 0,8 · 75 % 0,75 …, je Person im Trainer-Dialog überschreibbar).'
      ],
      en: [
        'FTE totals now agree everywhere. The same people were shown as 42.8, 42.9 or 43 depending on which card you read.',
        'Cause 1 – the order of addition: the data adds up to exactly 42.85, right on the rounding boundary. Added person by person the computer got 42.8499…, added base by base 42.85 – one rounds down, the other up. Everything is now counted in hundredths, so there is only one result.',
        'Cause 2 – three different groups of people were all just called "FTE": all 50 people (44.7), everyone except the retirees (42.9), and the conversion pool. Every figure now says which group it counts.',
        'Cause 3 – the legend of the "Heads vs. FTE per base" card added the already-rounded rows back up and arrived at 43 instead of 42.9. It now shows the real total.',
        'Cause 4 – in the capacity table "available" could sit 0.1 away from "FTE total minus in conversion", because each column was rounded on its own. That column is now derived from the displayed numbers, so the row always adds up.',
        'In the PDF, "FTE total" printed the sum including retirees – a bigger number than the same dashboard showed. It and the conversion board also printed numbers with a dot instead of a comma. Both fixed.',
        'New underneath every FTE figure: an explanation of how it is arrived at (full time 1.0 · 90% 0.9 · 80% 0.8 · 75% 0.75 …, overridable per person in the trainer dialog).'
      ]
    }
  },
  {
    version: '1.19.3',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Die beiden „Köpfe vs. FTE"-Kacheln sind jetzt im Eurowings-Stil wie der Rest des Dashboards: Burgunder statt des Violetts, das dort als einzige Fremdfarbe stand.',
        'Statt zwei Balken nebeneinander steckt der FTE-Balken jetzt im Köpfe-Balken – das entspricht der Sache, denn FTE ist ein Teil der Köpfe. Der helle Rest am Balkenende ist der Teilzeit-Anteil.',
        'Die Kacheln haben jetzt wie alle anderen ein „Gesamt" in der Überschrift, gleiche Balkenhöhe und gleiche Zahlendarstellung.'
      ],
      en: [
        'The two "Heads vs. FTE" cards now follow the Eurowings style like the rest of the dashboard: burgundy instead of the violet that stood out as the only foreign colour there.',
        'Instead of two bars side by side, the FTE bar now sits inside the headcount bar – which matches reality, since FTE is a part of the heads. The light remainder at the end of the bar is the part-time share.',
        'The cards now carry a "Total" in their heading like all the others, with the same bar height and number style.'
      ]
    }
  },
  {
    version: '1.19.2',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Dashboard-PDF: es bleibt auf einer Seite, solange das lesbar ist – wird das Dashboard so hoch, dass alles zu klein würde, geht es auf einer zweiten Seite weiter, statt immer weiter zu schrumpfen. Mit dem heutigen Dashboard bleibt es bei einer Seite.',
        'Kleinere Aufräumarbeit im Stylesheet: die Balken der neuen Diagramme benutzen dieselbe Grundlage wie die übrigen Balken statt einer Kopie davon.'
      ],
      en: [
        'Dashboard PDF: it stays on one page while that is readable – if the dashboard grows so tall that everything would become too small, it continues on a second page instead of shrinking indefinitely. With the current dashboard it remains a single page.',
        'Small stylesheet cleanup: the bars of the new charts build on the same base as the other bars instead of a copy of it.'
      ]
    }
  },
  {
    version: '1.19.1',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Das Zahnrad zeigt jetzt tatsächlich an, wenn man in den Einstellungen ist – das war in 1.19.0 versprochen, aber nicht umgesetzt.',
        '„Köpfe vs. FTE je Aircraft" hatte irreführende Farben: die Balken trugen genau die Farben, die auf demselben Dashboard A320 und B737 bedeuten. Jetzt ein eigenes Farbpaar (ein Ton, zwei Stufen), weil Köpfe und FTE dieselbe Größe zweimal gezählt sind.',
        'Die B737-Zeile zeigte bei 0 einen kleinen farbigen Strich, als wäre etwas vorhanden. Eine Null zeichnet jetzt gar keinen Balken.',
        'Beide Base-Diagramme listen die Bases wieder in derselben Reihenfolge – vorher standen sie nebeneinander und man verglich versehentlich verschiedene Bases.',
        'FTE-Zahlen werden im Dashboard und in der Kapazität gleich geschrieben (vorher „42,9" gegen „42.9").',
        'Lange Anmerkungen machen die Trainer-Tabelle nicht mehr breit – sie brechen um. Die Spalte „Ausstellende Behörde" wird nicht mehr abgeschnitten.',
        'Ein fehlgeschlagenes Speichern ist jetzt am roten Knopf erkennbar; vorher sah es aus wie ein erfolgreiches.',
        'Auf sehr schmalen Handys rutscht kein Symbol der Kopfzeile mehr über den Rand.'
      ],
      en: [
        'The gear now actually shows when you are in Settings – promised in 1.19.0 but not implemented.',
        '"Heads vs. FTE per aircraft" had misleading colours: the bars carried exactly the colours that mean A320 and B737 on the same dashboard. It now uses its own pair (one hue, two steps), because heads and FTE are one measure counted twice.',
        'The B737 row drew a small coloured stub at zero, suggesting something was there. A zero now draws no bar at all.',
        'Both base charts list the bases in the same order again – side by side, the old ordering invited comparing the wrong ones.',
        'FTE figures are written the same way on the dashboard and on the Capacity tab (previously "42,9" vs "42.9").',
        'Long remarks no longer widen the trainer table – they wrap. The issuing-authority column is no longer truncated.',
        'A failed save is now visible on the button; it used to look exactly like a successful one.',
        'On very narrow phones no header icon is pushed off the edge any more.'
      ]
    }
  },
  {
    version: '1.19.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Neu im Dashboard: „Köpfe vs. FTE je Base" und „Köpfe vs. FTE je Aircraft". Der Abstand zwischen den beiden Balken ist der Teilzeit-Anteil – man sieht auf einen Blick, wo Köpfe und tatsächlich verfügbare Kapazität auseinanderlaufen. Zahlen wie in der Kapazität, Rente ist nicht enthalten.',
        'Die Untertitel-Zeile „Boeing 737 MAX Phase-In …" in der Kopfzeile ist entfernt.',
        'Einstellungen sind kein Reiter mehr, sondern ein Zahnrad oben rechts – Reihenfolge: DE/EN, Zahnrad, Neu laden, Speichern, Dunkelmodus. Die Reiterleiste ist dadurch kürzer.',
        'Trainer-Tabelle deutlich schmäler: sie passt jetzt ohne seitliches Scrollen auf den Bildschirm (vorher 1403 px breit, jetzt 1234 px). Auf dem Handy scrollt sie wie gehabt.'
      ],
      en: [
        'New on the dashboard: "Heads vs. FTE per base" and "Heads vs. FTE per aircraft". The gap between the two bars is the part-time share, so it is immediately visible where headcount and actually available capacity diverge. Same numbers as the Capacity tab; retirees excluded.',
        'The "Boeing 737 MAX Phase-In …" subtitle has been removed from the header.',
        'Settings is no longer a tab but a gear in the header – order: DE/EN, gear, reload, save, dark mode. The tab row is shorter for it.',
        'The trainer table is markedly narrower: it now fits on screen without sideways scrolling (1403px before, 1234px now). On a phone it scrolls as before.'
      ]
    }
  },
  {
    version: '1.18.2',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Überschrift oben ohne „737": nur noch „Trainer & Prüfer Monitoring". Das Logo behält seines.',
        'Version & Changelog: jede Version ist jetzt eine Zeile mit Nummer und Datum und lässt sich aufklappen. Die neueste ist offen.',
        'Sync-Nachbesserung: ein Fehler aus 1.18.1 behoben, bei dem eine Änderung, die während des Ladens vom Server gemacht wurde, aus dem Abgleich fiel und danach überschrieben wurde.',
        'Schlagen beide Übertragungsversuche fehl, meldet die App das jetzt, statt fälschlich „Synchron" anzuzeigen.',
        'Beim Schließen wird nicht mehr geschrieben, während gerade ein Abgleich läuft, und derselbe Stand wird nicht bei jedem Wegschalten erneut hochgeladen.',
        'Die Größenprüfung beim Schließen zählt jetzt Bytes statt Zeichen – bei deutschen Texten (Umlaute, ß) wurde die Grenze sonst überschritten und die Übertragung stillschweigend verworfen.',
        'Der allererste Eintrag in der Cloud wird jetzt angelegt statt überschrieben: melden sich zwei Geräte gleichzeitig an, verliert keines mehr seine Daten.'
      ],
      en: [
        'The heading no longer carries "737": just "Trainer & Examiner Monitoring". The logo keeps its own.',
        'Version & changelog: each version is now a single row with number and date that expands on click. The newest one is open.',
        'Sync follow-up: fixed a defect from 1.18.1 where an edit made while the app was loading from the server was left out of the merge and then overwritten.',
        'If both send attempts lose the race, the app now says so instead of wrongly showing "in sync".',
        'The write on close no longer fires while a sync is running, and the same state is not re-uploaded on every switch away.',
        'The size check on close counts bytes rather than characters – with German text (umlauts, ß) the limit was exceeded and the write silently discarded.',
        'The very first cloud entry is now created rather than overwritten: if two devices sign in at the same moment, neither loses its data.'
      ]
    }
  },
  {
    version: '1.18.1',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Wichtig: Änderungen von einem anderen Gerät konnten verschwinden. Beim Schließen bzw. Wegwischen der App schrieb das Gerät seinen eigenen Stand ungeprüft über die Cloud – und löschte damit, was ein anderes Gerät kurz zuvor hochgeladen hatte. Behoben.',
        'Der Schreibvorgang prüft jetzt immer, ob die Cloud noch auf dem Stand ist, den er gerade gelesen hat. Hat inzwischen ein anderes Gerät geschrieben, wird nicht überschrieben, sondern neu gelesen und zusammengeführt.',
        'Beim Schließen wird nur noch geschrieben, wenn die Cloud unverändert ist. Andernfalls bleiben die Änderungen lokal und werden beim nächsten Öffnen sauber zusammengeführt – nichts geht verloren.'
      ],
      en: [
        'Important: changes made on another device could disappear. On close or swipe-away the app wrote its own copy over the cloud without checking, erasing what another device had just uploaded. Fixed.',
        'Every write now checks that the cloud is still at the state it just read. If another device wrote in between, nothing is overwritten – it re-reads and merges again.',
        'The write on close only happens while the cloud is unchanged. Otherwise the edits stay local and are merged properly on the next open – nothing is lost.'
      ]
    }
  },
  {
    version: '1.18.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Farben komplett überarbeitet – Eurowings-Burgunder führt, Sky als zweite Stimme, und jede Farbe hat jetzt genau eine Aufgabe. Vorher hieß Grün gleichzeitig „TKI", „im Plan", „freigegeben", „in use" und „Rating gültig".',
        'Statusfarben sind reserviert: Grün/Amber/Rot bedeuten nur noch einen Zustand und werden nie mehr als Kategoriefarbe vergeben. „extern" trug bisher das Warn-Amber, obwohl extern keine Warnung ist.',
        'Umschulungs-Phasen laufen jetzt als eine Farbe von hell nach dunkel – man sieht den Fortschritt an der Farbe. Bisher lagen „TR-Theorie" und „SIM / Type Rating" farblich fast übereinander.',
        'Balken-Diagramme mit nur einer Reihe (Base, Behörde, Part-Time, Qualifikation) sind einfarbig. Die Balkenlänge sagt es bereits; fünf Farben machten daraus fünf scheinbar zusammenhanglose Dinge.',
        'Dashboard-Kacheln: die Zahlen tragen die Aussage, nicht acht verschiedene Farben. Farbe bleibt dort, wo sie etwas bedeutet – Captain/FO und die Umschulungs-Zustände.',
        'Lesbarkeit: weiße Schrift auf hellen Marken war teils bei 2,2:1 statt 4,5:1. Marken haben jetzt eine getönte Fläche mit farbiger Schrift und sind in jedem Farbton lesbar.',
        'Der Dunkelmodus hat eigene Farbstufen statt umgedrehter heller Werte.'
      ],
      en: [
        'Colour system rebuilt – Eurowings burgundy leads, sky is the second voice, and every colour now does exactly one job. Green used to mean "TKI", "on track", "released", "in use" and "rating valid" at the same time.',
        'Status colours are reserved: green/amber/red only ever mean a state and are never handed out as a category colour. "external" wore the at-risk amber, although external is not a warning.',
        'Conversion stages now run as one hue from light to dark, so progress is visible in the colour. "TR theory" and "SIM / type rating" used to be nearly the same colour.',
        'Single-series bar charts (base, authority, part-time, qualification) use one colour. The bar length already carries the comparison; five hues made one card look like five unrelated things.',
        'Dashboard tiles: the numbers carry the message, not eight different colours. Colour stays where it means something – captain/FO and the conversion states.',
        'Legibility: white text on light badges was as low as 2.2:1 instead of 4.5:1. Badges now use a tinted surface with coloured text and stay readable for any hue.',
        'Dark mode has its own colour steps instead of flipped light values.'
      ]
    }
  },
  {
    version: '1.17.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Mehrere Geräte funktionieren jetzt richtig: abgeglichen wird je Datensatz statt den ganzen Datenbestand zu ersetzen. Änderst du am Laptop Person A und am iPad Person B, bleiben beide erhalten. Nur wenn dieselbe Person auf beiden Geräten geändert wurde, gilt die neuere Änderung.',
        'Gelöschtes bleibt gelöscht – ein anderes Gerät, das den Eintrag noch hat, bringt ihn nicht zurück. Wird derselbe Eintrag danach woanders bearbeitet, gilt die Bearbeitung.',
        'Zusätzlich wird jetzt auch beim Schließen bzw. Wegwischen der App noch einmal hochgeladen, damit die letzten Änderungen nicht bis zum nächsten Start liegen bleiben.',
        'Die Sicherungs-/Wiederherstellen-Schaltfläche aus 1.16.0 entfällt: sie war die Notlösung dafür, dass der ganze Bestand überschrieben wurde. Das passiert nicht mehr.'
      ],
      en: [
        'Multiple devices now work properly: syncing happens record by record instead of replacing the whole data set. Edit person A on the laptop and person B on the iPad and both survive. Only when the same person was changed on both devices does the newer edit win.',
        'Deletions stay deleted – another device that still holds the record does not bring it back. If that same record is edited elsewhere afterwards, the edit wins.',
        'The app now also pushes once more when it is closed or swiped away, so the last changes do not sit around until the next start.',
        'The backup/restore button from 1.16.0 is gone: it was the workaround for the whole data set being overwritten, which no longer happens.'
      ]
    }
  },
  {
    version: '1.16.0',
    date: '2026-07-25',
    type: 'minor',
    changes: {
      de: [
        'Der Sync läuft jetzt automatisch alle 2 Minuten – zusätzlich beim Öffnen der App, beim Zurückwechseln zur App und rund 2 Sekunden nach jeder Änderung.',
        'Weicht die Cloud ab, gilt immer der Cloud-Stand. Die Rückfrage „Dieses Gerät behalten / Cloud-Stand übernehmen" entfällt damit ersatzlos.',
        'Damit dabei nichts verloren geht: waren auf diesem Gerät noch nicht übertragene Änderungen offen, werden sie vorher gesichert. In den Einstellungen erscheint dann „Gesicherten Stand zurückholen" – ein Klick stellt sie wieder her und macht sie zum neuen Cloud-Stand.'
      ],
      en: [
        'Sync now runs automatically every 2 minutes – plus on app start, when returning to the app, and about 2 seconds after each change.',
        'If the cloud differs, the cloud version always wins. The “Keep this device / Take the cloud version” prompt is gone for good.',
        'So nothing is lost in the process: if this device still had unpushed changes, they are backed up first. Settings then offers “Restore the backup” – one click brings them back and makes them the new cloud version.'
      ]
    }
  },
  {
    version: '1.15.6',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Umschulung: die Kacheln sind jetzt deutlich schmäler (Spalte höchstens 200 px statt über die ganze Breite gezogen, auf dem Handy 168 px). Innenabstände, Marken und die ‹ ›-Knöpfe wurden mit verkleinert, damit die Karten nicht höher werden – dadurch sind mehr Phasen gleichzeitig sichtbar.'
      ],
      en: [
        'Conversion: the cards are noticeably narrower (column capped at 200px instead of stretching across the viewport, 168px on a phone). Padding, badges and the ‹ › buttons were tightened along with it so the cards do not grow taller – more stages fit on screen at once.'
      ]
    }
  },
  {
    version: '1.15.5',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Keine stumme weiße Seite mehr: wenn die App nach ein paar Sekunden nicht startet (typischerweise eine veraltete Seite im Browser-Cache), erscheint jetzt ein Hinweis mit der Anleitung zum Neuladen statt eines leeren Fensters.'
      ],
      en: [
        'No more silent white page: if the app has not started after a few seconds (typically a stale page in the browser cache), a hint with reload instructions is shown instead of an empty window.'
      ]
    }
  },
  {
    version: '1.15.4',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'App war online nicht mehr erreichbar: das Repository wurde umbenannt, damit ändert sich die Adresse. Die App liegt jetzt unter …github.io/Instructor-Pr-fer-Overview/ (bitte Lesezeichen und Home-Bildschirm-Symbol aktualisieren).',
        'Der Build ermittelt die Adresse jetzt selbst aus dem Repository-Namen – eine erneute Umbenennung nimmt die App künftig ohne Anpassung mit.',
        'Sync-Anzeige oben ist jetzt nur noch ein Punkt: grün = angemeldet und synchron, rot = nicht angemeldet (bzw. offline, Fehler, Konflikt). Der genaue Status steht weiterhin als Tooltip am Punkt und ausführlich in den Einstellungen.'
      ],
      en: [
        'The app was unreachable online: the repository was renamed, which moves its address. It now lives at …github.io/Instructor-Pr-fer-Overview/ (please update bookmarks and the home-screen icon).',
        'The build now derives that address from the repository name itself, so a future rename no longer breaks the deployment.',
        'The header sync indicator is now just a dot: green = signed in and in sync, red = not signed in (or offline, error, conflict). The exact state remains as a tooltip on the dot and in full in Settings.'
      ]
    }
  },
  {
    version: '1.15.3',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Anmelden verständlicher: oben wird jetzt klar zwischen „Anmelden" und „Neu registrieren" gewählt, darunter gibt es nur noch einen Button. Vorher standen zwei ähnliche Knöpfe nebeneinander und man landete beim ersten Mal leicht im falschen.',
        'Klartext statt Supabase-Englisch: „Invalid login credentials" heißt jetzt „Konto existiert noch nicht – bitte registrieren", und die App schaltet gleich richtig um. Ebenso für nicht bestätigte E-Mail, deaktivierte Registrierung, zu kurzes Passwort und fehlende Internetverbindung.'
      ],
      en: [
        'Clearer sign-in: an explicit “Sign in” / “Create account” choice at the top and a single button below. Two similar-looking buttons made it easy to pick the wrong one on first use.',
        'Plain language instead of raw Supabase errors: “Invalid login credentials” now reads “that account does not exist yet – please register”, and the form switches over for you. Same for unconfirmed email, disabled sign-ups, short passwords and no connection.'
      ]
    }
  },
  {
    version: '1.15.2',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Sync-Fehler behoben: beim Start konnten zwei Abgleiche gleichzeitig starten und sich gegenseitig als „Konflikt" melden.',
        'Weniger Netzwerkverkehr beim Sync (die Sitzung wird lokal gelesen statt bei jedem Schritt neu beim Server erfragt).',
        'Projekt-URL wird robuster erkannt (auch „…/rest/v1//" oder in Großbuchstaben).'
      ],
      en: [
        'Sync fix: two syncs could start at once on load and report each other as a “conflict”.',
        'Less network chatter during sync (the session is read locally instead of re-validated at every step).',
        'The project URL is parsed more robustly (also “…/rest/v1//” or upper case).'
      ]
    }
  },
  {
    version: '1.15.1',
    date: '2026-07-25',
    type: 'patch',
    changes: {
      de: [
        'Cloud-Sync ist jetzt scharf geschaltet: das Supabase-Projekt ist fest hinterlegt, der Sync läuft nach dem Anmelden in den Einstellungen.'
      ],
      en: [
        'Cloud sync is now live: the Supabase project is wired in, syncing starts once you sign in from Settings.'
      ]
    }
  },
  {
    version: '1.15.0',
    date: '2026-07-24',
    type: 'minor',
    changes: {
      de: [
        'Cloud-Sync (Supabase) ist eingebaut: Anmelden in den Einstellungen, danach werden die Daten automatisch zwischen deinen Geräten abgeglichen.',
        'Neue Sync-Anzeige oben in der Kopfzeile: „Nicht angemeldet", „Synchronisiert …", „Synchron" (mit Uhrzeit), „Offline", „Sync-Fehler" oder „Konflikt".',
        'Ausführliche Sync-Karte in den Einstellungen: Status, letzte Synchronisierung, „Jetzt synchronisieren", An-/Abmelden und Registrieren.',
        'Bei gleichzeitigen Änderungen auf zwei Geräten fragt die App nach („Dieses Gerät behalten" / „Cloud-Stand übernehmen"), statt still zu überschreiben.',
        'Die App bleibt vollständig offline-fähig: lokal gespeichert wird immer, die Cloud ist eine zusätzliche Kopie.'
      ],
      en: [
        'Cloud sync (Supabase) is built in: sign in from Settings and your data is kept in step across devices.',
        'New sync indicator in the header: “Not signed in”, “Syncing …”, “In sync” (with time), “Offline”, “Sync error” or “Conflict”.',
        'Detailed sync card in Settings: state, last sync, “Sync now”, sign in/out and sign up.',
        'When two devices changed at once the app asks (“Keep this device” / “Take the cloud version”) instead of silently overwriting.',
        'The app stays fully offline-capable: data is always stored locally, the cloud is an additional copy.'
      ]
    }
  },
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
