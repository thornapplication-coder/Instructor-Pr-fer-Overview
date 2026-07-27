// Boeing-rated line pilots, from the roster spreadsheet (Stand 07/2026).
// One record per person; a person can hold several ratings with different
// expiry dates, so ratings is a list. Whether a rating is valid is NOT stored:
// it is worked out against today every time it is drawn, because a stored flag
// is wrong the morning after it is written.
export const SEED_PILOTS = [
  {
    "id": "plt-01",
    "base": "VIE",
    "tlc": "",
    "name": "Altenhuber, Jerry",
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
    "base": "SZG",
    "tlc": "",
    "name": "Beveridge, Stefan",
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
    "tlc": "",
    "name": "Bilbao Baz, Jagoba",
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
    "base": "PRG",
    "tlc": "",
    "name": "Boenecke, Ulrich",
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
    "base": "WP PRG",
    "tlc": "",
    "name": "Boese Edgar, Claus",
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
    "tlc": "",
    "name": "Bosma, Jelmer",
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
    "base": "WP PMI",
    "tlc": "",
    "name": "Bozic, Ivica",
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
    "base": "WP WAW",
    "tlc": "",
    "name": "Buggert, Marc",
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
    "base": "ARN",
    "tlc": "",
    "name": "Canamaque Alcon, Raul",
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
    "base": "",
    "tlc": "",
    "name": "Casal, Josep",
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
    "base": "",
    "tlc": "",
    "name": "Cervenkov, Vasko",
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
    "base": "",
    "tlc": "",
    "name": "Delihyuseinov Sunay, Hasanov",
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
    "base": "",
    "tlc": "",
    "name": "Dolezal, Filip",
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
    "base": "",
    "tlc": "",
    "name": "Eidecker, Julia",
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
    "base": "",
    "tlc": "",
    "name": "Ekstedt, William",
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
    "base": "",
    "tlc": "",
    "name": "Fischer, Thomas",
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
    "base": "",
    "tlc": "",
    "name": "Foldes, Adam",
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
    "base": "",
    "tlc": "",
    "name": "Frank, Matyas",
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
    "base": "",
    "tlc": "",
    "name": "Garrido Nunez, Alejandro",
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
    "base": "",
    "tlc": "",
    "name": "Genner, Mathias",
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
    "base": "",
    "tlc": "",
    "name": "GÜREMEN, SEDA",
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
    "base": "",
    "tlc": "",
    "name": "Haas, Alexander",
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
    "base": "",
    "tlc": "",
    "name": "Hahne, Patrick",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-23-r1",
        "type": "737",
        "until": "2022-02-28"
      }
    ]
  },
  {
    "id": "plt-24",
    "base": "",
    "tlc": "",
    "name": "Havlena, Wasil",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-24-r1",
        "type": "737",
        "until": "2019-05-31"
      }
    ]
  },
  {
    "id": "plt-25",
    "base": "",
    "tlc": "",
    "name": "Hell, Roland",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-25-r1",
        "type": "737",
        "until": "2025-10-31"
      }
    ]
  },
  {
    "id": "plt-26",
    "base": "",
    "tlc": "",
    "name": "Hendriksen, Stephan",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-26-r1",
        "type": "737",
        "until": "2022-02-28"
      }
    ]
  },
  {
    "id": "plt-27",
    "base": "",
    "tlc": "",
    "name": "Henning Jan, Kristof",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-27-r1",
        "type": "777",
        "until": "2024-05-31"
      }
    ]
  },
  {
    "id": "plt-28",
    "base": "",
    "tlc": "",
    "name": "Jakobsson, Thomas",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-28-r1",
        "type": "747",
        "until": "2023-04-30"
      }
    ]
  },
  {
    "id": "plt-29",
    "base": "",
    "tlc": "",
    "name": "Kamman, Julian",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-29-r1",
        "type": "777",
        "until": "2017-07-31"
      }
    ]
  },
  {
    "id": "plt-30",
    "base": "",
    "tlc": "",
    "name": "Karg, Richard",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-30-r1",
        "type": "757",
        "until": "2018-03-31"
      }
    ]
  },
  {
    "id": "plt-31",
    "base": "",
    "tlc": "",
    "name": "Kienle Rene, Tobias",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-31-r1",
        "type": "737",
        "until": "2023-08-31"
      }
    ]
  },
  {
    "id": "plt-32",
    "base": "",
    "tlc": "",
    "name": "Klicka, Tomas",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-32-r1",
        "type": "737",
        "until": "2024-05-31"
      }
    ]
  },
  {
    "id": "plt-33",
    "base": "",
    "tlc": "",
    "name": "Koehler, Markus",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-33-r1",
        "type": "737",
        "until": "2023-06-30"
      }
    ]
  },
  {
    "id": "plt-34",
    "base": "",
    "tlc": "",
    "name": "Kolz, Fabian",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-34-r1",
        "type": "737",
        "until": "2022-05-31"
      }
    ]
  },
  {
    "id": "plt-35",
    "base": "",
    "tlc": "",
    "name": "Kurol, Tobias",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-35-r1",
        "type": "737",
        "until": "2026-04-30"
      },
      {
        "id": "plt-35-r2",
        "type": "777",
        "until": "2021-10-31"
      }
    ]
  },
  {
    "id": "plt-36",
    "base": "",
    "tlc": "",
    "name": "Luidolt, Michael",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-36-r1",
        "type": "737",
        "until": "2023-01-31"
      }
    ]
  },
  {
    "id": "plt-37",
    "base": "",
    "tlc": "",
    "name": "Mayer, Peter",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-37-r1",
        "type": "737",
        "until": "2013-04-30"
      }
    ]
  },
  {
    "id": "plt-38",
    "base": "",
    "tlc": "",
    "name": "Micas, Rico",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-38-r1",
        "type": "757",
        "until": "2023-07-31"
      }
    ]
  },
  {
    "id": "plt-39",
    "base": "",
    "tlc": "",
    "name": "Montero, Carlos",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-39-r1",
        "type": "737",
        "until": "2024-01-31"
      }
    ]
  },
  {
    "id": "plt-40",
    "base": "",
    "tlc": "",
    "name": "Morrondo Hammerstedt, Oscar",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-40-r1",
        "type": "747",
        "until": "2023-08-31"
      },
      {
        "id": "plt-40-r2",
        "type": "777",
        "until": "2023-03-31"
      }
    ]
  },
  {
    "id": "plt-41",
    "base": "",
    "tlc": "",
    "name": "Ninger, Jakub",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-41-r1",
        "type": "737",
        "until": "2025-06-30"
      }
    ]
  },
  {
    "id": "plt-42",
    "base": "",
    "tlc": "",
    "name": "Overhoff, Tim",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-42-r1",
        "type": "737",
        "until": "2022-04-30"
      }
    ]
  },
  {
    "id": "plt-43",
    "base": "",
    "tlc": "",
    "name": "Perisutti, Rino",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-43-r1",
        "type": "737",
        "until": "2013-11-05"
      }
    ]
  },
  {
    "id": "plt-44",
    "base": "",
    "tlc": "",
    "name": "Pilgrim, Oskar",
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
    "base": "",
    "tlc": "",
    "name": "Pons, Miguel",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-45-r1",
        "type": "737",
        "until": "2021-03-31"
      }
    ]
  },
  {
    "id": "plt-46",
    "base": "",
    "tlc": "",
    "name": "Purner, Karl",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-46-r1",
        "type": "777/787",
        "until": "2025-11-30"
      }
    ]
  },
  {
    "id": "plt-47",
    "base": "",
    "tlc": "",
    "name": "Reiter, Jan",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-47-r1",
        "type": "737",
        "until": "2017-09-30"
      }
    ]
  },
  {
    "id": "plt-48",
    "base": "",
    "tlc": "",
    "name": "Roithmayr, Martin",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-48-r1",
        "type": "777/787",
        "until": "2026-06-30"
      },
      {
        "id": "plt-48-r2",
        "type": "757/767",
        "until": "2026-08-31"
      }
    ]
  },
  {
    "id": "plt-49",
    "base": "",
    "tlc": "",
    "name": "Rosenwirth, Alex",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-49-r1",
        "type": "777/787",
        "until": "2026-06-30"
      }
    ]
  },
  {
    "id": "plt-50",
    "base": "",
    "tlc": "",
    "name": "Salva Bonet, Antoni",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-50-r1",
        "type": "777/787",
        "until": "2026-03-31"
      }
    ]
  },
  {
    "id": "plt-51",
    "base": "",
    "tlc": "",
    "name": "Saura Sanchez, Javier",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-51-r1",
        "type": "737",
        "until": "2024-04-30"
      }
    ]
  },
  {
    "id": "plt-52",
    "base": "",
    "tlc": "",
    "name": "Schoenfelder, Ralph",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-52-r1",
        "type": "777",
        "until": "2017-02-28"
      }
    ]
  },
  {
    "id": "plt-53",
    "base": "",
    "tlc": "",
    "name": "Schuhmann, Josefine",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-53-r1",
        "type": "737",
        "until": "2016-01-31"
      }
    ]
  },
  {
    "id": "plt-54",
    "base": "",
    "tlc": "",
    "name": "Smidek, Martin",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-54-r1",
        "type": "777/787",
        "until": "2023-09-30"
      }
    ]
  },
  {
    "id": "plt-55",
    "base": "",
    "tlc": "",
    "name": "Sonnberger, Bernhard",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-55-r1",
        "type": "737",
        "until": "2017-05-31"
      }
    ]
  },
  {
    "id": "plt-56",
    "base": "",
    "tlc": "",
    "name": "Steuer, Peter",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-56-r1",
        "type": "737",
        "until": "2026-04-30"
      }
    ]
  },
  {
    "id": "plt-57",
    "base": "",
    "tlc": "",
    "name": "Thalmann, Axel",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-57-r1",
        "type": "737",
        "until": "2026-09-30"
      }
    ]
  },
  {
    "id": "plt-58",
    "base": "",
    "tlc": "",
    "name": "Thisner, Cristina",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-58-r1",
        "type": "737",
        "until": "2019-04-30"
      }
    ]
  },
  {
    "id": "plt-59",
    "base": "",
    "tlc": "",
    "name": "Uzun, Israfil",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-59-r1",
        "type": "737",
        "until": "2021-12-31"
      }
    ]
  },
  {
    "id": "plt-60",
    "base": "",
    "tlc": "",
    "name": "Van Kuijk, Rodolfo",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-60-r1",
        "type": "737",
        "until": "2023-06-30"
      }
    ]
  },
  {
    "id": "plt-61",
    "base": "",
    "tlc": "",
    "name": "Vanek, Krystof",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-61-r1",
        "type": "737",
        "until": "2025-05-31"
      }
    ]
  },
  {
    "id": "plt-62",
    "base": "",
    "tlc": "",
    "name": "Veenstra, Remco",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-62-r1",
        "type": "737",
        "until": "2024-05-31"
      }
    ]
  },
  {
    "id": "plt-63",
    "base": "",
    "tlc": "",
    "name": "Velebni, Ladislav",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-63-r1",
        "type": "737",
        "until": "2025-04-30"
      }
    ]
  },
  {
    "id": "plt-64",
    "base": "",
    "tlc": "",
    "name": "Waern, Hans",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-64-r1",
        "type": "777/787",
        "until": "2025-04-30"
      },
      {
        "id": "plt-64-r2",
        "type": "747",
        "until": "2024-01-31"
      }
    ]
  },
  {
    "id": "plt-65",
    "base": "",
    "tlc": "",
    "name": "Wenninger-Weinzierl, Armin",
    "boeingExp": true,
    "ratings": [
      {
        "id": "plt-65-r1",
        "type": "737",
        "until": "2016-12-31"
      }
    ]
  }
]
