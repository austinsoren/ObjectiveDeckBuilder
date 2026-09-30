window.BATMAN_EQUIPMENT_DATA = {
  "title": "BMG3 Crew Equipment Lists",
  "source": "Official BMG app equipment lists (screenshots, 2026-09-30); Batman list from BMG3_COMPENDIUM_1-4_copy.pdf p.35",
  "lists": [
    {
      "id": "batman",
      "title": "Batman",
      "page": 35,
      "source": "compendium",
      "crews": [
        "Batman"
      ],
      "items": [
        {
          "id": "batman-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "batman-flashlight",
          "name": "Flashlight",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Lantern rule.",
          "grants": [
            {
              "label": "Lantern",
              "category": "trait",
              "referenceId": "4f7ab8ac4353"
            }
          ]
        },
        {
          "id": "batman-handcuffs",
          "name": "Handcuffs",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Arrest rule.",
          "grants": [
            {
              "label": "Arrest",
              "category": "trait",
              "referenceId": "71cbc9bf4c00"
            }
          ]
        },
        {
          "id": "batman-whistle",
          "name": "Whistle",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Halt/Stop rule.",
          "grants": [
            {
              "label": "Stop!",
              "category": "trait",
              "referenceId": "78cd065fcdb6"
            }
          ]
        },
        {
          "id": "batman-street-patrol",
          "name": "Street Patrol",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Street Guy rule.",
          "grants": [
            {
              "label": "Street Guy",
              "category": "trait",
              "referenceId": "c192091feb15"
            }
          ]
        },
        {
          "id": "batman-intensive-training",
          "name": "Intensive Training",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Teamwork:1 (All) rule.",
          "grants": [
            {
              "label": "Teamwork (1) (All)",
              "category": "trait",
              "referenceId": "be16b092069a"
            }
          ]
        },
        {
          "id": "batman-radio",
          "name": "Radio",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "This model is always treated as though it were within range of the Inspire rule.",
          "grants": []
        },
        {
          "id": "batman-antidote",
          "name": "Antidote",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model is immune to the Poison effect.",
          "grants": [
            {
              "label": "Poison Immunity",
              "category": "trait",
              "referenceId": "cdf43025ef85"
            }
          ]
        },
        {
          "id": "batman-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Batclaw/Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "batman-helmet",
          "name": "Helmet",
          "limit": [
            0,
            null
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Hardened rule.",
          "grants": [
            {
              "label": "Hardened",
              "category": "trait",
              "referenceId": "66759f738b75"
            }
          ]
        },
        {
          "id": "batman-patrol-training",
          "name": "Patrol Training",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Undercover rule.",
          "grants": [
            {
              "label": "Undercover",
              "category": "trait",
              "referenceId": "8b493a2bd056"
            }
          ]
        },
        {
          "id": "batman-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Gas Mask rule.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "batman-riot-gear",
          "name": "Riot Gear",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "The model gains the Football Gear rule.",
          "grants": [
            {
              "label": "Football Gear",
              "category": "trait",
              "referenceId": "9bf4acda2684"
            }
          ]
        },
        {
          "id": "batman-medic",
          "name": "Medic",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Medic rule.",
          "grants": [
            {
              "label": "Medic",
              "category": "trait",
              "referenceId": "a0931ae47021"
            }
          ]
        },
        {
          "id": "batman-swat-special-training",
          "name": "SWAT Special Training",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "If the model has the Elite (SWAT) trait, choose one: the model gains the Tracking rule, or the Precise Aim rule.",
          "grants": [],
          "only": {
            "traits": [
              "Elite (SWAT)",
              "Elite Boss (SWAT)"
            ]
          },
          "choices": [
            {
              "id": "tracking",
              "label": "Tracking",
              "grants": [
                {
                  "label": "Tracking",
                  "category": "trait",
                  "referenceId": "3e98c66ebeab"
                }
              ]
            },
            {
              "id": "precise-aim",
              "label": "Precise Aim",
              "grants": [
                {
                  "label": "Precise Aim",
                  "category": "trait",
                  "referenceId": "8ed47b2376a8"
                }
              ]
            }
          ]
        },
        {
          "id": "batman-upgraded-batsuit",
          "name": "Upgraded Batsuit",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains +1 to Endurance.",
          "grants": [],
          "requires": [
            "Bruce Wayne"
          ],
          "only": {
            "names": [
              "Bruce Wayne"
            ]
          },
          "statMods": {
            "endurance": 1
          }
        },
        {
          "id": "batman-kevlar-cowl",
          "name": "Kevlar Cowl",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 0,
          "description": "Model gains Immunity to CRT.",
          "grants": [],
          "requires": [
            "Bruce Wayne"
          ],
          "only": {
            "names": [
              "Bruce Wayne"
            ]
          }
        },
        {
          "id": "batman-emp",
          "name": "EMP",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the EMP rule.",
          "grants": [
            {
              "label": "EMP",
              "category": "trait",
              "referenceId": "394edd21e804"
            }
          ],
          "requires": [
            "Bruce Wayne"
          ]
        },
        {
          "id": "batman-batman-inc",
          "name": "Batman Inc.",
          "limit": [
            0,
            1
          ],
          "cost": 400,
          "rep": 3,
          "description": "Model gains the Bat-Armor MKII rule. A model cannot have more than one Bat-Armor rule.",
          "grants": [
            {
              "label": "Bat-Armor Mk II",
              "category": "trait",
              "referenceId": "156514811f78"
            }
          ],
          "requires": [
            "Bruce Wayne"
          ],
          "only": {
            "ranks": [
              "Sidekick",
              "Free Agent"
            ]
          }
        },
        {
          "id": "batman-martial-arts-training",
          "name": "Martial Arts Training",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 2,
          "description": "Model gains the Martial Artist rule.",
          "grants": [
            {
              "label": "Martial Artist",
              "category": "trait",
              "referenceId": "cec3234fbb32"
            }
          ],
          "requires": [
            "Bruce Wayne"
          ],
          "only": {
            "ranks": [
              "Sidekick",
              "Free Agent"
            ]
          }
        },
        {
          "id": "batman-mentor",
          "name": "Mentor",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 3,
          "description": "Model gains the Hidden Boss rule.",
          "grants": [
            {
              "label": "Hidden Boss",
              "category": "trait",
              "referenceId": "dbd781d09937"
            }
          ],
          "requires": [
            "Bruce Wayne"
          ],
          "only": {
            "ranks": [
              "Sidekick",
              "Free Agent"
            ]
          }
        },
        {
          "id": "batman-hidden-magazine",
          "name": "Hidden Magazine",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": [],
          "requires": [
            "Bruce Wayne"
          ],
          "only": {
            "ranks": [
              "Sidekick",
              "Leader"
            ]
          }
        },
        {
          "id": "batman-morality",
          "name": "Morality",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Moral Compass and Demotivate rules.",
          "grants": [
            {
              "label": "Moral Compass",
              "category": "trait",
              "referenceId": "4785b5d695e1"
            },
            {
              "label": "Demotivate",
              "category": "trait",
              "referenceId": "baeea8302f0e"
            }
          ],
          "requires": [
            "Bruce Wayne"
          ],
          "only": {
            "names": [
              "Batman"
            ]
          }
        },
        {
          "id": "batman-circus-training",
          "name": "Circus Training",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 5,
          "description": "Model gains the Acrobat rule.",
          "grants": [
            {
              "label": "Acrobat",
              "category": "trait",
              "referenceId": "064175029813"
            }
          ],
          "requires": [
            "Dick Grayson"
          ]
        },
        {
          "id": "batman-runner",
          "name": "Runner",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Tireless rule.",
          "grants": [
            {
              "label": "Tireless",
              "category": "trait",
              "referenceId": "a325e40c6dc6"
            }
          ],
          "requires": [
            "Dick Grayson"
          ]
        },
        {
          "id": "batman-command-center-support",
          "name": "Command Center Support",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 0,
          "description": "Model gains the Scheming:2 rule.",
          "grants": [
            {
              "label": "Scheming (2)",
              "category": "trait",
              "referenceId": "215177580b82"
            }
          ],
          "requires": [
            "Oliver Queen"
          ]
        },
        {
          "id": "batman-tactical-gloves",
          "name": "Tactical Gloves",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Reinforced Gloves rule.",
          "grants": [
            {
              "label": "Reinforced Gloves",
              "category": "trait",
              "referenceId": "41763ca70c77"
            }
          ],
          "requires": [
            "Oliver Queen"
          ],
          "only": {
            "names": [
              "Oliver Queen"
            ]
          }
        },
        {
          "id": "batman-hi-tech-ammo",
          "name": "Hi-Tech Ammo",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 2,
          "description": "One of the model's ranged weapons gains Bleed:2.",
          "grants": [
            {
              "label": "Bleed (2)",
              "category": "weapon",
              "referenceId": "d31de59da4e9"
            }
          ],
          "requires": [
            "Roy Harper"
          ]
        },
        {
          "id": "batman-officer-training",
          "name": "Officer Training",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 2,
          "description": "Model gains the Follow Me! rule.",
          "grants": [
            {
              "label": "Follow Me!",
              "category": "trait",
              "referenceId": "ef127668c76c"
            }
          ],
          "requires": [
            "Kathy Kane"
          ]
        },
        {
          "id": "batman-inspiring-presence",
          "name": "Inspiring Presence",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 0,
          "description": "Model gains the Leadership rule.",
          "grants": [
            {
              "label": "Leadership",
              "category": "trait",
              "referenceId": "c1a7bdee76b4"
            }
          ],
          "requires": [
            "Tim Drake"
          ],
          "only": {
            "names": [
              "Tim Drake"
            ]
          }
        },
        {
          "id": "batman-oracle",
          "name": "Oracle",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Exhaustive Planner rule.",
          "grants": [
            {
              "label": "Exhaustive Planner",
              "category": "trait",
              "referenceId": "f621cfe6f864"
            }
          ],
          "requires": [
            "Barbara Gordon"
          ],
          "only": {
            "names": [
              "Batgirl"
            ]
          }
        },
        {
          "id": "batman-deadly-weapons",
          "name": "Deadly Weapons",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 2,
          "description": "The model's weapons gain the Silencer rule.",
          "grants": [
            {
              "label": "Silencer",
              "category": "weapon",
              "referenceId": "ddda80ab0d50"
            }
          ],
          "requires": [
            "Red Hood (Arkham Knight)"
          ],
          "only": {
            "names": [
              "Red Hood (Arkham Knight)"
            ]
          }
        },
        {
          "id": "batman-heliport",
          "name": "Heliport",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "When you use the Air Support rule, target an enemy model affected by the template: the target receives a Ranged attack with ROF 1, the Firearm weapon special rule and damage [[A]] [[A]] which ignores the Cover rule.",
          "grants": [],
          "requires": [
            "James Gordon"
          ],
          "only": {
            "names": [
              "James Gordon"
            ]
          },
          "unbreakable": true
        },
        {
          "id": "batman-sergeant-training",
          "name": "Sergeant Training",
          "limit": [
            0,
            2
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Order rule.",
          "grants": [
            {
              "label": "Order",
              "category": "trait",
              "referenceId": "1b98804a8f45"
            }
          ],
          "requires": [
            "James Gordon"
          ],
          "unbreakable": true
        },
        {
          "id": "batman-feline-stalk",
          "name": "Feline Stalk",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Tracking rule.",
          "grants": [
            {
              "label": "Tracking",
              "category": "trait",
              "referenceId": "3e98c66ebeab"
            }
          ],
          "requires": [
            "Selina Kyle"
          ],
          "unbreakable": true
        }
      ]
    },
    {
      "id": "police",
      "title": "Police",
      "page": null,
      "source": "official-app",
      "crews": [
        "Police"
      ],
      "items": [
        {
          "id": "police-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "police-flashlight",
          "name": "Flashlight",
          "limit": [
            0,
            2
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Lantern rule.",
          "grants": [
            {
              "label": "Lantern",
              "category": "trait",
              "referenceId": "4f7ab8ac4353"
            }
          ]
        },
        {
          "id": "police-handcuffs",
          "name": "Handcuffs",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Arrest rule.",
          "grants": [
            {
              "label": "Arrest",
              "category": "trait",
              "referenceId": "71cbc9bf4c00"
            }
          ]
        },
        {
          "id": "police-whistle",
          "name": "Whistle",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Halt/Stop rule.",
          "grants": [
            {
              "label": "Stop!",
              "category": "trait",
              "referenceId": "78cd065fcdb6"
            }
          ]
        },
        {
          "id": "police-street-patrol",
          "name": "Street Patrol",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Street Guy rule.",
          "grants": [
            {
              "label": "Street Guy",
              "category": "trait",
              "referenceId": "c192091feb15"
            }
          ]
        },
        {
          "id": "police-intensive-training",
          "name": "Intensive Training",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Teamwork (1) (All) rule.",
          "grants": [
            {
              "label": "Teamwork (1) (All)",
              "category": "trait",
              "referenceId": "be16b092069a"
            }
          ]
        },
        {
          "id": "police-radio",
          "name": "Radio",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "This model is always treated as though it were within range of its Boss's Inspire trait.",
          "grants": []
        }
      ]
    },
    {
      "id": "joker",
      "title": "Joker",
      "page": null,
      "source": "official-app",
      "crews": [
        "Joker"
      ],
      "items": [
        {
          "id": "joker-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "joker-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            2
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Batclaw/Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "joker-clown-paint",
          "name": "Clown Paint",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Distract rule.",
          "grants": [
            {
              "label": "Distract",
              "category": "trait",
              "referenceId": "bad9e3c5e26f"
            }
          ]
        },
        {
          "id": "joker-flare",
          "name": "Flare",
          "limit": [
            0,
            2
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Flare rule.",
          "grants": [
            {
              "label": "Flare",
              "category": "trait",
              "referenceId": "be622e07d740"
            }
          ]
        },
        {
          "id": "joker-neurotoxic-drugs",
          "name": "Neurotoxic Drugs",
          "limit": [
            0,
            2
          ],
          "cost": 250,
          "rep": 0,
          "description": "Model gains +2 Movement and the Dodge trait.",
          "grants": [
            {
              "label": "Dodge",
              "category": "trait",
              "referenceId": "878bcec18852"
            }
          ],
          "statMods": {
            "movement": 2
          }
        },
        {
          "id": "joker-improvised-armor",
          "name": "Improvised Armor",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Hockey Gear rule.",
          "grants": [
            {
              "label": "Hockey Gear",
              "category": "trait",
              "referenceId": "e1155c7b07e1"
            }
          ]
        },
        {
          "id": "joker-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Gas Mask rule.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "joker-antidote",
          "name": "Antidote",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model is immune to the Poison status.",
          "grants": [
            {
              "label": "Poison Immunity",
              "category": "trait",
              "referenceId": "cdf43025ef85"
            }
          ]
        },
        {
          "id": "joker-poison-training",
          "name": "Poison Training",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Poison Master trait.",
          "grants": [
            {
              "label": "Poison Master",
              "category": "trait",
              "referenceId": "f7dfe76de6d0"
            }
          ]
        },
        {
          "id": "joker-mental-torture",
          "name": "Mental Torture",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Aggressive Schizophrenia trait.",
          "grants": [
            {
              "label": "Aggressive Schizophrenia",
              "category": "trait",
              "referenceId": "851878352cfe"
            }
          ]
        },
        {
          "id": "joker-joker-s-gas",
          "name": "Joker's Gas",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Joker's Gas trait.",
          "grants": [
            {
              "label": "Joker's Gas",
              "category": "trait",
              "referenceId": null
            }
          ]
        },
        {
          "id": "joker-nerve-gas",
          "name": "Nerve Gas",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Sturdy rule.",
          "grants": [
            {
              "label": "Sturdy",
              "category": "trait",
              "referenceId": "355b63308a99"
            }
          ],
          "requires": [
            "Joker"
          ]
        },
        {
          "id": "joker-sexy-costume",
          "name": "Sexy Costume",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 5,
          "description": "Model gains the Disarray rule.",
          "grants": [
            {
              "label": "Disarray",
              "category": "trait",
              "referenceId": "220dbf9d7019"
            }
          ],
          "requires": [
            "Harleen Quinzel"
          ]
        },
        {
          "id": "joker-pole-dancer",
          "name": "Pole Dancer",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Escape Artist rule.",
          "grants": [
            {
              "label": "Escape Artist",
              "category": "trait",
              "referenceId": "1280b59ff66b"
            }
          ],
          "requires": [
            "Harleen Quinzel"
          ]
        },
        {
          "id": "joker-enhanced-gas",
          "name": "Enhanced Gas",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "When an enemy model within 8\" of this model suffers the Enervating effect, it is increased by +1.",
          "grants": [],
          "requires": [
            "Gaggy"
          ],
          "only": {
            "ranks": [
              "Leader",
              "Sidekick"
            ]
          }
        },
        {
          "id": "joker-rusty-tools",
          "name": "Rusty Tools",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 2,
          "description": "Model gains the Cruel rule.",
          "grants": [
            {
              "label": "Cruel",
              "category": "trait",
              "referenceId": "69ca0ab2e141"
            }
          ],
          "requires": [
            "Duela Dent"
          ]
        },
        {
          "id": "joker-brutal-training",
          "name": "Brutal Training",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Savage Fighter rule.",
          "grants": [
            {
              "label": "Savage Fighter",
              "category": "trait",
              "referenceId": "c14cc29ebb3e"
            }
          ],
          "requires": [
            "Mr. Hammer"
          ]
        }
      ]
    },
    {
      "id": "penguin",
      "title": "Penguin",
      "page": null,
      "source": "official-app",
      "crews": [
        "Penguin"
      ],
      "groups": {
        "iceberg-lounge": {
          "label": "Iceberg Lounge options",
          "limit": 1
        }
      },
      "items": [
        {
          "id": "penguin-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "penguin-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Batclaw/Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "penguin-laser-sight",
          "name": "Laser Sight",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Laser Sight rule.",
          "grants": [
            {
              "label": "Laser Sight",
              "category": "trait",
              "referenceId": "da40a4b853bd"
            }
          ]
        },
        {
          "id": "penguin-camo-vest",
          "name": "Camo Vest",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Stealth rule.",
          "grants": [
            {
              "label": "Stealth",
              "category": "trait",
              "referenceId": "e049d117e0e7"
            }
          ]
        },
        {
          "id": "penguin-c4",
          "name": "C4",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Explosive Gel trait.",
          "grants": [
            {
              "label": "Explosive Gel",
              "category": "trait",
              "referenceId": "05d5a588cbe1"
            }
          ]
        },
        {
          "id": "penguin-radio",
          "name": "Radio",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "This model is always treated as though it were within range of its Boss's Inspire trait.",
          "grants": []
        },
        {
          "id": "penguin-backpack",
          "name": "Backpack",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Backpack rule.",
          "grants": [
            {
              "label": "Backpack",
              "category": "trait",
              "referenceId": "7a868972ac87"
            }
          ]
        },
        {
          "id": "penguin-biker-jacket",
          "name": "Biker Jacket",
          "limit": [
            0,
            3
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Hockey Gear trait.",
          "grants": [
            {
              "label": "Hockey Gear",
              "category": "trait",
              "referenceId": "e1155c7b07e1"
            }
          ]
        },
        {
          "id": "penguin-helmet",
          "name": "Helmet",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Hardened trait.",
          "grants": [
            {
              "label": "Hardened",
              "category": "trait",
              "referenceId": "66759f738b75"
            }
          ]
        },
        {
          "id": "penguin-raised-on-the-streets",
          "name": "Raised on the Streets",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Plead trait.",
          "grants": [
            {
              "label": "Plead",
              "category": "trait",
              "referenceId": "79c0ca8c0cfc"
            }
          ]
        },
        {
          "id": "penguin-ostentatious-clothes",
          "name": "Ostentatious Clothes",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Goad rule.",
          "grants": [
            {
              "label": "Goad",
              "category": "trait",
              "referenceId": "5646830ec6e7"
            }
          ],
          "requires": [
            "Oswald C. Cobblepot"
          ]
        },
        {
          "id": "penguin-trained-mobsters",
          "name": "Trained Mobsters",
          "limit": [
            0,
            2
          ],
          "cost": 250,
          "rep": 2,
          "description": "Model gains +2 Endurance.",
          "grants": [],
          "requires": [
            "Emperor Penguin"
          ],
          "statMods": {
            "endurance": 2
          }
        },
        {
          "id": "penguin-neurotoxic-drugs-iceberg-lounge",
          "name": "Neurotoxic Drugs (Iceberg Lounge)",
          "limit": [
            0,
            1
          ],
          "cost": 500,
          "rep": 0,
          "description": "Model gains +2 Movement and the Dodge trait.",
          "grants": [
            {
              "label": "Dodge",
              "category": "trait",
              "referenceId": "878bcec18852"
            }
          ],
          "statMods": {
            "movement": 2
          },
          "group": "iceberg-lounge",
          "requiresBossTrait": "Iceberg Lounge"
        },
        {
          "id": "penguin-silencer-iceberg-lounge",
          "name": "Silencer (Iceberg Lounge)",
          "limit": [
            0,
            1
          ],
          "cost": 400,
          "rep": 0,
          "description": "One of the model's ranged weapons gains the Silencer trait.",
          "grants": [
            {
              "label": "Silencer",
              "category": "weapon",
              "referenceId": "ddda80ab0d50"
            }
          ],
          "group": "iceberg-lounge",
          "requiresBossTrait": "Iceberg Lounge"
        },
        {
          "id": "penguin-weird-ammo-iceberg-lounge",
          "name": "Weird Ammo (Iceberg Lounge)",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model's ranged attacks gain either the Enervating 2 or Anti-tank trait.",
          "grants": [],
          "group": "iceberg-lounge",
          "requiresBossTrait": "Iceberg Lounge",
          "choices": [
            {
              "id": "enervating-2",
              "label": "Enervating 2",
              "grants": [
                {
                  "label": "Enervating (2)",
                  "category": "weapon",
                  "referenceId": "785acdb8acf2"
                }
              ]
            },
            {
              "id": "anti-tank",
              "label": "Anti-Tank",
              "grants": [
                {
                  "label": "Anti-Tank",
                  "category": "weapon",
                  "referenceId": "33561f3cb0ac"
                }
              ]
            }
          ]
        },
        {
          "id": "penguin-mutation-serum-iceberg-lounge",
          "name": "Mutation Serum (Iceberg Lounge)",
          "limit": [
            0,
            1
          ],
          "cost": 500,
          "rep": 0,
          "description": "Model gains the Tough Skin and Desensitized traits.",
          "grants": [
            {
              "label": "Tough Skin",
              "category": "trait",
              "referenceId": "62bb0e262687"
            },
            {
              "label": "Desensitized",
              "category": "trait",
              "referenceId": "ea9daf6f702e"
            }
          ],
          "group": "iceberg-lounge",
          "requiresBossTrait": "Iceberg Lounge"
        },
        {
          "id": "penguin-fear-gas-dispenser-iceberg-lounge",
          "name": "Fear Gas Dispenser (Iceberg Lounge)",
          "limit": [
            0,
            1
          ],
          "cost": 600,
          "rep": 0,
          "description": "Model gains the Inspire Fear trait.",
          "grants": [
            {
              "label": "Inspire Fear",
              "category": "trait",
              "referenceId": "03cc1a8b87f9"
            }
          ],
          "group": "iceberg-lounge",
          "requiresBossTrait": "Iceberg Lounge"
        },
        {
          "id": "penguin-titan-dose-iceberg-lounge",
          "name": "Titan Dose (Iceberg Lounge)",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains one Titan Dose.",
          "grants": [
            {
              "label": "Titan Dose (1)",
              "category": "trait",
              "referenceId": "116fc80a6d20"
            }
          ],
          "stacks": true,
          "group": "iceberg-lounge",
          "requiresBossTrait": "Iceberg Lounge"
        },
        {
          "id": "penguin-prototype-freeze-ray-iceberg-lounge",
          "name": "Prototype Freeze Ray (Iceberg Lounge)",
          "limit": [
            0,
            1
          ],
          "cost": 500,
          "rep": 0,
          "description": "Model gains the Ice Flash trait.",
          "grants": [
            {
              "label": "Ice Flash",
              "category": "trait",
              "referenceId": "0dc2884b56bd"
            }
          ],
          "group": "iceberg-lounge",
          "requiresBossTrait": "Iceberg Lounge"
        }
      ]
    },
    {
      "id": "bane-soldiers-of-fortune",
      "title": "Bane (Soldiers of Fortune)",
      "page": null,
      "source": "official-app",
      "crews": [
        "Bane"
      ],
      "items": [
        {
          "id": "bane-soldiers-of-fortune-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "bane-soldiers-of-fortune-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            2
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Batclaw/Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-titan-dose",
          "name": "Titan Dose",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains one Titan Dose.",
          "grants": [
            {
              "label": "Titan Dose (1)",
              "category": "trait",
              "referenceId": "116fc80a6d20"
            }
          ],
          "stacks": true
        },
        {
          "id": "bane-soldiers-of-fortune-night-vision-goggles",
          "name": "Night Vision Goggles",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Night Vision rule.",
          "grants": [
            {
              "label": "Night Vision",
              "category": "trait",
              "referenceId": "438f95953a49"
            }
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-venom-dose",
          "name": "Venom Dose",
          "limit": [
            0,
            3
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains one Venom Dose.",
          "grants": [
            {
              "label": "Venom Dose (1)",
              "category": "trait",
              "referenceId": "180dd25b2ae2"
            }
          ],
          "stacks": true
        },
        {
          "id": "bane-soldiers-of-fortune-backpack",
          "name": "Backpack",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Backpack rule.",
          "grants": [
            {
              "label": "Backpack",
              "category": "trait",
              "referenceId": "7a868972ac87"
            }
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-antidote",
          "name": "Antidote",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model is immune to the Poison status.",
          "grants": [
            {
              "label": "Poison Immunity",
              "category": "trait",
              "referenceId": "cdf43025ef85"
            }
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-neurotoxic-drugs",
          "name": "Neurotoxic Drugs",
          "limit": [
            0,
            2
          ],
          "cost": 250,
          "rep": 0,
          "description": "Model gains +2 Movement and the Dodge trait.",
          "grants": [
            {
              "label": "Dodge",
              "category": "trait",
              "referenceId": "878bcec18852"
            }
          ],
          "statMods": {
            "movement": 2
          }
        },
        {
          "id": "bane-soldiers-of-fortune-camo-vest",
          "name": "Camo Vest",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Stealth rule.",
          "grants": [
            {
              "label": "Stealth",
              "category": "trait",
              "referenceId": "e049d117e0e7"
            }
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            3
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Gas Mask rule.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-war-hardened",
          "name": "War Hardened",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Cruel trait.",
          "grants": [
            {
              "label": "Cruel",
              "category": "trait",
              "referenceId": "69ca0ab2e141"
            }
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-handcuffs",
          "name": "Handcuffs",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Arrest rule.",
          "grants": [
            {
              "label": "Arrest",
              "category": "trait",
              "referenceId": "71cbc9bf4c00"
            }
          ],
          "requires": [
            "Bane"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-venom-laboratory",
          "name": "Venom Laboratory",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 5,
          "description": "All models in your crew can use more than 1 Titan Dose per game. This bonus remains in play even if this model is removed from play or leaves the board. Also, the cost of Venom Doses in the equipment list is reduced to $50.",
          "grants": [],
          "requires": [
            "Bane"
          ],
          "only": {
            "ranks": [
              "Leader",
              "Sidekick"
            ]
          },
          "unbreakable": true
        },
        {
          "id": "bane-soldiers-of-fortune-venom-applicator",
          "name": "Venom Applicator",
          "limit": [
            0,
            2
          ],
          "cost": 0,
          "rep": 2,
          "description": "This model can use Titan and Venom Doses on a friendly model in contact.",
          "grants": [],
          "requires": [
            "Bane"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-military-progress",
          "name": "Military Progress",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Veteran rule.",
          "grants": [
            {
              "label": "Veteran",
              "category": "trait",
              "referenceId": "4080d5bbb2e9"
            }
          ],
          "requires": [
            "Bird"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-dual-handguns",
          "name": "Dual Handguns",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 7,
          "description": "Model gains the Rapid Fire trait and the following weapon: Dual Handguns — [[B]] [[A]], ROF 4, Ammo 3, S. Range / Firearm / Light / Assault.",
          "grants": [
            {
              "label": "Rapid Fire",
              "category": "trait",
              "referenceId": "e2d27545c13a"
            }
          ],
          "requires": [
            "Thomas Wayne"
          ],
          "only": {
            "names": [
              "Thomas Wayne"
            ]
          },
          "unbreakable": true
        },
        {
          "id": "bane-soldiers-of-fortune-surgeon-training",
          "name": "Surgeon Training",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Medic trait.",
          "grants": [
            {
              "label": "Medic",
              "category": "trait",
              "referenceId": "a0931ae47021"
            }
          ],
          "requires": [
            "Thomas Wayne"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-fear-gas-dispenser",
          "name": "Fear Gas Dispenser",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Inspire Fear rule.",
          "grants": [
            {
              "label": "Inspire Fear",
              "category": "trait",
              "referenceId": "03cc1a8b87f9"
            }
          ],
          "requires": [
            "Scarecrow (Arkham Knight)"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-secret-laboratory",
          "name": "Secret Laboratory",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 2,
          "description": "At the start of the game you can choose up to 2 Henchmen in your crew. These models let you use Scarecrow's Inspire Fear from their position as if Scarecrow were placed there. The Willpower roll caused by any Inspire Fear suffers a +1 penalty.",
          "grants": [],
          "requires": [
            "Scarecrow (Arkham Knight)"
          ],
          "only": {
            "names": [
              "Scarecrow"
            ]
          },
          "unbreakable": true
        },
        {
          "id": "bane-soldiers-of-fortune-radio",
          "name": "Radio",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "This model is always treated as though it were within range of the Inspire rule.",
          "grants": [],
          "requires": [
            "Jason Todd"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-hidden-magazines",
          "name": "Hidden Magazines",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 Magazines to one weapon.",
          "grants": [],
          "requires": [
            "Jason Todd"
          ],
          "only": {
            "names": [
              "Jason Todd"
            ]
          }
        },
        {
          "id": "bane-soldiers-of-fortune-cybernetic-arms",
          "name": "Cybernetic Arms",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Reinforced Gloves rule.",
          "grants": [
            {
              "label": "Reinforced Gloves",
              "category": "trait",
              "referenceId": "41763ca70c77"
            }
          ],
          "requires": [
            "Jason Todd"
          ],
          "only": {
            "names": [
              "Jason Todd"
            ]
          }
        },
        {
          "id": "bane-soldiers-of-fortune-arkham-knight-secret-armoury",
          "name": "Arkham Knight Secret Armoury",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "One ranged weapon of this model gains the Acid rule.",
          "grants": [
            {
              "label": "Acid",
              "category": "weapon",
              "referenceId": "cddf28ac626e"
            }
          ],
          "requires": [
            "Jason Todd"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-hook-pistol",
          "name": "Hook Pistol",
          "limit": [
            0,
            1
          ],
          "cost": 400,
          "rep": 0,
          "description": "Gains the Grapple Gun and the following ranged weapon: Electric Hook — [[B]] [[B]], RoF 1, Ammo 2, S. Range / Mechanical / Electric / Devastating.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ],
          "requires": [
            "Jason Todd"
          ],
          "only": {
            "names": [
              "Jason Todd"
            ],
            "bossOnly": true
          }
        },
        {
          "id": "bane-soldiers-of-fortune-martial-training",
          "name": "Martial Training",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Martial Artist and Master Fighter rules.",
          "grants": [
            {
              "label": "Martial Artist",
              "category": "trait",
              "referenceId": "cec3234fbb32"
            },
            {
              "label": "Master Fighter",
              "category": "trait",
              "referenceId": "584e05c38f8a"
            }
          ],
          "requires": [
            "Slade Wilson"
          ]
        },
        {
          "id": "bane-soldiers-of-fortune-contract",
          "name": "Contract",
          "limit": [
            0,
            1
          ],
          "cost": 0,
          "rep": 0,
          "description": "Slade Wilson gains the rank Sidekick of Bane.",
          "grants": [],
          "requires": [
            "Slade Wilson"
          ],
          "only": {
            "names": [
              "Slade Wilson"
            ]
          },
          "unbreakable": true
        }
      ]
    },
    {
      "id": "court-of-owls",
      "title": "Court of Owls",
      "page": null,
      "source": "official-app",
      "crews": [],
      "items": [
        {
          "id": "court-of-owls-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "court-of-owls-climbing-claws",
          "name": "Climbing Claws",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Climbing Claws rule.",
          "grants": [
            {
              "label": "Climbing Claws",
              "category": "trait",
              "referenceId": "3c65f86d0341"
            }
          ]
        },
        {
          "id": "court-of-owls-antidote",
          "name": "Antidote",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model is immune to the Poison effect.",
          "grants": [
            {
              "label": "Poison Immunity",
              "category": "trait",
              "referenceId": "cdf43025ef85"
            }
          ]
        },
        {
          "id": "court-of-owls-camo-vest",
          "name": "Camo Vest",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Stealth rule.",
          "grants": [
            {
              "label": "Stealth",
              "category": "trait",
              "referenceId": "e049d117e0e7"
            }
          ]
        },
        {
          "id": "court-of-owls-c-4",
          "name": "C-4",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Explosive Gel rule.",
          "grants": [
            {
              "label": "Explosive Gel",
              "category": "trait",
              "referenceId": "05d5a588cbe1"
            }
          ]
        },
        {
          "id": "court-of-owls-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Gas Mask rule.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "court-of-owls-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            1
          ],
          "cost": 400,
          "rep": 0,
          "description": "Model gains the Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "court-of-owls-ancient-weapon",
          "name": "Ancient Weapon",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "The model's Close Combat weapon attacks gain Bleed (1).",
          "grants": [
            {
              "label": "Bleed (1)",
              "category": "weapon",
              "referenceId": "d31de59da4e9"
            }
          ]
        },
        {
          "id": "court-of-owls-genetic-alteration",
          "name": "Genetic Alteration",
          "limit": [
            0,
            3
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains +2 Movement.",
          "grants": [],
          "statMods": {
            "movement": 2
          }
        },
        {
          "id": "court-of-owls-hunter-training",
          "name": "Hunter Training",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Sneaking rule.",
          "grants": [
            {
              "label": "Sneaking",
              "category": "trait",
              "referenceId": "8719f3f0a191"
            }
          ]
        },
        {
          "id": "court-of-owls-ancient-training",
          "name": "Ancient Training",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Master Fighter rule.",
          "grants": [
            {
              "label": "Master Fighter",
              "category": "trait",
              "referenceId": "584e05c38f8a"
            }
          ]
        },
        {
          "id": "court-of-owls-circus-grooming",
          "name": "Circus Grooming",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Combat Flip rule.",
          "grants": [
            {
              "label": "Combat Flip",
              "category": "trait",
              "referenceId": "f05e05d943aa"
            }
          ]
        },
        {
          "id": "court-of-owls-lords-of-gotham",
          "name": "Lords of Gotham",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "This model's crew generates 1 extra Sewer marker.",
          "grants": [],
          "requires": [
            "The Court"
          ],
          "only": {
            "names": [
              "The Court"
            ]
          }
        },
        {
          "id": "court-of-owls-talon-serum-infusion",
          "name": "Talon Serum Infusion",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Once per game, at the start of the Raise the Plan phase, choose up to three friendly models with the Reanimated Owl trait. Those models gain 1 additional Strength die to their attacks until the end of the round, but then at the Recovering phase (when resolving effects) suffer 1 [[A]].",
          "grants": [],
          "requires": [
            "Lincoln March"
          ],
          "only": {
            "names": [
              "Lincoln March"
            ]
          }
        }
      ]
    },
    {
      "id": "riddler",
      "title": "Riddler",
      "page": null,
      "source": "official-app",
      "crews": [
        "Riddler"
      ],
      "items": [
        {
          "id": "riddler-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "riddler-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            2
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "riddler-mirror-games",
          "name": "Mirror Games",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Magic Tricks trait.",
          "grants": [
            {
              "label": "Magic Tricks",
              "category": "trait",
              "referenceId": null
            }
          ]
        },
        {
          "id": "riddler-enigma-data-pack",
          "name": "Enigma Data-Pack",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Bluff trait.",
          "grants": [
            {
              "label": "Bluff",
              "category": "trait",
              "referenceId": "337657ab8e90"
            }
          ]
        },
        {
          "id": "riddler-broken-equipment",
          "name": "Broken Equipment",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 0,
          "description": "Before Phase A of the pre-game sequence choose one item of equipment purchased by the opposing player before the game begins. That item may not be used during the game.",
          "grants": []
        },
        {
          "id": "riddler-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Gas Mask rule.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "riddler-another-one",
          "name": "Another One!",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Drop a Riddle trait.",
          "grants": [
            {
              "label": "Drop a Riddle",
              "category": "trait",
              "referenceId": "caf649617b35"
            }
          ]
        },
        {
          "id": "riddler-level-up",
          "name": "Level Up",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "At the start of your first Raise the Plan phase, you may place up to 2 friendly Suspect markers at least 4\" away from your Deployment zone.",
          "grants": [],
          "only": {
            "names": [
              "Riddler"
            ]
          }
        },
        {
          "id": "riddler-it-s-a-dud",
          "name": "It's a Dud",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "At the start of this model's activation you may remove 1 Riddle marker from the Gaming Area.",
          "grants": [],
          "only": {
            "names": [
              "Quelle"
            ]
          }
        },
        {
          "id": "riddler-inspiration",
          "name": "Inspiration",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "When this model plays an Objective card, it may immediately search your Objective deck for 1 card and add it to its controller's hand (instead of replenishing that played card).",
          "grants": [],
          "only": {
            "names": [
              "Echo"
            ]
          }
        },
        {
          "id": "riddler-weird-ammo",
          "name": "Weird Ammo",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "This model chooses one: Enervating (2) or Anti-Tank. Its ranged weapons gain that rule.",
          "grants": [],
          "only": {
            "names": [
              "Query"
            ]
          },
          "choices": [
            {
              "id": "enervating-2",
              "label": "Enervating 2",
              "grants": [
                {
                  "label": "Enervating (2)",
                  "category": "weapon",
                  "referenceId": "785acdb8acf2"
                }
              ]
            },
            {
              "id": "anti-tank",
              "label": "Anti-Tank",
              "grants": [
                {
                  "label": "Anti-Tank",
                  "category": "weapon",
                  "referenceId": "33561f3cb0ac"
                }
              ]
            }
          ]
        },
        {
          "id": "riddler-battle-bot",
          "name": "Battle Bot",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 3,
          "description": "Model gains the Claws rule.",
          "grants": [
            {
              "label": "Claws",
              "category": "trait",
              "referenceId": "ab7ce1945918"
            }
          ],
          "only": {
            "traits": [
              "Bot"
            ]
          }
        },
        {
          "id": "riddler-shock-droid",
          "name": "Shock Droid",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the CRT: Stunned rule.",
          "grants": [
            {
              "label": "CRT (Stunned)",
              "category": "weapon",
              "referenceId": "886b15da2b74"
            }
          ],
          "only": {
            "traits": [
              "Bot"
            ]
          }
        },
        {
          "id": "riddler-improved-chassis-mk",
          "name": "Improved Chassis MK",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "The model gains the Tireless rule.",
          "grants": [
            {
              "label": "Tireless",
              "category": "trait",
              "referenceId": "a325e40c6dc6"
            }
          ],
          "only": {
            "traits": [
              "Bot"
            ]
          }
        },
        {
          "id": "riddler-improved-armor",
          "name": "Improved Armor",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 2,
          "description": "Bots in your crew gain the Light Armor trait.",
          "grants": [],
          "requires": [
            "The Riddler (Arkham Knight)",
            "The Riddler's Mech (Arkham Knight)"
          ],
          "only": {
            "names": [
              "Riddler"
            ]
          },
          "unbreakable": true
        },
        {
          "id": "riddler-enhanced-servo-engines",
          "name": "Enhanced Servo-engines",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Riddler's Mech gains +1 to Movement and Combo: Mechanic Claw.",
          "grants": [],
          "requires": [
            "The Riddler (Arkham Knight)",
            "The Riddler's Mech (Arkham Knight)"
          ],
          "only": {
            "names": [
              "Riddler's Mech"
            ]
          },
          "unbreakable": true,
          "statMods": {
            "movement": 1
          }
        }
      ]
    },
    {
      "id": "mr-freeze",
      "title": "Mr. Freeze",
      "page": null,
      "source": "official-app",
      "crews": [
        "Freeze"
      ],
      "items": [
        {
          "id": "mr-freeze-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "mr-freeze-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "mr-freeze-cryo-grenade",
          "name": "Cryo-Grenade",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Cryo-Grenade rule.",
          "grants": [
            {
              "label": "Cryo-Grenade",
              "category": "trait",
              "referenceId": "729cca38e6c7"
            }
          ]
        },
        {
          "id": "mr-freeze-med-pack",
          "name": "Med-pack",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Once per game remove 2 Damage markers from a model in contact with this model.",
          "grants": []
        },
        {
          "id": "mr-freeze-scope",
          "name": "Scope",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "One of the model's ranged weapons gains the Scope rule.",
          "grants": [
            {
              "label": "Scope",
              "category": "weapon",
              "referenceId": "898eae1c1f8e"
            }
          ]
        },
        {
          "id": "mr-freeze-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Gas Mask rule.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "mr-freeze-cool-generator",
          "name": "Cool Generator",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Stop! rule.",
          "grants": [
            {
              "label": "Stop!",
              "category": "trait",
              "referenceId": "78cd065fcdb6"
            }
          ]
        },
        {
          "id": "mr-freeze-freeze-generator",
          "name": "Freeze Generator",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Shockwave rule.",
          "grants": [
            {
              "label": "Shockwave",
              "category": "trait",
              "referenceId": "a3ef514d10d4"
            }
          ],
          "requires": [
            "Victor Fries"
          ]
        },
        {
          "id": "mr-freeze-engineer-training",
          "name": "Engineer Training",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Handyman rule.",
          "grants": [
            {
              "label": "Handyman",
              "category": "trait",
              "referenceId": "5a3a47d4b7aa"
            }
          ],
          "requires": [
            "Victor Fries"
          ]
        },
        {
          "id": "mr-freeze-queen-s-chosen",
          "name": "Queen's Chosen",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Bodyguard rule.",
          "grants": [
            {
              "label": "Bodyguard",
              "category": "trait",
              "referenceId": "ad68a17554eb"
            }
          ],
          "requires": [
            "Killer Frost"
          ]
        },
        {
          "id": "mr-freeze-ivy-s-snow-coat",
          "name": "Ivy's Snow Coat",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Cold Acclimation trait.",
          "grants": [
            {
              "label": "Cold Acclimation",
              "category": "trait",
              "referenceId": "42af05fe652c"
            }
          ],
          "requires": [
            "Poison Ivy (1997)"
          ],
          "only": {
            "names": [
              "Poison Ivy"
            ]
          }
        }
      ]
    },
    {
      "id": "league-of-assassins",
      "title": "League of Assassins",
      "page": null,
      "source": "official-app",
      "crews": [
        "Ra's al Ghul"
      ],
      "items": [
        {
          "id": "league-of-assassins-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "league-of-assassins-loyalty-tattoo",
          "name": "Loyalty Tattoo",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Bodyguard rule.",
          "grants": [
            {
              "label": "Bodyguard",
              "category": "trait",
              "referenceId": "ad68a17554eb"
            }
          ]
        },
        {
          "id": "league-of-assassins-climbing-claws",
          "name": "Climbing Claws",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Climbing Claws rule.",
          "grants": [
            {
              "label": "Climbing Claws",
              "category": "trait",
              "referenceId": "3c65f86d0341"
            }
          ]
        },
        {
          "id": "league-of-assassins-trained-in-the-shadows",
          "name": "Trained in the Shadows",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Hidden rule.",
          "grants": [
            {
              "label": "Hidden",
              "category": "trait",
              "referenceId": "727db16a6cde"
            }
          ]
        },
        {
          "id": "league-of-assassins-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Gas Mask rule.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "league-of-assassins-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            1
          ],
          "cost": 400,
          "rep": 0,
          "description": "Model gains the Grapple-gun rule.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "league-of-assassins-combat-bracers",
          "name": "Combat Bracers",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "The model's close combat weapons and unarmed attacks gain the Defensive weapon special rule.",
          "grants": [
            {
              "label": "Defensive",
              "category": "weapon",
              "referenceId": "dddb54897b6b"
            }
          ]
        },
        {
          "id": "league-of-assassins-venom-dose",
          "name": "Venom Dose",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains one Venom Dose.",
          "grants": [
            {
              "label": "Venom Dose (1)",
              "category": "trait",
              "referenceId": "180dd25b2ae2"
            }
          ],
          "stacks": true
        },
        {
          "id": "league-of-assassins-precise-orders",
          "name": "Precise Orders",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Chain of Command rule.",
          "grants": [
            {
              "label": "Chain of Command",
              "category": "trait",
              "referenceId": "5c05854f85f8"
            }
          ]
        },
        {
          "id": "league-of-assassins-pure-lazarus",
          "name": "Pure Lazarus",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Regeneration trait.",
          "grants": [
            {
              "label": "Regeneration",
              "category": "trait",
              "referenceId": "3bbd77ccf161"
            }
          ],
          "only": {
            "ranks": [
              "Leader",
              "Sidekick"
            ]
          }
        },
        {
          "id": "league-of-assassins-ancient-weapon",
          "name": "Ancient Weapon",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "The model's close combat weapon attacks gain Bleed (1).",
          "grants": [
            {
              "label": "Bleed (1)",
              "category": "weapon",
              "referenceId": "d31de59da4e9"
            }
          ],
          "requires": [
            "Ra's Al Ghul"
          ]
        },
        {
          "id": "league-of-assassins-shadow-training",
          "name": "Shadow Training",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Undercover trait.",
          "grants": [
            {
              "label": "Undercover",
              "category": "trait",
              "referenceId": "8b493a2bd056"
            }
          ],
          "requires": [
            "Talia Al Ghul"
          ]
        },
        {
          "id": "league-of-assassins-unarmed-combat-training",
          "name": "Unarmed Combat Training",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Close Combat Master trait.",
          "grants": [
            {
              "label": "Close Combat Master",
              "category": "trait",
              "referenceId": "4eda464b036c"
            }
          ],
          "requires": [
            "Lady Shiva"
          ]
        },
        {
          "id": "league-of-assassins-poison-training",
          "name": "Poison Training",
          "limit": [
            0,
            1
          ],
          "cost": 50,
          "rep": 0,
          "description": "Model gains the Poison Master trait.",
          "grants": [
            {
              "label": "Poison Master",
              "category": "trait",
              "referenceId": "f7dfe76de6d0"
            }
          ],
          "requires": [
            "Cheshire"
          ]
        },
        {
          "id": "league-of-assassins-military-progress",
          "name": "Military Progress",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Veteran trait.",
          "grants": [
            {
              "label": "Veteran",
              "category": "trait",
              "referenceId": "4080d5bbb2e9"
            }
          ],
          "requires": [
            "Bane"
          ]
        },
        {
          "id": "league-of-assassins-bow-training",
          "name": "Bow Training",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Shooter rule.",
          "grants": [
            {
              "label": "Shooter",
              "category": "trait",
              "referenceId": "cb8fd0f94fe0"
            }
          ],
          "requires": [
            "Nyssa Al Ghul"
          ]
        }
      ]
    },
    {
      "id": "birds-of-prey",
      "title": "Birds of Prey",
      "page": null,
      "source": "official-app",
      "crews": [
        "Birds of Prey"
      ],
      "items": [
        {
          "id": "birds-of-prey-spray-can",
          "name": "Spray Can",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains 1 Spray Can.",
          "grants": [
            {
              "label": "Spray Can",
              "category": "trait",
              "referenceId": null
            }
          ],
          "stacks": true
        },
        {
          "id": "birds-of-prey-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Grapple-gun rule. Plants cannot purchase this equipment.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ],
          "only": {
            "notTraits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-camo-vest",
          "name": "Camo Vest",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Stealth rule. Plants cannot purchase this equipment.",
          "grants": [
            {
              "label": "Stealth",
              "category": "trait",
              "referenceId": "e049d117e0e7"
            }
          ],
          "only": {
            "notTraits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-adaptive-planning",
          "name": "Adaptive Planning",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 2,
          "description": "Model gains the Adaptable trait. Plants cannot purchase this equipment.",
          "grants": [
            {
              "label": "Adaptable",
              "category": "trait",
              "referenceId": "311526109856"
            }
          ],
          "only": {
            "notTraits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-titanic-mutation",
          "name": "Titanic Mutation",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains one Titan Dose. Plants cannot purchase this equipment.",
          "grants": [
            {
              "label": "Titan Dose (1)",
              "category": "trait",
              "referenceId": "116fc80a6d20"
            }
          ],
          "only": {
            "notTraits": [
              "Plant"
            ]
          },
          "stacks": true
        },
        {
          "id": "birds-of-prey-sense-mutation",
          "name": "Sense Mutation",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Night Vision rule. Only Plants can purchase this equipment.",
          "grants": [
            {
              "label": "Night Vision",
              "category": "trait",
              "referenceId": "438f95953a49"
            }
          ],
          "only": {
            "traits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-extra-spores",
          "name": "Extra Spores",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon. Only Plants can purchase this equipment.",
          "grants": [],
          "only": {
            "traits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-spikes-mutation",
          "name": "Spikes Mutation",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Claws rule. Only Plants can purchase this equipment.",
          "grants": [
            {
              "label": "Claws",
              "category": "trait",
              "referenceId": "ab7ce1945918"
            }
          ],
          "only": {
            "traits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-luminescent-mutation",
          "name": "Luminescent Mutation",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Lantern rule. Only Plants can purchase this equipment.",
          "grants": [
            {
              "label": "Lantern",
              "category": "trait",
              "referenceId": "4f7ab8ac4353"
            }
          ],
          "only": {
            "traits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-large-roots",
          "name": "Large Roots",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Models moving within this model's action radius suffer Impaired Movement. Only Plants can purchase this equipment.",
          "grants": [],
          "only": {
            "traits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-smash-n-grab",
          "name": "Smash 'n Grab",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "The model's Close Combat attacks gain the Steal trait.",
          "grants": [
            {
              "label": "Steal",
              "category": "weapon",
              "referenceId": "9f9fff11edd4"
            }
          ],
          "requires": [
            "Dr. Harleen Frances Quinzel"
          ]
        },
        {
          "id": "birds-of-prey-corrosive-blood",
          "name": "Corrosive Blood",
          "limit": [
            0,
            3
          ],
          "cost": 50,
          "rep": 0,
          "description": "When this model becomes a Casualty, all models in Contact must pass an Endurance roll or receive [[A]] Damage.",
          "grants": [],
          "requires": [
            "Dr. Pamela Lillian Isley"
          ]
        },
        {
          "id": "birds-of-prey-mutation-serum",
          "name": "Mutation Serum",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 3,
          "description": "Model gains the Tough Skin and Desensitized traits. Plants cannot purchase this equipment.",
          "grants": [
            {
              "label": "Tough Skin",
              "category": "trait",
              "referenceId": "62bb0e262687"
            },
            {
              "label": "Desensitized",
              "category": "trait",
              "referenceId": "ea9daf6f702e"
            }
          ],
          "requires": [
            "Dr. Pamela Lillian Isley"
          ],
          "only": {
            "notTraits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-modified-pheromones",
          "name": "Modified Pheromones",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 5,
          "description": "When using the Control Pheromones trait, all models in the crew can target up to 2 enemy models instead of 1. Resolve the effect one at a time. Plants cannot purchase this equipment.",
          "grants": [],
          "requires": [
            "Dr. Pamela Lillian Isley"
          ],
          "only": {
            "ranks": [
              "Leader",
              "Sidekick",
              "Free Agent"
            ],
            "notTraits": [
              "Plant"
            ]
          }
        },
        {
          "id": "birds-of-prey-ancient-plants",
          "name": "Ancient Plants",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 40,
          "description": "Model gains the Invulnerability (1) and Tough Skin traits, +1 to all Basic Skills except Endurance, +3 to Endurance, and the action area radius is increased to 6\". Only Plants can purchase this equipment.",
          "grants": [
            {
              "label": "Invulnerability (1)",
              "category": "trait",
              "referenceId": "565c37461bc6"
            },
            {
              "label": "Tough Skin",
              "category": "trait",
              "referenceId": "62bb0e262687"
            }
          ],
          "requires": [
            "Dr. Pamela Lillian Isley"
          ],
          "only": {
            "traits": [
              "Plant"
            ]
          },
          "unbreakable": true,
          "statMods": {
            "endurance": 3,
            "willpower": 1,
            "attack": 1,
            "defense": 1,
            "movement": 1
          }
        },
        {
          "id": "birds-of-prey-watch-tower",
          "name": "Watch Tower",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Exhaustive Planner rule.",
          "grants": [
            {
              "label": "Exhaustive Planner",
              "category": "trait",
              "referenceId": "f621cfe6f864"
            }
          ],
          "requires": [
            "Barbara Gordon"
          ],
          "only": {
            "names": [
              "Barbara Gordon"
            ]
          }
        },
        {
          "id": "birds-of-prey-radio",
          "name": "Radio",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "This model is always treated as though it were within range of its Boss's Inspire trait.",
          "grants": [],
          "requires": [
            "Barbara Gordon"
          ]
        },
        {
          "id": "birds-of-prey-pitch-perfect-vocals",
          "name": "Pitch Perfect Vocals",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Mixed Combat Style trait.",
          "grants": [
            {
              "label": "Mixed Combat Style",
              "category": "trait",
              "referenceId": "07c10c901889"
            }
          ],
          "requires": [
            "Dinah Lance"
          ],
          "only": {
            "names": [
              "Dinah Lance"
            ]
          }
        },
        {
          "id": "birds-of-prey-passage",
          "name": "Passage",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Undercover rule.",
          "grants": [
            {
              "label": "Undercover",
              "category": "trait",
              "referenceId": "8b493a2bd056"
            }
          ],
          "requires": [
            "Alec Holland"
          ]
        }
      ]
    },
    {
      "id": "organized-crime",
      "title": "Organized Crime",
      "page": null,
      "source": "official-app",
      "crews": [
        "Crime Family",
        "Two Face"
      ],
      "items": [
        {
          "id": "organized-crime-magazine",
          "name": "Magazine",
          "limit": [
            0,
            3
          ],
          "cost": 150,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "organized-crime-bribe",
          "name": "Bribe",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Informer trait.",
          "grants": [
            {
              "label": "Informer",
              "category": "trait",
              "referenceId": "56c937a7d173"
            }
          ]
        },
        {
          "id": "organized-crime-kevlar-vest",
          "name": "Kevlar Vest",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Kevlar Vest trait.",
          "grants": [
            {
              "label": "Kevlar Vest",
              "category": "trait",
              "referenceId": "5023f2bb9449"
            }
          ]
        },
        {
          "id": "organized-crime-grapple-gun",
          "name": "Grapple-gun",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 0,
          "description": "Model gains the Grapple-gun trait.",
          "grants": [
            {
              "label": "Grapple Gun",
              "category": "trait",
              "referenceId": "6f96392931e0"
            }
          ]
        },
        {
          "id": "organized-crime-c-4",
          "name": "C-4",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 0,
          "description": "Model gains the Explosive Gel trait.",
          "grants": [
            {
              "label": "Explosive Gel",
              "category": "trait",
              "referenceId": "05d5a588cbe1"
            }
          ]
        },
        {
          "id": "organized-crime-gas-mask",
          "name": "Gas Mask",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Gas Mask trait.",
          "grants": [
            {
              "label": "Gas Mask",
              "category": "trait",
              "referenceId": "8f4bf71ffd93"
            }
          ]
        },
        {
          "id": "organized-crime-silencer",
          "name": "Silencer",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "One of the model's ranged weapons gains the Silencer trait.",
          "grants": [
            {
              "label": "Silencer",
              "category": "weapon",
              "referenceId": "ddda80ab0d50"
            }
          ]
        },
        {
          "id": "organized-crime-brass-knuckles",
          "name": "Brass Knuckles",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Reinforced Gloves trait.",
          "grants": [
            {
              "label": "Reinforced Gloves",
              "category": "trait",
              "referenceId": "41763ca70c77"
            }
          ]
        },
        {
          "id": "organized-crime-the-cleaner",
          "name": "The Cleaner",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "When this model reveals an enemy Suspect, you may immediately draw 1 card from your Objective deck.",
          "grants": []
        },
        {
          "id": "organized-crime-backpack",
          "name": "Backpack",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Backpack trait.",
          "grants": [
            {
              "label": "Backpack",
              "category": "trait",
              "referenceId": "7a868972ac87"
            }
          ]
        },
        {
          "id": "organized-crime-family",
          "name": "Family",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Mobster trait.",
          "grants": [
            {
              "label": "Mobster",
              "category": "trait",
              "referenceId": "55f0bd6161a1"
            }
          ]
        },
        {
          "id": "organized-crime-rusty-tools",
          "name": "Rusty Tools",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Cruel trait.",
          "grants": [
            {
              "label": "Cruel",
              "category": "trait",
              "referenceId": "69ca0ab2e141"
            }
          ]
        },
        {
          "id": "organized-crime-planted-evidence",
          "name": "Planted Evidence",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Evidence Tampering trait. Can only be purchased by models with the Cop trait.",
          "grants": [
            {
              "label": "Evidence Tampering",
              "category": "trait",
              "referenceId": "34b09bcbde25"
            }
          ],
          "only": {
            "traits": [
              "Cop"
            ]
          }
        },
        {
          "id": "organized-crime-abuse-the-badge",
          "name": "Abuse the Badge",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Interrogation trait. Can only be purchased by models with the Cop trait.",
          "grants": [
            {
              "label": "Interrogation",
              "category": "trait",
              "referenceId": "b20a54080e5f"
            }
          ],
          "only": {
            "traits": [
              "Cop"
            ]
          }
        },
        {
          "id": "organized-crime-psychotic",
          "name": "Psychotic",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Protect Me! rule.",
          "grants": [
            {
              "label": "Protect Me!",
              "category": "trait",
              "referenceId": "00f0d66d2899"
            }
          ],
          "requires": [
            "Roman Sionis"
          ],
          "only": {
            "names": [
              "Black Mask"
            ]
          }
        },
        {
          "id": "organized-crime-mob-payroll",
          "name": "Mob Payroll",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Corrupt trait.",
          "grants": [
            {
              "label": "Corrupt",
              "category": "trait",
              "referenceId": "70e44f5771bd"
            }
          ],
          "requires": [
            "Carmine Falcone"
          ],
          "only": {
            "names": [
              "Carmine Falcone"
            ]
          }
        },
        {
          "id": "organized-crime-long-guns",
          "name": "Long Guns",
          "limit": [
            0,
            1
          ],
          "cost": 0,
          "rep": 0,
          "description": "If Sal Maroni is the Boss, select up to three friendly Henchmen with ranged weapons with the Short Range and Firearm rules. Those weapons replace the Short Range rule with the Medium Range rule. These models must be selected before Pre-Game Phase C.",
          "grants": [],
          "requires": [
            "Salvatore Maroni"
          ]
        },
        {
          "id": "organized-crime-mafia",
          "name": "Mafia",
          "limit": [
            0,
            2
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Criminal trait.",
          "grants": [
            {
              "label": "Criminal",
              "category": "trait",
              "referenceId": "6bb17b4c20fc"
            }
          ],
          "requires": [
            "Arnold Wesker"
          ]
        },
        {
          "id": "organized-crime-advanced-weaponry",
          "name": "Advanced Weaponry",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "One of this model's ranged weapons gains the Accurate trait.",
          "grants": [
            {
              "label": "Accurate",
              "category": "weapon",
              "referenceId": "7dbcc408b57a"
            }
          ],
          "requires": [
            "Alexander Joseph Luthor"
          ]
        },
        {
          "id": "organized-crime-broken-equipment",
          "name": "Broken Equipment",
          "limit": [
            0,
            1
          ],
          "cost": 250,
          "rep": 0,
          "description": "Before Phase A of the pre-game sequence choose one item of equipment purchased by the opposing player before the game begins. That item may not be used during the game.",
          "grants": [],
          "requires": [
            "Jervis Tetch"
          ]
        },
        {
          "id": "organized-crime-weird-device",
          "name": "Weird Device",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Goad trait.",
          "grants": [
            {
              "label": "Goad",
              "category": "trait",
              "referenceId": "5646830ec6e7"
            }
          ],
          "requires": [
            "Jervis Tetch"
          ]
        },
        {
          "id": "organized-crime-trained-mind",
          "name": "Trained Mind",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Desensitized rule.",
          "grants": [
            {
              "label": "Desensitized",
              "category": "trait",
              "referenceId": "ea9daf6f702e"
            }
          ],
          "requires": [
            "Jervis Tetch"
          ]
        },
        {
          "id": "organized-crime-rhyme-with-me",
          "name": "Rhyme with Me",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Disarray rule.",
          "grants": [
            {
              "label": "Disarray",
              "category": "trait",
              "referenceId": "220dbf9d7019"
            }
          ],
          "requires": [
            "Jervis Tetch"
          ]
        },
        {
          "id": "organized-crime-masks-of-wonderland",
          "name": "Masks of Wonderland",
          "limit": [
            0,
            3
          ],
          "cost": 200,
          "rep": 0,
          "description": "Choose one mask (each mask 0-1 per crew): Queen of Hearts — Assassin (1) and Order; White Rabbit — Fast and Tireless; Cheshire Cat — Stealth and Climbing Claws.",
          "grants": [],
          "requires": [
            "Jervis Tetch"
          ],
          "choices": [
            {
              "id": "queen-of-hearts-mask",
              "label": "Queen of Hearts mask",
              "grants": [
                {
                  "label": "Assassin (1)",
                  "category": "trait",
                  "referenceId": "669d423ca05c"
                },
                {
                  "label": "Order",
                  "category": "trait",
                  "referenceId": "1b98804a8f45"
                }
              ],
              "limit": 1
            },
            {
              "id": "white-rabbit-mask",
              "label": "White Rabbit mask",
              "grants": [
                {
                  "label": "Fast",
                  "category": "trait",
                  "referenceId": "3a973dff5b10"
                },
                {
                  "label": "Tireless",
                  "category": "trait",
                  "referenceId": "a325e40c6dc6"
                }
              ],
              "limit": 1
            },
            {
              "id": "cheshire-cat-mask",
              "label": "Cheshire Cat mask",
              "grants": [
                {
                  "label": "Stealth",
                  "category": "trait",
                  "referenceId": "e049d117e0e7"
                },
                {
                  "label": "Climbing Claws",
                  "category": "trait",
                  "referenceId": "3c65f86d0341"
                }
              ],
              "limit": 1
            }
          ]
        }
      ]
    },
    {
      "id": "scarecrow",
      "title": "Scarecrow",
      "page": null,
      "source": "official-app",
      "crews": [
        "Scarecrow"
      ],
      "items": [
        {
          "id": "scarecrow-magazine",
          "name": "Magazine",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "+1 to Ammunition for one weapon.",
          "grants": []
        },
        {
          "id": "scarecrow-apparition",
          "name": "Apparition",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Apparition trait. Nightmares cannot purchase this equipment.",
          "grants": [
            {
              "label": "Apparition",
              "category": "trait",
              "referenceId": null
            }
          ],
          "only": {
            "notTraits": [
              "Nightmare"
            ]
          }
        },
        {
          "id": "scarecrow-handcuffs",
          "name": "Handcuffs",
          "limit": [
            0,
            1
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Arrest trait. Nightmares cannot purchase this equipment.",
          "grants": [
            {
              "label": "Arrest",
              "category": "trait",
              "referenceId": "71cbc9bf4c00"
            }
          ],
          "only": {
            "notTraits": [
              "Nightmare"
            ]
          }
        },
        {
          "id": "scarecrow-neurotoxic-drugs",
          "name": "Neurotoxic Drugs",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains +2 Movement and the Dodge trait. Nightmares cannot purchase this equipment.",
          "grants": [
            {
              "label": "Dodge",
              "category": "trait",
              "referenceId": "878bcec18852"
            }
          ],
          "only": {
            "notTraits": [
              "Nightmare"
            ]
          },
          "statMods": {
            "movement": 2
          }
        },
        {
          "id": "scarecrow-fear-advantage",
          "name": "Fear Advantage",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "This model may use the Protect Me! trait on a friendly model with the Nightmare trait without the need of performing an Effort. Only an Arkham Asylum Dr. can purchase this equipment.",
          "grants": [],
          "only": {
            "traits": [
              "Arkham Asylum Dr."
            ]
          }
        },
        {
          "id": "scarecrow-intensive-treatment",
          "name": "Intensive Treatment",
          "limit": [
            0,
            1
          ],
          "cost": 100,
          "rep": 0,
          "description": "Model gains the Intensive Treatment trait. Only an Arkham Asylum Dr. can purchase this equipment.",
          "grants": [
            {
              "label": "Intensive Treatment",
              "category": "trait",
              "referenceId": null
            }
          ],
          "only": {
            "traits": [
              "Arkham Asylum Dr."
            ]
          }
        },
        {
          "id": "scarecrow-disposable-nightmare",
          "name": "Disposable Nightmare",
          "limit": [
            0,
            2
          ],
          "cost": 150,
          "rep": 0,
          "description": "Model gains the Disposable Nightmare trait. Disposable Nightmare: When this model is removed, discard a card from your deck. Only Nightmares can purchase this equipment.",
          "grants": [
            {
              "label": "Disposable Nightmare",
              "category": "trait",
              "referenceId": null
            }
          ],
          "only": {
            "traits": [
              "Nightmare"
            ]
          }
        },
        {
          "id": "scarecrow-terror-invigoration",
          "name": "Terror Invigoration",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Terror Invigoration trait. Terror Invigoration: This model may throw X additional dice when taking Attack and Defense rolls (X is the number of cards in your Terror Pile). Only Nightmares can purchase this equipment.",
          "grants": [
            {
              "label": "Terror Invigoration",
              "category": "trait",
              "referenceId": null
            }
          ],
          "only": {
            "traits": [
              "Nightmare"
            ]
          }
        },
        {
          "id": "scarecrow-fear-dampening",
          "name": "Fear Dampening",
          "limit": [
            0,
            1
          ],
          "cost": 300,
          "rep": 0,
          "description": "Model gains the Fear Dampening trait. Only Nightmares can purchase this equipment.",
          "grants": [
            {
              "label": "Fear Dampening",
              "category": "trait",
              "referenceId": null
            }
          ],
          "only": {
            "traits": [
              "Nightmare"
            ]
          }
        },
        {
          "id": "scarecrow-terrible-visage",
          "name": "Terrible Visage",
          "limit": [
            0,
            2
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Terrible Visage trait. Only Nightmares can purchase this equipment.",
          "grants": [
            {
              "label": "Terrible Visage",
              "category": "trait",
              "referenceId": null
            }
          ],
          "only": {
            "traits": [
              "Nightmare"
            ]
          }
        },
        {
          "id": "scarecrow-intense-fear",
          "name": "Intense Fear",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Intense Fear trait.",
          "grants": [
            {
              "label": "Intense Fear",
              "category": "trait",
              "referenceId": null
            }
          ],
          "requires": [
            "Scarecrow"
          ]
        },
        {
          "id": "scarecrow-working-in-advance",
          "name": "Working in Advance",
          "limit": [
            0,
            1
          ],
          "cost": 200,
          "rep": 0,
          "description": "Model gains the Working in Advance trait.",
          "grants": [
            {
              "label": "Working in Advance",
              "category": "trait",
              "referenceId": null
            }
          ],
          "requires": [
            "Dr. Friitawa"
          ]
        }
      ]
    }
  ]
};
