# Changelog

Alle nennenswerten Änderungen dieses Projekts. Versionierung nach
[SemVer](https://semver.org/lang/de/): Jeder Push ist eine neue Version,
beginnend bei `1.0.0`.

- **MAJOR** (`x.0.0`): große Umbauten / grundlegende Änderungen
- **MINOR** (`1.x.0`): neue Funktionen / neue Reiter
- **PATCH** (`1.0.x`): Fehlerbehebungen, kleine Anpassungen, Datenpflege

Die Version ist zusätzlich in der App unter **Einstellungen → Version & Changelog**
sichtbar. Bei einem neuen Deploy erscheint automatisch ein **Update-Popup**.

## [1.51.0] – 2026-08-19

### Neu
- **Dashboard-Karte „Externe & Nicht-Trainer".** Die vier Gruppen ohne eigene
  Trainer-Berechtigung — TRE extern, TRI extern, No Trainer, EIS Pilot — je mit
  Kopfzahl und FTE, dazu die Summe beider.
- **Als Zahlen, nicht als Balken.** Am Ende des Berechtigungs-Diagramms standen
  die vier als leere Streifen. Ein Balken hat für Nichts keine Länge, also liest
  sich ein leerer Streifen nicht als „keiner", sondern als Diagramm, das nicht
  geladen hat. Eine Zahl sagt „0" eindeutig — und trägt eine zweite daneben,
  was ein Balken nicht kann.
- **Zwei Zahlen je Gruppe.** Vier externe Instruktoren in Teilzeit sind vier
  Köpfe und zwei FTE; geplant wird mit der zweiten. Die FTE laufen wie überall
  durch `sumFte()`/`formatFte1()`, und die Gesamtsumme kommt aus den Rohwerten,
  nicht durch Aufaddieren gerundeter Zeilen.
- **Eine Gruppe bei null bleibt stehen** und tritt nur farblich zurück: welche
  der vier leer ist, ist selbst die Auskunft.
- **Im Dashboard-PDF** steht dieselbe Aufstellung als Tabelle mit Summenzeile.
- Die Karte ist wie jede andere über „⠿ Anordnen" verschiebbar; eine schon
  gespeicherte Reihenfolge kennt sie nicht und hängt sie hinten an
  (`ordered()` war dafür bereits vorbereitet).

## [1.50.0] – 2026-08-19

### Geändert
- **Bei „extern" gibt es kein ORE, keine Seniorität und keine Umschulung.**
  Alle drei sind Plätze in unseren eigenen Listen — der ORE-Priorität, der
  Firmen-Seniorität, der Umschulungs-Kette. Ein Angestellter eines anderen
  Betriebs hat dort keinen Platz; „fehlender Wert" ist es also nicht, sondern
  die richtige Antwort.
- **Auf der Karte am Handy verschwinden die drei Zeilen ganz.** Dort gibt es
  keine Spalte, nur Überschrift und Wert — und eine Überschrift über einem
  Strich ist eine Frage, die niemand gestellt hat. Gemessen: die Karte eines
  Externen ist damit 191 px statt 226 px hoch, ohne übrig gebliebene Lücke.
- **In der Tabelle am Rechner bleiben die Spalten stehen** und zeigen einen
  Strich. Eine Spalte gehört zur Liste, nicht zur Zeile, und jede andere Zeile
  braucht sie weiter.
- **Der Dialog fragt nicht mehr danach.** Der Umschulungs-Block war seit 1.48.0
  weg; ORE und Seniorität folgen jetzt derselben Regel.
- **Sortierung und ORE-Filter gehen durch dieselbe Regel.** Ein Wert, der nicht
  angezeigt wird, darf die Zeile auch nicht einsortieren oder in einen Filter
  hineinziehen — sonst erscheint unter „ORE: A" eine Zeile, die einen Strich
  zeigt.
- **PDF und Excel lassen die drei Felder bei Externen ebenfalls leer.** Ein
  Export, der etwas anderes sagt als der Bildschirm, ist am Ende der, dem
  geglaubt wird.
- Die Regel steht an **einer** Stelle (`isOwnStaff()` in
  `src/data/qualifications.js`) und ist bewusst dieselbe Funktion, durch die
  seit 1.48.0 auch die Umschulung geht: „gehören sie uns" und „schulen wir sie
  um" sind eine Frage, zweimal gestellt.
- Gelöscht wird nichts: Wer zurück auf „intern" stellt, sieht alle drei Werte
  wieder.

## [1.49.0] – 2026-08-19

### Neu
- **Zähler für Auffälligkeiten auf dem Umschulungs-Board.** Über den Spalten
  stehen „N überfällig" und „M gefährdet"; ein Antippen lässt nur diese Karten
  stehen. Die Rechnung dahinter (`collectAlerts()`) gab es seit Langem, sie war
  an keine Ansicht angeschlossen — bei fünfzig Karten über sieben Bildschirme
  und fünf weiteren Spalten seitwärts hieß „ist jemand überfällig?" bisher:
  alle lesen.
- **„Keine Trainer gefunden" unterscheidet die beiden Fälle.** Leere Liste oder
  Filter, der niemanden trifft — im zweiten Fall mit einer Schaltfläche, die
  Suchfeld und alle sieben Filter zurücksetzt.

### Geändert
- **Die Ansicht in „Umschulung" bleibt erhalten.** Board / Planung / Kalender
  standen nur im Zustand der Komponente: ein Blick aufs Dashboard und zurück
  warf einen zurück auf das Board, obwohl die Buchungsarbeit in der Planung
  passiert. Die Wahl steht jetzt in der Adresse (`#/conversion/table`) und
  übersteht damit auch ein Neuladen und einen geteilten Link.
- **Der Hinweis „App ist offline verfügbar" räumt sich selbst weg** (nach sechs
  Sekunden). Er hat unten am Bildschirm Karten verdeckt und musste weggetippt
  werden, obwohl er nichts fragt. Der Update-Hinweis bleibt stehen — der stellt
  eine Frage.
