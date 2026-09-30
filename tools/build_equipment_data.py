"""Build data/equipment-data.json and data/equipment-data.js from the curated crew equipment lists.

Sources, per list (`source` field):
  official-app  — screenshots of the official BMG app's Compendium > Equipment lists
                  (captured 2026-09-30; not stored in the repo). These take precedence.
  compendium    — BMG3_COMPENDIUM_1-4_copy.pdf pages 35-40, used only where no official-app
                  screenshot exists (currently the Batman list).

Each granted rule is looked up in the compendium index (data/reference-data.json) so the app can
link it and detect duplicate traits. Rules the compendium index doesn't contain (newer traits such
as Joker's Gas) are kept unlinked and listed when the build runs.

Record fields:
  limit       [min, max] purchasable across the whole crew (max None = no printed limit)
  cost / rep  $ Funding and Reputation cost per item
  grants      rules the model gains: "Title" or ("Label shown", "Compendium title")
  requires    the item is only available while a model matching one of these names is in the crew
  only        who may buy it: names (any rank), ranks, traits (and default Henchman/Free Agent ranks),
              notTraits, bossOnly
  requiresBossTrait  the crew's Boss must have this trait (e.g. Iceberg Lounge options)
  group       id of a list-level group whose items share a crew-wide limit (list `groups`)
  requiresEquipment  another equipment id that must be bought somewhere in the crew first
  choices     pick exactly one option when buying (each option may grant rules)
  unbreakable immune to the Broken Equipment rule (marked * / footnote)
  stacks      the granted rule is a counted resource (Doses), so it may repeat on a model
  statMods    printed-statistic modifiers, e.g. {"endurance": 1}

Run: python tools/build_equipment_data.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFERENCE = json.loads((ROOT / 'data' / 'reference-data.json').read_text(encoding='utf-8'))


def slug(value):
    return re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')


_index = {}
for entry in REFERENCE['entries']:
    if entry.get('kind') not in ('trait', 'weapon-rule', 'effect'):
        continue
    for key in [entry['title'], *entry.get('aliases', [])]:
        _index.setdefault(key.lower(), entry)

KIND_CATEGORY = {'trait': 'trait', 'weapon-rule': 'weapon', 'effect': 'weapon'}
UNLINKED = set()


def resolve_grant(grant):
    label, title = (grant, grant) if isinstance(grant, str) else grant
    entry = _index.get(title.lower())
    if not entry:
        UNLINKED.add(label)
        return {'label': label, 'category': 'trait', 'referenceId': None}
    return {'label': label, 'category': KIND_CATEGORY[entry['kind']], 'referenceId': entry['id']}


def item(name, limit, cost, description, *, rep=0, grants=(), requires=None, only=None, star=False,
         stacks=False, choices=None, requires_equipment=None, stat_mods=None, group=None,
         requires_boss_trait=None):
    record = {
        'name': name,
        'limit': list(limit) if limit else [0, None],
        'cost': cost,
        'rep': rep,
        'description': description,
        'grants': [resolve_grant(g) for g in grants],
    }
    if requires: record['requires'] = requires
    if only: record['only'] = only
    if star: record['unbreakable'] = True
    if stacks: record['stacks'] = True
    if requires_equipment: record['requiresEquipment'] = requires_equipment
    if stat_mods: record['statMods'] = stat_mods
    if group: record['group'] = group
    if requires_boss_trait: record['requiresBossTrait'] = requires_boss_trait
    if choices:
        record['choices'] = [{
            'id': slug(choice['label']), 'label': choice['label'],
            'grants': [resolve_grant(g) for g in choice.get('grants', ())],
            **({'limit': choice['limit']} if 'limit' in choice else {})
        } for choice in choices]
    return record


GRAPPLE = ('Grapple Gun', 'Batclaw')  # "See Batclaw" — link the full rule text
LEADER_SIDEKICK = ['Leader', 'Sidekick']
MAGAZINE = '+1 to Ammunition for one weapon.'
RADIO_BOSS = "This model is always treated as though it were within range of its Boss's Inspire trait."
BROKEN = 'Before Phase A of the pre-game sequence choose one item of equipment purchased by the opposing player before the game begins. That item may not be used during the game.'
NEUROTOXIC = 'Model gains +2 Movement and the Dodge trait.'
PLANTS_ONLY = {'traits': ['Plant']}
NO_PLANTS = {'notTraits': ['Plant']}
NIGHTMARES_ONLY = {'traits': ['Nightmare']}
NO_NIGHTMARES = {'notTraits': ['Nightmare']}

LISTS = [
    {
        # No official-app screenshot of this list yet; transcribed from the compendium PDF.
        'title': 'Batman', 'page': 35, 'source': 'compendium', 'crews': ['Batman'],
        'items': [
            item('Magazine', (0, 2), 200, '+1 to Ammunition for one weapon.'),
            item('Flashlight', (0, 2), 100, 'Model gains the Lantern rule.', grants=['Lantern']),
            item('Handcuffs', (0, 2), 200, 'Model gains the Arrest rule.', grants=['Arrest']),
            item('Whistle', (0, 2), 200, 'Model gains the Halt/Stop rule.', grants=[('Stop!', 'Stop!')]),
            item('Street Patrol', (0, 1), 50, 'Model gains the Street Guy rule.', grants=['Street Guy']),
            item('Intensive Training', (0, 1), 100, 'Model gains the Teamwork:1 (All) rule.', grants=[('Teamwork (1) (All)', 'Teamwork X (All)')]),
            item('Radio', (0, 2), 100, 'This model is always treated as though it were within range of the Inspire rule.'),
            item('Antidote', (0, 1), 100, 'Model is immune to the Poison effect.', grants=['Poison Immunity']),
            item('Grapple-gun', (0, 1), 200, 'Model gains the Batclaw/Grapple-gun rule.', grants=[GRAPPLE]),
            item('Helmet', None, 300, 'Model gains the Hardened rule.', grants=['Hardened']),
            item('Patrol Training', (0, 1), 150, 'Model gains the Undercover rule.', grants=['Undercover']),
            item('Gas Mask', (0, 1), 100, 'Model gains the Gas Mask rule.', grants=['Gas Mask']),
            item('Riot Gear', (0, 2), 150, 'The model gains the Football Gear rule.', grants=['Football Gear']),
            item('Medic', (0, 1), 150, 'Model gains the Medic rule.', grants=['Medic']),
            item('SWAT Special Training', (0, 2), 100, 'If the model has the Elite (SWAT) trait, choose one: the model gains the Tracking rule, or the Precise Aim rule.',
                 only={'traits': ['Elite (SWAT)', 'Elite Boss (SWAT)']},
                 choices=[{'label': 'Tracking', 'grants': ['Tracking']}, {'label': 'Precise Aim', 'grants': ['Precise Aim']}]),
            item('Upgraded Batsuit', (0, 1), 100, 'Model gains +1 to Endurance.', requires=['Bruce Wayne'], only={'names': ['Bruce Wayne']}, stat_mods={'endurance': 1}),
            item('Kevlar Cowl', (0, 1), 250, 'Model gains Immunity to CRT.', requires=['Bruce Wayne'], only={'names': ['Bruce Wayne']}),
            item('EMP', (0, 1), 100, 'Model gains the EMP rule.', requires=['Bruce Wayne'], grants=['EMP']),
            item('Batman Inc.', (0, 1), 400, 'Model gains the Bat-Armor MKII rule. A model cannot have more than one Bat-Armor rule.', rep=3,
                 requires=['Bruce Wayne'], only={'ranks': ['Sidekick', 'Free Agent']}, grants=[('Bat-Armor Mk II', 'Bat-Armor Mk II')]),
            item('Martial Arts Training', (0, 1), 100, 'Model gains the Martial Artist rule.', rep=2,
                 requires=['Bruce Wayne'], only={'ranks': ['Sidekick', 'Free Agent']}, grants=['Martial Artist']),
            item('Mentor', (0, 1), 200, 'Model gains the Hidden Boss rule.', rep=3,
                 requires=['Bruce Wayne'], only={'ranks': ['Sidekick', 'Free Agent']}, grants=['Hidden Boss']),
            item('Hidden Magazine', (0, 1), 300, '+1 to Ammunition for one weapon.', requires=['Bruce Wayne'], only={'ranks': ['Sidekick', 'Leader']}),
            item('Morality', (0, 1), 50, 'Model gains the Moral Compass and Demotivate rules.', requires=['Bruce Wayne'], only={'names': ['Batman']},
                 grants=['Moral Compass', 'Demotivate']),
            item('Circus Training', (0, 1), 300, 'Model gains the Acrobat rule.', rep=5, requires=['Dick Grayson'], grants=['Acrobat']),
            item('Runner', (0, 1), 100, 'Model gains the Tireless rule.', requires=['Dick Grayson'], grants=['Tireless']),
            item('Command Center Support', (0, 1), 250, 'Model gains the Scheming:2 rule.', requires=['Oliver Queen'], grants=[('Scheming (2)', 'Scheming (X)')]),
            item('Tactical Gloves', (0, 1), 50, 'Model gains the Reinforced Gloves rule.', requires=['Oliver Queen'], only={'names': ['Oliver Queen']}, grants=['Reinforced Gloves']),
            item('Hi-Tech Ammo', (0, 1), 150, "One of the model's ranged weapons gains Bleed:2.", rep=2, requires=['Roy Harper'], grants=[('Bleed (2)', 'Bleed (X)')]),
            item('Officer Training', (0, 1), 100, 'Model gains the Follow Me! rule.', rep=2, requires=['Kathy Kane'], grants=['Follow Me!']),
            item('Inspiring Presence', (0, 1), 250, 'Model gains the Leadership rule.', requires=['Tim Drake'], only={'names': ['Tim Drake']}, grants=['Leadership']),
            item('Oracle', (0, 1), 200, 'Model gains the Exhaustive Planner rule.', requires=['Barbara Gordon'], only={'names': ['Batgirl']}, grants=['Exhaustive Planner']),
            item('Deadly Weapons', (0, 1), 150, "The model's weapons gain the Silencer rule.", rep=2,
                 requires=['Red Hood (Arkham Knight)'], only={'names': ['Red Hood (Arkham Knight)']}, grants=['Silencer']),
            item('Heliport', (0, 1), 150, 'When you use the Air Support rule, target an enemy model affected by the template: the target receives a Ranged attack with ROF 1, the Firearm weapon special rule and damage [[A]] [[A]] which ignores the Cover rule.',
                 requires=['James Gordon'], only={'names': ['James Gordon']}, star=True),
            item('Sergeant Training', (0, 2), 50, 'Model gains the Order rule.', requires=['James Gordon'], grants=['Order'], star=True),
            item('Feline Stalk', (0, 1), 200, 'Model gains the Tracking rule.', requires=['Selina Kyle'], grants=['Tracking'], star=True),
        ]
    },
    {
        'title': 'Police', 'page': None, 'source': 'official-app', 'crews': ['Police'],
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Flashlight', (0, 2), 50, 'Model gains the Lantern rule.', grants=['Lantern']),
            item('Handcuffs', (0, 2), 100, 'Model gains the Arrest rule.', grants=['Arrest']),
            item('Whistle', (0, 2), 150, 'Model gains the Halt/Stop rule.', grants=['Stop!']),
            item('Street Patrol', (0, 1), 50, 'Model gains the Street Guy rule.', grants=['Street Guy']),
            item('Intensive Training', (0, 1), 100, 'Model gains the Teamwork (1) (All) rule.', grants=[('Teamwork (1) (All)', 'Teamwork X (All)')]),
            item('Radio', (0, 2), 200, RADIO_BOSS),
        ]
    },
    {
        'title': 'Joker', 'page': None, 'source': 'official-app', 'crews': ['Joker'],
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Grapple-gun', (0, 2), 300, 'Model gains the Batclaw/Grapple-gun rule.', grants=[GRAPPLE]),
            item('Clown Paint', (0, 2), 150, 'Model gains the Distract rule.', grants=['Distract']),
            item('Flare', (0, 2), 300, 'Model gains the Flare rule.', grants=['Flare']),
            item('Neurotoxic Drugs', (0, 2), 250, NEUROTOXIC, grants=['Dodge'], stat_mods={'movement': 2}),
            item('Improvised Armor', (0, 1), 150, 'Model gains the Hockey Gear rule.', grants=['Hockey Gear']),
            item('Gas Mask', (0, 1), 100, 'Model gains the Gas Mask rule.', grants=['Gas Mask']),
            item('Antidote', (0, 1), 100, 'Model is immune to the Poison status.', grants=['Poison Immunity']),
            item('Poison Training', (0, 1), 200, 'Model gains the Poison Master trait.', grants=['Poison Master']),
            item('Mental Torture', (0, 1), 150, 'Model gains the Aggressive Schizophrenia trait.', grants=[('Aggressive Schizophrenia', 'Aggressive Schizophrenia (Mental Disorder)')]),
            item("Joker's Gas", (0, 1), 100, "Model gains the Joker's Gas trait.", grants=["Joker's Gas"]),
            item('Nerve Gas', (0, 2), 150, 'Model gains the Sturdy rule.', requires=['Joker'], grants=['Sturdy']),
            item('Sexy Costume', (0, 1), 300, 'Model gains the Disarray rule.', rep=5, requires=['Harleen Quinzel'], grants=['Disarray']),
            item('Pole Dancer', (0, 1), 150, 'Model gains the Escape Artist rule.', requires=['Harleen Quinzel'], grants=['Escape Artist']),
            item('Enhanced Gas', (0, 1), 200, 'When an enemy model within 8" of this model suffers the Enervating effect, it is increased by +1.',
                 requires=['Gaggy'], only={'ranks': LEADER_SIDEKICK}),
            item('Rusty Tools', (0, 1), 200, 'Model gains the Cruel rule.', rep=2, requires=['Duela Dent'], grants=['Cruel']),
            item('Brutal Training', (0, 1), 150, 'Model gains the Savage Fighter rule.', requires=['Mr. Hammer'], grants=['Savage Fighter']),
        ]
    },
    {
        'title': 'Penguin', 'page': None, 'source': 'official-app', 'crews': ['Penguin'],
        'groups': {'iceberg-lounge': {'label': 'Iceberg Lounge options', 'limit': 1}},
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Grapple-gun', (0, 2), 200, 'Model gains the Batclaw/Grapple-gun rule.', grants=[GRAPPLE]),
            item('Laser Sight', (0, 2), 150, 'Model gains the Laser Sight rule.', grants=['Laser Sight']),
            item('Camo Vest', (0, 2), 150, 'Model gains the Stealth rule.', grants=['Stealth']),
            item('C4', (0, 1), 100, 'Model gains the Explosive Gel trait.', grants=['Explosive Gel']),
            item('Radio', (0, 2), 200, RADIO_BOSS),
            item('Backpack', (0, 1), 100, 'Model gains the Backpack rule.', grants=['Backpack']),
            item('Biker Jacket', (0, 3), 100, 'Model gains the Hockey Gear trait.', grants=['Hockey Gear']),
            item('Helmet', (0, 1), 150, 'Model gains the Hardened trait.', grants=['Hardened']),
            item('Raised on the Streets', (0, 1), 150, 'Model gains the Plead trait.', grants=['Plead']),
            item('Ostentatious Clothes', (0, 1), 200, 'Model gains the Goad rule.', requires=['Oswald C. Cobblepot'], grants=['Goad']),
            item('Trained Mobsters', (0, 2), 250, 'Model gains +2 Endurance.', rep=2, requires=['Emperor Penguin'], stat_mods={'endurance': 2}),
            # Iceberg Lounge: only one of these options may be selected (and the Boss needs the trait).
            item('Neurotoxic Drugs (Iceberg Lounge)', (0, 1), 500, NEUROTOXIC, grants=['Dodge'], stat_mods={'movement': 2},
                 group='iceberg-lounge', requires_boss_trait='Iceberg Lounge'),
            item('Silencer (Iceberg Lounge)', (0, 1), 400, "One of the model's ranged weapons gains the Silencer trait.", grants=['Silencer'],
                 group='iceberg-lounge', requires_boss_trait='Iceberg Lounge'),
            item('Weird Ammo (Iceberg Lounge)', (0, 1), 300, "Model's ranged attacks gain either the Enervating 2 or Anti-tank trait.",
                 group='iceberg-lounge', requires_boss_trait='Iceberg Lounge',
                 choices=[{'label': 'Enervating 2', 'grants': [('Enervating (2)', 'Enervating X')]}, {'label': 'Anti-Tank', 'grants': ['Anti-Tank']}]),
            item('Mutation Serum (Iceberg Lounge)', (0, 1), 500, 'Model gains the Tough Skin and Desensitized traits.', grants=['Tough Skin', 'Desensitized'],
                 group='iceberg-lounge', requires_boss_trait='Iceberg Lounge'),
            item('Fear Gas Dispenser (Iceberg Lounge)', (0, 1), 600, 'Model gains the Inspire Fear trait.', grants=['Inspire Fear'],
                 group='iceberg-lounge', requires_boss_trait='Iceberg Lounge'),
            item('Titan Dose (Iceberg Lounge)', (0, 1), 300, 'Model gains one Titan Dose.', grants=[('Titan Dose (1)', 'Titan Dose (DOSE)')], stacks=True,
                 group='iceberg-lounge', requires_boss_trait='Iceberg Lounge'),
            item('Prototype Freeze Ray (Iceberg Lounge)', (0, 1), 500, 'Model gains the Ice Flash trait.', grants=['Ice Flash'],
                 group='iceberg-lounge', requires_boss_trait='Iceberg Lounge'),
        ]
    },
    {
        'title': 'Bane (Soldiers of Fortune)', 'page': None, 'source': 'official-app', 'crews': ['Bane'],
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Grapple-gun', (0, 2), 300, 'Model gains the Batclaw/Grapple-gun rule.', grants=[GRAPPLE]),
            item('Titan Dose', (0, 2), 100, 'Model gains one Titan Dose.', grants=[('Titan Dose (1)', 'Titan Dose (DOSE)')], stacks=True),
            item('Night Vision Goggles', (0, 1), 200, 'Model gains the Night Vision rule.', grants=['Night Vision']),
            item('Venom Dose', (0, 3), 100, 'Model gains one Venom Dose.', grants=[('Venom Dose (1)', 'Venom Dose (DOSE)')], stacks=True),
            item('Backpack', (0, 1), 100, 'Model gains the Backpack rule.', grants=['Backpack']),
            item('Antidote', (0, 1), 50, 'Model is immune to the Poison status.', grants=['Poison Immunity']),
            item('Neurotoxic Drugs', (0, 2), 250, NEUROTOXIC, grants=['Dodge'], stat_mods={'movement': 2}),
            item('Camo Vest', (0, 2), 200, 'Model gains the Stealth rule.', grants=['Stealth']),
            item('Gas Mask', (0, 3), 150, 'Model gains the Gas Mask rule.', grants=['Gas Mask']),
            item('War Hardened', (0, 1), 200, 'Model gains the Cruel trait.', grants=['Cruel']),
            item('Handcuffs', (0, 1), 100, 'Model gains the Arrest rule.', requires=['Bane'], grants=['Arrest']),
            item('Venom Laboratory', (0, 1), 100, 'All models in your crew can use more than 1 Titan Dose per game. This bonus remains in play even if this model is removed from play or leaves the board. Also, the cost of Venom Doses in the equipment list is reduced to $50.',
                 rep=5, requires=['Bane'], only={'ranks': LEADER_SIDEKICK}, star=True),
            item('Venom Applicator', (0, 2), 0, 'This model can use Titan and Venom Doses on a friendly model in contact.', rep=2, requires=['Bane']),
            item('Military Progress', (0, 2), 150, 'Model gains the Veteran rule.', requires=['Bird'], grants=['Veteran']),
            item('Dual Handguns', (0, 1), 300, 'Model gains the Rapid Fire trait and the following weapon: Dual Handguns — [[B]] [[A]], ROF 4, Ammo 3, S. Range / Firearm / Light / Assault.',
                 rep=7, requires=['Thomas Wayne'], only={'names': ['Thomas Wayne']}, grants=['Rapid Fire'], star=True),
            item('Surgeon Training', (0, 1), 200, 'Model gains the Medic trait.', requires=['Thomas Wayne'], grants=['Medic']),
            item('Fear Gas Dispenser', (0, 1), 150, 'Model gains the Inspire Fear rule.', requires=['Scarecrow (Arkham Knight)'], grants=['Inspire Fear']),
            item('Secret Laboratory', (0, 1), 100, "At the start of the game you can choose up to 2 Henchmen in your crew. These models let you use Scarecrow's Inspire Fear from their position as if Scarecrow were placed there. The Willpower roll caused by any Inspire Fear suffers a +1 penalty.",
                 rep=2, requires=['Scarecrow (Arkham Knight)'], only={'names': ['Scarecrow']}, star=True),
            item('Radio', (0, 2), 150, 'This model is always treated as though it were within range of the Inspire rule.', requires=['Jason Todd']),
            item('Hidden Magazines', (0, 1), 200, '+1 Magazines to one weapon.', requires=['Jason Todd'], only={'names': ['Jason Todd']}),
            item('Cybernetic Arms', (0, 1), 50, 'Model gains the Reinforced Gloves rule.', requires=['Jason Todd'], only={'names': ['Jason Todd']}, grants=['Reinforced Gloves']),
            item('Arkham Knight Secret Armoury', (0, 1), 100, 'One ranged weapon of this model gains the Acid rule.', requires=['Jason Todd'], grants=['Acid']),
            item('Hook Pistol', (0, 1), 400, 'Gains the Grapple Gun and the following ranged weapon: Electric Hook — [[B]] [[B]], RoF 1, Ammo 2, S. Range / Mechanical / Electric / Devastating.',
                 requires=['Jason Todd'], only={'names': ['Jason Todd'], 'bossOnly': True}, grants=[GRAPPLE]),
            item('Martial Training', (0, 1), 150, 'Model gains the Martial Artist and Master Fighter rules.', requires=['Slade Wilson'], grants=['Martial Artist', 'Master Fighter']),
            item('Contract', (0, 1), 0, 'Slade Wilson gains the rank Sidekick of Bane.', requires=['Slade Wilson'], only={'names': ['Slade Wilson']}, star=True),
        ]
    },
    {
        'title': 'Court of Owls', 'page': None, 'source': 'official-app', 'crews': [],
        'items': [
            item('Magazine', (0, 2), 100, MAGAZINE),
            item('Climbing Claws', (0, 2), 100, 'Model gains the Climbing Claws rule.', grants=['Climbing Claws']),
            item('Antidote', (0, 1), 100, 'Model is immune to the Poison effect.', grants=['Poison Immunity']),
            item('Camo Vest', (0, 2), 100, 'Model gains the Stealth rule.', grants=['Stealth']),
            item('C-4', (0, 1), 300, 'Model gains the Explosive Gel rule.', grants=['Explosive Gel']),
            item('Gas Mask', (0, 1), 150, 'Model gains the Gas Mask rule.', grants=['Gas Mask']),
            item('Grapple-gun', (0, 1), 400, 'Model gains the Grapple-gun rule.', grants=[GRAPPLE]),
            item('Ancient Weapon', (0, 1), 200, "The model's Close Combat weapon attacks gain Bleed (1).", grants=[('Bleed (1)', 'Bleed (X)')]),
            item('Genetic Alteration', (0, 3), 100, 'Model gains +2 Movement.', stat_mods={'movement': 2}),
            item('Hunter Training', (0, 2), 150, 'Model gains the Sneaking rule.', grants=['Sneaking']),
            item('Ancient Training', (0, 2), 150, 'Model gains the Master Fighter rule.', grants=['Master Fighter']),
            item('Circus Grooming', (0, 1), 100, 'Model gains the Combat Flip rule.', grants=['Combat Flip']),
            item('Lords of Gotham', (0, 1), 200, "This model's crew generates 1 extra Sewer marker.", requires=['The Court'], only={'names': ['The Court']}),
            item('Talon Serum Infusion', (0, 1), 200, 'Once per game, at the start of the Raise the Plan phase, choose up to three friendly models with the Reanimated Owl trait. Those models gain 1 additional Strength die to their attacks until the end of the round, but then at the Recovering phase (when resolving effects) suffer 1 [[A]].',
                 requires=['Lincoln March'], only={'names': ['Lincoln March']}),
        ]
    },
    {
        'title': 'Riddler', 'page': None, 'source': 'official-app', 'crews': ['Riddler'],
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Grapple-gun', (0, 2), 300, 'Model gains the Grapple-gun rule.', grants=[GRAPPLE]),
            item('Mirror Games', (0, 1), 100, 'Model gains the Magic Tricks trait.', grants=['Magic Tricks']),
            item('Enigma Data-Pack', (0, 2), 100, 'Model gains the Bluff trait.', grants=['Bluff']),
            item('Broken Equipment', (0, 1), 250, BROKEN),
            item('Gas Mask', (0, 1), 200, 'Model gains the Gas Mask rule.', grants=['Gas Mask']),
            item('Another One!', (0, 2), 150, 'Model gains the Drop a Riddle trait.', grants=['Drop a Riddle']),
            item('Level Up', (0, 1), 150, 'At the start of your first Raise the Plan phase, you may place up to 2 friendly Suspect markers at least 4" away from your Deployment zone.',
                 only={'names': ['Riddler']}),
            item("It's a Dud", (0, 1), 100, "At the start of this model's activation you may remove 1 Riddle marker from the Gaming Area.", only={'names': ['Quelle']}),
            item('Inspiration', (0, 1), 100, "When this model plays an Objective card, it may immediately search your Objective deck for 1 card and add it to its controller's hand (instead of replenishing that played card).",
                 only={'names': ['Echo']}),
            item('Weird Ammo', (0, 1), 100, 'This model chooses one: Enervating (2) or Anti-Tank. Its ranged weapons gain that rule.', only={'names': ['Query']},
                 choices=[{'label': 'Enervating 2', 'grants': [('Enervating (2)', 'Enervating X')]}, {'label': 'Anti-Tank', 'grants': ['Anti-Tank']}]),
            item('Battle Bot', (0, 1), 250, 'Model gains the Claws rule.', rep=3, only={'traits': ['Bot']}, grants=['Claws']),
            item('Shock Droid', (0, 1), 50, 'Model gains the CRT: Stunned rule.', only={'traits': ['Bot']}, grants=[('CRT (Stunned)', 'CRT (X)')]),
            item('Improved Chassis MK', (0, 1), 50, 'The model gains the Tireless rule.', only={'traits': ['Bot']}, grants=['Tireless']),
            item('Improved Armor', (0, 1), 250, 'Bots in your crew gain the Light Armor trait.', rep=2,
                 requires=['The Riddler (Arkham Knight)', "The Riddler's Mech (Arkham Knight)"], only={'names': ['Riddler']}, star=True),
            item('Enhanced Servo-engines', (0, 1), 150, "Riddler's Mech gains +1 to Movement and Combo: Mechanic Claw.",
                 requires=['The Riddler (Arkham Knight)', "The Riddler's Mech (Arkham Knight)"], only={'names': ["Riddler's Mech"]}, star=True, stat_mods={'movement': 1}),
        ]
    },
    {
        'title': 'Mr. Freeze', 'page': None, 'source': 'official-app', 'crews': ['Freeze'],
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Grapple-gun', (0, 1), 150, 'Model gains the Grapple-gun rule.', grants=[GRAPPLE]),
            item('Cryo-Grenade', (0, 2), 100, 'Model gains the Cryo-Grenade rule.', grants=['Cryo-Grenade']),
            item('Med-pack', (0, 1), 200, 'Once per game remove 2 Damage markers from a model in contact with this model.'),
            item('Scope', (0, 1), 300, "One of the model's ranged weapons gains the Scope rule.", grants=['Scope']),
            item('Gas Mask', (0, 1), 150, 'Model gains the Gas Mask rule.', grants=['Gas Mask']),
            item('Cool Generator', (0, 1), 300, 'Model gains the Stop! rule.', grants=['Stop!']),
            item('Freeze Generator', (0, 1), 150, 'Model gains the Shockwave rule.', requires=['Victor Fries'], grants=['Shockwave']),
            item('Engineer Training', (0, 2), 150, 'Model gains the Handyman rule.', requires=['Victor Fries'], grants=['Handyman']),
            item("Queen's Chosen", (0, 1), 200, 'Model gains the Bodyguard rule.', requires=['Killer Frost'], grants=['Bodyguard']),
            item("Ivy's Snow Coat", (0, 1), 200, 'Model gains the Cold Acclimation trait.', requires=['Poison Ivy (1997)'], only={'names': ['Poison Ivy']}, grants=['Cold Acclimation']),
        ]
    },
    {
        'title': 'League of Assassins', 'page': None, 'source': 'official-app', 'crews': ["Ra's al Ghul"],
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Loyalty Tattoo', (0, 1), 200, 'Model gains the Bodyguard rule.', grants=['Bodyguard']),
            item('Climbing Claws', (0, 2), 100, 'Model gains the Climbing Claws rule.', grants=['Climbing Claws']),
            item('Trained in the Shadows', (0, 1), 200, 'Model gains the Hidden rule.', grants=['Hidden']),
            item('Gas Mask', (0, 1), 100, 'Model gains the Gas Mask rule.', grants=['Gas Mask']),
            item('Grapple-gun', (0, 1), 400, 'Model gains the Grapple-gun rule.', grants=[GRAPPLE]),
            item('Combat Bracers', (0, 2), 150, "The model's close combat weapons and unarmed attacks gain the Defensive weapon special rule.", grants=['Defensive']),
            item('Venom Dose', (0, 1), 100, 'Model gains one Venom Dose.', grants=[('Venom Dose (1)', 'Venom Dose (DOSE)')], stacks=True),
            item('Precise Orders', (0, 1), 150, 'Model gains the Chain of Command rule.', grants=['Chain of Command']),
            item('Pure Lazarus', (0, 1), 300, 'Model gains the Regeneration trait.', only={'ranks': LEADER_SIDEKICK}, grants=['Regeneration']),
            item('Ancient Weapon', (0, 2), 150, "The model's close combat weapon attacks gain Bleed (1).", requires=["Ra's Al Ghul"], grants=[('Bleed (1)', 'Bleed (X)')]),
            item('Shadow Training', (0, 2), 150, 'Model gains the Undercover trait.', requires=['Talia Al Ghul'], grants=['Undercover']),
            item('Unarmed Combat Training', (0, 1), 150, 'Model gains the Close Combat Master trait.', requires=['Lady Shiva'], grants=['Close Combat Master']),
            item('Poison Training', (0, 1), 50, 'Model gains the Poison Master trait.', requires=['Cheshire'], grants=['Poison Master']),
            item('Military Progress', (0, 2), 150, 'Model gains the Veteran trait.', requires=['Bane'], grants=['Veteran']),
            item('Bow Training', (0, 1), 100, 'Model gains the Shooter rule.', requires=['Nyssa Al Ghul'], grants=['Shooter']),
        ]
    },
    {
        'title': 'Birds of Prey', 'page': None, 'source': 'official-app', 'crews': ['Birds of Prey'],
        'items': [
            item('Spray Can', (0, 2), 150, 'Model gains 1 Spray Can.', grants=['Spray Can'], stacks=True),
            item('Grapple-gun', (0, 1), 300, 'Model gains the Grapple-gun rule. Plants cannot purchase this equipment.', grants=[GRAPPLE], only=NO_PLANTS),
            item('Camo Vest', (0, 1), 300, 'Model gains the Stealth rule. Plants cannot purchase this equipment.', grants=['Stealth'], only=NO_PLANTS),
            item('Adaptive Planning', (0, 2), 150, 'Model gains the Adaptable trait. Plants cannot purchase this equipment.', rep=2, grants=['Adaptable'], only=NO_PLANTS),
            item('Titanic Mutation', (0, 2), 150, 'Model gains one Titan Dose. Plants cannot purchase this equipment.', grants=[('Titan Dose (1)', 'Titan Dose (DOSE)')], stacks=True, only=NO_PLANTS),
            item('Sense Mutation', (0, 1), 100, 'Model gains the Night Vision rule. Only Plants can purchase this equipment.', grants=['Night Vision'], only=PLANTS_ONLY),
            item('Extra Spores', (0, 1), 100, '+1 to Ammunition for one weapon. Only Plants can purchase this equipment.', only=PLANTS_ONLY),
            item('Spikes Mutation', (0, 2), 200, 'Model gains the Claws rule. Only Plants can purchase this equipment.', grants=['Claws'], only=PLANTS_ONLY),
            item('Luminescent Mutation', (0, 1), 100, 'Model gains the Lantern rule. Only Plants can purchase this equipment.', grants=['Lantern'], only=PLANTS_ONLY),
            item('Large Roots', (0, 1), 200, "Models moving within this model's action radius suffer Impaired Movement. Only Plants can purchase this equipment.", only=PLANTS_ONLY),
            item("Smash 'n Grab", (0, 1), 200, "The model's Close Combat attacks gain the Steal trait.", requires=['Dr. Harleen Frances Quinzel'], grants=['Steal']),
            item('Corrosive Blood', (0, 3), 50, 'When this model becomes a Casualty, all models in Contact must pass an Endurance roll or receive [[A]] Damage.', requires=['Dr. Pamela Lillian Isley']),
            item('Mutation Serum', (0, 1), 200, 'Model gains the Tough Skin and Desensitized traits. Plants cannot purchase this equipment.', rep=3,
                 requires=['Dr. Pamela Lillian Isley'], grants=['Tough Skin', 'Desensitized'], only=NO_PLANTS),
            item('Modified Pheromones', (0, 1), 150, 'When using the Control Pheromones trait, all models in the crew can target up to 2 enemy models instead of 1. Resolve the effect one at a time. Plants cannot purchase this equipment.',
                 rep=5, requires=['Dr. Pamela Lillian Isley'], only={'ranks': ['Leader', 'Sidekick', 'Free Agent'], 'notTraits': ['Plant']}),
            item('Ancient Plants', (0, 1), 200, 'Model gains the Invulnerability (1) and Tough Skin traits, +1 to all Basic Skills except Endurance, +3 to Endurance, and the action area radius is increased to 6". Only Plants can purchase this equipment.',
                 rep=40, requires=['Dr. Pamela Lillian Isley'], only=PLANTS_ONLY, grants=[('Invulnerability (1)', 'Invulnerability (X)'), 'Tough Skin'], star=True,
                 stat_mods={'endurance': 3, 'willpower': 1, 'attack': 1, 'defense': 1, 'movement': 1}),
            item('Watch Tower', (0, 1), 200, 'Model gains the Exhaustive Planner rule.', requires=['Barbara Gordon'], only={'names': ['Barbara Gordon']}, grants=['Exhaustive Planner']),
            item('Radio', (0, 1), 200, RADIO_BOSS, requires=['Barbara Gordon']),
            item('Pitch Perfect Vocals', (0, 1), 200, 'Model gains the Mixed Combat Style trait.', requires=['Dinah Lance'], only={'names': ['Dinah Lance']}, grants=['Mixed Combat Style']),
            item('Passage', (0, 1), 200, 'Model gains the Undercover rule.', requires=['Alec Holland'], grants=['Undercover']),
        ]
    },
    {
        'title': 'Organized Crime', 'page': None, 'source': 'official-app', 'crews': ['Crime Family', 'Two Face'],
        'items': [
            item('Magazine', (0, 3), 150, MAGAZINE),
            item('Bribe', (0, 1), 100, 'Model gains the Informer trait.', grants=['Informer']),
            item('Kevlar Vest', (0, 1), 200, 'Model gains the Kevlar Vest trait.', grants=['Kevlar Vest']),
            item('Grapple-gun', (0, 1), 250, 'Model gains the Grapple-gun trait.', grants=[GRAPPLE]),
            item('C-4', (0, 1), 250, 'Model gains the Explosive Gel trait.', grants=['Explosive Gel']),
            item('Gas Mask', (0, 1), 150, 'Model gains the Gas Mask trait.', grants=['Gas Mask']),
            item('Silencer', (0, 1), 200, "One of the model's ranged weapons gains the Silencer trait.", grants=['Silencer']),
            item('Brass Knuckles', (0, 2), 100, 'Model gains the Reinforced Gloves trait.', grants=['Reinforced Gloves']),
            item('The Cleaner', (0, 1), 100, 'When this model reveals an enemy Suspect, you may immediately draw 1 card from your Objective deck.'),
            item('Backpack', (0, 2), 100, 'Model gains the Backpack trait.', grants=['Backpack']),
            item('Family', (0, 2), 150, 'Model gains the Mobster trait.', grants=['Mobster']),
            item('Rusty Tools', (0, 1), 200, 'Model gains the Cruel trait.', grants=['Cruel']),
            item('Planted Evidence', (0, 1), 200, 'Model gains the Evidence Tampering trait. Can only be purchased by models with the Cop trait.', only={'traits': ['Cop']}, grants=['Evidence Tampering']),
            item('Abuse the Badge', (0, 1), 150, 'Model gains the Interrogation trait. Can only be purchased by models with the Cop trait.', only={'traits': ['Cop']}, grants=['Interrogation']),
            item('Psychotic', (0, 1), 150, 'Model gains the Protect Me! rule.', requires=['Roman Sionis'], only={'names': ['Black Mask']}, grants=['Protect Me!']),
            item('Mob Payroll', (0, 1), 200, 'Model gains the Corrupt trait.', requires=['Carmine Falcone'], only={'names': ['Carmine Falcone']}, grants=['Corrupt']),
            item('Long Guns', (0, 1), 0, 'If Sal Maroni is the Boss, select up to three friendly Henchmen with ranged weapons with the Short Range and Firearm rules. Those weapons replace the Short Range rule with the Medium Range rule. These models must be selected before Pre-Game Phase C.',
                 requires=['Salvatore Maroni']),
            item('Mafia', (0, 2), 100, 'Model gains the Criminal trait.', requires=['Arnold Wesker'], grants=['Criminal']),
            item('Advanced Weaponry', (0, 1), 200, "One of this model's ranged weapons gains the Accurate trait.", requires=['Alexander Joseph Luthor'], grants=['Accurate']),
            item('Broken Equipment', (0, 1), 250, BROKEN, requires=['Jervis Tetch']),
            item('Weird Device', (0, 2), 200, 'Model gains the Goad trait.', requires=['Jervis Tetch'], grants=['Goad']),
            item('Trained Mind', (0, 1), 100, 'Model gains the Desensitized rule.', requires=['Jervis Tetch'], grants=['Desensitized']),
            item('Rhyme with Me', (0, 1), 200, 'Model gains the Disarray rule.', requires=['Jervis Tetch'], grants=['Disarray']),
            item('Masks of Wonderland', (0, 3), 200, 'Choose one mask (each mask 0-1 per crew): Queen of Hearts — Assassin (1) and Order; White Rabbit — Fast and Tireless; Cheshire Cat — Stealth and Climbing Claws.',
                 requires=['Jervis Tetch'], choices=[
                     {'label': 'Queen of Hearts mask', 'limit': 1, 'grants': [('Assassin (1)', 'Assassin X'), 'Order']},
                     {'label': 'White Rabbit mask', 'limit': 1, 'grants': ['Fast', 'Tireless']},
                     {'label': 'Cheshire Cat mask', 'limit': 1, 'grants': ['Stealth', 'Climbing Claws']},
                 ]),
        ]
    },
    {
        'title': 'Scarecrow', 'page': None, 'source': 'official-app', 'crews': ['Scarecrow'],
        'items': [
            item('Magazine', (0, 2), 200, MAGAZINE),
            item('Apparition', (0, 1), 200, 'Model gains the Apparition trait. Nightmares cannot purchase this equipment.', grants=['Apparition'], only=NO_NIGHTMARES),
            item('Handcuffs', (0, 1), 150, 'Model gains the Arrest trait. Nightmares cannot purchase this equipment.', grants=['Arrest'], only=NO_NIGHTMARES),
            item('Neurotoxic Drugs', (0, 1), 300, NEUROTOXIC + ' Nightmares cannot purchase this equipment.', grants=['Dodge'], stat_mods={'movement': 2}, only=NO_NIGHTMARES),
            item('Fear Advantage', (0, 1), 200, 'This model may use the Protect Me! trait on a friendly model with the Nightmare trait without the need of performing an Effort. Only an Arkham Asylum Dr. can purchase this equipment.',
                 only={'traits': ['Arkham Asylum Dr.']}),
            item('Intensive Treatment', (0, 1), 100, 'Model gains the Intensive Treatment trait. Only an Arkham Asylum Dr. can purchase this equipment.', grants=['Intensive Treatment'], only={'traits': ['Arkham Asylum Dr.']}),
            item('Disposable Nightmare', (0, 2), 150, 'Model gains the Disposable Nightmare trait. Disposable Nightmare: When this model is removed, discard a card from your deck. Only Nightmares can purchase this equipment.',
                 grants=['Disposable Nightmare'], only=NIGHTMARES_ONLY),
            item('Terror Invigoration', (0, 2), 200, 'Model gains the Terror Invigoration trait. Terror Invigoration: This model may throw X additional dice when taking Attack and Defense rolls (X is the number of cards in your Terror Pile). Only Nightmares can purchase this equipment.',
                 grants=['Terror Invigoration'], only=NIGHTMARES_ONLY),
            item('Fear Dampening', (0, 1), 300, 'Model gains the Fear Dampening trait. Only Nightmares can purchase this equipment.', grants=['Fear Dampening'], only=NIGHTMARES_ONLY),
            item('Terrible Visage', (0, 2), 200, 'Model gains the Terrible Visage trait. Only Nightmares can purchase this equipment.', grants=['Terrible Visage'], only=NIGHTMARES_ONLY),
            item('Intense Fear', (0, 1), 200, 'Model gains the Intense Fear trait.', requires=['Scarecrow'], grants=['Intense Fear']),
            item('Working in Advance', (0, 1), 200, 'Model gains the Working in Advance trait.', requires=['Dr. Friitawa'], grants=['Working in Advance']),
        ]
    },
]


def build():
    lists = []
    for source in LISTS:
        list_id = slug(source['title'])
        items, seen = [], set()
        groups = source.get('groups', {})
        for record in source['items']:
            record_id = f"{list_id}-{slug(record['name'])}"
            if record_id in seen:
                raise SystemExit(f'Duplicate equipment id {record_id}')
            if record.get('group') and record['group'] not in groups:
                raise SystemExit(f"{record_id} uses undeclared group {record['group']}")
            seen.add(record_id)
            items.append({'id': record_id, **record})
        lists.append({'id': list_id, 'title': source['title'], 'page': source['page'], 'source': source['source'],
                      'crews': source['crews'], **({'groups': groups} if groups else {}), 'items': items})
    all_ids = {item['id'] for lst in lists for item in lst['items']}
    for lst in lists:
        for record in lst['items']:
            if record.get('requiresEquipment') and record['requiresEquipment'] not in all_ids:
                raise SystemExit(f"{record['id']} requires unknown equipment {record['requiresEquipment']}")
    return {
        'title': 'BMG3 Crew Equipment Lists',
        'source': 'Official BMG app equipment lists (screenshots, 2026-09-30); Batman list from BMG3_COMPENDIUM_1-4_copy.pdf p.35',
        'lists': lists,
    }


if __name__ == '__main__':
    data = build()
    text = json.dumps(data, indent=2, ensure_ascii=False)
    (ROOT / 'data' / 'equipment-data.json').write_text(text + '\n', encoding='utf-8')
    (ROOT / 'data' / 'equipment-data.js').write_text(f'window.BATMAN_EQUIPMENT_DATA = {text};\n', encoding='utf-8')
    count = sum(len(lst['items']) for lst in data['lists'])
    print(f"Wrote {count} equipment items across {len(data['lists'])} crew lists.")
    if UNLINKED:
        print('Granted rules with no compendium entry (kept unlinked):', ', '.join(sorted(UNLINKED)))
