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

    // Famille & société
    'ndey':         'mère',
    'baay':         'père',
    'doom':         'enfant',
    'mag':          'aîné',
    'rakk':         'cadet',
    'góor':         'homme',
    'goor':         'homme',
    'jigéen':       'femme',
    'jigeen':       'femme',
    'njaboot':      'famille',
    'mbokk':        'parent',

    // Religion & spiritualité
    'taalib':       'disciple',
    'talibé':       'disciple',
    'talibe':       'disciple',
    'sëriñ':        'marabout',
    'serin':        'marabout',
    'marabout':     'marabout',
    'dahira':       'dahira',
    'gamou':        'célébration religieuse',
    'magal':        'pèlerinage',
    'ziarra':       'visite pieuse',
    'baye fall':    'baye fall',
    'ndigel':       'directive spirituelle',

    // Poésie & arts oratoires
    'taasu':        'poésie slam',
    'bàkk':         'chant de louange',
    'bakk':         'chant de louange',
    'thiossane':    'tradition',

    // Nourriture & culture culinaire
    'lekk':         'manger',
    'naan':         'boire',
    'ceebu jen':    'thiébou dieune',
    'thiebou dieune': 'thiéboudienne',

    // Lieux supplémentaires
    'goree':        'Gorée',
    'gore':         'Gorée',
    'mbuur':        'Mbour',
    'mbour':        'Mbour',
    'joal':         'Joal',
    'saly':         'Saly',
    'podoor':       'Podor',
    'podor':        'Podor',
    'dagana':       'Dagana',
    'usooy':        'Oussouye',
    'oussouye':     'Oussouye',
    'tivaawan':     'Tivaouane',
    'tivaouane':    'Tivaouane',
    'bignona':      'Bignona',
    'lingueer':     'Linguère',
    'pikiin':       'Pikine',
    'rufisk':       'Rufisque',

    // Actions supplémentaires
    'buga':         'vouloir',
    'am':           'avoir',
    'nekk':         'être',
    'dem':          'aller',
    'ñëw':          'venir',
    'new':          'venir',
    'gis':          'voir',
    'xam':          'savoir',
    'def':          'faire',
    'jox':          'donner',
    'jox ma':       'donne-moi',
    'toog':         'asseoir',
    'dugg':         'entrer',
    'génn':         'sortir',
    'genn':         'sortir',
    'togg':         'cuisiner',

    // Adjectifs / qualificatifs
    'baax':         'bon',
    'rafet':        'beau',
    'mag':          'grand',
    'tuuti':        'petit',
    'yépp':         'tous',
    'yepp':         'tous',
    'bari':         'beaucoup',
    'ndank':        'lent',
  };

  /* ── Expressions / phrases complètes Wolof ──────────────────── */
  const WOLOF_PHRASES = [
    // ── Localisation / "où est" ──
    { pattern: /fan\s*la\s*(nekk\s*)?(.+)/i, template: 'où est $2' },
    { pattern: /ana\s+(.+)/i, template: 'où est $1' },
    { pattern: /fu\s+nekk\s+(.+)/i, template: 'où sont les $1' },
    { pattern: /fan\s+mën\s*na\s+gis\s+(.+)/i, template: 'où puis-je voir $1' },
    { pattern: /fan\s+la\s+(.+)\s+nekk/i, template: 'où se trouve $1' },

    // ── Demandes / impératifs ──
    { pattern: /won\s*ma\s+(.+)/i, template: 'montre-moi $1' },
    { pattern: /wone\s*ma\s+(.+)/i, template: 'montre-moi $1' },
    { pattern: /jox\s*ma\s+(.+)/i, template: 'donne-moi $1' },
    { pattern: /wax\s*ma\s+(.+)/i, template: 'dis-moi $1' },
    { pattern: /indil\s*ma\s+(.+)/i, template: 'amène-moi à $1' },
    { pattern: /yobu\s*ma\s+ci\s+(.+)/i, template: 'emmène-moi à $1' },
    { pattern: /bind\s*al\s*ma\s+(.+)/i, template: 'écris-moi $1' },

    // ── Quantité ──
    { pattern: /nata\s*lay\s+(.+)/i, template: 'combien de $1' },
    { pattern: /nata\s+(.+)\s+am\s+ci\s+(.+)/i, template: 'combien de $1 à $2' },
    { pattern: /nata\s+(.+)/i, template: 'combien de $1' },
    { pattern: /nak\s+(.+)\s+ci\s+(.+)/i, template: 'combien de $1 à $2' },

    // ── Recherche / découverte ──
    { pattern: /dama\s+seet\s+(.+)/i, template: 'je cherche $1' },
    { pattern: /damay\s+seet\s+(.+)/i, template: 'je cherche $1' },
    { pattern: /mangiy?\s+seet\s+(.+)/i, template: 'je cherche $1' },
    { pattern: /dama\s+buga\s+gis\s+(.+)/i, template: 'je veux voir $1' },
    { pattern: /dama\s+buga\s+dem\s+ci\s+(.+)/i, template: 'je veux aller à $1' },
    { pattern: /dama\s+buga\s+xam\s+(.+)/i, template: 'je veux savoir $1' },
    { pattern: /dama\s+buga\s+jang\s+(.+)/i, template: 'je veux apprendre $1' },
    { pattern: /dama\s+buga\s+(.+)/i, template: 'je veux $1' },
    { pattern: /seetlu\s+(.+)/i, template: 'rechercher $1' },
    { pattern: /seet\s+(.+)/i, template: 'chercher $1' },

    // ── Existence / disponibilité ──
    { pattern: /lu\s+am\s+ci\s+(.+)/i, template: "qu'y a-t-il à $1" },
    { pattern: /lu\s+nekk\s+ci\s+(.+)/i, template: "qu'y a-t-il à $1" },
    { pattern: /ndax\s+am\s+na\s+(.+)\s+ci\s+(.+)/i, template: 'est-ce qu\'il y a $1 à $2' },
    { pattern: /ndax\s+am\s+na\s+(.+)/i, template: 'est-ce qu\'il y a $1' },
    { pattern: /am\s+na\s+(.+)\s+ci\s+(.+)/i, template: 'y a-t-il $1 à $2' },

    // ── Actions / déplacements ──
    { pattern: /dem\s+ci\s+(.+)/i, template: 'aller à $1' },
    { pattern: /buga\s+(?:na|naa)\s+dem\s+ci\s+(.+)/i, template: 'je veux aller à $1' },
    { pattern: /buga\s+(?:na|naa)\s+(.+)/i, template: 'je veux $1' },

    // ── Préférence / conseil ──
    { pattern: /lan\s+la\s+gën\s+ci\s+(.+)/i, template: 'quel est le meilleur à $1' },
    { pattern: /lan\s+moy\s+(.+)\s+bu\s+baax/i, template: 'quel est le meilleur $1' },
    { pattern: /lu\s+baax\s+ci\s+(.+)/i, template: 'quoi de bien à $1' },
    { pattern: /fu\s+rafet\s+ci\s+(.+)/i, template: 'où est beau à $1' },

    // ── Totalité / globalité ──
    { pattern: /y[eé]pp?\s+(.+)\s+ci\s+(.+)/i, template: 'tous les $1 à $2' },
    { pattern: /y[eé]pp?\s+(.+)/i, template: 'tous les $1' },
    { pattern: /b[eé]pp?\s+(.+)\s+ci\s+(.+)/i, template: 'chaque $1 à $2' },

    // ── Salutations contextuelles ──
    { pattern: /nanga\s+def\s*[,.]?\s+(.+)/i, template: 'bonjour, $1' },
    { pattern: /nanga\s+def/i, template: 'bonjour' },
    { pattern: /mangi\s+fi/i, template: 'je suis là' },
    { pattern: /jërëjëf/i, template: 'merci' },
    { pattern: /baal\s+ma/i, template: 'excusez-moi' },
  ];

  /* ── Corrections phonétiques (Speech API FR mal-interprète le Wolof) ── */
  const PHONETIC_CORRECTIONS = {
    // Villes / Régions — erreurs fréquentes du Speech API FR
    "n'da car":     'ndakaaru',
    'ndakar':       'ndakaaru',
    'n\'da car ou': 'ndakaaru',
    'un car':       'ndakaaru',
    'daccara':      'ndakaaru',
    'en dague are': 'ndar',
    'end art':      'ndar',
    'end are':      'ndar',
    'n\'dare':      'ndar',
    'qu\'à jour':   'kajoor',
    'cas or':       'kajoor',
    'cas':          'casa',
    'casa mans':    'casamance',
    'fouet à':      'fuuta',
    'foot a':       'fuuta',
    'bout à':       'fuuta',
    'bas seul':     'baol',
    'bas sol':      'baol',
    'bas aule':     'baol',
    'sine':         'siin',
    'salomon':      'saloum',
    'salle homme':  'saloum',
    'tampon':       'tamba',
    'joli of':      'jolof',

    // Actions / verbes — ce que le FR entend quand on parle Wolof
    'vont ma':      'won ma',
    'font ma':      'won ma',
    'baume à':      'won ma',
    'sète':         'seet',
    'cette':        'seet',
    'set':          'seet',
    'site lu':      'seetlu',
    'cette lu':     'seetlu',
    'gis':          'gis',
    'guise':        'gis',
    'guisse':       'gis',
    'fan la':       'fan la',
    'femme la':     'fan la',
    'fane la':      'fan la',
    'dama cette':   'dama seet',
    'dama set':     'dama seet',
    'damasse':      'dama seet',

    // Culture / termes courants
    'terrain gaz':  'teranga',
    'terangue a':   'teranga',
    'terrain ga':   'teranga',
    'ter en ga':    'teranga',
    'taran ga':     'teranga',
    'sa barre':     'sabar',
    'sa bar':       'sabar',
    'ta ma':        'tama',
    'tam à':        'tama',
    'cor à':        'kora',
    'cora':         'kora',
    'qu\'or à':     'kora',
    'halloween':    'xalam',
    'salam':        'xalam',
    'guéridon':     'gewel',
    'gai val':      'gewel',
    'cosaque':      'cosaan',
    'qu\'au signe': 'cosaan',
    'cos à':        'cosaan',
    'gym':          'jang',
    'jonc':         'jang',
    'jambette':     'jang',
    'liguée':       'liggey',
    'lit gay':      'liggey',
    'lickey':       'liggey',
    'bal a':        'mbalax',
    'balax':        'mbalax',
    'em ballade':   'mbalax',
    'm\'balade':    'mbalax',
    'dard à':       'daara',
    'dard':         'daara',
    'nange def':    'nanga def',
    'nange de':     'nanga def',
    'mange def':    'nanga def',
    'mendy fi':     'mangi fi',
    'mangy fi':     'mangi fi',

    // Lieux / bâtiments
    'cure':         'keur',
    'coeur':        'keur',
    'keurt':        'keur',
    'école':        'ekol',
    'dock à ne':    'dukaan',
    'du camp':      'dukaan',
    'lopital':      'lopital',
    'bibliothek':   'bibliotek',
    'bibliothèque': 'bibliotek',
    'galaxie':      'galeeri',
    'galerie':      'galeeri',

    // Quantitatifs / questions
    'natte à':      'nata',
    'na ta':        'nata',
    'fût nec':      'fu nekk',
    'fut nec':      'fu nekk',
    'fun k':        'fu nekk',
    'lu barri':     'lu bari',
    'lu bat':       'lu bari',
    'sis':          'ci',
    'si':           'ci',
    'si bir':       'ci biir',

    // Divers
    'dégueulasse':  'deglu',
    'décolleté':    'deglu',
    'deux gueules': 'deglu',
    'des gueules':  'deglu',
    'deg lu':       'deglu',
    'deck':         'dek',
    'fesse':        'fecc',
    'fesse cat':    'fecckat',
    'bein cas':     'bindkat',
    'le gai':       'liggey',
    'le gay':       'liggey',
    'les gays':     'liggey',

    // Poésie / arts oratoires — ce que FR entend
    'tasse ou':     'taasu',
    'tas ou':       'taasu',
    'tassou':       'taasu',
    'tas':          'taasu',
    'bac':          'bakk',
    'baque':        'bakk',
    'back':         'bakk',
    'thé aux sann': 'thiossane',
    'thiossane':    'thiossane',
    'thi au sane':  'thiossane',
    'tios an':      'thiossane',

    // Famille / société — ce que FR entend
    'jeu guène':    'jigeen',
    'jeu gaine':    'jigeen',
    'gène':         'jigeen',
    'gare':         'goor',
    'gor':          'goor',
    'gourd':        'goor',
    'serin':        'serin',
    'sérigne':      'serin',
    'serigne':      'serin',
    'cerne':        'serin',
    'talle bé':     'talibe',
    'ta lit bé':    'talibe',
    'tallit':       'talibe',
    'mari bout':    'marabout',
    'marre à bout': 'marabout',
    'marat bout':   'marabout',
    'nguéwel':      'gewel',
    'guervel':      'gewel',
    'gai vel':      'gewel',
    'guère veille': 'gewel',
    'n jabot':      'njaboot',
    'book':         'mbokk',

    // Lieux — ce que FR entend pour les localités sénégalaises
    'gore':         'goree',
    'gory':         'goree',
    'gorée':        'goree',
    'gombo':        'mbour',
    'un bourg':     'mbour',
    'en bourg':     'mbour',
    'sous sol':     'oussouye',
    'ou soie':      'oussouye',
    'jouer al':     'joal',
    'joue al':      'joal',
    'joie al':      'joal',
    'dague à na':   'dagana',
    'dague anna':   'dagana',
    'peu d\'or':    'podor',
    'pot d\'or':    'podor',
    'beau d\'or':   'podor',
    'tivas ouvanne':'tivaouane',
    'tivaouane':    'tivaouane',
    'bi nionne':    'bignona',
    'big nona':     'bignona',
    'salut':        'saly',
    'salem':        'saly',
    'piège in':     'pikiin',
    'rue fixe':     'rufisk',

    // Nourriture / culture — ce que FR entend
    'les que':      'lekk',
    'lèque':        'lekk',
    'nane':         'naan',
    'âne':          'naan',
    'c\'est bouchon':'ceebu jen',
    'thibaut diene':'ceebu jen',
    'thiébou dieune':'ceebu jen',

    // Actions / verbes supplémentaires
    'bougue':       'buga',
    'bougea':       'buga',
    'nappe':        'nekk',
    'dème':         'dem',
    'joue':         'jox',
    'joue ma':      'jox ma',

    // Religion
    'da ira':       'dahira',
    'dague ira':    'dahira',
    'gars mou':     'gamou',
    'mage al':      'magal',
    'ziara':        'ziarra',
    'z\'y art':     'ziarra',
    'n\'dit gaël':  'ndigel',
    'baye fal':     'baye fall',
    'baille fal':   'baye fall',
  };

  /* ── Modèles de commandes vocales fréquentes ─────────────── */
  const VOICE_COMMAND_PATTERNS = [
    /* ── 1. Impératifs directs (verbe + objet + lieu) ─────────── */
    // "montre-moi / trouve-moi / cherche / voir les X à Y"
    { pattern: /(?:montre[\s-]*moi|trouve[\s-]*moi|cherche[\s-]*moi|cherche|trouve|(?<!quoi )(?<!que )voir)\s+(?:les?\s+)?(.+?)\s+(?:à|en|au)\s+(.+)$/i,
      build: (m) => ({ query: m[1], region: m[2] }) },
    { pattern: /(?:montre[\s-]*moi|trouve[\s-]*moi|cherche[\s-]*moi|cherche|trouve|(?<!quoi )(?<!que )voir)\s+(?:les?\s+)?(.+)$/i,
      build: (m) => ({ query: m[1], region: null }) },
    // "indique / présente / affiche / recommande les X à Y"
    { pattern: /(?:indique[\s-]*moi|pr[eé]sente[\s-]*moi|affiche[\s-]*moi|recommande[\s-]*moi|sugg[eè]re[\s-]*moi|propose[\s-]*moi)\s+(?:les?\s+)?(.+?)\s+(?:à|en|au)\s+(.+)$/i,
      build: (m) => ({ query: m[1], region: m[2] }) },
    { pattern: /(?:indique[\s-]*moi|pr[eé]sente[\s-]*moi|affiche[\s-]*moi|recommande[\s-]*moi|sugg[eè]re[\s-]*moi|propose[\s-]*moi)\s+(?:les?\s+)?(.+)$/i,
      build: (m) => ({ query: m[1], region: null }) },

    /* ── 2. Questions directes ────────────────────────────────── */
    // "où est / où sont / où se trouve les X à Y"
    { pattern: /(?:où|ou)\s+(?:est|sont|se\s+trouv\w*)\s+(?:les?\s+)?(.+?)(?:\s+(?:à|a|de|du|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "où aller / où se rendre pour voir X à Y"
    { pattern: /(?:où|ou)\s+(?:aller|se\s+rendre|trouver)\s+(?:pour\s+)?(?:voir|visiter)?\s*(?:les?\s+|des?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "combien de X à Y"
    { pattern: /(?:combien)\s+(?:de|d')\s*(.+?)(?:\s+(?:à|a|de|du|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null, countMode: true }) },
    // "quel nombre de X à Y"
    { pattern: /(?:quel\s+nombre\s+de|le\s+total\s+de)\s*(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null, countMode: true }) },

    /* ── 3. Listes / énumérations ─────────────────────────────── */
    { pattern: /(?:liste[rz]?|[eé]num[eè]re[rz]?)\s+(?:les?\s+)?(.+?)\s+(?:à|au|a)\s+(.+)$/i,
      build: (m) => ({ query: m[1], region: m[2] }) },
    { pattern: /(?:liste[rz]?|[eé]num[eè]re[rz]?)\s+(?:les?\s+)?(.+)$/i,
      build: (m) => ({ query: m[1], region: null }) },

    /* ── 4. Proximité géographique ────────────────────────────── */
    { pattern: /(.+?)\s+(?:pr[eè]s\s+d['e]|proche\s+d['e]|autour\s+d['e]|[aà]\s+c[oô]t[eé]\s+d['e]|[aà]\s+proximit[eé]\s+d['e]|non\s+loin\s+d['e]|aux\s+(?:alentours|environs)\s+d['e])\s*(.+)/i,
      build: (m) => ({ query: m[1], near: m[2] }) },

    /* ── 5. Tournures familières / indirectes ─────────────────── */
    // "c'est quoi / qu'est-ce que c'est les X à Y"
    { pattern: /(?:c'est\s+quoi|qu'est[\s-]*ce\s+que?\s+(?:c'est|sont))\s+(?:les?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "je voudrais / je veux / j'aimerais voir/visiter X à Y"
    { pattern: /(?:je\s+(?:voudrais|veux|souhaite|d[eé]sire)|j'aimerai[s]?)\s+(?:voir|visiter|trouver|d[eé]couvrir|explorer|conna[iî]tre)\s+(?:les?\s+|des?\s+|un\w?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "je cherche / je recherche X à Y"
    { pattern: /(?:je\s+(?:cherche|recherche))\s+(?:les?\s+|des?\s+|un\w?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "est-ce qu'il y a X à Y"
    { pattern: /(?:est[\s-]*ce\s+qu['']?\s*il\s+y\s+a|y\s+a[\s-]*t[\s-]*il)\s+(?:des?\s+|les?\s+|un\w?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "il y a des / on trouve des X à Y ?"
    { pattern: /(?:il\s+y\s+a|on\s+trouve)\s+(?:des?\s+|les?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },

    /* ── 6. Demandes d'information ────────────────────────────── */
    // "dites-moi / donnez-moi / informez-moi sur X à Y"
    { pattern: /(?:dites[\s-]*moi|dis[\s-]*moi|donne[z]?[\s-]*moi|informez[\s-]*moi)\s+(?:les?\s+|sur\s+(?:les?\s+)?)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "parle-moi de / renseigne-moi sur X à Y"
    { pattern: /(?:parle[\s-]*moi\s+d[e'u]|renseigne[\s-]*moi\s+sur)\s+(?:les?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },

    /* ── 7. Questions orientées objectif ──────────────────────── */
    // "que peut-on / qu'est-ce qu'on peut voir à Y"
    { pattern: /(?:que?\s+)?(?:peut[\s-]*on|pouvons[\s-]*nous|on\s+peut)\s+(?:voir|visiter|faire|d[eé]couvrir)\s+(?:à|en|au)\s+(.+)/i,
      build: (m) => ({ query: 'culture', region: m[1] }) },
    // "quoi faire / quoi voir / quoi visiter à Y"
    { pattern: /(?:quoi|que)\s+(?:faire|voir|visiter|d[eé]couvrir)\s+(?:(?:comme\s+)?(?:activit[eé]s?\s+)?(?:culturelles?\s+)?)?(?:à|en|au)\s+(.+)/i,
      build: (m) => ({ query: 'culture', region: m[1] }) },
    // "activités culturelles à Y"
    { pattern: /(?:activit[eé]s?\s+(?:culturelles?|artistiques?))\s+(?:à|en|au)\s+(.+)/i,
      build: (m) => ({ query: 'culture', region: m[1] }) },
    // "lieux / endroits / sites culturels à Y"
    { pattern: /(?:lieux|endroits?|sites?|espaces?|coins?)\s+(?:culturels?|artistiques?|int[eé]ressants?|[aà]\s+visiter)\s+(?:à|en|au)\s+(.+)/i,
      build: (m) => ({ query: 'culture', region: m[1] }) },
    // "où apprendre / où étudier X à Y"
    { pattern: /(?:où|ou)\s+(?:apprendre|[eé]tudier|suivre\s+des?\s+cours|se\s+former)\s+(?:les?\s+|la\s+|l[''])?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: 'formation ' + m[1], region: m[2] || null }) },
    // "cours de / formation en X à Y"
    { pattern: /(?:cours|formation[s]?|[eé]cole[s]?|stage[s]?)\s+(?:de|d'|en)\s+(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: 'formation ' + m[1], region: m[2] || null }) },

    /* ── 8. Conseils / recommandations ────────────────────────── */
    // "conseille-moi / recommande / suggère des X à Y"
    { pattern: /(?:conseille[\s-]*moi|recommande[\s-]*moi|sugg[eè]re[\s-]*moi)\s+(?:des?\s+|les?\s+|un\w?\s+)?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "les meilleurs / les plus beaux X à Y"
    { pattern: /(?:les?\s+)?(?:meilleurs?|plus\s+(?:beaux?|belles?|populaires?|connus?|import\w+))\s+(.+?)(?:\s+(?:à|de|du|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "top / incontournables / à ne pas manquer à Y"
    { pattern: /(?:top|incontournables?|immanquables?|essentiels?)\s+(?:des?\s+)?(.+?)(?:\s+(?:à|de|du|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },

    /* ── 9. Tournures avec "pour" ─────────────────────────────── */
    // "un endroit / un lieu pour voir X à Y"
    { pattern: /(?:un\s+)?(?:endroit|lieu|espace|coin|place)\s+(?:pour|où)\s+(?:voir|visiter|d[eé]couvrir|apprendre|pratiquer)\s+(?:les?\s+|des?\s+|la\s+|l[''])?(.+?)(?:\s+(?:à|en|au)\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
    // "je suis à Y, que voir / que faire"
    { pattern: /(?:je\s+suis\s+(?:à|en|au))\s+(.+?)[\s,]+(?:que?\s+)?(?:voir|visiter|faire|d[eé]couvrir)/i,
      build: (m) => ({ query: 'culture', region: m[1] }) },
    // "en visite à Y, cherche X"
    { pattern: /(?:en\s+visite|de\s+passage|touriste|en\s+vacances?)\s+(?:à|en|au)\s+(.+?)[\s,]+(?:je\s+)?(?:cherche|veux?\s+voir|voudrais?\s+voir)\s*(.+)?$/i,
      build: (m) => ({ query: m[2] || 'culture', region: m[1] }) },

    /* ── 10. Wolof traduit → commande FR ─────────────────────── */
    { pattern: /(?:donne[\s-]*moi|montre[\s-]*moi)\s+(.+?)(?:\s+à\s+(.+))?$/i,
      build: (m) => ({ query: m[1], region: m[2] || null }) },
  ];

  /* ── Normalisation Wolof ────────────────────────────────────── */
  function normalizeWolof(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`]/g, "'")
      .trim();
  }

  /* ── Correction phonétique (étape 1 du pipeline) ────────────── */
  function correctPhonetics(rawText) {
    let text = normalizeWolof(rawText);
    let corrected = false;
    const corrections = [];

    // Tri par longueur décroissante pour matcher les expressions longues d'abord
    const sortedCorrections = Object.entries(PHONETIC_CORRECTIONS)
      .sort((a, b) => b[0].length - a[0].length);

    for (const [misheard, correct] of sortedCorrections) {
      const mNorm = normalizeWolof(misheard);
      const escaped = mNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s|')${escaped}(?:\\s|$|')`, 'gi');
      if (regex.test(text)) {
        text = text.replace(regex, (match) => {
          const leadSpace = match.match(/^(\s|')/)?.[0] || '';
          const trailSpace = match.match(/(\s|')$/)?.[0] || '';
          return leadSpace + correct + trailSpace;
        });
        corrections.push({ from: misheard, to: correct });
        corrected = true;
      }
    }

    // Correction phonétique par similarité sonore (doublets consonantiques)
    text = text
      .replace(/\bqu('|e\s)/g, 'k$1')         // qu'a → ka
      .replace(/\bph/g, 'f')                     // phonétique → f
      .replace(/\bth/g, 't')                     // th → t  (thièss → tiès)
      ;

    return { text: text.trim(), corrected, corrections };
  }

  /* ── Extraction de commande vocale structurée ────────────── */
  function parseVoiceCommand(text) {
    for (const { pattern, build } of VOICE_COMMAND_PATTERNS) {
      const m = text.match(pattern);
      if (m) return build(m);
    }
    return null;
  }

  /* ── Traduction Wolof → Français (avec correction phonétique) ── */
  function translateWolofToFrench(text) {
    // Étape 0 : correction phonétique (avant toute traduction)
    const phonetic = correctPhonetics(text);
    let result = phonetic.text;
    let translated = phonetic.corrected;

    // Étape 1 : Tenter les phrases complètes d'abord
    for (const { pattern, template } of WOLOF_PHRASES) {
      const match = result.match(pattern);
      if (match) {
        result = template.replace(/\$(\d)/g, (_, n) => match[parseInt(n)] || '');
        translated = true;
        break;
      }
    }

    // Étape 2 : Remplacer les mots wolof individuels (tri par longueur décroissante)
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

    // Étape 3 : Nettoyage post-traduction
    result = result
      .replace(/\s{2,}/g, ' ')           // double espaces
      .replace(/\s+([,.\?!;:])/g, '$1')  // espace avant ponctuation
      .trim();

    return {
      text: result,
      wasTranslated: translated,
      phoneticCorrections: phonetic.corrections,
    };
  }

  /* ── Détection de langue (améliorée avec correction phonétique) ── */
  function detectLanguage(text) {
    const t = normalizeWolof(text);

    // D'abord tester avec le texte brut
    let wolofScore = _computeWolofScore(t);

    // Puis tester après correction phonétique (le Speech API FR déforme le Wolof)
    const corrected = correctPhonetics(text);
    if (corrected.corrected) {
      const scoreAfterCorrection = _computeWolofScore(corrected.text);
      wolofScore = Math.max(wolofScore, scoreAfterCorrection + corrected.corrections.length);
    }

    return {
      language: wolofScore >= 2 ? 'wo' : 'fr',
      confidence: Math.min(1, wolofScore / 6),
      wolofScore,
    };
  }

  function _computeWolofScore(text) {
    const wolofMarkers = [
      'nanga def', 'mangi fi', 'fan la', 'ana', 'won ma', 'wone ma',
      'dama', 'nata', 'seetlu', 'seet', 'nekk', 'fu nekk',
      'ci biir', 'ci biti', 'bari', 'nak', 'dees', 'deglu',
      'fecc', 'yengu', 'buga', 'am ci', 'ndakaaru', 'ndar',
      'kajoor', 'fuuta', 'jolof', 'baol', 'siin', 'saloum',
      'cosaan', 'teranga', 'liggey', 'gewel', 'mbalax', 'daara',
      'keur', 'tama', 'sabar', 'kora', 'xalam',
    ];
    let score = 0;
    for (const marker of wolofMarkers) {
      if (text.includes(marker)) score += 2;
    }
    const words = text.split(/\s+/);
    for (const w of words) {
      if (WOLOF_DICT[w]) score += 1;
    }
    return score;
  }

  /* ═══════════════════════════════════════════════════════════════
     ANALYSE D'INTONATION VOCALE
     Détecte le ton, les hésitations, l'emphase, les corrections,
     l'émotion et adapte la recherche en conséquence.
     ═══════════════════════════════════════════════════════════════ */

  /* ── Marqueurs de remplissage / hésitation ────────────────── */
  const FILLERS_FR = [
    'euh', 'heu', 'euhm', 'hum', 'hmm', 'mhm', 'ah', 'oh', 'eh',
    'ben', 'bah', 'bon', 'bof', 'pff', 'hein',
    'alors', 'donc', 'en fait', 'genre', 'voilà', 'quoi',
    'tu vois', 'tu sais', 'vous savez', 'comment dire', 'disons',
    'enfin bref', 'bref',
  ];
  const FILLERS_WO = [
    'deh', 'mhm', 'eey', 'waaw', 'naka', 'boo ko',
    'dëgg', 'xam nga', 'kon', 'mais bon',
  ];

  /* ── Marqueurs d'auto-correction ──────────────────────────── */
  const CORRECTION_PATTERNS = [
    /\b(?:non|nan)\s*[,.]?\s*(?:je veux dire|plutôt|enfin|pardon|c'est-à-dire|en fait)\s+/i,
    /\b(?:pardon|excuse[z]?[\s-]*moi)\s*[,.]?\s*(?:je veux dire|plutôt|enfin|c'est-à-dire|en fait)?\s*/i,
    /\b(?:pas ça|pas celui-là|pas celle-là|l'autre)\s*[,.]?\s*/i,
    /\b(?:je (?:me )?(?:reprends|corrige|rectifie))\s*[,.]?\s*/i,
    /\b(?:non non)\s*[,.]?\s*/i,
  ];

  /* ── Marqueurs d'urgence ──────────────────────────────────── */
  const URGENCY_WORDS = [
    'vite', 'rapidement', 'tout de suite', 'maintenant',
    'urgent', 'urgence', 'dépêche', 'dépêchez',
    's\'il vous plaît', 's\'il te plaît', 'svp', 'stp',
    'immédiatement', 'pressé', 'pressée',
  ];

  /* ── Marqueurs d'incertitude ──────────────────────────────── */
  const UNCERTAINTY_WORDS = [
    'peut-être', 'peut être', 'je crois', 'je pense',
    'il me semble', 'probablement', 'environ',
    'quelque chose comme', 'un truc', 'un genre de',
    'dans le genre', 'style', 'je sais pas trop',
    'j\'hésite', 'si possible', 'éventuellement',
  ];

  /* ── Marqueurs d'enthousiasme / exclamation ───────────────── */
  const ENTHUSIASM_WORDS = [
    'super', 'génial', 'magnifique', 'incroyable', 'extraordinaire',
    'formidable', 'fantastique', 'excellent', 'parfait', 'top',
    'trop bien', 'trop cool', 'j\'adore', 'j\'aime',
    'absolument', 'vraiment', 'carrément', 'grave',
  ];

  /* ── Marqueurs d'énumération / combinaison ────────────────── */
  const ENUM_SEPARATORS = /\b(?:et(?:\s+aussi)?|ou(?:\s+(?:bien|alors|sinon))?|ainsi\s+que|de\s+même\s+que|plus|avec|également|aussi)\b/i;

  /* ── Historique d'interim pour analyse de rythme ──────────── */
  let _interimHistory = [];     // { text, timestamp }
  let _speechStartTime = 0;
  let _pauseCount = 0;
  let _lastInterimTime = 0;

  /* ────────────────────────────────────────────────────────────
     analyzeIntonation(rawText, alternatives)
     Analyse complète de l'intonation à partir du texte reconnu.
     Retourne un objet Intonation utilisé pour adapter la recherche.
     ──────────────────────────────────────────────────────────── */
  function analyzeIntonation(rawText, alternatives) {
    alternatives = alternatives || [];
    const normalized = (rawText || '').trim();

    const result = {
      cleanText: normalized,         // texte nettoyé (fillers supprimés, corrections appliquées)
      fillers: [],                    // fillers détectés et retirés
      selfCorrection: false,         // auto-correction détectée
      correctedText: null,           // texte après auto-correction
      isQuestion: false,              // intonation interrogative détectée
      isExclamation: false,           // intonation exclamative détectée
      emphasis: [],                   // mots répétés / accentués
      enumeration: [],                // termes multiples détectés (multi-critères)
      tone: 'neutral',               // neutral | urgent | uncertain | enthusiastic | hesitant | corrective
      toneEmoji: '🎙️',              // emoji représentant le ton
      toneLabel: '',                  // label FR du ton détecté
      hesitationLevel: 0,            // 0-1 : degré d'hésitation (basé sur fillers + pauses + confiance)
      confidenceAdjusted: 1.0,       // confiance recalculée
      searchModifiers: {             // modifieurs pour le moteur de recherche
        broaden: false,              // élargir la recherche (incertitude)
        multiCriteria: false,        // recherche multi-critères (énumération)
        emphasizedTerms: [],         // termes à booster dans le scoring
        isCountQuestion: false,      // question de quantité
      },
      feedbackMessage: '',           // message de feedback pour l'UI
    };

    let text = normalized;

    // ── 1. Détection de ponctuation d'intonation (Speech API) ──
    if (/\?\s*$/.test(text) || /\?\s*\?/.test(text)) {
      result.isQuestion = true;
    }
    if (/!\s*$/.test(text) || /!\s*!/.test(text)) {
      result.isExclamation = true;
    }
    if (/\.{3,}|…/.test(text)) {
      result.hesitationLevel += 0.3;
    }

    // ── 2. Nettoyage des fillers / hésitations ──
    // Trier par longueur décroissante pour matcher les expressions d'abord
    const allFillers = [...FILLERS_FR, ...FILLERS_WO]
      .sort((a, b) => b.length - a.length);

    for (const filler of allFillers) {
      const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match filler au début, à la fin, ou entre des mots (avec virgules/espaces)
      const regex = new RegExp(
        `(?:^|[,;.!?]\\s*|\\s+)${escaped}(?:[,;.!?]\\s*|\\s+|$)`, 'gi'
      );
      if (regex.test(text)) {
        result.fillers.push(filler);
        // Retirer le filler en préservant un espace
        text = text.replace(regex, (match) => {
          // Préserver un espace si le filler est entre deux mots
          const hasLeadingSpace = /^\s/.test(match);
          const hasTrailingSpace = /\s$/.test(match);
          return (hasLeadingSpace || hasTrailingSpace) ? ' ' : '';
        });
      }
    }
    text = text.replace(/\s{2,}/g, ' ').trim();
    result.hesitationLevel += Math.min(0.5, result.fillers.length * 0.12);

    // ── 3. Détection d'auto-correction ──
    for (const pattern of CORRECTION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        result.selfCorrection = true;
        result.tone = 'corrective';
        // Garder seulement ce qui vient APRÈS la correction
        const afterCorrection = text.slice(match.index + match[0].length).trim();
        if (afterCorrection.length > 2) {
          result.correctedText = afterCorrection;
          text = afterCorrection;
        }
        break;
      }
    }

    // ── 4. Détection d'emphase (mots répétés) ──
    const words = text.toLowerCase().replace(/[,;.!?]/g, '').split(/\s+/);
    const wordCount = {};
    for (const w of words) {
      if (w.length > 2) { // ignorer les petits mots
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    }
    for (const [word, count] of Object.entries(wordCount)) {
      if (count >= 2) {
        result.emphasis.push({ word, count });
        result.searchModifiers.emphasizedTerms.push(word);
      }
    }
    // Dédupliquer les mots répétés dans le texte nettoyé (garder 1 occurrence)
    if (result.emphasis.length > 0) {
      for (const { word } of result.emphasis) {
        const dupRegex = new RegExp(`\\b(${word})(?:\\s+\\1)+\\b`, 'gi');
        text = text.replace(dupRegex, '$1');
      }
      text = text.replace(/\s{2,}/g, ' ').trim();
    }

    // ── 5. Détection d'élongation (mots étirés : "muséeee", "ouiii") ──
    const elongated = text.match(/\b\w*([a-zàâäéèêëïîôùûüÿç])\1{2,}\w*\b/gi);
    if (elongated) {
      for (const elong of elongated) {
        // Nettoyer l'élongation : "muséeee" → "musée"
        const cleaned = elong.replace(/(.)\1{2,}/g, '$1$1').replace(/(.)\1$/g, '$1');
        text = text.replace(elong, cleaned);
        if (!result.emphasis.find(e => e.word === cleaned.toLowerCase())) {
          result.emphasis.push({ word: cleaned.toLowerCase(), count: 1, elongated: true });
          result.searchModifiers.emphasizedTerms.push(cleaned.toLowerCase());
        }
      }
    }

    // ── 6. Détection d'énumération (multi-critères) ──
    if (ENUM_SEPARATORS.test(text)) {
      // Séparer par les connecteurs
      const parts = text.split(ENUM_SEPARATORS).map(s => s.trim()).filter(s => s.length > 1);
      if (parts.length >= 2) {
        result.enumeration = parts;
        result.searchModifiers.multiCriteria = true;
      }
    }

    // ── 7. Détection du ton global ──
    const textLower = text.toLowerCase();

    // Urgence (surpasse tous les tons sauf neutral — on veut qu'urgence ait haute priorité)
    const urgencyCount = URGENCY_WORDS.filter(w =>
      textLower.includes(w.toLowerCase())
    ).length;
    if (urgencyCount > 0) {
      result.tone = 'urgent';
      result.toneEmoji = '⚡';
      result.toneLabel = 'Urgent';
      // Retirer les marqueurs d'urgence du texte de recherche
      for (const uw of URGENCY_WORDS) {
        const uwRegex = new RegExp(`\\b${uw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        text = text.replace(uwRegex, '').trim();
      }
      text = text.replace(/\s{2,}/g, ' ').trim();
    }

    // Incertitude
    const uncertaintyCount = UNCERTAINTY_WORDS.filter(w =>
      textLower.includes(w.toLowerCase())
    ).length;
    if (uncertaintyCount > 0 && result.tone === 'neutral') {
      result.tone = 'uncertain';
      result.toneEmoji = '🤔';
      result.toneLabel = 'Recherche élargie';
      result.searchModifiers.broaden = true;
      result.hesitationLevel += 0.2;
      // Retirer les marqueurs d'incertitude
      for (const uw of UNCERTAINTY_WORDS) {
        const uwRegex = new RegExp(`\\b${uw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        text = text.replace(uwRegex, '').trim();
      }
      text = text.replace(/\s{2,}/g, ' ').trim();
    }

    // Enthousiasme
    const enthusiasmCount = ENTHUSIASM_WORDS.filter(w =>
      textLower.includes(w.toLowerCase())
    ).length;
    if (enthusiasmCount > 0 && result.tone === 'neutral') {
      result.tone = 'enthusiastic';
      result.toneEmoji = '🤩';
      result.toneLabel = 'Enthousiaste';
    }
    if (result.isExclamation && result.tone === 'neutral') {
      result.tone = 'enthusiastic';
      result.toneEmoji = '🤩';
      result.toneLabel = 'Enthousiaste';
    }

    // Hésitation (basée sur les fillers + rhythm)
    if (result.fillers.length >= 3 && result.tone === 'neutral') {
      result.tone = 'hesitant';
      result.toneEmoji = '😶';
      result.toneLabel = 'Hésitant';
      result.searchModifiers.broaden = true;
    }

    // Ton neutre par défaut
    if (result.tone === 'neutral') {
      result.toneEmoji = '🎙️';
      result.toneLabel = 'Clair';
    }
    if (result.tone === 'corrective') {
      result.toneEmoji = '✏️';
      result.toneLabel = 'Correction';
    }

    // ── 8. Intonation interrogative (sans ponctuation explicite) ──
    // Si le Speech API n'a pas mis de "?", détecter par la structure
    if (!result.isQuestion) {
      const qStart = /^(?:est[\s-]*ce|y[\s-]*a[\s-]*t[\s-]*il|combien|o[uù]\s|quel|comment|pourquoi|quand|qui\s)/i;
      const qEnd = /\b(?:n'est[\s-]*ce\s+pas|non|hein|pas\s+vrai)\s*[?]?\s*$/i;
      if (qStart.test(text) || qEnd.test(text)) {
        result.isQuestion = true;
      }
    }
    // Question de quantité
    if (/\b(?:combien|quel\s+nombre|total)\b/i.test(text)) {
      result.searchModifiers.isCountQuestion = true;
    }

    // ── 9. Confiance ajustée ──
    // Divergence entre alternatives = incertitude du Speech API
    if (alternatives.length > 1) {
      const uniqueTexts = new Set(alternatives.map(a => a.text?.trim().toLowerCase()));
      const divergence = uniqueTexts.size / alternatives.length; // 1 = toutes différentes
      result.confidenceAdjusted -= (divergence - 0.5) * 0.3; // pénaliser la divergence
    }
    // Confiance moyenne des alternatives
    const avgConf = alternatives.length > 0
      ? alternatives.reduce((sum, a) => sum + (a.confidence || 0), 0) / alternatives.length
      : 0.8;
    result.confidenceAdjusted = Math.max(0.1, Math.min(1.0,
      result.confidenceAdjusted * 0.5 + avgConf * 0.5
    ));
    // Hésitation réduit la confiance
    result.confidenceAdjusted *= (1 - result.hesitationLevel * 0.3);

    // ── 10. Analyse du rythme (basée sur _interimHistory) ──
    if (_interimHistory.length > 2) {
      const durations = [];
      for (let i = 1; i < _interimHistory.length; i++) {
        durations.push(_interimHistory[i].timestamp - _interimHistory[i - 1].timestamp);
      }
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const longPauses = durations.filter(d => d > 1500).length;

      // Beaucoup de pauses longues = hésitation
      if (longPauses >= 2) {
        result.hesitationLevel = Math.min(1, result.hesitationLevel + 0.3);
        if (result.tone === 'neutral') {
          result.tone = 'hesitant';
          result.toneEmoji = '😶';
          result.toneLabel = 'Hésitant';
          result.searchModifiers.broaden = true;
        }
      }
      // Débit très rapide = urgence ou enthousiasme
      if (avgDuration < 300 && _interimHistory.length > 5) {
        if (result.tone === 'neutral') {
          result.tone = 'enthusiastic';
          result.toneEmoji = '⚡';
          result.toneLabel = 'Rapide';
        }
      }
    }

    // ── 11. Message de feedback pour l'UI ──
    const feedbacks = [];
    if (result.fillers.length > 0) {
      feedbacks.push(`${result.fillers.length} hésitation${result.fillers.length > 1 ? 's' : ''} retirée${result.fillers.length > 1 ? 's' : ''}`);
    }
    if (result.selfCorrection) {
      feedbacks.push('correction détectée');
    }
    if (result.emphasis.length > 0) {
      feedbacks.push(`emphase sur "${result.emphasis.map(e => e.word).join(', ')}"`);
    }
    if (result.enumeration.length >= 2) {
      feedbacks.push(`${result.enumeration.length} critères détectés`);
    }
    if (result.hesitationLevel > 0.4) {
      feedbacks.push('recherche élargie (hésitation)');
    }
    result.feedbackMessage = feedbacks.join(' · ');

    // Texte final nettoyé
    result.cleanText = text.replace(/\s{2,}/g, ' ')
      .replace(/^[,;.\s]+|[,;.\s]+$/g, '')
      .trim();

    return result;
  }

  /* ── Tracker les interim pour l'analyse de rythme ─────────── */
  function trackInterim(text) {
    const now = Date.now();
    _interimHistory.push({ text, timestamp: now });
    // Détecter les pauses longues
    if (_lastInterimTime && (now - _lastInterimTime) > 1500) {
      _pauseCount++;
    }
    _lastInterimTime = now;
  }

  function resetInterimTracking() {
    _interimHistory = [];
    _pauseCount = 0;
    _lastInterimTime = 0;
    _speechStartTime = Date.now();
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
    let _alternatives = [];   // stocker les alternatives pour meilleur matching

    rec.onstart = () => {
      _isListening = true;
      _alternatives = [];
      resetInterimTracking();
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
          // Collecter les alternatives pour le Wolof
          for (let a = 0; a < e.results[i].length; a++) {
            _alternatives.push({
              text: e.results[i][a].transcript,
              confidence: e.results[i][a].confidence || 0,
            });
          }
        } else {
          interimTranscript += transcript;
        }
      }

      const display = finalTranscript + interimTranscript;
      const transcriptEl = document.getElementById('voiceTranscript');
      const statusEl = document.getElementById('voiceStatus');

      // Tracker les interim pour analyse de rythme
      if (interimTranscript) trackInterim(interimTranscript);

      if (display.trim()) {
        // Analyse d'intonation en temps réel (pré-analyse légère)
        const liveIntonation = analyzeIntonation(display.trim(), _alternatives);
        const toneTag = liveIntonation.tone !== 'neutral'
          ? `<span class="voice-tone-badge">${liveIntonation.toneEmoji} ${liveIntonation.toneLabel}</span>`
          : '';

        // Détecter automatiquement la langue (utilise correction phonétique)
        const langDetect = detectLanguage(display);
        if (langDetect.language === 'wo' && langDetect.confidence > 0.2) {
          const translated = translateWolofToFrench(display);
          const corrections = translated.phoneticCorrections || [];
          transcriptEl.innerHTML = `
            <div class="voice-original">${escVoice(display.trim())}</div>
            ${translated.wasTranslated ? `<div class="voice-translated">→ ${escVoice(translated.text)}</div>` : ''}
            ${corrections.length ? `<div class="voice-corrections">${corrections.map(c => `<span class="voice-corr-chip">${escVoice(c.from)} → ${escVoice(c.to)}</span>`).join(' ')}</div>` : ''}
            ${toneTag}
          `;
          // Auto-switch le pill
          const overlay = document.getElementById('voiceOverlay');
          if (overlay) {
            overlay.querySelectorAll('.voice-lang-pill').forEach(p => p.classList.remove('active'));
            const woPill = overlay.querySelector('[data-lang="wo"]');
            if (woPill) woPill.classList.add('active');
          }
          statusEl.textContent = '🇸🇳 Wolof détecté — correction phonétique active';
        } else {
          transcriptEl.innerHTML = `
            <div class="voice-original">${escVoice(liveIntonation.cleanText)}</div>
            ${toneTag}
            ${liveIntonation.feedbackMessage ? `<div class="voice-intonation-info">${escVoice(liveIntonation.feedbackMessage)}</div>` : ''}
          `;
          statusEl.textContent = liveIntonation.fillers.length > 0
            ? '🇫🇷 Écoute... (hésitations nettoyées)'
            : '🇫🇷 Écoute en cours...';
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
        setTimeout(() => processVoiceResult(finalTranscript.trim(), _alternatives), 300);
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

  /* ── Traiter le résultat vocal (avec alternatives, commandes et intonation) ── */
  function processVoiceResult(rawText, alternatives) {
    alternatives = alternatives || [];

    // ── Analyse d'intonation complète ──
    const intonation = analyzeIntonation(rawText, alternatives);

    // Utiliser le texte nettoyé par l'analyseur (fillers retirés, corrections appliquées)
    const cleanedRaw = intonation.selfCorrection && intonation.correctedText
      ? intonation.correctedText
      : intonation.cleanText;

    // Tester le texte principal ET les alternatives pour trouver le meilleur match Wolof
    let bestResult = _processCandidate(cleanedRaw);
    let bestScore = bestResult.score;

    for (const alt of alternatives) {
      if (alt.text && alt.text.trim() !== cleanedRaw.trim()) {
        // Nettoyer aussi les alternatives
        const altIntonation = analyzeIntonation(alt.text.trim(), []);
        const candidate = _processCandidate(altIntonation.cleanText);
        if (candidate.score > bestScore) {
          bestResult = candidate;
          bestScore = candidate.score;
        }
      }
    }

    const { searchText, langDetect, translated } = bestResult;

    // ── Afficher le résultat traité avec confiance + intonation ──
    const transcriptEl = document.getElementById('voiceTranscript');
    if (transcriptEl) {
      const confRaw = langDetect.confidence || 0.5;
      const confAdjusted = Math.round(intonation.confidenceAdjusted * confRaw * 100);
      const confLabel = confAdjusted >= 70 ? '🟢' : confAdjusted >= 40 ? '🟡' : '🔴';

      // Badges d'intonation
      const toneBadge = intonation.tone !== 'neutral'
        ? `<span class="voice-tone-badge">${intonation.toneEmoji} ${intonation.toneLabel}</span>` : '';
      const emphBadge = intonation.emphasis.length > 0
        ? `<span class="voice-tone-badge">🔊 ${intonation.emphasis.map(e => e.word).join(', ')}</span>` : '';
      const enumBadge = intonation.searchModifiers.multiCriteria
        ? `<span class="voice-tone-badge">📋 ${intonation.enumeration.length} critères</span>` : '';
      const corrBadge = intonation.selfCorrection
        ? `<span class="voice-tone-badge">✏️ Corrigé</span>` : '';
      const intonationLine = [toneBadge, emphBadge, enumBadge, corrBadge].filter(Boolean).join(' ');
      const infoLine = intonation.feedbackMessage
        ? `<div class="voice-intonation-info">${escVoice(intonation.feedbackMessage)}</div>` : '';

      if (langDetect.language === 'wo' && translated && translated.wasTranslated) {
        const corrections = translated.phoneticCorrections || [];
        transcriptEl.innerHTML = `
          <div class="voice-original">🗣 "${escVoice(bestResult.rawText)}"</div>
          <div class="voice-translated">🤖 → "${escVoice(searchText)}"</div>
          <div class="voice-confidence">${confLabel} Confiance Wolof : ${confAdjusted}%</div>
          ${corrections.length ? `<div class="voice-corrections">${corrections.map(c => `<span class="voice-corr-chip">${escVoice(c.from)} → ${escVoice(c.to)}</span>`).join(' ')}</div>` : ''}
          ${intonationLine ? `<div class="voice-intonation-badges">${intonationLine}</div>` : ''}
          ${infoLine}
        `;
      } else {
        transcriptEl.innerHTML = `
          <div class="voice-original">🗣 "${escVoice(searchText)}"</div>
          <div class="voice-confidence">${confLabel} Confiance : ${confAdjusted}%</div>
          ${intonationLine ? `<div class="voice-intonation-badges">${intonationLine}</div>` : ''}
          ${infoLine}
        `;
      }
    }

    // ── Construire la requête finale adaptée à l'intonation ──
    let finalSearchText = searchText;

    // Multi-critères : combiner les termes énumérés
    if (intonation.searchModifiers.multiCriteria && intonation.enumeration.length >= 2) {
      // Garder le texte tel quel — le SearchEngine gère les multi-tokens
      finalSearchText = searchText;
    }

    // Parser comme commande vocale structurée si possible
    const voiceCmd = parseVoiceCommand(finalSearchText);
    if (voiceCmd) {
      let finalQuery = voiceCmd.query;
      if (voiceCmd.region) finalQuery += ' ' + voiceCmd.region;
      executeSearch(finalQuery, bestResult.rawText, intonation);
    } else {
      executeSearch(finalSearchText, bestResult.rawText, intonation);
    }
  }

  /* ── Évaluer un candidat de transcription ───────────────────── */
  function _processCandidate(rawText) {
    const langDetect = detectLanguage(rawText);
    let searchText = rawText;
    let translated = null;
    let score = 0;

    if (langDetect.language === 'wo' || langDetect.confidence > 0.15) {
      translated = translateWolofToFrench(rawText);
      if (translated.wasTranslated) {
        searchText = translated.text;
        score = langDetect.wolofScore + (translated.phoneticCorrections?.length || 0) * 2;
      }
    }

    // Bonus si le résultat produit des résultats dans le moteur de recherche
    if (typeof SearchEngine !== 'undefined') {
      try {
        const testResults = SearchEngine.search(searchText);
        if (testResults && testResults.results) {
          score += Math.min(5, testResults.results.length);
        }
      } catch(e) {}
    }

    return { rawText, searchText, langDetect, translated, score };
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

  /* ── Exécuter la recherche IA (avec modifieurs d'intonation) ── */
  function executeSearch(searchText, rawText, intonation) {
    // Sauvegarder dans l'historique
    if (typeof NLP !== 'undefined') NLP.saveHistory(rawText || searchText);

    // Appliquer les modifieurs d'intonation au moteur de recherche
    let searchOpts = {};
    if (intonation) {
      if (intonation.searchModifiers.broaden) {
        // Élargir la recherche : réduire le seuil de fuzzy matching
        searchOpts.fuzzyThreshold = 0.60;  // plus permissif que 0.72
        searchOpts.maxResults = 300;
      }
      if (intonation.searchModifiers.emphasizedTerms.length > 0) {
        // Booster les termes accentués
        searchOpts.boostTerms = intonation.searchModifiers.emphasizedTerms;
      }
      if (intonation.searchModifiers.isCountQuestion) {
        searchOpts.countMode = true;
      }
    }

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
      if (typeof runNlpSearch === 'function') runNlpSearch(searchText, searchOpts);
    } else {
      const hs = document.getElementById('homeSearch');
      if (hs) hs.value = searchText;
      const ls = document.getElementById('listSearch');
      if (ls) ls.value = searchText;
      if (typeof switchTab === 'function') switchTab('list');
      if (typeof NLP !== 'undefined' && NLP.applyToListTab) NLP.applyToListTab(searchText, searchOpts);
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
    correctPhonetics,
    parseVoiceCommand,
    analyzeIntonation,
    get isListening() { return _isListening; },
    get isSupported() { return isSupported(); },
    WOLOF_DICT,
    PHONETIC_CORRECTIONS,
  };

})();
