# Changelog

Alle nennenswerten Änderungen dieses Projekts. Versionierung nach
[SemVer](https://semver.org/lang/de/): Jeder Push ist eine neue Version,
beginnend bei `1.0.0`.

- **MAJOR** (`x.0.0`): große Umbauten / grundlegende Änderungen
- **MINOR** (`1.x.0`): neue Funktionen / neue Reiter
- **PATCH** (`1.0.x`): Fehlerbehebungen, kleine Anpassungen, Datenpflege

Die Version ist zusätzlich in der App unter **Einstellungen → Version & Changelog**
sichtbar. Bei einem neuen Deploy erscheint automatisch ein **Update-Popup**.

## [1.15.4] – 2026-07-25

- **App war online nicht erreichbar.** Das Repository wurde von `TESTREPO` auf
  `Instructor-Pr-fer-Overview` umbenannt. GitHub Pages liefert eine Seite immer
  unter dem Repo-Namen aus, der Build hatte den alten Namen aber fest
  verdrahtet (`base = '/TESTREPO/'`). Dadurch zeigten sämtliche Asset-Pfade,
  das Manifest (`scope`/`start_url`) und der Service Worker ins Leere – die
  Seite blieb leer. Neue Adresse:
  `https://thornapplication-coder.github.io/Instructor-Pr-fer-Overview/`
- **Damit das nicht wieder passiert:** der Pfad wird beim Bauen aus
  `GITHUB_REPOSITORY` abgeleitet (setzt GitHub Actions automatisch). Eine
  Umbenennung des Repositories korrigiert sich damit von selbst. `VITE_BASE`
  überschreibt weiterhin (z. B. `/` bei eigener Domain).
- **Sync-Anzeige als Punkt.** Statt einer Textmarke steht oben nur noch ein
  Punkt: **grün** = angemeldet und synchron (pulsiert kurz während des
  Abgleichs), **rot** = nicht angemeldet, offline, Fehler oder Konflikt. Der
  genaue Status bleibt als Tooltip am Punkt (und für Screenreader) erhalten,
  ausführlich steht er weiterhin in den Einstellungen.

## [1.15.3] – 2026-07-25

- **Anmelde-Dialog verständlicher.** Bisher standen „Anmelden" und
  „Registrieren" als zwei ähnlich aussehende Knöpfe nebeneinander – beim ersten
  Start führte „Anmelden" zwangsläufig zu einem Fehler, weil das Konto ja noch
  gar nicht existierte. Jetzt wird oben explizit zwischen **Anmelden** und
  **Neu registrieren** umgeschaltet, darunter gibt es genau einen Button.
- **Fehlermeldungen in Klartext.** Supabase antwortet auf Englisch und wenig
  hilfreich; die App übersetzt die relevanten Fälle und sagt, was zu tun ist:
  - „Invalid login credentials" → Konto existiert noch nicht, es wird
    automatisch auf „Neu registrieren" umgeschaltet
  - „User already registered" → zurück auf „Anmelden"
  - E-Mail nicht bestätigt, Registrierung in Supabase deaktiviert, Passwort zu
    kurz, keine Internetverbindung

## [1.15.2] – 2026-07-25

Behebungen aus dem Code-Review des Sync-Commits.

- **Doppelter Abgleich beim Start behoben.** Zwei Effekte riefen `sync()` im
  selben Render auf; die Sperre wurde erst *nach* dem ersten `await` gesetzt, so
  dass beide durchrutschten und doppelt hochluden. Der nächste Abgleich meldete
  das dann als „Konflikt" mit sich selbst. Sperre greift jetzt synchron, und die
  beiden Effekte sind zu einem zusammengefasst.
- **Konfiguration wird als Paar gelesen.** Nur eine der beiden Umgebungs-
  variablen zu setzen kombinierte bisher die URL des einen mit dem Key des
  anderen Projekts (jede Anfrage „Invalid API key", das Anmeldeformular sah
  trotzdem funktionsfähig aus). Jetzt gilt: entweder beide aus der Umgebung
  oder beide fest eingebaut. Wichtig dabei: GitHub Actions setzt ein nicht
  angelegtes Secret als *leeren String* – das zählt als „nicht gesetzt", sonst
  hätte der Deploy den Sync abgeschaltet.
- **URL-Normalisierung korrigiert**: „…/rest/v1//" behielt den Suffix (führte zu
  `/rest/v1/rest/v1/…` und 404 bei jedem Zugriff); Groß-/Kleinschreibung wird
  jetzt ignoriert.
