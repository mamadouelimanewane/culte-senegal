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
    const d = levenshtein(a, b);
    return 1 - d / Math.max(a.length, b.length, 1);
  }

  /* ── Synonymes enrichis (FR + Wolof + variantes) ─────────── */
  const SYNONYMS = {
    // Types d'infrastructure
    'musee':        ['musee', 'musees', 'museum', 'patrimoine', 'exposition', 'artefact'],
    'galerie':      ['galerie', 'galeries', 'art', 'exposition', 'vernissage', 'gallery'],
    'cinema':       ['cinema', 'cinemas', 'film', 'films', 'projection', 'ecran', 'salle obscure', 'movie'],
    'bibliotheque': ['bibliotheque', 'bibliotheques', 'biblio', 'livre', 'livres', 'lecture', 'lire', 'documentation', 'mediatheque'],
    'spectacle':    ['spectacle', 'spectacles', 'theatre', 'theatres', 'scene', 'concert', 'concerts', 'festival', 'festivals', 'danse', 'danses', 'representation', 'show', 'salle de spectacle'],
    'fete':         ['fete', 'fetes', 'salle des fetes', 'celebration', 'evenement', 'reception', 'ceremonie'],
    'jeunes':       ['jeunes', 'jeunesse', 'foyer des jeunes', 'ado', 'adolescent', 'youth'],
    'femmes':       ['femmes', 'foyer des femmes', 'feminin', 'feminine', 'woman', 'women'],
    'artisanal':    ['artisan', 'artisanal', 'artisanat', 'village artisanal', 'craft', 'metier', 'tapisserie', 'poterie', 'bijoux'],
    'culture':      ['culture', 'culturel', 'culturelle', 'centre culturel', 'maison de la culture', 'maison culture'],
    // Formations
    'formation':    ['formation', 'formations', 'ecole', 'ecoles', 'cours', 'apprentissage', 'enseignement', 'etude', 'etudes', 'academie', 'institut'],
    'arts':         ['arts', 'art', 'artistique', 'beaux-arts', 'creation'],
    'audiovisuel':  ['audiovisuel', 'audio', 'video', 'son', 'image', 'multimedia', 'media'],
    'peinture':     ['peinture', 'peindre', 'peintre', 'tableau', 'toile', 'dessin', 'aquarelle'],
    'musique':      ['musique', 'musical', 'musicien', 'instrument', 'chant', 'chanter', 'melodie', 'rythme', 'djembe', 'kora', 'sabar', 'tama', 'xalam'],
    'theatre_form': ['theatre', 'comedien', 'comedie', 'acteur', 'dramatique', 'scenique'],
    'serigraphie':  ['serigraphie', 'impression', 'textile', 'imprimerie', 'print'],
    'infographie':  ['infographie', 'graphisme', 'graphique', 'design', 'web', 'numerique', 'digital', 'informatique', 'pao'],
    // Wolof / langues locales — enrichi
    'wolof_culture':['tey', 'cosaan', 'diom', 'xam-xam', 'liggey', 'ndaje', 'teranga', 'gewel', 'griot'],
    'musique':      ['musique', 'musical', 'musicien', 'instrument', 'chant', 'chanter', 'melodie', 'rythme', 'djembe', 'kora', 'sabar', 'tama', 'xalam', 'mbalax', 'woykat', 'tabala', 'ndawrabine'],
    'spectacle':    ['spectacle', 'spectacles', 'theatre', 'theatres', 'scene', 'concert', 'concerts', 'festival', 'festivals', 'danse', 'danses', 'representation', 'show', 'salle de spectacle', 'fecc', 'fecckat', 'yengu'],
    'bibliotheque': ['bibliotheque', 'bibliotheques', 'biblio', 'livre', 'livres', 'lecture', 'lire', 'documentation', 'mediatheque', 'teere', 'jang', 'bind', 'bindkat'],
    'formation':    ['formation', 'formations', 'ecole', 'ecoles', 'cours', 'apprentissage', 'enseignement', 'etude', 'etudes', 'academie', 'institut', 'daara', 'jangat', 'jangatkat', 'ekol'],
    'artisanal':    ['artisan', 'artisanal', 'artisanat', 'village artisanal', 'craft', 'metier', 'tapisserie', 'poterie', 'bijoux', 'mbay', 'rabb', 'rabbkat', 'wudd'],
    'cinema':       ['cinema', 'cinemas', 'film', 'films', 'projection', 'ecran', 'salle obscure', 'movie', 'tele', 'filme'],
    // Milieu
    'urbain':       ['urbain', 'ville', 'cite', 'urban', 'metropole', 'centre-ville', 'centre ville', 'downtown'],
    'rural':        ['rural', 'campagne', 'village', 'brousse', 'rurale', 'dek'],
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
    'ndar':           'SAINT-LOUIS',
    'saint louis':    'SAINT-LOUIS',
    'saint-louis':    'SAINT-LOUIS',
    'saintlouis':     'SAINT-LOUIS',
    'st louis':       'SAINT-LOUIS',
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
  };

  /* ── Index inversé & TF-IDF ─────────────────────────────────── */
  let _index = {};           // token → [{docId, field, tf}]
  let _docs  = [];           // docId → { rec, isFormation, fields: {name, type, region, ...} }
  let _idf   = {};           // token → idf score
  let _ready = false;

  function buildIndex(infrastructures, formations) {
    _index = {};
    _docs  = [];
    _idf   = {};
    let docId = 0;

    // Helper: ajouter un doc à l'index
    function addDoc(rec, isFormation) {
      const id = docId++;
      const name     = rec.DESIGNATION || rec.NOM_ETABLISSEMENT || '';
      const typeKey  = isFormation ? (rec.BRANCHE || '') : getInfraTypeSearch(rec);
      const region   = rec.REGION || '';
      const dept     = rec.DEPARTEMENT || '';
      const commune  = rec.COMMUNE || rec.LOCALITE || '';
      const localite = rec.LOCALITES || rec.LOCALITE || '';
      const milieu   = rec.MILIEU || '';
      const thematique = rec.THEMATIQUE || '';
      const descriptif = rec.DESCRIPTIF || '';

      const doc = {
        id, rec, isFormation,
        fields: { name, typeKey, region, dept, commune, localite, milieu, thematique, descriptif },
        _nameNorm:     normalize(name),
        _communeNorm:  normalize(commune),
        _regionNorm:   normalize(region),
        _deptNorm:     normalize(dept),
        _localiteNorm: normalize(localite),
        _typeNorm:     normalize(typeKey),
        _milieuNorm:   normalize(milieu),
      };
      _docs.push(doc);

      // Indexer chaque champ avec pondération
      const fieldTexts = {
        name:      name,
        type:      typeKey + ' ' + thematique + ' ' + descriptif,
        region:    region,
        dept:      dept,
        commune:   commune,
        localite:  localite,
      };

      const docTokens = new Set();
      for (const [field, text] of Object.entries(fieldTexts)) {
        const tokens = tokenize(text);
        const freq = {};
        for (const t of tokens) {
          freq[t] = (freq[t] || 0) + 1;
          docTokens.add(t);
        }
        for (const [token, count] of Object.entries(freq)) {
          if (!_index[token]) _index[token] = [];
          _index[token].push({ docId: id, field, tf: count / tokens.length });
        }
      }
    }

    // Indexer toutes les infrastructures
    for (const rec of infrastructures) addDoc(rec, false);
    // Indexer toutes les formations
    for (const rec of formations) addDoc(rec, true);

    // Calculer IDF
    const N = _docs.length;
    for (const [token, postings] of Object.entries(_index)) {
      const df = new Set(postings.map(p => p.docId)).size;
      _idf[token] = Math.log(1 + N / df);
    }

    _ready = true;
    console.log(`[SearchEngine] Index construit: ${_docs.length} documents, ${Object.keys(_index).length} tokens`);
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

    // Détection questions
    const questionWords = ['combien', 'ou est', 'ou se trouve', 'ou sont', 'quel', 'quelle', 'quels', 'quelles', 'est-ce', 'y a-t-il', 'existe', 'trouver', 'cherche', 'je veux', 'montre', 'affiche', 'liste'];
    for (const qw of questionWords) {
      if (normalized.includes(qw)) {
        intent.isQuestion = true;
        break;
      }
    }

    // Détection quantité
    if (normalized.includes('combien')) intent.quantity = 'count';

    // Détection proximité
    const proxMatch = normalized.match(/(?:pres de|autour de|a cote de|proche de|dans|vers)\s+(.+)/);
    if (proxMatch) intent.proximity = proxMatch[1].trim();

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
        'cette', 'ces', 'tout', 'tous', 'toute', 'toutes', 'se', 'vers', 'pres', 'autour'].includes(t)) {
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
      // Prefix match (autocomplétion)
      if (qt.length >= 2) {
        for (const [token, postings] of Object.entries(_index)) {
          if (token !== qt && token.startsWith(qt)) {
            const idf = _idf[token] || 1;
            for (const posting of postings) {
              scores[posting.docId] += posting.tf * idf * 0.5 * BOOST.tfidf;
            }
          }
        }
      }
    }

    // 2. Scoring structuré
    for (let i = 0; i < _docs.length; i++) {
      const doc = _docs[i];

      // Intent filtering
      if (intent.regions.length && !intent.regions.includes(doc.fields.region.toUpperCase())) {
        scores[i] *= 0.05; // Pénaliser fortement mais pas exclure
      }
      if (intent.milieu && doc._milieuNorm !== normalize(intent.milieu)) {
        scores[i] *= 0.1;
      }
      if (intent.types.length && !doc.isFormation) {
        const typeMatch = intent.types.some(t => normalize(t) === doc._typeNorm || doc._typeNorm.includes(normalize(t)));
        if (typeMatch) {
          scores[i] += BOOST.typeMatch;
        } else {
          // Vérifier aussi si le NOM contient des mots-clés du type cherché
          // Ex: "CENTRE DE LECTURE" doit matcher quand on cherche "Bibliothèque"
          const synonymsForTypes = intent.types.flatMap(t => {
            const tNorm = normalize(t);
            for (const [cat, realTypes] of Object.entries(CAT_TO_TYPE)) {
              if (realTypes.some(rt => normalize(rt) === tNorm)) {
                return SYNONYMS[cat] || [];
              }
            }
            return [tNorm];
          });
          const nameHasSynonym = synonymsForTypes.some(syn => doc._nameNorm.includes(normalize(syn)));
          if (nameHasSynonym) {
            scores[i] += BOOST.typeMatch * 0.7; // Bonus réduit mais significatif
          } else {
            scores[i] *= 0.15;
          }
        }
      }
      if (intent.wantFormations && !intent.wantInfra && !doc.isFormation) {
        scores[i] *= 0.05;
      }
      if (intent.branches.length && doc.isFormation) {
        const branchMatch = intent.branches.some(b => normalize(b) === doc._typeNorm || doc._typeNorm.includes(normalize(b)));
        if (branchMatch) scores[i] += BOOST.typeMatch;
      }

      // Nom matching (le plus important)
      if (queryNorm) {
        if (doc._nameNorm === queryNorm) {
          scores[i] += BOOST.exactName;
        } else if (doc._nameNorm.startsWith(queryNorm)) {
          scores[i] += BOOST.nameStart;
        } else if (doc._nameNorm.includes(queryNorm)) {
          scores[i] += BOOST.nameContains;
        } else {
          // Fuzzy match sur le nom
          for (const qt of queryTokens) {
            const nameWords = doc._nameNorm.split(/\s+/);
            for (const nw of nameWords) {
              const sim = similarity(qt, nw);
              if (sim >= FUZZY_THRESHOLD) {
                scores[i] += BOOST.fuzzyName * sim;
              }
            }
          }
        }
      }

      // Region matching
      if (intent.regions.length && intent.regions.includes(doc.fields.region.toUpperCase())) {
        scores[i] += BOOST.regionMatch;
      }

      // Commune matching
      for (const ft of intent.freeTokens) {
        if (doc._communeNorm.includes(ft)) {
          scores[i] += BOOST.communeMatch;
        } else if (similarity(ft, doc._communeNorm) > 0.75 || doc._communeNorm.split(/\s+/).some(w => similarity(ft, w) > FUZZY_THRESHOLD)) {
          scores[i] += BOOST.fuzzyCom;
        }
        if (doc._deptNorm.includes(ft)) {
          scores[i] += BOOST.deptMatch;
        }
        if (doc._localiteNorm.includes(ft)) {
          scores[i] += BOOST.localiteMatch;
        }
      }
    }

    // 3. Trier par score décroissant
    const ranked = [];
    for (let i = 0; i < _docs.length; i++) {
      if (scores[i] > 0.01) {
        ranked.push({ doc: _docs[i], score: scores[i] });
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
    get ready() { return _ready; },
    get docs() { return _docs; },
  };

})();
