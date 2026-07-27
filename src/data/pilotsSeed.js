// Boeing-rated line pilots, from the roster spreadsheet (Stand 07/2026).
// One record per person; a person can hold several ratings with different
// expiry dates, so ratings is a list. Whether a rating is valid is NOT stored:
// it is worked out against today every time it is drawn, because a stored flag
// is wrong the morning after it is written.
export const SEED_PILOTS = [
  {
    "id": "plt-01",
    "base": "SZG",
    "tlc": "ATR",
    "name": "Altenhuber, Jerry",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-01-r1",
        "type": "777/787",
        "until": "2026-06-30"
      },
      {
        "id": "plt-01-r2",
        "type": "757/767",
        "until": "2026-09-30"
      }
    ]
  },
  {
    "id": "plt-02",
    "base": "PMI",
    "tlc": "BV3",
    "name": "Beveridge, Stefan",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-02-r1",
        "type": "777/787",
        "until": "2023-06-30"
      }
    ]
  },
  {
    "id": "plt-03",
    "base": "PMI",
    "tlc": "TYI",
    "name": "Bilbao Baz, Jagoba",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-03-r1",
        "type": "737",
        "until": "2027-02-28"
      }
    ]
  },
  {
    "id": "plt-04",
    "base": "PMI",
    "tlc": "U1B",
    "name": "Boenecke, Ulrich",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-04-r1",
        "type": "737",
        "until": "2023-09-30"
      }
    ]
  },
  {
    "id": "plt-05",
    "base": "PMI",
    "tlc": "E7B",
    "name": "Boese Edgar, Claus",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-05-r1",
        "type": "737",
        "until": "2023-01-31"
      }
    ]
  },
  {
    "id": "plt-06",
    "base": "WP BCN",
    "tlc": "JBB",
    "name": "Bosma, Jelmer",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-06-r1",
        "type": "737",
        "until": "2025-03-31"
      }
    ]
  },
  {
    "id": "plt-07",
    "base": "WP BCN",
    "tlc": "B9I",
    "name": "Bozic, Ivica",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-07-r1",
        "type": "737",
        "until": "2021-01-31"
      }
    ]
  },
  {
    "id": "plt-08",
    "base": "PMI",
    "tlc": "WP1",
    "name": "Buggert, Marc",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-08-r1",
        "type": "737",
        "until": "2024-02-29"
      }
    ]
  },
  {
    "id": "plt-09",
    "base": "WP BCN",
    "tlc": "C7R",
    "name": "Canamaque Alcon, Raul",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-09-r1",
        "type": "737",
        "until": "2026-03-31"
      }
    ]
  },
  {
    "id": "plt-10",
    "base": "PMI",
    "tlc": "EG1",
    "name": "Casal, Josep",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-10-r1",
        "type": "777",
        "until": "2024-02-29"
      }
    ]
  },
  {
    "id": "plt-11",
    "base": "WP BCN",
    "tlc": "CV3",
    "name": "Cervenkov, Vasko",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-11-r1",
        "type": "737",
        "until": "2027-03-31"
      }
    ]
  },
  {
    "id": "plt-12",
    "base": "ARN",
    "tlc": "DH4",
    "name": "Delihyuseinov Sunay, Hasanov",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-12-r1",
        "type": "737",
        "until": "2026-09-30"
      }
    ]
  },
  {
    "id": "plt-13",
    "base": "PRG",
    "tlc": "DF5",
    "name": "Dolezal, Filip",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-13-r1",
        "type": "737",
        "until": "2024-08-31"
      }
    ]
  },
  {
    "id": "plt-14",
    "base": "PMI",
    "tlc": "JEE",
    "name": "Eidecker, Julia",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-14-r1",
        "type": "737",
        "until": "2024-09-30"
      }
    ]
  },
  {
    "id": "plt-15",
    "base": "ARN",
    "tlc": "E1W",
    "name": "Ekstedt, William",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-15-r1",
        "type": "737",
        "until": "2023-05-31"
      }
    ]
  },
  {
    "id": "plt-16",
    "base": "PMI",
    "tlc": "TZ1",
    "name": "Fischer, Thomas",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-16-r1",
        "type": "747",
        "until": "2024-07-31"
      },
      {
        "id": "plt-16-r2",
        "type": "777",
        "until": "2024-02-29"
      }
    ]
  },
  {
    "id": "plt-17",
    "base": "PMI",
    "tlc": "EH1",
    "name": "Foldes, Adam",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-17-r1",
        "type": "737",
        "until": "2023-03-31"
      }
    ]
  },
  {
    "id": "plt-18",
    "base": "SZG",
    "tlc": "FR9",
    "name": "Frank, Matyas",
    "role": "fo",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-18-r1",
        "type": "737",
        "until": "2026-01-31"
      }
    ]
  },
  {
    "id": "plt-19",
    "base": "PMI",
    "tlc": "8GG",
    "name": "Garrido Nunez, Alejandro",
    "role": "fo",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-19-r1",
        "type": "737",
        "until": "2024-04-30"
      }
    ]
  },
  {
    "id": "plt-20",
    "base": "PMI",
    "tlc": "GE2",
    "name": "Genner, Mathias",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-20-r1",
        "type": "737",
        "until": "2022-07-31"
      }
    ]
  },
  {
    "id": "plt-21",
    "base": "PMI",
    "tlc": "2GS",
    "name": "GÜREMEN, SEDA",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-21-r1",
        "type": "737",
        "until": "2016-12-31"
      }
    ]
  },
  {
    "id": "plt-22",
    "base": "PMI",
    "tlc": "9LH",
    "name": "Haas, Alexander",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-22-r1",
        "type": "777",
        "until": "2026-03-31"
      }
    ]
  },
  {
    "id": "plt-23",
    "base": "VIE",
    "tlc": "H2W",
    "name": "Havlena, Wasil",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-23-r1",
        "type": "737",
        "until": "2019-05-31"
      }
    ]
  },
  {
    "id": "plt-24",
    "base": "PMI",
    "tlc": "RHH",
    "name": "Hell, Roland",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-24-r1",
        "type": "737",
        "until": "2025-10-31"
      }
    ]
  },
  {
    "id": "plt-25",
    "base": "PMI",
    "tlc": "H8S",
    "name": "Hendriksen, Stephan",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-25-r1",
        "type": "737",
        "until": "2022-02-28"
      }
    ]
  },
  {
    "id": "plt-26",
    "base": "PMI",
    "tlc": "QN1",
    "name": "Henning Jan, Kristof",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-26-r1",
        "type": "777",
        "until": "2024-05-31"
      }
    ]
  },
  {
    "id": "plt-27",
    "base": "ARN",
    "tlc": "J1U",
    "name": "Jakobsson, Thomas",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-27-r1",
        "type": "747",
        "until": "2023-04-30"
      }
    ]
  },
  {
    "id": "plt-28",
    "base": "PMI",
    "tlc": "K3A",
    "name": "Kamman, Julian",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-28-r1",
        "type": "777",
        "until": "2017-07-31"
      }
    ]
  },
  {
    "id": "plt-29",
    "base": "PMI",
    "tlc": "K4R",
    "name": "Karg, Richard",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-29-r1",
        "type": "757",
        "until": "2018-03-31"
      }
    ]
  },
  {
    "id": "plt-30",
    "base": "SZG",
    "tlc": "5TK",
    "name": "Kienle Rene, Tobias",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-30-r1",
        "type": "737",
        "until": "2023-08-31"
      }
    ]
  },
  {
    "id": "plt-31",
    "base": "PRG",
    "tlc": "KT6",
    "name": "Klicka, Tomas",
    "role": "fo",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-31-r1",
        "type": "737",
        "until": "2024-05-31"
      }
    ]
  },
  {
    "id": "plt-32",
    "base": "PMI",
    "tlc": "8AO",
    "name": "Koehler, Markus",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-32-r1",
        "type": "737",
        "until": "2023-06-30"
      }
    ]
  },
  {
    "id": "plt-33",
    "base": "PMI",
    "tlc": "KF2",
    "name": "Kolz, Fabian",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-33-r1",
        "type": "737",
        "until": "2022-05-31"
      }
    ]
  },
  {
    "id": "plt-34",
    "base": "ARN",
    "tlc": "1UM",
    "name": "Kurol, Tobias",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-34-r1",
        "type": "737",
        "until": "2026-04-30"
      },
      {
        "id": "plt-34-r2",
        "type": "777",
        "until": "2021-10-31"
      }
    ]
  },
  {
    "id": "plt-35",
    "base": "PMI",
    "tlc": "LU4",
    "name": "Luidolt, Michael",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-35-r1",
        "type": "737",
        "until": "2023-01-31"
      }
    ]
  },
  {
    "id": "plt-36",
    "base": "VIE",
    "tlc": "M5P",
    "name": "Mayer, Peter",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-36-r1",
        "type": "737",
        "until": "2013-04-30"
      }
    ]
  },
  {
    "id": "plt-37",
    "base": "PMI",
    "tlc": "2RI",
    "name": "Micas, Rico",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-37-r1",
        "type": "757",
        "until": "2023-07-31"
      }
    ]
  },
  {
    "id": "plt-38",
    "base": "PMI",
    "tlc": "EN1",
    "name": "Montero, Carlos",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-38-r1",
        "type": "737",
        "until": "2024-01-31"
      }
    ]
  },
  {
    "id": "plt-39",
    "base": "PMI",
    "tlc": "M6O",
    "name": "Morrondo Hammerstedt, Oscar",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-39-r1",
        "type": "747",
        "until": "2023-08-31"
      },
      {
        "id": "plt-39-r2",
        "type": "777",
        "until": "2023-03-31"
      }
    ]
  },
  {
    "id": "plt-40",
    "base": "PRG",
    "tlc": "NJ5",
    "name": "Ninger, Jakub",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-40-r1",
        "type": "737",
        "until": "2025-06-30"
      }
    ]
  },
  {
    "id": "plt-41",
    "base": "PMI",
    "tlc": "O2T",
    "name": "Overhoff, Tim",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-41-r1",
        "type": "737",
        "until": "2022-04-30"
      }
    ]
  },
  {
    "id": "plt-42",
    "base": "PMI",
    "tlc": "P7R",
    "name": "Perisutti, Rino",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-42-r1",
        "type": "737",
        "until": "2013-11-05"
      }
    ]
  },
  {
    "id": "plt-43",
    "base": "ARN",
    "tlc": "P4O",
    "name": "Pilgrim, Oskar",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-43-r1",
        "type": "737",
        "until": "2021-03-31"
      }
    ]
  },
  {
    "id": "plt-44",
    "base": "PMI",
    "tlc": "P5M",
    "name": "Pons, Miguel",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-44-r1",
        "type": "737",
        "until": "2021-03-31"
      }
    ]
  },
  {
    "id": "plt-45",
    "base": "SZG",
    "tlc": "XPK",
    "name": "Purner, Karl",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-45-r1",
        "type": "777/787",
        "until": "2025-11-30"
      }
    ]
  },
  {
    "id": "plt-46",
    "base": "VIE",
    "tlc": "R3J",
    "name": "Reiter, Jan",
    "role": "fo",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-46-r1",
        "type": "737",
        "until": "2017-09-30"
      }
    ]
  },
  {
    "id": "plt-47",
    "base": "SZG",
    "tlc": "QRM",
    "name": "Roithmayr, Martin",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-47-r1",
        "type": "777/787",
        "until": "2026-06-30"
      },
      {
        "id": "plt-47-r2",
        "type": "757/767",
        "until": "2026-08-31"
      }
    ]
  },
  {
    "id": "plt-48",
    "base": "SZG",
    "tlc": "R3A",
    "name": "Rosenwirth, Alex",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-48-r1",
        "type": "777/787",
        "until": "2026-06-30"
      }
    ]
  },
  {
    "id": "plt-49",
    "base": "PMI",
    "tlc": "4AV",
    "name": "Salva Bonet, Antoni",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-49-r1",
        "type": "777/787",
        "until": "2026-03-31"
      }
    ]
  },
  {
    "id": "plt-50",
    "base": "PMI",
    "tlc": "II1",
    "name": "Saura Sanchez, Javier",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-50-r1",
        "type": "737",
        "until": "2024-04-30"
      }
    ]
  },
  {
    "id": "plt-51",
    "base": "SZG",
    "tlc": "S6R",
    "name": "Schoenfelder, Ralph",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-51-r1",
        "type": "777",
        "until": "2017-02-28"
      }
    ]
  },
  {
    "id": "plt-52",
    "base": "PMI",
    "tlc": "SJ7",
    "name": "Schuhmann, Josefine",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-52-r1",
        "type": "737",
        "until": "2016-01-31"
      }
    ]
  },
  {
    "id": "plt-53",
    "base": "PMI",
    "tlc": "8MD",
    "name": "Smidek, Martin",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-53-r1",
        "type": "777/787",
        "until": "2023-09-30"
      }
    ]
  },
  {
    "id": "plt-54",
    "base": "SZG",
    "tlc": "S4B",
    "name": "Sonnberger, Bernhard",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-54-r1",
        "type": "737",
        "until": "2017-05-31"
      }
    ]
  },
  {
    "id": "plt-55",
    "base": "WP BCN",
    "tlc": "5SP",
    "name": "Steuer, Peter",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-55-r1",
        "type": "737",
        "until": "2026-04-30"
      }
    ]
  },
  {
    "id": "plt-56",
    "base": "PMI",
    "tlc": "5TA",
    "name": "Thalmann, Axel",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-56-r1",
        "type": "737",
        "until": "2026-09-30"
      }
    ]
  },
  {
    "id": "plt-57",
    "base": "ARN",
    "tlc": "T9C",
    "name": "Thisner, Cristina",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-57-r1",
        "type": "737",
        "until": "2019-04-30"
      }
    ]
  },
  {
    "id": "plt-58",
    "base": "PMI",
    "tlc": "U1I",
    "name": "Uzun, Israfil",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-58-r1",
        "type": "737",
        "until": "2021-12-31"
      }
    ]
  },
  {
    "id": "plt-59",
    "base": "PMI",
    "tlc": "VK2",
    "name": "Van Kuijk, Rodolfo",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-59-r1",
        "type": "737",
        "until": "2023-06-30"
      }
    ]
  },
  {
    "id": "plt-60",
    "base": "PRG",
    "tlc": "V7K",
    "name": "Vanek, Krystof",
    "role": "fo",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-60-r1",
        "type": "737",
        "until": "2025-05-31"
      }
    ]
  },
  {
    "id": "plt-61",
    "base": "PMI",
    "tlc": "R9V",
    "name": "Veenstra, Remco",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-61-r1",
        "type": "737",
        "until": "2024-05-31"
      }
    ]
  },
  {
    "id": "plt-62",
    "base": "PRG",
    "tlc": "V7L",
    "name": "Velebni, Ladislav",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-62-r1",
        "type": "737",
        "until": "2025-04-30"
      }
    ]
  },
  {
    "id": "plt-63",
    "base": "WP BCN",
    "tlc": "W9H",
    "name": "Waern, Hans",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-63-r1",
        "type": "777/787",
        "until": "2025-04-30"
      },
      {
        "id": "plt-63-r2",
        "type": "747",
        "until": "2024-01-31"
      }
    ]
  },
  {
    "id": "plt-64",
    "base": "VIE",
    "tlc": "WZI",
    "name": "Wenninger-Weinzierl, Armin",
    "role": "captain",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-64-r1",
        "type": "737",
        "until": "2016-12-31"
      }
    ]
  }
]
