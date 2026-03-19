/* ════════════════════════════════════════════════════════════════
   CULTE — Moteur de Recommandations Personnalisées
   Analyse le comportement utilisateur pour proposer du contenu
   culturel sénégalais pertinent et diversifié.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const Recommendations = (() => {

  /* ── Configuration ────────────────────────────────────────────── */
  const KEYS = {
    searches: 'culte_reco_searches',  // Historique recherches
    views:    'culte_reco_views',     // Éléments consultés
    trending: 'culte_reco_trending',  // Compteur popularité globale
    favs:     'culte_favs',           // Favoris (géré par l'app)
  };
  const MAX_SEARCHES = 30;
  const MAX_VIEWS    = 100;
  const DECAY_DAYS   = 14; // Demi-vie en jours (décroissance temporelle)

  // Poids du scoring
  const W = { type: 3, region: 2, recency: 1, diversity: 1.5 };

  // Humeur → types culturels correspondants
  const MOOD_MAP = {
    discovery:     ['Galerie', 'Musée', 'Village artisanal', 'Maison de la culture'],
    learning:      ['Bibliothèque', 'Centre culturel', 'Maison de la culture'],
    entertainment: ['Cinéma', 'Salle de spectacle', 'Salle des fêtes'],
    heritage:      ['Musée', 'Maison de la culture', 'Village artisanal', 'Galerie'],
  };

  // Icônes par type d'infrastructure
  const TYPE_ICONS = {
    'Musée': '🏛️', 'Galerie': '🎨', 'Cinéma': '🎬', 'Bibliothèque': '📚',
    'Salle de spectacle': '🎭', 'Salle des fêtes': '🎉', 'Foyer des femmes': '👩',
    'Foyer des jeunes': '🧑', 'Village artisanal': '🏺',
    'Maison de la culture': '🏠', 'Centre culturel': '🎵',
  };

  // Mots-clés pour catégoriser les recherches
  const CAT_KEYWORDS = {
    arts:     ['art', 'peinture', 'sculpture', 'galerie', 'exposition'],
    music:    ['musique', 'concert', 'instrument', 'jazz', 'mbalax'],
    cinema:   ['cinema', 'film', 'projection', 'court-metrage'],
    heritage: ['patrimoine', 'histoire', 'monument', 'tradition'],
    literary: ['livre', 'lecture', 'biblioth', 'ecrivain', 'poesie'],
    dance:    ['danse', 'ballet', 'sabar', 'spectacle'],
  };

  /* ── Stockage localStorage ────────────────────────────────────── */
  function _load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }
  function _save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn('[Recommendations] Erreur sauvegarde:', e); }
  }

  /* ── Accès aux données ────────────────────────────────────────── */
  function _getDocs() {
    return (typeof SearchEngine !== 'undefined' && SearchEngine.docs) ? SearchEngine.docs : [];
  }
  function _getFavoriteKeys() {
    try { return JSON.parse(localStorage.getItem(KEYS.favs)) || []; }
    catch { return []; }
  }

  /* ── Décroissance temporelle (exponentielle, demi-vie = DECAY_DAYS) */
  function _decay(ts) {
    return Math.exp(-0.693 * (Date.now() - ts) / (DECAY_DAYS * 86400000));
  }

  /* ── Mélange Fisher-Yates ─────────────────────────────────────── */
  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Échapper le HTML */
  function _esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ══════════════════════════════════════════════════════════════
     TRACKING — Suivi du comportement utilisateur
  ══════════════════════════════════════════════════════════════ */

  /** Enregistrer une recherche */
  function trackSearch(query) {
    if (!query || !query.trim()) return;
    const list = _load(KEYS.searches);
    list.unshift({ q: query.trim().toLowerCase(), ts: Date.now() });
    if (list.length > MAX_SEARCHES) list.length = MAX_SEARCHES;
    _save(KEYS.searches, list);
  }

  /** Enregistrer la consultation d'un élément (doc SearchEngine) */
  function trackView(record) {
    if (!record || record.id == null) return;
    const views = _load(KEYS.views);
    views.unshift({
      id: record.id, type: record.fields?.typeKey || '',
      region: record.fields?.region || '', name: record.fields?.name || '',
      ts: Date.now(),
    });
    if (views.length > MAX_VIEWS) views.length = MAX_VIEWS;
    _save(KEYS.views, views);
    _incrementTrending(record.id);
  }

  /** Signaler un favori pour renforcer le profil */
  function trackFavorite(favKey) {
    if (!favKey) return;
    const name = favKey.replace(/^[IF]:/, '');
    const doc = _getDocs().find(d =>
      (d.fields.name || '').toUpperCase() === name.toUpperCase()
    );
    if (doc) trackView(doc);
  }

  /** Incrémenter le compteur trending global */
  function _incrementTrending(docId) {
    const trending = _load(KEYS.trending);
    const entry = trending.find(t => t.id === docId);
    if (entry) { entry.count++; entry.lastSeen = Date.now(); }
    else trending.push({ id: docId, count: 1, lastSeen: Date.now() });
    if (trending.length > 500) {
      trending.sort((a, b) => b.count - a.count);
      trending.length = 200;
    }
    _save(KEYS.trending, trending);
  }

  /* ══════════════════════════════════════════════════════════════
     PROFIL — Construit à partir des données trackées
  ══════════════════════════════════════════════════════════════ */

  /** Construire le profil utilisateur : types, régions, catégories préférés */
  function buildProfile() {
    const views    = _load(KEYS.views);
    const searches = _load(KEYS.searches);
    const favKeys  = _getFavoriteKeys();
    const typeCounts = {}, regionCounts = {};

    // Compter types et régions vus, pondérés par récence
    for (const v of views) {
      const w = _decay(v.ts);
      if (v.type)   typeCounts[v.type]     = (typeCounts[v.type] || 0) + w;
      if (v.region) regionCounts[v.region]  = (regionCounts[v.region] || 0) + w;
    }

    // Renforcer avec les favoris (poids x3)
    for (const key of favKeys) {
      const name = key.replace(/^[IF]:/, '');
      const doc = _getDocs().find(d =>
        (d.fields.name || '').toUpperCase() === name.toUpperCase()
      );
      if (doc) {
        if (doc.fields.typeKey) typeCounts[doc.fields.typeKey] = (typeCounts[doc.fields.typeKey] || 0) + 3;
        if (doc.fields.region)  regionCounts[doc.fields.region] = (regionCounts[doc.fields.region] || 0) + 3;
      }
    }

    const sortDesc = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(e => e[0]);

    // Catégories extraites des recherches
    const catScores = {};
    for (const s of searches) {
      const q = (s.q || '').toLowerCase(), w = _decay(s.ts);
      for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
        if (kws.some(k => q.includes(k))) catScores[cat] = (catScores[cat] || 0) + w;
      }
    }

    // Niveau d'activité
    const total = views.length + searches.length + favKeys.length;
    const activityLevel = total > 50 ? 'power' : total > 15 ? 'regular' : 'casual';

    return {
      types:   sortDesc(typeCounts),
      regions: sortDesc(regionCounts),
      categories: sortDesc(catScores),
      activityLevel,
      viewedIds: new Set(views.map(v => v.id)),
    };
  }

  /* ══════════════════════════════════════════════════════════════
     SCORING — Algorithme de pertinence personnalisée
     Poids : type(3), région(2), récence(1), diversité(1.5)
  ══════════════════════════════════════════════════════════════ */

  function _scoreDoc(doc, profile, views) {
    let score = 0;
    const type = doc.fields.typeKey || '', region = doc.fields.region || '';

    // Correspondance type (rang élevé = bonus fort)
    const ti = profile.types.indexOf(type);
    if (ti !== -1) score += W.type * (1 / (1 + ti * 0.3));

    // Correspondance région
    const ri = profile.regions.indexOf(region);
    if (ri !== -1) score += W.region * (1 / (1 + ri * 0.3));

    // Récence : bonus si un élément similaire a été vu récemment
    const recent = views.find(v =>
      (v.type === type || v.region === region) && (Date.now() - v.ts < DECAY_DAYS * 86400000)
    );
    if (recent) score += W.recency * _decay(recent.ts);

    // Diversité : bonus pour types/régions inexplorés
    if (ti === -1 && profile.types.length > 0) score += W.diversity * 0.5;
    if (ri === -1 && profile.regions.length > 0) score += W.diversity * 0.5;

    return score;
  }

  /* ══════════════════════════════════════════════════════════════
     RECOMMANDATIONS — 5 méthodes publiques
  ══════════════════════════════════════════════════════════════ */

  /** Recommandations personnalisées "Pour vous" */
  function getForYou(limit = 10) {
    const docs = _getDocs();
    if (!docs.length) return [];
    const profile = buildProfile();
    const views = _load(KEYS.views);

    // Scorer les docs non-vus en priorité
    const scored = docs
      .filter(d => !profile.viewedIds.has(d.id))
      .map(d => ({ doc: d, score: _scoreDoc(d, profile, views) }))
      .sort((a, b) => b.score - a.score);

    // Compléter avec des déjà-vus si nécessaire (score réduit)
    if (scored.length < limit) {
      const rest = docs
        .filter(d => profile.viewedIds.has(d.id))
        .map(d => ({ doc: d, score: _scoreDoc(d, profile, views) * 0.5 }))
        .sort((a, b) => b.score - a.score);
      scored.push(...rest);
    }
    return scored.slice(0, limit).map(s => s.doc);
  }

  /** Éléments similaires à un document donné (même type/région/commune) */
  function getSimilar(record, limit = 6) {
    if (!record) return [];
    const refType = record.fields?.typeKey || '';
    const refRegion = record.fields?.region || '';
    const refCommune = record.fields?.commune || '';

    return _getDocs()
      .filter(d => d.id !== record.id)
      .map(d => {
        let s = 0;
        if (d.fields.typeKey === refType)     s += 3;
        if (d.fields.region === refRegion)    s += 2;
        if (refCommune && d.fields.commune === refCommune) s += 1;
        return { doc: d, score: s };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.doc);
  }

  /** Éléments les plus populaires (trending), pondérés par récence */
  function getTrending(limit = 10) {
    const trending = _load(KEYS.trending);
    const docs = _getDocs();
    if (!trending.length || !docs.length) return _shuffle(docs).slice(0, limit);

    return trending
      .map(t => {
        const doc = docs.find(d => d.id === t.id);
        return doc ? { doc, score: t.count * _decay(t.lastSeen) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.doc);
  }

  /** Mode exploration : types et régions que l'utilisateur n'a PAS visités */
  function getExplore(limit = 10) {
    const docs = _getDocs();
    if (!docs.length) return [];
    const profile = buildProfile();
    const knownTypes   = new Set(profile.types);
    const knownRegions = new Set(profile.regions);

    const candidates = docs.filter(d =>
      !knownTypes.has(d.fields.typeKey) || !knownRegions.has(d.fields.region)
    );
    return _shuffle(candidates).slice(0, limit);
  }

  /** Recommandations par humeur : discovery, learning, entertainment, heritage */
  function getByMood(mood, limit = 10) {
    const targetTypes = MOOD_MAP[mood] || MOOD_MAP.discovery;
    const matching = _getDocs().filter(d =>
      targetTypes.some(t => (d.fields.typeKey || '').toLowerCase().includes(t.toLowerCase()))
    );
    return _shuffle(matching).slice(0, limit);
  }

  /* ══════════════════════════════════════════════════════════════
     WIDGET — HTML de la section "Pour vous" (5 cartes)
  ══════════════════════════════════════════════════════════════ */

  /** Générer une raison contextuelle pour la recommandation */
  function _reason(doc, profile) {
    const type = doc.fields.typeKey || '', region = doc.fields.region || '';
    if (profile.types.length && profile.types[0] === type)
      return `Parce que vous aimez les ${type.toLowerCase()}s`;
    if (profile.regions.length && profile.regions[0] === region)
      return `Populaire dans la région de ${region}`;
    if (!profile.types.includes(type))
      return `Découvrez : ${type}`;
    return 'Recommandé pour vous';
  }

  /** Retourne le HTML complet du widget de recommandations */
  function renderWidget() {
    const items = getForYou(5);
    if (!items.length) {
      return `<div class="reco-widget reco-empty">
        <h3>Pour vous</h3>
        <p>Explorez la plateforme pour recevoir des recommandations personnalisées !</p>
      </div>`;
    }
    const profile = buildProfile();
    const cards = items.map(doc => {
      const type = doc.fields.typeKey || 'Lieu culturel';
      const icon = TYPE_ICONS[type] || '📍';
      return `<div class="reco-card" data-doc-id="${doc.id}">
          <span class="reco-icon">${icon}</span>
          <div class="reco-info">
            <strong class="reco-name">${_esc(doc.fields.name || 'Sans nom')}</strong>
            <span class="reco-type">${_esc(type)}</span>
            <span class="reco-region">${_esc(doc.fields.region || '')}</span>
            <em class="reco-reason">${_esc(_reason(doc, profile))}</em>
          </div>
        </div>`;
    }).join('');

    return `<div class="reco-widget">
      <h3>Pour vous</h3>
      <div class="reco-cards">${cards}</div>
    </div>`;
  }

  /* ── API publique ─────────────────────────────────────────────── */
  return {
    trackSearch, trackView, trackFavorite,
    buildProfile,
    getForYou, getSimilar, getTrending, getExplore, getByMood,
    renderWidget,
  };

})();
