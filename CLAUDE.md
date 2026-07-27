# 737 TRAINER – Arbeitsnotizen

Steuerung des A320 → B737-MAX-Phase-In für Instruktoren und Prüfer bei
Eurowings. React/Vite-PWA, offline-fähig, mit optionalem Cloud-Sync.

**Sprache:** Der Nutzer (Patrick Thorn) schreibt und liest Deutsch. Antworten,
Changelog-Einträge und Oberflächentexte auf Deutsch; Quelltext-Kommentare und
Commit-Nachrichten auf Englisch.

## Wo was liegt

| Pfad | Inhalt |
|---|---|
| `src/lib/store.jsx` | Zustand, `normalize()`, `patch()`, alle Migrationen. Der einzige Ort, an dem Daten hineinkommen. |
| `src/lib/merge.js` | Zusammenführung je Datensatz für den Sync (`stampChanges`, `mergeBlobs`, `stable`). |
| `src/lib/cloudSync.js` | Sync-Ablauf: wann abgeglichen wird, Wiederholungen, Zustände. |
| `src/lib/supabaseSync.js` | Supabase-Aufrufe (`pull`, `pushCas`, `createRow`, `pushOnUnload`). |
| `src/lib/palette.js` | **Alle** Farben. Nirgends sonst ein Hex-Wert für Daten. |
| `src/lib/courses.js` | Kurstermine: Zeitraum je Kurs, Auflösung Person↔Kurs (`resolveAssignment`), Plätze, Überschneidungen. |
| `src/lib/i18n.js` | DE/EN, ein flaches Wörterbuch. |
| `src/data/*.js` | Startdaten und Kategorien (Phasen, Berechtigungen, Provider, Piloten). |
| `src/tabs/*.jsx` | Je Reiter eine Datei. `ConversionHub.jsx` fasst Board, Planung und Kalender unter einem Reiter zusammen. |
| `src/components/sortable.jsx` | `useSort`, `Th` (Spaltenkopf) und `SortSelect` (die Sortierung in der Kartenansicht). |
| `src/version.js` | Version **und** Changelog (wird in den Einstellungen angezeigt). |
| `test/` | `npm test` – Zusammenführung, Abdeckungs-Wächter, FTE, Verlauf. Reines Node. |
| `test/browser/` | `npm run test:browser` – Playwright gegen den echten Build. |

## Befehle

```bash
npm run dev            # Entwicklung
npm test               # Logik: Zusammenführung + Abdeckungs-Wächter (Sekunden)
npm run build          # muss vor jedem Commit durchlaufen
npm run test:browser   # nach dem Build: echter Browser, dauert einige Minuten
npm run preview -- --port 4329
```

**Ein Bezeichner ohne Import ist kein Build-Fehler.** Rollup löst Module auf,
keine freien Variablen — `npm run build` bleibt grün und die App stirbt weiß auf
genau dem Reiter, der ihn benutzt. `test/imports.test.mjs` fängt das in einer
Sekunde ab; zweimal an einem Tag hat es sonst erst der Browser-Lauf gefunden.

`npm run test:browser` startet die Vorschau selbst und fährt sie wieder herunter.
Es prüft die Dinge, die es erst gerendert gibt: Kopfzeile und Zahnrad, Breite der
Trainer-Tabelle, die Kacheln, Stempel und Grabsteine im Speicher, Farben im
Dunkelmodus, Kartenbreiten im Board und die Seitenzahl des Dashboard-PDF.

Playwright ist **keine** Abhängigkeit des Projekts — fehlt es, meldet der Lauf
das und endet mit Erfolg, statt einen sonst gesunden Checkout rot zu färben. In
dieser Sandbox liegt es unter `/opt/node22/lib/node_modules/playwright`.

Der Lauf braucht mehrere Minuten (zwei PDF-Exporte, viele Neuladungen) — im
Zweifel im Hintergrund starten. Aufräumen mit `fuser -k <port>/tcp`; **nie**
`pkill` in einer verketteten Zeile, das trifft auch den eigenen Prozess.