- **Weniger Netzwerkverkehr**: ein Abgleich fragte die Sitzung dreimal beim
  Server ab. Sie wird jetzt einmal lokal gelesen und durchgereicht.
- `updated_at` wird nicht mehr mitgeschickt – ein Datenbank-Trigger setzt es
  ohnehin, damit kein Client ein Datum zurückdatieren kann.
- Aufräumen: Alias `URL` entfernt (überdeckte den globalen `URL`-Konstruktor);
  README, `.env.example` und der Deploy-Workflow beschreiben den Sync jetzt als
  aktiv statt als „noch nicht eingerichtet".

## [1.15.1] – 2026-07-25

- **Cloud-Sync scharf geschaltet**: Projekt-URL und der (öffentliche) anon-Key
  liegen jetzt in `src/lib/cloudConfig.js`, damit der deployte Build ohne
  CI-Secrets funktioniert. Geschützt werden die Daten durch Row Level Security
  auf `app_state`, nicht durch das Verstecken des Keys – der steht ohnehin in
  jedem ausgelieferten Bundle. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  überschreiben die Werte weiterhin, falls jemand ein eigenes Projekt nutzt.
- Die Projekt-URL wird beim Einlesen normalisiert: ein angehängtes `/rest/v1/`
  (so zeigt Supabase die API-URL an) wird abgeschnitten.

## [1.15.0] – 2026-07-24

- **Cloud-Sync (Supabase) eingebaut.** In den Einstellungen anmelden – danach
  gleicht die App die Daten automatisch zwischen deinen Geräten ab (der
  komplette Datenstand als eine jsonb-Zeile je Benutzer, abgesichert per Row
  Level Security).
- **Sync-Status oben in der Kopfzeile**: „Nicht angemeldet", „Synchronisiert …",
  „Synchron" (mit Uhrzeit der letzten Übertragung), „Offline", „Sync-Fehler"
  oder „Konflikt" – farbig und auf dem Handy platzsparend nur als Symbol.
- **Sync-Karte in den Einstellungen**: aktueller Status inkl. E-Mail, Zeitpunkt
  der letzten Synchronisierung, Hinweis auf noch nicht übertragene Änderungen,
  „Jetzt synchronisieren", An-/Abmelden und Registrieren.
- **Konflikte werden nicht still überschrieben.** Wenn dieses Gerät *und* die
  Cloud sich seit dem letzten Abgleich geändert haben, hält die App an und
  fragt: „Dieses Gerät behalten" oder „Cloud-Stand übernehmen".
- **Offline-first bleibt bestehen**: lokal gespeichert wird immer, die Cloud ist
  eine zusätzliche Kopie. Ohne konfiguriertes Projekt verhält sich die App
  exakt wie bisher und sagt das in den Einstellungen auch klar.
