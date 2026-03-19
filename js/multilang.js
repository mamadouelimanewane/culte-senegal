/* ════════════════════════════════════════════════════════════════
   CULTE — Module Multilingue : Pulaar, Serer, Diola (Jola)
   Extension du support linguistique au-delà du Wolof/Français.
   Détection de langue, traduction culturelle, corrections phonétiques.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const MultiLang = (() => {

  /* ── 1. DICTIONNAIRES DE TRADUCTION ──────────────────────────── */

  /* Pulaar → Français (~80 entrées) */
  const PULAAR_DICT = {
    // Culture & société
    'hiirde': 'veillée', 'suudu': 'maison', 'laamordu': 'palais',
    'dental': 'rassemblement', 'fedde': 'association', 'jamma': 'nuit',
    'ngenndi': 'nation', 'pulaaku': 'valeurs peules', 'leñol': 'ethnie',
    'enɗam': 'solidarité', 'ndimaagu': 'noblesse', 'munyal': 'patience',
    'semteende': 'pudeur', 'hakkille': 'intelligence', 'goonga': 'vérité',
    'cellal': 'santé', 'afo': 'naissance', 'dewgal': 'mariage',
    // Arts & musique
    'hoddu': 'luth', 'riiti': 'flûte', 'yela': 'chant',
    'gimol': 'poème', 'pekaan': 'chant épique', 'maabo': 'griot',
    'gawlo': 'musicien griot', 'wambaaBe': 'griots', 'bammbaaɗo': 'joueur de hoddu',
    // Lieux & habitat
    'galle': 'concession', 'marga': 'marché', 'jumaa': 'mosquée',
    'wuro': 'village', 'saare': 'ville', 'luumo': 'marché hebdomadaire',
    'jaɓɓorgo': 'lieu d\'accueil', 'nokku': 'endroit', 'koɗo': 'hôte',
    // Nature & environnement
    'maayo': 'fleuve', 'ladde': 'brousse', 'lekki': 'arbre',
    'ngesa': 'champ', 'weendu': 'mare', 'naange': 'soleil',
    'lewru': 'lune', 'hendu': 'vent', 'toɓo': 'pluie',
    'nagge': 'vache', 'mbaalu': 'mouton', 'gertogal': 'poule', 'pucci': 'chevaux',
    // Famille & relations
    'baaba': 'père', 'inna': 'mère', 'ɓiɗɗo': 'enfant',
    'esiraaɓe': 'beaux-parents', 'bandiraaɓe': 'parents',
    'gorko': 'homme', 'debbo': 'femme', 'sukaaɓe': 'jeunes',
    // Actions & verbes
    'yah': 'aller', 'ar': 'venir', 'yiide': 'voir', 'heɓde': 'trouver',
    'janngude': 'apprendre', 'winnde': 'écrire', 'janngin': 'enseigner',
    'nyaamde': 'manger', 'yarde': 'boire', 'ñaagude': 'demander',
    'waɗde': 'faire', 'jogaade': 'posséder', 'waallude': 'dormir',
    'haalde': 'parler', 'humpude': 'comprendre',
    // Nombres & temps
    'gooto': 'un', 'ɗiɗi': 'deux', 'tati': 'trois',
    'hannde': 'aujourd\'hui', 'janngo': 'demain', 'haŋki': 'hier',
  };

  /* Serer → Français (~60 entrées) */
  const SERER_DICT = {
    // Culture & spiritualité
    'pangool': 'esprit ancestral', 'ndut': 'initiation', 'xoy': 'divination',
    'salt': 'lutte', 'roog': 'dieu suprême', 'yaal': 'chef',
    'saltigi': 'champion de lutte', 'qiin': 'totem', 'tiedo': 'guerrier',
    'laman': 'maître de terre', 'sine': 'royaume du Sine', 'buur': 'roi',
    'gelwaar': 'dynastie', 'tuur': 'sanctuaire',
    // Arts & expressions
    'sabar': 'tambour', 'tassou': 'poème déclamé', 'njom': 'chant rituel',
    'ngel': 'danse', 'kor': 'prière', 'njuup': 'plongeon rituel', 'ngerem': 'reconnaissance',
    // Lieux & habitat
    'mbind': 'maison', 'fandène': 'champ', 'fandene': 'champ',
    'mbaam': 'case', 'mbin': 'village', 'pombod': 'grenier',
    'daaka': 'forêt sacrée', 'laga': 'marché',
    // Nature & environnement
    'joof': 'nom de famille noble', 'ndong': 'saison des pluies',
    'ngor': 'saison sèche', 'cangin': 'terroir',
    'baobab': 'baobab', 'somb': 'tamarinier', 'kadu': 'terre',
    // Famille & société
    'yaay': 'mère', 'baap': 'père', 'ñaak': 'enfant',
    'kiin': 'clan', 'tim': 'matrilignage', 'siis': 'frère', 'oxo': 'ami',
    // Actions & verbes
    'nax': 'aller', 'ñow': 'venir', 'xam': 'savoir', 'in': 'voir',
    'toog': 'asseoir', 'lek': 'manger', 'na': 'boire', 'ref': 'faire',
    'wax': 'parler', 'leep': 'dormir', 'tax': 'vouloir', 'yeg': 'entendre',
    // Salutations
    'na nga def': 'comment vas-tu', 'maa ngi fi': 'je suis là', 'jaam': 'paix',
  };

  /* Diola (Jola) → Français (~60 entrées) */
  const DIOLA_DICT = {
    // Culture & rites
    'kumpo': 'masque sacré', 'bukut': 'initiation', 'ekonkon': 'masque',
    'kañalen': 'comédie rituelle', 'futamp': 'rite de passage',
    'elinkin': 'cérémonie', 'emit': 'dieu créateur', 'bakin': 'sanctuaire',
    'kahat': 'fétiche', 'diambone': 'palabre', 'fogny': 'région historique',
    'kassa': 'royaume', 'ayi': 'roi sacré',
    // Lieux & habitat
    'boucotte': 'quartier sacré', 'kassoumay': 'lieu-dit',
    'kabounké': 'concession', 'kabounk': 'concession',
    'boukoum': 'case sacrée', 'dianki': 'place publique', 'djola': 'habitation',
    // Nature & environnement
    'bolong': 'bras de mer', 'fromager': 'arbre sacré', 'kaïlcédrat': 'arbre sacré',
    'palmeraie': 'palmeraie', 'mangrove': 'mangrove', 'rizière': 'rizière',
    'bolom': 'marigot', 'hufol': 'riz', 'bunuk': 'vin de palme', 'ñankatang': 'fruit sauvage',
    // Famille & société
    'anook': 'mère', 'amook': 'père', 'ejool': 'enfant',
    'ajamat': 'peuple diola', 'huluf': 'clan',
    'fouloup': 'sous-groupe diola', 'bayot': 'sous-groupe diola',
    // Arts & musique
    'ekonting': 'luth à cordes', 'bougarabou': 'tambour',
    'djembé': 'percussion', 'kangabeu': 'danse', 'ewang': 'chant',
    // Actions & verbes
    'di': 'aller', 'ñi': 'venir', 'mañi': 'voir', 'inje': 'manger',
    'uli': 'boire', 'kasumay': 'salut de paix', 'karonghen': 'parler',
    'nimbe': 'dormir', 'mano': 'faire', 'kasen': 'revenir',
    // Salutations
    'abéné': 'bienvenue',
  };

  /* ── 2. CORRECTIONS PHONÉTIQUES (l'API Speech FR déforme les mots) ── */

  /* Pulaar : corrections phonétiques (~30 entrées) */
  const PULAAR_PHONETIC = {
    'heure de': 'hiirde', 'hier de': 'hiirde',
    'sous du': 'suudu', 'sous doux': 'suudu',
    'la mort du': 'laamordu', 'la mord du': 'laamordu',
    'dent a l': 'dental', 'dent al': 'dental',
    'fête de': 'fedde', 'fais de': 'fedde',
    'jam a': 'jamma', 'jama': 'jamma',
    'gens di': 'ngenndi', 'pull a cou': 'pulaaku', 'poula cou': 'pulaaku',
    'les noeud': 'leñol', 'l\'ennui': 'leñol',
    'eau du': 'hoddu', 'haut du': 'hoddu',
    'rit i': 'riiti', 'riz ti': 'riiti', 'y est la': 'yela',
    'galle': 'galle', 'marge a': 'marga', 'joue ma': 'jumaa',
    'ma a yo': 'maayo', 'là de': 'ladde', 'ouro': 'wuro',
    'baba': 'baaba', 'in a': 'inna', 'gang u de': 'janngude',
  };

  /* Serer : corrections phonétiques (~20 entrées) */
  const SERER_PHONETIC = {
    'pagne goal': 'pangool', 'pagne ol': 'pangool', 'pan gol': 'pangool',
    'rogue': 'roog', 'rogue e': 'roog',
    'salte': 'salt', 'sel te': 'salt',
    'yale': 'yaal', 'y\'a le': 'yaal', 'n\'doute': 'ndut',
    'soie': 'xoy', 'sa barre': 'sabar',
    'tasse ou': 'tassou', 'tas sous': 'tassou',
    'm\'bine de': 'mbind', 'fan daine': 'fandène',
    'la gare': 'laga', 'quine': 'qiin', 'bure': 'buur', 'lamane': 'laman',
  };

  /* Diola : corrections phonétiques (~20 entrées) */
  const DIOLA_PHONETIC = {
    'qu\'on pot': 'kumpo', 'qu\'un pot': 'kumpo', 'con pot': 'kumpo',
    'bout coûte': 'bukut', 'bout cute': 'bukut', 'boucoute': 'bukut',
    'beau long': 'bolong', 'beau longs': 'bolong',
    'et con con': 'ekonkon', 'éco con': 'ekonkon',
    'canard laine': 'kañalen', 'cas à laine': 'kañalen',
    'fut emps': 'futamp', 'elle un quine': 'elinkin',
    'case ou mets': 'kassoumay', 'cas ou mets': 'kassoumay',
    'dix a m bon': 'diambone', 'bu nouk': 'bunuk',
    'bouquet rat bout': 'bougarabou', 'bout cote': 'boucotte',
  };

  /* ── 3. MOTIFS DE PHRASES (regex → traduction structurée) ────── */

  /* Phrases Pulaar (~15 motifs) */
  const PULAAR_PHRASES = [
    { pattern: /hol\s+to\s+(.+)\s+woni/i,       template: 'où se trouve $1' },
    { pattern: /mi\s+yiɗi\s+yiide\s+(.+)/i,     template: 'je veux voir $1' },
    { pattern: /mi\s+yiɗi\s+janngude\s+(.+)/i,  template: 'je veux apprendre $1' },
    { pattern: /mi\s+yiɗi\s+(.+)/i,             template: 'je veux $1' },
    { pattern: /no\s+(.+)\s+foti/i,              template: 'combien de $1' },
    { pattern: /hol\s+ko\s+(.+)/i,              template: 'qu\'est-ce que $1' },
    { pattern: /ko\s+(.+)\s+woni/i,             template: 'c\'est $1' },
    { pattern: /mi\s+woni\s+(.+)/i,             template: 'je suis $1' },
    { pattern: /hollu\s+am\s+(.+)/i,            template: 'montre-moi $1' },
    { pattern: /ɗo\s+(.+)\s+woni/i,             template: 'voici $1' },
    { pattern: /en\s+njahra\s+(.+)/i,           template: 'allons voir $1' },
    { pattern: /no\s+(.+)\s+yahrata/i,          template: 'comment fonctionne $1' },
    { pattern: /hol\s+ɗo\s+(.+)\s+heɓetee/i,    template: 'où trouver $1' },
    { pattern: /addu\s+(.+)/i,                   template: 'apporte $1' },
    { pattern: /mi\s+haali\s+(.+)/i,            template: 'je parle de $1' },
  ];

  /* Phrases Serer (~10 motifs) */
  const SERER_PHRASES = [
    { pattern: /fa\s+(.+)\s+no\s+ne/i,    template: 'où est $1' },
    { pattern: /fa\s+(.+)\s+no\s+lek/i,   template: 'où manger $1' },
    { pattern: /na\s+(.+)\s+a\s+xam/i,    template: 'je veux savoir $1' },
    { pattern: /ndax\s+(.+)/i,             template: 'est-ce que $1' },
    { pattern: /xar\s+(.+)/i,             template: 'attends $1' },
    { pattern: /foog\s+na\s+(.+)/i,       template: 'je pense que $1' },
    { pattern: /paan\s+(.+)/i,            template: 'donne-moi $1' },
    { pattern: /o\s+nax\s+(.+)/i,         template: 'il va à $1' },
    { pattern: /na\s+tax\s+(.+)/i,        template: 'je veux $1' },
    { pattern: /a\s+ref\s+(.+)/i,         template: 'il fait $1' },
  ];

  /* Phrases Diola (~10 motifs) */
  const DIOLA_PHRASES = [
    { pattern: /bu\s+(.+)\s+ka\s+di/i,      template: 'où aller pour $1' },
    { pattern: /di\s+(.+)\s+mañi/i,         template: 'je veux voir $1' },
    { pattern: /ka\s+(.+)\s+ñi/i,           template: 'viens à $1' },
    { pattern: /ñi\s+(.+)\s+mano/i,         template: 'viens faire $1' },
    { pattern: /bu\s+(.+)\s+elinkin/i,       template: 'la cérémonie de $1' },
    { pattern: /ka\s+mañi\s+(.+)/i,         template: 'montre-moi $1' },
    { pattern: /di\s+(.+)\s+karonghen/i,     template: 'parle-moi de $1' },
    { pattern: /bu\s+(.+)\s+kasumay/i,       template: 'paix pour $1' },
    { pattern: /inje\s+(.+)/i,              template: 'manger $1' },
    { pattern: /ka\s+kasen\s+(.+)/i,        template: 'revenir à $1' },
  ];

  /* ── 4. MARQUEURS DE LANGUE (mots caractéristiques) ──────────── */

  const LANG_MARKERS = {
    pulaar: [
      'mi', 'ko', 'nde', 'ɗe', 'ɓe', 'on', 'en', 'min',
      'hiirde', 'suudu', 'laamordu', 'jamma', 'ngenndi',
      'pulaaku', 'leñol', 'dental', 'fedde', 'galle',
      'maayo', 'ladde', 'wuro', 'hoddu', 'janngude', 'yiide', 'heɓde', 'haalde', 'waɗde',
    ],
    serer: [
      'fa', 'na', 'ndax', 'xar', 'foog', 'paan',
      'mbind', 'roog', 'yaal', 'pangool', 'ndut', 'xoy',
      'salt', 'saltigi', 'laman', 'buur', 'tassou', 'njom', 'fandène', 'daaka',
    ],
    diola: [
      'di', 'bu', 'ka', 'ñi',
      'ekonkon', 'kumpo', 'bukut', 'futamp', 'kañalen',
      'elinkin', 'kassoumay', 'boucotte', 'bolong',
      'ekonting', 'bougarabou', 'ajamat', 'kangabeu', 'diambone', 'bakin', 'emit',
    ],
    wolof: [
      'nanga', 'def', 'mangi', 'buga', 'nekk', 'dem',
      'fan', 'ana', 'seet', 'wone', 'keur', 'daara',
      'teranga', 'cosaan', 'sabar', 'mbalax', 'gewel',
    ],
  };

  /* ── 5. CORRESPONDANCE LANGUE → RÉGIONS ──────────────────────── */

  const REGION_MAP = {
    pulaar:   ['MATAM', 'SAINT-LOUIS', 'TAMBACOUNDA', 'KEDOUGOU'],
    serer:    ['FATICK', 'KAOLACK', 'THIES'],
    diola:    ['ZIGUINCHOR', 'SEDHIOU', 'KOLDA'],
    wolof:    ['DAKAR', 'LOUGA', 'DIOURBEL', 'KAOLACK', 'THIES'],
    francais: ['DAKAR'],
  };

  /* ── 6. FONCTIONS UTILITAIRES ────────────────────────────────── */

  /** Normalise le texte : minuscules, espaces simplifiés */
  function normalize(text) {
    return (text || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /** Échappe les caractères spéciaux pour utilisation dans une regex */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Applique les corrections phonétiques d'un dictionnaire donné.
   * @param {string} text - Texte normalisé
   * @param {Object} phoneticDict - Dictionnaire phonétique
   * @returns {{ text: string, corrections: string[] }}
   */
  function applyPhonetic(text, phoneticDict) {
    const corrections = [];
    let result = text;
    for (const [bad, good] of Object.entries(phoneticDict)) {
      if (result.includes(bad)) {
        result = result.replace(new RegExp(escapeRegex(bad), 'gi'), good);
        corrections.push(`${bad} → ${good}`);
      }
    }
    return { text: result, corrections };
  }

  /* ── 7. DÉTECTION DE LANGUE ──────────────────────────────────── */

  /**
   * Détecte la langue probable du texte parmi :
   * pulaar, serer, diola, wolof, francais.
   * Score basé sur le nombre de marqueurs reconnus.
   * @param {string} text - Texte à analyser
   * @returns {string} Code langue détecté
   */
  function detectLanguage(text) {
    const words = normalize(text).split(/\s+/);
    const scores = {};
    for (const [lang, markers] of Object.entries(LANG_MARKERS)) {
      scores[lang] = 0;
      for (const word of words) {
        if (markers.includes(word)) scores[lang]++;
      }
    }
    // Langue avec le meilleur score (seuil minimum : 1 marqueur)
    let best = 'francais';
    let bestScore = 0;
    for (const [lang, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; best = lang; }
    }
    return bestScore > 0 ? best : 'francais';
  }

  /* ── 8. PIPELINE DE TRADUCTION ───────────────────────────────── */

  /** Sélectionne le dictionnaire et les outils selon la langue */
  function getToolsForLang(lang) {
    switch (lang) {
      case 'pulaar': return { dict: PULAAR_DICT, phonetic: PULAAR_PHONETIC, phrases: PULAAR_PHRASES };
      case 'serer':  return { dict: SERER_DICT,  phonetic: SERER_PHONETIC,  phrases: SERER_PHRASES };
      case 'diola':  return { dict: DIOLA_DICT,  phonetic: DIOLA_PHONETIC,  phrases: DIOLA_PHRASES };
      default: return null;
    }
  }

  /** Traduit un mot isolé via le dictionnaire (exact puis partiel) */
  function translateWord(word, dict) {
    if (dict[word]) return dict[word];
    for (const [key, val] of Object.entries(dict)) {
      if (word.startsWith(key) && key.length >= 3) return val;
    }
    return word;
  }

  /** Applique les motifs de phrases, retourne le texte ou null */
  function applyPhrases(text, phrases) {
    for (const { pattern, template } of phrases) {
      if (text.match(pattern)) return text.replace(pattern, template);
    }
    return null;
  }

  /**
   * Pipeline complet de traduction :
   * 1. Normalisation → 2. Corrections phonétiques → 3. Détection de langue
   * 4. Motifs de phrases → 5. Traduction mot à mot
   * @param {string} text - Texte brut (potentiellement issu de l'API Speech)
   * @returns {{ text: string, sourceLang: string, corrections: string[], isTranslated: boolean }}
   */
  function translate(text) {
    let normalized = normalize(text);
    const allCorrections = [];

    // Étape 1 : corrections phonétiques (toutes les langues en parallèle)
    for (const pd of [PULAAR_PHONETIC, SERER_PHONETIC, DIOLA_PHONETIC]) {
      const { text: corrected, corrections } = applyPhonetic(normalized, pd);
      normalized = corrected;
      allCorrections.push(...corrections);
    }

    // Étape 2 : détection de langue
    const lang = detectLanguage(normalized);

    // Français : retourner sans traduction
    if (lang === 'francais') {
      return { text: normalized, sourceLang: 'francais', corrections: allCorrections, isTranslated: false };
    }

    // Wolof est géré par voice-search.js, on ne traduit pas ici
    const tools = getToolsForLang(lang);
    if (!tools) {
      return { text: normalized, sourceLang: lang, corrections: allCorrections, isTranslated: false };
    }

    // Étape 3 : tenter les motifs de phrases
    const phraseResult = applyPhrases(normalized, tools.phrases);
    if (phraseResult) {
      return { text: phraseResult, sourceLang: lang, corrections: allCorrections, isTranslated: true };
    }

    // Étape 4 : traduction mot à mot
    const words = normalized.split(/\s+/);
    const translated = words.map(w => translateWord(w, tools.dict));
    const result = translated.join(' ');
    return { text: result, sourceLang: lang, corrections: allCorrections, isTranslated: result !== normalized };
  }

  /* ── 9. API PUBLIQUE ─────────────────────────────────────────── */

  return {
    detectLanguage,
    translate,
    getRegions: (lang) => REGION_MAP[lang] || [],
    dictionaries: { pulaar: PULAAR_DICT, serer: SERER_DICT, diola: DIOLA_DICT },
    supportedLanguages: ['pulaar', 'serer', 'diola', 'wolof', 'francais'],
  };

})();