- **Sync-Fehler erscheinen übersetzt.** Der rohe JS-Text („TypeError: Failed to
  fetch") stand wörtlich in einer sonst deutschen Oberfläche; er läuft jetzt
  durch denselben Übersetzer wie die Meldungen des Anmeldeformulars.

### Behoben
- **Der Fokus landet nicht mehr auf dem ✕.** Beim Öffnen eines Dialogs bekam
  die erste Schaltfläche im DOM den Fokus, und das ist das Schließkreuz in der
  Kopfzeile: das erste Enter schloss den Dialog wieder. Der Fokus geht jetzt in
  den Inhalt.
- **Ungespeicherte Änderungen werden nicht mehr stillschweigend verworfen.**
  Wer einen Dialog über ✕, Escape oder einen Tipp neben den Dialog verlässt und
  etwas geändert hat, wird gefragt. „Abbrechen" fragt bewusst nicht.
- **Namenlose Bedienelemente haben Namen bekommen.** Im Anbieter-Dialog trägt
  die Feldbeschriftung neben dem ⚙ ein `<span>` statt ein `<label>` (damit ein
  Klick daneben nicht das erste Feld umschaltet) — die Folge war, dass
  SIM-Version, Status und die Kursart-Liste für eine Vorlesefunktion namenlos
  waren. Dazu fünf Felder in den Kursterminen, Farbe und Bezeichnung in jeder
  Listen-Verwaltung und die Chips in der Mehrfachauswahl.
- **Pfeile und ✕ in der Listen-Verwaltung heißen jetzt „Nach oben", „Nach
  unten", „Löschen"** statt `up` / `down` / `delete` — sichtbar nur als
  Sprechblase, aber in einer deutschen Oberfläche trotzdem Englisch.
- **Das ✕ in der Kurstermin-Karte am Handy hat eine Überschrift.** Es stand ohne
  eine direkt neben der Zahl unter „BELEGT" und sah aus, als lösche es die
  Buchungen statt des ganzen Kurstermins.

## [1.48.0] – 2026-08-19

### Geändert
- **Kein Umschulungs-Block mehr bei „extern".** Im Trainer-Dialog verschwindet
  der ganze Abschnitt — Phase, Status, Zieltermin, Notiz — sobald jemand auf
  „extern" steht oder die Qualifikation „TRE extern" / „TRI extern" trägt.
  Seit 1.47.0 liest keine Ansicht diese Werte für Externe mehr; sie weiter
  abzufragen hieße, zum Ausfüllen von Feldern einzuladen, deren Inhalt nirgends
  ankommt.
- Gelöscht wird nichts: Wer zurück auf „intern" stellt, bekommt die Werte wieder
  zu sehen — ein Fehlklick kostet also auch hier nichts.

## [1.47.0] – 2026-07-29

### Geändert
- **Externe Trainer werden nicht umgeschult.** Sie sind Angestellte eines
  anderen Betriebs und bereits auf dem Muster qualifiziert. Sie stehen deshalb
  nicht mehr auf dem Umschulungs-Board, zählen in keiner Umschulungs-Kennzahl,
  belegen keinen Kursplatz und stehen nicht mehr in der Planung.
  Die Bedingung steht **an einer Stelle** (`isInternal()` in
  `conversionTrainers()`); Board, Dashboard, Kapazität, Planung und alle drei
  Umschulungs-PDFs lesen sie von dort, damit sie nicht in einer Ansicht gilt und
  in der nächsten nicht.
- Die Kapazitäts-Spalte **„in Umschulung"** rechnet sie ebenfalls heraus. Sie
  ermittelte ihren Wert bisher direkt aus der Qualifikation und hätte den
  FTE-Kacheln über der Tabelle widersprochen.
- Die Texte, die den Kreis beschreiben, sagen die Regel mit: der Hinweis über
  dem Board, die Bezugsgruppe an den FTE-Kacheln und die FTE-Erklärung.

### Neu (Qualifikationen)
- **„TRE extern" und „TRI extern"** stehen zur Auswahl. Auch sie zählen nicht
  zur Umschulung — dafür braucht es keine zweite Regel: sie sind schlicht keine
  Umschulungs-Qualifikation. In der Kapazität behalten sie ihre eigene Zeile,
  denn Kapazität sind sie sehr wohl.
- **Reihenfolge:** erst die sechs Trainer-Stufen, dann die beiden externen, dann
  „No Trainer" und „EIS Pilot". Diese Reihenfolge ist die Rangfolge, nach der
  die Trainer-Tabelle sortiert und jedes Diagramm seine Zeilen ordnet — der Test
  prüft sie als Zeichenkette, nicht nur die Mitgliedschaft.
- **Farben:** Die Palette hört bei acht Kategorien auf (`palette.js`: „eine
  neunte Kategorie ist nie ein erzeugter Farbton"). Die letzten beiden Plätze
  gehen an die externen Stufen, weil das Identitäten sind, die man vom Chip
  abliest. „No Trainer" und „EIS Pilot" teilen sich das Überlauf-Grau — genau
  das, wofür es dokumentiert ist.

### Neu
- **Auf der Karte ist sichtbar, wer extern ist.** Ein Merkzeichen neben dem
  Namen, mit der Firma dahinter („EXTERN · TUI"). Die Zugehörigkeits-Spalte
  gehört zu den fünf Feldern, die auf der Karte dem Dialog weichen — genau dort
  war die Information also nicht zu sehen.
- Am Rechner bleibt das Merkzeichen aus: dort steht die Spalte ohnehin, und die
  Tabelle hat nach der Seniorität keine Breite mehr übrig, um es zweimal zu
  sagen. Der Testlauf prüft beide Seiten.

## [1.46.0] – 2026-07-29

### Behoben
- **Der Speichern-Knopf war am iPhone nicht mehr erreichbar, sobald die Tastatur
  aufging.** iOS verkleinert dafür weder das Layout-Fenster noch `dvh` — nur den
  `visualViewport`. Ein in `vh` bemessener Dialog behielt also seine volle Höhe,
  und seine Fußzeile mit Speichern und Löschen lag unter der Tastatur: Man
  konnte in ein Feld tippen und das Getippte danach nicht sichern. Der Dialog
  bemisst und positioniert sich jetzt nach dem tatsächlich sichtbaren Bereich.
  Die Felder scrollen, Kopf- und Fußzeile behalten ihre Höhe.
- Dabei mitgenommen: Die Überschrift lag auf dem iPhone unter der Statusleiste
  (die Uhr stand im Titel). Der Dialog hält jetzt den Sicherheitsabstand ein.

### Geändert
- **ORE ist bei neuen Einträgen leer**, nicht mehr „C". Eine vorausgefüllte
  Priorität ist eine Behauptung, die niemand aufgestellt hat — und das
  ORE-Diagramm zählt jeden Wert mit, der dasteht.

### Neu
- **Firma bei externen Trainern.** Steht jemand auf „extern", fragt der Dialog
  nach der Firma: TUI, SunExpress oder Others. Bei internen erscheint die Frage
  gar nicht erst. In der Liste steht sie neben dem Chip, in Excel und PDF ist
  sie eine eigene Spalte. Die Auswahl ist in den Einstellungen erweiterbar —
  an diesen Einträgen hängt keine Logik.
  Beim Zurückschalten auf „intern" wird der Wert **nicht** gelöscht, damit ein
  Fehlklick nichts kostet.
- **Zwei neue Qualifikationen:** „No Trainer" und „EIS Pilot", ganz am Ende der
  Liste. Am Ende, weil die Reihenfolge dieser Liste die Rangfolge ist, nach der
  jede Tabelle und jedes Diagramm sortiert — und keine der beiden ist eine
  Trainer-Stufe. Bestehende Installationen bekommen sie angehängt; eine von Hand
  geänderte Reihenfolge oder Farbe bleibt unangetastet.

## [1.45.0] – 2026-07-29

### Neu
- **Der Link lässt sich weitergeben.** Wer ihn öffnet, sieht den aktuellen
  Stand — ohne Konto und ohne Anmeldung. Er hält sich selbst frisch: beim
  Öffnen, beim Zurückwechseln zur App und alle zwei Minuten.
- **Ändern kann nur, wer angemeldet ist.** Die Sperre sitzt in `patch()`, der
  einen Stelle, durch die sämtliche Daten in die App kommen. Damit kann kein
  Bildschirm halb geschützt sein, und ein Bedienelement, das jemand zu
  verstecken vergisst, richtet nichts aus. `importData` und `resetData` sind
  eigens abgesichert, weil sie nicht durch `patch()` laufen.
- **Sichtbar statt kaputt.** Besucher sehen ein Band „Nur-Lese-Ansicht" mit dem
  Stand-Zeitpunkt. Die Schaltflächen zum Anlegen, Speichern und Löschen sind
  weg, ebenso das Ziehen auf dem Board, das Anordnen im Dashboard und die
  Einstellungs-Abschnitte für Import, Zurücksetzen und Listen. Erhalten bleibt
  alles, was nur liest: Suche, Filter, Sortierung, das Öffnen eines Datensatzes
  und sämtliche PDF- und Excel-Ausgaben.
- **Die Datenbank-Regel** liegt als `supabase/migrations/0002_shared_read.sql`
  bei: eine Spalte `shared` und eine `select`-Regel für die anonyme Rolle.
  Eine Schreibregel gibt es bewusst nicht — die bestehenden Regeln prüfen alle
  `auth.uid() = user_id`, was anonym nie zutrifft.

### Wichtig
- **Solange kein Datensatz als geteilt markiert ist, ändert sich nichts.** Die
  Nur-Lese-Ansicht schaltet sich erst ein, wenn tatsächlich ein geteilter Stand
  gefunden wurde — nicht schon dann, wenn niemand angemeldet ist. Wer die App
  rein lokal benutzt, merkt von dieser Version nichts.
- Der anon-Schlüssel steckt wie jeder „publishable key" im JavaScript der Seite.
  Ein markierter Datensatz ist damit für **jeden lesbar, der die Seite
  erreicht** — nicht nur für die, denen der Link gegeben wurde. Der SQL-Kommentar
  sagt das an Ort und Stelle noch einmal.

## [1.44.0] – 2026-07-29

### Neu
- **Spalte „Seniorität" bei den Trainern**, gefüllt aus der Firmenliste
  *Seniority_Cockpit_all_bases* (Stand 03.07.2026). Sortierbar, im Dialog
  änderbar, in der Excel- und der PDF-Ausgabe.
- **Nur die Leute, die in der App stehen.** Das Dokument führt 416 Cockpit-Crew;
  davon sind 47 unserer 50 dort zu finden. Der Abgleich ist ein Nachschlagewerk,
  kein Import: es wird niemand angelegt, und ein bereits eingetragenes Datum
  gewinnt gegen das Dokument.
- **Drei bleiben leer** (Essbauer, Beverage, Hüsser) — sie stehen nicht in der
  Liste. Ein geratenes Datum wäre schlimmer als keines: es sieht nicht falsch
  aus, es sortiert sich nur an die falsche Stelle. Beim Sortieren stehen leere
  Felder deshalb hinten, nicht vorn.
- **Zwei wurden von Hand zugeordnet**, weil App und Firmenliste sie verschieden
  schreiben (ein Buchstabe im Nachnamen, „Joe"/„Jose"). Base und Funktion
  stimmen in beiden Fällen überein, und beide sind der einzige Träger ihres
  Nachnamens in der Liste. Ein Test hält beide Zuordnungen fest.

### Geändert
- **Der Sortierpfeil steht nur noch auf der Spalte, nach der sortiert wird.**
  Auf allen übrigen war er Zierde und kostete gemessen **83 px** — genau der
  Betrag, um den die fünfzehn Spalten sonst über die Breite der Seite
  hinausgelaufen wären (1317 px gebraucht, 1234 px vorhanden). Bewusst ganz weg
  statt beim Überfahren eingeblendet: eine Kopfzeile, die unter dem Zeiger
  wächst, verschiebt jede Spalte daneben. Die Kopfzeile bleibt ein Knopf, und
  `aria-sort` sagt einem Screenreader weiterhin, wonach und wie sortiert ist.

### Geprüft
- iPhone (390), iPad hoch (820 und 834), iPad quer (1024) und der Rechner: das
  Datum steht auf der Karte mit seiner Überschrift, in derselben Zeile wie die
  Umschulungs-Phase — keine zusätzliche Kartenzeile. Nirgends etwas hinter
  seitlichem Schieben, nirgends ein Überlauf.
- Am iPad bekam die Spalte zunächst die ganze freie Spur (460 px für ein Datum);
  sie sitzt jetzt in einer 150 px breiten.

## [1.43.0] – 2026-07-28

### Geändert
- **Die Monatsübersicht ist eine Grafik und steht unter der Provider-Liste.**
  Ein Balken je Monat, aufgeteilt nach Kursart, in den Farben, die die Kursarten
  auch auf dem Board und im Planungsraster tragen. Rechts die Summe des Monats,
  in der Legende die Summe je Kursart. Gestapelt, nicht nebeneinander: die erste
  Frage ist, wie viel ein Monat insgesamt hergibt, die Aufteilung die zweite.
- **Sie war vorher nicht auffindbar.** Als Zahlentabelle stand sie ganz unten im
  Kapazitäts-Reiter — gemessen **2776 px** weit unten am iPhone, also 3,3
  Bildschirmlängen hinter drei FTE-Tabellen, die dort jeweils zu einem Stapel
  Karten werden; am Rechner 1161 px. Wer die Zahlen im Anbieter-Dialog eingetragen
  hatte und danach das Ergebnis suchte, fand schlicht nichts. Jetzt 1381 px am
  Handy und 500 px am Rechner — im selben Reiter, in dem die Zahlen entstehen,
  direkt unter den Anbietern, die sie beschreiben.
- **Leere Monate behalten ihre Zeile.** In der Tabelle war das eine graue Zeile;
  in der Grafik ist es eine Lücke in der Achse — und genau die ist der Zweck
  einer Zeitleiste: man sieht ohne eine einzige Zahl, dass November und Dezember
  die Last tragen und das Frühjahr leer ist.
- Der Zeitraum kommt weiter aus den Einstellungen. Ein Ende vor dem Anfang wird
  benannt, statt eine leere Grafik zu zeichnen.
- Der Testlauf misst jetzt die **Position** des Abschnitts, nicht nur seine
  Existenz — sonst wandert er beim nächsten Umbau wieder nach unten.

## [1.42.0] – 2026-07-28

### Geändert
- **Provider-Plätze sind eine Gesamtzahl, keine Monatsrate.** „Plätze / Monat"
  hieß im Kern: jeder Monat ist gleich. Die Monate sind aber nicht gleich — vier
  Type Ratings im November 2026, zwei im Dezember, sechs im März 2027 — und eine
  Rate konnte das nicht ausdrücken. Sie durch die Zahl der Personen zu teilen
  hat außerdem Kapazität in Monaten erfunden, die keine haben.
- Die Auslastungs-Chips rechnen deshalb nicht mehr in Monate um. Bedarf und
  Plätze sind jetzt beides Gesamtzahlen und werden direkt verglichen; fehlen
  Plätze, steht dort, wie viele.

### Neu
- **Zeitleiste im Anbieter-Dialog.** Je Monat eine Zeile, je Kursart ein Feld,
  dazu die Summe. Bewusst nur die Monate, in denen es etwas gibt: alle achtzehn
  immer anzuzeigen wäre je Anbieter eine Wand aus Nullen und würde am Handy die
  drei Monate begraben, um die es geht. Ein bereits eingetragener Monat fällt
  aus der Auswahl — zwei November-Zeilen sähen beide verbindlich aus, und nur
  eine könnte das Speichern überleben.
- **Warnung, kein Riegel.** Verteilt die Zeitleiste mehr, als bei „Plätze
  insgesamt" steht, sagt die App das — je Kursart und in Summe. Gesperrt wird
  nichts, dieselbe Regel wie bei den Plätzen eines Kurstermins: ein Anbieter
  findet auch mal einen Platz mehr, und eine App, die die Eingabe verweigert,
  wird über das Notizfeld umgangen.
- **„Provider-Plätze je Monat" im Kapazitäts-Reiter.** Monate untereinander,
  Kursarten nebeneinander — nicht andersherum: die Frage ist „welcher Monat wird
  eng", und mit achtzehn Monaten als Spalten ist die Tabelle breiter als jeder
  Bildschirm. Über die Anbieter-Auswahl bekommt man die Einzelsicht, ohne eine
  zweite Tabelle. Leere Monate bleiben als graue Zeile stehen; eine Zeitleiste,
  die ihre Lücken weglässt, ist eine Liste.
- **Zeitraum in den Einstellungen**, voreingestellt bis Ende 2027. Start leer
  lassen heißt „ab dem laufenden Monat", dann wandert das Fenster von allein
  mit. Ein Ende vor dem Anfang wird benannt, statt eine leere Tabelle zu zeigen.
- Zeitleiste und Gesamtzahlen stehen im **PDF** und in der **Excel-Ausgabe** —
  „40 Plätze" und „30 davon erst 2027" sind zwei verschiedene Aussagen.

## [1.41.0] – 2026-07-27

### Geändert
- **Der Kapazitäts-Reiter als Karten** am Handy und am iPad — der letzte, der
  noch Spalten versteckte. Gemessen: die Zahlentabellen brauchen 745 px und der
  Bearbeiten-Teil 664 px, am iPhone lagen 423 bzw. 342 px hinter dem seitlichen
  Schieben. Je Zeile eine Karte: oben die Qualifikation, Base oder das Muster,
  darunter die Zahlen, jede mit der Überschrift, die ihre Spalte trug. Die Zahl
  der Aircraft-Spalten ist einstellbar, die Zellen werden deshalb automatisch
  gesetzt.
- Die Zahlen stehen **zeilenweise bündig**. Dafür umbricht die längste
  Überschrift („In Umschulung") statt zu „IN UMSCHULU…" abgeschnitten zu werden,
  und jede Überschrift reserviert zwei Zeilen — sonst rutscht eine umgebrochene
  ihre eigene Zahl unter die Nachbarn, und eine Zahlentabelle, deren Zahlen
  nicht auf einer Linie stehen, verfehlt ihren Zweck.

### Behoben
- **Mini-Knöpfe im Dunkelmodus.** `.mini-btn` hatte Weiß fest verdrahtet statt
  `var(--white)` und leuchtete als helles Kästchen auf fast schwarzer Seite.
  Betraf alle: die Pfeile im Board, die Listen-Editoren, das Löschen in jedem
  Dialog. Jetzt Kartengrau, und das Burgunderrot weicht dem helleren Magenta,
  das die Kartentitel schon verwenden — Kontrast 6,0:1 statt 2,6:1.

### Geprüft, nichts gefunden
- Die **Kalender-Ansicht** unter Umschulung war nie am Handy angesehen worden
  (jeder Durchlauf landete auf dem Board). Sie ist auf 390 und 768 px sauber:
  kein Überlauf, nichts verdeckt.
- Die neuen Karten im **Dunkelmodus** ebenso: kein Überlauf, und die
  Feldüberschriften kommen auf 6,7:1.

## [1.40.0] – 2026-07-27

### Neu
- **Sortieren am Handy und am iPad.** Wo eine Liste zur Karte wird, ist die
  Kopfzeile ausgeblendet — und `toggle` war nur über sie erreichbar, also gab
  es dort gar keine Sortierung mehr. Neu ist ein Auswahlfeld „Sortieren" mit
  einem Richtungspfeil, das genau in der Breite erscheint, in der die Kopfzeile
  verschwindet. In Trainer, Other Pilots, Provider, Kapazität und Planung.
  Bewusst eine kurze Auswahl statt aller Spalten: am Handy braucht man zwei bis
  drei sinnvolle Reihenfolgen, nicht vierzehn.
- Am wichtigsten in der **Kapazitäts-Liste**: sie existiert, um „wer ist der
  Engpass" zu beantworten, und das ist eine Frage nach der Reihenfolge. Am
  Handy war sie auf Name-aufsteigend eingefroren.
- Am Rechner ändert sich nichts — dort bleibt die Kopfzeile und das Feld
  erscheint nicht.

### Behoben
- **Spaltenköpfe waren für Screenreader keine.** Der sortierbare `<th>` trug
  `role="button"`, was die Kopfzeilen-Rolle *ersetzt*. Gemessen: mit der alten
  Form meldete der Barrierefreiheits-Baum **null** Spaltenköpfe statt acht, und
  die Kopfzeile hatte nicht einmal einen Namen. Der Kopf ist jetzt wieder ein
  Kopf mit `aria-sort`; gedrückt wird ein echter Knopf darin.

### Geändert
- Die Karten-Tabellen benennen Tabelle, Zeile und Zelle jetzt ausdrücklich.
  **Ehrlich gemessen war das nicht nötig:** Chromium behält diese Rollen auch
  bei `display: grid` — nach dem Entfernen der Attribute blieben Tabelle, 64
  Zeilen und 512 Zellen im Baum stehen. Der Review-Fund traf für diese Engine
  also nicht zu. Die Attribute bleiben als Absicherung für Engines, die die
  Rollen beim Umbau verlieren, und ein Test hält sie fest — aber sie beheben
  hier keinen beobachteten Fehler.

## [1.39.0] – 2026-07-27

### Geändert
- **Die Planungs-Ansicht am Handy und am iPad als Karten.** Gemessen brauchen
  die Spalten 888 px; darunter lagen am iPhone 528 px und am iPad 114–166 px
  hinter dem seitlichen Schieben — auf der Ansicht, in der die Buchungen
  gemacht werden. Diese Liste ist als einzige eine **Matrix** (Personen mal
  Kursschritte), deshalb ist die Karte die Person und jeder Kursschritt eine
  beschriftete Zeile darin. Die Zahl der Schritte ist einstellbar, die Zeilen
  werden deshalb automatisch gesetzt statt über feste Bereiche.
- Auf dem Tablet stehen zwei Buchungen nebeneinander (Kartenhöhe 280 → 166 px).

### Behoben
- **Der Kurstermin-Dialog passte nie.** Seine Tabelle braucht gemessen 818 px,
  der Dialog war auf 720 px gedeckelt — Plätze, Belegt und der **Löschen-Knopf**
  lagen bei *jeder* Fenstergröße hinter dem seitlichen Schieben, auch am
  Rechner. Ein Kurstermin ließ sich anlegen, aber nicht entfernen, ohne die
  Tabelle zu schieben. Der Dialog hat jetzt eine dritte Breitenstufe (940 px).
- Unter 900 px kann der Dialog nicht so breit sein, dort wird die Zeile zur
  Karte: ein gestapeltes Formular, jedes Feld mit der Beschriftung, die vorher
  die Kopfzeile trug. Unter 480 px bekommen „von" und „bis" je eine eigene
  Zeile — in einer halben Handybreite (92 px) schneidet der Browser das Datum
  auf „09/01/" ab.

### Tests
- Beide neuen Karten sind gemessen abgesichert, und beide Wächter wurden
  gegengeprüft, indem die Behebung im Browser rückgängig gemacht wurde.
- Der erste Entwurf des Kurstermin-Tests meldete einen erreichbaren
  Löschen-Knopf, den es gar nicht gab: die Tabelle war leer. Der Test legt den
  Kurstermin jetzt über die Schaltfläche selbst an und prüft vorher, dass eine
  Zeile da ist.

## [1.38.0] – 2026-07-27

### Behoben
- **Langer Status überlappte den Anbieternamen.** Provider-Status sind frei
  benennbar. Ein Chip, der breiter ist als seine Kartenhälfte, konnte nicht
  schrumpfen (`white-space: nowrap`) und lief nach **links** über den Namen —
  beides unlesbar. Der Chip umbricht jetzt in seiner eigenen Hälfte. Gemessen:
  ohne die Behebung überlappt er um 114 px, mit ihr hält er 8 px Abstand.
- **Provider-Karten auf dem iPad.** Zwei 1fr-Hälften galten von 320 bis
  1000 px: ein ICAO-Kürzel stand allein in ~460 px und der Status klebte ebenso
  weit vom Namen. Feste Feldbreiten, Rest bleibt frei — dieselbe Stufe, die
  Other Pilots und Trainer schon hatten und die hier gefehlt hat.
- **Leere Listen zeigen „–".** Die Kartenüberschrift wird immer gezeichnet;
  ohne Rückfall stand „KURSE" über leerem Raum. Auf einer frischen Installation
  betraf das jede Karte.
- **Strg+P druckt wieder die Tabelle.** A4 hochkant ist ~794 px, also innerhalb
  des Karten-Umschaltpunkts — gedruckt wurden Karten ohne Spaltenüberschriften.
  Die Media-Queries gelten jetzt nur für `screen`. Betraf auch Trainer und
  Other Pilots. Der PDF-Export war nie betroffen (baut eigene Tabellen).
- **Lange E-Mail-Adresse.** Eine Adresse ohne Umbruchstelle gab `.table-wrap`
  den seitlichen Scroll zurück, den die Karte abschaffen sollte (gemessen
  47 px). Sie umbricht jetzt.
- **Antippen färbt die ganze Karte.** Der Hover lag auf den Zellen; auf der
  Karte sind das nur die engen Textkästen, umgeben von 12 px Kartenrand und
  8 px Rinnen. Jetzt auf der Zeile, in hell und dunkel.

### Geändert
- **Das Karten-Gerüst steht an einer Stelle** statt dreimal kopiert. Die Kopien
  waren bereits auseinandergelaufen (Kartenabstand 11/12 px, Zeilenabstand
  8/9 px, Überschriftabstand nur bei einer). Zwei Blöcke statt einem, weil die
  drei Listen nicht bei derselben Breite aufhören zu passen (966 / 724 /
  1234 px gemessen) und CSS einen Regelkörper nicht über zwei Media-Queries
  teilen kann.

### Tests
- Die Zusicherung gegen die abgeschnittene Überschrift war eine Tautologie: sie
  las den berechneten `::before`-Inhalt, den das Abschneiden nie verändert.
  Ersetzt durch eine Messung — die Statusbreite darf die Spaltenbreite darunter
  nicht verändern (ohne die Behebung fällt sie von 164 px auf 17 px).
- Der Testdatensatz nutzt jetzt einen **langen, selbst benannten** Status statt
  des kurzen englischen Standardwerts, der den Fehler gar nicht auslösen konnte.
- Neu geprüft: Kartenanordnung beider Tabellen (statt nur „Feld sichtbar"),
  Überlappung nach links, Chips statt nur Zellkästen an den Rändern, der
  „–"-Rückfall und das Druckbild. Jede neue Zusicherung wurde gegengeprüft,
  indem die Behebung im Browser rückgängig gemacht wurde.

## [1.37.0] – 2026-07-27

### Geändert
- **Die beiden Provider-Tabellen am Handy und am iPad als Karten.** Der Befund
  war hier ein anderer als bei Trainer und Other Pilots: die Tabelle *passte*
  ab etwa 770 px. Unlesbar war sie trotzdem, weil die Kurs-Chips in ein
  Sechstel der Bildschirmbreite gequetscht wurden — „Type Rating + Base
  Training" brach über vier Zeilen um und ein einzelner Provider wurde höher
  als der Bildschirm.
- Auf der Karte bekommen die Chip-Listen die **volle Breite**, damit steht
  jeder Kurs auf einer Zeile. Gemessen: die höchste Zeile ist von rund 350 px
  auf 204 px geschrumpft, ohne dass ein Feld weggefallen ist.
- Aufbau je Karte: oben Anbieter und Status, darunter Standorte und
  SIM-Version nebeneinander, dann die Kurse über die volle Breite, unten der
  Ansprechpartner. Die Kapazitäts-Tabelle darunter genauso (Anbieter,
  Zugewiesen und Plätze/Monat, dann die Kurs-Chips).
- Zwei Spalten und keine dritte für den Status: eine automatisch breite
  Status-Spalte nahm ihre Breite vom längsten Eintrag und schnitt dadurch die
  Feldüberschrift eine Zeile tiefer zu „STANDORTE (ICA…" ab — nur auf der
  betroffenen Karte.
- Ab 1000 px bleiben beide Tabellen wie gewohnt.

## [1.36.0] – 2026-07-27

### Geändert
- **Die Trainer-Liste am Handy und am iPad im Hochformat.** Vierzehn Spalten,
  von denen auf einem iPhone vier auf den Bildschirm passten und 863 px hinter
  dem seitlichen Schieben lagen — dieselbe Sache, die bei Other Pilots zu
  Karten geführt hat, nur auf der Liste, aus der heraus der Tag läuft. Unter
  1280 px wird jede Zeile eine Karte: oben **Name und Qualifikations-Chip**,
  darunter Base, TLC, Rolle, FTE, Aircraft, ORE-Stufe und Umschulungs-Phase.
- **Fünf Felder stehen nicht auf der Karte:** Teilzeit, Intern/Extern,
  Behörde, Anmerkung und Notiz. Sie werden im Dialog gelesen, der sich beim
  Antippen öffnet. Vierzehn Felder mal fünfzig Personen — mit zwei
  Freitextfeldern je Karte — wären am Handy eine endlose Folge unterschiedlich
  hoher Blöcke. In der Tabelle, in der Suche und in **allen** Exporten (PDF,
  Excel, Druck) sind sie unverändert enthalten.
- **Ab 1280 px** bleibt die gewohnte Tabelle mit allen vierzehn Spalten.
  Gemessen brauchen sie 1234 px; ein iPad im Querformat (1024 px) ist noch
  245 px zu schmal und bekommt deshalb ebenfalls Karten. Oberhalb von 1280 px
  wächst der Inhaltsbereich ohnehin nicht weiter.

## [1.35.1] – 2026-07-27

### Behoben
- **Other Pilots am iPad.** Die Kartenansicht griff erst unter 780 px. Ein
  iPad Air oder Pro im Hochformat ist 820 bzw. 834 px breit, lag also darüber
  und bekam weiter die abgeschnittene Tabelle — genau das Problem, das die
  Kartenansicht lösen sollte. Gemessen brauchen die acht Spalten 966 px;
  umgeschaltet wird deshalb unter **1000 px**. Im Querformat (1024 px) bleibt
  die echte Tabelle, dort passt sie.
- **Karte auf dem Tablet.** Die Spalten „Gültig" und „Abgelaufen" wuchsen auf
  über 200 px, das × stand weit entfernt von seiner Überschrift. Die vier
  Felder je Berechtigung haben jetzt feste Breiten; der übrige Platz bleibt
  leer, statt sie auseinanderzuziehen.
- **Piloten-Dialog am Handy.** Bei zwei Berechtigungen brechen die vier
  Bedienelemente auf zwei Zeilen um, wodurch das Lösch-× der ersten direkt
  über dem Muster-Feld der zweiten stand. Jede Berechtigung hat jetzt einen
  eigenen Rahmen.

## [1.35.0] – 2026-07-27

### Geändert
- **Other Pilots am Handy.** Acht Spalten passen nicht auf ein iPhone: die
  Tabelle hörte nach dem Namen auf, Muster, Gültigkeit, Boeing Erfahrung,
  Gültig und Abgelaufen lagen hinter einem seitlichen Scrollen, das niemand
  findet. Unter 780 px wird jede Zeile jetzt eine Karte — Name oben, darunter
  Base, TLC und Boeing Erfahrung, darunter die vier Felder je Berechtigung.
  Die vier bleiben nebeneinander stehende Spalten: untereinander gestapelt
  stünde das Datum der zweiten Berechtigung unter dem Muster der ersten.
- **Jedes Feld trägt seine eigene Überschrift.** Auf der Karte gibt es keine
  Kopfzeile mehr, die es benennt.
- **Seitlicher Scroll ist sichtbar.** Alle übrigen Tabellen zeigen am Rand
  einen Schatten, solange dahinter noch Spalten liegen.

### Behoben
- **Die korrigierte Piloten-Liste erreicht jetzt auch alte Geräte.** 1.33.0 war
  mit falschen Bases und ohne TLC ausgeliefert und hatte dabei das Flag
  `_pilotSeed` gesetzt — die Korrektur aus 1.34.0 konnte ein Gerät, das die
  erste Fassung schon hatte, nie mehr erreichen. Ein leeres TLC kennzeichnet
  einen solchen Datensatz; selbst eingetragene bleiben unangetastet.

## [1.34.0] – 2026-07-27

### Other Pilots

- **Das × steht in derselben Zeile wie sein Datum.** Bei zwei Mustern wurde je
  Person **ein** Kreuz gesetzt, also landete die Bewertung der zweiten
  Berechtigung neben dem Datum der ersten. Jetzt bekommt jede Berechtigung ihre
  eigene Zeile in allen Spalten, und die Zeilen haben feste Höhe, damit sie über
  die Spalten hinweg nicht auseinanderlaufen.
- Die drei Kreuz-Spalten (*Boeing Erfahrung · Gültig · Abgelaufen*) sind
  **zentriert**. „Boeing Erfahrung" gehört der Person, steht also einmal in der
  ersten Zeile.
- **Ein Datum sagt seinen eigenen Befund**: noch gültig grün, abgelaufen rot.
- Die **korrigierte Liste** ist übernommen: 64 Personen, 70 Berechtigungen,
  jetzt mit TLC und Cockpit-Rolle aus der Datei.

### Navigation

- **Ein Tab-Wechsel beginnt oben.** Vorher behielt der Browser die
  Scroll-Position, sodass ein Tipp auf einen Reiter mitten aus einer langen
  Tabelle die nächste Seite bereits an ihrer Werkzeugleiste vorbei öffnete.
- **Der offene Reiter steht in der Adresse** (`#/providers`). Ein Refresh bleibt
  damit auf der Seite, statt aufs Dashboard zu springen — auf einer Seite, die
  den ganzen Tag neu geladen wird, ist das eine kleine Steuer, die ständig
  anfällt. Nebenbei funktioniert der Zurück-Knopf und ein Reiter ist verlinkbar.

## [1.33.0] – 2026-07-27

- **Other Pilots neu aufgebaut**, im Stil der Trainer-Liste: *Base · TLC · Name ·
  Type · Gültigkeit · Boeing Erfahrung · Gültig · Abgelaufen*. Die **65 Personen
  (71 Berechtigungen)** aus der Excel-Datei sind übernommen.
- **Mehrere Muster je Person.** Wer zwei Berechtigungen mit verschiedenen
  Enddaten hat, sieht beide untereinander in seiner Zeile und kann sie einzeln
  ändern. Wer eine abgelaufene und eine gültige hat, bekommt in **beiden**
  Spalten ein ×, genau wie in der Vorlage.
- **„Gültig" und „Abgelaufen" sind keine Felder.** Sie werden bei jeder
  Darstellung gegen das heutige Datum gerechnet. Ein gespeichertes Kennzeichen
  ist am Morgen danach falsch — auf einer Liste, deren einziger Zweck es ist zu
  sagen, wer *jetzt* was fliegen darf.
- **Base und Type sind Dropdowns mit leerer Auswahl** und in den Einstellungen
  editierbar (zwei neue Listen: *Bases* und *Muster*). Ein Wert, der nicht mehr
  auf der Liste steht, bleibt an der Person wählbar, statt still zu verschwinden.
- **TLC**: drei Zeichen, Großbuchstaben, direkt bei der Eingabe — nicht erst
  beim Speichern, denn ein Feld, das hinterher heimlich umschreibt, ist
  schlimmer als eines, das die Regel beim Tippen zeigt.
- **Name** im Format „Nachname, Vorname".
- **PDF, Excel und Druck** im selben Stil wie die übrigen Exporte: eine Zeile je
  Berechtigung wie in der Vorlage, die Folgezeile wiederholt nichts. Das PDF
  bringt zusätzlich eine Zusammenfassung (Anzahl, gültig, abgelaufen, Boeing
  Erfahrung).
- Alte Datensätze wandern automatisch: „B737-Status" + „gültig bis" werden zu
  einer 737-Berechtigung, „Boeing-Erfahrung" zum gleichnamigen Kennzeichen.

## [1.32.0] – 2026-07-27

- **„Auslastung" entfernt** aus der Provider-Kapazität.
- **Neu: „Auswahllisten" in den Einstellungen.** Alle zwölf Auswahlfelder der
  App an einer Stelle — umbenennen, umfärben, sortieren. Bisher lagen sie
  verstreut hinter fünf Zahnrädern, und zwei lagen überhaupt nicht in der App.
- **Aircraft und ORE-Stufen sind erstmals editierbar.** Sie standen fest im
  Code; ein neues Muster erscheint jetzt sofort in jedem Filter und in jeder
  Auswertung.
- **Die Trennlinie ist die id, nicht die Bequemlichkeit.** Eine id ist der Wert,
  der auf dem Datensatz steht und auf den der Code verzweigt („absolviert"
  zählt nicht mehr als offener Bedarf, „n/a" belegt keinen Platz); ein Label ist
  das, was der Leser sieht. Bei den vier Status-Listen sind deshalb Name und
  Farbe frei, Hinzufügen und Löschen nicht: ein fünfter Zuweisungs-Status wäre
  ein Wert, den kein Zweig kennt, und würde sich überall still wie „offen"
  verhalten. Die Karte sagt das dazu, statt es zu verschweigen.
- Alle Listen werden **je Eintrag synchronisiert** wie die übrigen Datensätze —
  eine Umbenennung auf dem iPad und ein neues Muster am Laptop überleben beide.
- **Ein PDF für den ganzen Umschulungs-Reiter**: Board, Planungsraster und
  Kalender in einer Datei. Der Reiter hat drei Ansichten, also hat sein PDF
  drei Teile. Querformat, weil das Raster eine Spalte je Kursart hat.

## [1.31.0] – 2026-07-27

### Dashboard aufgeräumt

- Entfernt: **„Fortschritt je Monat", „Soll gegen Ist", „Eingehende Trainer je
  Monat"** und **„Ø Dauer je Kursart"**.
- Mit ihnen entfällt **alles, was es nur für sie gab**: die Monats-Zielsetzung
  unter *Kapazität*, der Monats-Recorder, die Soll-Dauer je Kursart, dazu
  `plan.js`, `history.js`, die Dauer-Aggregationen in `courses.js`, die
  Diagramm-Komponenten, Texte, Stile und Tests. Eine Einstellung, die nirgends
  mehr wirkt, ist schlimmer als gar keine.
- Die **Umschulungs-Pipeline ist ein Balkendiagramm**: eine Zeile je Phase, Name
  voll ausgeschrieben (der gestapelte Balken musste jede leere Phase verstecken
  — auf einer Pipeline ist genau das die Frage). Phasenfarben unverändert. Eine
  Phase bei null zeichnet **keinen** Balken mehr statt eines farbigen Stummels.

### Exporte

- **Kurstermine haben jetzt ein eigenes PDF** — mit Teilnehmerliste je Kurs —
  **und ein eigenes Excel-Blatt**. Die Daten kamen in keinem Export vor.
- Das **Provider-PDF** zählt Buchungen über Kurstermine mit. Ohne den Parameter
  las es ausgerechnet die meistbeschäftigten Provider als „keine Nachfrage".
  Es druckt zusätzlich die **Kapazität je Kursart**.
- **Planungs-PDF und -Excel** drucken **Name und Zeitraum** je Zelle, wie der
  Bildschirm. Vorher fehlte der Zeitraum — also genau das, wofür es die
  Kurstermine gibt.
- Die Download-Liste in den Einstellungen folgt wieder der Reiterleiste.

### Korrekturen

- **Farbkollision behoben:** `ROLE_FO` war zeichengleich mit `STAGE_RAMP[0]`,
  wodurch die Registrierung seiner Dunkelstufe die der Phasenfarben
  überschrieb — im Dunkelmodus kippte die ordinale Reihe um. Captain/First
  Officer sind jetzt zwei Kategorie-Slots, und Karten wie Diagramme holen
  Rolle, Aircraft und ORE aus **einer** Quelle (`palette.js`).
- Kalender-Chips und -Legende sind im **Dunkelmodus** korrekt gestuft.
- Die Board-Kachel druckt das Datum **formatiert** statt roh („2026-03-03"
  neben „03.03.2026" auf derselben Karte).
- Einen Kurstermin zu wählen **löscht den eigenen Provider-Eintrag** der Person.
  Sonst gewann ein Altwert weiter, und im Dialog gab es kein Feld mehr, ihn zu
  entfernen.
- Kurstermin-Provider werden **nach Kursart gefiltert**, wie im
  Zuweisungs-Dialog.
- Die Kachel je Kursart in der Provider-Kapazität nennt jetzt die **Monate**,
  die der offene Bedarf braucht. Rot erst ab mehr als drei Monaten: „mehr als
  ein Monat" ist bei einem Phase-In der Normalfall und hätte alles markiert.
- **Neu: Überschneidungs-Warnung** im Zuweisungs-Dialog, wenn sich zwei
  gebuchte Zeiträume derselben Person überlappen.

### Tests

- Neuer Wächter `test/imports.test.mjs`: ein Bezeichner, der irgendwo exportiert
  und in einer Datei ohne Import benutzt wird, ist ein `ReferenceError`, den der
  Build **nicht** findet — die App stirbt weiß. Das ist heute zweimal passiert
  und beide Male erst im minutenlangen Browser-Lauf aufgefallen. Jetzt in einer
  Sekunde.
- Neuer Browser-Lauf `exportsAll`: alle acht PDFs und alle fünf Excel-Blätter
  werden erzeugt und auf echten Inhalt geprüft.

## [1.30.0] – 2026-07-27

- **Provider-Kapazität heißt jetzt „Plätze / Monat".** Die Zahl stand vorher
  ohne Zeitbezug da und war damit mit nichts vergleichbar.
- **Zusätzlich je Kursart.** Wie viele Personen der Provider pro Monat im Type
  Rating, im TRI-Kurs, im LIFUS aufnehmen kann. Ein Gesamtwert allein verdeckt
  genau den Engpass: sechs Type Ratings im Monat, aber nur zwei TRI-Kurse — und
  gebraucht wird der TRI-Kurs.
- Die Aufteilung hängt an den **Planungs-Schritten**, nicht am Angebots-Katalog
  des Providers. Nur so sind Bedarf und Kapazität dieselbe Größe: in der
  Kapazitätstabelle steht je Kursart „Bedarf / Plätze", und wo der Bedarf die
  Plätze übersteigt, wird die Kursart rot. Gesperrt wird nichts.
- Ohne eingetragenen Gesamtwert gilt die **Summe der Aufteilung** — die Zahl
  muss nicht zweimal getippt werden. Verspricht die Aufteilung mehr als der
  Gesamtwert, wird gewarnt und nichts korrigiert: ein Provider kann einen Platz
  zwischen Kursarten verschieben.
- Das Freitextfeld **„Kapazität / Konditionen" ist entfallen**; die Zahl und
  „Preis / Konditionen" decken es zwischen sich ab. Was dort stand, wandert per
  Migration (`_capNotes`) in die **Notizen** — selbst geschriebene Information
  wird nicht gelöscht.
- **Behoben: unsortierte Listen.** Die Karten auf dem Umschulungs-Board standen
  in Speicher-Reihenfolge (also so, wie der Seed oder ein Import es zufällig
  ergab) statt alphabetisch — auf einer Spalte mit fünfzig Karten hieß das:
  jede Karte lesen. Ebenso stand die Auswahl der Kurstermine im
  Zuweisungs-Dialog in Eingabereihenfolge statt nach Datum.

## [1.29.1] – 2026-07-27

- **Behoben: die Dauer-Kachel liess sich nicht zurückschalten.** Trug keine
  Kursart eine Soll-Dauer, war die Ansicht „% vom Soll" leer — und weil der
  Umschalter innerhalb des Diagrammzweigs stand, verschwand er mit ihm. Man
  kam nicht mehr zu „Tage" zurück.
- Der Umschalter hängt jetzt daran, ob es **überhaupt** Messwerte gibt, nicht
  an der gerade gewählten Ansicht. Die Prozent-Ansicht ohne Soll-Dauer sagt,
  was fehlt und wo es zu setzen ist, statt ein leeres Raster zu zeichnen.

## [1.29.0] – 2026-07-27

- **Ein Reiter für Board, Planung und Kalender.** Alles unter *Umschulung*,
  umgeschaltet oben rechts. Der eigene Reiter *Planung* entfällt.
- An den Daten ändert sich **nichts**. Jede Ansicht behält ihre eigene
  Filterleiste: das Board filtert Personen, das Raster filtert Zeilen — das
  sind zwei verschiedene Fragen. Geteilt sind nur Titel und Umschalter.
- Der Grund: beide beschreiben denselben Weg derselben Person. Getrennt
  konnten sie sich widersprechen, ohne dass es auffiel — ein Schritt in der
  Planung auf „absolviert", während die Karte auf dem Board noch in einer
  früheren Spalte hing. Das Zusammenführen der beiden Listen (sechs Stufen,
  vier Schritte) ist ein eigenes, größeres Vorhaben; das hier ist die billige
  und risikolose Hälfte.

## [1.28.0] – 2026-07-27

- **Ø Dauer je Kursart.** Neue Kachel in der B737-Umschulung: Monate auf der
  x-Achse, eine Linie je Kursart, umschaltbar zwischen **Tagen** und
  **% vom Soll**. Beides beantwortet eine eigene Frage — „wie lang ist ein
  TRI-Kurs" und „welche Kursart läuft über", letzteres über Kursarten hinweg,
  deren natürliche Längen nichts miteinander zu tun haben.
- **Gezählt wird je Kurs, nicht je Kopf.** Ein Kurstermin mit zwölf
  Teilnehmern hat *einmal* stattgefunden. Pro Kopf gerechnet hätte er seinen
  Monat zwölffach bestimmt und jeden anderen Kurs desselben Monats übertönt.
  Ein Eintrag ohne Kurstermin zählt als eigener Kurs — das ist die einzige
  sinnvolle Lesart eines Einzelfalls.
- Tagen-Ansicht: je Kursart eine gestrichelte **Soll-Linie in der eigenen
  Farbe**. Prozent-Ansicht: **eine** neutrale 100-%-Linie, weil dort alle
  Soll-Linien dieselbe wären. Die Linie ist Tinte, keine Statusfarbe — unter
  100 % ist nicht automatisch gut.
- **Ein Monat ohne Kurs ist eine Lücke, keine Null.** Die Linie bricht ab,
  ein einzelner Messpunkt bleibt als Punkt stehen.
- **Laufende Kurse zählen nicht mit** (Start ohne Ende). Sonst zöge jeder
  begonnene Kurs den Schnitt gegen null. Wie viele gerade laufen, steht unter
  dem Diagramm, statt still unterschlagen zu werden.
- **Der Zieltermin bekommt ein Urteil.** Auf der Board-Karte steht neben dem
  Zieltermin, ob das letzte gebuchte Kursende ihn hält (grün) oder um wie
  viele Tage darüber liegt (rot).
- Solange nicht jeder Schritt ein Enddatum hat, steht dort **„3/4"** statt
  einer Farbe. Ein halb erfasster Plan sagt immer einen frühen Abschluss
  voraus; das wäre eine schmeichelnde Aussage, keine Messung. Ein Schritt auf
  „n/a" hält das Urteil nicht auf — er wird nicht mehr stattfinden.
- Kurslängen und Achsenwerte laufen durch dieselbe Zahlenformatierung wie die
  FTE-Werte (`formatNum1`), also „11,3" statt „11.3".

## [1.27.0] – 2026-07-27

- **Kurstermine.** Ein Kurstermin ist ein konkreter Durchlauf: Kursart,
  Provider, Ort, Zeitraum *von–bis* und Plätze. Anzulegen unter *Planung →
  🗓 Kurstermine*. Das ist der Datensatz, der bisher gefehlt hat — ein TR-Kurs
  läuft vom 3. bis zum 20. März, und acht Leute sitzen darin. Der Zeitraum
  gehört dem **Kurs**, nicht jedem der acht.
- **Buchen statt tippen.** In der Planung wählt man je Schritt einen
  Kurstermin. Provider, Ort und Zeitraum kommen dann von dort und sind nicht
  mehr je Person editierbar — genau so kam derselbe Kurs zu drei verschiedenen
  Enddaten.
- **Abweichung je Person.** Wer später einsteigt oder früher raus ist, bekommt
  einen eigenen Start und/oder ein eigenes Ende. Nur die abweichenden Felder
  werden gesetzt; leer heißt „wie geplant". Der Dialog benennt die Abweichung.
- **Plätze mit Warnung.** Mehr Zuordnungen als Plätze färbt die Zahl rot.
  Gesperrt wird nichts: ein Kurs kann eine neunte Person aufnehmen, und ein
  Editor, der die Eingabe verweigert, wird ohnehin über das Notizfeld umgangen.
  Ohne Platzzahl gibt es keine Überbuchung.
- **Nichts Bestehendes geht verloren.** Ein Eintrag ohne Kurstermin verhält
  sich wie bisher — Provider, Ort und Datum direkt in der Zelle — und hat
  zusätzlich ein Feld „Bis". Ein „n/a"-Schritt belegt keinen Platz.
- **Soll-Dauer je Kursart** (Tage), einstellbar unter *Spalten bearbeiten*.
  Sie hängt an der Kursart selbst, überlebt also eine Umbenennung.
- Kalender, Provider-Auslastung, Board-Karten sowie PDF- und Excel-Export
  lesen den **aufgelösten** Zeitraum. Ohne das wäre ausgerechnet die korrekt
  gebuchte Person überall als „nicht zugewiesen" erschienen.
- Das Löschen eines Kurstermins löst die Buchungen darauf; das Löschen eines
  Providers räumt ihn auch aus den Kursterminen. Beides mit Rückfrage, wenn
  Personen betroffen sind.

## [1.26.0] – 2026-07-25

- **Ziele je Monat einzeln setzbar.** Die Karte „Umschulungs-Ziele" unter
  *Kapazität* ist jetzt ein Raster: sechs Monate nebeneinander, je Monat ein
  Feld für „Freigegeben (Soll)" und eines für „Trainer/Monat (Soll)". Direkt
  eintippen statt über ein „Ziel hinzufügen"-Formular — ein Ziel, das man nicht
  sieht, ist ein Ziel, das man zu setzen vergisst.
- **Sechs-Monats-Fenster mit Schieberegler**, bis **Ende 2027**. Der Regler
  (plus ‹ ›-Knöpfe für einen Monat auf einmal) sitzt sowohl in der Zielsetzung
  als auch über dem Dashboard-Diagramm.
- **Jeder Monat besitzt sein eigenes Ziel.** `intakeFor()` schreibt den letzten
  gesetzten Wert **nicht mehr** in die Folgemonate fort. Ein leeres Feld heißt
  „kein Ziel gesetzt" und zeichnet keine Linie — eine geliehene Zahl sah aus wie
  eine Entscheidung, die niemand getroffen hatte.
- Das Diagramm behält Monate ohne Zugang als **leere Säule** im Fenster. Ein
  Diagramm, das die ruhigen Monate stillschweigend überspringt, lässt das Tempo
  gleichmäßiger aussehen, als es ist.
- **Behoben: geklemmte Ziellinien.** Lag ein Monatsziel über dem höchsten
  Balken, zeichnete `TrendColumns` die Linie am oberen Rand — drei verschiedene
  Ziele lagen dann alle auf derselben Höhe und lasen sich als *ein* flacher
  Plan. Die Skala wird jetzt aus Balken **und** Ziellinien gebildet.

## [1.25.0] – 2026-07-25

- **Neu: „Eingehende Trainer je Monat"** in der B737-Umschulung. Je Säule ein
  Monat, gestapelt in Captain und First Officer, die Zahl steht im Balken.
  Grundlage sind die **Zieltermine** der Personen — anders als die Zeitachse
  auf dem Kapazitäts-Reiter lässt diese Auswertung bereits Freigegebene
  ausdrücklich **drin**: es geht um Durchsatz je Monat, und der Monat, in dem
  jemand fertig wurde, ist genau ein Monat, in dem er dazugehörte.
- **Monatsziel je Monat setzbar.** Unter *Kapazität → Umschulungs-Ziele* gibt es
  neben dem bisherigen Meilenstein jetzt „Trainer/Monat (Soll)". Es wird als
  gestrichelte Linie über den Säulen gezeichnet, bleibt zwischen zwei Zielen
  flach und springt beim nächsten.
- **Zwei Ziele, ein Datensatz, verschiedene Bedeutung.** Der Meilenstein ist
  **kumulativ** („bis Oktober 15 fertig"), das Monatsziel ein **Durchsatz**
  („26 Trainer im Oktober"). Sie werden getrennt gehalten: ein Ziel zu setzen
  lässt das andere unangetastet, und der Monat verschwindet erst aus der Liste,
  wenn **beide** leer sind — ein gelöschtes Monatsziel darf keinen Meilenstein
  mitnehmen.
- Die Legende dieser Kachel **summiert** über die Monate, während die
  „Fortschritt je Monat"-Kachel den letzten Monat zeigt. Das ist kein
  Widerspruch: Fortschritt ist ein *Bestand* (dieselben Leute, monatlich neu
  gezählt), der Zugang ein *Fluss* (jeden Monat andere Leute).
- Captain und First Officer tragen dieselben zwei Farben wie der
  Captain/First-Officer-Ring weiter oben.

## [1.24.1] – 2026-07-25

- **Weiße Seite beim Zuweisen behoben.** In der Planung riss ein Klick auf
  „+ zuweisen" die gesamte Oberfläche ab — ohne Fehlermeldung, einfach weiß.
  Ursache: `PlanningModal` ist eine **Schwester**-Komponente von `Planning()`,
  keine darin verschachtelte. Die dort definierte Farbfunktion `tint` war im
  Dialog schlicht nicht sichtbar, der Zugriff warf einen `ReferenceError` beim
  ersten Rendern — und darauf hängt React den kompletten Baum ab. Der Dialog
  holt sich seinen Themen-Resolver jetzt selbst.
- Zur Sicherheit den ganzen Quelltext nach demselben Muster durchsucht
  (Komponente benutzt `tint`, ruft aber kein `useThemed()`): es war die einzige
  Stelle.
- **Die Planung hatte keinen einzigen Browser-Test** — deshalb konnte ein
  Absturz auf dem wichtigsten Knopf des Reiters unbemerkt ausgeliefert werden.
  Neu: `test/browser/planning.test.mjs` öffnet den Dialog, prüft *zuerst*, dass
  die App überhaupt noch steht (weiße Seite und fehlender Dialog sind zwei
  verschiedene Fehler), setzt Provider und Datum, kontrolliert dass beides im
  Speicher ankommt, schließt und öffnet erneut.

## [1.24.0] – 2026-07-25

- **PDF ohne Fußzeile, mit schmalen Rändern.** Version und Seitenzahl sind weg;
  die Ränder gingen von 40 auf **24 Punkt** (≈ 8,5 mm) — schmal genug, um das
  Blatt zu nutzen, breit genug, dass kein Drucker die äußere Spalte abschneidet.
  Da unten nichts mehr steht, darf die Tabelle bis zur Blattkante laufen.
- **Trainer: „Funktion / Anmerkung" → „Funktion"**, verschoben ans Ende der
  Tabelle hinter die Umschulungs-Phase. Freitext liest man, man sortiert nicht
  danach — deshalb hinter die Spalten, nach denen gefiltert wird.
- **Neue Spalte „Anmerkungen"** ganz rechts. Rein informativ: sie speist keine
  Statistik und keine Auswertung. Die Unterscheidung ist bewusst — „Funktion"
  zählt weiterhin die Dashboard-Kachel „Funktion" (mit/ohne), „Anmerkungen"
  zählt nichts. Bearbeitbar im Trainer-Dialog, enthalten in Excel- und
  PDF-Export, durchsuchbar.
- Damit die Tabelle mit 14 Spalten weiterhin **ohne Querscrollen** auf den
  Bildschirm passt, ist der seitliche Zellenabstand von 8 auf 6 Punkt gegangen.
  Gemessen statt geraten: die Spaltenbreiten werden von den *Überschriften*
  bestimmt (ANMERKUNGEN, ZUGEHÖRIGKEIT, UMSCHULUNG — die lassen sich nicht
  umbrechen), nicht vom Inhalt. Die fehlenden 45 px kamen genau von dort.
- Der **Excel-Import** wurde mitgezogen: „Anmerkung(en)", „Bemerkung(en)" und
  „Kommentar" landen jetzt in der neuen Spalte. Die alte kombinierte
  Überschrift „Funktion / Anmerkung" bleibt bei „Funktion" — das ist, was sie
  immer enthielt, und alte Dateien müssen sich unverändert einlesen lassen.
- **B737-Umschulung: alle fünf Kacheln nennen ihre Grundgesamtheit** („von 50
  im Umschulungs-Pool (SEN/TRE/TRI/LTC)"). Vorher trugen nur die beiden
  FTE-Kacheln einen Hinweis, und „50 noch nicht gestartet" las sich wie eine
  Aussage über alle — die Umschulung betrifft aber SFI und TKI nicht.
- **ORE-Priorität zählt nur A, B und C.** Personen ohne Stufe erschienen als
  vierte Kategorie „—". Das machte aus einem fehlenden Wert eine Kategorie und
  ließ die Gesamtzahl in der Überschrift (der ganze Pool) nicht mehr zu den
  Segmenten passen. Die Überschrift zeigt jetzt die Summe der Segmente.

## [1.23.1] – 2026-07-25

- **Kein Copyright-Hinweis mehr auf den Exporten.** Entfernt aus der PDF-
  Fußzeile (jede Seite), der Excel-Fußzeile und dem `_meta`-Block der
  JSON-Sicherung. Die Fußzeile trägt jetzt nur noch die Version — auf einem
  ausgedruckten Blatt ist das die einzige Möglichkeit zu erkennen, aus welchem
  Stand die Zahlen stammen.
- **Der Excel-Import musste mitgeändert werden.** Er erkennt die eigenen
  Kopf- und Fußzeilen an ihrem Text, und die Fußzeile fand er bisher am „©".
  Ohne Anpassung wäre beim Wiedereinlesen eines Exports ein Trainer namens
  „v1.23.1" entstanden — genau der Fehler, der in 1.8.1 schon einmal behoben
  wurde. `isExportBanner()` kennt jetzt drei Marker: den Banner, die neue
  Versions-Fußzeile und die **alte** Copyright-Fußzeile, damit vorher
  exportierte Dateien weiterhin sauber eingelesen werden.
- **Auf dem Bildschirm** bleibt der Hinweis in der App-Fußzeile stehen — dort
  war er nicht gemeint.
- Abgesichert: `test/exports.test.mjs` prüft Fußzeile und Import gemeinsam
  (inkl. der alten Fußzeile und der Gegenprobe, dass „Senior 737 Trainer" als
  Bemerkung **nicht** für eine Bannerzeile gehalten wird); der Browser-Test
  liest die erzeugte PDF- und Excel-Datei und prüft, dass dort kein
  „Copyright" mehr vorkommt.

## [1.23.0] – 2026-07-25

- **Die ORE-Stufe „Rente" ist entfernt.** Aus den Auswahlfeldern (Trainer,
  Planung), aus der Sortierreihenfolge, aus dem ORE-Ring auf dem Dashboard und
  aus jeder Stelle, die vorher danach gefiltert hat: Kapazitäts-Tabellen,
  FTE-Summen, Umschulungs-Board, Zeitachse, Warnungen und PDF-Export.
- **Niemand wird gelöscht.** Eine Migration (`_oreNoRente`) nimmt Personen, die
  die Stufe noch tragen, nur die Markierung ab — der Datensatz bleibt. Einen
  Roster-Eintrag zu entfernen hat niemand verlangt, und „die Stufe gibt es
  nicht mehr" heißt nicht „die Person ist weg".
- **Die FTE-Gesamtzahl steigt von 42,9 auf 44,7.** Das ist kein Rechenfehler:
  es sind exakt die zwei Personen, deren Kapazität vorher überall
  herausgerechnet wurde. Wo bisher 48 Köpfe zählten, sind es jetzt 50.
- **Alle „ohne Rente"-Zusätze sind weg**, weil es nichts mehr auszuklammern
  gibt. Damit verschwindet auch `headcount().active` / `.fteActive`: ohne die
  Stufe wären das dieselben Zahlen wie `total` / `fte` unter zweitem Namen —
  genau die Doppeldeutigkeit, die 1.19.4 mühsam beseitigt hat. Der Test prüft
  jetzt ausdrücklich, dass es diese zweite Population **nicht** mehr gibt,
  damit ein übersehener Aufrufer nicht still `undefined` anzeigt.
- Das Übersichts-Band trägt wieder zwei Zahlen: **Köpfe** und **FTE**.

**Nicht angefasst:** freie Notizen wie „Rente 2027" im Bemerkungsfeld. Das ist
selbst geschriebener Text mit echter Information (wann jemand ausscheidet) —
den löscht die App nicht ungefragt. Bei Bedarf lässt er sich je Person im
Trainer-Dialog entfernen.

## [1.22.1] – 2026-07-25

- **Termine lassen sich wieder löschen.** Ein einmal gesetzter Zieltermin war
  auf dem iPad nicht mehr wegzubekommen: `<input type="date">` bietet in Safari
  auf iOS/iPadOS keinerlei Weg, sich zu leeren – der native Picker hat keinen
  Löschen-Knopf und der Text ist nicht markierbar. Übersehen wurde das, weil
  Chrome am Rechner von sich aus ein kleines ✕ zeichnet.
- **Ein eigenes Feld für alle Datumsangaben** (`DateInput`) mit Löschen-Knopf,
  der nur erscheint, wenn auch etwas zu löschen ist. Alle acht Datumsfelder der
  App laufen jetzt darüber: Zieltermin in Umschulung, Kapazität und
  Trainer-Dialog, die Termine je Planungsschritt, LTC-/TRI-/TRE-Datum und
  „737 bis" bei den Other Pilots.
- Der Knopf ist `type="button"` — als impliziter Submit hätte er im Dialog das
  Fenster geschlossen, statt das Feld zu leeren.
- Abgesichert in `test/browser/dates.test.mjs`: Datum setzen, löschen, prüfen
  dass es auch nach dem Neuladen leer bleibt, und dass **kein** blankes
  Datumsfeld mehr irgendwo in der App steht.

## [1.22.0] – 2026-07-25

- **Neu: Umschulungs-Ziele (Soll).** Unter *Kapazität* lässt sich je Monat
  festlegen, wie viele bis Ende dieses Monats auf der 737 freigegeben sein
  sollen. Bewusst eine schlichte Liste statt eines Plans je Person: die Frage,
  die sie beantwortet, ist die nach dem *Tempo* – und ein Ziel, das sich nicht
  in einer Zahl sagen lässt, ist keins.
- **Neu im Dashboard: „Soll gegen Ist" mit Ampel.** Grün = Ziel erreicht,
  Gelb = bis zu einem Zehntel des Ziels hinterher, Rot = darüber. Der Spielraum
  ist **nicht** eine feste Personenzahl: eine Person Rückstand auf ein Ziel von
  3 ist etwas völlig anderes als eine auf 40. Deshalb ein Zehntel, aber nie
  weniger als eine Person – sonst würde ein Ziel von 5 schon rot, wenn ein
  Checkflug um eine Woche rutscht.
- **Gemessen wird gegen das zuletzt *fällige* Ziel**, nicht gegen das
  nächstgelegene. Sonst verschwände ein verpasstes Oktober-Ziel im November aus
  dem Blick – genau dann, wenn es am meisten zählt.
- Die Kachel nennt außerdem das nächste Ziel und beschriftet einen Vorsprung
  als Vorsprung (ein „Rückstand −2" wäre ein Rätsel).
- **Soll-Linie im Verlaufsdiagramm.** Je Monat eine gestrichelte Linie auf der
  Höhe des damals geltenden Ziels: sie bleibt zwischen zwei Zielen flach und
  springt beim nächsten hoch. Vor dem ersten Ziel wird **keine** Linie gezogen –
  eine Linie auf 0 läse sich als „das Ziel war null".
- Eine Linie, keine vierte Reihe im Stapel: das Soll ist nicht Teil der
  Population, sondern die Höhe, die der dunkle Block erreichen soll.
- **In `MERGE_LISTS` eingetragen.** Ziele werden von Hand getippt, also ist der
  Normalfall, dass zwei Geräte *verschiedene* Monate planen – beide müssen
  überleben. Derselbe Monat zweimal bearbeitet: der neuere gewinnt.

## [1.21.0] – 2026-07-25

- **Neu: „Fortschritt je Monat" im Dashboard.** Bisher zeigte die App nur den
  Ist-Stand – wie viele freigegeben, wie viele in Umschulung. Das beantwortet
  „wo stehen wir", nie „sind wir schnell genug". Die neue Kachel stellt je
  Monat eine gestapelte Säule: unten freigegeben, darüber in Umschulung, oben
  noch nicht gestartet.
- **Der Verlauf schreibt sich selbst mit.** Beim Start hält die App den Stand
  des laufenden Monats fest und aktualisiert ihn, bis der Monat vorbei ist.
  Geschrieben wird nur, wenn sich eine Zahl geändert hat – sonst würde jeder
  Start einen Datensatz stempeln und in die Cloud schieben.
- **Rückwirkend geht das nicht**, und die Kachel behauptet es auch nicht: im
  Datenbestand steht nirgends, *wann* jemand eine Phase erreicht hat, nur wo er
  heute steht. Solange erst ein Monat vorliegt, erklärt die Kachel das, statt
  eine einzelne Säule wie ein fertiges Diagramm aussehen zu lassen.
- **In `MERGE_LISTS` eingetragen.** Der Verlauf wird je Datensatz zusammen­
  geführt: zwei Geräte, die denselben Monat schreiben, vertragen sich (der
  neuere gewinnt, beide rechnen ohnehin aus derselben zusammengeführten
  Trainer-Liste), und ein Monat, den nur ein Gerät gesehen hat, überlebt.
- **Farben:** die drei Reihen sind eine *Progression*, keine Identitäten, also
  eine Farbe hell → dunkel (freigegeben am dunkelsten, unten in der Säule, wo
  sie wächst). Statusfarben bleiben reserviert und tauchen hier nicht auf.
- **„Aktiv (ohne Rente)" ist zurück** – als dritte Zahl im Übersichts-Band, wo
  sie neben Köpfen und FTE hingehört. Sie war mit den Kacheln in 1.20.0
  entfallen.
- **Der Deploy testet jetzt vor dem Bauen.** Der Workflow baute und
  veröffentlichte bei jedem Push, ohne `npm test` auszuführen – eine kaputte
  Zusammenführungs- oder FTE-Logik wäre live gegangen. Die Logik-Tests laufen
  in Sekunden und stehen jetzt vor dem Build.

## [1.20.0] – 2026-07-25

- **Dashboard-Übersicht entrümpelt.** Sieben der acht KPI-Kacheln sagten nur,
  was die Diagramme direkt darunter ohnehin zeigen: Prüfer/Instruktoren je
  Qualifikation stehen im Balkendiagramm „Trainer-Qualifikation", Captain und
  First Officer im Ring daneben. Die Kacheln sind weg.
- **Ein Übersichts-Band statt der Kachel-Reihe.** Es trägt genau die beiden
  Zahlen, die sonst nirgends auf der Seite stehen: **Köpfe gesamt** und
  **FTE (ohne Rente)**, nebeneinander mit feiner Trennlinie, auf sehr schmalen
  Bildschirmen gestapelt. Kein einzelnes verlorenes Kärtchen in einem leeren
  Raster.
- Das Band ist bewusst **keine** verschiebbare Anordnungs-Zone mehr – ein
  einzelnes Element hat nichts zu sortieren. Eine gespeicherte Reihenfolge der
  alten Kacheln wird schlicht ignoriert, die Diagramm-Zonen bleiben anordenbar.
- **PDF zieht mit.** Die Übersichts-Tabelle im Dashboard-PDF nennt nur noch
  Köpfe und FTE; Qualifikations- und Captain/FO-Tabellen im selben PDF tragen
  die entfallenen Zeilen weiter.
- Aufgeräumt: neun verwaiste Wörterbuch-Einträge der alten Kacheln entfernt.

## [1.19.4] – 2026-07-25

- **FTE-Summen stimmen wieder überall überein.** Dieselben Personen erschienen
  je nach Kachel als 42,8, 42,9 oder 43. Dahinter steckten vier unabhängige
  Ursachen, alle vier sind behoben.
- **Reihenfolge der Addition.** Der Bestand ergibt exakt **42,85** und liegt
  damit genau auf der Rundungsgrenze. Person für Person addiert kommt ein
  Computer auf `42,849999999999994`, Base für Base auf `42,85` – das eine rundet
  auf 42,8 ab, das andere auf 42,9 auf. Die App hat an verschiedenen Stellen
  beides gemacht. Gerechnet wird jetzt durchgehend in ganzen Hundertsteln, und
  die Rundung auf eine Nachkommastelle passiert genau einmal am Schluss.
- **Drei Personenkreise, ein Wort.** „FTE" stand für alle 50 Personen (44,7),
  für alle ohne Rente (42,9) und für den Umschulungs-Pool. Das sind drei
  richtige Zahlen, aber nebeneinander ohne Beschriftung liest sich das als
  Widerspruch. Jede FTE-Zahl trägt jetzt ihren Bezug; die Kachel oben zeigt
  bewusst den Stand **ohne Rente**, weil jede andere FTE-Zahl der App das auch
  tut.
- **Legende addierte gerundete Zeilen.** Die Kachel „Köpfe vs. FTE je Base"
  hat für ihre Gesamtsumme die schon auf eine Stelle gerundeten Zeilen noch
  einmal zusammengezählt – fünf Zeilen mal bis zu 0,05 Abweichung ergaben 43
  statt 42,9. `NestedBars` nimmt jetzt die echte Gesamtsumme entgegen, statt sie
  aus der Anzeige zurückzurechnen.
- **Eine Zeile, die ihre eigene Subtraktion nicht bestand.** In der
  Kapazitäts-Tabelle wurde jede Spalte für sich gerundet, dadurch konnte
  „verfügbar" um 0,1 neben „FTE gesamt minus in Umschulung" liegen (0,05 gesamt
  und 0,04 in Umschulung erschienen als `0,1 − 0,0 = 0,0`). Die Spalte entsteht
  jetzt aus den *angezeigten* Zahlen; der Preis sind höchstens 0,05 auf dieser
  einen Zelle, die eine Nachkommastelle ohnehin nicht darstellt.
- **PDF und Umschulungs-Board.** Im PDF stand unter „FTE Gesamt" die Summe
  *inklusive* Rente, also eine größere Zahl als auf demselben Dashboard. Dort
  und im Board wurden Zahlen außerdem roh ausgegeben (`38.9` statt `38,9`),
  während alle anderen durch den Formatierer liefen.
- **Erklärt statt nur korrigiert.** Unter den FTE-Kacheln, auf dem Kapazitäts-
  Reiter und im PDF steht jetzt, wie eine FTE zustande kommt: Summe der
  Personen-FTE, Vollzeit 1,0 · 90 % 0,9 · 80 % 0,8 · 75 % 0,75 …, je Person im
  Trainer-Dialog überschreibbar.
- **Abgesichert.** `test/fte.test.mjs` prüft, dass Gruppierung nach Base,
  Aircraft und Qualifikation dieselbe Summe ergibt, dass eine Gesamtzeile zu
  ihren eigenen Spalten passt und dass die Summe nicht von der Reihenfolge
  abhängt. `test/browser/fte.test.mjs` prüft dasselbe an der gerenderten App
  über Dashboard, Kapazität und Board hinweg.

## [1.19.3] – 2026-07-25

- **„Köpfe vs. FTE" im Eurowings-Stil.** Das Violett aus 1.19.1 war die einzige
  Nicht-Marken-Farbe auf dem Dashboard und stach entsprechend heraus. Es kam
  nur zustande, weil Burgunder und Sky auf derselben Seite schon A320 und B737
  bedeuten und eine zweite Serienfarbe damit als Zeilen-Identität lesbar gewesen
  wäre.
- **Gelöst durch die Form statt durch die Farbe:** statt zweier Balken
  nebeneinander steckt der FTE-Balken jetzt **im** Köpfe-Balken. Das ist die
  tatsächliche Beziehung – FTE kann Köpfe nie übersteigen –, der helle Rest ist
  unmittelbar der Teilzeit-Anteil, und je Zeile gibt es nur noch **eine**
  farbige Marke. Damit ist keine Verwechslung mit A320/B737 mehr möglich und die
  Kachel darf die Markenfarbe tragen.
- Das helle Band ist bewusst schwach gesättigt: ein satteres Hell-Burgunder läge
  ΔE 2,2 von der Phasen-Rampe entfernt, also praktisch auf derselben Farbe. So
  sind es 6,3 (hell) bzw. 11,1 (dunkel), und es hält die 2:1, die ein helles
  Rampenende braucht.
- Angeglichen an die übrigen Kacheln: „Gesamt" in der Überschrift, dieselbe
  Balkenhöhe wie die anderen Balkendiagramme, dieselbe Zahlendarstellung.
- Der Balken wird gedeckelt, falls jemand von Hand eine FTE über 1 einträgt –
  gezeichnet wird höchstens die volle Breite, die ausgewiesene Zahl bleibt die
  echte.

## [1.19.2] – 2026-07-25

Die beiden Punkte, die in 1.19.1 offen geblieben waren:

- **Dashboard-PDF: eine Seite, solange das lesbar ist.** Bisher wurde die
  gesamte Aufnahme ohne Untergrenze auf eine A4-Seite skaliert – jede zusätzliche
  Kachel machte den ganzen Ausdruck kleiner, unbegrenzt. Jetzt gilt eine
  Lesbarkeitsgrenze: Solange die Einseiten-Darstellung mindestens 75 % der
  Größe erreicht, die die Seitenbreite allein zuließe, bleibt es bei einer Seite
  (die Absicht aus 1.10.1). Darunter wird in voller Breite gedruckt und auf der
  nächsten Seite fortgesetzt. Geprüft: das heutige Dashboard ergibt weiterhin
  **eine** Seite, ein künstlich sehr hohes ergibt zwei. Der Seitenumbruch fällt
  dorthin, wo die Seite endet – die Aufnahme ist ein Bild, Kartengrenzen sind
  darin nicht mehr bekannt.
- **Die Balken-Regeln der neuen Diagramme waren eine wortgleiche Kopie** der
  vorhandenen, nur mit anderer Höhe. Sie teilen sich jetzt eine Grundlage; nur
  die Höhe wird überschrieben.

## [1.19.1] – 2026-07-25

Ergebnis zweier Code-Reviews von 1.19.0. Drei Punkte davon waren Behauptungen im
Changelog, die so nicht stimmten:

- **Das Zahnrad hatte keinen sichtbaren Aktiv-Zustand.** Die Klasse wurde
  gesetzt, aber es gab keine passende CSS-Regel – 1.19.0 behauptete das
  Gegenteil. Jetzt dieselbe weiße Behandlung wie beim aktiven Sprach-Chip.
  Gleiches Loch beim Speichern-Knopf: `save-error` war nie gestylt, ein
  fehlgeschlagenes Speichern sah aus wie ein erfolgreiches.
- **Die Kürzung der Anmerkungs-Spalte funktionierte nicht** – schlimmer, sie
  wirkte verkehrt herum. Eine Breitenbegrenzung greift auf einer Tabellenzelle
  im automatischen Layout nicht, `nowrap` dagegen schon, also *verbreiterte* ein
  langer Text die Spalte statt abgeschnitten zu werden. Jetzt bricht die
  Anmerkung um. Nebenbei traf die Regel auch „Ausstellende Behörde" – ohne
  Tooltip, also unlesbar; diese Spalte ist jetzt ausgenommen.
- **Zahlengleichheit war behauptet, aber nicht gegeben.** Das Dashboard schrieb
  „42,9", die Kapazität „42.9". Der Formatierer liegt jetzt in `format.js` und
  wird von beiden benutzt.

Weitere Befunde:

- **Irreführende Farben** bei „Köpfe vs. FTE je Aircraft": die Reihen trugen
  `CATEGORICAL[0]`/`[1]`, also genau die Farben, die auf demselben Dashboard
  A320 und B737 bedeuten – in einem Diagramm, dessen Zeilen A320 und B737 sind.
  Köpfe und FTE sind ohnehin **eine** Größe, zweimal gezählt, also jetzt ein
  ordinales Paar (ein Ton, zwei Stufen, Violett – auf diesem Dashboard frei).
- **Eine Null zeichnete einen Balken.** `.gbar-fill` hat 3 px Mindestbreite, die
  bewusst mitgeführte B737-Zeile stand also mit farbigem Strich bei 0 da.
- **Zwei Base-Diagramme, zwei Reihenfolgen.** `byBase` sortiert nach
  `BASE_ORDER`, `capacityByBase` alphabetisch – nebeneinander verglich man
  Zeile 1 gegen Zeile 1 und damit verschiedene Bases.
- **Rechtsbündige Zahlen-Überschriften** verrutschten, weil `.th-inner` von
  `inline-flex` auf `flex` gesetzt worden war.
- `capacityBy*` läuft im Dashboard jetzt memoisiert (wie im Reiter Kapazität).
- Die Kopfzeile darf umbrechen; mit vier Symbolen wäre auf einem 320-px-Gerät
  sonst eines über den Rand gerutscht.
- Aufräumen: der Reiter-Nav leitet das Symbol aus dem Tab-Datensatz ab statt die
  Id `'settings'` fest zu kennen; eine Legende statt vier Kopien; tote Regeln
  des entfernten Untertitels entfernt; der `.gbars`-Block stand unter dem
  Kommentar, der die *gestapelten* Balken beschreibt.

Nicht geändert: das Dashboard-PDF skaliert weiterhin alles auf **eine** Seite,
zwei Kacheln mehr machen den Ausdruck also etwas kleiner. Das ist die bewusste
Entscheidung aus 1.10.1.

## [1.19.0] – 2026-07-25

- **Dashboard: Köpfe vs. FTE**, je Base und je Aircraft. Zwei Balken je Zeile auf
  **einer** Achse – gruppiert, nicht gestapelt, denn „Köpfe + FTE" wäre eine
  Summe ohne Bedeutung. Der Abstand zwischen den Balken ist der Teilzeit-Anteil.
  Die Zahlen stammen aus derselben Quelle wie der Reiter Kapazität
  (`capacityByBase` / `capacityByAircraft`), Rente ist ausgenommen; geprüft, dass
  die Summe auf beiden Seiten übereinstimmt.
- **Untertitel in der Kopfzeile entfernt** („Boeing 737 MAX Phase-In · …").
- **Einstellungen als Zahnrad** statt als Reiter, direkt neben DE/EN; danach
  Neu laden, Speichern, Dunkelmodus. Der Knopf zeigt den aktiven Zustand und
  meldet ihn per `aria-current` an Screenreader.
- **Trainer-Tabelle schmäler: 1403 px → 1234 px**, passt damit ohne seitliches
  Scrollen in die Inhaltsspalte. Die Breite kam nicht von den Daten, sondern von
  den Überschriften: `th` ist standardmäßig `nowrap`, also stand über einer
  Zelle mit „Austria" eine 181 px breite Spalte „AUSSTELLENDE BEHÖRDE". Jetzt
  dürfen die Überschriften umbrechen (zwei Zeilen Kopfhöhe statt 170 px Breite),
  dazu engere Zellen und ein Deckel für die freie Anmerkung. Auf schmalen
  Bildschirmen scrollt die Tabelle weiterhin, statt gequetscht zu werden – auch
  das ist geprüft. Die anderen Tabellen sind unverändert.

## [1.18.2] – 2026-07-25

Ergebnis eines Code-Reviews des 1.18.1-Patches. Der erste Punkt ist ein Fehler,
den **1.18.1 selbst eingeschleppt** hat:

- **Regression aus 1.18.1:** `sync()` las den lokalen Stand *vor* `await pull()`.
  Eine Änderung während des Ladens (auf dem Handy leicht eine knappe Sekunde)
  fiel damit aus der Zusammenführung und wurde anschließend von
  `applyRemote(merged)` überschrieben – und galt danach als übertragen, ging
  also endgültig verloren. Jetzt wird der Store **nach** dem Laden gelesen; ein
  verlorener Versuch trägt sein Zwischenergebnis in die Wiederholung, statt es
  als Ausgangsstand zu ersetzen.
- **Falsches „Synchron".** Verloren beide Versuche das Wettrennen, fiel die
  Schleife durch und meldete trotzdem Erfolg samt frischer Uhrzeit, obwohl kein
  Byte den Server erreicht hatte. Jetzt eine klare Meldung.
- **Schließen-Schreibvorgang gegen laufenden Abgleich.** `flush()` prüfte den
  `busy`-Riegel nicht, konnte also mitten in einen Abgleich schreiben, dessen
  Compare-and-Swap entwerten und die einzige Wiederholung verbrauchen.
- **Wiederholtes Hochladen bei jedem Wegschalten.** Ohne jede Buchführung wurde
  bei jedem Tab-Wechsel der komplette Bestand erneut gesendet – nach dem ersten
  erfolgreichen Schreibvorgang zwangsläufig abgelehnt. Jetzt wird der versuchte
  Stand vermerkt (ausdrücklich **kein** Erfolgsnachweis).
- **`keepalive`-Grenze in Bytes statt Zeichen.** `body.length` zählt UTF-16-
  Einheiten, die 64-KiB-Grenze gilt für Bytes. Bei deutschen Texten (Umlaute, ß)
  wurde eine zu große Anfrage als zulässig markiert, vom Browser abgelehnt und
  vom `.catch` verschluckt. Jetzt `TextEncoder`.
- **Erster Eintrag: `insert` statt `upsert`.** Melden sich zwei Geräte
  gleichzeitig an, überschrieb das zweite die Zeile des ersten komplett. Jetzt
  gewinnt der Ersteller, der Verlierer erhält 23505 und geht den normalen
  Zusammenführungsweg.
- **`push()` aufgeteilt** in `pushCas()` (Vergleichswert **zwingend**) und
  `createRow()`. Vorher hätte ein leerer Wert stillschweigend auf das
  bedingungslose Überschreiben zurückgeschaltet – genau das, was der Patch
  beseitigen sollte. Eine getroffene Zeile ohne Zeitstempel zählt jetzt als
  Fehlschlag statt als Erfolg mit `undefined`.
- Beide Schreibwege benennen die Vergleichsspalte über **eine** Konstante,
  damit die postgrest-Variante und die handgebaute Abfrage nicht auseinander
  driften; `stable()` wird je Runde einmal weniger über den Gesamtbestand
  gerechnet.
- **Der in 1.18.1 behauptete Test existierte nicht.** Er lag außerhalb des
  Repositories – die Behauptung im Changelog war damit falsch. Jetzt liegt er
  hier: `npm test` (ohne Abhängigkeiten) prüft die Zusammenführung in 30 Fällen
  und stellt sicher, dass **jede** Liste im Datenbestand in `MERGE_LISTS` steht.
  Gegengeprüft: entfernt man eine Liste, schlägt der Test fehl.

Außerdem:

- **Überschrift ohne „737"** – nur noch „Trainer & Prüfer Monitoring". Das Logo
  behält seines.
- **Changelog aufklappbar**: eine Zeile je Version mit Nummer und Datum,
  Details auf Klick. Umgesetzt mit `<details>`/`<summary>`, also auch per
  Tastatur und Screenreader bedienbar und von der Seitensuche auffindbar.

## [1.18.1] – 2026-07-25

**Datenverlust zwischen Geräten behoben.** Gemeldet als „auf einem anderen Gerät
bei der Umschulung geändert, kommt hier nicht an" – und genau so war es:

- `pushOnUnload` war ein **bedingungsloses Upsert**. Beim Schließen bzw.
  Wegwischen schrieb ein Gerät seinen kompletten Stand über die Zeile, ohne zu
  lesen oder zusammenzuführen. Hatte ein anderes Gerät kurz zuvor etwas
  hochgeladen, war das damit weg. Die Zusammenführung je Datensatz aus 1.17.0
  greift auf diesem Weg gar nicht, weil nie gelesen wird.
- Jetzt ein **Compare-and-Swap**: `PATCH … &updated_at=eq.<zuletzt gesehen>`
  trifft keine Zeile mehr, sobald ein anderes Gerät geschrieben hat – der
  Schreibvorgang entfällt dann einfach. Die Änderungen bleiben lokal und werden
  beim nächsten Öffnen normal zusammengeführt.
  (`encodeURIComponent` ist dabei zwingend: der Zeitstempel endet auf `+00:00`,
  und ein rohes `+` im Query-String wird als Leerzeichen gelesen.)
- Ohne bekannten Server-Zeitstempel wird beim Schließen **gar nicht** mehr
  geschrieben – ein Schreibvorgang wäre dort zwangsläufig blind.
- Der Ausgang wird **nicht mehr als „übertragen" verbucht**. Vorher setzte der
  Schließen-Pfad `pushedAt`, obwohl er das Ergebnis nicht abwarten kann: schlug
  die Anfrage fehl, hielt die App die Änderungen für gesendet und schickte sie
  nie wieder.
- Dasselbe Loch, kleiner, im normalen Push: zwischen `pull` und `push` konnte
  ein anderes Gerät schreiben und wurde überschrieben. Auch dieser Weg ist jetzt
  ein Compare-and-Swap; verliert er, wird neu gelesen und erneut zusammengeführt
  (eine Wiederholung), statt den eigenen Stand durchzudrücken.
- Neuer Test gegen die eigentliche Frage „greift der Sync überall": jede Liste
  im Datenbestand muss in `MERGE_LISTS` stehen. Eine künftig vergessene Liste
  fiele sonst still auf „ganzer Bestand, neuerer gewinnt" zurück. Aktuell: 9 von
  9 Listen erfasst, Umschulungs-Status und Planung liegen im Trainer-Datensatz
  und reisen mit ihm.

## [1.18.0] – 2026-07-25

Die Farbgebung war gewachsen, nicht entworfen. Gemessen (OKLab-ΔE, WCAG) statt
geschätzt – die alte Palette fiel durch, und zwar sichtbar:

- **Vier Burgunder-Töne machten Kategorie-Arbeit.** `#701745` und `#871C54`
  trennten sich um ΔE 5,6 bei voller Farbsicht, `#D41370` und `#AF1E65` um 7,5 –
  und die beiden lagen im Umschulungs-Board direkt nebeneinander. Ab 15 gilt ein
  Paar als unterscheidbar.
- **Statusfarben liefen zugleich als Serienfarben.** Grün war „TKI", „im Plan",
  „freigegeben", „Provider in use" und „Rating gültig"; Amber war „gefährdet"
  und „extern". Jetzt sind Grün/Amber/Rot reserviert.
- **Weiße Schrift auf hellen Füllungen.** Amber trug weiße 11-px-Schrift bei
  **2,16:1** (nötig: 4,5:1). Marken sind jetzt getönte Flächen mit farbiger
  Schrift – das trägt für jeden Farbton, auch selbst gewählte.
- **Neue Palette**, hell und dunkel getrennt gestuft und beide bestanden:
  kategorial 8 Plätze (hell ΔE 12,6 / 22,2 · dunkel 9,8 / 17,9, alle ≥ 3:1),
  Phasen als Ein-Ton-Rampe (monoton, jede Stufe ≥ 0,06 L).
- **Phasen sind ordinal**, keine sechs Namen: eine Farbe von hell nach dunkel,
  der Fortschritt ist damit ablesbar.
- **Einreihige Balken einfarbig** (Base, Behörde, Part-Time, Qualifikation) –
  die Länge trägt den Vergleich, die Farbe hätte ihn nur verdoppelt.
- **Kachel-Akzente nach Bedeutung**: Übersichtszahlen einheitlich Burgunder,
  Umschulungs-Zustände in Statusfarben, Captain/FO in ihren Serienfarben.
- Farben kommen jetzt aus **einer** Quelle (`src/lib/palette.js`); `brand.js`
  hielt eine zweite Kopie mit der Bitte, sie „von Hand synchron zu halten".
- Einmalige Umstellung bestehender Daten: nur Einträge, die noch ihre alte
  Standardfarbe tragen, werden umgestellt – selbst gewählte bleiben.

## [1.17.0] – 2026-07-25

- **Abgleich je Datensatz statt „ganzer Bestand gewinnt".** Bisher ersetzte der
  Sync den kompletten Datenbestand, ein Gerät verlor also immer alles, was es
  geändert hatte, während das andere vorne lag. Jetzt trägt jeder Trainer,
  Pilot, Provider, jede Phase, Berechtigung, Planungsspalte, jeder Kurs, Status
  und jede SIM-Version einen eigenen Änderungszeitpunkt (`_at`), und beim
  Abgleich wird die Vereinigung beider Seiten gebildet – je Eintrag gewinnt die
  neuere Fassung. **Änderungen an verschiedenen Personen auf verschiedenen
  Geräten überleben damit alle.**
- **Löschungen mit Grabstein.** Ein gelöschter Eintrag wird in `_tomb` vermerkt,
  damit ein Gerät, das ihn noch hat, ihn beim nächsten Abgleich nicht wieder
  einschleppt. Wird derselbe Eintrag später woanders bearbeitet, gewinnt die
  Bearbeitung. Grabsteine verfallen nach 180 Tagen.
- **Push beim Schließen.** `pagehide` und `visibilitychange` schicken den Stand
  per `fetch(keepalive)` noch raus, wenn die Seite schon geht. Über der
  64-KiB-Grenze von `keepalive` fällt es auf eine normale Anfrage zurück.
- Die Stempel entstehen an genau einer Stelle: der Store vergleicht in `patch()`
  vorher/nachher und stempelt nur, was sich wirklich geändert hat – ein Speichern
  ohne Änderung gewinnt daher keinen späteren Abgleich.
- Bestandsdaten ohne Stempel (auch aus Excel-/JSON-Import) erben den Zeitpunkt
  des Gesamtbestands, nicht „jetzt" – sonst würde ein veraltetes Gerät allein
  durch spätes Öffnen jeden Abgleich gewinnen.
- Die Sicherungs-/Wiederherstellen-Schaltfläche aus 1.16.0 entfällt ersatzlos;
  sie war die Notlösung für das Überschreiben des Gesamtbestands.

## [1.16.0] – 2026-07-25

- **Automatischer Sync alle 2 Minuten.** Zusätzlich beim Start, beim
  Zurückwechseln zur App (Handy/Tablet frieren Timer im Hintergrund ein) und
  rund 2 Sekunden nach jeder Änderung.
- **Die Cloud gewinnt immer.** Weicht der Server-Stand ab, wird er übernommen –
  ohne Rückfrage. Der Zustand „Konflikt" und die Auswahl „Dieses Gerät behalten /
  Cloud-Stand übernehmen" entfallen.
- **Sicherung statt Datenverlust.** Waren auf diesem Gerät noch nicht
  übertragene Änderungen offen, wird der lokale Stand vor dem Überschreiben
  weggeschrieben. Die Sync-Karte in den Einstellungen zeigt dann
  „Gesicherten Stand zurückholen" (mit Zeitpunkt); der Klick stellt ihn wieder
  her und schiebt ihn als neuen Stand in die Cloud.
- Hinweis zur Mehrgeräte-Nutzung: der Datensatz wird als Ganzes ersetzt, nicht
  je Datensatz zusammengeführt. Wer offline auf zwei Geräten arbeitet, sollte
  vor dem Bearbeiten den grünen Punkt abwarten.

## [1.15.6] – 2026-07-25

- **Umschulung: schmälere Kacheln.** Die Spalten hatten keine Obergrenze und
  zogen sich über die volle Bildschirmbreite, wodurch jede Karte viel breiter
  war als ihr Inhalt. Jetzt max. **200 px** (Handy 168 px), der Rest scrollt
  seitwärts. Innenabstände, Marken und die ‹ ›-Knöpfe wurden mitverkleinert,
  damit die Karten nicht höher werden – geprüft: keine Karte läuft über, die
  Verschiebe-Knöpfe bleiben tippbar (26 × 23 px), und das gleiche `.mini-btn`
  in den Listen-Editoren behält seine Originalgröße (30 × 26 px).

## [1.15.5] – 2026-07-25

- **Keine stumme weiße Seite mehr.** Lädt die App nicht (z. B. weil der Browser
  noch eine `index.html` aus einem älteren Deployment im Cache hat, die auf
  inzwischen gelöschte Dateien zeigt), erschien bisher ein leeres weißes
  Fenster ohne jeden Hinweis. Jetzt blendet sich nach 6 Sekunden ein Hinweis
  mit der Neulade-Anleitung ein — bewusst mit eingebettetem CSS, damit er auch
  dann erscheint, wenn ebenfalls das Stylesheet nicht geladen wurde. Startet
  die App normal, ist der Hinweis nie zu sehen.

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
