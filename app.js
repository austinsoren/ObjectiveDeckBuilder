(() => {
  'use strict';

  const STORAGE_KEY = 'batman-objective-deck-builder-v1';
  const SAVES_KEY = 'batman-objective-deck-builder-saves-v1';
  const ACTIVE_SLOT_KEY = 'batman-objective-deck-builder-active-slot-v1';
  const rawCards = Array.isArray(window.BATMAN_CARD_DATA) ? window.BATMAN_CARD_DATA : [];
  const rawCharacters = Array.isArray(window.BATMAN_CHARACTER_DATA) ? window.BATMAN_CHARACTER_DATA.map(normalizeCharacterRecord) : [];
  const referenceData = window.BATMAN_REFERENCE_DATA && typeof window.BATMAN_REFERENCE_DATA === 'object' ? window.BATMAN_REFERENCE_DATA : { entries: [] };
  const referenceEntries = Array.isArray(referenceData.entries) ? referenceData.entries : [];
  const referenceById = new Map(referenceEntries.map(entry => [entry.id, entry]));
  const referenceSectionOrder = ['Core Rules','Traits','Weapon Rules','Templates','Effects','Equipment','Objective Card Keywords'];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const slug = (value = '') => normalize(value).replace(/\s+/g, '-');


  function normalizeCharacterRecord(character) {
    const crews = Array.isArray(character.crews)
      ? character.crews.filter(Boolean)
      : character.crew
        ? [character.crew]
        : [];
    return {
      ...character,
      crews,
      crew: crews[0] || character.crew || ''
    };
  }

  const affiliations = [...new Set(rawCards.map(card => card.affiliation).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const defaults = {
    affiliation: affiliations[0] || '',
    selected: [],
    roster: [],
    overrides: {},
    play: null,
    filters: { search: '', category: 'buildable', copies: 'all', sort: 'title', availableOnly: false, tags: [] },
    characterFilters: { search: '', crew: 'all', baseSize: 'all', sort: 'name' },
    referenceFilters: { search: '', section: 'all', sort: 'source', selectedOnly: false, letter: 'all' },
    crewFilters: { search: '', sort: 'name', rank: 'all' },
    equipmentFilters: { characterId: '', search: '', showUnavailable: false },
    crewBuilder: { crew: '', repCap: 350, fundingCap: 1500, bossId: null, roster: [], equipmentList: '', equipment: {} }
  };

  // Traits that raise a crew's Funding cap when recruited (some only while the model is the Boss).
  const FUNDING_BONUS_TRAITS = {
    '2e327b2974ad': { amount: 350, bossOnly: false, label: 'Business Agent' },
    '008bf989cb19': { amount: 300, bossOnly: true, label: 'Dirty Money' },
    '931c443ead31': { amount: 500, bossOnly: true, label: 'Lord of Business' },
    'f1b6b9692b5f': { amount: 400, bossOnly: false, label: 'Millionaire' },
    'c61e010e5d3a': { amount: 300, bossOnly: false, label: 'Public Resources' }
  };

  // Crew composition rank order — a crew may hold at most one Leader and one Sidekick.
  const RANK_ORDER = { Leader: 0, Sidekick: 1, Henchman: 2, 'Free Agent': 3 };
  const rankSortIndex = rank => RANK_ORDER[rank] ?? 4;

  // Generic pattern-based crew-building rule detectors. Rather than hand-curating every
  // trait, these match against the trait label (for bracketed "Trait (X)" rules, where X is
  // parsed straight from the label) or the compendium rule body (for phrasing that recurs
  // across traits, such as "cannot be recruited").
  const LIEUTENANT_RE = /^Lieutenant\s*\(([^)]+)\)$/i;
  const REQUIRED_RE = /^Required\s*\(([^)]+)\)$/i;
  const ELITE_RE = /^Elite\s*\(([^)]+)\)$/i;
  const ELITE_BOSS_RE = /^Elite\s*Boss\s*\(([^)]+)\)$/i;
  const RECRUIT_ALLOWANCE_RE = /recruit up to (\d+) Henchm\w* with the ([\w][\w\s]*?) trait/i;
  const PREREQUISITE_TRAIT_RE = /can only be hired in a crew if there is a model with the (.+?) trait/i;

  const stripActorSuffix = (value = '') => value.replace(/\s*\([^)]*\)\s*$/, '').trim();

  function characterMatchesName(character, query) {
    const target = normalize(stripActorSuffix(query));
    if (!target) return false;
    return [character.name, character.alias].filter(Boolean).some(value =>
      normalize(stripActorSuffix(value)) === target || normalize(value) === normalize(query));
  }

  function traitReferenceBody(trait) {
    return referenceById.get(trait.referenceId)?.body || '';
  }

  // Cross-affiliation "recruit up to X Henchmen with the Y trait" rules (e.g. Crime Family
  // bribing Cops) never apply to models with the Incorruptible trait — it can only be recruited
  // into a crew whose Boss shares its own affiliation.
  function isCrossRecruitEligible(character, recruitAllowance) {
    if (!recruitAllowance || character.rank !== 'Henchman') return false;
    const traits = character.traits || [];
    if (traits.some(trait => trait.label === 'Incorruptible')) return false;
    return traits.some(trait => trait.label === recruitAllowance.keyword);
  }

  // Boss-independent lookup of the strongest "recruit up to X Henchmen with the Y trait"
  // allowance granted by a set of in-crew models (e.g. Carmine Falcone's Corrupt trait letting a
  // Crime Family crew bribe in Cops). Used when resolving a roster's valid ids — at that point
  // there is no boss context yet, unlike the full crewRuleEffects() used during live validation.
  function computeRecruitAllowance(rosterCharacters) {
    let recruitAllowance = null;
    rosterCharacters.forEach(character => {
      (character.traits || []).forEach(trait => {
        const match = RECRUIT_ALLOWANCE_RE.exec(traitReferenceBody(trait));
        if (match) {
          const cap = parseInt(match[1], 10);
          const keyword = match[2].trim();
          if (!recruitAllowance || cap > recruitAllowance.cap) recruitAllowance = { cap, keyword, grantedBy: trait.label };
        }
      });
    });
    return recruitAllowance;
  }

  // Resolves a stored/imported roster's character ids to the ones that are actually legal to
  // keep: models native to the crew, plus any cross-recruited models (e.g. Cops bribed in via a
  // Corrupt trait) that a native member's trait allows. Used wherever a roster is read back from
  // persistence (save slots, share links, JSON import) so those models aren't silently dropped.
  function resolveCrewRosterIds(ids, crew) {
    const uniqueIds = [...new Set(Array.isArray(ids) ? ids : [])];
    const inCrewIds = uniqueIds.filter(id => rawCharacters.some(character => character.id === id && (!crew || (character.crews || [character.crew]).includes(crew))));
    if (!crew) return inCrewIds;
    const inCrewCharacters = inCrewIds.map(id => rawCharacters.find(character => character.id === id)).filter(Boolean);
    const recruitAllowance = computeRecruitAllowance(inCrewCharacters);
    const crossRecruitIds = uniqueIds.filter(id => {
      if (inCrewIds.includes(id)) return false;
      const character = rawCharacters.find(c => c.id === id);
      return character && isCrossRecruitEligible(character, recruitAllowance);
    });
    return [...inCrewIds, ...crossRecruitIds];
  }

  // Derives crew-building effects (funding cost overrides + non-blocking warnings) from the
  // roster's traits: leader-conditional Lieutenant costs, Required(X) prerequisites, Elite/Elite
  // Boss type caps, "cannot be recruited" auto-add models, and Corrupt-style cross-affiliation
  // recruiting allowances. Per project convention, none of this ever blocks an action — it only
  // informs the validation summary and (for funding) the totals.
  function crewRuleEffects(rosterCharacters) {
    const cb = state.crewBuilder;
    const boss = rosterCharacters.find(character => character.id === cb.bossId) || null;
    const warnings = [];
    const fundingOverrides = new Map();
    const eliteByType = new Map();
    const eliteBossTypes = new Set();
    let recruitAllowance = null;

    rosterCharacters.forEach(character => {
      (character.traits || []).forEach(trait => {
        const label = trait.label || '';
        let match;
        if ((match = LIEUTENANT_RE.exec(label))) {
          if (boss && characterMatchesName(boss, match[1])) {
            fundingOverrides.set(character.id, { amount: 0, reason: `Lieutenant (${match[1]})` });
          }
        } else if ((match = REQUIRED_RE.exec(label))) {
          const present = rosterCharacters.some(other => other.id !== character.id && characterMatchesName(other, match[1]));
          if (!present) warnings.push(`${character.name} requires ${match[1]} in the crew (Required trait).`);
        } else if ((match = ELITE_BOSS_RE.exec(label))) {
          eliteBossTypes.add(match[1].trim().toLowerCase());
        } else if ((match = ELITE_RE.exec(label))) {
          const type = match[1].trim();
          if (!eliteByType.has(type)) eliteByType.set(type, []);
          eliteByType.get(type).push(character);
        }

        const body = traitReferenceBody(trait);
        if (/cannot be recruited/i.test(body)) {
          warnings.push(`${character.name} (${label}) is not normally hand-recruited — it's meant to be added automatically by another model's trait.`);
        }
        if ((match = RECRUIT_ALLOWANCE_RE.exec(body))) {
          const cap = parseInt(match[1], 10);
          const keyword = match[2].trim();
          if (!recruitAllowance || cap > recruitAllowance.cap) recruitAllowance = { cap, keyword, grantedBy: label };
        }
        if ((match = PREREQUISITE_TRAIT_RE.exec(body))) {
          const requiredTraits = match[1].split(/\s*(?:and\/or|,|\bor\b|\band\b)\s*/i).map(value => value.trim()).filter(Boolean);
          const present = rosterCharacters.some(other => other.id !== character.id &&
            (other.traits || []).some(otherTrait => requiredTraits.includes(otherTrait.label)));
          if (!present) warnings.push(`${character.name} requires a model with the ${requiredTraits.join(' or ')} trait in the crew (${label}).`);
        }
      });
    });

    eliteByType.forEach((members, type) => {
      if (members.length > 1 && !eliteBossTypes.has(type.toLowerCase())) {
        warnings.push(`Crew includes ${members.length} Elite (${type}) models but no Elite Boss (${type}) — normally only 1 is allowed.`);
      }
    });

    if (recruitAllowance) {
      const matches = rosterCharacters.filter(character => isCrossRecruitEligible(character, recruitAllowance));
      recruitAllowance.matchedCharacters = matches;
      if (matches.length > recruitAllowance.cap) {
        warnings.push(`Crew includes ${matches.length} Henchmen with the ${recruitAllowance.keyword} trait; ${recruitAllowance.grantedBy} normally allows up to ${recruitAllowance.cap}.`);
      }
    }

    return { warnings, fundingOverrides, recruitAllowance };
  }

  function effectiveCharacterFunding(character, fundingOverrides) {
    const override = fundingOverrides && fundingOverrides.get(character.id);
    return override ? override.amount : (character.funding || 0);
  }

  // ---- Equipment -------------------------------------------------------------------------------
  // Crew equipment lists transcribed from the compendium (data/equipment-data.js, built by
  // tools/build_equipment_data.py). Purchases are stored per model as
  // state.crewBuilder.equipment[characterId] = [{ id, choice }].
  const equipmentData = window.BATMAN_EQUIPMENT_DATA && Array.isArray(window.BATMAN_EQUIPMENT_DATA.lists) ? window.BATMAN_EQUIPMENT_DATA : { lists: [] };
  const equipmentLists = equipmentData.lists;
  const equipmentById = new Map(equipmentLists.flatMap(list => list.items.map(item => [item.id, { ...item, listId: list.id }])));
  // Lists hand out the same records (with listId) so group limits work wherever an item comes from.
  equipmentLists.forEach(list => { list.items = list.items.map(item => equipmentById.get(item.id)); });
  // Item ids from the first data build (compendium PDF list names), renamed when the lists were
  // re-transcribed from the official app.
  const LEGACY_EQUIPMENT_PREFIXES = [
    ['batman-crew-', 'batman-'], ['joker-crew-', 'joker-'], ['penguin-crew-', 'penguin-'],
    ['soldiers-of-fortune-crew-', 'bane-soldiers-of-fortune-'], ['court-of-owls-crew-', 'court-of-owls-'],
    ['the-riddler-crew-', 'riddler-'], ['mr-freeze-crew-', 'mr-freeze-'], ['league-of-assassins-crew-', 'league-of-assassins-'],
    ['birds-of-prey-crew-', 'birds-of-prey-'], ['organized-crime-crew-', 'organized-crime-']
  ];
  function upgradeEquipmentId(id) {
    if (equipmentById.has(id)) return id;
    const legacy = LEGACY_EQUIPMENT_PREFIXES.find(([prefix]) => id.startsWith(prefix));
    return legacy ? legacy[1] + id.slice(legacy[0].length) : id;
  }

  // Ranks that may buy equipment unless an item says otherwise (Special Equipment, compendium p.35).
  const EQUIPMENT_DEFAULT_RANKS = ['Henchman', 'Free Agent'];
  const referenceByTitle = new Map(referenceEntries.map(entry => [entry.title.toLowerCase(), entry]));

  function defaultEquipmentListId(crew) {
    return equipmentLists.find(list => list.crews.includes(crew))?.id || '';
  }

  function activeEquipmentList(cb = state.crewBuilder) {
    const id = cb.equipmentList || defaultEquipmentListId(cb.crew);
    return equipmentLists.find(list => list.id === id) || null;
  }

  // Compendium "Name:"/"Alias:" references use real names ("Harleen Quinzel", "Oswald C. Cobblepot")
  // or code names ("Joker", "Penguin (Arkham Knight)"), which map onto this app's alias / name
  // fields respectively, with varying middle names and leading "The"/"Dr.".
  function modelMatchesName(character, query) {
    const clean = value => normalize(value).replace(/^(the|dr) /, '');
    const target = clean(query);
    if (!target) return false;
    const fields = [character.name, character.alias].filter(value => value && normalize(value) !== 'unknown');
    if (fields.some(value => clean(value) === target || clean(stripActorSuffix(value)) === target)) return true;
    const tokens = target.split(' ').filter(token => token.length > 1);
    return tokens.length > 1 && fields.some(value => {
      const have = new Set(clean(value).split(' '));
      return tokens.every(token => have.has(token));
    });
  }

  function characterHasTrait(character, traitName) {
    const target = normalize(traitName);
    return (character.traits || []).some(trait => {
      const label = normalize(trait.label);
      return label === target || label.startsWith(`${target} `) && /\(/.test(trait.label.slice(traitName.length));
    });
  }

  // Duplicate-trait key: the compendium entry, following "See X." redirects (Grapple Gun → Batclaw).
  function ruleKey(rule) {
    let entry = rule.referenceId ? referenceById.get(rule.referenceId) : null;
    const redirect = entry && /^See ([^.]+)\.?$/.exec(entry.body.trim());
    if (redirect && referenceByTitle.has(redirect[1].toLowerCase())) entry = referenceByTitle.get(redirect[1].toLowerCase());
    return entry ? entry.id : `${rule.category}:${normalize(rule.label)}`;
  }

  function modelEquipment(characterId, cb = state.crewBuilder) {
    return (cb.equipment?.[characterId] || [])
      .map(entry => ({ ...entry, item: equipmentById.get(entry.id) }))
      .filter(entry => entry.item);
  }

  function equipmentChoice(entry) {
    return entry.item.choices?.find(choice => choice.id === entry.choice) || null;
  }

  function equipmentEntryLabel(entry) {
    const choice = equipmentChoice(entry);
    return choice ? `${entry.item.name}: ${choice.label}` : entry.item.name;
  }

  function equipmentGrantedRules(entry) {
    return [...entry.item.grants, ...(equipmentChoice(entry)?.grants || [])];
  }

  // Printed traits/weapon rules plus everything granted by purchased equipment. Granted rules carry
  // `equipment` (the item label) so the UI and print sheets can highlight where they came from.
  function rosterCharacterRules(character) {
    const granted = modelEquipment(character.id).flatMap(entry =>
      equipmentGrantedRules(entry).map(rule => ({ ...rule, equipment: equipmentEntryLabel(entry), stacks: !!entry.item.stacks })));
    return [...characterRules(character), ...granted];
  }

  function equipmentTotals(cb = state.crewBuilder) {
    let funding = 0, rep = 0, count = 0;
    cb.roster.forEach(id => modelEquipment(id, cb).forEach(({ item }) => { funding += item.cost || 0; rep += item.rep || 0; count += 1; }));
    return { funding, rep, count };
  }

  function characterEquipmentCost(characterId) {
    return modelEquipment(characterId).reduce((sum, { item }) => sum + (item.cost || 0), 0);
  }

  // How many of each item, item choice, and item group (e.g. Iceberg Lounge options) the whole crew has bought.
  function crewEquipmentCounts(cb = state.crewBuilder) {
    const items = new Map(), choices = new Map(), groups = new Map();
    const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
    cb.roster.forEach(id => modelEquipment(id, cb).forEach(entry => {
      bump(items, entry.item.id);
      if (entry.choice) bump(choices, `${entry.item.id}:${entry.choice}`);
      if (entry.item.group) bump(groups, `${entry.item.listId}:${entry.item.group}`);
    }));
    return { items, choices, groups };
  }

  // A list-level group whose items share one crew-wide limit, e.g. "only 1 Iceberg Lounge option".
  function equipmentGroup(item) {
    return item.group ? equipmentLists.find(list => list.id === item.listId)?.groups?.[item.group] || null : null;
  }

  function formatEquipmentCost(item) {
    return `$${item.cost}${item.rep ? ` + ${item.rep} Rep` : ''}`;
  }

  function formatEquipmentLimit(item) {
    const [min, max] = item.limit;
    return max == null ? 'No limit' : `${min}-${max}`;
  }

  // Reasons this model cannot hold the item at all (rank / name / trait / Boss restrictions and
  // crew prerequisites). An empty list means the item is available to the model.
  function equipmentRestrictionReasons(item, character, rosterCharacters, cb = state.crewBuilder) {
    const reasons = [];
    const only = item.only || {};
    if (only.names) {
      if (!only.names.some(name => modelMatchesName(character, name))) reasons.push(`Only ${only.names.join(' / ')} can take this.`);
    } else {
      const ranks = only.ranks || EQUIPMENT_DEFAULT_RANKS;
      if (!ranks.includes(character.rank)) reasons.push(`Only ${ranks.join(' / ')} models can take this.`);
    }
    if (only.traits && !only.traits.some(trait => characterHasTrait(character, trait))) reasons.push(`Requires the ${only.traits.join(' or ')} trait.`);
    if (only.notTraits && only.notTraits.some(trait => characterHasTrait(character, trait))) reasons.push(`Models with the ${only.notTraits.join(' / ')} trait cannot take this.`);
    if (only.bossOnly && cb.bossId !== character.id) reasons.push('This model must be the Boss.');
    if (item.requiresBossTrait) {
      const boss = rosterCharacters.find(member => member.id === cb.bossId);
      if (!boss || !characterHasTrait(boss, item.requiresBossTrait)) reasons.push(`Your Boss must have the ${item.requiresBossTrait} trait.`);
    }
    if (item.requires && !rosterCharacters.some(member => item.requires.some(name => modelMatchesName(member, name)))) {
      reasons.push(`Needs ${item.requires.join(' or ')} in the crew.`);
    }
    if (item.requiresEquipment && !crewEquipmentCounts(cb).items.has(item.requiresEquipment)) {
      reasons.push(`Needs ${equipmentById.get(item.requiresEquipment)?.name || 'another item'} bought first.`);
    }
    return reasons;
  }

  // Traits this item (or choice) would give the model that it already has — printed or from other
  // equipment. A model cannot have the same trait more than once (Equipment Rules, NB).
  function duplicateEquipmentTraits(character, item, choiceId, ignoreItemId = item.id) {
    if (item.stacks) return [];
    const existing = new Map();
    characterRules(character).forEach(rule => existing.set(ruleKey(rule), rule.label));
    modelEquipment(character.id).filter(entry => entry.item.id !== ignoreItemId).forEach(entry =>
      equipmentGrantedRules(entry).forEach(rule => existing.set(ruleKey(rule), `${rule.label} (${equipmentEntryLabel(entry)})`)));
    const granted = [...item.grants, ...(item.choices?.find(choice => choice.id === choiceId)?.grants || [])];
    return granted.filter(rule => rule.category === 'trait' && existing.has(ruleKey(rule))).map(rule => rule.label);
  }

  function validateEquipment(rosterCharacters, cb = state.crewBuilder) {
    const errors = [];
    const list = activeEquipmentList(cb);
    const counts = crewEquipmentCounts(cb);
    rosterCharacters.forEach(character => modelEquipment(character.id, cb).forEach(entry => {
      const label = `${character.name}'s ${equipmentEntryLabel(entry)}`;
      if (!list || entry.item.listId !== list.id) errors.push(`${label} is not on the ${list ? list.title : 'selected'} equipment list.`);
      equipmentRestrictionReasons(entry.item, character, rosterCharacters, cb).forEach(reason => errors.push(`${label}: ${reason}`));
      if (entry.item.choices && !equipmentChoice(entry)) errors.push(`${label}: choose an option.`);
      const duplicates = duplicateEquipmentTraits(character, entry.item, entry.choice);
      if (duplicates.length) errors.push(`${label} grants ${duplicates.join(', ')}, which ${character.name} already has — a model cannot have the same trait twice.`);
    }));
    counts.items.forEach((count, id) => {
      const item = equipmentById.get(id);
      const max = item?.limit?.[1];
      if (max != null && count > max) errors.push(`${count} × ${item.name} bought; the crew limit is ${formatEquipmentLimit(item)}.`);
      (item?.choices || []).forEach(choice => {
        const chosen = counts.choices.get(`${id}:${choice.id}`) || 0;
        if (choice.limit != null && chosen > choice.limit) errors.push(`${chosen} × ${choice.label} bought; the crew limit is 0-${choice.limit}.`);
      });
    });
    equipmentLists.forEach(list => Object.entries(list.groups || {}).forEach(([groupId, group]) => {
      const bought = counts.groups.get(`${list.id}:${groupId}`) || 0;
      if (bought > group.limit) errors.push(`${bought} ${group.label} bought; only ${group.limit} may be selected.`);
    }));
    return errors;
  }

  let saves = migrateLegacyStorage(loadSaves());
  let activeSlotId = localStorage.getItem(ACTIVE_SLOT_KEY);
  if (!saves[activeSlotId]) activeSlotId = Object.keys(saves)[0];
  let state = sanitizeState(saves[activeSlotId]?.data);
  let activeCardId = null;
  let activeCardContext = 'builder';
  let toastTimer = null;
  let playSearchQuery = '';

  const elements = {
    affiliation: $('#affiliationSelect'), search: $('#searchInput'), category: $('#categoryFilter'), copies: $('#copyFilter'),
    sort: $('#sortSelect'), availableOnly: $('#availableOnly'), tagFilters: $('#tagFilters'), cardGrid: $('#cardGrid'),
    visibleCount: $('#visibleCount'), libraryTitle: $('#libraryTitle'), activeFilters: $('#activeFilters'), emptyLibrary: $('#emptyLibrary'),
    deckList: $('#deckList'), validation: $('#validationSummary'), baseTotal: $('#baseTotal'), generalTotal: $('#generalTotal'),
    affiliationTotal: $('#affiliationTotal'), singleTotal: $('#singleTotal'), bonusTotal: $('#bonusTotal'), baseMeter: $('#baseMeter'),
    generalMeter: $('#generalMeter'), singleMeter: $('#singleMeter'), bonusMeter: $('#bonusMeter'), selectedDesignCount: $('#selectedDesignCount'),
    rosterList: $('#rosterList'), modelForm: $('#modelForm'), saveStatus: $('#saveStatus'), toast: $('#toast'),
    saveSlotSelect: $('#saveSlotSelect'), newSaveSlot: $('#newSaveSlot'), renameSaveSlot: $('#renameSaveSlot'), deleteSaveSlot: $('#deleteSaveSlot'),
    copyDeckLink: $('#copyDeckLink'), copyCrewLink: $('#copyCrewLink'),
    cardDialog: $('#cardDialog'), dialogImage: $('#dialogImage'), dialogTitle: $('#dialogTitle'), dialogCategory: $('#dialogCategory'),
    dialogBadges: $('#dialogBadges'), dialogRequirement: $('#dialogRequirement'), dialogText: $('#dialogText'), dialogToggle: $('#dialogToggleCard'),
    metadataDialog: $('#metadataDialog'), metadataForm: $('#metadataForm'), editTitle: $('#editTitle'), editSubtitle: $('#editSubtitle'),
    editRank: $('#editRank'), editTags: $('#editTags'), rulesDialog: $('#rulesDialog'),
    playDialog: $('#playDialog'), playTitle: $('#playTitle'), playSessionNote: $('#playSessionNote'), playRound: $('#playRound'),
    playHandCount: $('#playHandCount'), playDeckCount: $('#playDeckCount'), playDiscardCount: $('#playDiscardCount'),
    playDeckCountSide: $('#playDeckCountSide'), playDiscardCountSide: $('#playDiscardCountSide'), playPhaseEyebrow: $('#playPhaseEyebrow'),
    playPhaseTitle: $('#playPhaseTitle'), playPhaseHelp: $('#playPhaseHelp'), playPrimaryAction: $('#playPrimaryAction'),
    playSkipAction: $('#playSkipAction'), playUndo: $('#playUndo'), playHand: $('#playHand'), playSelectionCount: $('#playSelectionCount'),
    playLog: $('#playLog'), startPlay: $('#startPlay'),
    playCrewCount: $('#playCrewCount'), playCrewList: $('#playCrewList'), playDrawCard: $('#playDrawCard'),
    playSearchInput: $('#playSearchInput'), playSearchResults: $('#playSearchResults'),
    playDiscardSummary: $('#playDiscardSummary'), playDiscardList: $('#playDiscardList'), playDiscardShuffleAll: $('#playDiscardShuffleAll'),
    characterView: $('#characterView'), characterNav: $('#characterNavButton'), characterSearch: $('#characterSearch'),
    characterCrew: $('#characterCrew'), characterBaseSize: $('#characterBaseSize'), characterSort: $('#characterSort'),
    characterGrid: $('#characterGrid'), characterVisibleCount: $('#characterVisibleCount'), characterTotalCount: $('#characterTotalCount'),
    characterCrewCount: $('#characterCrewCount'), characterTitle: $('#characterTitle'), characterActiveFilters: $('#characterActiveFilters'),
    emptyCharacters: $('#emptyCharacters'), characterDialog: $('#characterDialog'), crewPrintDialog: $('#crewPrintDialog'), characterDialogImage: $('#characterDialogImage'),
    characterDialogCrew: $('#characterDialogCrew'), characterDialogTitle: $('#characterDialogTitle'), characterDialogAlias: $('#characterDialogAlias'),
    characterDialogBadges: $('#characterDialogBadges'), characterDialogStats: $('#characterDialogStats'),
    characterDialogTraits: $('#characterDialogTraits'), characterDialogWeapons: $('#characterDialogWeapons'), characterDialogSource: $('#characterDialogSource')
  };
  Object.assign(elements, {
    builderView: $('#builderView'), referenceView: $('#referenceView'), builderNav: $('#builderNavButton'), referenceNav: $('#referenceNavButton'),
    referenceSearch: $('#referenceSearch'), referenceSection: $('#referenceSection'), referenceSort: $('#referenceSort'),
    referenceSelectedOnly: $('#referenceSelectedOnly'), referenceAlphabet: $('#referenceAlphabet'), referenceList: $('#referenceList'),
    referenceVisibleCount: $('#referenceVisibleCount'), referenceTotalCount: $('#referenceTotalCount'), referenceTitle: $('#referenceTitle'),
    referenceActiveFilters: $('#referenceActiveFilters'), emptyReference: $('#emptyReference'), referenceExpandAll: $('#referenceExpandAll'),
    dialogRuleRefs: $('#dialogRuleRefs'), dialogRuleRefList: $('#dialogRuleRefList'), ruleTooltip: $('#ruleTooltip')
  });
  Object.assign(elements, {
    crewView: $('#crewView'), crewNav: $('#crewNavButton'), crewFactionSelect: $('#crewFactionSelect'),
    crewRepCapSlider: $('#crewRepCapSlider'), crewRepCapValue: $('#crewRepCapValue'), crewFundingCapInput: $('#crewFundingCapInput'),
    crewSearch: $('#crewSearch'), crewSort: $('#crewSort'), crewRankFilter: $('#crewRankFilter'), crewPoolCount: $('#crewPoolCount'), crewPoolTitle: $('#crewPoolTitle'),
    crewPoolVisibleCount: $('#crewPoolVisibleCount'), crewPoolGrid: $('#crewPoolGrid'), emptyCrewPool: $('#emptyCrewPool'),
    crewValidationSummary: $('#crewValidationSummary'), crewRepTotal: $('#crewRepTotal'), crewRepCapLabel: $('#crewRepCapLabel'),
    crewRepMeter: $('#crewRepMeter'), crewFundingTotal: $('#crewFundingTotal'), crewFundingCapLabel: $('#crewFundingCapLabel'),
    crewFundingMeter: $('#crewFundingMeter'), crewFundingBonusNote: $('#crewFundingBonusNote'), crewRosterCount: $('#crewRosterCount'),
    crewRosterList: $('#crewRosterList')
  });
  Object.assign(elements, {
    equipmentView: $('#equipmentView'), equipmentNav: $('#equipmentNavButton'), equipmentListSelect: $('#equipmentListSelect'),
    equipmentModelList: $('#equipmentModelList'), equipmentModelEyebrow: $('#equipmentModelEyebrow'), equipmentModelTitle: $('#equipmentModelTitle'),
    equipmentModelCost: $('#equipmentModelCost'), equipmentModelSummary: $('#equipmentModelSummary'), equipmentToolbar: $('#equipmentToolbar'),
    equipmentSearch: $('#equipmentSearch'), equipmentShowUnavailable: $('#equipmentShowUnavailable'), equipmentItemGrid: $('#equipmentItemGrid'),
    emptyEquipment: $('#emptyEquipment'), emptyEquipmentTitle: $('#emptyEquipmentTitle'), emptyEquipmentText: $('#emptyEquipmentText'),
    equipmentValidationSummary: $('#equipmentValidationSummary'), equipmentRepTotal: $('#equipmentRepTotal'), equipmentRepCapLabel: $('#equipmentRepCapLabel'),
    equipmentRepMeter: $('#equipmentRepMeter'), equipmentFundingTotal: $('#equipmentFundingTotal'), equipmentFundingCapLabel: $('#equipmentFundingCapLabel'),
    equipmentFundingMeter: $('#equipmentFundingMeter'), equipmentCrewCount: $('#equipmentCrewCount'), equipmentCrewList: $('#equipmentCrewList')
  });

  initialize();

  function initialize() {
    elements.affiliation.innerHTML = affiliations.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    elements.referenceTotalCount.textContent = `${referenceEntries.length} indexed entries`;
    initializeCrewFilters();
    bindEvents();
    renderSaveSlots();
    loadSharedLinkThenRender();
  }

  function syncControlsFromState() {
    elements.affiliation.value = affiliations.includes(state.affiliation) ? state.affiliation : (affiliations[0] || '');
    state.affiliation = elements.affiliation.value;
    elements.search.value = state.filters.search;
    elements.category.value = state.filters.category;
    elements.copies.value = state.filters.copies;
    elements.sort.value = state.filters.sort;
    elements.availableOnly.checked = state.filters.availableOnly;
    elements.referenceSearch.value = state.referenceFilters.search;
    elements.referenceSection.value = state.referenceFilters.section;
    elements.referenceSort.value = state.referenceFilters.sort;
    elements.referenceSelectedOnly.checked = state.referenceFilters.selectedOnly;
    initializeCharacterFilters();
  }

  async function loadSharedLinkThenRender() {
    await importSharedLinkIfPresent();
    syncControlsFromState();
    renderAll();
    applyRoute();
  }

  function sanitizeState(parsed) {
    try {
      return {
        ...structuredClone(defaults),
        ...(parsed || {}),
        filters: { ...defaults.filters, ...(parsed?.filters || {}) },
        characterFilters: { ...defaults.characterFilters, ...(parsed?.characterFilters || {}) },
        referenceFilters: { ...defaults.referenceFilters, ...(parsed?.referenceFilters || {}) },
        crewFilters: { ...defaults.crewFilters, ...(parsed?.crewFilters || {}) },
        equipmentFilters: { ...defaults.equipmentFilters, ...(parsed?.equipmentFilters || {}) },
        crewBuilder: sanitizeCrewBuilder(parsed?.crewBuilder),
        selected: Array.isArray(parsed?.selected) ? parsed.selected.filter(id => rawCards.some(card => card.id === id)) : [],
        roster: Array.isArray(parsed?.roster) ? parsed.roster : [],
        overrides: parsed?.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
        play: parsed?.play && typeof parsed.play === 'object' ? parsed.play : null
      };
    } catch {
      return structuredClone(defaults);
    }
  }

  function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function loadSaves() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVES_KEY));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function persistSaves(savesToStore) {
    localStorage.setItem(SAVES_KEY, JSON.stringify(savesToStore));
  }

  // One-time upgrade path: older versions of this app kept a single save under STORAGE_KEY.
  // Wrap that save as the first named slot so existing players don't lose their deck.
  function migrateLegacyStorage(existingSaves) {
    if (Object.keys(existingSaves).length) return existingSaves;
    let legacy = null;
    try { legacy = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch {}
    const id = generateId();
    const migrated = { [id]: { name: 'My Save', updatedAt: Date.now(), data: legacy } };
    persistSaves(migrated);
    localStorage.setItem(ACTIVE_SLOT_KEY, id);
    if (legacy) localStorage.removeItem(STORAGE_KEY);
    return migrated;
  }

  function renderSaveSlots() {
    if (!elements.saveSlotSelect) return;
    const entries = Object.entries(saves).sort((a, b) => a[1].name.localeCompare(b[1].name));
    elements.saveSlotSelect.innerHTML = entries.map(([id, slot]) => `<option value="${id}">${escapeHtml(slot.name)}</option>`).join('');
    elements.saveSlotSelect.value = activeSlotId;
  }

  function switchToSlot(id) {
    activeSlotId = id;
    localStorage.setItem(ACTIVE_SLOT_KEY, activeSlotId);
    state = sanitizeState(saves[activeSlotId]?.data);
    syncControlsFromState();
    renderAll();
  }

  function sanitizeCrewBuilder(raw) {
    const base = { ...structuredClone(defaults.crewBuilder), ...(raw && typeof raw === 'object' ? raw : {}) };
    const crews = new Set(rawCharacters.flatMap(character => character.crews || (character.crew ? [character.crew] : [])));
    if (!crews.has(base.crew)) base.crew = '';
    base.repCap = Number.isFinite(Number(base.repCap)) ? Number(base.repCap) : defaults.crewBuilder.repCap;
    base.fundingCap = Number.isFinite(Number(base.fundingCap)) ? Number(base.fundingCap) : defaults.crewBuilder.fundingCap;
    base.roster = resolveCrewRosterIds(base.roster, base.crew);
    base.bossId = base.roster.includes(base.bossId) ? base.bossId : null;
    base.equipmentList = equipmentLists.some(list => list.id === base.equipmentList) ? base.equipmentList : '';
    base.equipment = sanitizeEquipment(base.equipment, base.roster);
    return base;
  }

  // Keeps only purchases of known items by models still on the roster, one of each item per model.
  function sanitizeEquipment(raw, roster) {
    const clean = {};
    if (!raw || typeof raw !== 'object') return clean;
    roster.forEach(id => {
      const seen = new Set();
      const entries = (Array.isArray(raw[id]) ? raw[id] : []).map(entry => typeof entry === 'string' ? { id: entry } : entry)
        .map(entry => entry && typeof entry.id === 'string' ? { ...entry, id: upgradeEquipmentId(entry.id) } : entry)
        .filter(entry => entry && equipmentById.has(entry.id) && !seen.has(entry.id) && seen.add(entry.id))
        .map(entry => {
          const item = equipmentById.get(entry.id);
          const choice = item.choices?.some(option => option.id === entry.choice) ? entry.choice : null;
          return { id: entry.id, choice };
        });
      if (entries.length) clean[id] = entries;
    });
    return clean;
  }

  function persist() {
    try {
      saves[activeSlotId] = saves[activeSlotId] || { name: 'My Save', updatedAt: 0, data: null };
      saves[activeSlotId].data = state;
      saves[activeSlotId].updatedAt = Date.now();
      persistSaves(saves);
      localStorage.setItem(ACTIVE_SLOT_KEY, activeSlotId);
      elements.saveStatus.textContent = 'Saved locally';
    } catch {
      elements.saveStatus.textContent = 'Session only';
    }
  }

  function cardWithOverrides(card) {
    const override = state.overrides[card.id] || {};
    return {
      ...card,
      ...override,
      tags: Array.isArray(override.tags) ? override.tags : card.tags
    };
  }

  function allCards() { return rawCards.map(cardWithOverrides); }
  function getCard(id) {
    const card = rawCards.find(item => item.id === id);
    return card ? cardWithOverrides(card) : null;
  }
  function isSelected(id) { return state.selected.includes(id); }

  function initializeCharacterFilters() {
    if (!elements.characterCrew) return;
    const crews = [...new Set(rawCharacters.flatMap(character => character.crews || (character.crew ? [character.crew] : [])).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    const baseSizes = [...new Set(rawCharacters.map(character => character.baseSizeMm).filter(Number.isFinite))].sort((a,b) => a-b);
    elements.characterCrew.innerHTML = '<option value="all">All crews</option>' + crews.map(crew => `<option value="${escapeHtml(crew)}">${escapeHtml(crew)}</option>`).join('');
    elements.characterBaseSize.innerHTML = '<option value="all">All base sizes</option>' + baseSizes.map(size => `<option value="${size}">${size} mm</option>`).join('');
    elements.characterSearch.value = state.characterFilters.search;
    elements.characterCrew.value = crews.includes(state.characterFilters.crew) ? state.characterFilters.crew : 'all';
    elements.characterBaseSize.value = baseSizes.includes(Number(state.characterFilters.baseSize)) ? String(state.characterFilters.baseSize) : 'all';
    elements.characterSort.value = ['name','reputation-desc','funding-desc','base'].includes(state.characterFilters.sort) ? state.characterFilters.sort : 'name';
    state.characterFilters.crew = elements.characterCrew.value;
    state.characterFilters.baseSize = elements.characterBaseSize.value;
    state.characterFilters.sort = elements.characterSort.value;
    elements.characterTotalCount.textContent = `${rawCharacters.length} unique character card${rawCharacters.length === 1 ? '' : 's'}`;
    elements.characterCrewCount.textContent = `${crews.length} crew${crews.length === 1 ? '' : 's'}`;
  }

  function initializeCrewFilters() {
    if (!elements.crewFactionSelect) return;
    const crews = [...new Set(rawCharacters.flatMap(character => character.crews || (character.crew ? [character.crew] : [])))]
      .filter(crew => crew && crew !== 'Unknown')
      .sort((a,b) => a.localeCompare(b));
    elements.crewFactionSelect.innerHTML = '<option value="">Choose a crew…</option>' + crews.map(crew => `<option value="${escapeHtml(crew)}">${escapeHtml(crew)}</option>`).join('');
  }

  function bindEvents() {
    elements.saveSlotSelect.addEventListener('change', event => {
      switchToSlot(event.target.value);
      toast(`Switched to “${saves[activeSlotId].name}”`);
    });
    elements.newSaveSlot.addEventListener('click', () => {
      const name = prompt('Name this save:', `Save ${Object.keys(saves).length + 1}`);
      if (name === null) return;
      const id = generateId();
      saves[id] = { name: name.trim() || 'Untitled save', updatedAt: Date.now(), data: structuredClone(defaults) };
      persistSaves(saves);
      switchToSlot(id);
      renderSaveSlots();
      toast(`Created save “${saves[id].name}”`);
    });
    elements.renameSaveSlot.addEventListener('click', () => {
      const slot = saves[activeSlotId];
      if (!slot) return;
      const name = prompt('Rename this save:', slot.name);
      if (name === null || !name.trim()) return;
      slot.name = name.trim();
      persistSaves(saves);
      renderSaveSlots();
    });
    elements.deleteSaveSlot.addEventListener('click', () => {
      const ids = Object.keys(saves);
      if (ids.length <= 1) { alert('At least one save must remain.'); return; }
      const slot = saves[activeSlotId];
      if (!confirm(`Delete save “${slot?.name || 'this save'}”? This cannot be undone.`)) return;
      delete saves[activeSlotId];
      persistSaves(saves);
      switchToSlot(Object.keys(saves)[0]);
      renderSaveSlots();
      toast('Save deleted');
    });
    elements.copyDeckLink.addEventListener('click', copyDeckShareLink);
    elements.copyCrewLink.addEventListener('click', copyCrewShareLink);
    elements.affiliation.addEventListener('change', event => {
      state.affiliation = event.target.value;
      persist(); renderAll();
    });
    elements.search.addEventListener('input', event => {
      state.filters.search = event.target.value;
      persist(); renderLibrary();
    });
    elements.category.addEventListener('change', event => {
      state.filters.category = event.target.value;
      persist(); renderLibrary();
    });
    elements.copies.addEventListener('change', event => {
      state.filters.copies = event.target.value;
      persist(); renderLibrary();
    });
    elements.sort.addEventListener('change', event => {
      state.filters.sort = event.target.value;
      persist(); renderLibrary();
    });
    elements.availableOnly.addEventListener('change', event => {
      state.filters.availableOnly = event.target.checked;
      persist(); renderLibrary();
    });
    $('#resetFilters').addEventListener('click', () => {
      state.filters = structuredClone(defaults.filters);
      elements.search.value = '';
      elements.category.value = 'buildable';
      elements.copies.value = 'all';
      elements.sort.value = 'title';
      elements.availableOnly.checked = false;
      persist(); renderLibrary();
    });
    $('#clearTags').addEventListener('click', () => {
      state.filters.tags = [];
      persist(); renderLibrary();
    });
    elements.tagFilters.addEventListener('click', event => {
      const button = event.target.closest('[data-tag]');
      if (!button) return;
      const tag = button.dataset.tag;
      state.filters.tags = state.filters.tags.includes(tag) ? state.filters.tags.filter(item => item !== tag) : [...state.filters.tags, tag];
      persist(); renderLibrary();
    });
    elements.cardGrid.addEventListener('click', event => {
      const tile = event.target.closest('[data-card-id]');
      if (!tile) return;
      const id = tile.dataset.cardId;
      if (event.target.closest('[data-action="toggle"]')) toggleCard(id);
      if (event.target.closest('[data-action="details"]') || event.target.closest('.card-image-button')) openCard(id);
    });
    elements.deckList.addEventListener('click', event => {
      const row = event.target.closest('[data-card-id]');
      if (!row) return;
      if (event.target.closest('[data-action="remove"]')) toggleCard(row.dataset.cardId, false);
      else openCard(row.dataset.cardId);
    });
    elements.modelForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = $('#modelName').value.trim();
      const alias = $('#modelAlias').value.trim();
      const rank = $('#modelRank').value.trim();
      if (!name || !rank) return;
      state.roster.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, alias, rank });
      event.target.reset(); persist(); renderRoster(); renderDeck(); renderLibrary();
    });
    elements.rosterList.addEventListener('click', event => {
      const button = event.target.closest('[data-remove-model]');
      if (!button) return;
      state.roster = state.roster.filter(model => model.id !== button.dataset.removeModel);
      persist(); renderRoster(); renderDeck(); renderLibrary();
    });
    $('#clearDeck').addEventListener('click', () => {
      if (!state.selected.length || confirm('Clear every selected card bundle?')) {
        state.selected = []; persist(); renderAll();
      }
    });
    elements.startPlay.addEventListener('click', startOrResumePlay);
    elements.playPrimaryAction.addEventListener('click', handlePlayPrimaryAction);
    elements.playSkipAction.addEventListener('click', handlePlaySkipAction);
    elements.playUndo.addEventListener('click', undoPlayAction);
    elements.playHand.addEventListener('click', handlePlayHandClick);
    elements.playCrewList.addEventListener('click', handlePlayCrewListClick);
    elements.playDrawCard.addEventListener('click', drawCardManually);
    elements.playSearchInput.addEventListener('input', event => {
      playSearchQuery = event.target.value;
      renderPlaySearch();
    });
    elements.playSearchResults.addEventListener('click', handlePlaySearchResultsClick);
    elements.playDiscardList.addEventListener('click', handlePlayDiscardListClick);
    elements.playDiscardShuffleAll.addEventListener('click', shuffleDiscardPileIntoDeck);
    $('[data-close-play]').addEventListener('click', () => elements.playDialog.close());
    $('#restartPlay').addEventListener('click', restartPlaySession);
    $('#endPlay').addEventListener('click', endPlaySession);
    $('#autoBuild').addEventListener('click', autoBuild);
    $('#exportText').addEventListener('click', exportText);
    $('#importText').addEventListener('change', importText);
    $('#printDeck').addEventListener('click', printDeckProxies);
    $('#helpButton').addEventListener('click', () => elements.rulesDialog.showModal());
    $('[data-close-rules]').addEventListener('click', () => elements.rulesDialog.close());
    $('[data-close-dialog]').addEventListener('click', () => elements.cardDialog.close());
    $('[data-close-metadata]').addEventListener('click', () => elements.metadataDialog.close());
    elements.dialogToggle.addEventListener('click', () => { if (activeCardId) toggleCard(activeCardId); });
    $('#editMetadata').addEventListener('click', openMetadataEditor);
    elements.metadataForm.addEventListener('submit', saveMetadata);
    $('#resetMetadata').addEventListener('click', resetMetadata);
    [elements.cardDialog, elements.metadataDialog, elements.rulesDialog, elements.characterDialog].forEach(dialog => {
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    });
    [elements.cardDialog, elements.metadataDialog, elements.rulesDialog, elements.playDialog, elements.characterDialog].forEach(dialog => {
      dialog.addEventListener('close', hideRuleTooltip);
    });

    elements.builderNav.addEventListener('click', () => navigateTo('builder'));
    elements.characterNav.addEventListener('click', () => navigateTo('characters'));
    elements.referenceNav.addEventListener('click', () => navigateTo('reference'));
    window.addEventListener('hashchange', applyRoute);
    elements.characterSearch.addEventListener('input', event => {
      state.characterFilters.search = event.target.value;
      persist(); renderCharacters();
    });
    elements.characterCrew.addEventListener('change', event => {
      state.characterFilters.crew = event.target.value;
      persist(); renderCharacters();
    });
    elements.characterBaseSize.addEventListener('change', event => {
      state.characterFilters.baseSize = event.target.value;
      persist(); renderCharacters();
    });
    elements.characterSort.addEventListener('change', event => {
      state.characterFilters.sort = event.target.value;
      persist(); renderCharacters();
    });
    $('#resetCharacterFilters').addEventListener('click', () => {
      state.characterFilters = structuredClone(defaults.characterFilters);
      elements.characterSearch.value = '';
      elements.characterCrew.value = 'all';
      elements.characterBaseSize.value = 'all';
      elements.characterSort.value = 'name';
      persist(); renderCharacters();
    });
    elements.characterGrid.addEventListener('click', event => {
      const tile = event.target.closest('[data-character-id]');
      if (!tile || event.target.closest('[data-rule-ref]')) return;
      openCharacter(tile.dataset.characterId);
    });
    $('[data-close-character]').addEventListener('click', () => elements.characterDialog.close());
    elements.characterDialog.addEventListener('click', event => { if (event.target === elements.characterDialog) elements.characterDialog.close(); });

    elements.crewNav.addEventListener('click', () => navigateTo('crew'));
    elements.crewFactionSelect.addEventListener('change', event => {
      const cb = state.crewBuilder;
      const nextCrew = event.target.value;
      if (cb.roster.length && !confirm('Changing crews clears your current roster. Continue?')) {
        event.target.value = cb.crew;
        return;
      }
      cb.crew = nextCrew;
      cb.roster = [];
      cb.bossId = null;
      cb.equipment = {};
      cb.equipmentList = '';
      persist(); renderCrewBuilder();
    });
    elements.crewRepCapSlider.addEventListener('input', event => {
      state.crewBuilder.repCap = Number(event.target.value);
      elements.crewRepCapValue.textContent = state.crewBuilder.repCap;
      persist(); renderCrewBuilder();
    });
    elements.crewFundingCapInput.addEventListener('input', event => {
      const value = Number(event.target.value);
      state.crewBuilder.fundingCap = Number.isFinite(value) ? Math.max(0, value) : 0;
      persist(); renderCrewBuilder();
    });
    elements.crewSearch.addEventListener('input', event => {
      state.crewFilters.search = event.target.value;
      persist(); renderCrewBuilder();
    });
    elements.crewSort.addEventListener('change', event => {
      state.crewFilters.sort = event.target.value;
      persist(); renderCrewBuilder();
    });
    elements.crewRankFilter.addEventListener('change', event => {
      state.crewFilters.rank = event.target.value;
      persist(); renderCrewBuilder();
    });
    $('#resetCrewFilters').addEventListener('click', () => {
      state.crewFilters = structuredClone(defaults.crewFilters);
      persist(); renderCrewBuilder();
    });
    elements.crewPoolGrid.addEventListener('click', event => {
      const tile = event.target.closest('[data-character-id]');
      if (!tile || event.target.closest('[data-rule-ref]')) return;
      if (event.target.closest('[data-action="recruit"]')) {
        const id = tile.dataset.characterId;
        if (state.crewBuilder.roster.includes(id)) removeCrewMember(id); else recruitCharacter(id);
        return;
      }
      if (event.target.closest('.character-image-button')) openCharacter(tile.dataset.characterId);
    });
    elements.crewRosterList.addEventListener('click', event => {
      const row = event.target.closest('[data-character-id]');
      if (!row) return;
      if (event.target.closest('[data-rule-ref]')) return;
      if (event.target.closest('[data-action="remove"]')) removeCrewMember(row.dataset.characterId);
      else if (event.target.closest('[data-action="toggle-boss"]')) toggleCrewBoss(row.dataset.characterId);
      else if (event.target.closest('[data-action="equip"]')) navigateTo('equipment', row.dataset.characterId);
    });
    $('#clearCrew').addEventListener('click', () => {
      if (!state.crewBuilder.roster.length || confirm('Remove every recruited model from this crew?')) {
        state.crewBuilder.roster = []; state.crewBuilder.bossId = null; state.crewBuilder.equipment = {}; persist(); renderCrewBuilder();
      }
    });
    $('#exportCrewJson').addEventListener('click', exportCrewJson);
    $('#exportCrewText').addEventListener('click', exportCrewText);
    $('#importCrewJson').addEventListener('change', importCrewJson);
    $('#printCrew').addEventListener('click', printCrewRoster);
    $('[data-close-crew-print]').addEventListener('click', () => elements.crewPrintDialog.close());
    elements.crewPrintDialog.addEventListener('click', event => {
      if (event.target === elements.crewPrintDialog) { elements.crewPrintDialog.close(); return; }
      const choice = event.target.closest('[data-print-layout]');
      if (!choice) return;
      elements.crewPrintDialog.close();
      if (choice.dataset.printLayout === 'loadout') printCrewLoadouts();
      else printCrewProxies();
    });

    elements.equipmentNav.addEventListener('click', () => navigateTo('equipment'));
    elements.equipmentListSelect.addEventListener('change', event => {
      state.crewBuilder.equipmentList = event.target.value;
      persist(); renderEquipment();
    });
    elements.equipmentSearch.addEventListener('input', event => {
      state.equipmentFilters.search = event.target.value;
      persist(); renderEquipment();
    });
    elements.equipmentShowUnavailable.addEventListener('change', event => {
      state.equipmentFilters.showUnavailable = event.target.checked;
      persist(); renderEquipment();
    });
    elements.equipmentModelList.addEventListener('click', event => {
      const row = event.target.closest('[data-character-id]');
      if (row && !event.target.closest('[data-rule-ref]')) navigateTo('equipment', row.dataset.characterId);
    });
    elements.equipmentModelList.addEventListener('keydown', event => {
      const row = event.target.closest('[data-character-id]');
      if (!row || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      navigateTo('equipment', row.dataset.characterId);
    });
    elements.equipmentItemGrid.addEventListener('click', event => {
      const card = event.target.closest('[data-equipment-id]');
      const action = event.target.closest('[data-action]');
      if (!card || !action || action.disabled) return;
      const characterId = state.equipmentFilters.characterId;
      if (action.dataset.action === 'add-equipment') {
        const choice = card.querySelector('[data-equipment-choice]')?.value || null;
        addEquipment(characterId, card.dataset.equipmentId, choice);
      } else if (action.dataset.action === 'remove-equipment') {
        removeEquipment(characterId, card.dataset.equipmentId);
      }
    });
    elements.equipmentItemGrid.addEventListener('change', event => {
      const select = event.target.closest('[data-equipment-choice]');
      if (select) renderEquipment();
    });
    elements.equipmentCrewList.addEventListener('click', event => {
      const remove = event.target.closest('[data-action="remove-equipment"]');
      if (remove) { removeEquipment(remove.dataset.characterId, remove.dataset.equipmentId); return; }
      const model = event.target.closest('[data-action="select-model"]');
      if (model) navigateTo('equipment', model.dataset.characterId);
    });
    $('#clearModelEquipment').addEventListener('click', () => {
      const id = state.equipmentFilters.characterId;
      const character = rawCharacters.find(item => item.id === id);
      if (!character || !modelEquipment(id).length) return;
      if (!confirm(`Remove all equipment from ${character.name}?`)) return;
      delete state.crewBuilder.equipment[id];
      persist(); renderEquipment();
    });
    $('#equipmentBackToCrew').addEventListener('click', () => navigateTo('crew'));
    $('#printEquipmentCrew').addEventListener('click', printCrewRoster);

    elements.referenceSearch.addEventListener('input', event => {
      state.referenceFilters.search = event.target.value;
      persist(); renderReference();
    });
    elements.referenceSection.addEventListener('change', event => {
      state.referenceFilters.section = event.target.value;
      state.referenceFilters.letter = 'all';
      persist(); renderReference();
    });
    elements.referenceSort.addEventListener('change', event => {
      state.referenceFilters.sort = event.target.value;
      persist(); renderReference();
    });
    elements.referenceSelectedOnly.addEventListener('change', event => {
      state.referenceFilters.selectedOnly = event.target.checked;
      persist(); renderReference();
    });
    $('#resetReferenceFilters').addEventListener('click', () => {
      state.referenceFilters = structuredClone(defaults.referenceFilters);
      elements.referenceSearch.value = '';
      elements.referenceSection.value = 'all';
      elements.referenceSort.value = 'source';
      elements.referenceSelectedOnly.checked = false;
      persist(); renderReference();
    });
    elements.referenceAlphabet.addEventListener('click', event => {
      const button = event.target.closest('[data-reference-letter]');
      if (!button) return;
      state.referenceFilters.letter = button.dataset.referenceLetter;
      persist(); renderReference();
    });
    elements.referenceExpandAll.addEventListener('click', () => {
      const details = $$('details.reference-entry', elements.referenceList);
      const shouldOpen = details.some(item => !item.open);
      details.forEach(item => { item.open = shouldOpen; });
      elements.referenceExpandAll.textContent = shouldOpen ? 'Collapse results' : 'Expand results';
    });
    document.addEventListener('pointerover', handleRuleTooltipEnter);
    document.addEventListener('pointerout', handleRuleTooltipLeave);
    document.addEventListener('pointermove', positionRuleTooltip);
    document.addEventListener('focusin', handleRuleTooltipEnter);
    document.addEventListener('focusout', handleRuleTooltipLeave);
    document.addEventListener('click', handleRuleReferenceClick, true);
  }

  function renderAll() {
    renderRoster();
    renderLibrary();
    renderDeck();
    if (!elements.characterView.hidden) renderCharacters();
    if (!elements.referenceView.hidden) renderReference();
    if (!elements.crewView.hidden) renderCrewBuilder();
    if (!elements.equipmentView.hidden) renderEquipment();
  }

  function characterRequirementMet(card) {
    if (!card.subtitle || !card.rank) return false;
    const requirement = normalize(card.subtitle);
    const rank = normalize(card.rank);
    const nameMatches = name => name === requirement || name.startsWith(`${requirement} `);
    const manualMatch = state.roster.some(model => {
      const names = [model.name, model.alias].map(normalize).filter(Boolean);
      return names.some(nameMatches) && normalize(model.rank) === rank;
    });
    if (manualMatch) return true;
    return crewRosterCharacters().some(character => nameMatches(normalize(character.name)) && normalize(character.rank) === rank);
  }

  function libraryPool() {
    const category = state.filters.category;
    return allCards().filter(card => {
      if (card.hiddenUntilRequirementMet && !characterRequirementMet(card)) return false;
      if (category === 'buildable') return card.category === 'general' || (card.category === 'affiliation' && card.affiliation === state.affiliation);
      if (category === 'character') return card.category === 'character';
      if (category === 'reference') return ['event','encounter','speedforce','special'].includes(card.category);
      return true;
    });
  }

  function filteredCards() {
    const search = normalize(state.filters.search);
    let cards = libraryPool().filter(card => {
      if (state.filters.availableOnly && isSelected(card.id)) return false;
      if (state.filters.copies === 'single' && !card.isSingle) return false;
      if (state.filters.copies === 'multi' && card.isSingle) return false;
      if (/^\d+$/.test(state.filters.copies) && card.requiredCopies !== Number(state.filters.copies)) return false;
      if (state.filters.tags.length && !state.filters.tags.every(tag => card.tags.includes(tag))) return false;
      if (search) {
        const referencedRuleNames = cardReferenceEntries(card).map(entry => entry.title).join(' ');
        const haystack = normalize([card.title, card.subtitle, card.rank, card.affiliation, card.deckName, card.ocrText, card.tags.join(' '), referencedRuleNames].join(' '));
        if (!search.split(' ').every(token => haystack.includes(token))) return false;
      }
      return true;
    });
    const sorters = {
      title: (a,b) => a.title.localeCompare(b.title),
      'copies-desc': (a,b) => b.requiredCopies - a.requiredCopies || a.title.localeCompare(b.title),
      'copies-asc': (a,b) => a.requiredCopies - b.requiredCopies || a.title.localeCompare(b.title),
      category: (a,b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
    };
    cards.sort(sorters[state.filters.sort] || sorters.title);
    return cards;
  }

  function renderLibrary() {
    const pool = libraryPool();
    renderTagFilters(pool);
    const cards = filteredCards();
    elements.visibleCount.textContent = cards.length;
    elements.libraryTitle.textContent = ({buildable:'Buildable objectives',character:'Character objectives',reference:'Reference cards',all:'Complete card library'})[state.filters.category];
    elements.cardGrid.innerHTML = cards.map(renderCardTile).join('');
    elements.emptyLibrary.hidden = cards.length > 0;
    renderActiveFilters();
  }

  function renderTagFilters(pool) {
    const hiddenTags = new Set(['general','affiliation','character','event','encounter','speedforce','multi-copy','single-card']);
    const counts = new Map();
    pool.forEach(card => card.tags.forEach(tag => {
      if (!hiddenTags.has(tag) && !/^\d-copy-bundle$/.test(tag)) counts.set(tag, (counts.get(tag) || 0) + 1);
    }));
    const tags = [...counts.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, 30);
    elements.tagFilters.innerHTML = tags.map(([tag,count]) => `<button class="tag-chip ${state.filters.tags.includes(tag) ? 'active' : ''}" data-tag="${escapeHtml(tag)}" type="button">${escapeHtml(tag.replaceAll('-',' '))} <small>${count}</small></button>`).join('');
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.filters.search) chips.push(`Search: ${state.filters.search}`);
    state.filters.tags.forEach(tag => chips.push(tag.replaceAll('-',' ')));
    if (state.filters.copies !== 'all') chips.push(`Copies: ${state.filters.copies}`);
    elements.activeFilters.hidden = chips.length === 0;
    elements.activeFilters.innerHTML = chips.map(chip => `<span class="badge">${escapeHtml(chip)}</span>`).join('');
  }

  function renderCardTile(card) {
    const selected = isSelected(card.id);
    const buildable = ['general','affiliation','character'].includes(card.category);
    const categoryBadge = card.category === 'general' ? '<span class="badge general">General</span>' : card.category === 'character' ? '<span class="badge character">Character bonus</span>' : `<span class="badge">${escapeHtml(card.affiliation || card.category)}</span>`;
    const copyBadge = card.isSingle ? '<span class="badge single">Single</span>' : `<span class="badge copy">Add ×${card.requiredCopies}</span>`;
    const ruleRefs = renderRuleRefChips(card, 3);
    return `<article class="card-tile ${selected ? 'selected' : ''}" data-card-id="${card.id}">
      <button class="card-image-button" type="button" aria-label="View ${escapeHtml(card.title)}"><img src="${escapeHtml(card.thumbnail || card.image)}" data-full="${escapeHtml(card.image)}" loading="lazy" alt="${escapeHtml(card.title)}"></button>
      <div class="card-info">
        <h3 title="${escapeHtml(card.title)}">${escapeHtml(card.title)}</h3>
        <div class="card-meta">${categoryBadge}${copyBadge}</div>
        ${ruleRefs}
        ${buildable ? `<div class="card-actions"><button class="button ${selected ? 'ghost' : ''}" data-action="toggle" type="button">${selected ? 'Remove bundle' : `Add ${card.requiredCopies}`}</button><button class="button ghost details-button" data-action="details" type="button" aria-label="Card details">•••</button></div>` : '<p class="reference-note">Reference library card</p>'}
      </div>
    </article>`;
  }

  async function printDeckProxies() {
    const selected = state.selected.map(getCard).filter(Boolean)
      .sort((a,b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    if (!selected.length) { alert('Select at least one card before printing.'); return; }
    const copies = selected.flatMap(card => Array.from({ length: card.requiredCopies || 1 }, () => ({ image: card.image, title: card.title })));
    await printProxySheet(copies);
  }

  function printCrewRoster() {
    if (!crewRosterCharacters().length) { alert('Recruit at least one model before printing.'); return; }
    elements.crewPrintDialog.showModal();
  }

  function sortedRosterForPrint() {
    return crewRosterCharacters().sort((a,b) => a.name.localeCompare(b.name));
  }

  async function printCrewProxies() {
    const rosterCharacters = sortedRosterForPrint();
    const cards = rosterCharacters.map(character => ({ image: character.image, title: character.name }));
    await printProxySheet(cards, 'contain', renderCrewRulesPrintPage(rosterCharacters));
  }

  // One entry per compendium rule referenced by the given models (including rules granted by their
  // equipment, which remember the item they came from), grouped by traits / weapon rules.
  function collectPrintRules(characters) {
    const rules = new Map();
    characters.forEach(character => rosterCharacterRules(character).forEach(rule => {
      const entry = rule.referenceId ? referenceById.get(rule.referenceId) : null;
      const key = entry ? entry.id : `${rule.category}:${normalize(rule.label)}`;
      if (!rules.has(key)) rules.set(key, { entry, category: rule.category, title: entry?.title || rule.label, labels: new Set(), models: new Set(), equipment: new Set() });
      rules.get(key).labels.add(rule.label);
      rules.get(key).models.add(rule.equipment ? `${character.name} (${rule.equipment})` : character.name);
      if (rule.equipment) rules.get(key).equipment.add(rule.equipment);
    }));
    return [['trait', 'Traits', 'Trait'], ['weapon', 'Weapon Rules', 'Weapon Rule']].map(([category, heading, kind]) => ({
      heading, kind,
      items: [...rules.values()].filter(rule => rule.category === category).sort((a,b) => a.title.localeCompare(b.title))
    })).filter(group => group.items.length);
  }

  function renderPrintRule(rule, kind, showModels) {
    const labels = [...rule.labels].sort().join(', ');
    const body = rule.entry?.body || 'No compendium entry found for this rule.';
    const origin = rule.equipment?.size ? ` <span class="print-equipment-tag">Equipment: ${escapeHtml([...rule.equipment].sort().join(', '))}</span>` : '';
    return `<div class="print-rule${origin ? ' from-equipment' : ''}"><p><strong>[${escapeHtml(rule.title)}]</strong> - ${kind}${labels !== rule.title ? ` <em>(${escapeHtml(labels)})</em>` : ''}${origin}</p>
      <p class="print-rule-body">${renderDamageMarkers(escapeHtml(body)).replace(/\n/g, '<br>')}</p>
      ${showModels ? `<p class="print-rule-models">${escapeHtml([...rule.models].sort().join(', '))}</p>` : ''}</div>`;
  }

  function renderCrewRulesPrintPage(rosterCharacters) {
    const sections = collectPrintRules(rosterCharacters).map(group =>
      `<h2>${group.heading}</h2>${group.items.map(rule => renderPrintRule(rule, group.kind, true)).join('')}`).join('');
    return `<section class="print-rules"><h1>${escapeHtml(state.crewBuilder.crew || 'Crew')} — Rules Reference</h1>${renderEquipmentPrintSection(rosterCharacters, 'h2', true)}${sections}</section>`;
  }

  // Purchased equipment (one entry per item/choice) with its cost and full text, so items that
  // don't grant a compendium rule (Magazine, Med-pack…) still appear on the printed sheets.
  function renderEquipmentPrintSection(characters, heading, showModels) {
    const items = new Map();
    characters.forEach(character => modelEquipment(character.id).forEach(entry => {
      const label = equipmentEntryLabel(entry);
      if (!items.has(label)) items.set(label, { entry, label, models: [] });
      items.get(label).models.push(character.name);
    }));
    if (!items.size) return '';
    const list = activeEquipmentList();
    const rows = [...items.values()].sort((a,b) => a.label.localeCompare(b.label)).map(({ entry, label, models }) => {
      const granted = equipmentGrantedRules(entry).map(rule => rule.label);
      return `<div class="print-rule from-equipment"><p><strong>[${escapeHtml(label)}]</strong> - Equipment <em>(${escapeHtml(formatEquipmentCost(entry.item))}${showModels ? ` each · crew limit ${escapeHtml(formatEquipmentLimit(entry.item))}` : ''})</em></p>
        <p class="print-rule-body">${renderDamageMarkers(escapeHtml(entry.item.description))}${granted.length ? ` <em>Grants: ${escapeHtml(granted.join(', '))}.</em>` : ''}${entry.item.unbreakable ? ' <em>Cannot be affected by Broken Equipment.</em>' : ''}</p>
        ${showModels ? `<p class="print-rule-models">${escapeHtml(models.sort().join(', '))}</p>` : ''}</div>`;
    }).join('');
    return `<${heading}>Equipment${showModels && list ? ` <em class="print-equipment-source">${escapeHtml(list.title)} list</em>` : ''}</${heading}>${rows}`;
  }

  // Printed statistic plus any equipment modifier (e.g. Upgraded Batsuit's +1 Endurance).
  function modifiedStat(character, key) {
    const base = character.stats?.[key];
    const mod = modelEquipment(character.id).reduce((sum, { item }) => sum + (item.statMods?.[key] || 0), 0);
    if (!mod || !Number.isFinite(Number(base))) return { value: base, mod: 0 };
    return { value: Number(base) + mod, mod };
  }

  function renderLoadoutHalf(character) {
    const isBoss = state.crewBuilder.bossId === character.id;
    const stats = character.stats || {};
    const alias = character.alias && normalize(character.alias) !== 'unknown' ? character.alias : '';
    const row = (label, value) => `<div><dt>${label}</dt><dd>${escapeHtml(value ?? '—')}</dd></div>`;
    const rules = renderEquipmentPrintSection([character], 'h3', false) + collectPrintRules([character]).map(group =>
      `<h3>${group.heading}</h3>${group.items.map(rule => renderPrintRule(rule, group.kind, false)).join('')}`).join('');
    const gearCost = characterEquipmentCost(character.id);
    const gearRep = modelEquipment(character.id).reduce((sum, { item }) => sum + (item.rep || 0), 0);
    // The card floats left so the rules can use the space under the stats, then run full width below it.
    return `<article class="loadout">
        <img class="loadout-card" src="${escapeHtml(character.image)}" alt="${escapeHtml(character.name)}">
        <div class="loadout-stats">
          <h2>${escapeHtml(character.name)}${isBoss ? ' <span class="loadout-boss">Boss</span>' : ''}</h2>
          ${alias ? `<p class="loadout-alias">${escapeHtml(alias)}</p>` : ''}
          <dl class="loadout-info">
            ${row('Crew', (character.crews || [character.crew]).filter(Boolean).join(', '))}
            ${row('Rank', character.rank)}
            ${row('Reputation', gearRep ? `${character.reputation ?? 0} + ${gearRep} equipment` : character.reputation)}
            ${row('Funding', gearCost ? `$${character.funding ?? 0} + $${gearCost} equipment` : character.funding != null ? `$${character.funding}` : null)}
            ${row('Base', character.baseSizeMm ? `${character.baseSizeMm} mm` : null)}
          </dl>
          <table class="loadout-attributes">
            <tr><th>Willpower</th><th>Endurance</th><th>Attack</th><th>Defense</th><th>Strength</th><th>Movement</th></tr>
            <tr>${['willpower','endurance','attack','defense','strength','movement'].map(key => {
              const { value, mod } = modifiedStat(character, key);
              return mod ? `<td class="stat-modified">${escapeHtml(value)}<small>${mod > 0 ? '+' : ''}${mod} equip.</small></td>` : `<td>${escapeHtml(stats[key] ?? '—')}</td>`;
            }).join('')}</tr>
          </table>
        </div>
      <div class="loadout-rules">${rules || '<p class="print-rule-body">No traits or weapon rules transcribed.</p>'}</div>
    </article>`;
  }

  async function printCrewLoadouts() {
    const html = sortedRosterForPrint().map(renderLoadoutHalf).join('');
    await printSheetHtml(`<section class="loadout-page">${html}</section>`, paginateLoadouts);
  }

  // Fit each model's rules into half a page, shrinking the text down to a readable minimum; models
  // whose rules still don't fit get a full page. Then pair the half-page models two per page.
  function paginateLoadouts(sheet) {
    sheet.classList.add('measuring');
    const loadouts = [...sheet.querySelectorAll('.loadout')];
    const fits = (loadout, min) => {
      const box = loadout.querySelector('.loadout-rules');
      let size = 8.5;
      const overflowing = () => loadout.scrollHeight > loadout.clientHeight + 1;
      box.style.fontSize = `${size}pt`;
      while (overflowing() && size > min) {
        size -= 0.25;
        box.style.fontSize = `${size}pt`;
      }
      return !overflowing();
    };
    loadouts.forEach(loadout => {
      if (fits(loadout, 6)) return;
      loadout.classList.add('full');
      fits(loadout, 5.5);
    });
    sheet.classList.remove('measuring');
    const pages = [];
    let pending = null;
    loadouts.forEach(loadout => {
      if (loadout.classList.contains('full')) {
        pages.push([loadout]);
      } else if (pending) {
        pages.push([pending, loadout]); pending = null;
      } else {
        pending = loadout;
      }
    });
    if (pending) pages.push([pending]);
    sheet.replaceChildren(...pages.map(page => {
      const section = document.createElement('section');
      section.className = 'loadout-page';
      section.append(...page);
      return section;
    }));
  }

  async function printProxySheet(cards, fit = 'cover', extraHtml = '') {
    const perPage = 9;
    const pages = [];
    for (let i = 0; i < cards.length; i += perPage) pages.push(cards.slice(i, i + perPage));
    await printSheetHtml(pages.map(page => `<section class="print-page">${page.map(card =>
      `<div class="print-card fit-${fit}"><img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)}"></div>`).join('')}</section>`).join('') + extraHtml);
  }

  async function printSheetHtml(html, afterLoad) {
    const sheet = $('#printSheet');
    sheet.innerHTML = html;
    await Promise.all([...sheet.querySelectorAll('img')].map(img => img.complete ? null : new Promise(resolve => { img.onload = img.onerror = resolve; })));
    if (afterLoad) afterLoad(sheet);
    document.body.classList.add('printing-deck');
    const cleanup = () => {
      document.body.classList.remove('printing-deck');
      sheet.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  function toggleCard(id, force) {
    const card = getCard(id);
    if (!card || !['general','affiliation','character'].includes(card.category)) return;
    const selected = isSelected(id);
    const shouldSelect = force === undefined ? !selected : force;
    if (shouldSelect && !selected) state.selected.push(id);
    if (!shouldSelect && selected) state.selected = state.selected.filter(item => item !== id);
    persist(); renderLibrary(); renderDeck();
    if (elements.cardDialog.open) populateDialog(card.id);
  }

  function renderDeck() {
    const selected = state.selected.map(getCard).filter(Boolean);
    const validation = validateDeck(selected);
    const base = selected.filter(card => ['general','affiliation'].includes(card.category));
    const bonus = selected.filter(card => card.category === 'character');
    const baseTotal = base.reduce((sum,card) => sum + card.requiredCopies,0);
    const general = base.filter(card => card.category === 'general').reduce((sum,card) => sum + card.requiredCopies,0);
    const affiliated = base.filter(card => card.category === 'affiliation').reduce((sum,card) => sum + card.requiredCopies,0);
    const singles = base.filter(card => card.isSingle).reduce((sum,card) => sum + card.requiredCopies,0);
    const bonusTotal = bonus.reduce((sum,card) => sum + card.requiredCopies,0);

    elements.baseTotal.textContent = baseTotal;
    elements.generalTotal.textContent = general;
    elements.affiliationTotal.textContent = affiliated;
    elements.singleTotal.textContent = singles;
    elements.bonusTotal.textContent = bonusTotal;
    setMeter(elements.baseMeter, baseTotal, 30);
    setMeter(elements.generalMeter, general, Math.max(affiliated,1), general > affiliated);
    setMeter(elements.singleMeter, singles, 10);
    setMeter(elements.bonusMeter, bonusTotal, Math.max(bonusTotal,4));
    elements.selectedDesignCount.textContent = `${selected.length} design${selected.length === 1 ? '' : 's'}`;

    if (!selected.length) {
      elements.deckList.className = 'deck-list empty-note';
      elements.deckList.textContent = 'Select cards from the library.';
    } else {
      elements.deckList.className = 'deck-list';
      elements.deckList.innerHTML = selected.sort((a,b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)).map(card => `<article class="deck-item" data-card-id="${card.id}">
        <img src="${escapeHtml(card.thumbnail || card.image)}" alt="">
        <div><strong>${escapeHtml(card.title)}</strong><span>${card.category === 'character' ? 'Bonus' : card.category === 'general' ? 'General' : card.affiliation} · fixed ×${card.requiredCopies}${card.isSingle ? ' · single' : ''}</span></div>
        <button data-action="remove" type="button" aria-label="Remove ${escapeHtml(card.title)}">×</button>
      </article>`).join('');
    }

    updatePlayLaunchButton(validation);

    if (validation.valid && !validation.warnings.length) {
      elements.validation.className = 'validation-summary valid';
      elements.validation.innerHTML = '<strong>Deck legal</strong><br>All supplied deck-building rules are satisfied.';
    } else {
      elements.validation.className = `validation-summary ${validation.valid ? 'warning-only' : 'invalid'}`;
      const errors = validation.errors.map(message => `<li>${escapeHtml(message)}</li>`).join('');
      const warnings = validation.warnings.map(message => `<li class="warning">${escapeHtml(message)}</li>`).join('');
      const heading = !selected.length ? 'Start building' : validation.valid ? 'Deck legal, with warnings' : 'Deck needs attention';
      elements.validation.innerHTML = `<strong>${heading}</strong><ul>${errors}${warnings}</ul>`;
    }
  }

  function validateDeck(selected) {
    const errors = [], warnings = [];
    const base = selected.filter(card => ['general','affiliation'].includes(card.category));
    const character = selected.filter(card => card.category === 'character');
    const baseTotal = base.reduce((sum,card) => sum + card.requiredCopies,0);
    const general = base.filter(card => card.category === 'general').reduce((sum,card) => sum + card.requiredCopies,0);
    const affiliated = base.filter(card => card.category === 'affiliation').reduce((sum,card) => sum + card.requiredCopies,0);
    const singles = base.filter(card => card.isSingle).reduce((sum,card) => sum + card.requiredCopies,0);

    if (baseTotal !== 30) errors.push(`Base deck contains ${baseTotal} cards; it must contain exactly 30.`);
    if (general > affiliated) warnings.push(`General cards (${general}) outnumber crew-specific cards (${affiliated}).`);
    if (singles > 10) errors.push(`The deck contains ${singles} single cards; the maximum is 10.`);
    base.filter(card => card.category === 'affiliation' && card.affiliation !== state.affiliation).forEach(card => errors.push(`${card.title} does not belong to ${state.affiliation}.`));

    const byName = new Map();
    selected.forEach(card => {
      const key = normalize(card.title);
      if (!key) return;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(card);
    });
    byName.forEach(cards => {
      if (cards.length > 1) errors.push(`Multiple card designs share the name “${cards[0].title}”.`);
    });

    character.forEach(card => {
      if (!card.subtitle || !card.rank) {
        errors.push(`${card.title} needs its printed subtitle and rank entered in metadata.`);
        return;
      }
      if (!characterRequirementMet(card)) errors.push(`${card.title} requires ${card.subtitle} (${card.rank}) in the crew roster.`);
    });

    const needsReview = selected.filter(card => card.metadataStatus === 'ocr-review');
    if (needsReview.length) warnings.push(`${needsReview.length} selected card name${needsReview.length === 1 ? '' : 's'} came from fallback metadata; verify against the card image.`);
    return { valid: errors.length === 0, errors, warnings };
  }

  function setMeter(element, value, max, forceOver = false) {
    const percent = Math.min(100, Math.max(0, value / Math.max(max,1) * 100));
    element.style.width = `${percent}%`;
    element.classList.toggle('over', forceOver || value > max);
  }

  function renderRoster() {
    if (!state.roster.length) {
      elements.rosterList.className = 'roster-list empty-note';
      elements.rosterList.textContent = 'No crew models entered.';
      return;
    }
    elements.rosterList.className = 'roster-list';
    elements.rosterList.innerHTML = state.roster.map(model => `<div class="roster-item"><div><strong>${escapeHtml(model.name)}</strong><span>${model.alias ? `${escapeHtml(model.alias)} · ` : ''}${escapeHtml(model.rank)}</span></div><button type="button" data-remove-model="${escapeHtml(model.id)}" aria-label="Remove model">×</button></div>`).join('');
  }

  function openCard(id, context = 'builder') {
    activeCardId = id;
    activeCardContext = context;
    populateDialog(id);
    elements.cardDialog.showModal();
  }

  function populateDialog(id) {
    const card = getCard(id);
    if (!card) return;
    elements.dialogImage.src = card.image;
    elements.dialogImage.alt = card.title;
    elements.dialogTitle.textContent = card.title;
    elements.dialogCategory.textContent = card.category === 'affiliation' ? card.affiliation : card.deckName;
    elements.dialogBadges.innerHTML = [
      `<span class="badge ${card.isSingle ? 'single' : 'copy'}">${card.isSingle ? 'Single card' : `${card.requiredCopies}-copy bundle`}</span>`,
      `<span class="badge">${escapeHtml(card.category)}</span>`,
      ...card.tags.slice(0,8).map(tag => `<span class="badge">${escapeHtml(tag.replaceAll('-',' '))}</span>`)
    ].join('');
    const ruleEntries = cardReferenceEntries(card);
    elements.dialogText.innerHTML = renderCardTextWithReferences(card.ocrText || 'No searchable rules text was recovered. Use the card image as the source of truth.', ruleEntries);
    elements.dialogRuleRefs.hidden = ruleEntries.length === 0;
    elements.dialogRuleRefList.innerHTML = ruleEntries.map(entry => renderRuleRefChip(entry)).join('');
    elements.dialogRequirement.textContent = card.category === 'character'
      ? (card.subtitle && card.rank ? `Requires a crew model named or aliased “${card.subtitle}” with rank “${card.rank}”.` : 'Character eligibility metadata has not been confirmed. Use Edit metadata to enter the printed subtitle and rank icon.')
      : card.category === 'general' ? 'General Objective card. Counts toward the normal 30-card deck.'
      : card.category === 'affiliation' ? `${card.affiliation} Objective card. Counts toward the normal 30-card deck.`
      : 'Reference card. It is browsable but is not added to the Objective deck.';
    const buildable = ['general','affiliation','character'].includes(card.category);
    const viewingFromPlay = activeCardContext === 'play';
    elements.dialogToggle.hidden = !buildable || viewingFromPlay;
    $('#editMetadata').hidden = viewingFromPlay;
    elements.dialogToggle.textContent = isSelected(id) ? 'Remove bundle' : `Add fixed bundle ×${card.requiredCopies}`;
  }

  function openMetadataEditor() {
    const card = getCard(activeCardId);
    if (!card) return;
    elements.editTitle.value = card.title;
    elements.editSubtitle.value = card.subtitle || '';
    elements.editRank.value = card.rank || '';
    elements.editTags.value = card.tags.join(', ');
    elements.cardDialog.close();
    elements.metadataDialog.showModal();
  }

  function saveMetadata(event) {
    event.preventDefault();
    const original = rawCards.find(card => card.id === activeCardId);
    if (!original) return;
    state.overrides[activeCardId] = {
      title: elements.editTitle.value.trim(),
      subtitle: elements.editSubtitle.value.trim(),
      rank: elements.editRank.value.trim(),
      tags: [...new Set(elements.editTags.value.split(',').map(tag => slug(tag)).filter(Boolean))],
      metadataStatus: 'user-confirmed'
    };
    persist(); elements.metadataDialog.close(); renderAll(); toast('Card metadata saved locally');
  }

  function resetMetadata() {
    if (!activeCardId) return;
    delete state.overrides[activeCardId];
    persist(); elements.metadataDialog.close(); renderAll(); toast('Bundled metadata restored');
  }

  function autoBuild() {
    const existingBase = state.selected.map(getCard).filter(card => card && ['general','affiliation'].includes(card.category));
    if (existingBase.length && !confirm('Replace the current base deck with a legal example? Character bonus cards will be kept.')) return;
    const uniqueNames = new Set();
    const pool = allCards()
      .filter(card => card.category === 'general' || (card.category === 'affiliation' && card.affiliation === state.affiliation))
      .sort((a,b) => a.isSingle - b.isSingle || b.requiredCopies - a.requiredCopies || a.title.localeCompare(b.title))
      .filter(card => {
        const key = normalize(card.title);
        if (!key || uniqueNames.has(key)) return false;
        uniqueNames.add(key); return true;
      });
    let dp = new Map([['0|0|0', []]]);
    pool.forEach(card => {
      const next = new Map(dp);
      dp.forEach((ids,key) => {
        const [total,general,singles] = key.split('|').map(Number);
        const quantity = card.requiredCopies;
        const nt = total + quantity;
        const ng = general + (card.category === 'general' ? quantity : 0);
        const ns = singles + (card.isSingle ? quantity : 0);
        if (nt > 30 || ns > 10 || ng > 15) return;
        const nkey = `${nt}|${ng}|${ns}`;
        if (!next.has(nkey)) next.set(nkey, [...ids, card.id]);
      });
      dp = next;
    });
    const choices = [...dp.entries()]
      .map(([key,ids]) => ({ values:key.split('|').map(Number), ids }))
      .filter(item => item.values[0] === 30 && item.values[1] <= 15 && item.values[2] <= 10)
      .sort((a,b) => Math.abs(15-a.values[1]) - Math.abs(15-b.values[1]) || a.values[2] - b.values[2]);
    if (!choices.length) {
      alert('No legal example could be generated from the current metadata.');
      return;
    }
    const bonusIds = state.selected.filter(id => getCard(id)?.category === 'character');
    state.selected = [...choices[0].ids, ...bonusIds];
    persist(); renderAll(); toast('Built a legal 30-card example');
  }

  // Shareable links: state is JSON-encoded, gzip-compressed where the browser supports
  // CompressionStream, then base64url-encoded into a `deck=`/`crew=` query param. A leading
  // '1'/'0' marker records whether gzip was used, so older/unsupported browsers can still decode
  // links created by newer ones (they just skip decompression and read raw JSON).
  function bufferToBase64Url(bytes) {
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64UrlToBuffer(value) {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(value.length + (4 - value.length % 4) % 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function encodeSharePayload(payload) {
    const json = JSON.stringify(payload);
    if (typeof CompressionStream === 'function') {
      try {
        const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
        const buffer = await new Response(stream).arrayBuffer();
        return `1${bufferToBase64Url(new Uint8Array(buffer))}`;
      } catch { /* fall through to uncompressed encoding */ }
    }
    return `0${bufferToBase64Url(new TextEncoder().encode(json))}`;
  }

  async function decodeSharePayload(encoded) {
    const marker = encoded[0];
    const bytes = base64UrlToBuffer(encoded.slice(1));
    if (marker === '1' && typeof DecompressionStream === 'function') {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const buffer = await new Response(stream).arrayBuffer();
      return JSON.parse(new TextDecoder().decode(buffer));
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  async function copyLinkToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt('Copy this link:', text);
    }
  }

  async function copyDeckShareLink() {
    try {
      const payload = {
        v: 1, affiliation: state.affiliation, selected: state.selected, roster: state.roster,
        overrides: Object.fromEntries(Object.entries(state.overrides).filter(([id]) => state.selected.includes(id)))
      };
      const encoded = await encodeSharePayload(payload);
      const url = new URL(location.href);
      url.search = '';
      url.searchParams.set('deck', encoded);
      await copyLinkToClipboard(url.toString());
      toast('Deck link copied to clipboard');
    } catch (error) {
      alert(`Could not build a share link: ${error.message}`);
    }
  }

  async function copyCrewShareLink() {
    try {
      const cb = state.crewBuilder;
      const payload = { v: 1, crew: cb.crew, repCap: cb.repCap, fundingCap: cb.fundingCap, bossId: cb.bossId, roster: cb.roster, equipmentList: cb.equipmentList, equipment: cb.equipment };
      const encoded = await encodeSharePayload(payload);
      const url = new URL(location.href);
      url.search = '';
      url.searchParams.set('crew', encoded);
      await copyLinkToClipboard(url.toString());
      toast('Crew link copied to clipboard');
    } catch (error) {
      alert(`Could not build a share link: ${error.message}`);
    }
  }

  function applySharedDeck(payload) {
    const ids = Array.isArray(payload.selected) ? payload.selected : [];
    state.selected = [...new Set(ids)].filter(id => rawCards.some(card => card.id === id));
    if (affiliations.includes(payload.affiliation)) state.affiliation = payload.affiliation;
    if (Array.isArray(payload.roster)) state.roster = payload.roster;
    if (payload.overrides && typeof payload.overrides === 'object') state.overrides = { ...state.overrides, ...payload.overrides };
  }

  function applySharedCrew(payload) {
    const crew = typeof payload.crew === 'string' ? payload.crew : '';
    const validIds = resolveCrewRosterIds(payload.roster, crew);
    state.crewBuilder = {
      crew,
      repCap: Number.isFinite(Number(payload.repCap)) ? Number(payload.repCap) : defaults.crewBuilder.repCap,
      fundingCap: Number.isFinite(Number(payload.fundingCap)) ? Number(payload.fundingCap) : defaults.crewBuilder.fundingCap,
      bossId: validIds.includes(payload.bossId) ? payload.bossId : null,
      roster: validIds,
      equipmentList: equipmentLists.some(list => list.id === payload.equipmentList) ? payload.equipmentList : '',
      equipment: sanitizeEquipment(payload.equipment, validIds)
    };
  }

  async function importSharedLinkIfPresent() {
    const params = new URLSearchParams(location.search);
    const deckParam = params.get('deck');
    const crewParam = params.get('crew');
    if (!deckParam && !crewParam) return;
    try {
      if (deckParam) applySharedDeck(await decodeSharePayload(deckParam));
      if (crewParam) applySharedCrew(await decodeSharePayload(crewParam));
      persist();
      location.hash = deckParam && !crewParam ? '#builder' : crewParam && !deckParam ? '#crew' : location.hash || '#builder';
      toast(deckParam && crewParam ? 'Loaded shared deck and crew' : deckParam ? 'Loaded shared deck' : 'Loaded shared crew');
    } catch (error) {
      alert(`Could not load the shared link: ${error.message}`);
    } finally {
      const url = new URL(location.href);
      url.search = '';
      history.replaceState(null, '', url.toString());
    }
  }

  function exportText() {
    const selected = state.selected.map(getCard).filter(Boolean);
    const validation = validateDeck(selected);
    const base = selected.filter(card => ['general','affiliation'].includes(card.category));
    const bonus = selected.filter(card => card.category === 'character');
    const lines = [
      `${state.affiliation} Objective Deck`,
      '='.repeat(Math.max(20, state.affiliation.length + 15)), '',
      `Status: ${validation.valid ? 'LEGAL' : 'NEEDS ATTENTION'}`,
      ...validation.errors.map(error => `- ${error}`), '',
      'BASE DECK',
      ...base.sort((a,b)=>a.title.localeCompare(b.title)).map(card => `${card.requiredCopies}x ${card.title} [${card.category === 'general' ? 'General' : card.affiliation}]`),
      '', `Base total: ${base.reduce((sum,card)=>sum+card.requiredCopies,0)}`
    ];
    if (bonus.length) lines.push('', 'CHARACTER OBJECTIVES', ...bonus.map(card => `${card.requiredCopies}x ${card.title}${card.subtitle ? ` — ${card.subtitle} (${card.rank || 'rank unset'})` : ''}`));
    if (state.roster.length) lines.push('', 'CREW ROSTER', ...state.roster.map(model => `- ${model.name}${model.alias ? ` / ${model.alias}` : ''} — ${model.rank}`));
    download(`${slug(state.affiliation || 'batman')}-objective-deck.txt`, lines.join('\n'), 'text/plain');
  }

  async function importText(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = parseDeckText(await file.text());
      if (!result.selected.length) throw new Error('No objective cards were recognised in this file.');
      if (state.selected.length && !confirm('Replace the current objective deck with the imported list?')) return;
      if (result.affiliation) state.affiliation = result.affiliation;
      state.selected = result.selected;
      if (result.roster) state.roster = result.roster;
      persist(); renderAll();
      toast(`Imported ${result.selected.length} design${result.selected.length === 1 ? '' : 's'}`);
      if (result.unmatched.length) alert(`These lines could not be matched to a card and were skipped:\n\n${result.unmatched.join('\n')}`);
    } catch (error) {
      alert(`Could not import this deck list: ${error.message}`);
    }
  }

  function parseDeckText(text) {
    const norm = value => String(value || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
    const cards = allCards().filter(card => ['general','affiliation','character'].includes(card.category));
    const lines = text.split(/\r?\n/).map(line => line.trim());
    const affiliations = [...elements.affiliation.options].map(option => option.value).filter(Boolean);
    const header = lines.find(line => /objective deck$/i.test(line));
    const headerName = header ? norm(header.replace(/\s*objective deck$/i, '')) : '';
    const affiliation = affiliations.find(name => norm(name) === headerName) || '';
    const selected = [];
    const unmatched = [];
    let roster = null;
    let section = '';
    const pick = (candidates, copies) => {
      const open = candidates.filter(card => !selected.includes(card.id));
      return open.find(card => card.requiredCopies === copies) || open[0];
    };
    for (const line of lines) {
      if (/^base deck$/i.test(line)) { section = 'base'; continue; }
      if (/^character objectives$/i.test(line)) { section = 'character'; continue; }
      if (/^crew roster$/i.test(line)) { section = 'roster'; roster = []; continue; }
      if (!line) continue;
      if (section === 'roster') {
        const match = line.match(/^-\s*(.+?)(?:\s+\/\s+(.+?))?\s+—\s+(.+)$/);
        if (match) roster.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${roster.length}`, name: match[1], alias: match[2] || '', rank: match[3] });
        continue;
      }
      const countMatch = line.match(/^(\d+)x\s+(.+)$/i);
      if (!countMatch || !section) continue;
      const copies = Number(countMatch[1]);
      let card;
      if (section === 'base') {
        const match = countMatch[2].match(/^(.+?)(?:\s+\[([^\]]+)\])?$/);
        const title = norm(match[1]);
        const group = norm(match[2]);
        const byTitle = cards.filter(item => item.category !== 'character' && norm(item.title) === title);
        const byGroup = byTitle.filter(item => !group || (group === 'general' ? item.category === 'general' : norm(item.affiliation) === group));
        card = pick(byGroup.length ? byGroup : byTitle, copies);
      } else {
        const match = countMatch[2].match(/^(.+?)(?:\s+—\s+(.+?)\s+\(([^()]+)\))?$/);
        const title = norm(match[1]);
        const subtitle = norm(match[2]);
        const byTitle = cards.filter(item => item.category === 'character' && norm(item.title) === title);
        const bySubtitle = byTitle.filter(item => !subtitle || norm(item.subtitle) === subtitle);
        card = pick(bySubtitle.length ? bySubtitle : byTitle, copies);
      }
      if (card) selected.push(card.id);
      else unmatched.push(line);
    }
    return { affiliation, selected, unmatched, roster };
  }

  function updatePlayLaunchButton(validation = validateDeck(state.selected.map(getCard).filter(Boolean))) {
    if (!elements.startPlay) return;
    const active = Boolean(state.play?.active);
    elements.startPlay.textContent = active ? 'Resume play screen' : 'Start play screen';
    elements.startPlay.disabled = !active && state.selected.length === 0;
    if (!active) {
      elements.startPlay.title = validation.valid ? 'Shuffle this deck and draw the opening hand' : 'Shuffle this deck and draw the opening hand (this deck has validation issues, but you can still test it)';
    } else {
      elements.startPlay.title = 'Return to the saved game session';
    }
  }

  function startOrResumePlay() {
    if (state.play?.active) {
      renderPlayScreen();
      if (!elements.playDialog.open) elements.playDialog.showModal();
      return;
    }
    beginPlaySession();
  }

  function beginPlaySession(replacing = false) {
    const selected = state.selected.map(getCard).filter(Boolean);
    if (!selected.length) {
      alert('Select at least one card before starting play mode.');
      return false;
    }
    if (replacing && state.play?.active && !confirm('Restart the game with a freshly shuffled deck and a new opening hand?')) return false;

    const sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const physicalDeck = [];
    selected.forEach(card => {
      for (let copy = 1; copy <= card.requiredCopies; copy += 1) {
        physicalDeck.push({ uid: `${sessionId}:${card.id}:${copy}`, cardId: card.id, copy });
      }
    });
    shuffleCards(physicalDeck);
    const hand = physicalDeck.splice(0, 4);
    playSearchQuery = '';
    state.play = {
      active: true,
      sessionId,
      startedAt: new Date().toISOString(),
      affiliation: state.affiliation,
      sourceSignature: deckSignature(),
      phase: 'mulligan',
      mulliganUsed: false,
      round: 1,
      hand,
      drawPile: physicalDeck,
      discardPile: [],
      selectedUids: [],
      actionLog: [{ text: 'Shuffled the Objective deck and drew four cards for the opening hand.' }],
      undoStack: []
    };
    persist();
    renderDeck();
    renderPlayScreen();
    if (!elements.playDialog.open) elements.playDialog.showModal();
    return true;
  }

  function deckSignature() {
    return [...state.selected].sort().join('|');
  }

  function randomInteger(maxExclusive) {
    if (maxExclusive <= 1) return 0;
    if (globalThis.crypto?.getRandomValues) {
      const range = 0x100000000;
      const limit = range - (range % maxExclusive);
      const value = new Uint32Array(1);
      do crypto.getRandomValues(value); while (value[0] >= limit);
      return value[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  }

  function shuffleCards(cards) {
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInteger(index + 1);
      [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
    }
    return cards;
  }

  function checkpointPlay(label) {
    if (!state.play?.active) return;
    const { undoStack, ...snapshot } = state.play;
    const stack = Array.isArray(undoStack) ? undoStack : [];
    stack.push({ label, snapshot: structuredClone(snapshot) });
    state.play.undoStack = stack.slice(-20);
  }

  function appendPlayLog(text) {
    state.play.actionLog = Array.isArray(state.play.actionLog) ? state.play.actionLog : [];
    state.play.actionLog.push({ text });
  }

  function handlePlayHandClick(event) {
    const viewButton = event.target.closest('[data-play-view]');
    if (viewButton) {
      openCard(viewButton.dataset.playView, 'play');
      return;
    }
    const cardElement = event.target.closest('[data-play-uid]');
    if (!cardElement || !state.play?.active) return;
    const uid = cardElement.dataset.playUid;
    const selected = Array.isArray(state.play.selectedUids) ? state.play.selectedUids : [];
    if (state.play.phase === 'playing') {
      state.play.selectedUids = selected.includes(uid) ? [] : [uid];
    } else {
      state.play.selectedUids = selected.includes(uid) ? selected.filter(item => item !== uid) : [...selected, uid];
    }
    persist();
    renderPlayScreen();
  }

  function handlePlayPrimaryAction() {
    const play = state.play;
    if (!play?.active) return;
    const selected = new Set(play.selectedUids || []);

    if (play.phase === 'mulligan') {
      checkpointPlay('Undo opening-hand decision');
      const discarded = play.hand.filter(instance => selected.has(instance.uid));
      play.hand = play.hand.filter(instance => !selected.has(instance.uid));
      play.discardPile.push(...discarded);
      const redrawn = play.drawPile.splice(0, discarded.length);
      play.hand.push(...redrawn);
      play.phase = 'playing';
      play.mulliganUsed = true;
      play.selectedUids = [];
      appendPlayLog(discarded.length
        ? `Used the one opening mulligan: discarded ${discarded.length} card${discarded.length === 1 ? '' : 's'} and drew ${redrawn.length}.`
        : 'Kept all four cards in the opening hand; the opening mulligan is now closed.');
    } else {
      if (selected.size !== 1) return;
      checkpointPlay('Undo Recount discard');
      const discarded = play.hand.find(instance => selected.has(instance.uid));
      play.hand = play.hand.filter(instance => !selected.has(instance.uid));
      if (discarded) play.discardPile.push(discarded);
      shuffleCards(play.drawPile);
      const replacement = play.drawPile.splice(0, 1);
      play.hand.push(...replacement);
      appendPlayLog(`Round ${play.round} Recount: discarded one Objective card, shuffled the remaining deck, and drew ${replacement.length ? 'a replacement' : 'no card because the deck was empty'}.`);
      play.round += 1;
      play.selectedUids = [];
    }
    persist();
    renderPlayScreen();
  }

  function handlePlaySkipAction() {
    const play = state.play;
    if (!play?.active || play.phase !== 'playing') return;
    checkpointPlay('Undo skipped Recount discard');
    appendPlayLog(`Round ${play.round} Recount: kept the current hand and did not discard.`);
    play.round += 1;
    play.selectedUids = [];
    persist();
    renderPlayScreen();
  }

  function undoPlayAction() {
    const play = state.play;
    const stack = play?.undoStack;
    if (!play?.active || !Array.isArray(stack) || !stack.length) return;
    const previous = stack.pop();
    state.play = { ...structuredClone(previous.snapshot), undoStack: stack };
    persist();
    renderPlayScreen();
    renderDeck();
    toast(previous.label || 'Last play action undone');
  }

  function restartPlaySession() {
    beginPlaySession(true);
  }

  function endPlaySession() {
    if (!state.play?.active) return;
    if (!confirm('End this game and clear its hand, deck order, discard pile, and action log?')) return;
    state.play = null;
    persist();
    elements.playDialog.close();
    renderDeck();
    toast('Game session ended');
  }

  function renderPlayScreen() {
    const play = state.play;
    if (!play?.active) return;
    play.hand = Array.isArray(play.hand) ? play.hand : [];
    play.drawPile = Array.isArray(play.drawPile) ? play.drawPile : [];
    play.discardPile = Array.isArray(play.discardPile) ? play.discardPile : [];
    play.selectedUids = Array.isArray(play.selectedUids) ? play.selectedUids.filter(uid => play.hand.some(card => card.uid === uid)) : [];
    play.actionLog = Array.isArray(play.actionLog) ? play.actionLog : [];
    play.undoStack = Array.isArray(play.undoStack) ? play.undoStack : [];

    const selectedCount = play.selectedUids.length;
    const sourceChanged = play.sourceSignature !== deckSignature();
    elements.playTitle.textContent = `${play.affiliation || 'Batman'} Objective Game`;
    elements.playSessionNote.textContent = sourceChanged
      ? 'This active game uses the deck snapshot from when it began. Your builder list has changed since then.'
      : 'The current builder deck and this game session match.';
    elements.playRound.textContent = play.round || 1;
    elements.playHandCount.textContent = play.hand.length;
    elements.playDeckCount.textContent = play.drawPile.length;
    elements.playDiscardCount.textContent = play.discardPile.length;
    elements.playDeckCountSide.textContent = `${play.drawPile.length} card${play.drawPile.length === 1 ? '' : 's'}`;
    elements.playDiscardCountSide.textContent = `${play.discardPile.length} card${play.discardPile.length === 1 ? '' : 's'}`;
    elements.playUndo.disabled = play.undoStack.length === 0;
    elements.playDrawCard.disabled = play.phase !== 'playing' || play.drawPile.length === 0;
    elements.playDrawCard.title = play.phase !== 'playing'
      ? 'Resolve the opening hand before drawing extra cards'
      : 'Draw the top card of the deck into your hand (for card effects that say "draw a card")';

    if (play.phase === 'mulligan') {
      elements.playPhaseEyebrow.textContent = 'Before deployment';
      elements.playPhaseTitle.textContent = 'Opening hand — one mulligan available';
      elements.playPhaseHelp.textContent = 'Select any number of cards to discard, then redraw the same number. Selecting none keeps all four cards and closes the mulligan.';
      elements.playPrimaryAction.textContent = selectedCount ? `Discard ${selectedCount} & redraw ${selectedCount}` : 'Keep all four cards';
      elements.playPrimaryAction.disabled = selectedCount > play.drawPile.length;
      elements.playSkipAction.hidden = true;
      elements.playSelectionCount.textContent = selectedCount ? `${selectedCount} selected for the mulligan` : 'Select zero to four cards';
    } else {
      elements.playPhaseEyebrow.textContent = `End of Recount — Round ${play.round || 1}`;
      elements.playPhaseTitle.textContent = 'Optional Recount discard';
      elements.playPhaseHelp.textContent = 'Select exactly one card to discard. The remaining Objective deck is shuffled before its replacement is drawn.';
      elements.playPrimaryAction.textContent = selectedCount === 1 ? 'Discard 1, shuffle & draw' : 'Select one card to replace';
      elements.playPrimaryAction.disabled = selectedCount !== 1;
      elements.playSkipAction.hidden = false;
      elements.playSelectionCount.textContent = selectedCount === 1 ? '1 card selected for replacement' : 'Select at most one card';
    }

    elements.playHand.innerHTML = play.hand.map(instance => renderPlayCard(instance, play.selectedUids.includes(instance.uid))).join('');
    if (!play.hand.length) elements.playHand.innerHTML = '<div class="empty-state"><h3>Your hand is empty</h3><p>No Objective cards remain in hand.</p></div>';

    const log = [...play.actionLog].reverse();
    elements.playLog.innerHTML = log.length ? log.map(item => `<li>${escapeHtml(item.text)}</li>`).join('') : '<li>No actions yet.</li>';
    renderPlayCrewPanel();
    renderPlaySearch();
    renderPlayDiscardList();
    updatePlayLaunchButton();
  }

  function drawCardManually() {
    const play = state.play;
    if (!play?.active || play.phase !== 'playing' || !play.drawPile.length) return;
    checkpointPlay('Undo manual draw');
    const [drawn] = play.drawPile.splice(0, 1);
    play.hand.push(drawn);
    const card = getCard(drawn.cardId);
    appendPlayLog(`Drew an extra card from the deck: ${card?.title || 'Unknown card'}.`);
    persist();
    renderPlayScreen();
    toast(`${card?.title || 'Card'} drawn`);
  }

  function searchDrawPile(query) {
    const play = state.play;
    if (!play?.active) return [];
    const search = normalize(query);
    if (!search) return [];
    const counts = new Map();
    play.drawPile.forEach(instance => counts.set(instance.cardId, (counts.get(instance.cardId) || 0) + 1));
    return [...counts.entries()]
      .map(([cardId, count]) => ({ card: getCard(cardId), count }))
      .filter(entry => entry.card && normalize(entry.card.title).includes(search))
      .sort((a, b) => a.card.title.localeCompare(b.card.title));
  }

  function renderPlaySearch() {
    if (!elements.playSearchResults) return;
    const play = state.play;
    elements.playSearchInput.value = playSearchQuery;
    if (!play?.active || play.phase !== 'playing') {
      elements.playSearchResults.innerHTML = '<p class="empty-note">Resolve the opening hand before searching the deck.</p>';
      return;
    }
    if (!playSearchQuery.trim()) {
      elements.playSearchResults.innerHTML = '<p class="muted">Search the draw pile by title and add a card straight to your hand.</p>';
      return;
    }
    const results = searchDrawPile(playSearchQuery);
    elements.playSearchResults.innerHTML = results.length
      ? results.map(({ card, count }) => `<article class="play-search-result">
          <img src="${escapeHtml(card.thumbnail || card.image)}" alt="">
          <div><strong>${escapeHtml(card.title)}</strong><span>${count} in draw pile</span></div>
          <button class="button ghost compact" data-action="search-add" data-card-id="${escapeHtml(card.id)}" type="button">Add to hand</button>
        </article>`).join('')
      : '<p class="empty-note">No matching cards remain in the draw pile.</p>';
  }

  function handlePlaySearchResultsClick(event) {
    const button = event.target.closest('[data-action="search-add"]');
    if (!button) return;
    addCardFromDrawPile(button.dataset.cardId);
  }

  function addCardFromDrawPile(cardId) {
    const play = state.play;
    if (!play?.active || play.phase !== 'playing') return;
    const index = play.drawPile.findIndex(instance => instance.cardId === cardId);
    if (index === -1) return;
    checkpointPlay('Undo deck search');
    const [instance] = play.drawPile.splice(index, 1);
    play.hand.push(instance);
    shuffleCards(play.drawPile);
    const card = getCard(cardId);
    appendPlayLog(`Searched the draw pile for "${card?.title || 'a card'}", added it to hand, and shuffled the remaining deck.`);
    persist();
    renderPlayScreen();
    toast(`${card?.title || 'Card'} added to hand`);
  }

  function groupDiscardPile() {
    const play = state.play;
    if (!play?.active) return [];
    const counts = new Map();
    play.discardPile.forEach(instance => counts.set(instance.cardId, (counts.get(instance.cardId) || 0) + 1));
    return [...counts.entries()]
      .map(([cardId, count]) => ({ card: getCard(cardId), count }))
      .filter(entry => entry.card)
      .sort((a, b) => a.card.title.localeCompare(b.card.title));
  }

  function renderPlayDiscardList() {
    if (!elements.playDiscardList) return;
    const play = state.play;
    const groups = groupDiscardPile();
    const pileSize = play?.discardPile?.length || 0;
    elements.playDiscardSummary.textContent = pileSize
      ? `${pileSize} card${pileSize === 1 ? '' : 's'} — tap to view`
      : 'No discarded cards';
    elements.playDiscardShuffleAll.disabled = !play?.active || play.phase !== 'playing' || !pileSize;
    if (!play?.active || play.phase !== 'playing') {
      elements.playDiscardList.innerHTML = '<p class="empty-note">Resolve the opening hand before managing the discard pile.</p>';
      return;
    }
    elements.playDiscardList.innerHTML = groups.length
      ? groups.map(({ card, count }) => `<article class="play-discard-row">
          <img src="${escapeHtml(card.thumbnail || card.image)}" alt="">
          <strong>${escapeHtml(card.title)}</strong>
          <span>${count} in discard pile</span>
          <div class="play-discard-row-actions">
            <button class="button ghost compact" data-action="discard-shuffle-one" data-card-id="${escapeHtml(card.id)}" type="button">Shuffle 1 into deck</button>
            <button class="button ghost compact" data-action="discard-return" data-card-id="${escapeHtml(card.id)}" type="button">Return 1 to hand</button>
          </div>
        </article>`).join('')
      : '<p class="empty-note">No discarded cards.</p>';
  }

  function handlePlayDiscardListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    if (button.dataset.action === 'discard-return') addCardFromDiscardPile(button.dataset.cardId);
    else if (button.dataset.action === 'discard-shuffle-one') shuffleCardFromDiscardToDeck(button.dataset.cardId);
  }

  function addCardFromDiscardPile(cardId) {
    const play = state.play;
    if (!play?.active || play.phase !== 'playing') return;
    const index = play.discardPile.findIndex(instance => instance.cardId === cardId);
    if (index === -1) return;
    checkpointPlay('Undo return from discard pile');
    const [instance] = play.discardPile.splice(index, 1);
    play.hand.push(instance);
    const card = getCard(cardId);
    appendPlayLog(`Returned "${card?.title || 'a card'}" from the discard pile to hand.`);
    persist();
    renderPlayScreen();
    toast(`${card?.title || 'Card'} returned to hand`);
  }

  function shuffleCardFromDiscardToDeck(cardId) {
    const play = state.play;
    if (!play?.active || play.phase !== 'playing') return;
    const index = play.discardPile.findIndex(instance => instance.cardId === cardId);
    if (index === -1) return;
    checkpointPlay('Undo shuffle from discard pile');
    const [instance] = play.discardPile.splice(index, 1);
    play.drawPile.push(instance);
    shuffleCards(play.drawPile);
    const card = getCard(cardId);
    appendPlayLog(`Shuffled "${card?.title || 'a card'}" from the discard pile back into the deck.`);
    persist();
    renderPlayScreen();
    toast(`${card?.title || 'Card'} shuffled into deck`);
  }

  function shuffleDiscardPileIntoDeck() {
    const play = state.play;
    if (!play?.active || play.phase !== 'playing' || !play.discardPile.length) return;
    checkpointPlay('Undo shuffle discard pile into deck');
    const count = play.discardPile.length;
    play.drawPile.push(...play.discardPile.splice(0, play.discardPile.length));
    shuffleCards(play.drawPile);
    appendPlayLog(`Shuffled the entire discard pile (${count} card${count === 1 ? '' : 's'}) back into the deck.`);
    persist();
    renderPlayScreen();
    toast('Discard pile shuffled into deck');
  }

  function renderPlayCrewPanel() {
    if (!elements.playCrewList) return;
    const rosterCharacters = crewRosterCharacters();
    elements.playCrewCount.textContent = rosterCharacters.length
      ? `${rosterCharacters.length} model${rosterCharacters.length === 1 ? '' : 's'} recruited`
      : 'No crew recruited yet';
    elements.playCrewList.innerHTML = rosterCharacters.length
      ? rosterCharacters.map(renderPlayCrewCard).join('')
      : '<p class="empty-note">Recruit models in the Crew Builder to see their traits here during play.</p>';
  }

  function renderPlayCrewCard(character) {
    const isBoss = state.crewBuilder.bossId === character.id;
    const rules = rosterCharacterRules(character);
    return `<article class="play-crew-card ${isBoss ? 'is-boss' : ''}" data-character-id="${escapeHtml(character.id)}">
      <div class="play-crew-card-top">
        <img src="${escapeHtml(character.thumbnail || character.image)}" alt="">
        <div class="play-crew-card-heading-wrap">
          <div class="play-crew-card-heading"><strong>${escapeHtml(character.name)}</strong>${isBoss ? '<span class="badge">Boss</span>' : ''}</div>
          <p class="character-alias">${escapeHtml(character.alias || 'Alias unknown')}</p>
        </div>
      </div>
      <div class="rule-ref-row">${rules.map(renderCharacterRuleChip).join('') || '<span class="muted">No traits transcribed.</span>'}</div>
      <button class="button ghost compact" data-action="view-character" type="button">Full card</button>
    </article>`;
  }

  function handlePlayCrewListClick(event) {
    const card = event.target.closest('[data-character-id]');
    if (!card) return;
    openCharacter(card.dataset.characterId);
  }

  function renderPlayCard(instance, selected) {
    const card = getCard(instance.cardId);
    if (!card) return '';
    const ruleRefs = renderRuleRefChips(card, 2);
    return `<article class="play-card ${selected ? 'selected' : ''}" data-play-uid="${escapeHtml(instance.uid)}">
      <button class="play-card-select" type="button" aria-pressed="${selected}" aria-label="${selected ? 'Deselect' : 'Select'} ${escapeHtml(card.title)}">
        <img src="${escapeHtml(card.thumbnail || card.image)}" alt="${escapeHtml(card.title)}">
        <span class="play-card-check">${selected ? '✓' : ''}</span>
      </button>
      <div class="play-card-caption">
        <div><strong>${escapeHtml(card.title)}</strong><span>Physical copy ${instance.copy} of ${card.requiredCopies}</span></div>
        <button class="button ghost compact" data-play-view="${escapeHtml(card.id)}" type="button">View</button>
        ${ruleRefs}
      </div>
    </article>`;
  }


  function characterRules(character) {
    return [...(character.traits || []), ...(character.weaponRules || [])];
  }

  function filteredCharacters() {
    const filters = state.characterFilters;
    const search = normalize(filters.search);
    let characters = rawCharacters.filter(character => {
      if (filters.crew !== 'all' && !(character.crews || []).includes(filters.crew)) return false;
      if (filters.baseSize !== 'all' && Number(character.baseSizeMm) !== Number(filters.baseSize)) return false;
      if (search) {
        const rules = characterRules(character).map(rule => rule.label).join(' ');
        const stats = Object.values(character.stats || {}).join(' ');
        const crewText = (character.crews || [character.crew]).join(' ');
        const haystack = normalize([character.name, character.alias, crewText, character.baseSizeMm, character.reputation, character.funding, rules, stats].join(' '));
        if (!search.split(' ').every(token => haystack.includes(token))) return false;
      }
      return true;
    });
    const sorters = {
      name: (a,b) => a.name.localeCompare(b.name),
      'reputation-desc': (a,b) => (b.reputation || 0) - (a.reputation || 0) || a.name.localeCompare(b.name),
      'funding-desc': (a,b) => (b.funding || 0) - (a.funding || 0) || a.name.localeCompare(b.name),
      base: (a,b) => (a.baseSizeMm || 0) - (b.baseSizeMm || 0) || a.name.localeCompare(b.name)
    };
    characters.sort(sorters[filters.sort] || sorters.name);
    return characters;
  }

  function renderCharacters() {
    if (!elements.characterGrid) return;
    const characters = filteredCharacters();
    elements.characterGrid.innerHTML = characters.map(renderCharacterTile).join('');
    elements.characterVisibleCount.textContent = characters.length;
    elements.emptyCharacters.hidden = characters.length > 0;
    elements.characterTitle.textContent = state.characterFilters.crew === 'all' ? 'All character cards' : `${state.characterFilters.crew} character cards`; // includes dual-faction memberships
    const filters = [];
    if (state.characterFilters.search) filters.push(`Search: ${state.characterFilters.search}`);
    if (state.characterFilters.crew !== 'all') filters.push(state.characterFilters.crew);
    if (state.characterFilters.baseSize !== 'all') filters.push(`${state.characterFilters.baseSize} mm base`);
    elements.characterActiveFilters.hidden = filters.length === 0;
    elements.characterActiveFilters.innerHTML = filters.map(filter => `<span class="badge">${escapeHtml(filter)}</span>`).join('');
  }

  // Rules granted by equipment are highlighted and name the item they came from.
  function renderCharacterRuleChip(rule) {
    const origin = rule.equipment ? `<small class="rule-origin">${escapeHtml(rule.equipment)}</small>` : '';
    const extraClass = rule.equipment ? ' from-equipment' : '';
    const title = rule.equipment ? ` title="Added by equipment: ${escapeHtml(rule.equipment)}"` : '';
    if (rule.referenceId && referenceById.has(rule.referenceId)) {
      return `<button class="character-rule-chip linked${extraClass}" data-rule-ref="${escapeHtml(rule.referenceId)}"${title} type="button">${escapeHtml(rule.label)}${origin}</button>`;
    }
    return `<span class="character-rule-chip${extraClass}"${title}>${escapeHtml(rule.label)}${origin}</span>`;
  }

  function renderEquipmentRuleChips(characterId) {
    return modelEquipment(characterId).flatMap(entry =>
      equipmentGrantedRules(entry).map(rule => renderCharacterRuleChip({ ...rule, equipment: equipmentEntryLabel(entry) }))).join('');
  }

  function renderCharacterTile(character) {
    const previewRules = characterRules(character).slice(0,4);
    const remaining = Math.max(0, characterRules(character).length - previewRules.length);
    return `<article class="character-tile" data-character-id="${escapeHtml(character.id)}">
      <button class="character-image-button" type="button" aria-label="View ${escapeHtml(character.name)}">
        <img src="${escapeHtml(character.thumbnail || character.image)}" data-full="${escapeHtml(character.image)}" loading="lazy" alt="${escapeHtml(character.name)}">
      </button>
      <div class="character-card-info">
        <h3>${escapeHtml(character.name)}</h3>
        <p class="character-alias">${escapeHtml(character.alias || 'Alias unknown')}</p>
        <div class="character-card-meta">
          ${(character.crews || [character.crew]).map(crew => `<span class="badge">${escapeHtml(crew)}</span>`).join('')}
          <span class="badge">${character.reputation ?? '—'} REP</span>
          <span class="badge">${character.funding ?? '—'} $</span>
          <span class="badge">${character.baseSizeMm ?? '—'} mm</span>
        </div>
        <div class="rule-ref-row character-rule-preview">${previewRules.map(renderCharacterRuleChip).join('')}${remaining ? `<span class="rule-ref-more">+${remaining} more</span>` : ''}</div>
      </div>
    </article>`;
  }

  function openCharacter(id) {
    const character = rawCharacters.find(item => item.id === id);
    if (!character) return;
    elements.characterDialogImage.src = character.image;
    elements.characterDialogImage.alt = character.name;
    const crewNames = (character.crews || [character.crew]).filter(Boolean);
    elements.characterDialogCrew.textContent = crewNames.length ? `${crewNames.join(' · ')} crew${crewNames.length > 1 ? 's' : ''}` : 'Unassigned crew';
    elements.characterDialogTitle.textContent = character.name;
    elements.characterDialogAlias.textContent = character.alias && normalize(character.alias) !== 'unknown' ? character.alias : 'Civilian identity unknown';
    const crewBadges = (character.crews || [character.crew]).filter(Boolean).map(crew => `<span class="badge">${escapeHtml(crew)}</span>`);
    elements.characterDialogBadges.innerHTML = [
      ...crewBadges,
      `<span class="badge">${character.reputation ?? '—'} REP</span>`,
      `<span class="badge">${character.funding ?? '—'} $ funding</span>`,
      `<span class="badge">${character.baseSizeMm ?? '—'} mm base</span>`
    ].join('');
    const statLabels = [
      ['willpower','Willpower'],['endurance','Endurance'],['attack','Attack'],
      ['defense','Defense'],['strength','Strength'],['movement','Movement']
    ];
    elements.characterDialogStats.innerHTML = statLabels.map(([key,label]) => `<div class="character-stat"><span>${label}</span><strong>${escapeHtml(character.stats?.[key] ?? '—')}</strong></div>`).join('');
    elements.characterDialogTraits.innerHTML = (character.traits || []).map(renderCharacterRuleChip).join('') || '<span class="muted">No traits transcribed.</span>';
    elements.characterDialogWeapons.innerHTML = (character.weaponRules || []).map(renderCharacterRuleChip).join('') || '<span class="muted">No weapon rules transcribed.</span>';
    const duplicateNote = character.duplicateSources?.length ? ` ${character.duplicateSources.length} pixel-identical duplicate screenshot${character.duplicateSources.length === 1 ? ' was' : 's were'} discarded (${character.duplicateSources.join(', ')}).` : '';
    const crewNote = (character.crews || []).length > 1 ? ` This character appeared in multiple archived crew folders: ${(character.crews || []).join(', ')}.` : ''; 
    const metadataNote = character.metadataStatus === 'image-only-import'
      ? `Imported from ${character.sourceFiles?.join(', ') || 'an archived screenshot'}; structured stats and rules have not yet been transcribed.`
      : `Metadata was visually transcribed from ${character.sourceFiles?.join(', ') || 'the card image'}.`;
    elements.characterDialogSource.textContent = `Recovered from ${character.source || 'an archived screenshot'}. ${metadataNote}${duplicateNote}${crewNote} The image remains the source of truth.`;
    elements.characterDialog.showModal();
  }


  function crewRosterCharacters() {
    return state.crewBuilder.roster.map(id => rawCharacters.find(character => character.id === id)).filter(Boolean);
  }

  function crewFundingBonuses(rosterCharacters) {
    const bossId = state.crewBuilder.bossId;
    const bonuses = [];
    rosterCharacters.forEach(character => {
      (character.traits || []).forEach(trait => {
        const rule = FUNDING_BONUS_TRAITS[trait.referenceId];
        if (!rule) return;
        if (rule.bossOnly && character.id !== bossId) return;
        bonuses.push({ characterId: character.id, characterName: character.name, label: rule.label, amount: rule.amount });
      });
    });
    return bonuses;
  }

  function validateCrew(rosterCharacters) {
    const errors = [], warnings = [];
    const cb = state.crewBuilder;
    if (!cb.crew) errors.push('Choose a crew / faction before recruiting.');
    const equipment = equipmentTotals(cb);
    const repTotal = rosterCharacters.reduce((sum, character) => sum + (character.reputation || 0), 0) + equipment.rep;
    const ruleEffects = crewRuleEffects(rosterCharacters);
    const fundingTotal = rosterCharacters.reduce((sum, character) => sum + effectiveCharacterFunding(character, ruleEffects.fundingOverrides), 0) + equipment.funding;
    const bonuses = crewFundingBonuses(rosterCharacters);
    const bonusTotal = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    const effectiveFundingCap = cb.fundingCap + bonusTotal;
    if (repTotal > cb.repCap) errors.push(`Reputation spent (${repTotal}) exceeds the cap (${cb.repCap}).`);
    if (fundingTotal > effectiveFundingCap) errors.push(`Funding spent ($${fundingTotal}) exceeds the cap ($${effectiveFundingCap}).`);
    const { recruitAllowance } = ruleEffects;
    rosterCharacters.filter(character => {
      if (!cb.crew || (character.crews || [character.crew]).includes(cb.crew)) return false;
      return !isCrossRecruitEligible(character, recruitAllowance);
    }).forEach(character => errors.push(`${character.name} does not belong to the ${cb.crew} crew.`));
    const leaders = rosterCharacters.filter(character => character.rank === 'Leader');
    const sidekicks = rosterCharacters.filter(character => character.rank === 'Sidekick');
    if (leaders.length > 1) errors.push(`A crew may only have 1 Leader (found ${leaders.length}: ${leaders.map(character => character.name).join(', ')}).`);
    if (sidekicks.length > 1) errors.push(`A crew may only have 1 Sidekick (found ${sidekicks.length}: ${sidekicks.map(character => character.name).join(', ')}).`);
    errors.push(...validateEquipment(rosterCharacters, cb));
    if (rosterCharacters.length && !cb.bossId) warnings.push('No Boss designated — Boss-only funding traits (Dirty Money, Lord of Business, etc.) will not apply until a model is marked as Boss.');
    warnings.push(...ruleEffects.warnings);
    return { valid: errors.length === 0, errors, warnings, repTotal, fundingTotal, bonuses, bonusTotal, effectiveFundingCap, ruleEffects, equipment };
  }

  function filteredCrewPool() {
    const cb = state.crewBuilder;
    if (!cb.crew) return [];
    const search = normalize(state.crewFilters.search);
    const rosterCharacters = crewRosterCharacters();
    const { recruitAllowance } = crewRuleEffects(rosterCharacters);
    let pool = rawCharacters.filter(character => {
      if ((character.crews || [character.crew]).includes(cb.crew)) return true;
      if (isCrossRecruitEligible(character, recruitAllowance)) return true;
      return false;
    });
    const hasLeader = rosterCharacters.some(character => character.rank === 'Leader');
    const hasSidekick = rosterCharacters.some(character => character.rank === 'Sidekick');
    pool = pool.filter(character => {
      if (hasLeader && character.rank === 'Leader' && !cb.roster.includes(character.id)) return false;
      if (hasSidekick && character.rank === 'Sidekick' && !cb.roster.includes(character.id)) return false;
      return true;
    });
    if (state.crewFilters.rank !== 'all') {
      pool = pool.filter(character => character.rank === state.crewFilters.rank);
    }
    if (search) {
      pool = pool.filter(character => {
        const rules = characterRules(character).map(rule => rule.label).join(' ');
        const haystack = normalize([character.name, character.alias, rules].join(' '));
        return search.split(' ').every(token => haystack.includes(token));
      });
    }
    const sorters = {
      name: (a,b) => a.name.localeCompare(b.name),
      'reputation-asc': (a,b) => (a.reputation||0) - (b.reputation||0) || a.name.localeCompare(b.name),
      'reputation-desc': (a,b) => (b.reputation||0) - (a.reputation||0) || a.name.localeCompare(b.name),
      'funding-asc': (a,b) => (a.funding||0) - (b.funding||0) || a.name.localeCompare(b.name),
      'funding-desc': (a,b) => (b.funding||0) - (a.funding||0) || a.name.localeCompare(b.name)
    };
    pool.sort(sorters[state.crewFilters.sort] || sorters.name);
    return pool;
  }

  function renderCrewPoolTile(character) {
    const recruited = state.crewBuilder.roster.includes(character.id);
    const rules = characterRules(character).slice(0,3);
    return `<article class="character-tile ${recruited ? 'recruited' : ''}" data-character-id="${escapeHtml(character.id)}">
      <button class="character-image-button" type="button" aria-label="View ${escapeHtml(character.name)}">
        <img src="${escapeHtml(character.thumbnail || character.image)}" loading="lazy" alt="${escapeHtml(character.name)}">
      </button>
      <div class="character-card-info">
        <h3>${escapeHtml(character.name)}</h3>
        <p class="character-alias">${escapeHtml(character.alias || 'Alias unknown')}</p>
        <div class="character-card-meta">
          <span class="badge">${character.reputation ?? '—'} REP</span>
          <span class="badge">${character.funding ?? '—'} $</span>
          ${character.rank ? `<span class="badge">${escapeHtml(character.rank)}</span>` : ''}
        </div>
        <div class="rule-ref-row character-rule-preview">${rules.map(renderCharacterRuleChip).join('')}</div>
        <div class="card-actions single"><button class="button ${recruited ? 'ghost' : ''}" data-action="recruit" type="button">${recruited ? 'Remove from crew' : 'Recruit'}</button></div>
      </div>
    </article>`;
  }

  function renderCrewRosterItem(character, fundingOverrides) {
    const isBoss = state.crewBuilder.bossId === character.id;
    const override = fundingOverrides && fundingOverrides.get(character.id);
    const fundingLabel = override ? `$0 (was $${character.funding ?? 0} — ${override.reason})` : `$${character.funding ?? 0}`;
    const gear = modelEquipment(character.id);
    const gearCost = characterEquipmentCost(character.id);
    const gearLabel = gear.length ? ` · +$${gearCost} gear` : '';
    const gearList = gear.length
      ? `<div class="roster-equipment"><span class="roster-equipment-items">${gear.map(entry => escapeHtml(equipmentEntryLabel(entry))).join(' · ')}</span><div class="rule-ref-row">${renderEquipmentRuleChips(character.id)}</div></div>`
      : '';
    return `<article class="deck-item ${isBoss ? 'is-boss' : ''}" data-character-id="${escapeHtml(character.id)}">
      <img src="${escapeHtml(character.thumbnail || character.image)}" alt="">
      <div><strong>${escapeHtml(character.name)}</strong><span>${character.reputation ?? 0} REP · ${fundingLabel}${gearLabel}${character.rank ? ` · ${escapeHtml(character.rank)}` : ''}${isBoss ? ' · Boss' : ''}</span>${gearList}</div>
      <div class="crew-roster-item-actions">
        <button class="icon-button equip-button ${gear.length ? 'active' : ''}" data-action="equip" type="button" title="Equipment" aria-label="Equipment for ${escapeHtml(character.name)}">⚙</button>
        <button class="icon-button boss-toggle ${isBoss ? 'active' : ''}" data-action="toggle-boss" type="button" title="${isBoss ? 'Remove Boss' : 'Set as Boss'}" aria-label="${isBoss ? 'Remove Boss' : 'Set as Boss'}">★</button>
        <button data-action="remove" type="button" aria-label="Remove ${escapeHtml(character.name)}">×</button>
      </div>
    </article>`;
  }

  function renderCrewBuilder() {
    if (!elements.crewPoolGrid) return;
    const cb = state.crewBuilder;
    elements.crewFactionSelect.value = cb.crew;
    elements.crewRepCapSlider.value = cb.repCap;
    elements.crewRepCapValue.textContent = cb.repCap;
    elements.crewFundingCapInput.value = cb.fundingCap;
    elements.crewSearch.value = state.crewFilters.search;
    elements.crewSort.value = state.crewFilters.sort;
    elements.crewRankFilter.value = state.crewFilters.rank;

    const pool = filteredCrewPool();
    elements.crewPoolTitle.textContent = cb.crew ? `${cb.crew} recruits` : 'Choose a crew to begin recruiting';
    elements.crewPoolVisibleCount.textContent = pool.length;
    elements.crewPoolGrid.innerHTML = pool.map(renderCrewPoolTile).join('');
    elements.emptyCrewPool.hidden = !cb.crew || pool.length > 0;
    const poolTotal = cb.crew ? rawCharacters.filter(character => (character.crews || [character.crew]).includes(cb.crew)).length : 0;
    elements.crewPoolCount.textContent = cb.crew ? `${poolTotal} recruitable in ${cb.crew}` : 'Choose a crew to begin';

    const rosterCharacters = crewRosterCharacters();
    const validation = validateCrew(rosterCharacters);

    elements.crewRepTotal.textContent = validation.repTotal;
    elements.crewRepCapLabel.textContent = cb.repCap;
    setMeter(elements.crewRepMeter, validation.repTotal, cb.repCap);

    elements.crewFundingTotal.textContent = validation.fundingTotal;
    elements.crewFundingCapLabel.textContent = validation.effectiveFundingCap;
    setMeter(elements.crewFundingMeter, validation.fundingTotal, validation.effectiveFundingCap);

    if (validation.bonuses.length) {
      elements.crewFundingBonusNote.hidden = false;
      elements.crewFundingBonusNote.innerHTML = `<strong>Funding bonuses active (+$${validation.bonusTotal})</strong><ul>${validation.bonuses.map(bonus => `<li>${escapeHtml(bonus.characterName)} — ${escapeHtml(bonus.label)} (+$${bonus.amount})</li>`).join('')}</ul>`;
    } else {
      elements.crewFundingBonusNote.hidden = true;
      elements.crewFundingBonusNote.innerHTML = '';
    }

    elements.crewRosterCount.textContent = `${rosterCharacters.length} model${rosterCharacters.length === 1 ? '' : 's'}`;
    if (!rosterCharacters.length) {
      elements.crewRosterList.className = 'deck-list empty-note';
      elements.crewRosterList.textContent = 'Recruit models from the pool.';
    } else {
      elements.crewRosterList.className = 'deck-list';
      elements.crewRosterList.innerHTML = rosterCharacters
        .slice()
        .sort((a,b) => rankSortIndex(a.rank) - rankSortIndex(b.rank) || (b.id === cb.bossId) - (a.id === cb.bossId) || a.name.localeCompare(b.name))
        .map(character => renderCrewRosterItem(character, validation.ruleEffects.fundingOverrides)).join('');
    }

    const hasErrors = validation.errors.length > 0;
    const hasWarnings = validation.warnings.length > 0;
    const headline = hasErrors ? (rosterCharacters.length ? 'Crew needs attention' : 'Start recruiting') : hasWarnings ? 'Crew legal, with warnings' : 'Crew legal';
    elements.crewValidationSummary.className = `validation-summary ${hasErrors ? 'invalid' : hasWarnings ? 'warning-only' : 'valid'}`;
    const errorItems = validation.errors.map(message => `<li>${escapeHtml(message)}</li>`).join('');
    const warningItems = validation.warnings.map(message => `<li class="warning">${escapeHtml(message)}</li>`).join('');
    const list = errorItems || warningItems ? `<ul>${errorItems}${warningItems}</ul>` : '';
    elements.crewValidationSummary.innerHTML = `<strong>${headline}</strong>${list || '<br>Reputation and funding are within the caps.'}`;
  }

  function recruitCharacter(id) {
    const character = rawCharacters.find(item => item.id === id);
    const cb = state.crewBuilder;
    if (!character || !cb.crew) return;
    const inCrew = (character.crews || [character.crew]).includes(cb.crew);
    if (!inCrew) {
      const { recruitAllowance } = crewRuleEffects(crewRosterCharacters());
      if (!isCrossRecruitEligible(character, recruitAllowance)) return;
    }
    if (cb.roster.includes(id)) return;
    const rosterCharacters = crewRosterCharacters();
    if (character.rank === 'Leader' && rosterCharacters.some(member => member.rank === 'Leader')) return;
    if (character.rank === 'Sidekick' && rosterCharacters.some(member => member.rank === 'Sidekick')) return;
    cb.roster.push(id);
    if (character.rank === 'Leader') cb.bossId = id;
    persist(); renderCrewBuilder();
  }

  function removeCrewMember(id) {
    const cb = state.crewBuilder;
    cb.roster = cb.roster.filter(item => item !== id);
    if (cb.bossId === id) cb.bossId = null;
    delete cb.equipment[id];
    persist(); renderCrewBuilder();
  }

  function toggleCrewBoss(id) {
    const cb = state.crewBuilder;
    cb.bossId = cb.bossId === id ? null : id;
    persist(); renderCrewBuilder();
  }

  function exportCrewJson() {
    const rosterCharacters = crewRosterCharacters();
    const validation = validateCrew(rosterCharacters);
    const cb = state.crewBuilder;
    const payload = {
      application: 'Batman Crew Builder', version: 1, exportedAt: new Date().toISOString(),
      crew: cb.crew, repCap: cb.repCap, fundingCap: cb.fundingCap, bossId: cb.bossId, equipmentList: activeEquipmentList(cb)?.id || '',
      roster: rosterCharacters.map(character => ({
        id: character.id, name: character.name, alias: character.alias, reputation: character.reputation, funding: character.funding, boss: character.id === cb.bossId,
        equipment: modelEquipment(character.id).map(entry => ({ id: entry.item.id, choice: entry.choice || null, name: equipmentEntryLabel(entry), cost: entry.item.cost, rep: entry.item.rep }))
      })),
      totals: { reputation: validation.repTotal, funding: validation.fundingTotal, equipmentFunding: validation.equipment.funding, equipmentReputation: validation.equipment.rep, fundingBonuses: validation.bonuses, effectiveFundingCap: validation.effectiveFundingCap },
      validation
    };
    download(`${slug(cb.crew || 'crew')}-crew.json`, JSON.stringify(payload,null,2), 'application/json');
  }

  function exportCrewText() {
    const rosterCharacters = crewRosterCharacters();
    const validation = validateCrew(rosterCharacters);
    const cb = state.crewBuilder;
    const lines = [
      `${cb.crew || 'Untitled'} Crew`,
      '='.repeat(Math.max(20, (cb.crew || 'Untitled').length + 6)), '',
      `Status: ${validation.valid ? 'LEGAL' : 'NEEDS ATTENTION'}`,
      ...validation.errors.map(error => `- ${error}`), '',
      `Reputation: ${validation.repTotal} / ${cb.repCap}`,
      `Funding: $${validation.fundingTotal} / $${validation.effectiveFundingCap}${validation.bonusTotal ? ` (base $${cb.fundingCap} + $${validation.bonusTotal} bonus)` : ''}`, '',
      'ROSTER',
      ...rosterCharacters.slice().sort((a,b) => a.name.localeCompare(b.name)).flatMap(character => [
        `- ${character.name}${character.alias ? ` / ${character.alias}` : ''} — ${character.reputation ?? 0} REP, $${character.funding ?? 0}${character.id === cb.bossId ? ' [BOSS]' : ''}`,
        ...modelEquipment(character.id).map(entry => `    + ${equipmentEntryLabel(entry)} (${formatEquipmentCost(entry.item)})`)
      ])
    ];
    if (validation.equipment.count) lines.splice(lines.indexOf('ROSTER'), 0, `Equipment: ${validation.equipment.count} item${validation.equipment.count === 1 ? '' : 's'}, $${validation.equipment.funding}${validation.equipment.rep ? ` + ${validation.equipment.rep} Rep` : ''} (${activeEquipmentList(cb)?.title || 'no list'})`, '');
    if (validation.bonuses.length) lines.push('', 'FUNDING BONUSES', ...validation.bonuses.map(bonus => `- ${bonus.characterName}: ${bonus.label} (+$${bonus.amount})`));
    download(`${slug(cb.crew || 'crew')}-crew.txt`, lines.join('\n'), 'text/plain');
  }

  // ---- Equipment screen --------------------------------------------------------------------------

  function addEquipment(characterId, itemId, choice) {
    const cb = state.crewBuilder;
    const item = equipmentById.get(itemId);
    if (!item || !cb.roster.includes(characterId)) return;
    const entries = cb.equipment[characterId] || [];
    if (entries.some(entry => entry.id === itemId)) return;
    if (item.choices && !item.choices.some(option => option.id === choice)) return;
    cb.equipment[characterId] = [...entries, { id: itemId, choice: item.choices ? choice : null }];
    persist(); renderEquipment();
  }

  function removeEquipment(characterId, itemId) {
    const cb = state.crewBuilder;
    const entries = (cb.equipment[characterId] || []).filter(entry => entry.id !== itemId);
    if (entries.length) cb.equipment[characterId] = entries; else delete cb.equipment[characterId];
    persist(); renderEquipment();
  }

  function sortedRosterByRank(rosterCharacters) {
    const bossId = state.crewBuilder.bossId;
    return rosterCharacters.slice().sort((a,b) => rankSortIndex(a.rank) - rankSortIndex(b.rank) || (b.id === bossId) - (a.id === bossId) || a.name.localeCompare(b.name));
  }

  // Why the model can't add this item right now: `blocked` reasons mean the item is off-limits to
  // the model entirely; `full` reasons (crew limit reached, duplicate trait) depend on other purchases.
  function equipmentAvailability(item, character, rosterCharacters, counts, choiceId) {
    const blocked = equipmentRestrictionReasons(item, character, rosterCharacters);
    const full = [];
    const max = item.limit[1];
    if (max != null && (counts.items.get(item.id) || 0) >= max) full.push(`Crew limit reached (${formatEquipmentLimit(item)}).`);
    const group = equipmentGroup(item);
    if (group && (counts.groups.get(`${item.listId}:${item.group}`) || 0) >= group.limit) full.push(`Only ${group.limit} of the ${group.label} may be selected.`);
    const choice = item.choices?.find(option => option.id === choiceId);
    if (choice?.limit != null && (counts.choices.get(`${item.id}:${choice.id}`) || 0) >= choice.limit) full.push(`${choice.label}: crew limit reached (0-${choice.limit}).`);
    const duplicates = duplicateEquipmentTraits(character, item, choiceId);
    if (duplicates.length) full.push(`Already has ${duplicates.join(', ')}.`);
    return { blocked, full };
  }

  function renderEquipmentModelRow(character, selectedId) {
    const gear = modelEquipment(character.id);
    const cost = characterEquipmentCost(character.id);
    const isBoss = state.crewBuilder.bossId === character.id;
    return `<article class="deck-item equipment-model-row ${character.id === selectedId ? 'selected' : ''} ${isBoss ? 'is-boss' : ''}" data-character-id="${escapeHtml(character.id)}" tabindex="0" role="button" aria-pressed="${character.id === selectedId}">
      <img src="${escapeHtml(character.thumbnail || character.image)}" alt="">
      <div><strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(character.rank || 'Unranked')}${isBoss ? ' · Boss' : ''}</span>
        <span class="equipment-model-gear">${gear.length ? `${gear.length} item${gear.length === 1 ? '' : 's'} · $${cost}` : 'No equipment'}</span></div>
      <span class="equipment-model-count ${gear.length ? 'active' : ''}">${gear.length || ''}</span>
    </article>`;
  }

  // `pickedChoice` is the option currently selected in the card's dropdown (for items like SWAT
  // Special Training where the buyer picks one granted rule).
  function renderEquipmentItemCard(item, character, rosterCharacters, counts, ownedEntry, pickedChoice) {
    const bought = counts.items.get(item.id) || 0;
    const choiceId = ownedEntry ? ownedEntry.choice : (pickedChoice || item.choices?.[0]?.id || null);
    const { blocked, full } = ownedEntry ? { blocked: [], full: [] } : equipmentAvailability(item, character, rosterCharacters, counts, choiceId);
    const reasons = blocked.length ? blocked : full;
    const choice = item.choices?.find(option => option.id === choiceId);
    const label = ownedEntry ? equipmentEntryLabel(ownedEntry) : item.name;
    const grants = [...item.grants, ...(choice?.grants || [])];
    const choiceSelect = item.choices && !ownedEntry
      ? `<label class="field equipment-choice"><span>Option</span><select data-equipment-choice>${item.choices.map(option =>
          `<option value="${escapeHtml(option.id)}" ${option.id === choiceId ? 'selected' : ''}>${escapeHtml(option.label)}${option.limit != null ? ` (0-${option.limit})` : ''}</option>`).join('')}</select></label>`
      : '';
    const limitText = `${item.limit[1] == null ? 'No limit' : formatEquipmentLimit(item)} · ${bought} bought`;
    const action = ownedEntry
      ? '<button class="button ghost compact" data-action="remove-equipment" type="button">Remove</button>'
      : blocked.length ? '' : `<button class="button compact" data-action="add-equipment" type="button" ${full.length ? 'disabled' : ''}>Add · ${escapeHtml(formatEquipmentCost(item))}</button>`;
    return `<article class="equipment-item ${ownedEntry ? 'owned' : ''} ${blocked.length ? 'unavailable' : ''}" data-equipment-id="${escapeHtml(item.id)}">
      <div class="equipment-item-head">
        <h3>${escapeHtml(label)}</h3>
        <span class="equipment-cost">${escapeHtml(formatEquipmentCost(item))}</span>
      </div>
      <div class="badge-row">
        <span class="badge ${item.limit[1] != null && bought > item.limit[1] ? 'over' : ''}">${escapeHtml(limitText)}</span>
        ${item.requires ? `<span class="badge character">Needs ${escapeHtml(item.requires.join(' / '))}</span>` : ''}
        ${item.unbreakable ? '<span class="badge copy" title="Cannot be affected by the Broken Equipment rule">Unbreakable</span>' : ''}
      </div>
      <p class="equipment-description">${renderDamageMarkers(escapeHtml(item.description))}</p>
      ${grants.length ? `<div class="rule-ref-row">${grants.map(rule => renderCharacterRuleChip(ownedEntry ? { ...rule, equipment: label } : rule)).join('')}</div>` : ''}
      ${choiceSelect}
      ${reasons.length ? `<p class="equipment-reason">${reasons.map(escapeHtml).join(' ')}</p>` : ''}
      ${action ? `<div class="equipment-item-actions">${action}</div>` : ''}
    </article>`;
  }

  function renderEquipment() {
    if (!elements.equipmentView) return;
    const cb = state.crewBuilder;
    const filters = state.equipmentFilters;
    const rosterCharacters = crewRosterCharacters();
    const sortedRoster = sortedRosterByRank(rosterCharacters);
    const list = activeEquipmentList(cb);
    const defaultList = equipmentLists.find(item => item.id === defaultEquipmentListId(cb.crew));

    elements.equipmentListSelect.innerHTML = `<option value="">${defaultList ? `Crew default (${escapeHtml(defaultList.title)})` : 'Crew default (none for this crew)'}</option>` +
      equipmentLists.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}${item.source === 'compendium' ? ` · compendium p.${item.page}` : ''}</option>`).join('');
    elements.equipmentListSelect.value = cb.equipmentList || '';
    elements.equipmentSearch.value = filters.search;
    elements.equipmentShowUnavailable.checked = filters.showUnavailable;

    if (!rosterCharacters.some(character => character.id === filters.characterId)) {
      const firstBuyer = sortedRoster.find(character => EQUIPMENT_DEFAULT_RANKS.includes(character.rank)) || sortedRoster[0];
      filters.characterId = firstBuyer ? firstBuyer.id : '';
    }
    const character = rosterCharacters.find(item => item.id === filters.characterId) || null;

    elements.equipmentModelList.className = rosterCharacters.length ? 'deck-list equipment-model-list' : 'deck-list equipment-model-list empty-note';
    elements.equipmentModelList.innerHTML = rosterCharacters.length
      ? sortedRoster.map(member => renderEquipmentModelRow(member, filters.characterId)).join('')
      : 'Recruit models in the Crew Builder first.';

    const validation = validateCrew(rosterCharacters);
    elements.equipmentRepTotal.textContent = validation.repTotal;
    elements.equipmentRepCapLabel.textContent = cb.repCap;
    setMeter(elements.equipmentRepMeter, validation.repTotal, cb.repCap);
    elements.equipmentFundingTotal.textContent = validation.fundingTotal;
    elements.equipmentFundingCapLabel.textContent = validation.effectiveFundingCap;
    setMeter(elements.equipmentFundingMeter, validation.fundingTotal, validation.effectiveFundingCap);
    const messages = [...validateEquipment(rosterCharacters), ...validation.errors.filter(message => /exceeds the cap/.test(message))];
    elements.equipmentValidationSummary.className = `validation-summary ${messages.length ? 'invalid' : 'valid'}`;
    elements.equipmentValidationSummary.innerHTML = messages.length
      ? `<strong>Equipment needs attention</strong><ul>${messages.map(message => `<li>${escapeHtml(message)}</li>`).join('')}</ul>`
      : `<strong>Equipment legal</strong><br>${validation.equipment.count ? `${validation.equipment.count} item${validation.equipment.count === 1 ? '' : 's'} costing $${validation.equipment.funding}${validation.equipment.rep ? ` + ${validation.equipment.rep} Rep` : ''}.` : 'No equipment purchased yet.'}`;
    renderEquipmentCrewList(sortedRoster, validation);

    const showEmpty = (title, text) => {
      elements.equipmentItemGrid.innerHTML = '';
      elements.emptyEquipment.hidden = false;
      elements.emptyEquipmentTitle.textContent = title;
      elements.emptyEquipmentText.textContent = text;
    };
    elements.equipmentToolbar.hidden = !character || !list;
    if (!character) {
      elements.equipmentModelEyebrow.textContent = 'Equipment';
      elements.equipmentModelTitle.textContent = cb.crew ? 'Choose a model' : 'Choose a crew first';
      elements.equipmentModelCost.textContent = '$0';
      elements.equipmentModelSummary.innerHTML = '';
      showEmpty('No model selected', cb.crew ? 'Recruit models in the Crew Builder, then pick one on the left to buy its equipment.' : 'Pick a crew and recruit models in the Crew Builder first.');
      return;
    }

    const gear = modelEquipment(character.id);
    elements.equipmentModelEyebrow.textContent = `${character.rank || 'Unranked'}${cb.bossId === character.id ? ' · Boss' : ''}${list ? ` · ${list.title} list` : ''}`;
    elements.equipmentModelTitle.textContent = character.name;
    elements.equipmentModelCost.textContent = `$${characterEquipmentCost(character.id)}`;
    const nativeChips = characterRules(character).filter(rule => rule.category === 'trait').map(renderCharacterRuleChip).join('');
    const equipmentChips = renderEquipmentRuleChips(character.id);
    elements.equipmentModelSummary.innerHTML = `<div class="equipment-model-summary">
      <img src="${escapeHtml(character.thumbnail || character.image)}" alt="${escapeHtml(character.name)}">
      <div>
        <p class="character-alias">${escapeHtml(character.alias && normalize(character.alias) !== 'unknown' ? character.alias : 'Alias unknown')} · ${character.reputation ?? 0} REP · $${character.funding ?? 0}</p>
        <p class="equipment-added-heading">Printed traits</p>
        <div class="rule-ref-row">${nativeChips || '<span class="muted">No traits transcribed.</span>'}</div>
        ${equipmentChips ? `<p class="equipment-added-heading">Added by equipment</p><div class="rule-ref-row">${equipmentChips}</div>` : ''}
        ${EQUIPMENT_DEFAULT_RANKS.includes(character.rank) ? '' : `<p class="equipment-reason">${escapeHtml(character.rank || 'Unranked')} models can only take equipment that specifically allows them.</p>`}
      </div>
    </div>`;

    if (!list) {
      showEmpty('No equipment list for this crew', `The compendium has no equipment list for ${cb.crew}. Choose one from “Equipment list” on the left if your group uses one.`);
      return;
    }

    // Keep each dropdown's picked option across re-renders so its Add button reflects that option.
    const pickedChoices = new Map($$('[data-equipment-choice]', elements.equipmentItemGrid)
      .map(select => [select.closest('[data-equipment-id]').dataset.equipmentId, select.value]));
    const counts = crewEquipmentCounts(cb);
    const search = normalize(filters.search);
    const matchesSearch = item => !search || search.split(' ').every(token =>
      normalize([item.name, item.description, ...item.grants.map(rule => rule.label), ...(item.choices || []).map(option => option.label)].join(' ')).includes(token));
    const ownedIds = new Set(gear.map(entry => entry.item.id));
    const available = [], unavailable = [];
    list.items.filter(item => !ownedIds.has(item.id) && matchesSearch(item)).forEach(item => {
      (equipmentRestrictionReasons(item, character, rosterCharacters).length ? unavailable : available).push(item);
    });
    const card = (item, ownedEntry = null) => renderEquipmentItemCard(item, character, rosterCharacters, counts, ownedEntry, pickedChoices.get(item.id));
    const section = (title, cards) => cards.length ? `<h3 class="equipment-section-title">${title} <span>${cards.length}</span></h3><div class="equipment-section">${cards.join('')}</div>` : '';
    const html = section('Equipped', gear.filter(entry => matchesSearch(entry.item)).map(entry => card(entry.item, entry))) +
      section('Available', available.map(item => card(item))) +
      (filters.showUnavailable ? section(`Not available to ${escapeHtml(character.name)}`, unavailable.map(item => card(item))) : '');
    if (!html) {
      showEmpty('No equipment matches', search ? 'Clear the search to see the full list.' : `Nothing on the ${list.title} list is available to ${character.name}. Tick “Show items this model can't take” to see why.`);
      return;
    }
    elements.emptyEquipment.hidden = true;
    const hiddenNote = !filters.showUnavailable && unavailable.length
      ? `<p class="muted equipment-hidden-note">${unavailable.length} item${unavailable.length === 1 ? '' : 's'} on this list can't be taken by ${escapeHtml(character.name)} — tick “Show items this model can't take” to see why.</p>`
      : '';
    elements.equipmentItemGrid.innerHTML = html + hiddenNote;
  }

  function renderEquipmentCrewList(sortedRoster, validation) {
    const withGear = sortedRoster.filter(character => modelEquipment(character.id).length);
    elements.equipmentCrewCount.textContent = `${validation.equipment.count} item${validation.equipment.count === 1 ? '' : 's'} · $${validation.equipment.funding}`;
    if (!withGear.length) {
      elements.equipmentCrewList.className = 'equipment-crew-list empty-note';
      elements.equipmentCrewList.textContent = 'No equipment purchased yet.';
      return;
    }
    elements.equipmentCrewList.className = 'equipment-crew-list';
    elements.equipmentCrewList.innerHTML = withGear.map(character => `<section class="equipment-crew-model">
      <button class="text-button" data-action="select-model" data-character-id="${escapeHtml(character.id)}" type="button">${escapeHtml(character.name)} <span>$${characterEquipmentCost(character.id)}</span></button>
      <ul>${modelEquipment(character.id).map(entry => `<li><span>${escapeHtml(equipmentEntryLabel(entry))}</span><span>${escapeHtml(formatEquipmentCost(entry.item))}</span>
        <button data-action="remove-equipment" data-character-id="${escapeHtml(character.id)}" data-equipment-id="${escapeHtml(entry.item.id)}" type="button" aria-label="Remove ${escapeHtml(equipmentEntryLabel(entry))} from ${escapeHtml(character.name)}">×</button></li>`).join('')}</ul>
    </section>`).join('');
  }

  async function importCrewJson(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const ids = Array.isArray(payload.roster) ? payload.roster.map(item => typeof item === 'string' ? item : item.id) : [];
      const crew = typeof payload.crew === 'string' ? payload.crew : '';
      const validIds = resolveCrewRosterIds(ids, crew);
      const equipment = payload.equipment && typeof payload.equipment === 'object' ? payload.equipment
        : Object.fromEntries((Array.isArray(payload.roster) ? payload.roster : []).filter(item => item && Array.isArray(item.equipment)).map(item => [item.id, item.equipment]));
      state.crewBuilder = {
        crew,
        repCap: Number.isFinite(Number(payload.repCap)) ? Number(payload.repCap) : defaults.crewBuilder.repCap,
        fundingCap: Number.isFinite(Number(payload.fundingCap)) ? Number(payload.fundingCap) : defaults.crewBuilder.fundingCap,
        bossId: validIds.includes(payload.bossId) ? payload.bossId : null,
        roster: validIds,
        equipmentList: equipmentLists.some(list => list.id === payload.equipmentList) ? payload.equipmentList : '',
        equipment: sanitizeEquipment(equipment, validIds)
      };
      persist(); renderCrewBuilder(); toast(`Imported ${validIds.length} crew member${validIds.length === 1 ? '' : 's'}`);
    } catch (error) {
      alert(`Could not import this crew file: ${error.message}`);
    }
  }


  function navigateTo(view, entryId = '') {
    const target = view === 'reference'
      ? `#reference${entryId ? `/${entryId}` : ''}`
      : view === 'equipment' ? `#equipment${entryId ? `/${entryId}` : ''}`
      : view === 'characters' ? '#characters' : view === 'crew' ? '#crew' : '#builder';
    if (location.hash === target) applyRoute();
    else location.hash = target;
  }

  function applyRoute() {
    const route = decodeURIComponent((location.hash || '#builder').replace(/^#/, ''));
    const [page, entryId] = route.split('/');
    const showReference = page === 'reference';
    const showCharacters = page === 'characters';
    const showCrew = page === 'crew';
    const showEquipment = page === 'equipment';
    const showBuilder = !showReference && !showCharacters && !showCrew && !showEquipment;
    elements.builderView.hidden = !showBuilder;
    elements.characterView.hidden = !showCharacters;
    elements.referenceView.hidden = !showReference;
    elements.crewView.hidden = !showCrew;
    elements.equipmentView.hidden = !showEquipment;
    elements.equipmentNav.classList.toggle('active', showEquipment);
    elements.equipmentNav.setAttribute('aria-current', showEquipment ? 'page' : 'false');
    elements.builderNav.classList.toggle('active', showBuilder);
    elements.characterNav.classList.toggle('active', showCharacters);
    elements.referenceNav.classList.toggle('active', showReference);
    elements.crewNav.classList.toggle('active', showCrew);
    elements.builderNav.setAttribute('aria-current', showBuilder ? 'page' : 'false');
    elements.characterNav.setAttribute('aria-current', showCharacters ? 'page' : 'false');
    elements.referenceNav.setAttribute('aria-current', showReference ? 'page' : 'false');
    elements.crewNav.setAttribute('aria-current', showCrew ? 'page' : 'false');
    document.title = showReference ? 'BMG Compendium Reference' : showCharacters ? 'BMG Character Card Archive' : showCrew ? 'BMG Crew Builder' : showEquipment ? 'BMG Crew Equipment' : 'Batman Objective Deck Builder';
    hideRuleTooltip();
    if (showBuilder) { renderLibrary(); renderDeck(); }
    if (showCharacters) renderCharacters();
    if (showCrew) renderCrewBuilder();
    if (showEquipment) {
      if (entryId) state.equipmentFilters.characterId = entryId;
      renderEquipment();
    }
    if (showReference) {
      renderReference();
      if (entryId) requestAnimationFrame(() => focusReferenceEntry(entryId));
    }
  }

  function openReferenceEntry(id) {
    [elements.cardDialog, elements.metadataDialog, elements.rulesDialog, elements.playDialog, elements.characterDialog].forEach(dialog => {
      if (dialog?.open) dialog.close();
    });
    navigateTo('reference', id);
  }

  function focusReferenceEntry(id) {
    const entryElement = elements.referenceList.querySelector(`[data-ref-entry="${id}"]`);
    if (!entryElement) {
      const entry = referenceById.get(id);
      if (!entry) return;
      state.referenceFilters.search = entry.title;
      state.referenceFilters.section = 'all';
      state.referenceFilters.letter = 'all';
      elements.referenceSearch.value = entry.title;
      elements.referenceSection.value = 'all';
      persist();
      renderReference();
      requestAnimationFrame(() => focusReferenceEntry(id));
      return;
    }
    entryElement.open = true;
    entryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    entryElement.classList.add('reference-focus');
    setTimeout(() => entryElement.classList.remove('reference-focus'), 1800);
  }

  function selectedReferenceIds() {
    const ids = new Set();
    state.selected.map(getCard).filter(Boolean).forEach(card => {
      (card.referenceIds || []).forEach(id => ids.add(id));
    });
    return ids;
  }

  function referenceFilterBase(includeLetter = true) {
    const filters = state.referenceFilters;
    const search = normalize(filters.search);
    const selectedIds = selectedReferenceIds();
    return referenceEntries.filter(entry => {
      if (filters.section !== 'all' && entry.section !== filters.section) return false;
      if (filters.selectedOnly && !selectedIds.has(entry.id)) return false;
      const first = (entry.title.match(/[A-Za-z0-9]/)?.[0] || '#').toUpperCase();
      if (includeLetter && filters.letter !== 'all' && first !== filters.letter) return false;
      if (search) {
        const haystack = normalize([entry.title, entry.section, entry.subsection, entry.body, ...(entry.aliases || []), `page ${entry.page}`].join(' '));
        if (!search.split(' ').every(token => haystack.includes(token))) return false;
      }
      return true;
    });
  }

  function renderReference() {
    if (!elements.referenceList) return;
    const filters = state.referenceFilters;
    let entries = referenceFilterBase(true);
    if (filters.sort === 'alpha') entries.sort((a,b) => a.title.localeCompare(b.title) || a.page - b.page);
    else entries.sort((a,b) => a.order - b.order);

    const selectedIds = selectedReferenceIds();
    const autoOpen = Boolean(filters.search) && entries.length <= 14;
    const html = [];
    if (filters.sort === 'source') {
      let lastSection = '';
      entries.forEach(entry => {
        if (entry.section !== lastSection) {
          const sectionCount = entries.filter(item => item.section === entry.section).length;
          html.push(`<div class="reference-section-label"><h3>${escapeHtml(entry.section)}</h3><span>${sectionCount} entr${sectionCount === 1 ? 'y' : 'ies'}</span></div>`);
          lastSection = entry.section;
        }
        html.push(renderReferenceEntry(entry, selectedIds.has(entry.id), autoOpen));
      });
    } else {
      entries.forEach(entry => html.push(renderReferenceEntry(entry, selectedIds.has(entry.id), autoOpen)));
    }

    elements.referenceList.innerHTML = html.join('');
    elements.referenceVisibleCount.textContent = entries.length;
    elements.emptyReference.hidden = entries.length > 0;
    elements.referenceExpandAll.textContent = autoOpen ? 'Collapse results' : 'Expand results';
    elements.referenceTitle.textContent = filters.section === 'all' ? 'Complete compendium' : filters.section;
    renderReferenceAlphabet();
    renderReferenceActiveFilters();
  }

  function renderReferenceAlphabet() {
    const base = referenceFilterBase(false);
    const counts = new Map();
    base.forEach(entry => {
      const first = (entry.title.match(/[A-Za-z0-9]/)?.[0] || '#').toUpperCase();
      counts.set(first, (counts.get(first) || 0) + 1);
    });
    const letters = ['all', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    elements.referenceAlphabet.innerHTML = letters.map(letter => {
      const count = letter === 'all' ? base.length : (counts.get(letter) || 0);
      const label = letter === 'all' ? 'All' : letter;
      return `<button class="reference-letter ${state.referenceFilters.letter === letter ? 'active' : ''}" data-reference-letter="${letter}" type="button" ${count ? '' : 'disabled'} title="${count} entries">${label}</button>`;
    }).join('');
  }

  function renderReferenceActiveFilters() {
    const filters = state.referenceFilters;
    const chips = [];
    if (filters.search) chips.push(`Search: ${filters.search}`);
    if (filters.section !== 'all') chips.push(filters.section);
    if (filters.letter !== 'all') chips.push(`Starts with ${filters.letter}`);
    if (filters.selectedOnly) chips.push('Current deck references');
    elements.referenceActiveFilters.hidden = chips.length === 0;
    elements.referenceActiveFilters.innerHTML = chips.map(chip => `<span class="badge">${escapeHtml(chip)}</span>`).join('');
  }

  function renderReferenceEntry(entry, usedByDeck, open = false) {
    const subtitle = [entry.subsection, entry.kind ? entry.kind.replaceAll('-', ' ') : ''].filter(Boolean).join(' · ');
    return `<details class="reference-entry" data-ref-entry="${escapeHtml(entry.id)}" ${open ? 'open' : ''}>
      <summary>
        <div class="reference-summary-title"><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(subtitle || entry.section)}</span></div>
        <div class="reference-summary-meta">${usedByDeck ? '<span class="badge general">In current deck</span>' : ''}<span class="badge source-page-badge">Page ${entry.page}</span></div>
      </summary>
      <div class="reference-body">${formatReferenceBody(entry.body)}</div>
    </details>`;
  }

  function formatReferenceBody(body = '') {
    return body.split(/\n+/).filter(Boolean).map(line => {
      const bullet = /^[•-]\s*/.test(line);
      const cleaned = line.replace(/^[•-]\s*/, '');
      const content = renderDamageMarkers(escapeHtml(cleaned));
      return bullet ? `<div class="reference-bullet">${content}</div>` : `<p>${content}</p>`;
    }).join('');
  }

  function renderDamageMarkers(html = '') {
    return html
      .replaceAll('[[A]]', '<span class="damage-marker injury" title="Injury damage marker">A</span>')
      .replaceAll('[[B]]', '<span class="damage-marker stun" title="Stun damage marker">B</span>');
  }

  function cardReferenceEntries(card) {
    const seen = new Set();
    return (card?.referenceIds || []).map(id => referenceById.get(id)).filter(entry => {
      if (!entry || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  }

  function renderRuleRefChip(entry) {
    return `<button class="rule-ref-chip" data-rule-ref="${escapeHtml(entry.id)}" type="button">${escapeHtml(entry.title)}</button>`;
  }

  function renderRuleRefChips(card, max = 3) {
    const entries = cardReferenceEntries(card);
    if (!entries.length) return '';
    const shown = entries.slice(0, max);
    return `<div class="rule-ref-row" aria-label="Referenced compendium rules">${shown.map(renderRuleRefChip).join('')}${entries.length > max ? `<span class="rule-ref-more">+${entries.length - max} more</span>` : ''}</div>`;
  }

  function renderCardTextWithReferences(text, entries) {
    if (!entries.length) return renderDamageMarkers(escapeHtml(text)).replace(/\n/g, '<br>');
    const terms = [];
    const termToEntry = new Map();
    entries.forEach(entry => {
      [entry.title, ...(entry.aliases || [])].forEach(term => {
        const key = term.toLowerCase();
        if (term.length < 3 || termToEntry.has(key)) return;
        termToEntry.set(key, entry);
        terms.push(term);
      });
    });
    terms.sort((a,b) => b.length - a.length);
    if (!terms.length) return renderDamageMarkers(escapeHtml(text)).replace(/\n/g, '<br>');
    const expression = new RegExp(terms.map(escapeRegExp).join('|'), 'gi');
    let output = '';
    let cursor = 0;
    let match;
    while ((match = expression.exec(text)) !== null) {
      const before = text[match.index - 1] || '';
      const after = text[match.index + match[0].length] || '';
      if ((before && /[A-Za-z0-9]/.test(before)) || (after && /[A-Za-z0-9]/.test(after))) continue;
      const entry = termToEntry.get(match[0].toLowerCase());
      if (!entry) continue;
      output += escapeHtml(text.slice(cursor, match.index));
      output += `<button class="inline-rule-ref" data-rule-ref="${escapeHtml(entry.id)}" type="button">${escapeHtml(match[0])}</button>`;
      cursor = match.index + match[0].length;
    }
    output += escapeHtml(text.slice(cursor));
    return renderDamageMarkers(output).replace(/\n/g, '<br>');
  }

  function escapeRegExp(value = '') {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function handleRuleReferenceClick(event) {
    const trigger = event.target.closest?.('[data-rule-ref]');
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    openReferenceEntry(trigger.dataset.ruleRef);
  }

  function handleRuleTooltipEnter(event) {
    const trigger = event.target.closest?.('[data-rule-ref]');
    if (!trigger) return;
    const entry = referenceById.get(trigger.dataset.ruleRef);
    if (!entry) return;
    mountRuleTooltipAboveTrigger(trigger);
    const excerpt = entry.body.replaceAll('[[A]]', 'Injury').replaceAll('[[B]]', 'Stun').replace(/\s+/g, ' ').trim();
    elements.ruleTooltip.innerHTML = `<strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(excerpt.slice(0, 280))}${excerpt.length > 280 ? '…' : ''}</p><span>${escapeHtml(entry.section)} · page ${entry.page} · click to open the Compendium</span>`;
    elements.ruleTooltip.hidden = false;
    elements.ruleTooltip.dataset.anchorId = trigger.dataset.ruleRef;
    positionRuleTooltip(event, trigger);
  }

  function mountRuleTooltipAboveTrigger(trigger) {
    if (!elements.ruleTooltip) return;
    // A modal <dialog> lives in the browser's top layer. An element left under
    // <body> cannot out-z-index that layer, regardless of its numeric z-index.
    // Move the shared tooltip into the active dialog when necessary so it is
    // painted above the dialog contents, and return it to <body> elsewhere.
    const activeDialog = trigger.closest?.('dialog[open]');
    const host = activeDialog || document.body;
    if (elements.ruleTooltip.parentElement !== host) host.append(elements.ruleTooltip);
  }

  function handleRuleTooltipLeave(event) {
    const trigger = event.target.closest?.('[data-rule-ref]');
    if (!trigger) return;
    const related = event.relatedTarget?.closest?.('[data-rule-ref]');
    if (related === trigger) return;
    hideRuleTooltip();
  }

  function hideRuleTooltip() {
    if (!elements.ruleTooltip) return;
    elements.ruleTooltip.hidden = true;
    delete elements.ruleTooltip.dataset.anchorId;
  }

  function positionRuleTooltip(event, fallbackTrigger = null) {
    if (!elements.ruleTooltip || elements.ruleTooltip.hidden) return;
    const trigger = fallbackTrigger || event.target?.closest?.('[data-rule-ref]');
    const rect = trigger?.getBoundingClientRect?.();
    const clientX = Number.isFinite(event.clientX) && event.clientX ? event.clientX : (rect ? rect.left + rect.width / 2 : 20);
    const clientY = Number.isFinite(event.clientY) && event.clientY ? event.clientY : (rect ? rect.bottom : 20);
    const tooltipRect = elements.ruleTooltip.getBoundingClientRect();
    const margin = 12;
    let left = clientX + 14;
    let top = clientY + 14;
    if (left + tooltipRect.width > innerWidth - margin) left = Math.max(margin, clientX - tooltipRect.width - 14);
    if (top + tooltipRect.height > innerHeight - margin) top = Math.max(margin, clientY - tooltipRect.height - 14);
    elements.ruleTooltip.style.left = `${left}px`;
    elements.ruleTooltip.style.top = `${top}px`;
  }

  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type}));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function toast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2200);
  }
})();
