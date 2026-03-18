/* ════════════════════════════════════════════════════════════════
   CULTE — Dialogue de Recherche Multicritères IA
   Interface conversationnelle pour affiner progressivement
   une recherche par type, région, milieu, etc.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const SearchDialog = (() => {

  /* ── État du dialogue ──────────────────────────────────────── */
  let _overlay = null;
  let _state = null;   // conversation state

  function _freshState() {
    return {
      criteria: {
        types: [],        // ex: ['Musée', 'Galerie']
        regions: [],      // ex: ['DAKAR', 'THIES']
        milieu: '',       // 'URBAIN' | 'RURAL' | ''
        branches: [],     // formation branches
        freeText: '',     // texte libre additionnel
        wantFormations: false,
        wantInfra: true,
      },
      step: 'init',       // init | type | region | milieu | refine | done
      messages: [],        // [{role:'bot'|'user'|'chips', content, options?}]
      results: null,       // derniers résultats de recherche
      resultCount: 0,
    };
  }

  /* ── Types / Régions / Milieux disponibles ─────────────────── */
  const ALL_TYPES = [
    { key: 'Musée',                icon: '🏺', label: 'Musées' },
    { key: 'Galerie',             icon: '🖼', label: 'Galeries' },
    { key: 'Cinéma',              icon: '🎬', label: 'Cinémas' },
    { key: 'Bibliothèque',        icon: '📚', label: 'Bibliothèques' },
    { key: 'Salle de spectacle',  icon: '🎪', label: 'Salles de spectacle' },
    { key: 'Salle des fêtes',     icon: '🎉', label: 'Salles des fêtes' },
    { key: 'Centre culturel',     icon: '🏛', label: 'Centres culturels' },
    { key: 'Maison de la culture',icon: '🏠', label: 'Maisons de la culture' },
    { key: 'Foyer des jeunes',    icon: '🎭', label: 'Foyers des jeunes' },
    { key: 'Foyer des femmes',    icon: '👩', label: 'Foyers des femmes' },
    { key: 'Village artisanal',   icon: '🧶', label: 'Villages artisanaux' },
  ];

  const ALL_FORMATIONS = [
    { key: 'ARTS',         icon: '🎨', label: 'Arts' },
    { key: 'AUDIOVISUEL',  icon: '🎬', label: 'Audiovisuel' },
    { key: 'MUSIQUE',      icon: '🎵', label: 'Musique' },
    { key: 'THEATRE',      icon: '🎭', label: 'Théâtre' },
    { key: 'PEINTURE',     icon: '🖌', label: 'Peinture' },
    { key: 'INFOGRAPHIE',  icon: '💻', label: 'Infographie' },
    { key: 'SERIGRAPHIE',  icon: '🖨', label: 'Sérigraphie' },
  ];

  const ALL_REGIONS = [
    { key: 'DAKAR',         icon: '🌊', label: 'Dakar' },
    { key: 'SAINT LOUIS',   icon: '🌹', label: 'Saint-Louis' },
    { key: 'THIES',         icon: '🏗', label: 'Thiès' },
    { key: 'DIOURBEL',      icon: '🕌', label: 'Diourbel' },
    { key: 'FATICK',        icon: '🐠', label: 'Fatick' },
    { key: 'KAOLACK',       icon: '🌾', label: 'Kaolack' },
    { key: 'KAFFRINE',      icon: '🌿', label: 'Kaffrine' },
    { key: 'ZIGUINCHOR',    icon: '🌴', label: 'Ziguinchor' },
    { key: 'KOLDA',         icon: '🦅', label: 'Kolda' },
    { key: 'SEDHIOU',       icon: '🦋', label: 'Sédhiou' },
    { key: 'TAMBACOUNDA',   icon: '🦁', label: 'Tambacounda' },
    { key: 'KEDOUGOU',      icon: '⛰', label: 'Kédougou' },
    { key: 'LOUGA',         icon: '🏜', label: 'Louga' },
    { key: 'MATAM',         icon: '🌵', label: 'Matam' },
  ];

  const MILIEU_OPTIONS = [
    { key: 'URBAIN', icon: '🏙', label: 'Urbain' },
    { key: 'RURAL',  icon: '🌾', label: 'Rural' },
    { key: '',       icon: '🌍', label: 'Tous les milieux' },
  ];

  /* ── Création de l'overlay ─────────────────────────────────── */
  function _createOverlay() {
    if (_overlay) return _overlay;

    const div = document.createElement('div');
    div.id = 'searchDialog';
    div.className = 'sdlg-overlay';
    div.innerHTML = `
      <div class="sdlg-backdrop"></div>
      <div class="sdlg-container">
        <div class="sdlg-header">
          <div class="sdlg-header-left">
            <span class="sdlg-bot-avatar">🤖</span>
            <span class="sdlg-header-title">Recherche Assistée</span>
          </div>
          <button class="sdlg-close" id="sdlgClose" aria-label="Fermer">✕</button>
        </div>
        <div class="sdlg-messages" id="sdlgMessages"></div>
        <div class="sdlg-criteria-bar" id="sdlgCriteria"></div>
        <div class="sdlg-input-area">
          <input type="text" id="sdlgInput" class="sdlg-input" placeholder="Ou tapez votre recherche..." autocomplete="off">
          <button class="sdlg-send" id="sdlgSend" aria-label="Envoyer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    // Events
    div.querySelector('.sdlg-backdrop').addEventListener('click', close);
    div.querySelector('#sdlgClose').addEventListener('click', close);
    div.querySelector('#sdlgSend').addEventListener('click', _onSendInput);
    div.querySelector('#sdlgInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') _onSendInput();
    });

    _overlay = div;
    return div;
  }

  /* ── Ouvrir le dialogue ────────────────────────────────────── */
  function open(initialQuery) {
    const overlay = _createOverlay();
    _state = _freshState();

    // Si on a une requête initiale, la pré-analyser
    if (initialQuery && initialQuery.trim()) {
      _state.criteria.freeText = initialQuery.trim();
      _prefillFromQuery(initialQuery.trim());
    }

    overlay.classList.add('active');
    _renderMessages();
    _startConversation();

    // Focus sur l'input après animation
    setTimeout(() => {
      document.getElementById('sdlgInput')?.focus();
    }, 350);
  }

  /* ── Pré-remplir les critères à partir d'une requête NLP ──── */
  function _prefillFromQuery(query) {
    if (typeof SearchEngine === 'undefined' || !SearchEngine.ready) return;
    const intent = SearchEngine.parseIntent(query);
    if (intent.types.length) _state.criteria.types = [...intent.types];
    if (intent.regions.length) _state.criteria.regions = [...intent.regions];
    if (intent.milieu) _state.criteria.milieu = intent.milieu;
    if (intent.branches.length) {
      _state.criteria.branches = [...intent.branches];
      _state.criteria.wantFormations = true;
    }
    if (intent.wantFormations) _state.criteria.wantFormations = true;
    if (!intent.wantInfra) _state.criteria.wantInfra = false;
  }

  /* ── Démarrer la conversation ──────────────────────────────── */
  function _startConversation() {
    const c = _state.criteria;

    // Si on a déjà des critères pré-remplis, montrer le résumé d'abord
    if (c.types.length || c.regions.length || c.branches.length) {
      _addBotMessage(_buildSummaryText());
      _runPreview();

      // Déterminer l'étape suivante (ce qui manque)
      if (!c.types.length && !c.branches.length) {
        _state.step = 'type';
        setTimeout(() => _askType(), 600);
      } else if (!c.regions.length) {
        _state.step = 'region';
        setTimeout(() => _askRegion(), 600);
      } else if (!c.milieu) {
        _state.step = 'milieu';
        setTimeout(() => _askMilieu(), 600);
      } else {
        _state.step = 'refine';
        setTimeout(() => _askRefine(), 600);
      }
    } else {
      // Pas de critères — demander le type d'infrastructure
      _addBotMessage('Bonjour ! 👋 Je vais vous aider à trouver exactement ce que vous cherchez. Commençons !');
      _state.step = 'type';
      setTimeout(() => _askType(), 700);
    }
  }

  /* ── Questions du dialogue ─────────────────────────────────── */
  function _askType() {
    _addBotMessage('Quel type de lieu culturel recherchez-vous ?');

    // Chips d'infrastructure
    const infraOptions = ALL_TYPES.map(t => ({
      label: `${t.icon} ${t.label}`,
      value: t.key,
      group: 'type',
    }));

    // Option formations
    const formOption = {
      label: '🎓 Formations',
      value: '__formations__',
      group: 'type',
    };

    // Option "tous"
    const allOption = {
      label: '🌍 Tout voir',
      value: '__all__',
      group: 'type',
    };

    _addChipsMessage([...infraOptions, formOption, allOption], true);
  }

  function _askFormationBranch() {
    _addBotMessage('Quelle branche de formation vous intéresse ?');
    const options = ALL_FORMATIONS.map(f => ({
      label: `${f.icon} ${f.label}`,
      value: f.key,
      group: 'branch',
    }));
    options.push({ label: '🌍 Toutes les branches', value: '__all__', group: 'branch' });
    _addChipsMessage(options, false);
  }

  function _askRegion() {
    // Filtrer les régions qui ont des résultats
    const availableRegions = _getRegionsWithResults();
    _addBotMessage(`Dans quelle région ? ${availableRegions.length < 14 ? `(${availableRegions.length} régions ont des résultats)` : ''}`);

    const options = ALL_REGIONS
      .filter(r => availableRegions.length === 0 || availableRegions.includes(r.key))
      .map(r => {
        const count = _countForRegion(r.key);
        return {
          label: `${r.icon} ${r.label}${count ? ` (${count})` : ''}`,
          value: r.key,
          group: 'region',
        };
      });
    options.push({ label: '🌍 Toutes les régions', value: '__all__', group: 'region' });
    _addChipsMessage(options, true);
  }

  function _askMilieu() {
    _addBotMessage('En zone urbaine ou rurale ?');
    const options = MILIEU_OPTIONS.map(m => ({
      label: `${m.icon} ${m.label}`,
      value: m.key,
      group: 'milieu',
    }));
    _addChipsMessage(options, false);
  }

  function _askRefine() {
    const count = _state.resultCount;
    _addBotMessage(
      `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}. Que souhaitez-vous faire ?`
    );

    const options = [
      { label: '✅ Voir les résultats', value: '__show__', group: 'action' },
      { label: '🔄 Modifier les critères', value: '__reset__', group: 'action' },
      { label: '📍 Changer la région', value: '__region__', group: 'action' },
      { label: '🏛 Changer le type', value: '__type__', group: 'action' },
    ];
    if (!_state.criteria.milieu) {
      options.splice(2, 0, { label: '🌍 Filtrer par milieu', value: '__milieu__', group: 'action' });
    }
    _addChipsMessage(options, false);
  }

  /* ── Gestion des choix ─────────────────────────────────────── */
  function _handleChipClick(value, group) {
    switch (group) {
      case 'type':
        _handleTypeChoice(value);
        break;
      case 'branch':
        _handleBranchChoice(value);
        break;
      case 'region':
        _handleRegionChoice(value);
        break;
      case 'milieu':
        _handleMilieuChoice(value);
        break;
      case 'action':
        _handleActionChoice(value);
        break;
      case 'addtype':
        _handleAddType(value);
        break;
    }
  }

  function _handleTypeChoice(value) {
    if (value === '__formations__') {
      _state.criteria.wantFormations = true;
      _state.criteria.wantInfra = false;
      _addUserMessage('🎓 Formations');
      _askFormationBranch();
      return;
    }
    if (value === '__all__') {
      _state.criteria.types = [];
      _state.criteria.wantInfra = true;
      _state.criteria.wantFormations = true;
      _addUserMessage('🌍 Tout voir');
    } else {
      _state.criteria.types = [value];
      _state.criteria.wantInfra = true;
      const t = ALL_TYPES.find(x => x.key === value);
      _addUserMessage(`${t ? t.icon : '🏛'} ${value}`);
    }
    _runPreview();
    _state.step = 'region';
    setTimeout(() => _askRegion(), 500);
  }

  function _handleBranchChoice(value) {
    if (value === '__all__') {
      _state.criteria.branches = [];
      _addUserMessage('🌍 Toutes les branches');
    } else {
      _state.criteria.branches = [value];
      const f = ALL_FORMATIONS.find(x => x.key === value);
      _addUserMessage(`${f ? f.icon : '🎓'} ${value}`);
    }
    _runPreview();
    _state.step = 'region';
    setTimeout(() => _askRegion(), 500);
  }

  function _handleRegionChoice(value) {
    if (value === '__all__') {
      _state.criteria.regions = [];
      _addUserMessage('🌍 Toutes les régions');
    } else {
      // Multi-sélection : ajouter à la liste
      if (!_state.criteria.regions.includes(value)) {
        _state.criteria.regions.push(value);
      }
      const r = ALL_REGIONS.find(x => x.key === value);
      _addUserMessage(`${r ? r.icon : '📍'} ${r ? r.label : value}`);
    }
    _runPreview();

    // Proposer d'ajouter une autre région
    if (value !== '__all__' && _state.criteria.regions.length < 3) {
      _addBotMessage(`Souhaitez-vous ajouter une autre région ?`);
      const options = [
        { label: '➕ Ajouter une région', value: '__addregion__', group: 'action' },
        { label: '➡️ Continuer', value: '__continue__', group: 'action' },
      ];
      _addChipsMessage(options, false);
    } else {
      _state.step = 'milieu';
      setTimeout(() => _askMilieu(), 500);
    }
  }

  function _handleMilieuChoice(value) {
    _state.criteria.milieu = value;
    const m = MILIEU_OPTIONS.find(x => x.key === value);
    _addUserMessage(`${m ? m.icon : '🌍'} ${m ? m.label : 'Tous'}`);
    _runPreview();
    _state.step = 'refine';
    setTimeout(() => _askRefine(), 500);
  }

  function _handleActionChoice(value) {
    switch (value) {
      case '__show__':
        _addUserMessage('✅ Voir les résultats');
        _applyAndClose();
        break;
      case '__reset__':
        _addUserMessage('🔄 Reprendre');
        _state.criteria = _freshState().criteria;
        _state.step = 'type';
        _updateCriteriaBar();
        setTimeout(() => _askType(), 400);
        break;
      case '__region__':
        _addUserMessage('📍 Changer la région');
        _state.criteria.regions = [];
        _state.step = 'region';
        setTimeout(() => _askRegion(), 400);
        break;
      case '__type__':
        _addUserMessage('🏛 Changer le type');
        _state.criteria.types = [];
        _state.criteria.branches = [];
        _state.step = 'type';
        setTimeout(() => _askType(), 400);
        break;
      case '__milieu__':
        _addUserMessage('🌍 Filtrer par milieu');
        _state.step = 'milieu';
        setTimeout(() => _askMilieu(), 400);
        break;
      case '__addregion__':
        _state.step = 'region';
        setTimeout(() => _askRegion(), 300);
        break;
      case '__continue__':
        _addUserMessage('➡️ Continuer');
        _state.step = 'milieu';
        setTimeout(() => _askMilieu(), 400);
        break;
      case '__addtype__':
        _askAddType();
        break;
    }
  }

  function _askAddType() {
    _addBotMessage('Quel autre type ajouter ?');
    const options = ALL_TYPES
      .filter(t => !_state.criteria.types.includes(t.key))
      .map(t => ({
        label: `${t.icon} ${t.label}`,
        value: t.key,
        group: 'addtype',
      }));
    _addChipsMessage(options, true);
  }

  function _handleAddType(value) {
    if (!_state.criteria.types.includes(value)) {
      _state.criteria.types.push(value);
    }
    const t = ALL_TYPES.find(x => x.key === value);
    _addUserMessage(`➕ ${t ? t.icon : '🏛'} ${value}`);
    _runPreview();
    _state.step = 'refine';
    setTimeout(() => _askRefine(), 500);
  }

  /* ── Input texte libre ─────────────────────────────────────── */
  function _onSendInput() {
    const input = document.getElementById('sdlgInput');
    const val = (input?.value || '').trim();
    if (!val) return;
    input.value = '';
    _addUserMessage(val);

    // Analyser via NLP
    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      const intent = SearchEngine.parseIntent(val);

      // Enrichir les critères avec ce qui est détecté
      if (intent.types.length) {
        _state.criteria.types = [...new Set([..._state.criteria.types, ...intent.types])];
      }
      if (intent.regions.length) {
        _state.criteria.regions = [...new Set([..._state.criteria.regions, ...intent.regions])];
      }
      if (intent.milieu) _state.criteria.milieu = intent.milieu;
      if (intent.branches.length) {
        _state.criteria.branches = [...new Set([..._state.criteria.branches, ...intent.branches])];
        _state.criteria.wantFormations = true;
      }
      if (intent.wantFormations) _state.criteria.wantFormations = true;
      if (intent.freeTokens.length) {
        _state.criteria.freeText = intent.freeTokens.join(' ');
      }
    } else {
      _state.criteria.freeText = val;
    }

    _runPreview();

    // Déterminer la prochaine étape intelligemment
    const c = _state.criteria;
    if (!c.types.length && !c.branches.length && !c.wantFormations) {
      _state.step = 'type';
      setTimeout(() => _askType(), 500);
    } else if (!c.regions.length) {
      _state.step = 'region';
      setTimeout(() => _askRegion(), 500);
    } else if (!c.milieu) {
      _state.step = 'milieu';
      setTimeout(() => _askMilieu(), 500);
    } else {
      _state.step = 'refine';
      setTimeout(() => _askRefine(), 500);
    }
  }

  /* ── Recherche prévisualisation ────────────────────────────── */
  function _runPreview() {
    const query = _buildSearchQuery();
    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      const result = SearchEngine.search(query, { limit: 200 });
      // Filtrer selon les critères stricts
      let filtered = result.results;
      const c = _state.criteria;

      if (c.types.length) {
        filtered = filtered.filter(r => {
          if (r.doc.isFormation) return false;
          return c.types.some(t =>
            r.doc._typeNorm === _norm(t) || r.doc._typeNorm.includes(_norm(t))
          );
        });
      }
      if (c.branches.length) {
        filtered = filtered.filter(r => {
          if (!r.doc.isFormation) return false;
          return c.branches.some(b =>
            r.doc._typeNorm === _norm(b) || r.doc._typeNorm.includes(_norm(b))
          );
        });
      }
      if (c.regions.length) {
        filtered = filtered.filter(r =>
          c.regions.includes(r.doc.fields.region.toUpperCase())
        );
      }
      if (c.milieu) {
        filtered = filtered.filter(r =>
          r.doc._milieuNorm === _norm(c.milieu)
        );
      }
      if (!c.wantFormations && c.wantInfra) {
        filtered = filtered.filter(r => !r.doc.isFormation);
      }
      if (c.wantFormations && !c.wantInfra) {
        filtered = filtered.filter(r => r.doc.isFormation);
      }

      _state.results = filtered;
      _state.resultCount = filtered.length;
    } else {
      _state.resultCount = 0;
    }
    _updateCriteriaBar();
  }

  function _buildSearchQuery() {
    const c = _state.criteria;
    const parts = [];
    if (c.types.length) parts.push(c.types.join(' '));
    if (c.branches.length) parts.push('formation ' + c.branches.join(' '));
    if (c.regions.length) parts.push(c.regions.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(' '));
    if (c.milieu) parts.push(c.milieu.toLowerCase());
    if (c.freeText) parts.push(c.freeText);
    if (!parts.length) return 'culture';
    return parts.join(' ');
  }

  function _norm(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_]/g, ' ').trim();
  }

  /* ── Compter pour une région ───────────────────────────────── */
  function _countForRegion(regionKey) {
    if (typeof SearchEngine === 'undefined' || !SearchEngine.ready) return 0;
    const c = _state.criteria;
    let count = 0;
    for (const doc of SearchEngine.docs) {
      if (doc.fields.region.toUpperCase() !== regionKey) continue;
      if (c.types.length && !doc.isFormation) {
        if (!c.types.some(t => doc._typeNorm === _norm(t) || doc._typeNorm.includes(_norm(t)))) continue;
      }
      if (c.wantFormations && !c.wantInfra && !doc.isFormation) continue;
      if (!c.wantFormations && c.wantInfra && doc.isFormation) continue;
      if (c.milieu && doc._milieuNorm !== _norm(c.milieu)) continue;
      count++;
    }
    return count;
  }

  function _getRegionsWithResults() {
    return ALL_REGIONS
      .filter(r => _countForRegion(r.key) > 0)
      .map(r => r.key);
  }

  /* ── Messages ──────────────────────────────────────────────── */
  function _addBotMessage(text) {
    _state.messages.push({ role: 'bot', content: text });
    _renderMessages();
  }

  function _addUserMessage(text) {
    _state.messages.push({ role: 'user', content: text });
    _renderMessages();
  }

  function _addChipsMessage(options, scrollable) {
    _state.messages.push({ role: 'chips', options, scrollable });
    _renderMessages();
  }

  function _buildSummaryText() {
    const c = _state.criteria;
    const parts = [];
    if (c.types.length) parts.push(`**Type** : ${c.types.join(', ')}`);
    if (c.branches.length) parts.push(`**Formation** : ${c.branches.join(', ')}`);
    if (c.regions.length) parts.push(`**Région** : ${c.regions.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(', ')}`);
    if (c.milieu) parts.push(`**Milieu** : ${c.milieu.toLowerCase()}`);
    if (c.freeText) parts.push(`**Texte** : "${c.freeText}"`);
    if (!parts.length) return 'Aucun critère défini pour le moment.';
    return `Critères actuels :\n${parts.join(' · ')}`;
  }

  /* ── Rendu ─────────────────────────────────────────────────── */
  function _renderMessages() {
    const container = document.getElementById('sdlgMessages');
    if (!container) return;

    container.innerHTML = _state.messages.map((msg, idx) => {
      if (msg.role === 'bot') {
        // Convertir **bold** en <strong>
        const html = _esc(msg.content).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        return `<div class="sdlg-msg sdlg-bot"><span class="sdlg-msg-avatar">🤖</span><div class="sdlg-msg-bubble sdlg-bot-bubble">${html}</div></div>`;
      }
      if (msg.role === 'user') {
        return `<div class="sdlg-msg sdlg-user"><div class="sdlg-msg-bubble sdlg-user-bubble">${_esc(msg.content)}</div></div>`;
      }
      if (msg.role === 'chips') {
        const cls = msg.scrollable ? 'sdlg-chips sdlg-chips-scroll' : 'sdlg-chips';
        return `<div class="${cls}">${msg.options.map((opt, ci) =>
          `<button class="sdlg-chip" data-idx="${idx}" data-ci="${ci}" data-value="${_esc(opt.value)}" data-group="${opt.group}">${opt.label}</button>`
        ).join('')}</div>`;
      }
      return '';
    }).join('');

    // Attacher les events aux chips
    container.querySelectorAll('.sdlg-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const value = chip.dataset.value;
        const group = chip.dataset.group;
        // Désactiver tous les chips de ce groupe
        const parent = chip.closest('.sdlg-chips');
        if (parent) {
          parent.querySelectorAll('.sdlg-chip').forEach(c => c.disabled = true);
          chip.classList.add('sdlg-chip-selected');
        }
        _handleChipClick(value, group);
      });
    });

    // Scroll en bas
    container.scrollTop = container.scrollHeight;
  }

  function _updateCriteriaBar() {
    const bar = document.getElementById('sdlgCriteria');
    if (!bar) return;

    const c = _state.criteria;
    const chips = [];

    c.types.forEach(t => {
      const conf = ALL_TYPES.find(x => x.key === t);
      chips.push(`<span class="sdlg-crit-chip sdlg-crit-type">${conf ? conf.icon : '🏛'} ${t}<button class="sdlg-crit-x" data-crit="type" data-val="${_esc(t)}">×</button></span>`);
    });
    c.branches.forEach(b => {
      chips.push(`<span class="sdlg-crit-chip sdlg-crit-branch">🎓 ${b}<button class="sdlg-crit-x" data-crit="branch" data-val="${_esc(b)}">×</button></span>`);
    });
    c.regions.forEach(r => {
      const conf = ALL_REGIONS.find(x => x.key === r);
      chips.push(`<span class="sdlg-crit-chip sdlg-crit-region">${conf ? conf.icon : '📍'} ${conf ? conf.label : r}<button class="sdlg-crit-x" data-crit="region" data-val="${_esc(r)}">×</button></span>`);
    });
    if (c.milieu) {
      const conf = MILIEU_OPTIONS.find(x => x.key === c.milieu);
      chips.push(`<span class="sdlg-crit-chip sdlg-crit-milieu">${conf ? conf.icon : '🌍'} ${conf ? conf.label : c.milieu}<button class="sdlg-crit-x" data-crit="milieu" data-val="">×</button></span>`);
    }

    if (chips.length) {
      const countBadge = `<span class="sdlg-count-badge">${_state.resultCount} résultat${_state.resultCount !== 1 ? 's' : ''}</span>`;
      bar.innerHTML = chips.join('') + countBadge;
      bar.classList.add('active');
    } else {
      bar.innerHTML = '';
      bar.classList.remove('active');
    }

    // Remove buttons
    bar.querySelectorAll('.sdlg-crit-x').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const crit = btn.dataset.crit;
        const val = btn.dataset.val;
        if (crit === 'type') _state.criteria.types = _state.criteria.types.filter(t => t !== val);
        if (crit === 'branch') _state.criteria.branches = _state.criteria.branches.filter(b => b !== val);
        if (crit === 'region') _state.criteria.regions = _state.criteria.regions.filter(r => r !== val);
        if (crit === 'milieu') _state.criteria.milieu = '';
        _runPreview();
        _addBotMessage(`Critère retiré. ${_state.resultCount} résultat${_state.resultCount !== 1 ? 's' : ''} maintenant.`);
      });
    });
  }

  function _esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Appliquer les résultats et fermer ─────────────────────── */
  function _applyAndClose() {
    const query = _buildSearchQuery();

    // Basculer vers la liste avec les critères
    if (typeof switchTab === 'function') switchTab('list');

    // Appliquer via NLP
    if (typeof NLP !== 'undefined' && NLP.applyToListTab) {
      NLP.applyToListTab(query);
    }

    // Aussi mettre à jour la carte si on est en mode explore
    if (typeof runNlpSearch === 'function') {
      runNlpSearch(query);
    }

    // Sauvegarder l'historique
    if (typeof NLP !== 'undefined' && NLP.saveHistory) {
      NLP.saveHistory(query);
    }

    // Mettre à jour les inputs
    const hs = document.getElementById('homeSearch');
    if (hs) hs.value = query;
    const ls = document.getElementById('listSearch');
    if (ls) ls.value = query;

    close();
  }

  /* ── Fermer ────────────────────────────────────────────────── */
  function close() {
    if (_overlay) {
      _overlay.classList.remove('active');
    }
  }

  /* ── API publique ──────────────────────────────────────────── */
  return {
    open,
    close,
    get isOpen() { return _overlay?.classList.contains('active') || false; },
  };

})();
