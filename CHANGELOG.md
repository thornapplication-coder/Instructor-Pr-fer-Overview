# Changelog

Alle nennenswerten Änderungen dieses Projekts. Versionierung nach
[SemVer](https://semver.org/lang/de/): Jeder Push ist eine neue Version,
beginnend bei `1.0.0`.

- **MAJOR** (`x.0.0`): große Umbauten / grundlegende Änderungen
- **MINOR** (`1.x.0`): neue Funktionen / neue Reiter
- **PATCH** (`1.0.x`): Fehlerbehebungen, kleine Anpassungen, Datenpflege

Die Version ist zusätzlich in der App unter **Einstellungen → Version & Changelog**
sichtbar. Bei einem neuen Deploy erscheint automatisch ein **Update-Popup**.

## [1.13.1] – 2026-07-24

- **Provider – aufgeräumte Toolbar**: „Kurse bearbeiten", „SIM Versionen
  bearbeiten" und „Status bearbeiten" liegen nicht mehr außen. Ausgewählt wird
  direkt im Detail-Fenster; wer die Auswahllisten erweitern will, nutzt dort das
  kleine **⚙** neben dem jeweiligen Feld (öffnet den Listen-Editor im selben
  Dialog, die halb ausgefüllte Provider-Maske bleibt erhalten).
- **Kapazität**: In „FTE-Kapazität je Aircraft" sind **A320 und B737 immer
  sichtbar** – auch solange überall 0 steht.
- **Trainer – Ausstellende Behörde ohne „EASA"**: gespeichert und angezeigt wird
  nur noch das Land („EASA - Austria" → „Austria"). Wirkt in der Tabelle, im
  Dashboard-Diagramm und in allen Exporten; Werte ohne EASA-Präfix bleiben
  unverändert.

## [1.13.0] – 2026-07-24

- **Planung – neuer Kurskalender**: Monatsansicht aller Kursstarts (Kürzel +
  Kurs-Kürzel am Starttermin, farbig je Kurs, mit Legende). Umschaltbar über
  „Tabelle / Kalender". Monate ohne Termine bleiben als Brücke sichtbar, damit
  die Zeitachse durchgängig ist. Im **PDF** wird der Kalender zusätzlich je
  Monat als Tabelle (Datum · TLC · Name · Kurs · Provider · Status) ausgegeben;
  beim Drucken bricht kein Monat über zwei Seiten um.
- **Planung zeigt garantiert alle Trainer** – auch gerade neu angelegte. Neuer
  Zähler „x / y angezeigt" und ein „Filter zurücksetzen"-Button machen sofort
  sichtbar, falls ein aktiver Filter jemanden ausblendet; der ORE-Filter kennt
  jetzt auch „Rente".
- **Provider**: Spalte **„Zulassung/Behörde" entfernt** (Tabelle, Formular,
  PDF und Excel).
- **Provider**: neue Spalte **„SIM Version"** – Dropdown mit leerem Eintrag und
  **Mehrfachauswahl** (NG, MAX …), gewählte Werte als Chips. Die Auswahlliste
  ist über „⚙ SIM Versionen bearbeiten" frei erweiterbar.
- **Kapazität**: neue Statistik **„FTE-Kapazität je Aircraft"** (A320 / B737) –
  auch im Kapazitäts-PDF.
- **Umschulung nur für SEN · TRE · TRI · LTC**: SFI und TKI sind aus dem Board,
  den Umschulungs-KPIs, dem Qualifikations-Filter, der Zieltermin-Timeline und
  dem Umschulungs-Export ausgenommen. In der Planung und in den
  Kapazitätstabellen bleiben sie weiterhin enthalten.

## [1.12.0] – 2026-07-24

