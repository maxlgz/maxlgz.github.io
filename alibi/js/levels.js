// Provisoire : remplacé par les 12 enquêtes définitives.
export const LEVELS = [
 {
  "id": "peniche",
  "title": "La péniche",
  "intro": "Le capitaine Gaspard a été victime d'un crime à bord de sa péniche, La Belle Escale, amarrée pour la soirée. Un seul de ses invités s'est retrouvé seul avec lui.",
  "difficulty": 1,
  "size": 5,
  "rooms": [
   {
    "key": "a",
    "name": "Cabine",
    "floor": "wood"
   },
   {
    "key": "b",
    "name": "Pont",
    "floor": "deck"
   },
   {
    "key": "c",
    "name": "Salon",
    "floor": "carpet"
   },
   {
    "key": "d",
    "name": "Cuisine",
    "floor": "tile"
   }
  ],
  "roomMap": [
   "aaaab",
   "cccab",
   "cccbb",
   "ddcbb",
   "dddbb"
  ],
  "objects": [
   {
    "type": "bed",
    "r": 0,
    "c": 0
   },
   {
    "type": "wardrobe",
    "r": 0,
    "c": 3
   },
   {
    "type": "sofa",
    "r": 1,
    "c": 0,
    "w": 2
   },
   {
    "type": "table",
    "r": 2,
    "c": 0
   },
   {
    "type": "armchair",
    "r": 2,
    "c": 2
   },
   {
    "type": "stove",
    "r": 4,
    "c": 0
   },
   {
    "type": "stool",
    "r": 4,
    "c": 2
   },
   {
    "type": "barrel",
    "r": 1,
    "c": 4
   },
   {
    "type": "deckchair",
    "r": 3,
    "c": 4
   }
  ],
  "people": [
   {
    "id": "D",
    "name": "Dario",
    "gender": "m",
    "clues": [
     {
      "t": "on",
      "obj": "bed"
     },
     {
      "t": "alone"
     }
    ],
    "look": {
     "skin": 4,
     "hair": 0,
     "hairColor": 3,
     "accessory": "glasses",
     "bg": 0
    }
   },
   {
    "id": "A",
    "name": "Agathe",
    "gender": "f",
    "clues": [
     {
      "t": "beside",
      "obj": "armchair",
      "not": true
     }
    ],
    "look": {
     "skin": 1,
     "hair": 4,
     "hairColor": 2,
     "accessory": "earrings",
     "bg": 2
    }
   },
   {
    "id": "G",
    "name": "Gaspard",
    "gender": "m",
    "victim": true,
    "clues": [],
    "look": {
     "skin": 3,
     "hair": 6,
     "hairColor": 1,
     "accessory": "none",
     "bg": 1
    }
   },
   {
    "id": "C",
    "name": "Colette",
    "gender": "f",
    "clues": [
     {
      "t": "sameCol",
      "obj": "wardrobe",
      "not": true
     }
    ],
    "look": {
     "skin": 2,
     "hair": 7,
     "hairColor": 5,
     "accessory": "scarf",
     "bg": 5
    }
   },
   {
    "id": "B",
    "name": "Bruno",
    "gender": "m",
    "clues": [
     {
      "t": "room",
      "room": "d"
     },
     {
      "t": "dir",
      "dir": "S",
      "of": {
       "who": "C"
      },
      "exact": 1
     }
    ],
    "look": {
     "skin": 0,
     "hair": 3,
     "hairColor": 6,
     "accessory": "moustache",
     "bg": 3
    }
   }
  ],
  "solution": {
   "D": [
    0,
    0
   ],
   "A": [
    1,
    1
   ],
   "G": [
    2,
    3
   ],
   "C": [
    3,
    4
   ],
   "B": [
    4,
    2
   ]
  }
 },
 {
  "id": "refuge",
  "title": "Le refuge",
  "intro": "Une tempête de neige bloque le refuge du Mont-Brisé : le gardien Hector n'est plus en état de servir la soupe. Il n'y a que cinq personnes là-haut, et l'une d'elles ment.",
  "difficulty": 1,
  "size": 5,
  "rooms": [
   {
    "key": "a",
    "name": "Dortoir",
    "floor": "wood"
   },
   {
    "key": "b",
    "name": "Salle commune",
    "floor": "parquet"
   },
   {
    "key": "c",
    "name": "Terrasse",
    "floor": "snow"
   },
   {
    "key": "d",
    "name": "Cellier",
    "floor": "stone"
   }
  ],
  "roomMap": [
   "aaabc",
   "aaabc",
   "ddbbc",
   "ddbcc",
   "ddbcc"
  ],
  "objects": [
   {
    "type": "bed",
    "r": 0,
    "c": 0,
    "h": 2
   },
   {
    "type": "stool",
    "r": 1,
    "c": 2
   },
   {
    "type": "fireplace",
    "r": 0,
    "c": 3
   },
   {
    "type": "armchair",
    "r": 1,
    "c": 3
   },
   {
    "type": "barrel",
    "r": 2,
    "c": 0
   },
   {
    "type": "crate",
    "r": 3,
    "c": 1
   },
   {
    "type": "shelf",
    "r": 4,
    "c": 0
   },
   {
    "type": "bench",
    "r": 2,
    "c": 4,
    "h": 2
   },
   {
    "type": "rock",
    "r": 0,
    "c": 4
   },
   {
    "type": "tree",
    "r": 4,
    "c": 4
   }
  ],
  "people": [
   {
    "id": "K",
    "name": "Karim",
    "gender": "m",
    "clues": [
     {
      "t": "dir",
      "dir": "E",
      "of": {
       "obj": "bed"
      },
      "not": true
     },
     {
      "t": "sameRow",
      "obj": "rock"
     }
    ],
    "look": {
     "skin": 3,
     "hair": 1,
     "hairColor": 1,
     "accessory": "glasses",
     "bg": 5
    }
   },
   {
    "id": "H",
    "name": "Hector",
    "gender": "m",
    "victim": true,
    "clues": [],
    "look": {
     "skin": 5,
     "hair": 3,
     "hairColor": 3,
     "accessory": "scarf",
     "bg": 0
    }
   },
   {
    "id": "L",
    "name": "Léa",
    "gender": "f",
    "clues": [
     {
      "t": "room",
      "room": "b"
     },
     {
      "t": "beside",
      "obj": "fireplace",
      "not": true
     }
    ],
    "look": {
     "skin": 4,
     "hair": 4,
     "hairColor": 6,
     "accessory": "none",
     "bg": 4
    }
   },
   {
    "id": "I",
    "name": "Inès",
    "gender": "f",
    "clues": [
     {
      "t": "on",
      "obj": "bench"
     },
     {
      "t": "dir",
      "dir": "E",
      "of": {
       "who": "L"
      },
      "exact": 1
     }
    ],
    "look": {
     "skin": 1,
     "hair": 7,
     "hairColor": 5,
     "accessory": "cap",
     "bg": 1
    }
   },
   {
    "id": "J",
    "name": "Jules",
    "gender": "m",
    "clues": [
     {
      "t": "beside",
      "obj": "shelf"
     }
    ],
    "look": {
     "skin": 0,
     "hair": 9,
     "hairColor": 4,
     "accessory": "hat",
     "bg": 6
    }
   }
  ],
  "solution": {
   "K": [
    0,
    0
   ],
   "H": [
    1,
    2
   ],
   "L": [
    2,
    3
   ],
   "I": [
    3,
    4
   ],
   "J": [
    4,
    1
   ]
  }
 },
 {
  "id": "librairie",
  "title": "La librairie",
  "intro": "Octave, le libraire de la rue des Peupliers, a été retrouvé entre deux rayonnages un soir d'inventaire. Six personnes traînaient encore dans la boutique à la fermeture.",
  "difficulty": 1,
  "size": 6,
  "rooms": [
   {
    "key": "a",
    "name": "Rayons",
    "floor": "parquet"
   },
   {
    "key": "b",
    "name": "Café",
    "floor": "tile"
   },
   {
    "key": "c",
    "name": "Coin lecture",
    "floor": "carpet"
   },
   {
    "key": "d",
    "name": "Entrée",
    "floor": "stone"
   },
   {
    "key": "e",
    "name": "Réserve",
    "floor": "concrete"
   },
   {
    "key": "f",
    "name": "Bureau",
    "floor": "wood"
   }
  ],
  "roomMap": [
   "aaaabb",
   "aaaabb",
   "cccdbb",
   "cccdee",
   "ffcdee",
   "ffddee"
  ],
  "objects": [
   {
    "type": "shelf",
    "r": 0,
    "c": 0
   },
   {
    "type": "shelf",
    "r": 1,
    "c": 1
   },
   {
    "type": "stool",
    "r": 0,
    "c": 2
   },
   {
    "type": "plant",
    "r": 1,
    "c": 3
   },
   {
    "type": "chair",
    "r": 0,
    "c": 4
   },
   {
    "type": "table",
    "r": 1,
    "c": 4
   },
   {
    "type": "armchair",
    "r": 2,
    "c": 0
   },
   {
    "type": "sofa",
    "r": 3,
    "c": 0,
    "w": 2
   },
   {
    "type": "counter",
    "r": 3,
    "c": 3
   },
   {
    "type": "crate",
    "r": 3,
    "c": 4
   },
   {
    "type": "barrel",
    "r": 5,
    "c": 5
   },
   {
    "type": "desk",
    "r": 4,
    "c": 0
   },
   {
    "type": "chair",
    "r": 5,
    "c": 1
   }
  ],
  "people": [
   {
    "id": "R",
    "name": "Rosalie",
    "gender": "f",
    "clues": [
     {
      "t": "on",
      "obj": "chair"
     }
    ],
    "look": {
     "skin": 1,
     "hair": 9,
     "hairColor": 2,
     "accessory": "glasses",
     "bg": 2
    }
   },
   {
    "id": "Q",
    "name": "Quentin",
    "gender": "m",
    "clues": [
     {
      "t": "dir",
      "dir": "E",
      "of": {
       "obj": "desk"
      }
     }
    ],
    "look": {
     "skin": 3,
     "hair": 0,
     "hairColor": 5,
     "accessory": "moustache",
     "bg": 0
    }
   },
   {
    "id": "S",
    "name": "Sylvain",
    "gender": "m",
    "clues": [
     {
      "t": "beside",
      "obj": "sofa"
     },
     {
      "t": "sameCol",
      "obj": "desk"
     }
    ],
    "look": {
     "skin": 0,
     "hair": 5,
     "hairColor": 1,
     "accessory": "none",
     "bg": 4
    }
   },
   {
    "id": "O",
    "name": "Octave",
    "gender": "m",
    "victim": true,
    "clues": [],
    "look": {
     "skin": 5,
     "hair": 2,
     "hairColor": 4,
     "accessory": "hat",
     "bg": 6
    }
   },
   {
    "id": "N",
    "name": "Noémie",
    "gender": "f",
    "clues": [
     {
      "t": "beside",
      "obj": "barrel"
     }
    ],
    "look": {
     "skin": 4,
     "hair": 4,
     "hairColor": 7,
     "accessory": "earrings",
     "bg": 1
    }
   },
   {
    "id": "P",
    "name": "Pauline",
    "gender": "f",
    "clues": [
     {
      "t": "room",
      "room": "d"
     }
    ],
    "look": {
     "skin": 2,
     "hair": 6,
     "hairColor": 6,
     "accessory": "none",
     "bg": 7
    }
   }
  ],
  "solution": {
   "R": [
    0,
    4
   ],
   "Q": [
    1,
    2
   ],
   "S": [
    2,
    0
   ],
   "O": [
    3,
    1
   ],
   "N": [
    4,
    5
   ],
   "P": [
    5,
    3
   ]
  }
 },
 {
  "id": "phare",
  "title": "Le phare",
  "intro": "Au phare de la Pointe-Grise, le gardien Fabien n'a pas rallumé la lanterne ce soir : on l'a retrouvé au pied de l'escalier. Six personnes passaient la soirée sur le rocher.",
  "difficulty": 2,
  "size": 6,
  "rooms": [
   {
    "key": "a",
    "name": "Lanterne",
    "floor": "marble"
   },
   {
    "key": "b",
    "name": "Escalier",
    "floor": "stone"
   },
   {
    "key": "c",
    "name": "Cuisine",
    "floor": "tile"
   },
   {
    "key": "d",
    "name": "Chambre",
    "floor": "wood"
   },
   {
    "key": "e",
    "name": "Jardin",
    "floor": "grass"
   },
   {
    "key": "f",
    "name": "Falaise",
    "floor": "gravel"
   },
   {
    "key": "g",
    "name": "Quai",
    "floor": "deck"
   }
  ],
  "roomMap": [
   "eeaaff",
   "ebbaff",
   "ebbccf",
   "eddccg",
   "eddccg",
   "eeeggg"
  ],
  "objects": [
   {
    "type": "telescope",
    "r": 0,
    "c": 2
   },
   {
    "type": "stool",
    "r": 0,
    "c": 3
   },
   {
    "type": "bush",
    "r": 0,
    "c": 0
   },
   {
    "type": "shelf",
    "r": 1,
    "c": 1
   },
   {
    "type": "stove",
    "r": 2,
    "c": 3
   },
   {
    "type": "table",
    "r": 3,
    "c": 3
   },
   {
    "type": "chair",
    "r": 3,
    "c": 4
   },
   {
    "type": "bed",
    "r": 3,
    "c": 1,
    "h": 2
   },
   {
    "type": "wardrobe",
    "r": 4,
    "c": 2
   },
   {
    "type": "tree",
    "r": 2,
    "c": 0
   },
   {
    "type": "bench",
    "r": 5,
    "c": 1,
    "w": 2
   },
   {
    "type": "rock",
    "r": 0,
    "c": 4
   },
   {
    "type": "boat",
    "r": 3,
    "c": 5,
    "h": 2
   },
   {
    "type": "barrel",
    "r": 5,
    "c": 4
   }
  ],
  "people": [
   {
    "id": "G",
    "name": "Gwen",
    "gender": "f",
    "clues": [
     {
      "t": "dir",
      "dir": "S",
      "of": {
       "obj": "stove"
      },
      "not": true
     },
     {
      "t": "sameCol",
      "obj": "stove"
     }
    ],
    "look": {
     "skin": 3,
     "hair": 0,
     "hairColor": 4,
     "accessory": "glasses",
     "bg": 0
    }
   },
   {
    "id": "J",
    "name": "Jonas",
    "gender": "m",
    "clues": [
     {
      "t": "alone"
     }
    ],
    "look": {
     "skin": 4,
     "hair": 9,
     "hairColor": 1,
     "accessory": "scarf",
     "bg": 7
    }
   },
   {
    "id": "I",
    "name": "Isaure",
    "gender": "f",
    "clues": [
     {
      "t": "sameRow",
      "obj": "stove"
     },
     {
      "t": "dir",
      "dir": "E",
      "of": {
       "who": "J"
      },
      "exact": 3
     }
    ],
    "look": {
     "skin": 0,
     "hair": 6,
     "hairColor": 0,
     "accessory": "none",
     "bg": 2
    }
   },
   {
    "id": "E",
    "name": "Elsa",
    "gender": "f",
    "clues": [
     {
      "t": "beside",
      "obj": "table"
     }
    ],
    "look": {
     "skin": 1,
     "hair": 3,
     "hairColor": 2,
     "accessory": "earrings",
     "bg": 1
    }
   },
   {
    "id": "F",
    "name": "Fabien",
    "gender": "m",
    "victim": true,
    "clues": [],
    "look": {
     "skin": 5,
     "hair": 7,
     "hairColor": 6,
     "accessory": "beard",
     "bg": 4
    }
   },
   {
    "id": "H",
    "name": "Hugo",
    "gender": "m",
    "clues": [
     {
      "t": "sameCol",
      "obj": "bush",
      "not": true
     }
    ],
    "look": {
     "skin": 2,
     "hair": 1,
     "hairColor": 5,
     "accessory": "none",
     "bg": 5
    }
   }
  ],
  "solution": {
   "G": [
    0,
    3
   ],
   "J": [
    1,
    2
   ],
   "I": [
    2,
    5
   ],
   "E": [
    3,
    4
   ],
   "F": [
    4,
    0
   ],
   "H": [
    5,
    1
   ]
  }
 },
 {
  "id": "vignoble",
  "title": "Le vignoble",
  "intro": "C'est le jour des vendanges au domaine des Trois-Coteaux, et Désiré, le maître de chai, ne goûtera plus jamais son propre millésime. Parmi les six convives, un seul était seul avec lui.",
  "difficulty": 2,
  "size": 6,
  "rooms": [
   {
    "key": "a",
    "name": "Chai",
    "floor": "stone"
   },
   {
    "key": "b",
    "name": "Cave",
    "floor": "concrete"
   },
   {
    "key": "c",
    "name": "Terrasse",
    "floor": "deck"
   },
   {
    "key": "d",
    "name": "Vignes",
    "floor": "grass"
   },
   {
    "key": "e",
    "name": "Dégustation",
    "floor": "parquet"
   },
   {
    "key": "f",
    "name": "Cour",
    "floor": "gravel"
   }
  ],
  "roomMap": [
   "ddddcc",
   "dddeec",
   "aabeec",
   "aabbff",
   "aaabff",
   "aaabff"
  ],
  "objects": [
   {
    "type": "tree",
    "r": 0,
    "c": 1
   },
   {
    "type": "bush",
    "r": 1,
    "c": 2
   },
   {
    "type": "bench",
    "r": 0,
    "c": 2,
    "w": 2
   },
   {
    "type": "barrel",
    "r": 2,
    "c": 0
   },
   {
    "type": "table",
    "r": 4,
    "c": 1
   },
   {
    "type": "stool",
    "r": 5,
    "c": 2
   },
   {
    "type": "shelf",
    "r": 2,
    "c": 2
   },
   {
    "type": "table",
    "r": 1,
    "c": 3
   },
   {
    "type": "chair",
    "r": 1,
    "c": 4
   },
   {
    "type": "counter",
    "r": 2,
    "c": 4
   },
   {
    "type": "deckchair",
    "r": 1,
    "c": 5
   },
   {
    "type": "car",
    "r": 3,
    "c": 4,
    "w": 2
   },
   {
    "type": "fountain",
    "r": 4,
    "c": 4
   }
  ],
  "people": [
   {
    "id": "C",
    "name": "Clémence",
    "gender": "f",
    "clues": [
     {
      "t": "dir",
      "dir": "N",
      "of": {
       "obj": "bush"
      },
      "exact": 1
     },
     {
      "t": "sameCol",
      "obj": "bush"
     }
    ],
    "look": {
     "skin": 1,
     "hair": 9,
     "hairColor": 6,
     "accessory": "scarf",
     "bg": 0
    }
   },
   {
    "id": "E",
    "name": "Eliott",
    "gender": "m",
    "clues": [
     {
      "t": "dir",
      "dir": "S",
      "of": {
       "obj": "chair"
      },
      "not": true
     }
    ],
    "look": {
     "skin": 5,
     "hair": 3,
     "hairColor": 2,
     "accessory": "moustache",
     "bg": 1
    }
   },
   {
    "id": "B",
    "name": "Baptiste",
    "gender": "m",
    "clues": [
     {
      "t": "sameRow",
      "obj": "stool",
      "not": true
     },
     {
      "t": "room",
      "room": "a"
     }
    ],
    "look": {
     "skin": 0,
     "hair": 2,
     "hairColor": 4,
     "accessory": "none",
     "bg": 2
    }
   },
   {
    "id": "A",
    "name": "Adèle",
    "gender": "f",
    "clues": [
     {
      "t": "dir",
      "dir": "W",
      "of": {
       "obj": "deckchair"
      },
      "exact": 1
     },
     {
      "t": "on",
      "obj": "car"
     }
    ],
    "look": {
     "skin": 2,
     "hair": 5,
     "hairColor": 1,
     "accessory": "glasses",
     "bg": 6
    }
   },
   {
    "id": "F",
    "name": "Florence",
    "gender": "f",
    "clues": [
     {
      "t": "dir",
      "dir": "W",
      "of": {
       "who": "E"
      }
     },
     {
      "t": "sameRow",
      "obj": "table"
     }
    ],
    "look": {
     "skin": 3,
     "hair": 0,
     "hairColor": 3,
     "accessory": "hat",
     "bg": 7
    }
   },
   {
    "id": "D",
    "name": "Désiré",
    "gender": "m",
    "victim": true,
    "clues": [],
    "look": {
     "skin": 4,
     "hair": 8,
     "hairColor": 7,
     "accessory": "none",
     "bg": 3
    }
   }
  ],
  "solution": {
   "C": [
    0,
    2
   ],
   "E": [
    1,
    5
   ],
   "B": [
    2,
    1
   ],
   "A": [
    3,
    4
   ],
   "F": [
    4,
    3
   ],
   "D": [
    5,
    0
   ]
  }
 },
 {
  "id": "observatoire",
  "title": "L'observatoire",
  "intro": "À l'observatoire du Mont-Clair, la nuit des étoiles filantes a tourné court : l'astronome Léopold ne verra jamais la prochaine comète. Sept personnes avaient les yeux levés vers le ciel.",
  "difficulty": 2,
  "size": 7,
  "rooms": [
   {
    "key": "a",
    "name": "Coupole",
    "floor": "marble"
   },
   {
    "key": "b",
    "name": "Bibliothèque",
    "floor": "parquet"
   },
   {
    "key": "c",
    "name": "Jardin",
    "floor": "grass"
   },
   {
    "key": "d",
    "name": "Atelier",
    "floor": "concrete"
   },
   {
    "key": "e",
    "name": "Salle des cartes",
    "floor": "carpet"
   },
   {
    "key": "f",
    "name": "Terrasse",
    "floor": "stone"
   },
   {
    "key": "g",
    "name": "Hall",
    "floor": "tile"
   }
  ],
  "roomMap": [
   "aaabbcc",
   "aaabbcc",
   "dddbbcc",
   "dddeeee",
   "ffgeeee",
   "ffggggg",
   "ffggggg"
  ],
  "objects": [
   {
    "type": "telescope",
    "r": 1,
    "c": 1
   },
   {
    "type": "stool",
    "r": 0,
    "c": 2
   },
   {
    "type": "shelf",
    "r": 0,
    "c": 3
   },
   {
    "type": "armchair",
    "r": 2,
    "c": 3
   },
   {
    "type": "tree",
    "r": 0,
    "c": 6
   },
   {
    "type": "bench",
    "r": 1,
    "c": 5,
    "h": 2
   },
   {
    "type": "desk",
    "r": 2,
    "c": 0
   },
   {
    "type": "stool",
    "r": 3,
    "c": 0
   },
   {
    "type": "table",
    "r": 3,
    "c": 4
   },
   {
    "type": "chair",
    "r": 4,
    "c": 4
   },
   {
    "type": "deckchair",
    "r": 4,
    "c": 1
   },
   {
    "type": "bench",
    "r": 5,
    "c": 0,
    "h": 2
   },
   {
    "type": "sofa",
    "r": 5,
    "c": 3,
    "w": 2
   },
   {
    "type": "statue",
    "r": 6,
    "c": 6
   }
  ],
  "people": [
   {
    "id": "S",
    "name": "Séraphine",
    "gender": "f",
    "clues": [
     {
      "t": "on",
      "obj": "bench",
      "not": true
     }
    ],
    "look": {
     "skin": 3,
     "hair": 2,
     "hairColor": 3,
     "accessory": "bow",
     "bg": 2
    }
   },
   {
    "id": "B",
    "name": "Baltazar",
    "gender": "m",
    "clues": [
     {
      "t": "dir",
      "dir": "S",
      "of": {
       "who": "D"
      },
      "not": true
     },
     {
      "t": "on",
      "obj": "bench"
     }
    ],
    "look": {
     "skin": 2,
     "hair": 7,
     "hairColor": 7,
     "accessory": "beard",
     "bg": 7
    }
   },
   {
    "id": "D",
    "name": "Dorian",
    "gender": "m",
    "clues": [
     {
      "t": "with",
      "who": "B"
     }
    ],
    "look": {
     "skin": 0,
     "hair": 3,
     "hairColor": 4,
     "accessory": "none",
     "bg": 5
    }
   },
   {
    "id": "H",
    "name": "Hélène",
    "gender": "f",
    "clues": [
     {
      "t": "dir",
      "dir": "N",
      "of": {
       "who": "L"
      },
      "exact": 2
     },
     {
      "t": "with",
      "who": "J"
     }
    ],
    "look": {
     "skin": 1,
     "hair": 0,
     "hairColor": 1,
     "accessory": "scarf",
     "bg": 1
    }
   },
   {
    "id": "J",
    "name": "Jasmine",
    "gender": "f",
    "clues": [
     {
      "t": "sameRow",
      "obj": "stool",
      "not": true
     }
    ],
    "look": {
     "skin": 5,
     "hair": 9,
     "hairColor": 2,
     "accessory": "cap",
     "bg": 6
    }
   },
   {
    "id": "L",
    "name": "Léopold",
    "gender": "m",
    "victim": true,
    "clues": [],
    "look": {
     "skin": 4,
     "hair": 4,
     "hairColor": 6,
     "accessory": "none",
     "bg": 0
    }
   },
   {
    "id": "C",
    "name": "Cassandre",
    "gender": "f",
    "clues": [
     {
      "t": "beside",
      "obj": "bench"
     }
    ],
    "look": {
     "skin": 3,
     "hair": 5,
     "hairColor": 5,
     "accessory": "earrings",
     "bg": 4
    }
   }
  ],
  "solution": {
   "S": [
    0,
    2
   ],
   "B": [
    1,
    5
   ],
   "D": [
    2,
    6
   ],
   "H": [
    3,
    3
   ],
   "J": [
    4,
    4
   ],
   "L": [
    5,
    0
   ],
   "C": [
    6,
    1
   ]
  }
 }
];
