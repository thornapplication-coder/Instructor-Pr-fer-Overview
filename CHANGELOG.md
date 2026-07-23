# Changelog

Alle nennenswerten Änderungen dieses Projekts. Versionierung nach
[SemVer](https://semver.org/lang/de/): Jeder Push ist eine neue Version,
beginnend bei `1.0.0`.

- **MAJOR** (`x.0.0`): große Umbauten / grundlegende Änderungen
- **MINOR** (`1.x.0`): neue Funktionen / neue Reiter
- **PATCH** (`1.0.x`): Fehlerbehebungen, kleine Anpassungen, Datenpflege

Die Version ist zusätzlich in der App unter **Einstellungen → Version & Changelog**
sichtbar. Bei einem neuen Deploy erscheint automatisch ein **Update-Button**.

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
