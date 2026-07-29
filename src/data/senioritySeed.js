// Seniority dates, read from "Seniority_Cockpit_all_bases" (Stand 03.07.2026).
//
// ONLY the people already on the trainer list are in here. The source document
// lists 416 cockpit crew; this map holds the 47 of our 50 that appear in it. It
// is a lookup, not a roster - nothing here ever adds a person, it only fills a
// date that is still empty.
//
// Keyed by TLC, because that is the roster's own human key: the three letters
// are printed on every list, and they survive a record being re-imported under
// a new id. Quoted keys, because a TLC may start with a digit ('1LM') and an
// unquoted one is a syntax error, not a silent mistake. Values are ISO dates,
// like every other date in the app.
//
// Three trainers have no entry: E1H (Essbauer, Horst), BV3 (Beverage, Stefan),
// HMQ (Huesser, Michael). They are not in the source document at all, and are
// deliberately left empty rather than guessed: a wrong seniority date does not
// look wrong, it just sorts into the wrong place.
//
// Two were matched by hand, because the roster and the source spell them
// differently (one letter in a surname, "Joe"/"Jose"). In both cases the base
// and the rank agree and the person is the only holder of that surname in the
// document; test/seniority.test.mjs pins both.
export const SENIORITY_BY_TLC = {
  'HMF': '2016-04-15', // Hammerer, Fritz (Friedrich)
  'HP4': '2018-05-01', // Hennig, Philip Richard
  'M3E': '2017-12-18', // Meidel, Erik
  'P5M': '2017-04-01', // Pons, Miguel
  'A5P': '2018-03-01', // Ahrend, Patrick
  'AP4': '2022-05-15', // Alex, Patrik
  'ATR': '2016-06-01', // Altenhuber, Gerald
  'B3K': '2016-10-01', // Becksteiner, Kurt
  'B6M': '2017-08-01', // Bleier, Mathias
  'D3B': '2017-02-01', // Dallner, Bernhard
  'D3R': '2018-03-01', // Dunst, Roland
  'G3C': '2017-09-22', // Geck, Christian
  'YHB': '2016-07-01', // Hechenegger, Bernd
  'QHB': '2016-03-01', // Heidinger, Börge
  'HS7': '2018-03-01', // Houben, Sebastian
  'J1J': '2016-04-01', // Jansen, Joost
  'J7M': '2017-12-01', // Jung, Michael
  'K3A': '2016-10-01', // Kammann, Julian
  'K4R': '2017-11-01', // Karg, Richard
  'KS8': '2017-12-11', // Kater, Stefan
  'YKM': '2016-08-01', // Kubiak, Marek
  '1LM': '2018-07-01', // Lohner, Matthias
  '5MR': '2022-06-06', // Martini, Roberto
  'N9T': '2022-03-06', // Novak, Tomas
  'O7J': '2022-07-04', // Olmendo Lainz, Joe Maria — Liste: Olmedo Lainz Jose Maria
  'P7R': '2018-04-01', // Perisutti, Rino
  'P1M': '2016-10-01', // Populorum, Markus
  'QRG': '2016-04-01', // Rachoner, Georg
  'RVM': '2016-05-14', // Rieger, Markus
  'QRM': '2016-06-01', // Roithmayr, Martin
  'R3A': '2017-10-01', // Rosenwirth, Alexander
  'T5F': '2018-07-01', // Tankovits, Florian
  'T9S': '2018-04-03', // Tankovits, Stefan
  'T3P': '2018-12-01', // Thorn, Patrick
  'T3F': '2017-01-01', // Turzer, Felix
  'U3C': '2017-08-01', // Untermoser, Christian
  'WHF': '2016-08-15', // Wohlfahrt, Robert
  'B7F': '2022-02-06', // Basanta, Mendez
  'CJ4': '2022-03-06', // Ceballos Serrano, Jose — Liste: Ceballos Jose Ignacio
  'K6N': '2017-09-01', // Klezl, Nikolaus
  'O1Z': '2022-06-06', // Korinek, Tomas
  '8KZ': '2023-02-05', // Kozar, Jan
  '4TK': '2022-12-04', // Ondracek, Zdenek
  'XPK': '2016-06-01', // Purner, Karl
  'S6V': '2022-04-03', // Varga, Sebastian
  'P7C': '2018-02-01', // Pastura, Claudio
  'PTP': '2016-05-05', // Peter, Franz
}
