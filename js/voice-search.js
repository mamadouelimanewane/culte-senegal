/* ════════════════════════════════════════════════════════════════
   CULTE — Recherche Vocale IA Multilingue (Français + Wolof)
   Reconnaissance vocale, traduction Wolof, feedback visuel
   ════════════════════════════════════════════════════════════════ */
'use strict';

const VoiceSearch = (() => {

  /* ── Dictionnaire Wolof → Français (termes culturels) ───────── */
  const WOLOF_DICT = {
    // Lieux & bâtiments
    'keur':         'maison',
    'keur gi':      'la maison',
    'daara':        'école coranique',
    'ekol':         'école',
    'lopital':      'hôpital',
    'dukaan':       'boutique',

    // Culture & arts
    'cosaan':       'tradition',
    'cosaan yi':    'les traditions',
    'ndaje':        'réunion',
    'diom':         'dignité',
    'teranga':      'hospitalité',
    'xam-xam':     'savoir',
    'xam xam':     'savoir',
    'liggey':       'travail',
    'liggey bi':    'le travail',
    'tey':          'aujourd\'hui',
    'demb':         'hier',
    'suba':         'demain',
    'jang':         'étudier',
    'jang bi':      'l\'étude',
    'jangat':       'enseigner',
    'jangatkat':    'enseignant',
    'bind':         'écrire',
    'bindkat':      'écrivain',

    // Musique & danse
    'sabar':        'danse sabar',
    'sabar bi':     'la danse sabar',
    'tama':         'tambour tama',
    'tama bi':      'le tambour tama',
    'kora':         'kora',
    'kora bi':      'la kora',
    'xalam':        'xalam',
    'xalam bi':     'le xalam',
    'djembe':       'djembé',
    'tabala':       'tambour',
    'mbalax':       'mbalax',
    'ndawrabine':   'danse traditionnelle',
    'woykat':       'chanteur',
    'tubaab':       'étranger',
    'gewel':        'griot',
    'griot':        'griot',

    // Artisanat
    'mbay':         'artisan',
    'rabb':         'tisser',
    'rabbkat':      'tisserand',
    'wudd':         'bijou',
    'teeré':        'livre',
    'teere':        'livre',
    'teere bi':     'le livre',
    'nataal':       'image',
    'nataal bi':    'l\'image',
    'dessin':       'dessin',

    // Régions & villes (prononciation wolof)
    'ndakaaru':     'Dakar',
    'ndar':         'Saint-Louis',
    'saloum':       'Kaolack',
    'casa':         'Ziguinchor',
    'casamance':    'Ziguinchor',
    'fuuta':        'Matam',
    'jolof':        'Louga',
    'kajoor':       'Thiès',
    'baol':         'Diourbel',
    'siin':         'Fatick',
    'pakao':        'Kolda',
    'kaabu':        'Sédhiou',
    'tamba':        'Tambacounda',

    // Types d'infrastructures
    'tele':         'cinéma',
    'film':         'cinéma',
    'filme':        'cinéma',
    'musee':        'musée',
    'galeeri':      'galerie',
    'bibliotek':    'bibliothèque',
    'espaas':       'espace',
    'salle':        'salle',
    'plas':         'place',
    'tuur':         'tour',

    // Actions de recherche
    'seet':         'chercher',
    'seetlu':       'rechercher',
    'giis':         'voir',
    'gis':          'voir',
    'wone ma':      'montre-moi',
    'won ma':       'montre-moi',
    'baal ma':      'excusez-moi',
    'nanga def':    'bonjour',
    'mangi fi':     'je suis là',
    'fan la':       'où est',
    'fan la nekk':  'où se trouve',
    'ana':          'où est',
    'ana li':       'où est ça',
    'lu bari':      'beaucoup',
    'nak':          'combien',
    'nata':         'combien',
    'nata lay':     'combien y en a',
    'fu nekk':      'partout',
    'ci':           'à',
    'ci biir':      'à l\'intérieur',
    'ci biti':      'à l\'extérieur',
    'dees':         'chercher',

    // Milieu
    'dek bi':       'le village',
    'dek':          'village',
    'ville bi':     'la ville',
    'gaaw':         'rapide',
    'yengu':        'danser',
    'fecc':         'danser',
    'fecckat':      'danseur',
    'degg':         'entendre',
    'deglu':        'écouter',
  };

  /* ── Expressions / phrases complètes Wolof ──────────────────── */
  const WOLOF_PHRASES = [
    { pattern: /fan\s*la\s*(nekk\s*)?(.+)/i, template: 'où est $2' },
    { pattern: /ana\s+(.+)/i, template: 'où est $1' },
    { pattern: /won\s*ma\s+(.+)/i, template: 'montre-moi $1' },
    { pattern: /wone\s*ma\s+(.+)/i, template: 'montre-moi $1' },
    { pattern: /nata\s+(.+)/i, template: 'combien de $1' },
    { pattern: /nata\s*lay\s+(.+)/i, template: 'combien de $1' },
    { pattern: /seet(lu)?\s+(.+)/i, template: 'chercher $2' },
    { pattern: /dama\s+buga\s+(.+)/i, template: 'je veux $1' },
    { pattern: /dama\s+seet\s+(.+)/i, template: 'je cherche $1' },
    { pattern: /lu\s+am\s+ci\s+(.+)/i, template: 'qu\'y a-t-il à $1' },
  ];

  /* ── Normalisation Wolof ────────────────────────────────────── */
  function normalizeWolof(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`]/g, "'")
      .trim();
  }

  /* ── Traduction Wolof → Français ───────────────────────────── */
  function translateWolofToFrench(text) {
    let result = normalizeWolof(text);
    let translated = false;

    // 1. Tenter les phrases complètes d'abord
    for (const { pattern, template } of WOLOF_PHRASES) {
      const match = result.match(pattern);
      if (match) {
        result = template.replace(/\$(\d)/g, (_, n) => match[parseInt(n)] || '');
        translated = true;
        break;
      }
    }

    // 2. Remplacer les mots wolof individuels (tri par longueur décroissante)
    const sortedEntries = Object.entries(WOLOF_DICT)
      .sort((a, b) => b[0].length - a[0].length);

    for (const [wolof, french] of sortedEntries) {
      const wNorm = normalizeWolof(wolof);
      const regex = new RegExp(`\\b${wNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, french);
        translated = true;
      }
    }

    return { text: result.trim(), wasTranslated: translated };
  }

  /* ── Détection de langue ────────────────────────────────────── */
  function detectLanguage(text) {
    const t = normalizeWolof(text);
    const wolofMarkers = [
      'nanga def', 'mangi fi', 'fan la', 'ana', 'won ma', 'wone ma',
      'dama', 'nata', 'seetlu', 'seet', 'nekk', 'fu nekk',
      'ci biir', 'ci biti', 'bari', 'nak', 'dees', 'deglu',
      'fecc', 'yengu', 'buga', 'am ci',
    ];
    let wolofScore = 0;
    for (const marker of wolofMarkers) {
      if (t.includes(marker)) wolofScore += 2;
    }

    // Mots wolof individuels
    const words = t.split(/\s+/);
    for (const w of words) {
      if (WOLOF_DICT[w]) wolofScore += 1;
    }

    return {
      language: wolofScore >= 2 ? 'wo' : 'fr',
      confidence: Math.min(1, wolofScore / 5),
      wolofScore,
    };
  }

  /* ── État global de la voix ─────────────────────────────────── */
  let _isListening = false;
  let _currentRec = null;
  let _activeInput = null;
  let _overlay = null;
  let _supported = false;
  let _SRClass = null;

  function isSupported() {
    if (_SRClass) return true;
    _SRClass = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    _supported = !!_SRClass;
    return _supported;
  }

  /* ── Créer l'overlay visuel de la voix ─────────────────────── */
  function createOverlay() {
    if (_overlay) return _overlay;

    const div = document.createElement('div');
    div.id = 'voiceOverlay';
    div.className = 'voice-overlay';
    div.innerHTML = `
      <div class="voice-backdrop"></div>
      <div class="voice-panel">
        <div class="voice-wave-container">
          <div class="voice-wave">
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
          </div>
          <div class="voice-mic-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
        </div>
        <div class="voice-status" id="voiceStatus">Parlez maintenant...</div>
        <div class="voice-transcript" id="voiceTranscript"></div>
        <div class="voice-lang-pills">
          <span class="voice-lang-pill active" data-lang="fr">🇫🇷 Français</span>
          <span class="voice-lang-pill" data-lang="wo">🇸🇳 Wolof</span>
        </div>
        <div class="voice-actions">
          <button class="voice-cancel-btn" id="voiceCancelBtn">Annuler</button>
          <button class="voice-search-btn hidden" id="voiceSearchBtn">🔍 Rechercher</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    // Events
    div.querySelector('.voice-backdrop').addEventListener('click', stopListening);
    div.querySelector('#voiceCancelBtn').addEventListener('click', stopListening);
    div.querySelector('#voiceSearchBtn').addEventListener('click', confirmSearch);

    // Sélection de la langue
    div.querySelectorAll('.voice-lang-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        div.querySelectorAll('.voice-lang-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        // Redémarrer avec la nouvelle langue
        if (_isListening) {
          stopRecognition();
          setTimeout(() => startRecognition(pill.dataset.lang), 200);
        }
      });
    });

    _overlay = div;
    return div;
  }

  /* ── Démarrer l'écoute ──────────────────────────────────────── */
  function startListening(inputEl) {
    if (!isSupported()) return;
    _activeInput = inputEl;

    const overlay = createOverlay();
    overlay.classList.add('active');
    document.getElementById('voiceTranscript').textContent = '';
    document.getElementById('voiceSearchBtn').classList.add('hidden');
    document.getElementById('voiceStatus').textContent = 'Parlez maintenant...';

    // Déterminer la langue initiale
    const activeLang = overlay.querySelector('.voice-lang-pill.active');
    const lang = activeLang ? activeLang.dataset.lang : 'fr';

    startRecognition(lang);
  }

  /* ── Démarrer la reconnaissance ─────────────────────────────── */
  function startRecognition(lang) {
    if (_currentRec) {
      try { _currentRec.abort(); } catch(e) {}
    }

    const rec = new _SRClass();
    // Pour le Wolof, on utilise fr-FR car la plupart des navigateurs
    // ne supportent pas 'wo'. On traduit ensuite via le dictionnaire.
    rec.lang = lang === 'wo' ? 'fr-FR' : 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    let finalTranscript = '';
    let interimTranscript = '';

    rec.onstart = () => {
      _isListening = true;
      const overlay = document.getElementById('voiceOverlay');
      if (overlay) overlay.classList.add('listening');
      document.getElementById('voiceStatus').textContent =
        lang === 'wo' ? '🇸🇳 Parlez en Wolof...' : '🇫🇷 Parlez en Français...';
    };

    rec.onresult = (e) => {
      interimTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const display = finalTranscript + interimTranscript;
      const transcriptEl = document.getElementById('voiceTranscript');
      const statusEl = document.getElementById('voiceStatus');

      if (display.trim()) {
        // Détecter automatiquement la langue
        const langDetect = detectLanguage(display);
        if (langDetect.language === 'wo' && langDetect.confidence > 0.3) {
          const translated = translateWolofToFrench(display);
          transcriptEl.innerHTML = `
            <div class="voice-original">${escVoice(display.trim())}</div>
            ${translated.wasTranslated ? `<div class="voice-translated">→ ${escVoice(translated.text)}</div>` : ''}
          `;
          // Auto-switch le pill
          const overlay = document.getElementById('voiceOverlay');
          if (overlay) {
            overlay.querySelectorAll('.voice-lang-pill').forEach(p => p.classList.remove('active'));
            const woPill = overlay.querySelector('[data-lang="wo"]');
            if (woPill) woPill.classList.add('active');
          }
          statusEl.textContent = '🇸🇳 Wolof détecté — traduction IA active';
        } else {
          transcriptEl.innerHTML = `<div class="voice-original">${escVoice(display.trim())}</div>`;
          statusEl.textContent = '🇫🇷 Écoute en cours...';
        }

        document.getElementById('voiceSearchBtn').classList.remove('hidden');
      }
    };

    rec.onerror = (e) => {
      const statusEl = document.getElementById('voiceStatus');
      if (e.error === 'no-speech') {
        statusEl.textContent = 'Aucun son détecté. Réessayez.';
      } else if (e.error === 'audio-capture') {
        statusEl.textContent = 'Microphone non disponible.';
      } else if (e.error === 'not-allowed') {
        statusEl.textContent = 'Accès au micro refusé. Activez dans les paramètres.';
      } else {
        statusEl.textContent = 'Erreur. Réessayez.';
      }
    };

    rec.onend = () => {
      _isListening = false;
      const overlay = document.getElementById('voiceOverlay');
      if (overlay) overlay.classList.remove('listening');

      // Auto-recherche si on a un résultat final
      if (finalTranscript.trim()) {
        document.getElementById('voiceStatus').textContent = 'Traitement IA...';
        setTimeout(() => processVoiceResult(finalTranscript.trim()), 300);
      }
    };

    _currentRec = rec;
    try {
      rec.start();
    } catch(e) {
      console.warn('[VoiceSearch] Start error:', e);
    }
  }

  function escVoice(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ── Traiter le résultat vocal ──────────────────────────────── */
  function processVoiceResult(rawText) {
    // Détecter la langue et traduire si nécessaire
    const langDetect = detectLanguage(rawText);
    let searchText = rawText;

    if (langDetect.language === 'wo' || langDetect.confidence > 0.2) {
      const translated = translateWolofToFrench(rawText);
      if (translated.wasTranslated) {
        searchText = translated.text;
      }
    }

    // Afficher le résultat traité
    const transcriptEl = document.getElementById('voiceTranscript');
    if (transcriptEl && langDetect.language === 'wo') {
      transcriptEl.innerHTML = `
        <div class="voice-original">🗣 "${escVoice(rawText)}"</div>
        <div class="voice-translated">🤖 → "${escVoice(searchText)}"</div>
      `;
    }

    // Exécuter la recherche
    executeSearch(searchText, rawText);
  }

  /* ── Confirmer la recherche (bouton) ────────────────────────── */
  function confirmSearch() {
    const transcriptEl = document.getElementById('voiceTranscript');
    const originalEl = transcriptEl?.querySelector('.voice-original');
    const translatedEl = transcriptEl?.querySelector('.voice-translated');

    let rawText = '';
    if (originalEl) rawText = originalEl.textContent.replace(/^[🗣"]+|["]+$/g, '').trim();

    const langDetect = detectLanguage(rawText);
    let searchText = rawText;
    if (langDetect.language === 'wo') {
      const translated = translateWolofToFrench(rawText);
      if (translated.wasTranslated) searchText = translated.text;
    }

    executeSearch(searchText, rawText);
  }

  /* ── Exécuter la recherche IA ───────────────────────────────── */
  function executeSearch(searchText, rawText) {
    // Sauvegarder dans l'historique
    if (typeof NLP !== 'undefined') NLP.saveHistory(rawText || searchText);

    // Remplir l'input actif
    if (_activeInput) {
      _activeInput.value = searchText;
    }

    // Router vers la bonne recherche
    if (typeof state !== 'undefined' && state.activeTab === 'explore') {
      const ms = document.getElementById('mapSearch');
      if (ms) {
        ms.value = searchText;
        const clearBtn = document.getElementById('mapSearchClear');
        if (clearBtn) clearBtn.classList.remove('hidden');
      }
      if (typeof runNlpSearch === 'function') runNlpSearch(searchText);
    } else {
      const hs = document.getElementById('homeSearch');
      if (hs) hs.value = searchText;
      const ls = document.getElementById('listSearch');
      if (ls) ls.value = searchText;
      if (typeof switchTab === 'function') switchTab('list');
      if (typeof NLP !== 'undefined' && NLP.applyToListTab) NLP.applyToListTab(searchText);
    }

    // Fermer l'overlay
    hideOverlay();
  }

  /* ── Stopper l'écoute ──────────────────────────────────────── */
  function stopListening() {
    stopRecognition();
    hideOverlay();
  }

  function stopRecognition() {
    if (_currentRec) {
      try { _currentRec.abort(); } catch(e) {}
      _currentRec = null;
    }
    _isListening = false;
  }

  function hideOverlay() {
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) {
      overlay.classList.remove('active', 'listening');
    }
  }

  /* ── Attacher aux boutons mic ──────────────────────────────── */
  function attachToMicButtons() {
    if (!isSupported()) {
      document.querySelectorAll('.mic-btn, .voice-trigger').forEach(btn => {
        btn.style.opacity = '.35';
        btn.title = 'Votre navigateur ne supporte pas la reconnaissance vocale';
      });
      return;
    }

    // Bouton mic principal (home)
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
      // Supprimer les anciens listeners (clone)
      const newBtn = micBtn.cloneNode(true);
      micBtn.parentNode.replaceChild(newBtn, micBtn);
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById('homeSearch');
        startListening(input);
      });
    }

    // Ajouter des boutons mic aux autres barres de recherche
    addMicButton('mapSearch');
    addMicButton('listSearch');
    addMicButton('dtSearch');
  }

  function addMicButton(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // Vérifier si un mic button existe déjà
    const parent = input.parentElement;
    if (parent.querySelector('.voice-trigger')) return;

    const btn = document.createElement('button');
    btn.className = 'voice-trigger';
    btn.innerHTML = '🎤';
    btn.title = 'Recherche vocale FR/Wolof';
    btn.setAttribute('aria-label', 'Recherche vocale');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startListening(input);
    });

    // Insérer après l'input
    if (input.nextSibling) {
      parent.insertBefore(btn, input.nextSibling);
    } else {
      parent.appendChild(btn);
    }
  }

  /* ── API publique ───────────────────────────────────────────── */
  return {
    init: attachToMicButtons,
    startListening,
    stopListening,
    translateWolofToFrench,
    detectLanguage,
    get isListening() { return _isListening; },
    get isSupported() { return isSupported(); },
    WOLOF_DICT,
  };

})();
