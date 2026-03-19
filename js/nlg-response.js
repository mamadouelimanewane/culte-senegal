/* ════════════════════════════════════════════════════════════════
   CULTE — Module NLG (Natural Language Generation)
   Genere des reponses en francais naturel et conversationnel
   pour les resultats de recherche culturelle au Senegal.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const NLGResponse = (() => {

  /* ── Utilitaires internes ─────────────────────────────────── */

  /**
   * Choisit un element au hasard dans un tableau.
   */
  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Pluralise un mot simple selon le nombre.
   */
  function _pl(n, singular, plural) {
    return n <= 1 ? singular : (plural || singular + 's');
  }

  /**
   * Formate un nombre avec separateur de milliers.
   */
  function _fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  }

  /**
   * Formate une distance en texte lisible.
   */
  function _fmtDist(km) {
    if (km < 1) return Math.round(km * 1000) + ' m';
    if (km < 10) return km.toFixed(1) + ' km';
    return Math.round(km) + ' km';
  }

  /* ── Formatage des noms de region ─────────────────────────── */

  const REGION_MAP = {
    'DAKAR':        'Dakar',
    'SAINT LOUIS':  'Saint-Louis',
    'SAINT-LOUIS':  'Saint-Louis',
    'THIES':        'Thi\u00e8s',
    'DIOURBEL':     'Diourbel',
    'FATICK':       'Fatick',
    'KAOLACK':      'Kaolack',
    'KAFFRINE':     'Kaffrine',
    'ZIGUINCHOR':   'Ziguinchor',
    'KOLDA':        'Kolda',
    'SEDHIOU':      'S\u00e9dhiou',
    'TAMBACOUNDA':  'Tambacounda',
    'KEDOUGOU':     'K\u00e9dougou',
    'LOUGA':        'Louga',
    'MATAM':        'Matam',
  };

  /**
   * Formate un nom de region brut en version lisible.
   * "SAINT LOUIS" -> "Saint-Louis", "KEDOUGOU" -> "Kedougou"
   */
  function formatRegionName(region) {
    if (!region) return '';
    const upper = region.toUpperCase().trim();
    if (REGION_MAP[upper]) return REGION_MAP[upper];
    // Fallback : capitalize chaque mot
    return upper.toLowerCase().replace(/(?:^|\s)\S/g, function (c) { return c.toUpperCase(); });
  }

  /* ── Emojis par type / region ─────────────────────────────── */

  const TYPE_EMOJI = {
    'mus\u00e9e':              '\ud83c\udffa',
    'galerie':             '\ud83d\uddbc\ufe0f',
    'cin\u00e9ma':             '\ud83c\udfac',
    'biblioth\u00e8que':       '\ud83d\udcda',
    'salle de spectacle':  '\ud83c\udfad',
    'salle des f\u00eates':    '\ud83c\udf89',
    'centre culturel':     '\ud83c\udfdb\ufe0f',
    'maison de la culture':'\ud83c\udfe0',
    'foyer des jeunes':    '\ud83c\udfad',
    'foyer des femmes':    '\ud83d\udc69',
    'village artisanal':   '\ud83e\uddf6',
  };

  const REGION_EMOJI = {
    'DAKAR':       '\ud83c\udf0a',
    'SAINT LOUIS': '\ud83c\udf39',
    'ZIGUINCHOR':  '\ud83c\udf34',
    'THIES':       '\ud83c\udfd7\ufe0f',
    'KEDOUGOU':    '\u26f0\ufe0f',
    'KOLDA':       '\ud83e\udd85',
    'TAMBACOUNDA': '\ud83e\udd81',
    'FATICK':      '\ud83d\udc1f',
    'KAOLACK':     '\ud83c\udf3e',
    'LOUGA':       '\ud83c\udfdc\ufe0f',
    'MATAM':       '\ud83c\udf35',
  };

  function _emojiForType(typeKey) {
    if (!typeKey) return '\ud83d\udccd';
    var lower = typeKey.toLowerCase();
    for (var key in TYPE_EMOJI) {
      if (lower.includes(key)) return TYPE_EMOJI[key];
    }
    return '\ud83d\udccd';
  }

  function _emojiForRegion(region) {
    if (!region) return '';
    return REGION_EMOJI[region.toUpperCase()] || '\ud83d\udccd';
  }

  /* ── Mots wolof pour la touche locale ─────────────────────── */

  const WOLOF_TOUCHES = [
    'Teranga !',
    'Jere-jef !',
    'Nanga def ?',
    'Yaay ngi fi !',
    'Ma ngui fii !',
  ];

  const DISCOVERY_ADJECTIVES = [
    'riche en culture',
    'une vraie p\u00e9pite culturelle',
    'un tr\u00e9sor \u00e0 d\u00e9couvrir',
    'plein de surprises',
    'un haut lieu de la teranga',
  ];

  /* ── Salutations contextuelles ────────────────────────────── */

  /**
   * Genere une salutation aleatoire pour la premiere recherche.
   */
  function generateGreeting() {
    var hour = new Date().getHours();
    var greetings;

    if (hour < 12) {
      greetings = [
        'Bonjour et bienvenue ! \ud83c\udf1e Que souhaitez-vous d\u00e9couvrir aujourd\'hui ?',
        'Nanga def ? \u2600\ufe0f Bonne matin\u00e9e ! Pr\u00eat \u00e0 explorer la culture s\u00e9n\u00e9galaise ?',
        'Salaam ! Bienvenue sur CULTE. Qu\'est-ce qui vous ferait plaisir ce matin ?',
        'Bonjour ! \ud83c\udf05 La culture s\u00e9n\u00e9galaise vous attend. Lancez votre recherche !',
      ];
    } else if (hour < 18) {
      greetings = [
        'Bon apr\u00e8s-midi ! \ud83c\udf24\ufe0f Explorons ensemble le patrimoine culturel du S\u00e9n\u00e9gal.',
        'Salaam ! Que voulez-vous d\u00e9couvrir cet apr\u00e8s-midi ?',
        'Bienvenue ! \ud83c\udf1f Le S\u00e9n\u00e9gal regorge de richesses culturelles. Cherchons ensemble.',
        'Nanga def ? \ud83d\ude0a Je suis l\u00e0 pour vous guider dans vos d\u00e9couvertes culturelles.',
      ];
    } else {
      greetings = [
        'Bonsoir ! \ud83c\udf19 Envie de d\u00e9couvrir un lieu culturel ce soir ?',
        'Salaam ! \ud83c\udf03 La culture s\u00e9n\u00e9galaise ne dort jamais. Que cherchez-vous ?',
        'Bonsoir et bienvenue ! \u2728 Explorons ensemble les tr\u00e9sors du S\u00e9n\u00e9gal.',
        'Nanga def ? \ud83c\udf1c Bonne soir\u00e9e ! Pr\u00eat pour une d\u00e9couverte culturelle ?',
      ];
    }

    return _pick(greetings);
  }

  /* ── Extraction de statistiques ───────────────────────────── */

  /**
   * Analyse un tableau de resultats et genere un objet de statistiques.
   * @param {Array} results — Tableau d'objets { doc, score, _distance? }
   * @returns {object} Stats : byRegion, byType, byMilieu, topCommune, totalFormations, totalInfra
   */
  function generateStats(results) {
    if (!results || !results.length) {
      return {
        byRegion: {},
        byType: {},
        byMilieu: { urbain: 0, rural: 0, autre: 0 },
        topCommune: null,
        topCommuneCount: 0,
        totalFormations: 0,
        totalInfra: 0,
        total: 0,
      };
    }

    var byRegion = {};
    var byType = {};
    var byMilieu = { urbain: 0, rural: 0, autre: 0 };
    var byCommune = {};
    var totalFormations = 0;
    var totalInfra = 0;

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var doc = r.doc;
      if (!doc) continue;

      // Region
      var region = (doc.fields && doc.fields.region) ? doc.fields.region.toUpperCase().trim() : 'INCONNU';
      byRegion[region] = (byRegion[region] || 0) + 1;

      // Type
      var typeKey = (doc.fields && doc.fields.typeKey) ? doc.fields.typeKey : 'Autre';
      byType[typeKey] = (byType[typeKey] || 0) + 1;

      // Milieu
      var milieu = (doc.fields && doc.fields.milieu) ? doc.fields.milieu.toUpperCase().trim() : '';
      if (milieu === 'URBAIN') byMilieu.urbain++;
      else if (milieu === 'RURAL') byMilieu.rural++;
      else byMilieu.autre++;

      // Commune
      var commune = (doc.fields && doc.fields.commune) ? doc.fields.commune.trim() : '';
      if (commune) byCommune[commune] = (byCommune[commune] || 0) + 1;

      // Formation vs Infrastructure
      if (doc.isFormation) totalFormations++;
      else totalInfra++;
    }

    // Trouver la commune la plus representee
    var topCommune = null;
    var topCommuneCount = 0;
    for (var c in byCommune) {
      if (byCommune[c] > topCommuneCount) {
        topCommune = c;
        topCommuneCount = byCommune[c];
      }
    }

    // Trier les regions par nombre decroissant
    var regionsSorted = Object.keys(byRegion).sort(function (a, b) { return byRegion[b] - byRegion[a]; });

    // Trier les types par nombre decroissant
    var typesSorted = Object.keys(byType).sort(function (a, b) { return byType[b] - byType[a]; });

    return {
      byRegion: byRegion,
      byType: byType,
      byMilieu: byMilieu,
      byCommune: byCommune,
      topCommune: topCommune,
      topCommuneCount: topCommuneCount,
      totalFormations: totalFormations,
      totalInfra: totalInfra,
      total: results.length,
      regionsSorted: regionsSorted,
      typesSorted: typesSorted,
    };
  }


  /* ── Suggestions d'alternatives (zero resultats) ──────────── */

  /**
   * Propose des requetes alternatives quand aucun resultat n'est trouve.
   * @param {string} query    — La requete originale
   * @param {object} [intent] — L'intent parse (types, regions, etc.)
   * @returns {Array<string>} Tableau de suggestions textuelles
   */
  function suggestAlternatives(query, intent) {
    var suggestions = [];

    if (intent && intent.regions && intent.regions.length) {
      var regionLabel = formatRegionName(intent.regions[0]);
      suggestions.push('lieux culturels \u00e0 ' + regionLabel);
      suggestions.push('centres culturels \u00e0 ' + regionLabel);
      if (intent.types && intent.types.length) {
        // Suggerer un type plus generique dans la meme region
        suggestions.push('culture \u00e0 ' + regionLabel);
      }
    }

    if (intent && intent.types && intent.types.length) {
      // Suggerer le meme type dans d'autres regions
      suggestions.push(intent.types[0] + ' \u00e0 Dakar');
      suggestions.push(intent.types[0] + ' au S\u00e9n\u00e9gal');
    }

    if (intent && intent.branches && intent.branches.length) {
      suggestions.push('formations \u00e0 Dakar');
      suggestions.push('formations en ' + intent.branches[0].toLowerCase());
    }

    // Suggestions generiques si rien de mieux
    if (!suggestions.length) {
      suggestions.push('mus\u00e9es \u00e0 Dakar');
      suggestions.push('centres culturels au S\u00e9n\u00e9gal');
      suggestions.push('formations artistiques');
    }

    // Limiter a 3 suggestions uniques
    var unique = [];
    for (var i = 0; i < suggestions.length && unique.length < 3; i++) {
      if (unique.indexOf(suggestions[i]) === -1) {
        unique.push(suggestions[i]);
      }
    }
    return unique;
  }


  /* ═══════════════════════════════════════════════════════════════
     TEMPLATES DE REPONSES PAR SCENARIO
     ═══════════════════════════════════════════════════════════════ */

  /* ── Scenario 1 : Resultats standards (> 1 resultat) ──────── */

  function _templateStandard(params, stats) {
    var n = params.resultCount;
    var q = params.query || '';
    var templates = [];

    // Template A : avec ventilation urbain/rural
    if (stats.byMilieu.urbain > 0 && stats.byMilieu.rural > 0) {
      templates.push(
        'J\'ai trouv\u00e9 ' + _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') +
        ' pour \u00ab ' + q + ' \u00bb, r\u00e9partis entre ' +
        stats.byMilieu.urbain + ' en zone urbaine et ' +
        stats.byMilieu.rural + ' en zone rurale.'
      );
    }

    // Template B : avec la commune dominante
    if (stats.topCommune && stats.topCommuneCount > 1) {
      templates.push(
        _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') + ' ' + _pl(n, 'trouv\u00e9') +
        ' ! La commune la plus repr\u00e9sent\u00e9e est ' + stats.topCommune +
        ' avec ' + stats.topCommuneCount + ' ' + _pl(stats.topCommuneCount, '\u00e9tablissement') + '.'
      );
    }

    // Template C : simple avec nombre de regions
    if (stats.regionsSorted && stats.regionsSorted.length > 1) {
      templates.push(
        'Votre recherche donne ' + _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') +
        ', r\u00e9partis sur ' + stats.regionsSorted.length +
        ' ' + _pl(stats.regionsSorted.length, 'r\u00e9gion') + ' du S\u00e9n\u00e9gal.'
      );
    }

    // Template D : avec le top region
    if (stats.regionsSorted && stats.regionsSorted.length >= 1) {
      var topReg = stats.regionsSorted[0];
      templates.push(
        'J\'ai d\u00e9nich\u00e9 ' + _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') +
        '. ' + formatRegionName(topReg) + ' arrive en t\u00eate avec ' +
        stats.byRegion[topReg] + ' ' + _pl(stats.byRegion[topReg], 'lieu', 'lieux') + '.'
      );
    }

    // Template E : neutre
    templates.push(
      _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') + ' correspondent \u00e0 votre recherche \u00ab ' + q + ' \u00bb.'
    );

    return _pick(templates);
  }


  /* ── Scenario 2 : Question de comptage (combien) ──────────── */

  function _templateCount(params, stats) {
    var n = params.resultCount;
    var q = params.query || '';
    var templates = [];

    // Template A : reponse directe avec commune
    if (stats.topCommune && stats.topCommuneCount > 1) {
      templates.push(
        'Il y a exactement ' + _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') +
        ' pour \u00ab ' + q + ' \u00bb. La commune la plus repr\u00e9sent\u00e9e est ' +
        stats.topCommune + ' avec ' + stats.topCommuneCount +
        ' ' + _pl(stats.topCommuneCount, '\u00e9tablissement') + '.'
      );
    }

    // Template B : avec repartition milieu
    if (stats.byMilieu.urbain > 0 || stats.byMilieu.rural > 0) {
      templates.push(
        'On d\u00e9nombre ' + _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') + ' au total : ' +
        stats.byMilieu.urbain + ' en milieu urbain et ' +
        stats.byMilieu.rural + ' en milieu rural.'
      );
    }

    // Template C : simple
    templates.push(
      'Exactement ' + _fmt(n) + '. Voil\u00e0 le nombre de ' + _pl(n, 'r\u00e9sultat') +
      ' pour votre recherche \u00ab ' + q + ' \u00bb.'
    );

    // Template D : avec regions
    if (stats.regionsSorted && stats.regionsSorted.length > 1) {
      var top3 = stats.regionsSorted.slice(0, 3).map(function (r) {
        return formatRegionName(r) + ' (' + stats.byRegion[r] + ')';
      });
      templates.push(
        'Il y en a ' + _fmt(n) + ' au total, principalement \u00e0 ' + top3.join(', ') + '.'
      );
    }

    return _pick(templates);
  }


  /* ── Scenario 3 : Zero resultats ──────────────────────────── */

  function _templateZero(params) {
    var q = params.query || '';
    var alternatives = suggestAlternatives(q, params.intent);
    var templates = [];

    // Template A
    templates.push(
      'Je n\'ai trouv\u00e9 aucun r\u00e9sultat pour \u00ab ' + q + ' \u00bb. ' +
      'Essayez peut-\u00eatre \u00ab ' + alternatives[0] + ' \u00bb ?'
    );

    // Template B
    templates.push(
      'H\u00e9las, aucun r\u00e9sultat pour \u00ab ' + q + ' \u00bb. \ud83d\ude14 ' +
      'Voici quelques id\u00e9es : ' + alternatives.map(function (a) { return '\u00ab ' + a + ' \u00bb'; }).join(', ') + '.'
    );

    // Template C
    templates.push(
      'Aucun r\u00e9sultat pour cette recherche. La base ne contient pas encore de donn\u00e9es correspondantes. ' +
      'Tentez \u00ab ' + alternatives[0] + ' \u00bb \u2014 cela pourrait fonctionner !'
    );

    // Template D : avec touche wolof
    templates.push(
      'Dommage, rien trouv\u00e9 pour \u00ab ' + q + ' \u00bb. Mais ne perdez pas espoir ! \ud83d\ude4f ' +
      'La teranga est partout : essayez \u00ab ' + alternatives[0] + ' \u00bb.'
    );

    return _pick(templates);
  }


  /* ── Scenario 4 : Resultat unique ─────────────────────────── */

  function _templateSingle(params) {
    var r = params.results[0];
    var doc = r.doc;
    var name = (doc.fields && doc.fields.name) ? doc.fields.name : 'lieu inconnu';
    var commune = (doc.fields && doc.fields.commune) ? doc.fields.commune : '';
    var region = (doc.fields && doc.fields.region) ? formatRegionName(doc.fields.region) : '';
    var milieu = (doc.fields && doc.fields.milieu) ? doc.fields.milieu.toLowerCase() : '';
    var typeKey = (doc.fields && doc.fields.typeKey) ? doc.fields.typeKey : '';
    var emoji = _emojiForType(typeKey);
    var templates = [];

    // Template A : complet
    var lieu = commune ? (commune + (region ? ', ' + region : '')) : region;
    templates.push(
      'J\'ai trouv\u00e9 un seul r\u00e9sultat : ' + emoji + ' ' + name +
      (lieu ? ', situ\u00e9 \u00e0 ' + lieu : '') +
      (milieu ? '. C\'est un \u00e9tablissement en milieu ' + milieu : '') + '.'
    );

    // Template B : avec distance si disponible
    if (r._distance != null) {
      templates.push(
        'Un seul r\u00e9sultat : ' + emoji + ' ' + name +
        ', \u00e0 ' + _fmtDist(r._distance) + ' de vous' +
        (region ? ' (r\u00e9gion de ' + region + ')' : '') + '.'
      );
    }

    // Template C : enthousiaste
    templates.push(
      emoji + ' Bonne nouvelle ! J\'ai trouv\u00e9 ' + name +
      (region ? ' dans la r\u00e9gion de ' + region : '') +
      '. C\'est le seul r\u00e9sultat, mais il vaut le d\u00e9tour !'
    );

    // Template D : descriptif si disponible
    var desc = (doc.fields && doc.fields.descriptif) ? doc.fields.descriptif : '';
    if (desc && desc.length > 10) {
      var shortDesc = desc.length > 80 ? desc.substring(0, 77) + '...' : desc;
      templates.push(
        'Un r\u00e9sultat unique : ' + emoji + ' ' + name +
        (lieu ? ' \u00e0 ' + lieu : '') + '. ' + shortDesc
      );
    }

    return _pick(templates);
  }


  /* ── Scenario 5 : Formations ──────────────────────────────── */

  function _templateFormation(params, stats) {
    var n = params.resultCount;
    var templates = [];

    // Ventilation par type/branche
    var branches = [];
    if (stats.typesSorted) {
      for (var i = 0; i < Math.min(3, stats.typesSorted.length); i++) {
        var t = stats.typesSorted[i];
        branches.push(stats.byType[t] + ' en ' + t.toLowerCase());
      }
    }
    var branchesText = branches.length ? ', dont ' + branches.join(' et ') : '';

    // Determiner la region dominante
    var regionText = '';
    if (stats.regionsSorted && stats.regionsSorted.length >= 1) {
      regionText = ' dans la r\u00e9gion de ' + formatRegionName(stats.regionsSorted[0]);
    }

    // Template A
    templates.push(
      '\ud83c\udf93 Il existe ' + _fmt(n) + ' ' + _pl(n, 'formation') +
      regionText + branchesText + '.'
    );

    // Template B
    templates.push(
      'J\'ai recens\u00e9 ' + _fmt(n) + ' ' + _pl(n, 'formation') +
      ' ' + _pl(n, 'disponible') + regionText + '.' +
      (branches.length ? ' On y trouve notamment ' + branches.join(', ') + '.' : '')
    );

    // Template C
    templates.push(
      _fmt(n) + ' ' + _pl(n, 'offre') + ' de formation ' +
      _pl(n, 'r\u00e9pertori\u00e9e') + regionText + '. ' +
      'De quoi nourrir votre passion artistique ! \ud83c\udfa8'
    );

    // Template D : avec milieu
    if (stats.byMilieu.urbain > 0 && stats.byMilieu.rural > 0) {
      templates.push(
        '\ud83c\udf93 ' + _fmt(n) + ' ' + _pl(n, 'formation') + ' ' +
        _pl(n, 'trouv\u00e9e') + ' : ' + stats.byMilieu.urbain +
        ' en zone urbaine et ' + stats.byMilieu.rural + ' en zone rurale.'
      );
    }

    return _pick(templates);
  }


  /* ── Scenario 6 : Comparaison / statistiques multi-regions ── */

  function _templateComparison(stats) {
    if (!stats.regionsSorted || stats.regionsSorted.length < 2) {
      return null; // Pas assez de regions pour comparer
    }

    var templates = [];
    var first = stats.regionsSorted[0];
    var second = stats.regionsSorted[1];
    var third = stats.regionsSorted.length > 2 ? stats.regionsSorted[2] : null;

    // Template A : podium
    var podium = formatRegionName(first) + ' domine avec ' +
      stats.byRegion[first] + ' ' + _pl(stats.byRegion[first], 'lieu', 'lieux') + ' culturel' +
      (stats.byRegion[first] > 1 ? 's' : '') + ', ' +
      _pl(stats.byRegion[first], 'suivi', 'suivi') + ' de ' +
      formatRegionName(second) + ' (' + stats.byRegion[second] + ')';
    if (third) {
      podium += ' et ' + formatRegionName(third) + ' (' + stats.byRegion[third] + ')';
    }
    templates.push(podium + '.');

    // Template B : focus top region
    templates.push(
      _emojiForRegion(first) + ' ' + formatRegionName(first) +
      ' concentre ' + stats.byRegion[first] + ' ' +
      _pl(stats.byRegion[first], 'r\u00e9sultat') +
      ', soit ' + Math.round(stats.byRegion[first] / stats.total * 100) +
      ' % du total. ' + formatRegionName(second) +
      ' suit avec ' + stats.byRegion[second] + '.'
    );

    // Template C : phrase comparative
    templates.push(
      'Les r\u00e9sultats se r\u00e9partissent entre ' + stats.regionsSorted.length +
      ' r\u00e9gions. En t\u00eate : ' +
      stats.regionsSorted.slice(0, 3).map(function (r) {
        return formatRegionName(r) + ' (' + stats.byRegion[r] + ')';
      }).join(', ') + '.'
    );

    return _pick(templates);
  }


  /* ── Scenario 7 : Proximite ───────────────────────────────── */

  function _templateProximity(params) {
    var results = params.results || [];
    if (!results.length) return null;

    // Trier par distance
    var withDist = results.filter(function (r) { return r._distance != null; });
    if (!withDist.length) return null;

    withDist.sort(function (a, b) { return a._distance - b._distance; });

    var closest = withDist[0];
    var closestName = (closest.doc.fields && closest.doc.fields.name) ? closest.doc.fields.name : 'un lieu culturel';
    var closestDist = _fmtDist(closest._distance);
    var emoji = _emojiForType((closest.doc.fields && closest.doc.fields.typeKey) || '');

    // Compter dans differents rayons
    var within1km = withDist.filter(function (r) { return r._distance <= 1; }).length;
    var within2km = withDist.filter(function (r) { return r._distance <= 2; }).length;
    var within5km = withDist.filter(function (r) { return r._distance <= 5; }).length;

    var templates = [];

    // Template A
    templates.push(
      emoji + ' Le plus proche est ' + closestName + ' \u00e0 ' + closestDist + '.' +
      (within2km > 1 ? ' Il y a ' + within2km + ' ' + _pl(within2km, 'lieu', 'lieux') +
      ' culturel' + (within2km > 1 ? 's' : '') + ' dans un rayon de 2 km.' : '')
    );

    // Template B
    templates.push(
      '\u00c0 ' + closestDist + ' de vous : ' + emoji + ' ' + closestName + '. ' +
      (within5km > 1 ? _fmt(within5km) + ' ' + _pl(within5km, 'lieu', 'lieux') +
      ' ' + _pl(within5km, 'culturel') + ' ' +
      _pl(within5km, 'se trouve', 'se trouvent') +
      ' dans un rayon de 5 km.' : 'C\'est le seul r\u00e9sultat \u00e0 proximit\u00e9.')
    );

    // Template C
    if (within1km >= 2) {
      templates.push(
        'Bonne nouvelle ! \ud83c\udf1f ' + within1km + ' ' +
        _pl(within1km, 'lieu', 'lieux') + ' culturel' +
        (within1km > 1 ? 's' : '') + ' \u00e0 moins d\'1 km. Le plus proche : ' +
        emoji + ' ' + closestName + ' (' + closestDist + ').'
      );
    }

    // Template D
    templates.push(
      'Voici ce qu\'il y a autour de vous : ' + emoji + ' ' + closestName +
      ' est \u00e0 seulement ' + closestDist + '.' +
      (withDist.length > 1 ? ' ' + _fmt(withDist.length) + ' ' +
      _pl(withDist.length, 'r\u00e9sultat') + ' avec localisation disponible.' : '')
    );

    return _pick(templates);
  }


  /* ── Scenario 8 : Contextuel / suivi de filtrage ──────────── */

  function _templateContextual(params, stats) {
    var n = params.resultCount;
    var templates = [];

    // Template A
    if (stats.byMilieu.urbain > 0 || stats.byMilieu.rural > 0) {
      templates.push(
        'Parmi les r\u00e9sultats pr\u00e9c\u00e9dents, ' + _fmt(n) +
        ' correspondent \u00e0 votre nouveau filtre : ' +
        stats.byMilieu.urbain + ' en zone urbaine et ' +
        stats.byMilieu.rural + ' en zone rurale.'
      );
    }

    // Template B
    templates.push(
      'Apr\u00e8s filtrage, il reste ' + _fmt(n) + ' ' + _pl(n, 'r\u00e9sultat') + '.'
    );

    // Template C
    if (stats.regionsSorted && stats.regionsSorted.length >= 1) {
      templates.push(
        'En affinant votre recherche, j\'obtiens ' + _fmt(n) + ' ' +
        _pl(n, 'r\u00e9sultat') + ', principalement \u00e0 ' +
        formatRegionName(stats.regionsSorted[0]) + '.'
      );
    }

    // Template D
    templates.push(
      'Votre filtre r\u00e9duit les r\u00e9sultats \u00e0 ' + _fmt(n) +
      '. Voici ce qui correspond le mieux.'
    );

    return _pick(templates);
  }


  /* ── Scenario 9 : Enthousiasme / decouverte ───────────────── */

  function _templateDiscovery(params, stats) {
    var n = params.resultCount;
    var templates = [];

    if (stats.regionsSorted && stats.regionsSorted.length >= 1) {
      var reg = formatRegionName(stats.regionsSorted[0]);
      var emoji = _emojiForRegion(stats.regionsSorted[0]);

      // Template A
      templates.push(
        emoji + ' ' + reg + ' est ' + _pick(DISCOVERY_ADJECTIVES) +
        ' ! D\u00e9couvrez ses ' + _fmt(n) + ' ' +
        _pl(n, 'lieu', 'lieux') + ' culturel' + (n > 1 ? 's' : '') + '.'
      );

      // Template B
      templates.push(
        'Explorez ' + reg + ' et ses ' + _fmt(n) + ' ' +
        _pl(n, 'tr\u00e9sor') + ' culturel' + (n > 1 ? 's' : '') +
        '. La teranga vous attend ! \u2728'
      );

      // Template C : avec types
      if (stats.typesSorted && stats.typesSorted.length >= 2) {
        templates.push(
          emoji + ' ' + reg + ' vous r\u00e9serve de belles surprises : ' +
          _fmt(n) + ' lieux entre ' + stats.typesSorted[0].toLowerCase() +
          (stats.typesSorted[0].slice(-1) === 's' ? '' : 's') +
          ' et ' + stats.typesSorted[1].toLowerCase() +
          (stats.typesSorted[1].slice(-1) === 's' ? '' : 's') + '.'
        );
      }
    }

    // Template D : generique enthousiaste
    templates.push(
      '\ud83c\udf1f Quelle richesse ! ' + _fmt(n) + ' ' +
      _pl(n, 'lieu', 'lieux') + ' culturel' + (n > 1 ? 's' : '') +
      ' \u00e0 d\u00e9couvrir. Le S\u00e9n\u00e9gal ne cesse de surprendre !'
    );

    // Template E : avec touche wolof
    templates.push(
      _pick(WOLOF_TOUCHES) + ' ' + _fmt(n) + ' ' +
      _pl(n, 'lieu', 'lieux') + ' culturel' + (n > 1 ? 's' : '') +
      ' vous attendent. La culture s\u00e9n\u00e9galaise est vivante et g\u00e9n\u00e9reuse.'
    );

    return _pick(templates);
  }


  /* ═══════════════════════════════════════════════════════════════
     FONCTION PRINCIPALE : generate()
     ═══════════════════════════════════════════════════════════════ */

  /**
   * Genere une reponse en langage naturel adapte au contexte de recherche.
   *
   * @param {object} params
   *   @param {string}  params.query        — Requete de l'utilisateur
   *   @param {object}  [params.intent]     — Intent parse par SearchEngine.parseIntent
   *   @param {Array}   [params.results]    — Tableau de resultats { doc, score, _distance? }
   *   @param {number}  params.resultCount  — Nombre de resultats
   *   @param {boolean} [params.isContextual] — true si c'est un filtrage de resultats precedents
   *   @param {number}  [params.userDistance] — Distance max fournie par l'utilisateur (km)
   * @returns {string} Reponse en francais naturel
   */
  function generate(params) {
    if (!params) return '';

    var results = params.results || [];
    var count = params.resultCount != null ? params.resultCount : results.length;
    var intent = params.intent || {};
    var stats = generateStats(results);

    // ── Cas 0 resultats ──
    if (count === 0) {
      return _templateZero(params);
    }

    // ── Cas 1 resultat unique ──
    if (count === 1 && results.length === 1) {
      return _templateSingle(params);
    }

    // ── Cas contextuel (filtrage de resultats precedents) ──
    if (params.isContextual) {
      return _templateContextual(params, stats);
    }

    // ── Cas question "combien" ──
    if (intent.quantity === 'count') {
      return _templateCount(params, stats);
    }

    // ── Cas proximite ──
    var hasDistances = results.some(function (r) { return r._distance != null; });
    if ((intent.proximity || params.userDistance || hasDistances) && results.length > 0) {
      var proxResponse = _templateProximity(params);
      if (proxResponse) return proxResponse;
    }

    // ── Cas formations ──
    var isFormationSearch = (intent.wantFormations && !intent.wantInfra) ||
      (stats.totalFormations > 0 && stats.totalFormations >= stats.totalInfra);
    if (isFormationSearch) {
      return _templateFormation(params, stats);
    }

    // ── Cas exploration / decouverte (requetes generales) ──
    var explorationKeywords = ['d\u00e9couvrir', 'explorer', 'visiter', 'voir', 'culture', 'quoi faire'];
    var queryLower = (params.query || '').toLowerCase();
    var isExploration = explorationKeywords.some(function (kw) { return queryLower.includes(kw); });
    if (isExploration && count > 5) {
      return _templateDiscovery(params, stats);
    }

    // ── Cas multi-regions : comparaison ──
    if (stats.regionsSorted && stats.regionsSorted.length >= 3 && count > 10) {
      // 30% de chance d'utiliser le template comparaison pour varier
      if (Math.random() < 0.3) {
        var comp = _templateComparison(stats);
        if (comp) return comp;
      }
    }

    // ── Cas standard ──
    return _templateStandard(params, stats);
  }


  /* ── API publique ─────────────────────────────────────────── */

  return {
    generate:             generate,
    generateStats:        generateStats,
    suggestAlternatives:  suggestAlternatives,
    formatRegionName:     formatRegionName,
    generateGreeting:     generateGreeting,
  };

})();