- **Rolle „Captain" / „First Officer (FO)"** je Person: auswählbar im
  Bearbeiten-Dialog, als farbige **CPT**-/**FO**-Marke in der Trainer-Tabelle und
  auf den Umschulungs-Karten sichtbar, dazu ein eigener Filter „Rolle (Cockpit)".
  Standard ist **Captain**; **M7H** und **T9J** sind als **FO** hinterlegt
  (einmalige Umstellung, spätere manuelle Änderungen bleiben erhalten).
- **Dashboard in zwei Rubriken gegliedert**: „Instruktoren & Prüfer Overview"
  und „B737 Umschulung".
- **Dashboard editierbar**: Über „⠿ Anordnen" lassen sich Kacheln und Diagramme
  per Drag & Drop innerhalb ihrer Gruppe verschieben; die Reihenfolge wird
  gespeichert und übersteht einen Neustart.
- **Instruktoren-Kacheln aufgeteilt**: eigene Kacheln für „Instruktoren (TRI)"
  und „Instruktoren (LTC)", neu „Instruktoren (SFI/TKI)". Durchgängige Reihenfolge
  SEN → TRE → TRI → LTC → SFI → TKI; jede Person zählt genau einmal (keine
  Doppelungen).
- **Neue Statistik „Qualifikation je Aircraft"** (gestapelt A320/B737) und neues
  Diagramm **„Captain / First Officer"**.
- **„Fristen & Warnungen" vom Dashboard entfernt** (die Kapazitäts-Timeline
  färbt Zieltermine weiterhin nach Dringlichkeit).
- Die Rolle steht auch in den **Trainer-Exporten (PDF/Excel)** und wird beim
  **Excel-/CSV-Import** erkannt (FO, F/O, First Officer, Captain, CPT …).

## [1.11.0] – 2026-07-24

Großes Audit-Fixpaket (Datenintegrität, Konsistenz, Barrierefreiheit, Sicherheit):

- **Datenverlust behoben**: selbst angelegte Planungsspalten (eigene Schritte)
  gehen beim Neuladen, Import oder Bearbeiten nicht mehr verloren.
- **Mehrere Tabs/Fenster**: Änderungen werden nicht mehr von einem älteren,
  offenen Tab überschrieben (Cross-Tab-Sync). Fehlgeschlagene Speicherungen
  (voller/gesperrter Speicher) werden jetzt angezeigt statt still verschluckt.
- **Namen statt IDs**: Qualifikationen und Kurse erscheinen überall mit ihrem
  Namen – Tabellen, Board, Diagramme, Suche und alle PDF-/Excel-Exporte.
- **Umschulungs-Phasen positionsbasiert**: „nicht gestartet" und „freigegeben"
  richten sich nach der Position der Phase, nicht nach festen Namen. Phasen
  umbenennen/löschen bricht KPIs, Warnungen und das Board nicht mehr.
- **Freigegeben ↔ Status „erledigt"** ist jetzt in allen Editoren konsistent
  (Board, Kapazitäts-Tabelle, Detail-Dialog), inkl. Zurücksetzen beim Verlassen
  der letzten Phase.
- **Kapazität**: Trainer in Rente zählen nicht mehr als „verfügbare FTE"
  (konsistent mit Board und Timeline).
- **Import robuster**: deutsche Datumsangaben (TT.MM.JJJJ) und Dezimalkomma
  („0,8") werden korrekt gelesen, zweistellige Jahre richtig zugeordnet, die
  FTE-Spalte übernommen und Titel-/Kopfzeilen über der Tabelle übersprungen.
- **Sicherheit**: Excel-Export gegen Formel-Einschleusung abgesichert; leere
  Planungszellen erscheinen im Export leer statt „[offen]"; der JSON-Import
  prüft jetzt die Dateistruktur (keine stille Überschreibung durch Fremd-JSON);
  zusätzlicher Schutz beim Excel-Import (Prototype-Pollution).
- **Provider löschen** entfernt jetzt auch die zugehörigen Planungs-Zuweisungen
  (mit Warnung, wenn welche bestehen).
- **Barrierefreiheit**: Tabellenzeilen, Sortier-Überschriften und Dialoge sind
  jetzt per Tastatur bedienbar (Fokus im Dialog, Escape schließt); Drag & Drop
  funktioniert nun auch in Firefox.
- **Kategorien löschen** fragt jetzt nach; das Dashboard-PDF erzeugt kein leeres
  Dokument mehr, sondern fällt auf die Tabellenansicht zurück.

## [1.10.4] – 2026-07-24

- **Umschulungs-Board**: zusätzlicher horizontaler Scrollbalken **oberhalb** der
  Spalten (mit dem unteren synchronisiert) – seitwärts scrollen, ohne erst ganz
  nach unten zu müssen.

## [1.10.3] – 2026-07-24

- **Diagramm-Legenden**: lange Beschriftungen (z. B. „Office/MGMT/Funktion")
  brechen jetzt innerhalb der Karte um; der Zahlenwert wird nicht mehr am
  Kartenrand abgeschnitten (wirkt auch im Dashboard-PDF).

## [1.10.2] – 2026-07-24

Behebungen aus dem Branch-Review:

- **Umschulung**: der seit v1.9.2 funktionslose A320→B737-Regler (oben) wurde
  entfernt – das Aircraft wird pro Trainer gesetzt.
- **Drucken**: der Hinweis „Druckfenster blockiert – als PDF heruntergeladen"
  erscheint jetzt bei **allen** Seiten (vorher nur beim Dashboard).
- **Import** robuster: Anmerkungen wie „Senior 737 Trainer" oder ein „©" in
  einer anderen Spalte führen nicht mehr dazu, dass die Zeile verworfen wird.
- Kleinere Aufräumarbeiten (Capture-Speicher wird früher freigegeben,
  Aircraft-Auswahl-Konsistenz, tote CSS/i18n entfernt).

## [1.10.1] – 2026-07-24

- **Dashboard-PDF auf einer Seite**: der Screenshot des Dashboards wird jetzt so
  skaliert, dass er komplett auf eine A4-Seite passt (vorher zwei Seiten).

## [1.10.0] – 2026-07-24

- **Dashboard-PDF im echten Layout**: der Dashboard-Export übernimmt jetzt das
  genaue Layout des Desktop-Dashboards (KPI-Kacheln + Diagramme) statt reiner
  Tabellen. Das Dashboard wird dafür unsichtbar in Desktop-Breite gerendert und
  als Bild ins PDF gesetzt – so kommt auch beim Export vom iPhone/iPad das
  Desktop-Layout heraus. Die übrigen Seiten bleiben als saubere Tabellen-PDFs.

## [1.9.3] – 2026-07-24

Behebungen aus dem Code-Audit der Export-Funktionen (v1.9.0):

- **Fehler behoben**: Beim erneuten Import eines aus der App exportierten Excels
  wurde aus der Copyright-/Marken-Zeile fälschlich ein Phantom-Trainer angelegt –
  diese Zeilen werden beim Import jetzt übersprungen.
- **„Drucken"** öffnet das Druckfenster jetzt gesten-sicher (zuverlässig auch auf
  iPhone/iPad/Safari); bei blockiertem Fenster lädt die PDF herunter und ein
  Hinweis erscheint. Das PDF-Blob wird korrekt wieder freigegeben.
- **Excel-Exporte** vollständig lokalisiert (Datum + „Stand"/„as of" je Sprache,
  Datum ohne Uhrzeit); Datei­namen nutzen das lokale Datum (kein UTC-Versatz mehr).
- **Export-Buttons** zeigen den laufenden Export an; klare Fehlermeldung bei
  fehlgeschlagenem PDF-/Excel-Export.
- Aufräumarbeiten: Darkmode-Kontrast des „Drucken"-Buttons, gemeinsame
  Marken-/Farbquelle für PDF & Excel, entfernte tote i18n-Keys und Print-CSS.

## [1.9.2] – 2026-07-24

- **FTE und Aircraft je Trainer direkt editierbar** (nicht mehr schreibgeschützt).
  FTE wird beim Ändern der Part-Time weiterhin vorbefüllt, lässt sich aber
  überschreiben; das Aircraft wird nicht mehr automatisch aus der Umschulungsphase
  abgeleitet.
- **Base als Dropdown** aller bekannten Bases – alphabetisch, mit leerer Zelle
  ganz oben.

## [1.9.1] – 2026-07-24

- **„new TRI" entfällt**: alle bisherigen „new TRI" zählen jetzt als **„TRI"** –
  auch in bereits gespeicherten Daten (einmalige automatische Umstellung) und in
  der Statistik/Kapazität. Die Qualifikation „new TRI" ist aus der Liste entfernt.
- Qualifikations-Rangfolge jetzt: **SEN → TRE → TRI → LTC → SFI → TKI**.

## [1.9.0] – 2026-07-24

- **Export-Auswahl pro Seite**: PDF herunterladen, Excel herunterladen (wo
  sinnvoll) oder direkt **Drucken** – frei wählbar je Seite.
- Auch die **Excel-Exporte sind jetzt gebrandet** (737-TRAINER-Kopf,
  Report-Titel, Datum, Copyright) – passend zu den PDF-Reports.
- **Datum in allen Exporten ohne Uhrzeit.**

## [1.8.0] – 2026-07-24

- **PDF-Export komplett neu**: statt der (auf iPhone/PWA unzuverlässigen)
  Druckansicht werden jetzt **echte PDF-Dateien direkt aus den aktuellen Daten**
  erzeugt. Dadurch ist garantiert **immer die richtige Seite mit aktuellen
  Daten** enthalten – zuverlässig auf iPhone, iPad und Desktop.
- Jede Seite als eigener **gebrandeter Report** (Dashboard, Umschulung,
  Kapazität, Trainer, Planung, Provider) mit Kopf-/Fußzeile: 737-TRAINER-Kopf,
  Datum, Copyright und Seitenzahl.

## [1.7.1] – 2026-07-24

- **iPhone**: breite Tabellen laufen nicht mehr aus dem Bildschirm – sie
  scrollen jetzt horizontal innerhalb ihrer Karte.
- **Kapazität**: „FTE-Kapazität je Qualifikation" steht jetzt **oben**; beide
  Tabellen sind spaltenweise **sortierbar**.
- **Qualifikationen** erscheinen überall in fester Rangfolge:
  SEN → TRE → TRI → new TRI → LTC → SFI → TKI.
- **Provider**-Tabellen (Liste & Auslastung) sind jetzt ebenfalls sortierbar.

## [1.7.0] – 2026-07-24

- **Provider – Kapazität & Auslastung**: aktive Planungs-Zuweisungen je Provider
  (aufgeschlüsselt nach Kurs) gegenüber der **Platz-Kapazität**, mit
  Auslastungsbalken (grün / gelb / rot bei Überbuchung).
- Neues Provider-Feld **„Kapazität (Plätze)"** im Bearbeiten-Dialog.

## [1.6.0] – 2026-07-24

- **Kapazität editierbar**: neue Tabelle „Zieltermine & Umschulung bearbeiten" –
  Phase, Status und **Zieltermin** je Person direkt auf der Seite setzen (mit
  Suche/Base-Filter). Die Timeline und die Dashboard-Warnungen aktualisieren
  sich sofort.
- **FTE-Kapazität je Qualifikation**: neue Tabelle; **TRI und new TRI** werden
  zu einer Gruppe **„TRI"** zusammengefasst.

## [1.5.0] – 2026-07-24

- **Trainer aus Excel/CSV importieren** (Einstellungen): aktualisierte Liste
  (.xlsx / .xls / .csv) hochladen. Spalten werden über die Überschriften erkannt
  (Name, TLC, Base, Qualifikation, Part-Time, ORE, Behörde, LTC/TRI/TRE …).
- Bestehende Trainer werden per **TLC** (sonst Name) aktualisiert, neue ergänzt –
  **Umschulung & Planung bleiben erhalten**, nur die Stammdaten werden aufgefrischt.

## [1.4.0] – 2026-07-24

- Neuer Reiter **„Kapazität"**: FTE je Base – verfügbar vs. in Umschulung,
  aufgeschlüsselt nach Aircraft (A320/B737), mit Gesamtzeile.
- **Kapazitäts-Timeline**: die Zieltermine der Umschulung als Zeitachse je
  Monat, farblich nach Dringlichkeit (überfällig rot / gefährdet gelb).

## [1.3.0] – 2026-07-24

- **Fristen & Warnungen** auf dem Dashboard: eine neue Karte listet überfällige,
  gefährdete und blockierte Umschulungen sowie bald fällige Zieltermine – nach
  Dringlichkeit sortiert, rot/gelb markiert.
- Das **Umschulungs-Board** hebt überfällige (rot) und gefährdete (gelb) Karten
  farblich hervor.

## [1.2.1] – 2026-07-24

- **FTE folgt der Part-Time**: Der FTE-Wert ergibt sich jetzt automatisch aus
  der Part-Time (VZ = 1, 80 % = 0,8 …) und wird in den Details nur noch
  angezeigt – kein separates Eintragen mehr nötig.
- Feld **„B ab"** bei den Trainern entfernt.

## [1.2.0] – 2026-07-23

- **Alle Downloads zentral in den Einstellungen** – im Eurowings-Style: jede
  Seite als **PDF** (Dashboard, Umschulung, Trainer, Planung, Provider) und die
  Tabellen zusätzlich als **Excel** (Trainer, Planung, Provider).
- Die Export-Buttons in den einzelnen Reitern wurden entfernt (aufgeräumte
  Toolbars).
- **„Trainer seit"** (LTC/TRI/TRE) jetzt klar gruppiert in den Trainer-Details –
  nur dort sichtbar, nicht in der Tabelle.

## [1.1.0] – 2026-07-23

- Neuer **Save-Button** oben (mit Bestätigung) neben Reload.
- **Dunkelmodus** zum Umschalten in der Kopfzeile (bleibt gespeichert).
- **Export je Seite**: PDF (Dashboard, Umschulung, Trainer, Planung, Provider)
  und **Excel** für die Tabellen (Trainer, Planung, Provider).
- **Provider-Status** korrigiert – Auswahl: *leer / in use / no agreement*.
- Alphabetische Sortierung überall in Dropdowns nochmals geprüft.

## [1.0.0] – 2026-07-23

Erstes Release nach vollständigem Multi-Agenten-Code-Audit — die Versionierung
wurde hier bewusst neu gestartet.

- **PWA „737 TRAINER"**: installierbar auf Desktop/iPhone/iPad, offline-fähig,
  DE/EN-Umschaltung, Reload-Button, Update-Hinweis als Popup unten mittig.
- **Dashboard**: KPI-Kacheln (inkl. *FTE in Umschulung* / *FTE verfügbar*) und
  Live-Auswertungen (Qualifikation, Base, Aircraft, ORE, Behörde, Part-Time,
  Funktion, Intern/Extern).
- **Trainer**: 50 Personen vorbefüllt, editierbar, sortierbar (jede Spalte),
  Filter & Suche; FTE pro Person (Default 1 = 100 %); intern/extern.
- **Umschulung**: Board mit editierbaren Phasen (Farbe, Reihenfolge,
  Drag & Drop), Ziel wählbar (A320 → B737); das Aircraft folgt automatisch der
  Phase und fließt in die Statistik ein.
- **Planung**: Matrix pro Person für Type Rating, TRI-Kurs, LIFUS und
  Examiner-Prüfung — Provider/Ort/Status („n/a" möglich)/Termin, Spalten
  editierbar.
- **Provider**: BAA, CAE, CATC, LAT, SunEx, TUI vorbefüllt; Kurse als
  Mehrfachauswahl (inkl. „SIM only"), mehrere Standorte je Anbieter als
  ICAO-Codes.
- **Datensicherheit**: persistenter Speicher, Backup/Export & Import aller
  Daten, Sofort-Speicherung auch bei Reload/App-Schließen.
- **Berechtigungen** in Reihenfolge SEN · TRE · TRI · new TRI · LTC · SFI · TKI —
  wie alle Kategorien frei editierbar (umbenennen, Farbe, sortieren,
  hinzufügen/löschen).
- Audit-Fixes: Update-Popup liegt nicht mehr über offenen Dialogen und bricht
  auf schmalen Displays sauber um; „SIM only" erreicht auch Bestandsdaten
  (einmalige Migration); Provider-Vorschläge in der Planung matchen auf
  Kurs-Namen; leere Status-Auswahl fällt sauber auf den Standard zurück; keine
  Datenverluste mehr durch Reload direkt nach einer Eingabe.
