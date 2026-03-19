/* ════════════════════════════════════════════════════════════════
   CULTE — Mémoire Conversationnelle
   Gestion du contexte, résolution de requêtes de suivi,
   persistance en session, statistiques d'utilisation
   ════════════════════════════════════════════════════════════════ */
'use strict';

const ConversationMemory = (() => {

  /* ── Constantes ─────────────────────────────────────────────── */
  const MAX_HISTORY       = 10;        // Nombre max d'entrées conservées
  const STORAGE_KEY       = 'culte_conversation_memory';

  /* ── Patterns de détection contextuelle ────────────────────── */
  const PATTERNS = {
    // Suivi / ajout : « et à Thiès ? », « aussi les galeries »
    followUp:        /^(et |aussi |également |de même )/i,

    // Filtre milieu : « en milieu rural », « lesquels sont urbains »
    filter:          /\b(en milieu|zone|rural|urbain|lesquels|ceux qui)\b/i,

    // Comptage : « combien ? », « c'est combien ? »
    count:           /^(combien|c'est combien|quel nombre|le total)/i,

    // Remplacement : « non plutôt X », « finalement X »
    replace:         /^(non |plutôt |finalement |en fait )/i,

    // Réinitialisation : « autre chose », « nouvelle recherche »
    reset:           /^(autre chose|nouvelle recherche|efface|recommence|reset)/i,

    // Changement de lieu : « les mêmes à Kaolack »
    locationChange:  /\b(les mêmes|pareil|idem)\b.*\b(à|en|au)\b/i,

    // Sélection dans les résultats : « le premier », « le 3ème »
    selection:       /\b(le premier|le dernier|le \d+|numéro \d+)\b/i,

    // Demande de détails : « plus de détails », « montre-moi plus »
    expand:          /\b(plus de détails|montre[- ]moi plus|développe|détaille|en savoir plus)\b/i,
  };

  /* ── État interne ──────────────────────────────────────────── */
  let history = [];

  /* ── Utilitaires ───────────────────────────────────────────── */

  /**
   * Normalise une chaîne FR : minuscules, suppression accents,
   * apostrophes uniformisées, tirets → espaces
   */
  function normalize(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[''`]/g, "'")
      .replace(/[-_]/g, ' ')
      .trim();
  }

  /**
   * Clone profond d'un objet (structures simples uniquement)
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ── Persistance sessionStorage ────────────────────────────── */

  /** Sauvegarde l'historique en sessionStorage */
  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (_) {
      // sessionStorage indisponible ou plein — on continue en mémoire
    }
  }

  /** Restaure l'historique depuis sessionStorage */
  function restore() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          history = parsed.slice(-MAX_HISTORY);
        }
      }
    } catch (_) {
      history = [];
    }
  }

  /* ── Détection contextuelle ────────────────────────────────── */

  /**
   * Détermine si le texte est une requête contextuelle
   * (fait référence à un contexte précédent)
   * @param  {string}  text — texte brut de la requête
   * @return {boolean}
   */
  function isContextual(text) {
    if (!history.length) return false;

    const norm = normalize(text);

    // Réinitialisation explicite → pas contextuel (c'est une rupture)
    if (PATTERNS.reset.test(norm)) return false;

    // Vérifier chaque pattern contextuel
    return (
      PATTERNS.followUp.test(norm)       ||
      PATTERNS.filter.test(norm)         ||
      PATTERNS.count.test(norm)          ||
      PATTERNS.replace.test(norm)        ||
      PATTERNS.locationChange.test(norm) ||
      PATTERNS.selection.test(norm)      ||
      PATTERNS.expand.test(norm)
    );
  }

  /* ── Extraction de paramètres depuis le texte ──────────────── */

  /**
   * Extrait un nom de région depuis le texte de suivi
   * Cherche les patterns « à X », « en X », « au X »
   */
  function extractRegion(text) {
    const match = text.match(/\b(?:à|en|au)\s+([A-ZÀ-Ÿa-zà-ÿ\-]+)/i);
    if (match) {
      return match[1].toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return null;
  }

  /**
   * Extrait un milieu (rural/urbain) depuis le texte
   */
  function extractMilieu(text) {
    const norm = normalize(text);
    if (/\brural\b/.test(norm))  return 'RURAL';
    if (/\burbain\b/.test(norm)) return 'URBAIN';
    return null;
  }

  /**
   * Extrait un index de sélection depuis le texte
   * « le premier » → 0, « le dernier » → -1, « le 3ème » → 2
   */
  function extractSelectionIndex(text) {
    const norm = normalize(text);
    if (/\ble premier\b/.test(norm))  return 0;
    if (/\ble dernier\b/.test(norm))  return -1;

    const numMatch = norm.match(/\ble (\d+)/);
    if (numMatch) return parseInt(numMatch[1], 10) - 1;  // 1-indexé → 0-indexé

    const numeroMatch = norm.match(/\bnumero (\d+)/);
    if (numeroMatch) return parseInt(numeroMatch[1], 10) - 1;

    return null;
  }

  /* ── Résolution du contexte ────────────────────────────────── */

  /**
   * Fusionne le contexte précédent avec la nouvelle requête.
   * Retourne un intent enrichi à partir du dernier intent connu
   * et des éléments détectés dans `text`.
   *
   * @param  {string} text      — texte brut de la requête de suivi
   * @param  {Object} newIntent — intent parsé à partir du texte seul
   * @return {Object}           — intent fusionné (clone, pas de mutation)
   */
  function resolveContext(text, newIntent) {
    const last = getLastEntry();
    if (!last) return newIntent;

    const norm    = normalize(text);
    const merged  = deepClone(last.intent);

    // ── Réinitialisation ────────────────────────────────────
    if (PATTERNS.reset.test(norm)) {
      return newIntent;
    }

    // ── Remplacement du type : « non plutôt X » ────────────
    if (PATTERNS.replace.test(norm)) {
      if (newIntent.types && newIntent.types.length) {
        merged.types = [...newIntent.types];
      }
      // Conserver la région du contexte, sauf si la nouvelle en a une
      if (newIntent.regions && newIntent.regions.length) {
        merged.regions = [...newIntent.regions];
      }
      return merged;
    }

    // ── Changement de lieu : « les mêmes à Y » ─────────────
    if (PATTERNS.locationChange.test(norm)) {
      const region = extractRegion(text);
      if (region) {
        merged.regions = [region];
      }
      return merged;
    }

    // ── Comptage : « combien ? » ────────────────────────────
    if (PATTERNS.count.test(norm)) {
      merged.quantity = 'count';
      return merged;
    }

    // ── Sélection : « le premier », « le 3ème » ────────────
    if (PATTERNS.selection.test(norm)) {
      merged._selection = extractSelectionIndex(text);
      return merged;
    }

    // ── Demande de détails : « plus de détails » ────────────
    if (PATTERNS.expand.test(norm)) {
      merged._expand = true;
      return merged;
    }

    // ── Filtre milieu : « en milieu rural » ─────────────────
    if (PATTERNS.filter.test(norm)) {
      const milieu = extractMilieu(text);
      if (milieu) {
        merged.milieu = milieu;
      }
      return merged;
    }

    // ── Suivi / ajout : « et aussi X ? » ────────────────────
    if (PATTERNS.followUp.test(norm)) {
      // Ajouter les nouveaux types sans doublon
      if (newIntent.types && newIntent.types.length) {
        const existing = new Set(merged.types || []);
        newIntent.types.forEach(t => existing.add(t));
        merged.types = [...existing];
      }
      // Remplacer la région si une nouvelle est spécifiée
      if (newIntent.regions && newIntent.regions.length) {
        merged.regions = [...newIntent.regions];
      }
      // Fusionner milieu si présent
      const milieu = extractMilieu(text);
      if (milieu) {
        merged.milieu = milieu;
      }
      return merged;
    }

    // ── Fallback : enrichir le nouvel intent avec le contexte manquant
    if (!newIntent.types || !newIntent.types.length) {
      newIntent.types = merged.types ? [...merged.types] : [];
    }
    if (!newIntent.regions || !newIntent.regions.length) {
      newIntent.regions = merged.regions ? [...merged.regions] : [];
    }
    if (!newIntent.milieu && merged.milieu) {
      newIntent.milieu = merged.milieu;
    }

    return newIntent;
  }

  /* ── Accesseurs ────────────────────────────────────────────── */

  /** Dernière entrée complète de l'historique (ou null) */
  function getLastEntry() {
    return history.length ? history[history.length - 1] : null;
  }

  /** Dernier intent enregistré (ou null) */
  function getLastIntent() {
    const entry = getLastEntry();
    return entry ? deepClone(entry.intent) : null;
  }

  /** Dernière requête texte (ou '') */
  function getLastQuery() {
    const entry = getLastEntry();
    return entry ? entry.query : '';
  }

  /** Historique complet (clone) */
  function getHistory() {
    return deepClone(history);
  }

  /* ── Ajout à l'historique ──────────────────────────────────── */

  /**
   * Enregistre une requête avec son intent parsé et le nombre de résultats.
   * Maintient la limite MAX_HISTORY et persiste en sessionStorage.
   *
   * @param {string} query       — texte brut de la requête
   * @param {Object} intent      — intent parsé (types, regions, milieu, …)
   * @param {number} resultCount — nombre de résultats retournés
   */
  function push(query, intent, resultCount) {
    const entry = {
      query:       query,
      intent:      deepClone(intent),
      resultCount: typeof resultCount === 'number' ? resultCount : 0,
      timestamp:   Date.now(),
    };

    history.push(entry);

    // Limiter la taille de l'historique
    if (history.length > MAX_HISTORY) {
      history = history.slice(-MAX_HISTORY);
    }

    persist();
  }

  /* ── Statistiques de session ───────────────────────────────── */

  /**
   * Calcule les statistiques de la session courante.
   * @return {{ totalQueries: number, topType: string|null, topRegion: string|null }}
   */
  function getSessionStats() {
    const typeCounts   = {};
    const regionCounts = {};

    history.forEach(entry => {
      // Comptage des types
      if (entry.intent && entry.intent.types) {
        entry.intent.types.forEach(t => {
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
      }
      // Comptage des régions
      if (entry.intent && entry.intent.regions) {
        entry.intent.regions.forEach(r => {
          regionCounts[r] = (regionCounts[r] || 0) + 1;
        });
      }
    });

    // Trouver le type le plus recherché
    let topType  = null;
    let maxTypeCount = 0;
    Object.keys(typeCounts).forEach(t => {
      if (typeCounts[t] > maxTypeCount) {
        maxTypeCount = typeCounts[t];
        topType = t;
      }
    });

    // Trouver la région la plus recherchée
    let topRegion  = null;
    let maxRegionCount = 0;
    Object.keys(regionCounts).forEach(r => {
      if (regionCounts[r] > maxRegionCount) {
        maxRegionCount = regionCounts[r];
        topRegion = r;
      }
    });

    return {
      totalQueries: history.length,
      topType:      topType,
      topRegion:    topRegion,
    };
  }

  /* ── Réinitialisation ──────────────────────────────────────── */

  /** Efface tout l'historique (mémoire + sessionStorage) */
  function reset() {
    history = [];
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Ignorer silencieusement
    }
  }

  /* ── Initialisation ────────────────────────────────────────── */
  restore();

  /* ── API publique ──────────────────────────────────────────── */
  return {
    push,
    isContextual,
    resolveContext,
    getLastIntent,
    getLastQuery,
    getHistory,
    getSessionStats,
    reset,
  };

})();
