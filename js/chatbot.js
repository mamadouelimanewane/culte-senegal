/* ════════════════════════════════════════════════════════════════
   CULTE — Chatbot Conversationnel IA
   Assistant culturel qui guide l'utilisateur étape par étape
   ════════════════════════════════════════════════════════════════ */
'use strict';

const Chatbot = (() => {

  /* ── État ──────────────────────────────────────────────────── */
  let _messages = [];
  let _isOpen = false;
  let _panelEl = null;
  let _state = 'idle'; // idle, asking_type, asking_region, asking_milieu, asking_refine, showing_results
  let _context = { types: [], regions: [], milieu: '', query: '', results: [] };
  let _typingTimer = null;

  /* ── Scénarios de conversation ────────────────────────────── */
  const GREETINGS = [
    "Salam ! Je suis votre assistant culturel. Comment puis-je vous aider ?",
    "Bonjour ! Que souhaitez-vous découvrir au Sénégal ?",
    "Bienvenue ! Musées, festivals, formations... Que cherchez-vous ?",
    "Nanga def ! Prêt à explorer la culture sénégalaise ?",
  ];

  const TYPE_OPTIONS = [
    { label: '🏺 Musées', value: 'Musée' },
    { label: '🖼 Galeries', value: 'Galerie' },
    { label: '🎬 Cinémas', value: 'Cinéma' },
    { label: '📚 Bibliothèques', value: 'Bibliothèque' },
    { label: '🎪 Spectacles', value: 'Salle de spectacle' },
    { label: '🏛 Centres culturels', value: 'Centre culturel' },
    { label: '🎭 Foyers des jeunes', value: 'Foyer des jeunes' },
    { label: '👩 Foyers des femmes', value: 'Foyer des femmes' },
    { label: '🎓 Formations', value: 'formation' },
    { label: '📅 Événements', value: 'evenement' },
  ];

  const REGION_OPTIONS = [
    { label: '🌊 Dakar', value: 'DAKAR' },
    { label: '🌹 Saint-Louis', value: 'SAINT LOUIS' },
    { label: '🏗 Thiès', value: 'THIES' },
    { label: '🌴 Ziguinchor', value: 'ZIGUINCHOR' },
    { label: '🕌 Diourbel', value: 'DIOURBEL' },
    { label: '🌾 Kaolack', value: 'KAOLACK' },
    { label: '🦁 Tambacounda', value: 'TAMBACOUNDA' },
    { label: '⛰ Kédougou', value: 'KEDOUGOU' },
    { label: '🏜 Louga', value: 'LOUGA' },
    { label: '🐠 Fatick', value: 'FATICK' },
    { label: '🌵 Matam', value: 'MATAM' },
    { label: '🌿 Kaffrine', value: 'KAFFRINE' },
    { label: '🦅 Kolda', value: 'KOLDA' },
    { label: '🦋 Sédhiou', value: 'SEDHIOU' },
    { label: '📍 Tout le Sénégal', value: '' },
  ];

  const MILIEU_OPTIONS = [
    { label: '🏙 Urbain', value: 'URBAIN' },
    { label: '🌾 Rural', value: 'RURAL' },
    { label: '📍 Peu importe', value: '' },
  ];

  const MOOD_PROMPTS = [
    { label: '🎨 Découvrir l\'art', query: 'galerie musée exposition' },
    { label: '🎵 Écouter de la musique', query: 'musique concert spectacle' },
    { label: '📖 Apprendre', query: 'formation école cours' },
    { label: '🎭 Voir un spectacle', query: 'spectacle théâtre cinéma' },
    { label: '🏛 Patrimoine', query: 'patrimoine monument histoire culture' },
    { label: '🧶 Artisanat', query: 'artisanat village artisanal' },
  ];

  /* ── Utilitaires ──────────────────────────────────────────── */
  function _esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function _random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function _addMessage(role, content, options) {
    const msg = { role, content, time: new Date(), options: options || null };
    _messages.push(msg);
    _renderMessages();
    return msg;
  }

  function _addBotTyping() {
    const el = _panelEl?.querySelector('.cb-messages');
    if (!el) return;
    const typing = document.createElement('div');
    typing.className = 'cb-msg cb-bot cb-typing';
    typing.innerHTML = '<div class="cb-dots"><span></span><span></span><span></span></div>';
    el.appendChild(typing);
    el.scrollTop = el.scrollHeight;
    return typing;
  }

  function _botSay(text, options, delay) {
    delay = delay || 600;
    const typing = _addBotTyping();
    _typingTimer = setTimeout(() => {
      if (typing) typing.remove();
      _addMessage('bot', text, options);
    }, delay);
  }

  /* ── Logique de conversation ──────────────────────────────── */
  function _processUserInput(text) {
    _addMessage('user', text);

    const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Détection d'intention directe
    if (lower.match(/(?:bonjour|salut|hello|salam|nanga def|hey)/)) {
      _state = 'idle';
      _botSay(_random(GREETINGS), _buildQuickActions());
      return;
    }

    if (lower.match(/(?:merci|jërëjëf|thanks)/)) {
      _botSay("Avec plaisir ! N'hésitez pas si vous avez d'autres questions. 😊");
      return;
    }

    if (lower.match(/(?:aide|help|comment)/)) {
      _botSay("Je peux vous aider à :\n• Trouver des lieux culturels\n• Explorer par région\n• Découvrir des formations\n• Trouver des événements\n\nDites-moi ce qui vous intéresse !");
      return;
    }

    // Si on est dans un flow
    switch (_state) {
      case 'asking_type':
        _handleTypeChoice(text);
        return;
      case 'asking_region':
        _handleRegionChoice(text);
        return;
      case 'asking_milieu':
        _handleMilieuChoice(text);
        return;
      case 'asking_refine':
        _handleRefine(text);
        return;
    }

    // Recherche directe via le moteur NLP
    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      const result = SearchEngine.search(text, { limit: 10 });
      if (result.results.length > 0) {
        _context.results = result.results;
        _context.query = text;
        _showResults(result.results, text);
        return;
      }
    }

    // Rien trouvé → guider l'utilisateur
    _state = 'asking_type';
    _botSay("Je n'ai pas trouvé de résultat direct. Laissez-moi vous guider ! Quel type de lieu cherchez-vous ?", {
      type: 'chips',
      items: TYPE_OPTIONS.slice(0, 6)
    });
  }

  function _handleTypeChoice(text) {
    const lower = text.toLowerCase();
    const match = TYPE_OPTIONS.find(t => lower.includes(t.value.toLowerCase()) || lower.includes(t.label.toLowerCase().replace(/[^\w\s]/g, '').trim()));

    if (match) {
      _context.types = [match.value];
      _state = 'asking_region';
      _botSay(`${match.label} — bon choix ! Dans quelle région ?`, {
        type: 'chips',
        items: REGION_OPTIONS.slice(0, 8)
      });
    } else {
      // Tenter une recherche libre
      _context.query = text;
      _state = 'asking_region';
      _botSay(`D'accord, je cherche "${text}". Dans quelle région ?`, {
        type: 'chips',
        items: REGION_OPTIONS.slice(0, 8)
      });
    }
  }

  function _handleRegionChoice(text) {
    const lower = text.toLowerCase();
    const match = REGION_OPTIONS.find(r =>
      lower.includes(r.value.toLowerCase()) ||
      lower.includes(r.label.toLowerCase().replace(/[^\w\s]/g, '').trim())
    );

    if (match) {
      _context.regions = match.value ? [match.value] : [];
    }

    _state = 'asking_milieu';
    _botSay("Préférence de milieu ?", {
      type: 'chips',
      items: MILIEU_OPTIONS
    });
  }

  function _handleMilieuChoice(text) {
    const lower = text.toLowerCase();
    if (lower.includes('urbain') || lower.includes('ville')) _context.milieu = 'URBAIN';
    else if (lower.includes('rural') || lower.includes('campagne')) _context.milieu = 'RURAL';
    else _context.milieu = '';

    // Lancer la recherche
    _executeSearch();
  }

  function _executeSearch() {
    let query = _context.query;
    if (_context.types.length) query = _context.types.join(' ') + ' ' + query;
    if (_context.regions.length) query += ' ' + _context.regions[0];
    if (_context.milieu) query += ' ' + _context.milieu;
    query = query.trim();

    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      const result = SearchEngine.search(query, { limit: 10 });
      _context.results = result.results;
      _showResults(result.results, query);
    } else {
      _botSay("Le moteur de recherche n'est pas encore prêt. Réessayez dans un instant.");
      _state = 'idle';
    }
  }

  function _showResults(results, query) {
    _state = 'showing_results';

    if (results.length === 0) {
      _botSay(`Aucun résultat pour "${query}". Voulez-vous essayer autre chose ?`, _buildQuickActions());
      _state = 'idle';
      return;
    }

    const count = results.length;
    const top5 = results.slice(0, 5);

    let msg = `J'ai trouvé **${count} lieu${count > 1 ? 'x' : ''}** ! Voici les meilleurs :\n\n`;
    top5.forEach((r, i) => {
      const doc = r.doc;
      const name = doc.fields.designation || doc.fields.nom_etablissement || 'Sans nom';
      const region = doc.fields.region || '';
      const type = doc.fields.descriptif || doc.fields.branche || '';
      msg += `${i + 1}. **${name}**\n   📍 ${region}${type ? ' · ' + type : ''}\n\n`;
    });

    if (count > 5) msg += `...et ${count - 5} autres résultats.`;

    _botSay(msg, {
      type: 'actions',
      items: [
        { label: '🗺 Voir sur la carte', action: 'map', query },
        { label: '📋 Voir la liste', action: 'list', query },
        { label: '🔄 Nouvelle recherche', action: 'reset' },
      ]
    }, 800);

    _state = 'asking_refine';
  }

  function _handleRefine(text) {
    const lower = text.toLowerCase();
    if (lower.match(/carte|map/)) {
      _actionShowOnMap(_context.query || _context.results[0]?.doc?.fields?.designation);
      return;
    }
    if (lower.match(/liste|annuaire|list/)) {
      _actionShowInList(_context.query);
      return;
    }
    if (lower.match(/nouveau|autre|reset|recommence/)) {
      _context = { types: [], regions: [], milieu: '', query: '', results: [] };
      _state = 'idle';
      _botSay("D'accord ! Que souhaitez-vous explorer ?", _buildQuickActions());
      return;
    }
    // Sinon, traiter comme nouvelle requête
    _state = 'idle';
    _processUserInput(text);
  }

  /* ── Actions ──────────────────────────────────────────────── */
  function _actionShowOnMap(query) {
    close();
    if (typeof switchTab === 'function') switchTab('explore');
    if (typeof runNlpSearch === 'function') {
      const ms = document.getElementById('mapSearch');
      if (ms) ms.value = query;
      setTimeout(() => runNlpSearch(query), 300);
    }
  }

  function _actionShowInList(query) {
    close();
    if (typeof switchTab === 'function') switchTab('list');
    const ls = document.getElementById('listSearch');
    if (ls) ls.value = query;
    if (typeof NLP !== 'undefined') NLP.applyToListTab(query);
  }

  function _buildQuickActions() {
    return {
      type: 'chips',
      items: MOOD_PROMPTS.slice(0, 4)
    };
  }

  /* ── Rendu du panneau ─────────────────────────────────────── */
  function _createPanel() {
    if (_panelEl) return;
    _panelEl = document.createElement('div');
    _panelEl.id = 'chatbotPanel';
    _panelEl.className = 'cb-panel hidden';
    _panelEl.innerHTML = `
      <div class="cb-container">
        <div class="cb-header">
          <div class="cb-header-left">
            <div class="cb-avatar">🤖</div>
            <div>
              <div class="cb-title">Assistant Culturel</div>
              <div class="cb-subtitle">Scenews IA</div>
            </div>
          </div>
          <button class="cb-close" aria-label="Fermer">✕</button>
        </div>
        <div class="cb-messages"></div>
        <div class="cb-input-wrap">
          <input type="text" class="cb-input" placeholder="Écrivez votre message..." autocomplete="off">
          <button class="cb-send" aria-label="Envoyer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(_panelEl);

    // Handlers
    _panelEl.querySelector('.cb-close').addEventListener('click', close);
    const input = _panelEl.querySelector('.cb-input');
    const sendBtn = _panelEl.querySelector('.cb-send');

    const send = () => {
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      _processUserInput(val);
    };

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }

  function _renderMessages() {
    const el = _panelEl?.querySelector('.cb-messages');
    if (!el) return;

    el.innerHTML = _messages.map(msg => {
      const isBot = msg.role === 'bot';
      let html = `<div class="cb-msg ${isBot ? 'cb-bot' : 'cb-user'}">`;
      if (isBot) html += '<span class="cb-msg-avatar">🤖</span>';

      // Formater le contenu (support **bold** et \n)
      let content = _esc(msg.content)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      html += `<div class="cb-msg-bubble">${content}</div>`;
      html += '</div>';

      // Options (chips ou actions)
      if (msg.options) {
        html += _renderOptions(msg.options);
      }
      return html;
    }).join('');

    el.scrollTop = el.scrollHeight;
  }

  function _renderOptions(options) {
    if (!options || !options.items) return '';

    if (options.type === 'chips') {
      return `<div class="cb-chips">${options.items.map(item =>
        `<button class="cb-chip" data-value="${_esc(item.value || item.query || item.label)}">${item.label}</button>`
      ).join('')}</div>`;
    }

    if (options.type === 'actions') {
      return `<div class="cb-actions">${options.items.map(item =>
        `<button class="cb-action-btn" data-action="${item.action}" data-query="${_esc(item.query || '')}">${item.label}</button>`
      ).join('')}</div>`;
    }

    return '';
  }

  /* ── Délégation d'événements pour les chips/actions ───────── */
  function _setupDelegation() {
    if (!_panelEl) return;
    _panelEl.querySelector('.cb-messages').addEventListener('click', e => {
      const chip = e.target.closest('.cb-chip');
      if (chip) {
        const val = chip.dataset.value;
        if (val) _processUserInput(val);
        return;
      }
      const actionBtn = e.target.closest('.cb-action-btn');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const query = actionBtn.dataset.query;
        if (action === 'map') _actionShowOnMap(query);
        else if (action === 'list') _actionShowInList(query);
        else if (action === 'reset') {
          _context = { types: [], regions: [], milieu: '', query: '', results: [] };
          _state = 'idle';
          _botSay("Que souhaitez-vous explorer ?", _buildQuickActions());
        }
      }
    });
  }

  /* ── Bouton flottant ──────────────────────────────────────── */
  function _createFAB() {
    const fab = document.createElement('button');
    fab.className = 'cb-fab';
    fab.setAttribute('aria-label', 'Ouvrir l\'assistant');
    fab.innerHTML = '💬';
    fab.addEventListener('click', () => _isOpen ? close() : open());
    document.body.appendChild(fab);
  }

  /* ── API publique ─────────────────────────────────────────── */
  function open() {
    _createPanel();
    _panelEl.classList.remove('hidden');
    _isOpen = true;
    document.body.style.overflow = 'hidden';

    if (_messages.length === 0) {
      _setupDelegation();
      _botSay(_random(GREETINGS), _buildQuickActions(), 400);
    }

    setTimeout(() => _panelEl.querySelector('.cb-input')?.focus(), 300);
  }

  function close() {
    if (_panelEl) _panelEl.classList.add('hidden');
    _isOpen = false;
    document.body.style.overflow = '';
    clearTimeout(_typingTimer);
  }

  function init() {
    _createFAB();
  }

  return {
    init,
    open,
    close,
    get isOpen() { return _isOpen; },
    get messageCount() { return _messages.length; },
  };

})();
