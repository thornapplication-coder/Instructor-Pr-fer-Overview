# Changelog

Alle nennenswerten Änderungen dieses Projekts. Versionierung nach
[SemVer](https://semver.org/lang/de/): Jeder Push ist eine neue Version,
beginnend bei `1.0.0`.

- **MAJOR** (`x.0.0`): große Umbauten / grundlegende Änderungen
- **MINOR** (`1.x.0`): neue Funktionen / neue Reiter
- **PATCH** (`1.0.x`): Fehlerbehebungen, kleine Anpassungen, Datenpflege

Die Version ist zusätzlich in der App unter **Einstellungen → Version & Changelog**
sichtbar. Bei einem neuen Deploy erscheint automatisch ein **Update-Popup**.

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