- Schema als Migration im Repo (`supabase/migrations/0001_app_state.sql`),
  Konfiguration über `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  (siehe `.env.example`); der Deploy-Workflow reicht sie als GitHub-Secrets
  durch.

## [1.14.0] – 2026-07-24

- **Neuer Reiter „Other Pilots"** (direkt vor den Einstellungen): Linienpiloten
  der Firma – **keine** Trainer/Prüfer – in drei Kategorien: **B737 gültig**,
  **B737 abgelaufen** und **Boeing-Erfahrung** (ohne aktuelles Rating).
- Je Pilot: **Name, TLC, Base, Position (Captain / First Officer), B737-Status**
  und das **Datum** – im Formular beschriftet als „Gültig bis" bzw. „Abgelaufen
  am", je nach Status – dazu eine freie Anmerkung.
- **Voll editierbar**: hinzufügen, bearbeiten, löschen (mit Rückfrage). Dazu
  Volltextsuche, Filter nach Base / Position / B737-Status, sortierbare Spalten
  und Zähler je Status über der Tabelle.
- **Excel-/CSV-Import** in den Einstellungen: Spalten werden über die
  Überschriften erkannt (deutsch und englisch, u. a. Name, TLC, Base, Position,
  Status, „Gültig bis"). Bestehende Piloten werden per **TLC** (sonst Name)
  aktualisiert, neue ergänzt. Fehlt der Status in der Datei, wird er aus dem
  Datum abgeleitet (Datum in der Zukunft = gültig, in der Vergangenheit =
  abgelaufen). Es gelten dieselben Schutzmechanismen wie beim Trainer-Import
  (deutsche Datumsformate, Kopfzeilen-Erkennung, Prototype-Pollution-Schutz).
- **Export als PDF** (nach B737-Status gruppiert, je Kategorie ein Abschnitt)
  **und als Excel** – in den Einstellungen unter „Downloads".
- Ein als **„gültig" markiertes Rating mit Datum in der Vergangenheit** wird in
  der Tabelle rot mit ⚠ hervorgehoben.
- Die Piloten liegen in einer **eigenen Datensammlung** und fließen bewusst
  **nicht** in Trainer-Statistiken, Umschulung oder Kapazität ein.

## [1.13.2] – 2026-07-24

Behebungen aus dem Code-Review (vier parallele Review-Durchgänge:
Korrektheit, versionsübergreifende Regressionen, Code-Qualität, UX/Druck).

**Wichtigster Fix**

- **Dialoge nahmen nur ein Zeichen an**: nach dem ersten Tastendruck sprang der
  Cursor auf das ✕. Ursache war der Fokus-Trap aus v1.11.0, der bei jedem
  Render neu ansetzte. Betroffen waren „Ort"/„Notiz" in der Planung und
  **alle** Listen-Editoren (Phasen, Berechtigungen, Spalten, Kurse, SIM
  Versionen, Status) – diese Listen waren dadurch praktisch nicht editierbar.

**Weitere Behebungen**

- **Planung**: die Umschaltung „Tabelle / Kalender" war im Hellmodus weiß auf
  weiß und damit unsichtbar – der Kalender war nicht auffindbar.
- **Drucken**: Browser drucken Hintergrundfarben standardmäßig nicht, wodurch
  Kalender-Chips und Marken weiß auf weiß erschienen. Farben werden jetzt
  gedruckt; Kopfzeile, Reiter, Fußzeile und Filterleisten bleiben draußen.
- **Provider**: das ⚙ neben „Kurse" lag in einem `<label>` – ein knapper
  Danebenklick hat einen Kurs an-/abgewählt. Eine im Dialog gelöschte Kategorie
  wird jetzt aus dem Provider entfernt statt als rohe ID gespeichert.
- **Dashboard-Anordnen**: zusätzlich zu Drag & Drop gibt es ‹ ›-Buttons, damit
  das Umsortieren auf iPhone/iPad (kein HTML5-Drag) und per Tastatur
  funktioniert; das Bedienelement überdeckt die „Gesamt"-Zahl nicht mehr.
- **Excel-Import**: der Export schreibt Qualifikations-**Namen**, der Import
  speicherte sie roh – beim Reimport des eigenen Exports fiel die Person aus
  der Umschulung. Namen werden jetzt wieder auf die Kategorie abgebildet.
- **Kapazität**: die Spalte „in Umschulung" zählte auch SFI/TKI und wich damit
  von den FTE-Zahlen darüber ab; jetzt einheitlich SEN/TRE/TRI/LTC.
- **Behörde**: „EASA_Austria" und „EASA: Austria" werden ebenfalls auf das Land
  gekürzt (vorher blieb das Präfix bzw. ein Doppelpunkt stehen).
- **Neue Trainer** starten in der *ersten* Phase der Pipeline statt im fest
  verdrahteten „nominated" – wichtig, wenn die Phasen umbenannt/gelöscht wurden.
- **Import ohne Provider-Liste** fällt jetzt auf die Standard-Provider zurück
  statt auf eine leere Liste.
- **Kapazitäts-PDF**: die Spalte „Zieltermine je Monat" war doppelt mit „Phase"
  überschrieben; die erste Spalte heißt jetzt korrekt „Monat".
- **Lesbarkeit/Bedienung**: „FO"-Marke mit AA-Kontrast, Tastatur-Fokusrahmen auf
  Tabellenzeilen, `role="button"` von Tabellenzeilen entfernt (Screenreader
  lasen sonst alle 13 Spalten als einen Knopfnamen), lokalisierte
  Provider-Fehlermeldung.
- **Aufräumen**: doppelte Captain/FO-Zählung entfernt, `headcount()` läuft in
  einem Durchgang statt acht, der Kurskalender wird gecacht und schlägt Provider
  über eine Map statt linear nach, die Planungstabelle wird in der
  Kalenderansicht nicht mehr im Hintergrund gerendert, „Qualifikation je
  Aircraft" leitet seine Spalten aus der Aircraft-Liste ab.

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
