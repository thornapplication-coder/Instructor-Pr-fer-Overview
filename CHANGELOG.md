# Changelog

Alle nennenswerten Änderungen dieses Projekts. Versionierung nach
[SemVer](https://semver.org/lang/de/): Jeder Push ist eine neue Version,
beginnend bei `1.0.0`.

- **MAJOR** (`x.0.0`): große Umbauten / grundlegende Änderungen
- **MINOR** (`1.x.0`): neue Funktionen / neue Reiter
- **PATCH** (`1.0.x`): Fehlerbehebungen, kleine Anpassungen, Datenpflege

Die Version ist zusätzlich in der App unter **Einstellungen → Version & Changelog**
sichtbar. Bei einem neuen Deploy erscheint automatisch ein **Update-Button**.

## [1.3.0] – 2026-07-23

- Neues Logo (weißes „737", darunter „TRAINER" in Blau) – überall inkl.
  Homescreen-Icon; „EWL" entfernt.
- Trainer-Tabelle **überall sortierbar** (Spaltenkopf antippen).
- **FTE** pro Person editierbar (Default 1 = 100%), eigene Spalte; KPI nutzt diese Werte.
- Umschulungs-**Suche** filtert auch nach Qualifikation und intern/extern.
- **Planung**: Spalten frei editierbar (umbenennen/Farbe/hinzufügen/löschen/sortieren),
  Matrix sortierbar, Status **„n/a"** verfügbar.
- **Reload-Button** oben neben DE/EN; **Version** jetzt unten mittig.
- **Copyright** „© Copyright by Patrick Thorn" unten und in allen Exporten (mit Version).

## [1.2.1] – 2026-07-23

- Lokaler Speicher abgesichert: App fordert **persistenten Speicher** an
  (verhindert automatisches Löschen durch den Browser, v. a. iPad/Safari).
- Neue Sektion **„Datensicherheit"** in den Einstellungen (Status, Warnhinweis,
  Ein-Klick-Backup).
- Hinweis: Ein bewusstes „Websitedaten/Cookies löschen" lässt sich nur durch den
  (kommenden) Cloud-Sync vollständig absichern.

## [1.2.0] – 2026-07-23

- Neues, klareres App-Logo (eigene Wave-Bildmarke) statt der dunklen Kachel.
- Berechtigungen in fester Reihenfolge **SEN · TRE · TRI · new TRI · LTC · SFI · TKI**,
  frei editierbar (umbenennen, Farbe, hinzufügen/löschen, sortieren). „TRE/SEN" → „SEN".
- Editierbare, farbcodierte Kategorien **überall**: Umschulungs-Phasen, Berechtigungen,
  Provider-Angebotstypen und Provider-Status – je „Verwalten"-Button.
- **Drag & Drop**: Trainer im Umschulungs-Board zwischen Phasen ziehen; Kategorien per
  Ziehen/Pfeilen sortieren.
- Alphabetische Sortierung (Namen nach Nachname) durchgängig.
- **Statistik entschlackt**: doppelte Tabelle unter jedem Diagramm entfällt.

## [1.1.0] – 2026-07-23

- Neuer Reiter **„Planung"**: Matrix zum Zuweisen von Provider/Ort pro Person für
  Type Rating, TRI-Kurs, LIFUS und Examiner-Prüfung (TRE) – inkl. Status & Termin.
- Zuweisungen greifen auf den Provider-Reiter zu (gefiltert nach Angebot TR/TRI/TRE).
- Neue Kennzeichnung **intern/extern** pro Person (Spalte, Filter, Formular, Statistik).
- Umschulungs-Board zeigt zugewiesene Provider und intern/extern auf den Karten.

## [1.0.3] – 2026-07-23

- Deploy-Workflow bereinigt: automatisches Pages-Aktivieren entfernt (der
  GitHub-Actions-Token darf die Pages-Site nicht anlegen). GitHub Pages muss
  einmalig manuell aktiviert werden (Settings → Pages → Source: GitHub Actions).

## [1.0.2] – 2026-07-23

- GitHub Pages wird im Deploy-Workflow automatisch aktiviert (`actions/configure-pages` mit `enablement`), damit kein manueller Schalter nötig ist.

## [1.0.1] – 2026-07-23

- GitHub-Pages-Basispfad an die Repo-Schreibweise (`/TESTREPO/`) angepasst, damit
  PWA, Manifest und Service Worker unter der Pages-URL korrekt laden.

## [1.0.0] – 2026-07-23

Erste Version.

- PWA im Eurowings-Style, installierbar auf Desktop/iPhone/iPad (offline-fähig).
- **Übersicht**: KPI-Kacheln und Diagramme (angelehnt an das LH-Referenz-Dashboard).
- **Trainer**: 50 Trainer/Prüfer aus der Excel vorbefüllt, editierbar (anlegen/ändern/löschen, Suche & Filter).
- **Umschulung**: Meilenstein-Pipeline A320 → 737 MAX mit Status pro Trainer.
- **Statistik**: Live-Auswertungen (Qualifikation, Base, ORE, Behörde, Part-Time, Funktion) – deckungsgleich mit dem Excel-Tab „Statistik_Daten".
- **Provider**: editierbare Liste externer Anbieter (TR/TRI/TRE).
- DE/EN-Umschaltung, Export/Import aller Daten, Versions-Tracking und Update-Button.
