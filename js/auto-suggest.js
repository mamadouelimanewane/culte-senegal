/**
 * AutoSuggest — Module de suggestions prédictives intelligentes
 *
 * Analyse l'intention de recherche (NLP) pour proposer des suggestions
 * catégorisées et pertinentes dans une application culturelle sénégalaise.
 *
 * Fonctionne de manière autonome, mais s'intègre avec SearchEngine
 * et ConversationMemory lorsqu'ils sont disponibles.
 *
 * @global AutoSuggest
 */
const AutoSuggest = (() => {
  'use strict';

  /* ── Configuration ───────────────────────────────────────────── */

  /** Délai anti-rebond en millisecondes */
  const DEBOUNCE_MS = 150;

  /** Nombre maximum de suggestions affichées */
  const MAX_SUGGESTIONS = 10;

  /** Nombre maximum de recherches récentes conservées */
  const MAX_RECENT = 5;

  /** Longueur minimale pour déclencher la recherche */
  const MIN_CHARS = 1;

  /** Longueur maximale de la saisie traitée */
  const MAX_INPUT_LENGTH = 200;

  /* ── Suggestions populaires prédéfinies ──────────────────────── */

  const POPULAR = [
    { label: '🏺 Musées du Sénégal',       query: 'musées',             icon: '🏺' },
    { label: '🎬 Cinémas Dakar',            query: 'cinémas Dakar',      icon: '🎬' },
    { label: '🖼 Galeries d\'art',           query: 'galeries',           icon: '🖼' },
    { label: '📚 Bibliothèques',            query: 'bibliothèques',      icon: '📚' },
    { label: '🎓 Formations artistiques',   query: 'formations',         icon: '🎓' },
    { label: '🏛 Centres culturels',        query: 'centres culturels',  icon: '🏛' },
    { label: '🎪 Salles de spectacle',      query: 'salles de spectacle', icon: '🎪' },
    { label: '🌴 Culture Casamance',        query: 'Ziguinchor',         icon: '🌴' },
    { label: '🌹 Patrimoine Saint-Louis',   query: 'Saint-Louis',        icon: '🌹' },
    { label: '🌊 Découvrir Gorée',          query: 'Gorée',              icon: '🌊' },
  ];

  /* ── Correspondances catégorie → icône ───────────────────────── */

  const CATEGORY_ICONS = {
    musee:           '🏺',
    cinema:          '🎬',
    galerie:         '🖼',
    bibliotheque:    '📚',
    centre_culturel: '🏛',
    salle_spectacle: '🎪',
    formation:       '🎓',
    region:          '🌍',
    recent:          '🕐',
    popular:         '⭐',
  };

  /** Labels humains pour les catégories */
  const CATEGORY_LABELS = {
    type:      'Types',
    region:    'Régions',
    formation: 'Formations',
    recent:    'Recherches récentes',
    popular:   'Populaires',
  };

  /* ── État interne ────────────────────────────────────────────── */

  /** Recherches récentes (stockées en mémoire et/ou localStorage) */
  let _recentSearches = [];

  /** Cache de suggestions par préfixe */
  const _cache = new Map();

  /** Taille maximale du cache */
  const CACHE_MAX = 50;

  /** Panneau de suggestions actif */
  let _panel = null;

  /** Input actuellement attaché */
  let _activeInput = null;

  /** Index de l'élément surligné au clavier (-1 = aucun) */
  let _activeIndex = -1;

  /** Liste courante de suggestions affichées */
  let _currentItems = [];

  /** Timer anti-rebond */
  let _debounceTimer = null;

  /** Map des inputs attachés → { onSelect, listeners } */
  const _attachments = new Map();

  /* ── Utilitaires ─────────────────────────────────────────────── */

  /**
   * Normalise un texte pour la comparaison :
   * minuscules, suppression des accents et caractères spéciaux.
   * @param {string} str
   * @returns {string}
   */
  function normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  /**
   * Échappe les caractères HTML pour éviter les injections XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Charge les recherches récentes depuis localStorage.
   */
  function loadRecentSearches() {
    try {
      // Tentative via ConversationMemory si disponible
      if (typeof ConversationMemory !== 'undefined' && ConversationMemory.getSearchHistory) {
        const history = ConversationMemory.getSearchHistory();
        if (Array.isArray(history) && history.length > 0) {
          _recentSearches = history.slice(0, MAX_RECENT);
          return;
        }
      }
      // Sinon, utiliser localStorage
      const stored = localStorage.getItem('autosuggest_recent');
      if (stored) {
        _recentSearches = JSON.parse(stored).slice(0, MAX_RECENT);
      }
    } catch (e) {
      console.warn('[AutoSuggest] Impossible de charger les recherches récentes:', e);
    }
  }

  /**
   * Sauvegarde une recherche dans l'historique récent.
   * @param {string} query
   */
  function saveRecentSearch(query) {
    if (!query || !query.trim()) return;
    const trimmed = query.trim();

    // Retirer les doublons
    _recentSearches = _recentSearches.filter(r => r !== trimmed);

    // Ajouter en tête
    _recentSearches.unshift(trimmed);

    // Limiter la taille
    _recentSearches = _recentSearches.slice(0, MAX_RECENT);

    // Persister
    try {
      localStorage.setItem('autosuggest_recent', JSON.stringify(_recentSearches));
    } catch (e) {
      // Quota dépassé ou accès refusé — on continue silencieusement
    }
  }

  /* ── Moteur de suggestions ───────────────────────────────────── */

  /**
   * Génère les suggestions pour un texte partiel.
   * Utilise SearchEngine.parseIntent() si disponible pour
   * extraire l'intention, puis construit des suggestions catégorisées.
   *
   * @param {string} partial - Texte saisi par l'utilisateur
   * @returns {Array<Object>} Liste de suggestions triées
   */
  function getSuggestions(partial) {
    if (!partial || typeof partial !== 'string') {
      return _buildEmptySuggestions();
    }

    // Tronquer les saisies trop longues
    const text = partial.trim().slice(0, MAX_INPUT_LENGTH);
    if (text.length < MIN_CHARS) {
      return _buildEmptySuggestions();
    }

    // Vérifier le cache
    const cacheKey = normalize(text);
    if (_cache.has(cacheKey)) {
      return _cache.get(cacheKey);
    }

    const suggestions = [];
    const norm = normalize(text);

    // 1. Recherches récentes correspondantes
    _addRecentSuggestions(suggestions, norm);

    // 2. Suggestions basées sur l'intent NLP (via SearchEngine)
    _addIntentSuggestions(suggestions, text, norm);

    // 3. Suggestions populaires correspondantes
    _addPopularSuggestions(suggestions, norm);

    // Dédupliquer par label
    const seen = new Set();
    const unique = [];
    for (const s of suggestions) {
      const key = s.label;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(s);
      }
    }

    // Trier par score décroissant
    unique.sort((a, b) => (b._score || 0) - (a._score || 0));

    // Limiter le nombre
    const result = unique.slice(0, MAX_SUGGESTIONS);

    // Mettre en cache
    _cacheSet(cacheKey, result);

    return result;
  }

  /**
   * Construit les suggestions à afficher quand l'input est vide :
   * recherches récentes + populaires.
   * @returns {Array<Object>}
   */
  function _buildEmptySuggestions() {
    const suggestions = [];

    // Recherches récentes
    for (const query of _recentSearches) {
      suggestions.push({
        label: '🕐 ' + query,
        query: query,
        count: null,
        category: 'recent',
        icon: '🕐',
        _score: 100,
      });
    }

    // Populaires
    for (const p of POPULAR) {
      suggestions.push({
        label: p.label,
        query: p.query,
        count: null,
        category: 'popular',
        icon: p.icon,
        _score: 50,
      });
    }

    return suggestions.slice(0, MAX_SUGGESTIONS);
  }

  /**
   * Ajoute les recherches récentes correspondant au texte normalisé.
   * @param {Array} suggestions
   * @param {string} norm - texte normalisé
   */
  function _addRecentSuggestions(suggestions, norm) {
    for (const query of _recentSearches) {
      const queryNorm = normalize(query);
      if (queryNorm.includes(norm) || norm.includes(queryNorm)) {
        suggestions.push({
          label: '🕐 ' + query,
          query: query,
          count: null,
          category: 'recent',
          icon: '🕐',
          _score: queryNorm.startsWith(norm) ? 90 : 70,
        });
      }
    }
  }

  /**
   * Ajoute les suggestions issues de l'analyse NLP via SearchEngine.
   * Si SearchEngine n'est pas disponible, utilise une correspondance
   * textuelle simple sur les populaires et un jeu de données locales.
   *
   * @param {Array} suggestions
   * @param {string} text - texte brut
   * @param {string} norm - texte normalisé
   */
  function _addIntentSuggestions(suggestions, text, norm) {
    const hasEngine = typeof SearchEngine !== 'undefined' && SearchEngine.ready;

    if (hasEngine) {
      _addEngineSuggestions(suggestions, text, norm);
    } else {
      _addFallbackSuggestions(suggestions, norm);
    }
  }

  /**
   * Suggestions via SearchEngine (parseIntent + search).
   * @param {Array} suggestions
   * @param {string} text
   * @param {string} norm
   */
  function _addEngineSuggestions(suggestions, text, norm) {
    try {
      const intent = SearchEngine.parseIntent(text);

      // Suggestions par type d'infrastructure détecté
      if (intent.types && intent.types.length > 0) {
        for (const type of intent.types) {
          const icon = CATEGORY_ICONS[type] || '📍';

          // Si des régions sont détectées, combiner type + région
          if (intent.regions && intent.regions.length > 0) {
            for (const region of intent.regions) {
              const label = _buildTypeLabel(type, icon, region);
              const query = _buildTypeQuery(type, region);
              const count = _getResultCount(query);
              suggestions.push({
                label: label,
                query: query,
                count: count,
                category: 'type',
                icon: icon,
                _score: 80 + (count || 0) / 10,
              });
            }
          } else {
            // Type seul — proposer les régions principales
            const regions = _getTopRegionsForType(type);
            for (const region of regions) {
              const label = _buildTypeLabel(type, icon, region);
              const query = _buildTypeQuery(type, region);
              const count = _getResultCount(query);
              suggestions.push({
                label: label,
                query: query,
                count: count,
                category: 'type',
                icon: icon,
                _score: 75 + (count || 0) / 10,
              });
            }

            // Suggestion globale pour le type
            const globalLabel = icon + ' ' + _typeDisplayName(type);
            const globalCount = _getResultCount(type);
            suggestions.push({
              label: globalLabel,
              query: type,
              count: globalCount,
              category: 'type',
              icon: icon,
              _score: 85 + (globalCount || 0) / 10,
            });
          }
        }
      }

      // Suggestions par région détectée (sans type spécifique)
      if (intent.regions && intent.regions.length > 0 && (!intent.types || intent.types.length === 0)) {
        for (const region of intent.regions) {
          const icon = '🌍';
          const label = icon + ' Culture à ' + region;
          const count = _getResultCount(region);
          suggestions.push({
            label: label,
            query: region,
            count: count,
            category: 'region',
            icon: icon,
            _score: 70 + (count || 0) / 10,
          });
        }
      }

      // Suggestions formations
      if (intent.wantFormations) {
        const icon = '🎓';
        const query = intent.branches.length > 0 ? intent.branches.join(' ') : 'formations';
        const label = icon + ' Formations' + (intent.branches.length > 0 ? ' — ' + intent.branches.join(', ') : '');
        const count = _getResultCount(query);
        suggestions.push({
          label: label,
          query: query,
          count: count,
          category: 'formation',
          icon: icon,
          _score: 65 + (count || 0) / 10,
        });
      }

      // Utiliser aussi l'autocomplete natif de SearchEngine
      const autoSuggestions = SearchEngine.autocomplete(text, 5);
      if (Array.isArray(autoSuggestions)) {
        for (const s of autoSuggestions) {
          const icon = _iconForAutocomplete(s);
          suggestions.push({
            label: icon + ' ' + s.label,
            query: s.query || s.label,
            count: null,
            category: s.type || 'type',
            icon: icon,
            _score: 60 + (s.score || 0),
          });
        }
      }
    } catch (e) {
      console.warn('[AutoSuggest] Erreur SearchEngine:', e);
      _addFallbackSuggestions(suggestions, norm);
    }
  }

  /**
   * Suggestions de repli quand SearchEngine n'est pas disponible.
   * Fait une correspondance textuelle sur les données populaires
   * et un ensemble de termes culturels sénégalais.
   *
   * @param {Array} suggestions
   * @param {string} norm
   */
  function _addFallbackSuggestions(suggestions, norm) {
    // Termes culturels prédéfinis pour la correspondance
    const TERMS = [
      { label: '🏺 Musées à Dakar',        query: 'musées Dakar',          icon: '🏺', cat: 'type' },
      { label: '🏺 Musées à Thiès',        query: 'musées Thiès',          icon: '🏺', cat: 'type' },
      { label: '🏺 Musées ruraux',          query: 'musées rural',          icon: '🏺', cat: 'type' },
      { label: '🏺 Musées du Sénégal',     query: 'musées',                icon: '🏺', cat: 'type' },
      { label: '🎬 Cinémas à Dakar',       query: 'cinémas Dakar',         icon: '🎬', cat: 'type' },
      { label: '🎬 Cinémas au Sénégal',    query: 'cinémas',               icon: '🎬', cat: 'type' },
      { label: '🖼 Galeries d\'art',        query: 'galeries',              icon: '🖼', cat: 'type' },
      { label: '📚 Bibliothèques',         query: 'bibliothèques',         icon: '📚', cat: 'type' },
      { label: '🏛 Centres culturels',     query: 'centres culturels',     icon: '🏛', cat: 'type' },
      { label: '🎪 Salles de spectacle',   query: 'salles de spectacle',   icon: '🎪', cat: 'type' },
      { label: '🎵 Musique - Formations',  query: 'formations musique',    icon: '🎵', cat: 'formation' },
      { label: '🎭 Théâtre - Formations',  query: 'formations théâtre',    icon: '🎭', cat: 'formation' },
      { label: '💃 Danse - Formations',    query: 'formations danse',      icon: '💃', cat: 'formation' },
      { label: '🎨 Arts visuels - Formations', query: 'formations arts visuels', icon: '🎨', cat: 'formation' },
      { label: '🌍 Dakar',                 query: 'Dakar',                 icon: '🌍', cat: 'region' },
      { label: '🌍 Thiès',                 query: 'Thiès',                 icon: '🌍', cat: 'region' },
      { label: '🌍 Saint-Louis',           query: 'Saint-Louis',           icon: '🌍', cat: 'region' },
      { label: '🌍 Ziguinchor',            query: 'Ziguinchor',            icon: '🌍', cat: 'region' },
      { label: '🌍 Kaolack',               query: 'Kaolack',               icon: '🌍', cat: 'region' },
      { label: '🌍 Fatick',                query: 'Fatick',                icon: '🌍', cat: 'region' },
      { label: '🌍 Louga',                 query: 'Louga',                 icon: '🌍', cat: 'region' },
      { label: '🌍 Diourbel',              query: 'Diourbel',              icon: '🌍', cat: 'region' },
      { label: '🌍 Matam',                 query: 'Matam',                 icon: '🌍', cat: 'region' },
      { label: '🌍 Tambacounda',           query: 'Tambacounda',           icon: '🌍', cat: 'region' },
      { label: '🌍 Kédougou',              query: 'Kédougou',              icon: '🌍', cat: 'region' },
      { label: '🌍 Kolda',                 query: 'Kolda',                 icon: '🌍', cat: 'region' },
      { label: '🌍 Sédhiou',               query: 'Sédhiou',               icon: '🌍', cat: 'region' },
      { label: '🌍 Kaffrine',              query: 'Kaffrine',              icon: '🌍', cat: 'region' },
    ];

    for (const term of TERMS) {
      const termNorm = normalize(term.label + ' ' + term.query);
      if (termNorm.includes(norm)) {
        const isPrefix = normalize(term.query).startsWith(norm) || normalize(term.label).startsWith(norm);
        suggestions.push({
          label: term.label,
          query: term.query,
          count: null,
          category: term.cat,
          icon: term.icon,
          _score: isPrefix ? 60 : 40,
        });
      }
    }
  }

  /**
   * Ajoute les suggestions populaires correspondant au texte.
   * @param {Array} suggestions
   * @param {string} norm
   */
  function _addPopularSuggestions(suggestions, norm) {
    for (const p of POPULAR) {
      const pNorm = normalize(p.label + ' ' + p.query);
      if (pNorm.includes(norm)) {
        suggestions.push({
          label: p.label,
          query: p.query,
          count: null,
          category: 'popular',
          icon: p.icon,
          _score: normalize(p.query).startsWith(norm) ? 55 : 35,
        });
      }
    }
  }

  /* ── Helpers SearchEngine ────────────────────────────────────── */

  /**
   * Obtient le nombre de résultats pour une requête via SearchEngine.
   * @param {string} query
   * @returns {number|null}
   */
  function _getResultCount(query) {
    try {
      if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
        const result = SearchEngine.search(query);
        return result && result.results ? result.results.length : null;
      }
    } catch (e) {
      // Silencieux
    }
    return null;
  }

  /**
   * Récupère les principales régions pour un type donné.
   * @param {string} type
   * @returns {string[]}
   */
  function _getTopRegionsForType(type) {
    try {
      if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
        const stats = SearchEngine.getStats();
        if (stats && stats.regions) {
          // Retourner les 3 premières régions
          return stats.regions.slice(0, 3);
        }
      }
    } catch (e) {
      // Silencieux
    }
    return ['Dakar', 'Thiès', 'Saint-Louis'];
  }

  /**
   * Construit le libellé affiché pour un type + région.
   * @param {string} type
   * @param {string} icon
   * @param {string} region
   * @returns {string}
   */
  function _buildTypeLabel(type, icon, region) {
    return icon + ' ' + _typeDisplayName(type) + ' à ' + region;
  }

  /**
   * Construit la requête pour un type + région.
   * @param {string} type
   * @param {string} region
   * @returns {string}
   */
  function _buildTypeQuery(type, region) {
    return _typeDisplayName(type).toLowerCase() + ' ' + region;
  }

  /**
   * Retourne le nom d'affichage d'un type d'infrastructure.
   * @param {string} typeKey
   * @returns {string}
   */
  function _typeDisplayName(typeKey) {
    const NAMES = {
      musee:           'Musées',
      cinema:          'Cinémas',
      galerie:         'Galeries',
      bibliotheque:    'Bibliothèques',
      centre_culturel: 'Centres culturels',
      salle_spectacle: 'Salles de spectacle',
    };
    return NAMES[typeKey] || typeKey;
  }

  /**
   * Détermine l'icône pour une suggestion autocomplete du SearchEngine.
   * @param {Object} s - suggestion
   * @returns {string}
   */
  function _iconForAutocomplete(s) {
    if (s.type === 'formation') return '🎓';
    if (s.type === 'region')    return '🌍';
    if (s.type === 'lieu')      return '📍';
    if (s.typeKey && CATEGORY_ICONS[s.typeKey]) return CATEGORY_ICONS[s.typeKey];
    return '📍';
  }

  /* ── Gestion du cache ────────────────────────────────────────── */

  /**
   * Ajoute une entrée au cache avec contrôle de taille.
   * @param {string} key
   * @param {Array} value
   */
  function _cacheSet(key, value) {
    if (_cache.size >= CACHE_MAX) {
      // Supprimer la plus ancienne entrée (FIFO)
      const firstKey = _cache.keys().next().value;
      _cache.delete(firstKey);
    }
    _cache.set(key, value);
  }

  /* ── Interface DOM ───────────────────────────────────────────── */

  /**
   * Crée le panneau de suggestions (dropdown).
   * @returns {HTMLElement}
   */
  function _createPanel() {
    if (_panel) return _panel;

    _panel = document.createElement('div');
    _panel.className = 'autosuggest-panel';
    _panel.setAttribute('role', 'listbox');
    _panel.setAttribute('aria-label', 'Suggestions de recherche');
    _panel.style.display = 'none';

    document.body.appendChild(_panel);
    return _panel;
  }

  /**
   * Positionne le panneau sous l'input, en s'assurant qu'il ne déborde
   * pas de l'écran (important pour le mobile).
   * @param {HTMLElement} inputEl
   */
  function _positionPanel(inputEl) {
    if (!_panel || !inputEl) return;

    const rect = inputEl.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position de base : juste en dessous de l'input
    let top = rect.bottom + scrollTop;
    let left = rect.left + scrollLeft;
    let width = rect.width;

    // Largeur minimale sur mobile
    if (width < 280) width = Math.min(280, viewportWidth - 16);

    // Empêcher le débordement à droite
    if (left + width > viewportWidth + scrollLeft) {
      left = viewportWidth + scrollLeft - width - 8;
    }

    // Empêcher le débordement à gauche
    if (left < scrollLeft + 4) {
      left = scrollLeft + 4;
    }

    // Si pas assez de place en dessous, afficher au-dessus
    const panelHeight = _panel.offsetHeight || 300;
    if (rect.bottom + panelHeight > viewportHeight && rect.top > panelHeight) {
      top = rect.top + scrollTop - panelHeight;
    }

    _panel.style.position = 'absolute';
    _panel.style.top = top + 'px';
    _panel.style.left = left + 'px';
    _panel.style.width = width + 'px';
    _panel.style.zIndex = '10000';
  }

  /**
   * Affiche les suggestions dans le panneau.
   * @param {HTMLElement} inputEl - L'input associé
   * @param {Array<Object>} suggestions - Les suggestions à afficher
   */
  function _renderSuggestions(inputEl, suggestions) {
    _createPanel();
    _currentItems = suggestions;
    _activeIndex = -1;

    if (!suggestions || suggestions.length === 0) {
      _panel.innerHTML = '<div class="autosuggest-empty">Aucune suggestion</div>';
      _positionPanel(inputEl);
      _panel.style.display = '';
      return;
    }

    // Regrouper par catégorie
    const groups = _groupByCategory(suggestions);
    let html = '';

    for (const [category, items] of groups) {
      const catLabel = CATEGORY_LABELS[category] || category;
      html += '<div class="autosuggest-category">' + escapeHTML(catLabel) + '</div>';

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const globalIndex = suggestions.indexOf(item);
        const countBadge = item.count != null
          ? '<span class="autosuggest-count">' + item.count + '</span>'
          : '';

        html += '<div class="autosuggest-item" data-index="' + globalIndex + '" role="option">'
          + escapeHTML(item.label) + countBadge
          + '</div>';
      }
    }

    _panel.innerHTML = html;
    _positionPanel(inputEl);
    _panel.style.display = '';

    // Gestionnaires de clic/toucher sur les éléments
    const itemEls = _panel.querySelectorAll('.autosuggest-item');
    itemEls.forEach(function (el) {
      el.addEventListener('mousedown', _onItemInteract);
      el.addEventListener('touchend', _onItemInteract);
    });

    // Survol souris → mise en surbrillance
    itemEls.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        _setActiveIndex(idx);
      });
    });
  }

  /**
   * Regroupe les suggestions par catégorie en conservant l'ordre.
   * @param {Array} suggestions
   * @returns {Map<string, Array>}
   */
  function _groupByCategory(suggestions) {
    const orderPriority = ['recent', 'type', 'region', 'formation', 'popular'];
    const groups = new Map();

    for (const s of suggestions) {
      const cat = s.category || 'popular';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(s);
    }

    // Trier les groupes par priorité
    const sorted = new Map();
    for (const cat of orderPriority) {
      if (groups.has(cat)) sorted.set(cat, groups.get(cat));
    }
    // Ajouter les catégories non prévues
    for (const [cat, items] of groups) {
      if (!sorted.has(cat)) sorted.set(cat, items);
    }

    return sorted;
  }

  /**
   * Gestionnaire de sélection d'un élément (clic ou toucher).
   * @param {Event} e
   */
  function _onItemInteract(e) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget;
    const index = parseInt(el.getAttribute('data-index'), 10);
    if (isNaN(index) || index < 0 || index >= _currentItems.length) return;

    _selectItem(index);
  }

  /**
   * Sélectionne l'élément à l'index donné et exécute le callback.
   * @param {number} index
   */
  function _selectItem(index) {
    const item = _currentItems[index];
    if (!item) return;

    // Sauvegarder la recherche
    saveRecentSearch(item.query);

    // Invalider le cache (la recherche récente change les résultats)
    _cache.clear();

    // Remplir l'input
    if (_activeInput) {
      _activeInput.value = item.query;
    }

    // Masquer le panneau
    hide();

    // Appeler le callback onSelect
    const attachment = _activeInput ? _attachments.get(_activeInput) : null;
    if (attachment && typeof attachment.onSelect === 'function') {
      attachment.onSelect(item);
    }
  }

  /**
   * Met en surbrillance l'élément à l'index donné.
   * @param {number} index
   */
  function _setActiveIndex(index) {
    if (!_panel) return;

    // Retirer la classe active de l'ancien
    const items = _panel.querySelectorAll('.autosuggest-item');
    items.forEach(function (el) {
      el.classList.remove('active');
    });

    _activeIndex = index;

    if (index >= 0 && index < items.length) {
      // Trouver l'élément correspondant
      const targetEl = _panel.querySelector('.autosuggest-item[data-index="' + index + '"]');
      if (targetEl) {
        targetEl.classList.add('active');
        // Assurer la visibilité dans le panneau scrollable
        targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  /* ── Gestion des événements ──────────────────────────────────── */

  /**
   * Gestionnaire d'entrée (input) avec anti-rebond.
   * @param {Event} e
   */
  function _onInput(e) {
    const inputEl = e.target;
    _activeInput = inputEl;

    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function () {
      const text = inputEl.value;
      const suggestions = getSuggestions(text);
      _renderSuggestions(inputEl, suggestions);
    }, DEBOUNCE_MS);
  }

  /**
   * Gestionnaire de focus sur l'input.
   * Affiche les suggestions populaires / récentes.
   * @param {Event} e
   */
  function _onFocus(e) {
    const inputEl = e.target;
    _activeInput = inputEl;

    const text = inputEl.value;
    const suggestions = getSuggestions(text);
    _renderSuggestions(inputEl, suggestions);
  }

  /**
   * Gestionnaire de perte de focus (blur).
   * Masque le panneau après un court délai pour permettre les clics.
   * @param {Event} e
   */
  function _onBlur(e) {
    // Délai pour permettre les interactions mousedown/touchend
    setTimeout(function () {
      // Ne pas fermer si le focus est sur le panneau
      if (_panel && _panel.contains(document.activeElement)) return;
      hide();
    }, 200);
  }

  /**
   * Gestionnaire clavier pour la navigation dans les suggestions.
   * @param {Event} e
   */
  function _onKeyDown(e) {
    if (!_panel || _panel.style.display === 'none') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        _navigateDown();
        break;

      case 'ArrowUp':
        e.preventDefault();
        _navigateUp();
        break;

      case 'Enter':
        if (_activeIndex >= 0 && _activeIndex < _currentItems.length) {
          e.preventDefault();
          _selectItem(_activeIndex);
        }
        break;

      case 'Escape':
        e.preventDefault();
        hide();
        break;

      case 'Tab':
        hide();
        break;
    }
  }

  /**
   * Navigation clavier vers le bas.
   */
  function _navigateDown() {
    if (_currentItems.length === 0) return;
    const next = _activeIndex + 1;
    _setActiveIndex(next >= _currentItems.length ? 0 : next);
  }

  /**
   * Navigation clavier vers le haut.
   */
  function _navigateUp() {
    if (_currentItems.length === 0) return;
    const prev = _activeIndex - 1;
    _setActiveIndex(prev < 0 ? _currentItems.length - 1 : prev);
  }

  /**
   * Ferme le panneau au clic extérieur.
   * @param {Event} e
   */
  function _onDocumentClick(e) {
    if (!_panel) return;
    if (_panel.contains(e.target)) return;
    if (_activeInput && _activeInput === e.target) return;
    hide();
  }

  /**
   * Repositionne le panneau au redimensionnement de la fenêtre.
   */
  function _onResize() {
    if (_panel && _panel.style.display !== 'none' && _activeInput) {
      _positionPanel(_activeInput);
    }
  }

  /* ── Écouteurs globaux ───────────────────────────────────────── */

  /** Indique si les écouteurs globaux sont actifs */
  let _globalListenersActive = false;

  /**
   * Installe les écouteurs globaux (clic extérieur, redimensionnement).
   */
  function _addGlobalListeners() {
    if (_globalListenersActive) return;
    document.addEventListener('click', _onDocumentClick, true);
    window.addEventListener('resize', _onResize);
    _globalListenersActive = true;
  }

  /**
   * Retire les écouteurs globaux.
   */
  function _removeGlobalListeners() {
    document.removeEventListener('click', _onDocumentClick, true);
    window.removeEventListener('resize', _onResize);
    _globalListenersActive = false;
  }

  /* ── API publique ────────────────────────────────────────────── */

  /**
   * Attache le système de suggestions à un champ de saisie.
   *
   * @param {HTMLElement} inputEl - L'élément <input> cible
   * @param {Function} onSelect - Callback appelé à la sélection
   *   Reçoit l'objet suggestion : { label, query, count, category, icon }
   */
  function attach(inputEl, onSelect) {
    if (!inputEl || !(inputEl instanceof HTMLElement)) {
      console.warn('[AutoSuggest] attach() : élément invalide');
      return;
    }

    // Détacher d'abord si déjà attaché
    if (_attachments.has(inputEl)) {
      detach(inputEl);
    }

    // Charger les recherches récentes
    loadRecentSearches();

    // Créer le panneau si nécessaire
    _createPanel();

    // Stocker les références
    const listeners = {
      input: _onInput,
      focus: _onFocus,
      blur: _onBlur,
      keydown: _onKeyDown,
    };

    _attachments.set(inputEl, { onSelect: onSelect, listeners: listeners });

    // Attacher les écouteurs sur l'input
    inputEl.addEventListener('input', listeners.input);
    inputEl.addEventListener('focus', listeners.focus);
    inputEl.addEventListener('blur', listeners.blur);
    inputEl.addEventListener('keydown', listeners.keydown);

    // Attributs d'accessibilité
    inputEl.setAttribute('role', 'combobox');
    inputEl.setAttribute('aria-autocomplete', 'list');
    inputEl.setAttribute('aria-expanded', 'false');
    inputEl.setAttribute('autocomplete', 'off');

    // Écouteurs globaux
    _addGlobalListeners();
  }

  /**
   * Détache le système de suggestions d'un champ de saisie.
   * @param {HTMLElement} inputEl
   */
  function detach(inputEl) {
    if (!inputEl || !_attachments.has(inputEl)) return;

    const { listeners } = _attachments.get(inputEl);

    inputEl.removeEventListener('input', listeners.input);
    inputEl.removeEventListener('focus', listeners.focus);
    inputEl.removeEventListener('blur', listeners.blur);
    inputEl.removeEventListener('keydown', listeners.keydown);

    // Retirer les attributs d'accessibilité
    inputEl.removeAttribute('role');
    inputEl.removeAttribute('aria-autocomplete');
    inputEl.removeAttribute('aria-expanded');

    _attachments.delete(inputEl);

    // Si plus aucun input attaché, nettoyer les écouteurs globaux
    if (_attachments.size === 0) {
      _removeGlobalListeners();
      hide();
    }

    // Si c'était l'input actif, le désactiver
    if (_activeInput === inputEl) {
      _activeInput = null;
    }
  }

  /**
   * Affiche manuellement des suggestions pour un input.
   *
   * @param {HTMLElement} inputEl - L'input cible
   * @param {Array<Object>} suggestions - Les suggestions à afficher
   */
  function show(inputEl, suggestions) {
    if (!inputEl) return;
    _activeInput = inputEl;
    _createPanel();
    _renderSuggestions(inputEl, suggestions);
    inputEl.setAttribute('aria-expanded', 'true');
  }

  /**
   * Masque le panneau de suggestions.
   */
  function hide() {
    if (_panel) {
      _panel.style.display = 'none';
      _panel.innerHTML = '';
    }
    _activeIndex = -1;
    _currentItems = [];

    if (_activeInput) {
      _activeInput.setAttribute('aria-expanded', 'false');
    }
  }

  /* ── Initialisation ──────────────────────────────────────────── */

  // Charger les recherches récentes au démarrage
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadRecentSearches);
    } else {
      loadRecentSearches();
    }
  }

  /* ── Exposition de l'API ─────────────────────────────────────── */

  return {
    attach:         attach,
    detach:         detach,
    show:           show,
    hide:           hide,
    getSuggestions:  getSuggestions,
    get isVisible() {
      return _panel != null && _panel.style.display !== 'none';
    },
  };

})();
