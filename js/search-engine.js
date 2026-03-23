/* ════════════════════════════════════════════════════════════════
   CULTE — Moteur de Recherche IA par Langage Naturel
   Full-text index, fuzzy matching, TF-IDF scoring, NLP intents
   ════════════════════════════════════════════════════════════════ */
'use strict';

const SearchEngine = (() => {

  /* ── Constantes ─────────────────────────────────────────────── */
  const FUZZY_THRESHOLD = 0.72;      // Similarité min pour fuzzy match
  const MAX_RESULTS     = 200;       // Résultats max retournés
  const BOOST = {
    exactName:     25,    // Nom exact match
    nameStart:     18,    // Nom commence par le terme
    nameContains:  10,    // Nom contient le terme
    typeMatch:     12,    // Type correspond
    regionMatch:   10,    // Région correspond
    communeMatch:   8,    // Commune correspond
    deptMatch:      5,    // Département correspond
    localiteMatch:  4,    // Localité correspond
    milieuMatch:    3,    // Milieu correspond
    fuzzyName:      6,    // Fuzzy match sur nom
    fuzzyCom:       4,    // Fuzzy match sur commune
    tfidf:          2,    // Bonus TF-IDF
  };

  /* ── Prefix index pour recherche rapide O(1) au lieu de O(n) ── */
  let _prefixMap = {};  // prefix → Set de tokens complets
  function _buildPrefixMap() {
    _prefixMap = {};
    for (const token of Object.keys(_index)) {
      for (let len = 2; len <= Math.min(token.length, 8); len++) {
        const prefix = token.substring(0, len);
        if (!_prefixMap[prefix]) _prefixMap[prefix] = [];
        _prefixMap[prefix].push(token);
      }
    }
  }
  function _getPrefixTokens(prefix) {
    return _prefixMap[prefix] || [];
  }

  /* ── Normalisation avancée ──────────────────────────────────── */
  function normalize(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`]/g, "'")
      .replace(/[-_]/g, ' ')
      .trim();
  }

  /* Tokenize en mots significatifs (> 1 char) */
  function tokenize(s) {
    return normalize(s).split(/\s+/).filter(w => w.length > 1);
  }

  /* ── Distance de Levenshtein optimisée ─────────────────────── */
  function levenshtein(a, b) {
    if (a === b) return 0;
    const la = a.length, lb = b.length;
    if (!la) return lb;
    if (!lb) return la;
    // Early exit si trop différent
    if (Math.abs(la - lb) > Math.max(la, lb) * 0.4) return Math.max(la, lb);
    const row = Array.from({ length: lb + 1 }, (_, i) => i);
    for (let i = 1; i <= la; i++) {
      let prev = i;
      for (let j = 1; j <= lb; j++) {
        const val = a[i - 1] === b[j - 1] ? row[j - 1] : 1 + Math.min(row[j - 1], prev, row[j]);
        row[j - 1] = prev;
        prev = val;
      }
      row[lb] = prev;
    }
    return row[lb];
  }

  function similarity(a, b) {
    // Fast reject : si la différence de longueur dépasse le seuil, pas besoin de calculer
    const maxLen = Math.max(a.length, b.length, 1);
    if (Math.abs(a.length - b.length) > maxLen * (1 - FUZZY_THRESHOLD)) return 0;
    if (a === b) return 1;
    const d = levenshtein(a, b);
    return 1 - d / maxLen;
  }

  /* ── Synonymes enrichis (FR + Wolof + variantes) ─────────── */
  const SYNONYMS = {
    // Types d'infrastructure — FR complet
    'musee':        ['musee', 'musees', 'muse', 'museum', 'patrimoine', 'exposition', 'expo', 'expos', 'artefact', 'monument', 'site historique', 'collection', 'antiquite'],
    'galerie':      ['galerie', 'galeries', 'art', 'exposition', 'expo', 'vernissage', 'gallery', 'atelier', 'atelier artistique', 'studio', 'sculpture', 'sculpteur', 'ceramique'],
    'cinema':       ['cinema', 'cinemas', 'cine', 'cine-club', 'film', 'films', 'projection', 'ecran', 'salle obscure', 'movie', 'tele', 'filme'],
    'bibliotheque': ['bibliotheque', 'bibliotheques', 'biblio', 'bibliobus', 'livre', 'livres', 'lecture', 'lire', 'documentation', 'mediatheque', 'centre de lecture', 'salle de lecture', 'teere', 'jang', 'bind', 'bindkat'],
    'spectacle':    ['spectacle', 'spectacles', 'theatre', 'theatres', 'scene', 'concert', 'concerts', 'festival', 'festivals', 'danse', 'danses', 'representation', 'show', 'salle de spectacle', 'salle de theatre', 'salle de concert', 'conservatoire', 'fecc', 'fecckat', 'yengu', 'taasu', 'bakk', 'slam', 'poesie', 'chorale'],
    'fete':         ['fete', 'fetes', 'salle des fetes', 'salle polyvalente', 'salle communautaire', 'celebration', 'evenement', 'reception', 'ceremonie'],
    'jeunes':       ['jeunes', 'jeunesse', 'foyer des jeunes', 'maison des jeunes', 'mjc', 'espace jeunes', 'ado', 'adolescent', 'youth'],
    'femmes':       ['femmes', 'foyer des femmes', 'feminin', 'feminine', 'woman', 'women', 'espace femmes', 'jigeen', 'ndey'],
    'artisanal':    ['artisan', 'artisanal', 'artisanat', 'village artisanal', 'craft', 'metier', 'tapisserie', 'poterie', 'bijoux', 'couture', 'broderie', 'teinture', 'vannerie', 'tissage', 'forge', 'orfevrer', 'maroquinerie', 'cuir', 'bois', 'mbay', 'rabb', 'rabbkat', 'wudd'],
    // Formations — FR complet
    'formation':    ['formation', 'formations', 'ecole', 'ecoles', 'cours', 'apprentissage', 'enseignement', 'etude', 'etudes', 'academie', 'institut', 'conservatoire', 'atelier de', 'stage', 'daara', 'jangat', 'jangatkat', 'ekol', 'taalib', 'talibe'],
    'arts':         ['arts', 'art', 'artistique', 'beaux-arts', 'creation', 'creatif'],
    'audiovisuel':  ['audiovisuel', 'audio', 'video', 'son', 'image', 'multimedia', 'media', 'studio d\'enregistrement', 'studio de musique', 'montage', 'realisation', 'reportage'],
    'peinture':     ['peinture', 'peindre', 'peintre', 'tableau', 'toile', 'dessin', 'aquarelle', 'fresque', 'murale', 'huile', 'acrylique', 'nataal'],
    'musique':      ['musique', 'musical', 'musicien', 'instrument', 'chant', 'chanter', 'melodie', 'rythme', 'djembe', 'kora', 'sabar', 'tama', 'xalam', 'mbalax', 'woykat', 'tabala', 'ndawrabine', 'guitare', 'percussion', 'balafon', 'harmonie', 'chorale'],
    'theatre_form': ['theatre', 'comedien', 'comedie', 'acteur', 'dramatique', 'scenique', 'mise en scene', 'improvisation', 'marionnette'],
    'serigraphie':  ['serigraphie', 'impression', 'textile', 'imprimerie', 'print', 'estampe', 'gravure', 'teinture'],
    'infographie':  ['infographie', 'graphisme', 'graphique', 'design', 'web', 'numerique', 'digital', 'informatique', 'pao', 'illustration', 'logo'],
    // Wolof / langues locales — enrichi massivement
    'wolof_culture':['tey', 'cosaan', 'thiossane', 'diom', 'xam-xam', 'xam xam', 'liggey', 'ndaje', 'teranga', 'gewel', 'griot', 'nguewel', 'ndigel', 'baye fall'],
    'culture':      ['culture', 'culturel', 'culturelle', 'centre culturel', 'maison de la culture', 'maison culture', 'espace culturel', 'socioculturel', 'socio-culturel', 'complexe culturel', 'asso culturelle', 'association culturelle', 'marabout', 'serin', 'dahira', 'gamou', 'magal', 'ziarra', 'xam xam', 'xam-xam'],
    // Milieu
    'urbain':       ['urbain', 'ville', 'cite', 'urban', 'metropole', 'centre-ville', 'centre ville', 'downtown', 'quartier'],
    'rural':        ['rural', 'campagne', 'village', 'brousse', 'rurale', 'dek', 'terroir'],
  };

  /* Dictionnaire inversé synonyme → catégorie */
  const SYN_INDEX = {};
  for (const [cat, words] of Object.entries(SYNONYMS)) {
    for (const w of words) {
      const nw = normalize(w);
      if (!SYN_INDEX[nw]) SYN_INDEX[nw] = [];
      SYN_INDEX[nw].push(cat);
    }
  }

  /* ── Mapping catégorie → type réel ──────────────────────────── */
  const CAT_TO_TYPE = {
    'musee':        ['Musée'],
    'galerie':      ['Galerie'],
    'cinema':       ['Cinéma'],
    'bibliotheque': ['Bibliothèque'],
    'spectacle':    ['Salle de spectacle'],
    'fete':         ['Salle des fêtes'],
    'jeunes':       ['Foyer des jeunes'],
    'femmes':       ['Foyer des femmes'],
    'artisanal':    ['Village artisanal'],
    'culture':      ['Centre culturel', 'Maison de la culture'],
  };

  const CAT_TO_FORMATION = {
    'formation': true, 'arts': true, 'audiovisuel': true,
    'peinture': true, 'musique': true, 'theatre_form': true,
    'serigraphie': true, 'infographie': true,
  };

  const CAT_TO_BRANCHE = {
    'arts':         'ARTS',
    'audiovisuel':  'AUDIOVISUEL',
    'peinture':     'PEINTURE',
    'musique':      'MUSIQUE',
    'theatre_form': 'THEATRE',
    'serigraphie':  'SERIGRAPHIE',
    'infographie':  'INFOGRAPHIE',
  };

  /* ── Régions avec alias ─────────────────────────────────────── */
  const REGION_ALIASES = {
    'dakar':          'DAKAR',
    'ndakaaru':       'DAKAR',
    'ndar':           'SAINT LOUIS',
    'saint louis':    'SAINT LOUIS',
    'saint-louis':    'SAINT LOUIS',
    'saintlouis':     'SAINT LOUIS',
    'st louis':       'SAINT LOUIS',
    'thies':          'THIES',
    'thiess':         'THIES',
    'kajoor':         'THIES',
    'diourbel':       'DIOURBEL',
    'touba':          'DIOURBEL',
    'baol':           'DIOURBEL',
    'fatick':         'FATICK',
    'siin':           'FATICK',
    'kaolack':        'KAOLACK',
    'saloum':         'KAOLACK',
    'kaffrine':       'KAFFRINE',
    'ziguinchor':     'ZIGUINCHOR',
    'ziguin':         'ZIGUINCHOR',
    'casa':           'ZIGUINCHOR',
    'casamance':      'ZIGUINCHOR',
    'kolda':          'KOLDA',
    'pakao':          'KOLDA',
    'sedhiou':        'SEDHIOU',
    'tambacounda':    'TAMBACOUNDA',
    'tamba':          'TAMBACOUNDA',
    'kedougou':       'KEDOUGOU',
    'louga':          'LOUGA',
    'jolof':          'LOUGA',
    'matam':          'MATAM',
    'fuuta':          'MATAM',
    // Villes / localités connues → région correspondante
    'goree':          'DAKAR',
    'ile de goree':   'DAKAR',
    'mbour':          'THIES',
    'saly':           'THIES',
    'joal':           'FATICK',
    'joal fadiouth':  'FATICK',
    'podor':          'SAINT LOUIS',
    'dagana':         'SAINT LOUIS',
    'richard-toll':   'SAINT LOUIS',
    'richard toll':   'SAINT LOUIS',
    'tivaouane':      'THIES',
    'oussouye':       'ZIGUINCHOR',
    'cap skirring':   'ZIGUINCHOR',
    'bignona':        'ZIGUINCHOR',
    'velingara':      'KOLDA',
    'nioro du rip':   'KAOLACK',
    'nioro':          'KAOLACK',
    'linguere':       'LOUGA',
    'kebemer':        'LOUGA',
    'raneriou':       'MATAM',
    'kanel':          'MATAM',
    'salemata':       'KEDOUGOU',
    'saraya':         'KEDOUGOU',
    'mbirkilane':     'KAFFRINE',
    'koungheul':      'KAFFRINE',
    'goudomp':        'SEDHIOU',
    'bounkiling':     'SEDHIOU',
    'bakel':          'TAMBACOUNDA',
    'goudiry':        'TAMBACOUNDA',
    'koumpentoum':    'TAMBACOUNDA',
    'bambey':         'DIOURBEL',
    'mbacke':         'DIOURBEL',
    'pikine':         'DAKAR',
    'guediawaye':     'DAKAR',
    'rufisque':       'DAKAR',
    'parcelles':      'DAKAR',
    'medina':         'DAKAR',
    'plateau':        'DAKAR',
    'almadies':       'DAKAR',
    'ouakam':         'DAKAR',
    'yoff':           'DAKAR',
    'grand dakar':    'DAKAR',
    'grand yoff':     'DAKAR',
    'hann':           'DAKAR',
    'fann':           'DAKAR',
    'ngor':           'DAKAR',
    'thiaroye':       'DAKAR',
    'keur massar':    'DAKAR',
    'diamniadio':     'DAKAR',
    'sangalkam':      'DAKAR',
  };

  /* ── Index inversé & TF-IDF ─────────────────────────────────── */
  let _index = {};           // token → [{docId, field, tf}]
  let _docs  = [];           // docId → { rec, isFormation, fields: {name, type, region, ...} }
  let _idf   = {};           // token → idf score
  let _ready = false;
  let _nextDocId = 0;        // Auto-increment pour les nouveaux docs
  let _listeners = [];       // Callbacks notifiés lors de changements d'index
  let _idfDirty = false;     // IDF doit être recalculé

  /* ── Créer un objet document indexable ─────────────────────── */
  function _makeDoc(id, rec, isFormation) {
    const name     = rec.DESIGNATION || rec.NOM_ETABLISSEMENT || '';
    const typeKey  = isFormation ? (rec.BRANCHE || '') : getInfraTypeSearch(rec);
    const region   = rec.REGION || '';
    const dept     = rec.DEPARTEMENT || '';
    const commune  = rec.COMMUNE || rec.LOCALITE || '';
    const localite = rec.LOCALITES || rec.LOCALITE || '';
    const milieu   = rec.MILIEU || '';
    const thematique = rec.THEMATIQUE || '';
    const descriptif = rec.DESCRIPTIF || '';

    return {
      id, rec, isFormation,
      fields: { name, typeKey, region, dept, commune, localite, milieu, thematique, descriptif },
      _nameNorm:     normalize(name),
      _nameWords:    normalize(name).split(/\s+/).filter(w => w.length > 1),
      _communeNorm:  normalize(commune),
      _regionNorm:   normalize(region),
      _regionUpper:  region.toUpperCase(),
      _deptNorm:     normalize(dept),
      _localiteNorm: normalize(localite),
      _typeNorm:     normalize(typeKey),
      _milieuNorm:   normalize(milieu),
    };
  }

  /* ── Indexer les tokens d'un document ──────────────────────── */
  function _indexDocTokens(doc) {
    const fieldTexts = {
      name:      doc.fields.name,
      type:      doc.fields.typeKey + ' ' + doc.fields.thematique + ' ' + doc.fields.descriptif,
      region:    doc.fields.region,
      dept:      doc.fields.dept,
      commune:   doc.fields.commune,
      localite:  doc.fields.localite,
    };

    for (const [field, text] of Object.entries(fieldTexts)) {
      const tokens = tokenize(text);
      const freq = {};
      for (const t of tokens) {
        freq[t] = (freq[t] || 0) + 1;
      }
      for (const [token, count] of Object.entries(freq)) {
        if (!_index[token]) _index[token] = [];
        _index[token].push({ docId: doc.id, field, tf: count / tokens.length });
      }
    }
  }

  /* ── Retirer les tokens d'un document de l'index inversé ──── */
  function _unindexDocTokens(docId) {
    for (const token of Object.keys(_index)) {
      _index[token] = _index[token].filter(p => p.docId !== docId);
      if (_index[token].length === 0) {
        delete _index[token];
      }
    }
  }

  /* ── Recalculer IDF (appelé automatiquement quand nécessaire) ── */
  function _recomputeIDF() {
    const N = _docs.length;
    _idf = {};
    for (const [token, postings] of Object.entries(_index)) {
      const df = new Set(postings.map(p => p.docId)).size;
      _idf[token] = Math.log(1 + N / df);
    }
    _idfDirty = false;
  }

  /* ── Notifier les listeners d'un changement ────────────────── */
  function _notifyChange(type, doc, meta) {
    // Recomputer IDF si sale
    if (_idfDirty) _recomputeIDF();
    // Dispatch
    const event = { type, doc, meta, timestamp: Date.now(), totalDocs: _docs.length };
    for (const fn of _listeners) {
      try { fn(event); } catch(e) { console.warn('[SearchEngine] Listener error:', e); }
    }
  }

  /* ── Construction complète de l'index (initial) ────────────── */
  function buildIndex(infrastructures, formations) {
    _index = {};
    _docs  = [];
    _idf   = {};
    _nextDocId = 0;

    // Indexer toutes les infrastructures
    for (const rec of infrastructures) {
      const doc = _makeDoc(_nextDocId++, rec, false);
      _docs.push(doc);
      _indexDocTokens(doc);
    }
    // Indexer toutes les formations
    for (const rec of formations) {
      const doc = _makeDoc(_nextDocId++, rec, true);
      _docs.push(doc);
      _indexDocTokens(doc);
    }

    // Calculer IDF + prefix map
    _recomputeIDF();
    _buildPrefixMap();

    _ready = true;
    console.log(`[SearchEngine] Index construit: ${_docs.length} documents, ${Object.keys(_index).length} tokens, ${Object.keys(_prefixMap).length} prefixes`);
    _notifyChange('rebuild', null, { infraCount: infrastructures.length, formCount: formations.length });
  }

  /* ══════════════════════════════════════════════════════════════
     INDEXATION TEMPS RÉEL — Ajouter, Modifier, Supprimer
     ══════════════════════════════════════════════════════════════ */

  /**
   * Ajouter un seul enregistrement à l'index en temps réel.
   * @param {object}  rec          — Objet brut (DESIGNATION, REGION, etc.)
   * @param {boolean} isFormation  — true si formation, false si infrastructure
   * @param {string}  [source]     — Source optionnelle (ex: 'user', 'api', 'sync')
   * @returns {object} Le document indexé (avec doc.id)
   */
  function indexOne(rec, isFormation, source) {
    if (!_ready) {
      console.warn('[SearchEngine] Index non prêt, appeler buildIndex() d\'abord');
      return null;
    }

    const id = _nextDocId++;
    const doc = _makeDoc(id, rec, isFormation);
    _docs.push(doc);
    _indexDocTokens(doc);
    _idfDirty = true;

    console.log(`[SearchEngine] +1 ${isFormation ? 'formation' : 'infra'} indexé: "${doc.fields.name}" (id=${id})`);
    _notifyChange('add', doc, { source: source || 'unknown' });
    return doc;
  }

  /**
   * Ajouter plusieurs enregistrements en batch (plus performant que N × indexOne).
   * @param {Array}   records       — Tableau d'objets bruts
   * @param {boolean} isFormation
   * @param {string}  [source]
   * @returns {number} Nombre de documents ajoutés
   */
  function indexBatch(records, isFormation, source) {
    if (!_ready || !records || !records.length) return 0;

    const added = [];
    for (const rec of records) {
      const id = _nextDocId++;
      const doc = _makeDoc(id, rec, isFormation);
      _docs.push(doc);
      _indexDocTokens(doc);
      added.push(doc);
    }

    // Recalculer IDF une seule fois pour tout le batch
    _recomputeIDF();

    console.log(`[SearchEngine] +${added.length} ${isFormation ? 'formations' : 'infras'} indexés en batch`);
    _notifyChange('batch_add', null, { count: added.length, source: source || 'unknown' });
    return added.length;
  }

  /**
   * Mettre à jour un enregistrement existant.
   * Identifié par le record objet (ref) ou par un matcher fn.
   * @param {object|function} matcher — Objet rec exact OU fn(doc) => boolean
   * @param {object}          newRec  — Nouveau contenu complet
   * @param {boolean}         [isFormation]
   * @returns {object|null} Le document mis à jour, ou null si non trouvé
   */
  function updateOne(matcher, newRec, isFormation) {
    if (!_ready) return null;

    const matchFn = typeof matcher === 'function' ? matcher : (doc) => doc.rec === matcher;
    const idx = _docs.findIndex(matchFn);
    if (idx === -1) {
      console.warn('[SearchEngine] updateOne: document non trouvé');
      return null;
    }

    const oldDoc = _docs[idx];
    const docId = oldDoc.id;

    // Retirer les anciens tokens
    _unindexDocTokens(docId);

    // Recréer le doc avec les nouvelles données
    const updatedDoc = _makeDoc(docId, newRec, isFormation !== undefined ? isFormation : oldDoc.isFormation);
    _docs[idx] = updatedDoc;

    // Réindexer
    _indexDocTokens(updatedDoc);
    _idfDirty = true;

    console.log(`[SearchEngine] ✏️ Mis à jour: "${updatedDoc.fields.name}" (id=${docId})`);
    _notifyChange('update', updatedDoc, { oldName: oldDoc.fields.name });
    return updatedDoc;
  }

  /**
   * Supprimer un enregistrement de l'index.
   * @param {object|function} matcher — Objet rec exact OU fn(doc) => boolean
   * @returns {boolean} true si supprimé
   */
  function removeOne(matcher) {
    if (!_ready) return false;

    const matchFn = typeof matcher === 'function' ? matcher : (doc) => doc.rec === matcher;
    const idx = _docs.findIndex(matchFn);
    if (idx === -1) return false;

    const doc = _docs[idx];

    // Retirer les tokens de l'index
    _unindexDocTokens(doc.id);

    // Retirer le doc du tableau
    _docs.splice(idx, 1);
    _idfDirty = true;

    console.log(`[SearchEngine] 🗑 Supprimé: "${doc.fields.name}" (id=${doc.id})`);
    _notifyChange('remove', doc, {});
    return true;
  }

  /**
   * Trouver un document par son record ou un matcher.
   * @param {object|function} matcher
   * @returns {object|null}
   */
  function findDoc(matcher) {
    if (!_ready) return null;
    const matchFn = typeof matcher === 'function' ? matcher : (doc) => doc.rec === matcher;
    return _docs.find(matchFn) || null;
  }

  /**
   * S'abonner aux changements d'index.
   * Le callback reçoit { type, doc, meta, timestamp, totalDocs }.
   * Types: 'add', 'batch_add', 'update', 'remove', 'rebuild'
   * @param {function} fn
   * @returns {function} Fonction de désabonnement
   */
  function onChange(fn) {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  }

  /* ── Détection du type infrastructure (copie de getInfraType) ─ */
  function getInfraTypeSearch(r) {
    const desc = (r.DESCRIPTIF || r.THEMATIQUE || '').toLowerCase();
    const name = (r.DESIGNATION || '').toLowerCase();
    const combined = desc + ' ' + name;

    // Priorité haute: mots-clés spécifiques AVANT "Centre culturel" (catch-all)
    if (combined.includes('biblioth') || combined.includes('lecture') || combined.includes('mediatheque') || combined.includes('médiathèque')) return 'Bibliothèque';
    if (combined.includes('cinema') || combined.includes('cinéma') || combined.includes('ciné')) return 'Cinéma';
    if (combined.includes('musée') || combined.includes('musee')) return 'Musée';
    if (combined.includes('galeri')) return 'Galerie';
    if (combined.includes('spectacl') || combined.includes('théâtre') || combined.includes('theatre')) return 'Salle de spectacle';
    if (combined.includes('fête') || combined.includes('fete') || combined.includes('salle des f')) return 'Salle des fêtes';
    if (combined.includes('foyer des femme') || (combined.includes('foyer') && combined.includes('femme'))) return 'Foyer des femmes';
    if (combined.includes('foyer des jeune') || (combined.includes('foyer') && combined.includes('jeune'))) return 'Foyer des jeunes';
    if (combined.includes('artisan')) return 'Village artisanal';
    if (combined.includes('maison de la culture') || combined.includes('maison culture')) return 'Maison de la culture';
    // Fallback: Centre culturel
    return 'Centre culturel';
  }

  /* ── Parsing NLP avancé de la requête ──────────────────────── */
  function parseIntent(raw) {
    const normalized = normalize(raw);
    const tokens = tokenize(raw);
    const intent = {
      types: [],           // Types infrastructure détectés
      branches: [],        // Branches formation détectées
      regions: [],         // Régions détectées
      milieu: '',          // URBAIN / RURAL
      wantFormations: false,
      wantInfra: true,
      freeTokens: [],      // Mots non reconnus (pour recherche texte)
      raw: raw,
      confidence: 0,       // 0-1 score de confiance de l'intent
      isQuestion: false,
      quantity: null,       // "combien" → count mode
      proximity: null,      // "près de", "autour de" → geo intent
    };

    // Détection questions — toutes les tournures FR plausibles
    const questionWords = [
      // Interrogatifs directs
      'combien', 'ou est', 'ou se trouve', 'ou sont', 'ou trouver',
      'quel', 'quelle', 'quels', 'quelles',
      'est-ce', 'y a-t-il', 'y a t il', 'ya-t-il', 'ya t il',
      'existe', 'existe-t-il', 'existe t il',
      // Verbes de recherche
      'trouver', 'trouve', 'cherche', 'recherche', 'rechercher',
      // Expressions de volonté / demande
      'je veux', 'je voudrais', 'j\'aimerais', 'j\'aimerai', 'je souhaite',
      'je desire', 'je cherche', 'je recherche',
      // Impératifs / demandes
      'montre', 'montrez', 'affiche', 'affichez',
      'liste', 'listez', 'enumere', 'enumerez',
      'dites', 'dis-moi', 'donne', 'donnez', 'donne-moi', 'donnez-moi',
      'indique', 'indiquez', 'precise', 'precisez',
      'presente', 'presentez', 'decris', 'decrivez',
      'recommande', 'recommandez', 'suggere', 'suggerez', 'propose', 'proposez',
      // Verbes d'action / découverte
      'visiter', 'voir', 'decouvrir', 'explorer', 'connaitre',
      'apprendre', 'etudier', 'pratiquer', 'participer', 'assister',
      // Questions directes
      'c\'est quoi', 'qu\'est-ce', 'qu\'est ce',
      'comment trouver', 'comment voir', 'comment visiter',
      'peut-on', 'on peut', 'pouvons-nous', 'pourrait-on',
      // Formulations "il y a" / "ça existe"
      'il y a', 'ya', 'il existe', 'ca existe', 'on trouve',
      // Tournures indirectes
      'quoi comme', 'quoi voir', 'quoi faire', 'quoi visiter',
      'que faire', 'que voir', 'que visiter', 'que decouvrir',
      'quelque chose', 'un endroit', 'un lieu', 'un espace', 'un coin',
      // Conseils / suggestions
      'conseillez', 'conseil', 'suggestion', 'idee', 'idees',
      'meilleur', 'meilleures', 'meilleurs', 'top', 'populaire', 'incontournable',
      'plus beau', 'plus beaux', 'plus belle', 'plus belles',
      'plus connu', 'plus connus', 'plus important', 'plus importants',
      // Formation / apprentissage (recherche implicite)
      'cours', 'formation', 'ecole', 'stage', 'atelier',
      // Orientés objectif
      'pour voir', 'pour visiter', 'pour decouvrir', 'pour apprendre',
      'ou aller', 'ou se rendre', 'envie de', 'besoin de',
      'a la recherche', 'en quete',
      // Passif / général
      'disponible', 'accessible', 'ouvert', 'gratuit',
      'interessant', 'a ne pas manquer', 'a voir',
    ];
    for (const qw of questionWords) {
      if (normalized.includes(qw)) {
        intent.isQuestion = true;
        break;
      }
    }

    // Détection quantité
    if (normalized.includes('combien') || normalized.match(/\bquel\s+nombre\b/) || normalized.match(/\btotal\b/)) {
      intent.quantity = 'count';
    }

    // Détection proximité
    const proxMatch = normalized.match(/(?:pres de|autour de|a cote de|proche de|a proximite de|non loin de|aux alentours de|aux environs de|dans les parages de|dans le coin de|dans le quartier de)\s+(.+)/);
    if (proxMatch) intent.proximity = proxMatch[1].trim();

    // Détection exclusion (sauf X, hors X, pas à X, excepté X)
    const exclMatch = normalized.match(/(?:sauf|hors|excepte|pas a|ni a|sans)\s+(\w+)/);
    if (exclMatch) {
      intent.exclude = exclMatch[1]; // Sera utilisé en post-filtre
    }

    // Détection tri / préférence
    if (normalized.match(/\b(plus proche|le plus proche|nearest)\b/)) intent.sortBy = 'distance';
    if (normalized.match(/\b(plus grand|le plus grand|biggest|important)\b/)) intent.sortBy = 'size';
    if (normalized.match(/\b(plus recent|le plus recent|nouveau|nouveaux|dernier)\b/)) intent.sortBy = 'recent';

    // Résolution des synonymes pour chaque token
    const resolvedCats = new Set();
    const usedTokens = new Set();

    // Multi-token matching (ex: "centre culturel", "foyer des jeunes")
    for (let i = 0; i < tokens.length; i++) {
      for (let len = Math.min(4, tokens.length - i); len >= 1; len--) {
        const phrase = tokens.slice(i, i + len).join(' ');
        const cats = SYN_INDEX[phrase];
        if (cats) {
          cats.forEach(c => resolvedCats.add(c));
          for (let j = i; j < i + len; j++) usedTokens.add(j);
          break;
        }
      }
    }

    // Single token synonym matching
    tokens.forEach((t, idx) => {
      if (usedTokens.has(idx)) return;
      // Fuzzy synonym match
      let bestCat = null, bestSim = 0;
      for (const [syn, cats] of Object.entries(SYN_INDEX)) {
        const sim = similarity(t, syn);
        if (sim > FUZZY_THRESHOLD && sim > bestSim) {
          bestSim = sim;
          bestCat = cats;
        }
      }
      if (bestCat) {
        bestCat.forEach(c => resolvedCats.add(c));
        usedTokens.add(idx);
      }
    });

    // Région matching — multi-token d'abord ("saint louis") puis single token
    // Pass 1: multi-token region matching (2-3 words)
    for (let i = 0; i < tokens.length; i++) {
      if (usedTokens.has(i)) continue;
      for (let len = Math.min(3, tokens.length - i); len >= 2; len--) {
        const phrase = tokens.slice(i, i + len).join(' ');
        let found = false;
        for (const [alias, region] of Object.entries(REGION_ALIASES)) {
          const aNorm = normalize(alias);
          if (aNorm === phrase || aNorm.replace(/[-]/g, ' ') === phrase) {
            intent.regions.push(region);
            for (let j = i; j < i + len; j++) usedTokens.add(j);
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
    // Pass 2: single-token region matching (exact + fuzzy)
    tokens.forEach((t, idx) => {
      if (usedTokens.has(idx)) return;
      // Exact alias
      for (const [alias, region] of Object.entries(REGION_ALIASES)) {
        const aNorm = normalize(alias);
        if (aNorm === t || (t.length >= 4 && aNorm.startsWith(t))) {
          intent.regions.push(region);
          usedTokens.add(idx);
          return;
        }
      }
      // Fuzzy region
      for (const [alias, region] of Object.entries(REGION_ALIASES)) {
        if (similarity(t, normalize(alias)) > 0.8) {
          intent.regions.push(region);
          usedTokens.add(idx);
          return;
        }
      }
    });
    intent.regions = [...new Set(intent.regions)];

    // Convertir catégories en types/branches
    for (const cat of resolvedCats) {
      if (cat === 'urbain')  { intent.milieu = 'URBAIN'; continue; }
      if (cat === 'rural')   { intent.milieu = 'RURAL'; continue; }
      if (cat === 'wolof_culture') continue;
      if (CAT_TO_TYPE[cat]) {
        CAT_TO_TYPE[cat].forEach(t => { if (!intent.types.includes(t)) intent.types.push(t); });
      }
      if (CAT_TO_FORMATION[cat]) {
        intent.wantFormations = true;
        if (CAT_TO_BRANCHE[cat]) {
          if (!intent.branches.includes(CAT_TO_BRANCHE[cat])) intent.branches.push(CAT_TO_BRANCHE[cat]);
        }
      }
    }

    // Si on veut des formations, adapter la recherche
    if (intent.wantFormations && !intent.types.length) {
      intent.wantInfra = false;
    }

    // Free tokens (mots non résolus → recherche texte libre)
    tokens.forEach((t, idx) => {
      if (!usedTokens.has(idx) && !['de', 'du', 'des', 'le', 'la', 'les', 'un', 'une',
        'et', 'ou', 'en', 'au', 'aux', 'a', 'dans', 'sur', 'pour', 'par', 'avec',
        'qui', 'que', 'est', 'sont', 'il', 'ya', 'je', 'mon', 'ma', 'mes', 'ce',
        'cette', 'ces', 'tout', 'tous', 'toute', 'toutes', 'se', 'vers', 'pres', 'autour',
        'moi', 'nous', 'vous', 'on', 'peut', 'voudrais', 'veux', 'voir', 'c\'est',
        'quoi', 'qu\'il', 'qu\'est', 'pas', 'plus', 'aussi', 'tres', 'sauf', 'hors',
        'entre', 'comme', 'chez', 'dites', 'donne', 'petit', 'grand', 'meilleur',
        'nouveau', 'ancien', 'bon', 'bonne', 'beau', 'belle', 'joli', 'jolie',
        'comment', 'pourquoi', 'quand', 'existe', 'disponible', 'accessible',
        'ouvert', 'gratuit', 'interessant', 'incontournable', 'populaire',
        'top', 'quelque', 'chose', 'endroit', 'lieu', 'coin', 'espace',
        'aller', 'rendre', 'envie', 'besoin', 'recherche', 'idee', 'conseil',
        'suggestion', 'propose', 'recommande', 'souhaite', 'desire', 'aimerai',
        'montrez', 'affichez', 'listez', 'presentez', 'decrivez', 'indiquez',
        'suggerez', 'precisez', 'enumerez', 'donnez', 'conseillez',
        'faire', 'manquer', 'apprendre', 'pratiquer', 'participer', 'assister',
        'pouvons', 'pourrait', 'quete', 'total', 'nombre'].includes(t)) {
        intent.freeTokens.push(t);
      }
    });

    // Calcul confiance
    const totalTokens = tokens.length || 1;
    const resolvedCount = usedTokens.size;
    intent.confidence = Math.min(1, resolvedCount / totalTokens + (intent.regions.length > 0 ? 0.2 : 0) + (intent.types.length > 0 ? 0.2 : 0));

    return intent;
  }

  /* ── Recherche principale avec scoring ─────────────────────── */
  function search(raw, options = {}) {
    if (!_ready || !raw || !raw.trim()) return { results: [], intent: null, message: '' };

    // S'assurer que l'IDF est à jour (après ajout/suppression temps réel)
    if (_idfDirty) _recomputeIDF();

    const intent = parseIntent(raw);
    const queryTokens = tokenize(raw);
    const queryNorm = normalize(raw);
    const scores = new Float64Array(_docs.length);

    // 1. TF-IDF scoring
    for (const qt of queryTokens) {
      // Exact token match
      if (_index[qt]) {
        const idf = _idf[qt] || 1;
        for (const posting of _index[qt]) {
          const fieldWeight = posting.field === 'name' ? 3 : posting.field === 'type' ? 2 : 1;
          scores[posting.docId] += posting.tf * idf * fieldWeight * BOOST.tfidf;
        }
      }
      // Prefix match (autocomplétion) — via prefix map O(1)
      if (qt.length >= 2) {
        const prefixTokens = _getPrefixTokens(qt);
        for (const token of prefixTokens) {
          if (token !== qt) {
            const postings = _index[token];
            const idf = _idf[token] || 1;
            for (const posting of postings) {
              scores[posting.docId] += posting.tf * idf * 0.5 * BOOST.tfidf;
            }
          }
        }
      }
    }

    // Pré-calculer les valeurs intent normalisées (une seule fois par requête)
    const hasIntent = intent.types.length || intent.wantFormations || intent.regions.length || intent.milieu;
    const intentTypesNorm = intent.types.map(t => normalize(t));
    const intentBranchesNorm = intent.branches.map(b => normalize(b));
    const intentMilieuNorm = intent.milieu ? normalize(intent.milieu) : null;
    const intentRegionsUpper = intent.regions.length ? new Set(intent.regions) : null;
    let synonymsForTypes = null; // lazy — calculé une seule fois si besoin
    function _getSynonyms() {
      if (synonymsForTypes) return synonymsForTypes;
      synonymsForTypes = intentTypesNorm.flatMap(tNorm => {
        for (const [cat, realTypes] of Object.entries(CAT_TO_TYPE)) {
          if (realTypes.some(rt => normalize(rt) === tNorm)) return (SYNONYMS[cat] || []).map(normalize);
        }
        return [tNorm];
      });
      return synonymsForTypes;
    }

    // ──── PASSE UNIQUE : intent + scoring structuré + ranking ────
    // Fusionne les 3 boucles O(n) en une seule passe sur _docs
    const minScore = options.minScore || 0.01;
    const ranked = [];
    // Budget fuzzy adaptatif : plus le dataset est grand, plus on limite
    const FUZZY_BUDGET = Math.min(2000, Math.max(500, Math.floor(20000 / _docs.length * 1000)));
    let fuzzyCount = 0;

    // Pour grands datasets, skip le scoring coûteux si pas de signal TF-IDF
    const skipExpensiveIfNoSignal = _docs.length > 3000;

    for (let i = 0; i < _docs.length; i++) {
      const doc = _docs[i];

      // ── Intent scoring (ex-boucle 1b) ──
      if (hasIntent) {
        let intentScore = 0;
        if (intent.wantFormations && doc.isFormation) {
          intentScore += 1;
          if (intentBranchesNorm.length && intentBranchesNorm.some(b => doc._typeNorm.includes(b))) intentScore += 3;
        }
        if (intentTypesNorm.length && !doc.isFormation && intentTypesNorm.some(t => t === doc._typeNorm)) intentScore += 1;
        if (intentRegionsUpper && intentRegionsUpper.has(doc._regionUpper)) intentScore += 1;
        if (intentMilieuNorm && doc._milieuNorm === intentMilieuNorm) intentScore += 0.5;
        if (intentScore > 0) scores[i] += intentScore;
      }

      // ── Scoring structuré (ex-boucle 2) ──
      // Intent filtering (pénalités)
      if (intentRegionsUpper && !intentRegionsUpper.has(doc._regionUpper)) {
        scores[i] *= 0.05;
      }
      if (intentMilieuNorm && doc._milieuNorm !== intentMilieuNorm) {
        scores[i] *= 0.1;
      }
      if (intentTypesNorm.length && !doc.isFormation) {
        const typeMatch = intentTypesNorm.some(t => t === doc._typeNorm || doc._typeNorm.includes(t));
        if (typeMatch) {
          scores[i] += BOOST.typeMatch;
        } else {
          const syns = _getSynonyms();
          if (syns.some(syn => doc._nameNorm.includes(syn))) {
            scores[i] += BOOST.typeMatch * 0.7;
          } else {
            scores[i] *= 0.15;
          }
        }
      }
      if (intent.wantFormations && !intent.wantInfra && !doc.isFormation) scores[i] *= 0.05;
      if (intentBranchesNorm.length && doc.isFormation) {
        if (intentBranchesNorm.some(b => b === doc._typeNorm || doc._typeNorm.includes(b))) scores[i] += BOOST.typeMatch;
      }

      // Early skip : si le doc n'a aucun signal (TF-IDF + intent = 0) sur grand dataset,
      // pas besoin de fuzzy matching coûteux
      if (skipExpensiveIfNoSignal && scores[i] <= 0) {
        continue; // Ce doc ne sera jamais dans les résultats
      }

      // Nom matching
      if (queryNorm) {
        if (doc._nameNorm === queryNorm) {
          scores[i] += BOOST.exactName;
        } else if (doc._nameNorm.startsWith(queryNorm)) {
          scores[i] += BOOST.nameStart;
        } else if (doc._nameNorm.includes(queryNorm)) {
          scores[i] += BOOST.nameContains;
        } else if (fuzzyCount < FUZZY_BUDGET) {
          // Fuzzy match limité pour éviter O(n·m·k) sur grands datasets
          fuzzyCount++;
          for (const qt of queryTokens) {
            for (let w = 0, wl = Math.min(doc._nameWords.length, 5); w < wl; w++) {
              const sim = similarity(qt, doc._nameWords[w]);
              if (sim >= FUZZY_THRESHOLD) { scores[i] += BOOST.fuzzyName * sim; break; }
            }
          }
        }
      }

      // Region matching
      if (intentRegionsUpper && intentRegionsUpper.has(doc._regionUpper)) {
        scores[i] += BOOST.regionMatch;
      }

      // Commune/dept/localité matching
      for (const ft of intent.freeTokens) {
        if (doc._communeNorm.includes(ft)) {
          scores[i] += BOOST.communeMatch;
        } else if (fuzzyCount < FUZZY_BUDGET) {
          fuzzyCount++;
          if (similarity(ft, doc._communeNorm) > 0.75 || doc._communeNorm.split(/\s+/).some(w => similarity(ft, w) > FUZZY_THRESHOLD)) {
            scores[i] += BOOST.fuzzyCom;
          }
        }
        if (doc._deptNorm.includes(ft)) scores[i] += BOOST.deptMatch;
        if (doc._localiteNorm.includes(ft)) scores[i] += BOOST.localiteMatch;
      }

      // ── Ranking inline (ex-boucle 3) — évite une 3ème passe ──
      if (scores[i] > minScore) {
        ranked.push({ doc: doc, score: scores[i] });
      }
    }
    ranked.sort((a, b) => b.score - a.score);

    // 4. Limiter
    const results = ranked.slice(0, options.limit || MAX_RESULTS);

    // 5. Générer message IA
    const msg = generateMessage(intent, ranked.length, raw);

    return { results, intent, message: msg, total: ranked.length };
  }

  /* ── Génération message naturel ─────────────────────────────── */
  function generateMessage(intent, count, raw) {
    if (count === 0) {
      const tips = [
        `Aucun résultat pour "${raw}".`,
        'Essayez : "musées Dakar", "cinéma Thiès", "formations artistiques"',
        'ou une recherche plus large comme "culture Ziguinchor".'
      ];
      return tips.join(' ');
    }

    let msg = '';

    if (intent.quantity === 'count') {
      msg = `Il y a ${count} `;
    } else {
      msg = `${count} `;
    }

    // Description du type
    if (intent.types.length) {
      msg += intent.types.map(t => t.toLowerCase()).join(', ');
    } else if (intent.wantFormations) {
      msg += intent.branches.length
        ? `formation${count > 1 ? 's' : ''} en ${intent.branches.join(', ').toLowerCase()}`
        : `centre${count > 1 ? 's' : ''} de formation`;
    } else {
      msg += `lieu${count > 1 ? 'x' : ''} culturel${count > 1 ? 's' : ''}`;
    }

    msg += ` trouvé${count > 1 ? 's' : ''}`;

    if (intent.regions.length) {
      const regs = intent.regions.map(r => r.charAt(0) + r.slice(1).toLowerCase());
      msg += ` ${intent.regions.length === 1 ? 'en' : 'dans les régions de'} ${regs.join(', ')}`;
    }

    if (intent.milieu) {
      msg += ` (zone ${intent.milieu.toLowerCase()})`;
    }

    if (intent.freeTokens.length) {
      msg += ` pour "${intent.freeTokens.join(' ')}"`;
    }

    msg += '.';

    if (intent.confidence < 0.4 && count > 0) {
      msg += ' Affinez votre recherche pour des résultats plus précis.';
    }

    return msg;
  }

  /* ── Autocomplétion ─────────────────────────────────────────── */
  function autocomplete(partial, limit = 8) {
    if (!_ready || !partial || partial.length < 2) return [];
    const pNorm = normalize(partial);
    const suggestions = new Map();

    // 1. Noms commençant par la saisie
    for (const doc of _docs) {
      if (doc._nameNorm.startsWith(pNorm) || doc._nameNorm.includes(pNorm)) {
        const label = doc.fields.name;
        if (!suggestions.has(label)) {
          suggestions.set(label, {
            label,
            type: doc.isFormation ? 'formation' : 'infra',
            typeKey: doc.fields.typeKey,
            region: doc.fields.region,
            score: doc._nameNorm.startsWith(pNorm) ? 10 : 5,
          });
        }
      }
    }

    // 2. Communes
    const seenCommunes = new Set();
    for (const doc of _docs) {
      const commune = doc.fields.commune;
      if (commune && !seenCommunes.has(commune) && doc._communeNorm.includes(pNorm)) {
        seenCommunes.add(commune);
        const label = `${commune}, ${doc.fields.region}`;
        if (!suggestions.has(label)) {
          suggestions.set(label, {
            label,
            type: 'lieu',
            score: doc._communeNorm.startsWith(pNorm) ? 8 : 3,
          });
        }
      }
    }

    // 3. Régions
    for (const [alias, region] of Object.entries(REGION_ALIASES)) {
      if (normalize(alias).startsWith(pNorm)) {
        const label = `Région de ${region.charAt(0) + region.slice(1).toLowerCase()}`;
        if (!suggestions.has(label)) {
          suggestions.set(label, { label, type: 'region', query: region, score: 7 });
        }
      }
    }

    // 4. Types
    for (const [cat, words] of Object.entries(SYNONYMS)) {
      for (const w of words) {
        if (normalize(w).startsWith(pNorm) && CAT_TO_TYPE[cat]) {
          const types = CAT_TO_TYPE[cat];
          const label = types[0];
          if (!suggestions.has(label)) {
            suggestions.set(label, { label, type: 'categorie', score: 6 });
          }
          break;
        }
      }
    }

    return [...suggestions.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /* ── Recherche par proximité géographique ───────────────────── */
  function searchNear(lat, lon, radiusKm = 10, limit = 50) {
    if (!_ready) return [];
    const results = [];
    for (const doc of _docs) {
      const dLat = parseFloat(doc.rec.LATITUDE);
      const dLon = parseFloat(doc.rec.LONGITUDE);
      if (isNaN(dLat) || isNaN(dLon)) continue;
      const dist = haversine(lat, lon, dLat, dLon);
      if (dist <= radiusKm) {
        results.push({ doc, distance: dist });
      }
    }
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, limit);
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ── Statistiques de l'index ────────────────────────────────── */
  function getStats() {
    if (!_ready) return null;
    const infraCount = _docs.filter(d => !d.isFormation).length;
    const formCount  = _docs.filter(d => d.isFormation).length;
    const regions = [...new Set(_docs.map(d => d.fields.region))].filter(Boolean);
    const types   = [...new Set(_docs.filter(d => !d.isFormation).map(d => d.fields.typeKey))].filter(Boolean);
    return {
      totalDocs: _docs.length,
      infraCount, formCount,
      tokenCount: Object.keys(_index).length,
      regions, types,
    };
  }

  /* ── API publique ───────────────────────────────────────────── */
  return {
    buildIndex,
    search,
    autocomplete,
    searchNear,
    parseIntent,
    getStats,
    // Indexation temps réel
    indexOne,
    indexBatch,
    updateOne,
    removeOne,
    findDoc,
    onChange,
    get ready() { return _ready; },
    get docs() { return _docs; },
  };

})();