## Tabellen werden auf schmalen Schirmen zu Karten

Sieben Tabellen klappen unterhalb einer gemessenen Breite in Karten um: eine
Zeile wird ein Block, die Kopfzeile verschwindet, und jede Zelle zeichnet ihre
eigene Überschrift aus `data-label`.

**Die Breite wird gemessen, nicht geraten.** Jede Tabelle hört bei einer
anderen Breite auf zu passen, und zweimal hat eine geschätzte Grenze genau die
Geräte verfehlt, für die sie gedacht war. Vorgehen: die Kartenregeln im Browser
abschalten, `wrap.scrollWidth` gegen `wrap.clientWidth` messen, *dann* die
Grenze wählen. Gemessen (mit echten Daten, leere Tabellen messen zu schmal):

| Tabelle | braucht | Umschaltpunkt | Markierungsklasse |
|---|---|---|---|
| `pilots-table`, `provider-table`, `provider-cap-table`, `planning-table`, `cap-table`, `edit-table` | 966 / 724 / – / 888 / 745 / 664 px | **1000 px** | `card-at-1000` |
| `trainer-table` | 1234 px | **1280 px** | `card-at-1280` |
| `course-table` | 818 px (im Dialog) | **900 px** | `card-at-900` |

Das Gerüst steht **einmal je Umschaltpunkt** in `styles.css` (Abschnitt
„Table → card"), die Rasterdefinition je Tabelle darunter. Die drei Gerüste
sind absichtlich identisch und werden auseinander erzeugt — als sie von Hand
kopiert waren, sind sie gedriftet (Kartenabstand 11 vs. 12 px).

**Regeln, die dabei wehgetan haben:**

- **`screen and` gehört an jede dieser Media-Queries.** A4 hochkant ist ~794 px,
  also innerhalb jedes Umschaltpunkts — ohne das druckt Strg+P Karten ohne
  Spaltenüberschriften. Der PDF-Export merkt es nicht, der baut eigene Tabellen.
- **Geteilte Regeln gehören in den Block ihres eigenen Umschaltpunkts.** Eine
  Regel für alle Karten in *einem* 1280-px-Block traf auch die 1000-px-Tabellen
  in der Spanne dazwischen, wo die noch echte Tabellen sind: die Piloten-Liste
  brauchte dadurch bei 1024 px 5 px zu viel.
- **Ein Chip mit `white-space: nowrap` und `justify-self: end` läuft nach
  LINKS über.** Selbst benannte Status sind beliebig lang; ohne `max-width` und
  Umbruch malt der Chip über den Namen daneben. Rechtskanten-Messungen sehen
  das nicht.
- **Eine automatisch breite Spur nimmt ihre Breite vom längsten Inhalt** und
  stiehlt sie den Feldüberschriften eine Zeile tiefer. Feste Spuren oder
  gleiche Hälften.
- **Leere Liste braucht ein „–".** Die Kartenüberschrift wird immer gezeichnet;
  ohne Rückfall steht sie über nichts.
- **Ab 521 px eine Tablet-Stufe.** Bruchteilige Spalten verteilen dort den
  ganzen Platz und reißen Wert und Überschrift auseinander. Dreimal derselbe
  Fund, dreimal dieselbe Antwort: feste Spurbreiten, Rest in eine leere Spur.
- **Sortieren verschwindet mit der Kopfzeile.** `useSort().toggle` ist nur über
  `Th` erreichbar. Jede Karten-Tabelle bekommt deshalb ein `<SortSelect>` mit
  ihrem Umschaltpunkt.

## Regeln, die schon einmal wehgetan haben

**Jeder Push ist eine neue Version.** `src/version.js` (APP_VERSION *und*
CHANGELOG-Eintrag), `CHANGELOG.md`, `package.json`, `package-lock.json` — alle
vier, sonst driften sie auseinander.

**Eine Zusicherung, die nie fehlschlagen kann, ist schlimmer als keine.** Der
Wächter gegen eine abgeschnittene Überschrift las den berechneten
`::before`-Inhalt — den ändert `text-overflow` nie. Er war grün, egal was das
Layout tat. Seither gilt: **jede neue Zusicherung wird gegengeprüft**, indem die
Behebung im Browser rückgängig gemacht wird (`page.addStyleTag`) und der Wert
sich messbar bewegen muss. Ebenso: ein Test, der auf leeren Daten läuft, meldet
Erfolg für etwas, das es nicht gibt — erst prüfen, dass eine Zeile da ist.

**Farben kommen aus `palette.js`.** Kategorien = Identität, Statusfarben
(grün/amber/rot) sind reserviert und nie Serienfarbe, Phasen sind *ordinal*
(eine Farbe hell → dunkel). Hell und dunkel haben eigene Stufen. Geprüft mit dem
Validator der `dataviz`-Skill; Einzelreihen-Balkendiagramme sind einfarbig.

**Sync-Schreibvorgänge sind immer bedingt.** Nie ein blindes `upsert` auf
`app_state` — das hat schon einmal die Änderungen eines anderen Geräts gelöscht.
`pushCas()` verlangt den Vergleichszeitstempel; verliert es, wird neu gelesen
und erneut zusammengeführt. Beim Schließen gilt dasselbe per `PATCH …
&updated_at=eq.<zuletzt gesehen>` (Zeitstempel **muss** URL-kodiert werden, das
`+00:00` würde sonst zum Leerzeichen).

**Im Sync-Ablauf den Store nach dem `pull` lesen, nie davor.** Sonst fällt eine
Änderung, die während des Ladens gemacht wird, aus der Zusammenführung und wird
danach überschrieben.

**Neue Liste im Datenbestand? In `MERGE_LISTS` eintragen.** Sonst fällt sie
still auf „ganzer Bestand, neuerer gewinnt" zurück. `npm test` fängt das ab.

**Stempel entstehen nur in `patch()`** (`stampChanges` vergleicht vorher/nachher).
Kein Aufrufer setzt `_at` selbst.

**`patch()` ist nie „umsonst".** Es setzt `dirtyRef`, hebt `updatedAt` und löst
einen Cloud-Push aus — auch wenn die Mutation dasselbe zurückgibt. Wer aus
einem Effekt heraus patcht, muss **vor** dem Aufruf prüfen, ob sich wirklich
etwas ändert.

**FTE wird in Hundertsteln gerechnet, gerundet wird genau einmal.** Gruppenweise
addiert kann Fließkomma knapp unter einer .x5-Grenze landen und andersherum
runden als Person für Person — dieselben Leute standen dadurch auf zwei Kacheln
mit verschiedenen Summen. Deshalb `sumFte()`/`cents()`/`round1c()` in
`stats.js`, und Gesamtsummen **immer** aus den Rohwerten, nie durch Aufaddieren
schon gerundeter Zeilen (das war die 43 in der Legende von „Köpfe vs. FTE je
Base"; `NestedBars` nimmt jetzt `totals` entgegen). Jede FTE-Zahl auf dem
Bildschirm läuft durch `formatFte1(v, lang)` — roh ausgegeben stand im PDF
„38.9" neben „38,9".

**„FTE" ist ohne Bezugsgruppe mehrdeutig.** Noch zwei Kreise: alle Personen
(`headcount().fte`) und der Umschulungs-Pool (`conversionTrainers()`,
SEN/TRE/TRI/LTC, `fteConvScope`). Die dritte Gruppe („ohne Rente") ist mit der
ORE-Stufe entfallen — **kein** `active`/`fteActive` wieder einführen, das wären
dieselben Zahlen unter zweitem Namen.

**Die ORE-Stufe „Rente" gibt es nicht mehr** (1.23.0). Nichts filtert mehr
danach; wer sie noch trug, hat sie per `_oreNoRente` verloren, ohne dass der
Datensatz angefasst wurde. Freitext-Bemerkungen wie „Rente 2027" bleiben
bewusst stehen — das ist selbst geschriebene Information.

**Migrationen sind durch ein Flag abgesichert** (`_provSeeded`, `_courseSeed2`,
`_provStatus2`, `_qualMerge`, `_roleSeed`, `_palette3`, `_oreNoRente`, `_capNotes`) und
fassen nur an, was noch den alten Standardwert trägt — selbst gewählte Werte
bleiben.

**`vite.config.js` leitet den Basispfad aus `GITHUB_REPOSITORY` ab.** Nicht
wieder fest verdrahten: eine Umbenennung des Repositories hat die App schon
einmal komplett offline genommen.

**Dialoge:** Der Fokus-Effekt in `Modal.jsx` hängt an `onCloseRef`, nicht an
`onClose`. Mit `[onClose]` lief er nach jedem Tastendruck neu — man konnte genau
ein Zeichen tippen.

## Deployment

GitHub Pages, automatisch bei jedem Push auf
`claude/737-instructor-monitoring-dashboard-2ox5gd` (das ist auch der
Standard-Branch). Adresse:
<https://thornapplication-coder.github.io/Instructor-Pr-fer-Overview/>

Der Workflow lässt vor dem Bauen `npm test` laufen — ist der rot, wird nicht
veröffentlicht. Die Browser-Tests laufen dort **nicht** (Playwright ist keine
Abhängigkeit); die bleiben Handarbeit vor dem Push.

Das Repository heißt `Instructor-Pr-fer-Overview`; der lokale Ordner und die
Git-Remote sagen noch `TESTREPO`. Beides ist korrekt, GitHub leitet um.

Kommt nach einem Deploy die alte Fassung: GitHub Pages lässt HTML 10 Minuten im
Browser-Cache. `?v=<version>` an die URL hängen umgeht das.

## Cloud-Sync in Kürze

Ein `jsonb`-Datensatz je Benutzer in `app_state`, abgesichert durch Row Level
Security (`supabase/migrations/0001_app_state.sql`). Projekt und öffentlicher
anon-Key stehen fest in `src/lib/cloudConfig.js` — das ist Absicht und sicher,
siehe Kommentar dort.

Abgeglichen wird beim Start, alle 2 Minuten, beim Zurückwechseln zur App, rund
2 Sekunden nach jeder Änderung und beim Schließen. Zusammengeführt wird je
Datensatz; Löschungen hinterlassen einen Grabstein in `_tomb` (180 Tage).

**Registrierung ist zu** (Stand 25.07.2026): „Allow new users to sign up",
„manual linking" und „anonymous sign-ins" sind in Supabase abgeschaltet,
„Confirm email" ist an. Der anon-Key ist öffentlich, deshalb ist das die
eigentliche Absicherung. Folge: **es lässt sich kein neues Konto mehr
anlegen** — weitere Geräte melden sich mit dem bestehenden Konto an. Ein
zusätzlicher Benutzer geht nur über das Supabase-Dashboard (*Authentication →
Users → Add user*) oder indem die Option kurz wieder eingeschaltet wird.

## Umgebung

Aus dieser Sandbox sind `*.supabase.co` und `*.github.io` durch den Proxy
gesperrt (403). Die laufende Seite lässt sich also nicht selbst abrufen — Zustand
über die GitHub-API prüfen, nicht per `curl` auf die Seite. `cdn.sheetjs.com` ist
ebenfalls gesperrt.

## Offen

Nichts.

Bewusst *nicht* umgestellt: das Umschulungs-Board scrollt am Handy seitwärts —
bei einem Kanban-Board ist das richtig so, die Spalten *sind* die Phasen. Der
Kalender und das Dashboard brauchten nie etwas, beide sind auf allen Breiten
gemessen sauber.
