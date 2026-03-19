/**
 * Analytics — Suivi analytique intégré pour la plateforme Culte
 * Stockage localStorage, respect de la vie privée, aucune donnée personnelle
 */
const Analytics = (() => {
  const STORAGE_KEY = 'culte_analytics';
  const MAX_EVENTS = 500;
  const RETENTION_DAYS = 30;

  // --- Stockage ---

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function _save(events) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  /** Ajouter un événement avec nettoyage automatique */
  function _push(event) {
    const events = _load();
    events.push({ ...event, ts: Date.now() });
    // Nettoyage : supprimer les événements de plus de 30 jours
    const cutoff = Date.now() - RETENTION_DAYS * 86400000;
    const cleaned = events.filter(e => e.ts >= cutoff);
    // FIFO si dépassement
    const trimmed = cleaned.length > MAX_EVENTS
      ? cleaned.slice(cleaned.length - MAX_EVENTS)
      : cleaned;
    _save(trimmed);
  }

  /** Filtrer les événements par type */
  function _ofType(type) {
    return _load().filter(e => e.type === type);
  }

  // --- Suivi d'événements ---

  function trackSearch(query, resultCount) {
    _push({ type: 'search', query: String(query).toLowerCase().trim(), resultCount });
  }

  function trackView(itemId, itemType, region) {
    _push({ type: 'view', itemId, itemType, region });
  }

  function trackFavorite(itemId) {
    _push({ type: 'favorite', itemId });
  }

  function trackShare(itemId, platform) {
    _push({ type: 'share', itemId, platform });
  }

  function trackVoiceSearch(query, language) {
    _push({ type: 'voice', query: String(query).toLowerCase().trim(), language });
  }

  function trackTabSwitch(tabName) {
    _push({ type: 'tab', tabName });
  }

  // --- Agrégation ---

  /** Compter les occurrences d'un champ et retourner le top N */
  function _topN(events, field, limit) {
    const counts = {};
    events.forEach(e => {
      const key = e[field];
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([value, count]) => ({ value, count }));
  }

  function getPopularSearches(limit = 10) {
    const all = [..._ofType('search'), ..._ofType('voice')];
    return _topN(all, 'query', limit);
  }

  function getPopularRegions(limit = 10) {
    return _topN(_ofType('view'), 'region', limit);
  }

  function getPopularTypes(limit = 10) {
    return _topN(_ofType('view'), 'itemType', limit);
  }

  /** Recherches groupées par jour sur les 7 derniers jours */
  function getSearchTrends() {
    const now = Date.now();
    const searches = [..._ofType('search'), ..._ofType('voice')];
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
    }
    searches.forEach(e => {
      const key = new Date(e.ts).toISOString().slice(0, 10);
      if (key in days) days[key]++;
    });
    return days;
  }

  function getSessionStats() {
    const events = _load();
    const searches = events.filter(e => e.type === 'search' || e.type === 'voice');
    const views = events.filter(e => e.type === 'view');
    const favorites = events.filter(e => e.type === 'favorite');
    const timestamps = events.map(e => e.ts).filter(Boolean);

    const topQuery = getPopularSearches(1)[0];
    const topRegion = getPopularRegions(1)[0];
    const resultCounts = searches.map(s => s.resultCount).filter(n => typeof n === 'number');
    const avgResultCount = resultCounts.length
      ? Math.round(resultCounts.reduce((a, b) => a + b, 0) / resultCounts.length)
      : 0;

    // Sessions estimées : regrouper par intervalles de 30 min
    let sessionCount = timestamps.length ? 1 : 0;
    const sorted = [...timestamps].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] > 1800000) sessionCount++;
    }

    return {
      totalSearches: searches.length,
      totalViews: views.length,
      totalFavorites: favorites.length,
      avgResultCount,
      topQuery: topQuery ? topQuery.value : null,
      topRegion: topRegion ? topRegion.value : null,
      firstVisit: sorted.length ? new Date(sorted[0]).toISOString() : null,
      lastVisit: sorted.length ? new Date(sorted[sorted.length - 1]).toISOString() : null,
      sessionCount
    };
  }

  /** Activité par heure (0-23) — nombre de recherches */
  function getHourlyActivity() {
    const hours = new Array(24).fill(0);
    const searches = [..._ofType('search'), ..._ofType('voice')];
    searches.forEach(e => {
      hours[new Date(e.ts).getHours()]++;
    });
    return hours;
  }

  /** Répartition des langues de recherche vocale */
  function getLanguageStats() {
    return _topN(_ofType('voice'), 'language', 50);
  }

  // --- Tableau de bord ---

  function renderDashboard() {
    const stats = getSessionStats();
    const topSearches = getPopularSearches(5);
    const topRegions = getPopularRegions(3);
    const trends = getSearchTrends();
    const trendValues = Object.values(trends);
    const trendMax = Math.max(...trendValues, 1);

    // Badges recherches populaires
    const searchItems = topSearches.length
      ? topSearches.map(s =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0">
          <span>${_esc(s.value)}</span>
          <span style="background:rgba(255,255,255,.15);border-radius:12px;padding:2px 10px;font-size:.8em">${s.count}</span>
        </div>`).join('')
      : '<div style="opacity:.6">Aucune recherche</div>';

    // Barres régions
    const regionBars = topRegions.length
      ? topRegions.map(r => {
        const pct = Math.round((r.count / topRegions[0].count) * 100);
        return `<div style="margin:4px 0">
          <div style="display:flex;justify-content:space-between;font-size:.85em">
            <span>${_esc(r.value)}</span><span>${r.count}</span>
          </div>
          <div style="background:rgba(255,255,255,.1);border-radius:4px;height:6px;margin-top:2px">
            <div style="width:${pct}%;height:100%;border-radius:4px;background:linear-gradient(90deg,#f7c948,#f56565)"></div>
          </div>
        </div>`;
      }).join('')
      : '<div style="opacity:.6">Aucune vue</div>';

    // Sparkline CSS des 7 derniers jours
    const sparkBars = Object.entries(trends).map(([day, count]) => {
      const h = Math.max(Math.round((count / trendMax) * 40), 2);
      const label = day.slice(5); // MM-DD
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1">
        <div style="width:100%;max-width:18px;height:${h}px;background:linear-gradient(180deg,#f7c948,#ed8936);border-radius:3px"></div>
        <span style="font-size:.6em;opacity:.7">${label}</span>
      </div>`;
    }).join('');

    return `<div style="background:rgba(20,20,35,.75);backdrop-filter:blur(16px);border-radius:16px;padding:20px;color:#fff;font-family:system-ui,sans-serif;max-width:380px">
  <h3 style="margin:0 0 14px;font-size:1.1em">📊 Tableau de bord</h3>

  <div style="display:flex;gap:10px;margin-bottom:16px;text-align:center">
    <div style="flex:1;background:rgba(255,255,255,.08);border-radius:10px;padding:10px">
      <div style="font-size:1.4em;font-weight:700">${stats.totalSearches}</div>
      <div style="font-size:.7em;opacity:.7">🔍 Recherches</div>
    </div>
    <div style="flex:1;background:rgba(255,255,255,.08);border-radius:10px;padding:10px">
      <div style="font-size:1.4em;font-weight:700">${stats.totalViews}</div>
      <div style="font-size:.7em;opacity:.7">👁️ Vues</div>
    </div>
    <div style="flex:1;background:rgba(255,255,255,.08);border-radius:10px;padding:10px">
      <div style="font-size:1.4em;font-weight:700">${stats.totalFavorites}</div>
      <div style="font-size:.7em;opacity:.7">⭐ Favoris</div>
    </div>
  </div>

  <div style="margin-bottom:14px">
    <h4 style="margin:0 0 6px;font-size:.9em">🔥 Recherches populaires</h4>
    ${searchItems}
  </div>

  <div style="margin-bottom:14px">
    <h4 style="margin:0 0 6px;font-size:.9em">🌍 Régions visitées</h4>
    ${regionBars}
  </div>

  <div>
    <h4 style="margin:0 0 6px;font-size:.9em">📈 7 derniers jours</h4>
    <div style="display:flex;align-items:flex-end;gap:4px;height:50px;padding-top:8px">
      ${sparkBars}
    </div>
  </div>
</div>`;
  }

  /** Échapper le HTML */
  function _esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  // --- Gestion des données ---

  /** Exporter toutes les données en JSON */
  function exportData() {
    return JSON.stringify(_load(), null, 2);
  }

  /** Effacer toutes les données analytiques */
  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // --- API publique ---
  return {
    trackSearch,
    trackView,
    trackFavorite,
    trackShare,
    trackVoiceSearch,
    trackTabSwitch,
    getPopularSearches,
    getPopularRegions,
    getPopularTypes,
    getSearchTrends,
    getSessionStats,
    getHourlyActivity,
    getLanguageStats,
    renderDashboard,
    export: exportData,
    clear
  };
})();
