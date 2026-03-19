/* ════════════════════════════════════════════════════════════════
   CULTE — Conversation Vocale Bidirectionnelle
   Synthèse vocale (TTS), réponses intelligentes, suivi conversationnel
   Français + Wolof — SpeechSynthesis API
   ════════════════════════════════════════════════════════════════ */
'use strict';

const VoiceConversation = (() => {

  /* ── Constantes ─────────────────────────────────────────────── */

  const STORAGE_KEY = 'culte_voice_conversation_enabled';

  /** Modèles de réponses vocales — français naturel et varié */
  const RESPONSE_TEMPLATES = {
    results: [
      "J'ai trouvé {count} {type} {location}.",
      "Voici {count} résultats pour {query}.",
      "Il y a {count} {type} {location}.",
      "{count} {type} correspondent à votre recherche.",
    ],
    noResults: [
      "Désolé, aucun résultat pour {query}. Essayez autre chose.",
      "Je n'ai rien trouvé pour {query}. Voulez-vous élargir ?",
    ],
    followUp: [
      "Souhaitez-vous affiner par zone ?",
      "Voulez-vous filtrer davantage ?",
      "Que souhaitez-vous faire ensuite ?",
    ],
    greeting: [
      "Bonjour ! Que cherchez-vous aujourd'hui ?",
      "Bienvenue ! Comment puis-je vous aider ?",
      "Nanga def ! Que voulez-vous découvrir ?",
    ],
    manyResults: [
      "Voulez-vous filtrer par zone urbaine ou rurale ?",
      "Souhaitez-vous réduire les résultats par localisation ?",
      "Je peux affiner par zone, voulez-vous ?",
    ],
    fewResults: [
      "Voulez-vous élargir la recherche ?",
      "Souhaitez-vous essayer des termes plus larges ?",
      "On peut élargir la zone de recherche, voulez-vous ?",
    ],
    hasLocation: [
      "Voulez-vous trier par distance ?",
      "Souhaitez-vous voir les plus proches en premier ?",
      "Je peux trier par proximité, voulez-vous ?",
    ],
    formation: [
      "Voulez-vous voir les détails d'une formation ?",
      "Souhaitez-vous en savoir plus sur une formation ?",
      "Voulez-vous que je détaille une formation ?",
    ],
  };

  /** Options TTS par défaut */
  const DEFAULT_OPTIONS = {
    rate:          1.0,
    pitch:         1.0,
    volume:        1.0,
    lang:          'fr-FR',
    onEnd:         null,
    interruptible: true,
    priority:      'normal',   // 'normal' | 'high'
  };

  /* ── État interne ───────────────────────────────────────────── */

  let _initialized   = false;
  let _enabled       = false;
  let _frenchVoice   = null;
  let _speaking      = false;
  let _paused        = false;
  let _currentUtter  = null;
  let _queue         = [];          // file d'attente des utterances
  let _processing    = false;       // file en cours de traitement
  let _userGesture   = false;       // page activée par geste utilisateur
  let _highlightEl   = null;        // élément en surbrillance
  let _indicatorEl   = null;        // indicateur visuel de parole
  let _onEndCallback = null;        // callback global de fin de parole

  /* ── Utilitaires ────────────────────────────────────────────── */

  /** Choisit un élément aléatoire dans un tableau */
  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Remplace les placeholders {clé} dans un template */
  function _fill(template, data) {
    return template.replace(/\{(\w+)\}/g, (_, k) => {
      return data[k] !== undefined ? data[k] : '';
    });
  }

  /** Tronque le texte pour le TTS — on garde ça court */
  function _truncate(text, max) {
    max = max || 200;
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  /** Charge la préférence depuis localStorage */
  function _loadPreference() {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      return val === 'true';
    } catch (_e) {
      return false;
    }
  }

  /** Sauvegarde la préférence dans localStorage */
  function _savePreference(val) {
    try {
      localStorage.setItem(STORAGE_KEY, val ? 'true' : 'false');
    } catch (_e) { /* silencieux */ }
  }

  /* ── Gestion des voix ──────────────────────────────────────── */

  /** Recherche la meilleure voix française disponible */
  function _findFrenchVoice() {
    if (!window.speechSynthesis) return null;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Priorité : fr-FR natif, puis fr-*, puis première voix
    let best = null;
    let fallback = null;

    for (const v of voices) {
      const lang = (v.lang || '').toLowerCase();
      if (lang === 'fr-fr') {
        if (v.localService) return v;   // voix native fr-FR = idéal
        if (!best) best = v;
      } else if (lang.startsWith('fr') && !fallback) {
        fallback = v;
      }
    }

    return best || fallback || voices[0] || null;
  }

  /** Attend le chargement asynchrone de la liste de voix */
  function _waitForVoices() {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(null); return; }

      const voices = speechSynthesis.getVoices();
      if (voices.length) { resolve(_findFrenchVoice()); return; }

      // Les voix se chargent de façon asynchrone dans certains navigateurs
      const handler = () => {
        speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(_findFrenchVoice());
      };
      speechSynthesis.addEventListener('voiceschanged', handler);

      // Timeout de sécurité — 3 secondes max
      setTimeout(() => {
        speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(_findFrenchVoice());
      }, 3000);
    });
  }

  /* ── Indicateur visuel de parole ────────────────────────────── */

  /** Crée / affiche l'indicateur d'activité vocale */
  function _showSpeakingIndicator() {
    if (!_indicatorEl) {
      _indicatorEl = document.createElement('div');
      _indicatorEl.id = 'vc-speaking-indicator';
      _indicatorEl.setAttribute('aria-live', 'polite');
      _indicatorEl.setAttribute('role', 'status');
      _indicatorEl.innerHTML = `
        <span class="vc-speaker-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path class="vc-wave vc-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path class="vc-wave vc-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        </span>
        <span class="vc-label">Parle…</span>
      `;
      document.body.appendChild(_indicatorEl);
    }
    _indicatorEl.classList.add('vc-active');
    // Bordure pulsante sur la zone de résultats
    const results = document.querySelector('.search-results, #results, [data-results]');
    if (results) results.classList.add('vc-pulse-border');
  }

  /** Masque l'indicateur d'activité vocale */
  function _hideSpeakingIndicator() {
    if (_indicatorEl) _indicatorEl.classList.remove('vc-active');
    const results = document.querySelector('.search-results, #results, [data-results]');
    if (results) results.classList.remove('vc-pulse-border');
  }

  /* ── Surbrillance synchronisée ─────────────────────────────── */

  /**
   * Surligne le texte lu dans l'UI.
   * Cherche un élément contenant le texte et lui ajoute .vc-highlight.
   */
  function _highlightText(text) {
    _clearHighlight();
    if (!text) return;

    // Cherche un nœud texte correspondant dans le DOM visible
    const short = text.slice(0, 60).toLowerCase();
    const candidates = document.querySelectorAll(
      '.search-results p, .search-results h3, .search-results li, ' +
      '.result-card, .result-item, [data-results] *'
    );

    for (const el of candidates) {
      if ((el.textContent || '').toLowerCase().includes(short)) {
        el.classList.add('vc-highlight');
        _highlightEl = el;
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        break;
      }
    }
  }

  /** Supprime la surbrillance courante */
  function _clearHighlight() {
    if (_highlightEl) {
      _highlightEl.classList.remove('vc-highlight');
      _highlightEl = null;
    }
    // Nettoyage global au cas où
    document.querySelectorAll('.vc-highlight').forEach(
      el => el.classList.remove('vc-highlight')
    );
  }

  /* ── File d'attente TTS ─────────────────────────────────────── */

  /** Ajoute une entrée dans la file d'attente et lance le traitement */
  function _enqueue(text, opts) {
    _queue.push({ text, opts });
    if (!_processing) _processQueue();
  }

  /** Traite la file d'attente séquentiellement */
  function _processQueue() {
    if (_processing || !_queue.length) return;
    _processing = true;

    const { text, opts } = _queue.shift();
    _doSpeak(text, opts).then(() => {
      _processing = false;
      if (_queue.length) _processQueue();
    });
  }

  /** Vide la file d'attente */
  function _clearQueue() {
    _queue = [];
    _processing = false;
  }

  /* ── Moteur TTS ─────────────────────────────────────────────── */

  /**
   * Synthétise vocalement le texte donné.
   * Retourne une Promise résolue quand la parole est terminée.
   */
  function _doSpeak(text, opts) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !_enabled) { resolve(); return; }
      if (!_userGesture) {
        console.warn('[VoiceConversation] En attente d\'un geste utilisateur.');
        resolve();
        return;
      }

      // Tronquer pour garder la parole courte
      const safeText = _truncate(text, 300);

      const utter = new SpeechSynthesisUtterance(safeText);
      utter.lang   = opts.lang   || DEFAULT_OPTIONS.lang;
      utter.rate   = opts.rate   || DEFAULT_OPTIONS.rate;
      utter.pitch  = opts.pitch  || DEFAULT_OPTIONS.pitch;
      utter.volume = opts.volume || DEFAULT_OPTIONS.volume;

      if (_frenchVoice && (opts.lang || 'fr-FR').startsWith('fr')) {
        utter.voice = _frenchVoice;
      }

      _speaking      = true;
      _paused        = false;
      _currentUtter  = utter;

      _showSpeakingIndicator();
      _highlightText(safeText);

      utter.onend = () => {
        _speaking     = false;
        _currentUtter = null;
        _hideSpeakingIndicator();
        _clearHighlight();
        if (typeof opts.onEnd === 'function') opts.onEnd();
        if (typeof _onEndCallback === 'function') _onEndCallback();
        resolve();
      };

      utter.onerror = (e) => {
        console.error('[VoiceConversation] Erreur TTS :', e.error);
        _speaking     = false;
        _currentUtter = null;
        _hideSpeakingIndicator();
        _clearHighlight();
        resolve();
      };

      // Workaround Chrome : cancel avant speak pour débloquer
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    });
  }

  /* ── Interruptions ──────────────────────────────────────────── */

  /** Arrête immédiatement la parole en cours */
  function _stop() {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    _speaking     = false;
    _paused       = false;
    _currentUtter = null;
    _clearQueue();
    _hideSpeakingIndicator();
    _clearHighlight();
  }

  /** Configure les écouteurs d'interruption (tap, Escape, nouvelle recherche) */
  function _setupInterruptionListeners() {
    // Touche Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _speaking) {
        _stop();
      }
    });

    // Tap / clic sur l'écran pendant la parole
    document.addEventListener('pointerdown', (e) => {
      // Enregistre le geste utilisateur pour débloquer le TTS
      _userGesture = true;

      // Interrompt si on parle et que l'utterance est interruptible
      if (_speaking && _currentUtter) {
        _stop();
      }
    }, { passive: true });
  }

  /* ── Injection CSS ──────────────────────────────────────────── */

  function _injectStyles() {
    if (document.getElementById('vc-styles')) return;
    const style = document.createElement('style');
    style.id = 'vc-styles';
    style.textContent = `
      /* ── Indicateur de parole ───────────────────────────── */
      #vc-speaking-indicator {
        position: fixed;
        bottom: 90px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: var(--vc-bg, #1a1a2e);
        color: var(--vc-fg, #e0e0ff);
        border-radius: 28px;
        box-shadow: 0 4px 20px rgba(0,0,0,.3);
        font-size: 14px;
        font-family: inherit;
        z-index: 10000;
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
        transition: opacity .3s, transform .3s;
      }
      #vc-speaking-indicator.vc-active {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      .vc-speaker-icon {
        display: flex;
        color: #7c6aef;
      }
      /* Animation des ondes sonores */
      .vc-wave {
        opacity: 0;
        animation: vc-wave-pulse 1.2s ease-in-out infinite;
      }
      .vc-wave-1 { animation-delay: 0s; }
      .vc-wave-2 { animation-delay: .3s; }
      @keyframes vc-wave-pulse {
        0%, 100% { opacity: 0; }
        50%      { opacity: 1; }
      }
      .vc-label {
        font-weight: 500;
        letter-spacing: .3px;
      }

      /* ── Bordure pulsante sur les résultats ─────────────── */
      .vc-pulse-border {
        animation: vc-border-pulse 1.5s ease-in-out infinite;
      }
      @keyframes vc-border-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(124,106,239,.0); }
        50%      { box-shadow: 0 0 0 4px rgba(124,106,239,.35); }
      }

      /* ── Surbrillance du texte lu ───────────────────────── */
      .vc-highlight {
        background: rgba(124,106,239,.15) !important;
        border-left: 3px solid #7c6aef !important;
        padding-left: 6px !important;
        transition: background .3s, border .3s;
      }

      /* ── Bouton toggle conversation vocale ──────────────── */
      .vc-toggle-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: var(--vc-btn-bg, #2a2a40);
        color: var(--vc-btn-fg, #aaa);
        cursor: pointer;
        transition: background .2s, color .2s, transform .15s;
      }
      .vc-toggle-btn:hover {
        background: var(--vc-btn-hover, #3a3a55);
        transform: scale(1.08);
      }
      .vc-toggle-btn.vc-on {
        background: var(--vc-btn-active-bg, #7c6aef);
        color: #fff;
      }
      .vc-toggle-btn:focus-visible {
        outline: 2px solid #7c6aef;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Bouton toggle ──────────────────────────────────────────── */

  /** Crée le bouton d'activation / désactivation dans le DOM */
  function _createToggleButton() {
    // Cherche un conteneur adapté, sinon ajoute au body
    const container = document.querySelector(
      '.voice-controls, .search-controls, .toolbar, header nav'
    ) || document.body;

    const btn = document.createElement('button');
    btn.className = 'vc-toggle-btn' + (_enabled ? ' vc-on' : '');
    btn.setAttribute('aria-label', 'Activer ou désactiver les réponses vocales');
    btn.setAttribute('title', 'Réponses vocales');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      _userGesture = true;
      api.toggle();
      btn.classList.toggle('vc-on', _enabled);
    });
    container.appendChild(btn);
    return btn;
  }

  /* ── Construction des réponses intelligentes ────────────────── */

  /**
   * Génère un texte de réponse naturel à partir du contexte de recherche.
   *
   * @param {string}  query       — requête de l'utilisateur
   * @param {number}  count       — nombre de résultats
   * @param {Object}  [context]   — contexte additionnel
   * @param {string}  [context.type]     — type de résultat (musées, formations…)
   * @param {string}  [context.location] — localisation (à Dakar, au Sénégal…)
   * @returns {string}
   */
  function _buildResponseText(query, count, context) {
    context = context || {};
    const type     = context.type     || 'résultats';
    const location = context.location ? ('à ' + context.location) : '';

    if (count === 0) {
      return _fill(_pick(RESPONSE_TEMPLATES.noResults), { query: query });
    }

    return _fill(_pick(RESPONSE_TEMPLATES.results), {
      count:    count,
      type:     type,
      location: location,
      query:    query,
    });
  }

  /**
   * Détermine la question de suivi appropriée au contexte.
   *
   * @param {Object} context
   * @param {number} context.resultCount   — nombre de résultats
   * @param {boolean} context.hasLocation  — position géo disponible ?
   * @param {boolean} context.isFormation  — résultats de type formation ?
   * @returns {string}
   */
  function _buildFollowUp(context) {
    context = context || {};

    if (context.isFormation) {
      return _pick(RESPONSE_TEMPLATES.formation);
    }
    if (context.hasLocation) {
      return _pick(RESPONSE_TEMPLATES.hasLocation);
    }
    if (context.resultCount > 20) {
      return _pick(RESPONSE_TEMPLATES.manyResults);
    }
    if (context.resultCount > 0 && context.resultCount <= 5) {
      return _pick(RESPONSE_TEMPLATES.fewResults);
    }
    return _pick(RESPONSE_TEMPLATES.followUp);
  }

  /* ── API publique ───────────────────────────────────────────── */

  const api = {

    /**
     * Initialise le module : charge la voix française,
     * injecte le CSS, crée le bouton toggle, configure les interruptions.
     *
     * @returns {Promise<void>}
     */
    async init() {
      if (_initialized) return;
      _initialized = true;

      // Charge la préférence utilisateur
      _enabled = _loadPreference();

      // Injection du CSS
      _injectStyles();

      // Écouteurs d'interruption
      _setupInterruptionListeners();

      // Attend et sélectionne la voix française
      _frenchVoice = await _waitForVoices();

      if (_frenchVoice) {
        console.info(
          '[VoiceConversation] Voix sélectionnée :',
          _frenchVoice.name, '(' + _frenchVoice.lang + ')'
        );
      } else {
        console.warn('[VoiceConversation] Aucune voix française trouvée.');
      }

      // Crée le bouton toggle
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _createToggleButton);
      } else {
        _createToggleButton();
      }

      console.info('[VoiceConversation] Module initialisé — activé :', _enabled);
    },

    /**
     * Synthétise vocalement un texte.
     *
     * @param {string} text     — texte à prononcer
     * @param {Object} [options] — voir DEFAULT_OPTIONS
     * @returns {void}
     */
    speak(text, options) {
      if (!text || !_enabled) return;
      if (!window.speechSynthesis) {
        console.warn('[VoiceConversation] SpeechSynthesis non disponible.');
        return;
      }

      const opts = Object.assign({}, DEFAULT_OPTIONS, options || {});

      // Priorité haute = interrompt la parole en cours
      if (opts.priority === 'high') {
        _stop();
      }

      _enqueue(text, opts);
    },

    /**
     * Prononce une réponse intelligente après une recherche.
     *
     * @param {string} query        — requête utilisateur
     * @param {number} resultCount  — nombre de résultats
     * @param {Object} [context]    — { type, location }
     */
    speakResponse(query, resultCount, context) {
      const text = _buildResponseText(query, resultCount, context);
      api.speak(text, { priority: 'high' });
    },

    /**
     * Prononce une question de suivi adaptée au contexte.
     *
     * @param {Object} context — { resultCount, hasLocation, isFormation }
     */
    speakFollowUp(context) {
      const text = _buildFollowUp(context);
      // Petit délai pour laisser respirer la conversation
      setTimeout(() => api.speak(text), 600);
    },

    /**
     * Prononce un message d'accueil aléatoire.
     */
    speakGreeting() {
      api.speak(_pick(RESPONSE_TEMPLATES.greeting), { priority: 'high' });
    },

    /**
     * Arrête la parole en cours et vide la file.
     */
    stop() {
      _stop();
    },

    /**
     * Met en pause la parole en cours.
     */
    pause() {
      if (!window.speechSynthesis || !_speaking) return;
      speechSynthesis.pause();
      _paused = true;
    },

    /**
     * Reprend la parole mise en pause.
     */
    resume() {
      if (!window.speechSynthesis || !_paused) return;
      speechSynthesis.resume();
      _paused = false;
    },

    /**
     * Active ou désactive le mode conversation vocale.
     *
     * @returns {boolean} nouvel état
     */
    toggle() {
      _enabled = !_enabled;
      _savePreference(_enabled);

      if (!_enabled) {
        _stop();
      }

      console.info('[VoiceConversation] Mode conversationnel :', _enabled ? 'activé' : 'désactivé');
      return _enabled;
    },

    /** Le mode conversation est-il activé ? */
    get isEnabled() {
      return _enabled;
    },

    /** Le moteur TTS est-il en train de parler ? */
    get isSpeaking() {
      return _speaking;
    },

    /** Le navigateur supporte-t-il SpeechSynthesis ? */
    get isSupported() {
      return 'speechSynthesis' in window;
    },

    /** Callback déclenché à la fin de chaque parole */
    get onEnd() {
      return _onEndCallback;
    },
    set onEnd(fn) {
      _onEndCallback = typeof fn === 'function' ? fn : null;
    },
  };

  return api;

})();
