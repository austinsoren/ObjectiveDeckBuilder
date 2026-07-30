(() => {
  'use strict';

  const STORAGE_KEY = 'batman-objective-deck-builder-v1';
  const rawCards = Array.isArray(window.BATMAN_CARD_DATA) ? window.BATMAN_CARD_DATA : [];
  const referenceData = window.BATMAN_REFERENCE_DATA && typeof window.BATMAN_REFERENCE_DATA === 'object' ? window.BATMAN_REFERENCE_DATA : { entries: [] };
  const referenceEntries = Array.isArray(referenceData.entries) ? referenceData.entries : [];
  const referenceById = new Map(referenceEntries.map(entry => [entry.id, entry]));
  const referenceSectionOrder = ['Core Rules','Traits','Weapon Rules','Templates','Effects','Equipment'];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const slug = (value = '') => normalize(value).replace(/\s+/g, '-');

  const affiliations = [...new Set(rawCards.map(card => card.affiliation).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const defaults = {
    affiliation: affiliations[0] || '',
    selected: [],
    roster: [],
    overrides: {},
    play: null,
    filters: { search: '', category: 'buildable', copies: 'all', sort: 'title', availableOnly: false, tags: [] },
    referenceFilters: { search: '', section: 'all', sort: 'source', selectedOnly: false, letter: 'all' }
  };

  let state = loadState();
  let activeCardId = null;
  let activeCardContext = 'builder';
  let toastTimer = null;

  const elements = {
    affiliation: $('#affiliationSelect'), search: $('#searchInput'), category: $('#categoryFilter'), copies: $('#copyFilter'),
    sort: $('#sortSelect'), availableOnly: $('#availableOnly'), tagFilters: $('#tagFilters'), cardGrid: $('#cardGrid'),
    visibleCount: $('#visibleCount'), libraryTitle: $('#libraryTitle'), activeFilters: $('#activeFilters'), emptyLibrary: $('#emptyLibrary'),
    deckList: $('#deckList'), validation: $('#validationSummary'), baseTotal: $('#baseTotal'), generalTotal: $('#generalTotal'),
    affiliationTotal: $('#affiliationTotal'), singleTotal: $('#singleTotal'), bonusTotal: $('#bonusTotal'), baseMeter: $('#baseMeter'),
    generalMeter: $('#generalMeter'), singleMeter: $('#singleMeter'), bonusMeter: $('#bonusMeter'), selectedDesignCount: $('#selectedDesignCount'),
    rosterList: $('#rosterList'), modelForm: $('#modelForm'), saveStatus: $('#saveStatus'), toast: $('#toast'),
    cardDialog: $('#cardDialog'), dialogImage: $('#dialogImage'), dialogTitle: $('#dialogTitle'), dialogCategory: $('#dialogCategory'),
    dialogBadges: $('#dialogBadges'), dialogRequirement: $('#dialogRequirement'), dialogText: $('#dialogText'), dialogToggle: $('#dialogToggleCard'),
    metadataDialog: $('#metadataDialog'), metadataForm: $('#metadataForm'), editTitle: $('#editTitle'), editSubtitle: $('#editSubtitle'),
    editRank: $('#editRank'), editTags: $('#editTags'), rulesDialog: $('#rulesDialog'),
    playDialog: $('#playDialog'), playTitle: $('#playTitle'), playSessionNote: $('#playSessionNote'), playRound: $('#playRound'),
    playHandCount: $('#playHandCount'), playDeckCount: $('#playDeckCount'), playDiscardCount: $('#playDiscardCount'),
    playDeckCountSide: $('#playDeckCountSide'), playDiscardCountSide: $('#playDiscardCountSide'), playPhaseEyebrow: $('#playPhaseEyebrow'),
    playPhaseTitle: $('#playPhaseTitle'), playPhaseHelp: $('#playPhaseHelp'), playPrimaryAction: $('#playPrimaryAction'),
    playSkipAction: $('#playSkipAction'), playUndo: $('#playUndo'), playHand: $('#playHand'), playSelectionCount: $('#playSelectionCount'),
    playDiscardPreview: $('#playDiscardPreview'), playLog: $('#playLog'), startPlay: $('#startPlay')
  };
  Object.assign(elements, {
    builderView: $('#builderView'), referenceView: $('#referenceView'), builderNav: $('#builderNavButton'), referenceNav: $('#referenceNavButton'),
    referenceSearch: $('#referenceSearch'), referenceSection: $('#referenceSection'), referenceSort: $('#referenceSort'),
    referenceSelectedOnly: $('#referenceSelectedOnly'), referenceAlphabet: $('#referenceAlphabet'), referenceList: $('#referenceList'),
    referenceVisibleCount: $('#referenceVisibleCount'), referenceTotalCount: $('#referenceTotalCount'), referenceTitle: $('#referenceTitle'),
    referenceActiveFilters: $('#referenceActiveFilters'), emptyReference: $('#emptyReference'), referenceExpandAll: $('#referenceExpandAll'),
    dialogRuleRefs: $('#dialogRuleRefs'), dialogRuleRefList: $('#dialogRuleRefList'), ruleTooltip: $('#ruleTooltip')
  });

  initialize();

  function initialize() {
    elements.affiliation.innerHTML = affiliations.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
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
    elements.referenceTotalCount.textContent = `${referenceEntries.length} indexed entries`;
    bindEvents();
    renderAll();
    applyRoute();
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        ...structuredClone(defaults),
        ...parsed,
        filters: { ...defaults.filters, ...(parsed?.filters || {}) },
        referenceFilters: { ...defaults.referenceFilters, ...(parsed?.referenceFilters || {}) },
        selected: Array.isArray(parsed?.selected) ? parsed.selected.filter(id => rawCards.some(card => card.id === id)) : [],
        roster: Array.isArray(parsed?.roster) ? parsed.roster : [],
        overrides: parsed?.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
        play: parsed?.play && typeof parsed.play === 'object' ? parsed.play : null
      };
    } catch {
      return structuredClone(defaults);
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  function bindEvents() {
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
      event.target.reset(); persist(); renderRoster(); renderDeck();
    });
    elements.rosterList.addEventListener('click', event => {
      const button = event.target.closest('[data-remove-model]');
      if (!button) return;
      state.roster = state.roster.filter(model => model.id !== button.dataset.removeModel);
      persist(); renderRoster(); renderDeck();
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
    $('[data-close-play]').addEventListener('click', () => elements.playDialog.close());
    $('#restartPlay').addEventListener('click', restartPlaySession);
    $('#endPlay').addEventListener('click', endPlaySession);
    $('#autoBuild').addEventListener('click', autoBuild);
    $('#exportJson').addEventListener('click', exportJson);
    $('#exportText').addEventListener('click', exportText);
    $('#printDeck').addEventListener('click', () => window.print());
    $('#importJson').addEventListener('change', importJson);
    $('#helpButton').addEventListener('click', () => elements.rulesDialog.showModal());
    $('[data-close-rules]').addEventListener('click', () => elements.rulesDialog.close());
    $('[data-close-dialog]').addEventListener('click', () => elements.cardDialog.close());
    $('[data-close-metadata]').addEventListener('click', () => elements.metadataDialog.close());
    elements.dialogToggle.addEventListener('click', () => { if (activeCardId) toggleCard(activeCardId); });
    $('#editMetadata').addEventListener('click', openMetadataEditor);
    elements.metadataForm.addEventListener('submit', saveMetadata);
    $('#resetMetadata').addEventListener('click', resetMetadata);
    [elements.cardDialog, elements.metadataDialog, elements.rulesDialog].forEach(dialog => {
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    });
    [elements.cardDialog, elements.metadataDialog, elements.rulesDialog, elements.playDialog].forEach(dialog => {
      dialog.addEventListener('close', hideRuleTooltip);
    });

    elements.builderNav.addEventListener('click', () => navigateTo('builder'));
    elements.referenceNav.addEventListener('click', () => navigateTo('reference'));
    window.addEventListener('hashchange', applyRoute);
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
    if (!elements.referenceView.hidden) renderReference();
  }

  function libraryPool() {
    const category = state.filters.category;
    return allCards().filter(card => {
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
    setMeter(elements.baseMeter, baseTotal, 20);
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

    if (validation.valid) {
      elements.validation.className = 'validation-summary valid';
      elements.validation.innerHTML = '<strong>Deck legal</strong><br>All supplied deck-building rules are satisfied.';
    } else {
      elements.validation.className = 'validation-summary invalid';
      const errors = validation.errors.map(message => `<li>${escapeHtml(message)}</li>`).join('');
      const warnings = validation.warnings.map(message => `<li class="warning">${escapeHtml(message)}</li>`).join('');
      elements.validation.innerHTML = `<strong>${selected.length ? 'Deck needs attention' : 'Start building'}</strong><ul>${errors}${warnings}</ul>`;
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

    if (baseTotal !== 20) errors.push(`Base deck contains ${baseTotal} cards; it must contain exactly 20.`);
    if (general > affiliated) errors.push(`General cards (${general}) outnumber crew-specific cards (${affiliated}).`);
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
      const requirement = normalize(card.subtitle);
      const rank = normalize(card.rank);
      const match = state.roster.some(model => {
        const names = [model.name, model.alias].map(normalize).filter(Boolean);
        return names.includes(requirement) && normalize(model.rank) === rank;
      });
      if (!match) errors.push(`${card.title} requires ${card.subtitle} (${card.rank}) in the crew roster.`);
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
      : card.category === 'general' ? 'General Objective card. Counts toward the normal 20-card deck.'
      : card.category === 'affiliation' ? `${card.affiliation} Objective card. Counts toward the normal 20-card deck.`
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
        if (nt > 20 || ns > 10 || ng > 10) return;
        const nkey = `${nt}|${ng}|${ns}`;
        if (!next.has(nkey)) next.set(nkey, [...ids, card.id]);
      });
      dp = next;
    });
    const choices = [...dp.entries()]
      .map(([key,ids]) => ({ values:key.split('|').map(Number), ids }))
      .filter(item => item.values[0] === 20 && item.values[1] <= 10 && item.values[2] <= 10)
      .sort((a,b) => Math.abs(10-a.values[1]) - Math.abs(10-b.values[1]) || a.values[2] - b.values[2]);
    if (!choices.length) {
      alert('No legal example could be generated from the current metadata.');
      return;
    }
    const bonusIds = state.selected.filter(id => getCard(id)?.category === 'character');
    state.selected = [...choices[0].ids, ...bonusIds];
    persist(); renderAll(); toast('Built a legal 20-card example');
  }

  function exportJson() {
    const selected = state.selected.map(getCard).filter(Boolean);
    const payload = {
      application: 'Batman Objective Deck Builder', version: 3, exportedAt: new Date().toISOString(),
      affiliation: state.affiliation, roster: state.roster, selectedCardIds: state.selected,
      deck: selected.map(card => ({ id:card.id, title:card.title, category:card.category, affiliation:card.affiliation, copies:card.requiredCopies, subtitle:card.subtitle, rank:card.rank })),
      metadataOverrides: state.overrides,
      validation: validateDeck(selected)
    };
    download(`${slug(state.affiliation || 'batman')}-objective-deck.json`, JSON.stringify(payload,null,2), 'application/json');
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

  async function importJson(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const ids = Array.isArray(payload.selectedCardIds) ? payload.selectedCardIds : Array.isArray(payload.deck) ? payload.deck.map(item => item.id) : [];
      state.selected = [...new Set(ids)].filter(id => rawCards.some(card => card.id === id));
      if (affiliations.includes(payload.affiliation)) state.affiliation = payload.affiliation;
      if (Array.isArray(payload.roster)) state.roster = payload.roster;
      if (payload.metadataOverrides && typeof payload.metadataOverrides === 'object') state.overrides = { ...state.overrides, ...payload.metadataOverrides };
      elements.affiliation.value = state.affiliation;
      persist(); renderAll(); toast(`Imported ${state.selected.length} card designs`);
    } catch (error) {
      alert(`Could not import this deck file: ${error.message}`);
    }
  }



  function updatePlayLaunchButton(validation = validateDeck(state.selected.map(getCard).filter(Boolean))) {
    if (!elements.startPlay) return;
    const active = Boolean(state.play?.active);
    elements.startPlay.textContent = active ? 'Resume play screen' : 'Start play screen';
    elements.startPlay.disabled = !active && state.selected.length === 0;
    if (!active) {
      elements.startPlay.title = validation.valid ? 'Shuffle this deck and draw the opening hand' : 'The deck must be legal before play mode can start';
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
    const validation = validateDeck(selected);
    if (!validation.valid) {
      alert(`The Objective deck must be legal before play mode can start:\n\n${validation.errors.join('\n')}`);
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

    const topDiscard = play.discardPile.at(-1);
    if (!topDiscard) {
      elements.playDiscardPreview.className = 'discard-preview empty-note';
      elements.playDiscardPreview.textContent = 'No discarded cards.';
    } else {
      const card = getCard(topDiscard.cardId);
      elements.playDiscardPreview.className = 'discard-preview has-card';
      elements.playDiscardPreview.innerHTML = card
        ? `<img src="${escapeHtml(card.thumbnail || card.image)}" alt=""><div><strong>${escapeHtml(card.title)}</strong><span>Top of discard pile</span></div>`
        : '<span>Unknown discarded card</span>';
    }

    const log = [...play.actionLog].reverse();
    elements.playLog.innerHTML = log.length ? log.map(item => `<li>${escapeHtml(item.text)}</li>`).join('') : '<li>No actions yet.</li>';
    updatePlayLaunchButton();
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


  function navigateTo(view, entryId = '') {
    const target = view === 'reference' ? `#reference${entryId ? `/${entryId}` : ''}` : '#builder';
    if (location.hash === target) applyRoute();
    else location.hash = target;
  }

  function applyRoute() {
    const route = decodeURIComponent((location.hash || '#builder').replace(/^#/, ''));
    const [page, entryId] = route.split('/');
    const showReference = page === 'reference';
    elements.builderView.hidden = showReference;
    elements.referenceView.hidden = !showReference;
    elements.builderNav.classList.toggle('active', !showReference);
    elements.referenceNav.classList.toggle('active', showReference);
    elements.builderNav.setAttribute('aria-current', showReference ? 'false' : 'page');
    elements.referenceNav.setAttribute('aria-current', showReference ? 'page' : 'false');
    document.title = showReference ? 'BMG Compendium Reference' : 'Batman Objective Deck Builder';
    hideRuleTooltip();
    if (showReference) {
      renderReference();
      if (entryId) requestAnimationFrame(() => focusReferenceEntry(entryId));
    }
  }

  function openReferenceEntry(id) {
    [elements.cardDialog, elements.metadataDialog, elements.rulesDialog, elements.playDialog].forEach(dialog => {
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
