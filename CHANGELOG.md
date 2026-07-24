# Changelog

Alle nennenswerten Änderungen dieses Projekts. Versionierung nach
[SemVer](https://semver.org/lang/de/): Jeder Push ist eine neue Version,
beginnend bei `1.0.0`.

- **MAJOR** (`x.0.0`): große Umbauten / grundlegende Änderungen
- **MINOR** (`1.x.0`): neue Funktionen / neue Reiter
- **PATCH** (`1.0.x`): Fehlerbehebungen, kleine Anpassungen, Datenpflege

Die Version ist zusätzlich in der App unter **Einstellungen → Version & Changelog**
sichtbar. Bei einem neuen Deploy erscheint automatisch ein **Update-Popup**.

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
