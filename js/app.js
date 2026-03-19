/* ════════════════════════════════════════════════════════════════
   CULTE — Culture Sénégal Mobile App
   ════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Type Configs ─────────────────────────────────────────────── */
const INFRA_TYPES = {
  'Centre culturel':      { icon: '🏛', color: '#0d5fa0', bg: '#e8f4ff' },
  'Cinéma':               { icon: '🎬', color: '#c0392b', bg: '#fef0ee' },
  'Galerie':              { icon: '🖼', color: '#00838f', bg: '#e0f7fa' },
  'Musée':                { icon: '🏺', color: '#6a1b9a', bg: '#f3e5f5' },
  'Foyer des femmes':     { icon: '👩', color: '#e91e8c', bg: '#fce4f3' },
  'Foyer des jeunes':     { icon: '🎭', color: '#e67e22', bg: '#fff3e0' },
  'Salle de spectacle':   { icon: '🎪', color: '#1565c0', bg: '#e3f2fd' },
  'Salle des fêtes':      { icon: '🎉', color: '#d81b60', bg: '#fce4ec' },
  'Bibliothèque':         { icon: '📚', color: '#2e7d32', bg: '#e8f5e9' },
  'Village artisanal':    { icon: '🏺', color: '#f57f17', bg: '#fffde7' },
  'Maison de la culture': { icon: '🏠', color: '#00695c', bg: '#e0f2f1' },
  'default':              { icon: '📍', color: '#0d5fa0', bg: '#e8f4ff' },
};
const FORMATION_TYPES = {
  'ARTS':          { icon: '🎨', color: '#6a1b9a', bg: '#f3e5f5' },
  'AUDIOVISUEL':   { icon: '🎬', color: '#c0392b', bg: '#fef0ee' },
  'INFOGRAPHIE':   { icon: '💻', color: '#0277bd', bg: '#e1f5fe' },
  'PEINTURE':      { icon: '🖌', color: '#e65100', bg: '#fff3e0' },
  'SERIGRAPHIE':   { icon: '🖨', color: '#00695c', bg: '#e0f2f1' },
  'MUSIQUE':       { icon: '🎵', color: '#1a237e', bg: '#e8eaf6' },
  'THEATRE':       { icon: '🎭', color: '#880e4f', bg: '#fce4ec' },
  'default':       { icon: '🎓', color: '#0d5fa0', bg: '#e8f4ff' },
};

const REGION_EMOJIS = {
  'DAKAR':'🌊','SAINT-LOUIS':'🌹','THIES':'🏗','DIOURBEL':'🕌',
  'FATICK':'🐠','KAOLACK':'🌾','KAFFRINE':'🌿','ZIGUINCHOR':'🌴',
  'KOLDA':'🦅','SEDHIOU':'🦋','TAMBACOUNDA':'🦁','KEDOUGOU':'⛰',
  'LOUGA':'🏜','MATAM':'🌵','default':'📍'
};

/* ── Default images par type (Unsplash) — remplaçables par le responsable ── */
const TYPE_DEFAULT_IMAGES = {
  'Centre culturel':      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=85',
  'Cinéma':               'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=85',
  'Galerie':              'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&q=85',
  'Musée':                'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=1200&q=85',
  'Foyer des femmes':     'https://images.unsplash.com/photo-1607748851687-ba9a10438621?w=1200&q=85',
  'Foyer des jeunes':     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=85',
  'Salle de spectacle':   'https://images.unsplash.com/photo-1583912267550-d974498571e4?w=1200&q=85',
  'Salle des fêtes':      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=85',
  'Bibliothèque':         'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=85',
  'Village artisanal':    'https://images.unsplash.com/photo-1573166475912-1ed8b4f093d2?w=1200&q=85',
  'Maison de la culture': 'https://images.unsplash.com/photo-1576153192621-7a3be10b356e?w=1200&q=85',
  'default':              'https://images.unsplash.com/photo-1627552244573-fc77c028e74f?w=1200&q=85',
};

/* Retourne l'image à afficher : galerie approuvée > défaut par type */
function getInfraImage(r, typeKey) {
  if (r._id !== undefined) {
    try {
      const content = JSON.parse(localStorage.getItem('culte_site_content') || '{}');
      const site = content[String(r._id)];
      if (site?.gallery?.length) return site.gallery[0].url;
    } catch(e) {}
  }
  for (const k of Object.keys(TYPE_DEFAULT_IMAGES)) {
    if (k !== 'default' && (typeKey || '').toLowerCase().includes(k.toLowerCase())) return TYPE_DEFAULT_IMAGES[k];
  }
  return TYPE_DEFAULT_IMAGES.default;
}

const TAB_ORDER = ['home', 'explore', 'list', 'favorites'];

/* ── Navigation History (pour le retour arrière mobile) ────────── */
const navHistory = [];
let handlingPopState = false;

function navPush(entry) {
  navHistory.push(entry);
  if (!handlingPopState) {
    history.pushState(entry, '', null);
  }
}

function navHandleBack() {
  if (!document.getElementById('modal').classList.contains('hidden')) {
    closeModal();
    return true;
  }
  if (navHistory.length > 0) {
    const prev = navHistory.pop();
    if (prev && prev.tab && prev.tab !== state.activeTab) {
      handlingPopState = true;
      switchTab(prev.tab);
      handlingPopState = false;
      return true;
    }
  }
  if (state.activeTab !== 'home') {
    handlingPopState = true;
    switchTab('home');
    handlingPopState = false;
    return true;
  }
  return false;
}

window.addEventListener('popstate', (e) => {
  handlingPopState = true;
  navHandleBack();
  handlingPopState = false;
});

/* ── State ──────────────────────────────────────────────────────── */
const state = {
  data: { infrastructures: [], formations: [] },
  filtered: [],
  activeTab: 'home',
  listSet: 'infrastructures',
  listFilters: { search: '', region: '', type: '', milieu: '' },
  mapFilters: { search: '', layer: 'all', region: '', milieu: '' },
  page: 1,
  perPage: 20,
  favs: new Set(JSON.parse(localStorage.getItem('culte_favs') || '[]')),
  map: null,
  mapCluster: null,
  infoWindow: null,
  mapMarkers: [],
  nlpStore: [],
  modalRecord: null,
  carousel: { idx: 0, items: [], timer: null },
};

/* ── Map Engine Adapter ─────────────────────────────────────────── */
/* Rempli par initMapGoogle() ou initMapLeaflet() selon disponibilité */
const MAP = {
  setView(lat, lng, zoom) {},
  fitBounds(pts) {},          // [[lat,lng], …]
  clearMarkers() {},
  addMarkers(ms) {},
  createMarker(lat, lon, conf, html) { return null; },
  resize() {},
  closeInfoWindow() {},
  addUserMarker(lat, lng) {},
};

/* ── Helpers ────────────────────────────────────────────────────── */
function getInfraType(rec) {
  const d = (rec.DESCRIPTIF || '').trim();
  for (const k of Object.keys(INFRA_TYPES)) {
    if (k !== 'default' && d.toLowerCase().includes(k.toLowerCase())) return k;
  }
  return d || 'default';
}
function getTypeConf(name, isFormation) {
  if (isFormation) {
    const key = (name || '').toUpperCase();
    return FORMATION_TYPES[key] || FORMATION_TYPES.default;
  }
  for (const k of Object.keys(INFRA_TYPES)) {
    if (k !== 'default' && (name || '').toLowerCase().includes(k.toLowerCase())) return INFRA_TYPES[k];
  }
  return INFRA_TYPES.default;
}
function favKey(rec, isFormation) {
  return (isFormation ? 'F:' : 'I:') + (rec.DESIGNATION || rec.NOM_ETABLISSEMENT || '');
}
function saveFavs() {
  localStorage.setItem('culte_favs', JSON.stringify([...state.favs]));
}
function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

/* ── Data Loading ───────────────────────────────────────────────── */
async function loadData() {
  const [infraRes, formRes] = await Promise.all([
    fetch('infrastructures_culturelles.json'),
    fetch('centre_formation_arts.json'),
  ]);
  const infraJson = await infraRes.json();
  const formJson  = await formRes.json();
  const infraSheet = infraJson.sheets?.INFRASTRUCTURES_CULTURELLES || {};
  const formSheet  = formJson.sheets?.CENTRE_FORMATION_CULTURE || {};
  state.data.infrastructures = (infraSheet.records || []).map((r, i) => ({ ...r, _id: i }));
  state.data.formations      = (formSheet.records  || []).map((r, i) => ({ ...r, _id: i }));

  // Construire l'index du moteur de recherche IA
  if (typeof SearchEngine !== 'undefined') {
    SearchEngine.buildIndex(state.data.infrastructures, state.data.formations);
  }

  // Charger et indexer les données temps réel (ajouts utilisateur / API)
  LiveIndex.loadStoredRecords();
}

/* ════════════════════════════════════════════════════════════════
   LIVE INDEX — Indexation temps réel
   Permet d'ajouter, modifier, supprimer des enregistrements
   qui sont immédiatement recherchables dans le SearchEngine.
   Persiste via localStorage + synchronise entre onglets.
   ════════════════════════════════════════════════════════════════ */
const LiveIndex = (() => {

  const STORAGE_KEY = 'culte_live_records';

  /* ── Persister les records ajoutés dynamiquement ───────────── */
  function _loadStored() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch(e) { return []; }
  }

  function _saveStored(records) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch(e) { console.warn('[LiveIndex] Save error:', e); }
  }

  /**
   * Charger les records stockés localement et les indexer.
   * Appelé une fois après buildIndex() dans loadData().
   */
  function loadStoredRecords() {
    if (typeof SearchEngine === 'undefined' || !SearchEngine.ready) return;
    const stored = _loadStored();
    if (!stored.length) return;

    let infraCount = 0, formCount = 0;
    for (const entry of stored) {
      const isForm = entry.isFormation || false;
      const rec = entry.record;
      // Ajouter au state.data pour que les vues (carte, liste) les voient
      if (isForm) {
        rec._id = state.data.formations.length;
        rec._live = true;  // marqueur données temps réel
        rec._liveId = entry.id;
        state.data.formations.push(rec);
        formCount++;
      } else {
        rec._id = state.data.infrastructures.length;
        rec._live = true;
        rec._liveId = entry.id;
        state.data.infrastructures.push(rec);
        infraCount++;
      }
      // Indexer dans le SearchEngine
      SearchEngine.indexOne(rec, isForm, 'stored');
    }
    if (infraCount + formCount > 0) {
      console.log(`[LiveIndex] ${infraCount} infras + ${formCount} formations restaurés depuis localStorage`);
    }
  }

  /**
   * Ajouter un nouvel enregistrement en temps réel.
   * Persisté en localStorage et indexé immédiatement.
   * @param {object}  record       — Objet brut (DESIGNATION, REGION, etc.)
   * @param {boolean} isFormation  — true si formation
   * @param {string}  [source]     — 'user' | 'api' | 'event'
   * @returns {object} L'entrée créée { id, record, isFormation, createdAt }
   */
  function add(record, isFormation, source) {
    const entry = {
      id: 'live_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      record: { ...record },
      isFormation: isFormation || false,
      source: source || 'user',
      createdAt: new Date().toISOString(),
    };

    // Persister
    const stored = _loadStored();
    stored.push(entry);
    _saveStored(stored);

    // Ajouter au state.data
    const rec = entry.record;
    rec._live = true;
    rec._liveId = entry.id;

    if (isFormation) {
      rec._id = state.data.formations.length;
      state.data.formations.push(rec);
    } else {
      rec._id = state.data.infrastructures.length;
      state.data.infrastructures.push(rec);
    }

    // Indexer dans le SearchEngine
    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      SearchEngine.indexOne(rec, isFormation, source);
    }

    console.log(`[LiveIndex] ➕ Ajouté: "${rec.DESIGNATION || rec.NOM_ETABLISSEMENT}" (${entry.id})`);
    return entry;
  }

  /**
   * Ajouter plusieurs enregistrements en batch.
   * @param {Array}   records
   * @param {boolean} isFormation
   * @param {string}  [source]
   * @returns {number} Nombre ajouté
   */
  function addBatch(records, isFormation, source) {
    if (!records || !records.length) return 0;
    const stored = _loadStored();
    const newRecs = [];

    for (const record of records) {
      const entry = {
        id: 'live_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        record: { ...record },
        isFormation: isFormation || false,
        source: source || 'batch',
        createdAt: new Date().toISOString(),
      };
      stored.push(entry);

      const rec = entry.record;
      rec._live = true;
      rec._liveId = entry.id;

      if (isFormation) {
        rec._id = state.data.formations.length;
        state.data.formations.push(rec);
      } else {
        rec._id = state.data.infrastructures.length;
        state.data.infrastructures.push(rec);
      }
      newRecs.push(rec);
    }

    _saveStored(stored);

    // Index batch
    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      SearchEngine.indexBatch(newRecs, isFormation, source);
    }

    console.log(`[LiveIndex] ➕ Batch: ${records.length} enregistrements ajoutés`);
    return records.length;
  }

  /**
   * Mettre à jour un enregistrement live.
   * @param {string} liveId      — L'ID live (entry.id)
   * @param {object} newFields   — Champs à mettre à jour (merge)
   * @returns {boolean}
   */
  function update(liveId, newFields) {
    const stored = _loadStored();
    const idx = stored.findIndex(e => e.id === liveId);
    if (idx === -1) return false;

    // Merge les champs
    Object.assign(stored[idx].record, newFields);
    stored[idx].updatedAt = new Date().toISOString();
    _saveStored(stored);

    // Mettre à jour dans state.data
    const isForm = stored[idx].isFormation;
    const dataArr = isForm ? state.data.formations : state.data.infrastructures;
    const rec = dataArr.find(r => r._liveId === liveId);
    if (rec) {
      Object.assign(rec, newFields);
      // Mettre à jour dans SearchEngine
      if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
        SearchEngine.updateOne(doc => doc.rec._liveId === liveId, rec, isForm);
      }
    }

    console.log(`[LiveIndex] ✏️ Mis à jour: ${liveId}`);
    return true;
  }

  /**
   * Supprimer un enregistrement live.
   * @param {string} liveId
   * @returns {boolean}
   */
  function remove(liveId) {
    const stored = _loadStored();
    const idx = stored.findIndex(e => e.id === liveId);
    if (idx === -1) return false;

    const entry = stored[idx];
    stored.splice(idx, 1);
    _saveStored(stored);

    // Retirer de state.data
    const isForm = entry.isFormation;
    const dataArr = isForm ? state.data.formations : state.data.infrastructures;
    const dataIdx = dataArr.findIndex(r => r._liveId === liveId);
    if (dataIdx !== -1) dataArr.splice(dataIdx, 1);

    // Retirer du SearchEngine
    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      SearchEngine.removeOne(doc => doc.rec._liveId === liveId);
    }

    console.log(`[LiveIndex] 🗑 Supprimé: ${liveId}`);
    return true;
  }

  /**
   * Obtenir tous les enregistrements live.
   * @returns {Array}
   */
  function getAll() { return _loadStored(); }

  /**
   * Nombre d'enregistrements live.
   */
  function count() { return _loadStored().length; }

  /**
   * Écouter les changements d'autres onglets (storage event).
   */
  function _initCrossTabSync() {
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      // Un autre onglet a modifié les données live → reconstruire l'index
      console.log('[LiveIndex] Sync inter-onglets détecté, reconstruction...');
      if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
        SearchEngine.buildIndex(state.data.infrastructures, state.data.formations);
        // Ré-indexer les données live fraîches
        const freshStored = _loadStored();
        for (const entry of freshStored) {
          const rec = entry.record;
          // Vérifier si déjà dans state.data
          const arr = entry.isFormation ? state.data.formations : state.data.infrastructures;
          if (!arr.find(r => r._liveId === entry.id)) {
            rec._live = true;
            rec._liveId = entry.id;
            rec._id = arr.length;
            arr.push(rec);
            SearchEngine.indexOne(rec, entry.isFormation, 'sync');
          }
        }
      }
    });
  }

  // Init sync au chargement
  if (typeof window !== 'undefined') {
    _initCrossTabSync();
  }

  return { loadStoredRecords, add, addBatch, update, remove, getAll, count };
})();

/* ════════════════════════════════════════════════════════════════
   HOME TAB
   ════════════════════════════════════════════════════════════════ */
function buildHome() {
  buildCategories();
  buildFeatured();
  buildRegions();
  buildMiniCards();
  buildStats();
  buildEventsWidget();
}

function buildEventsWidget() {
  if (typeof EventsCalendar === 'undefined') return;
  EventsCalendar.init();
  const statsStrip = document.getElementById('statsStrip');
  if (!statsStrip) return;
  // Injecter le widget événements juste avant le stats strip
  const widgetHtml = EventsCalendar.renderHomeWidget();
  if (widgetHtml) {
    statsStrip.insertAdjacentHTML('beforebegin', widgetHtml);
    EventsCalendar.attachHomeHandlers();
  }
}

function buildCategories() {
  const row = document.getElementById('categoriesRow');
  const cats = [
    { label: 'Nearby',       icon: '📍', color: '#e3f2fd', iconColor: '#1565c0', filter: 'nearby' },
    { label: 'Musées',       icon: '🏺', color: '#f3e5f5', iconColor: '#6a1b9a', type: 'musée' },
    { label: 'Cinémas',      icon: '🎬', color: '#fef0ee', iconColor: '#c0392b', type: 'cinéma' },
    { label: 'Galeries',     icon: '🖼', color: '#e0f7fa', iconColor: '#00838f', type: 'galerie' },
    { label: 'Formations',   icon: '🎓', color: '#e8eaf6', iconColor: '#1a237e', tab: 'list', set: 'formations' },
    { label: 'Bibliothèques',icon: '📚', color: '#e8f5e9', iconColor: '#2e7d32', type: 'bibliothèque' },
    { label: 'Théâtres',     icon: '🎭', color: '#fce4ec', iconColor: '#d81b60', type: 'salle de spectacle' },
  ];
  row.innerHTML = cats.map(c => `
    <div class="cat-item" onclick="handleCatClick(${JSON.stringify(c).replace(/"/g,'&quot;')})">
      <div class="cat-icon" style="background:${c.color}; color:${c.iconColor}">${c.icon}</div>
      <span class="cat-label">${c.label}</span>
    </div>
  `).join('');
}

function handleCatClick(cat) {
  if (cat.tab === 'list' && cat.set) {
    switchTab('list');
    state.listSet = cat.set;
    renderListTabs();
    applyListFilters(true);
    return;
  }
  if (cat.type) {
    switchTab('list');
    state.listFilters.type = cat.type;
    applyListFilters(true);
    return;
  }
  if (cat.filter === 'nearby') {
    switchTab('explore');
    locateUser();
    return;
  }
}

function buildFeatured() {
  const infras = state.data.infrastructures;
  // Pick variety: musées, galeries, cinémas, centres culturels
  const picks = [];
  const typePriority = ['Musée', 'Galerie', 'Cinéma', 'Centre culturel', 'Bibliothèque'];
  for (const t of typePriority) {
    const pool = infras.filter(r => norm(r.DESCRIPTIF || '').includes(norm(t)));
    if (pool.length) picks.push(pool[Math.floor(Math.random() * pool.length)]);
    if (picks.length >= 4) break;
  }
  if (picks.length < 3) picks.push(...infras.slice(0, 3 - picks.length));
  state.carousel.items = picks;
  renderCarousel(0);
}

function renderCarousel(idx) {
  const items = state.carousel.items;
  if (!items.length) return;
  state.carousel.idx = idx;

  const track = document.getElementById('carouselTrack');
  const dotsEl = document.getElementById('carouselDots');

  const gradients = [
    'linear-gradient(135deg,#0a3d6b,#00b4d8)',
    'linear-gradient(135deg,#6a1b9a,#1282d4)',
    'linear-gradient(135deg,#00695c,#0d5fa0)',
    'linear-gradient(135deg,#c0392b,#e67e22)',
  ];

  track.innerHTML = items.map((rec, i) => {
    const typeName = getInfraType(rec);
    const conf = getTypeConf(typeName, false);
    const region  = rec.REGION  || '';
    const commune = rec.COMMUNE || '';
    const grad = gradients[i % gradients.length];
    const recJson = JSON.stringify(rec).replace(/"/g, '&quot;');
    return `
      <div class="featured-card" onclick="openModal(event,null,false,null,'${escAttr(rec.DESIGNATION||'')}')">
        <div class="fc-bg" style="background:${grad}"></div>
        <div class="fc-overlay"></div>
        <button class="fc-action" onclick="event.stopPropagation();openModal(event,null,false,null,'${escAttr(rec.DESIGNATION||'')}')">Voir la fiche ›</button>
        <div class="fc-content">
          <span class="fc-badge">${conf.icon} ${typeName}</span>
          <div class="fc-name">${rec.DESIGNATION || 'Infrastructure'}</div>
          <div class="fc-loc">📍 ${commune}${region ? ', ' + region : ''}</div>
        </div>
      </div>
    `;
  }).join('');

  // Dots
  dotsEl.innerHTML = items.map((_, i) =>
    `<span class="cdot${i === idx ? ' active' : ''}" onclick="goCarousel(${i})"></span>`
  ).join('');

  // Slide position
  track.style.transform = `translateX(-${idx * 100}%)`;

  // Store items in state for modal access
  state.carousel._recs = items;

  // Restart timer
  clearInterval(state.carousel.timer);
  state.carousel.timer = setInterval(() => {
    goCarousel((state.carousel.idx + 1) % items.length);
  }, 4500);

  // Swipe support
  setupCarouselSwipe(track);
}

function goCarousel(idx) {
  const track = document.getElementById('carouselTrack');
  const dotsEl = document.getElementById('carouselDots');
  state.carousel.idx = idx;
  track.style.transform = `translateX(-${idx * 100}%)`;
  dotsEl.querySelectorAll('.cdot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

function setupCarouselSwipe(track) {
  let startX = 0, dragging = false;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dragging = true; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (!dragging) return; dragging = false;
    const diff = startX - e.changedTouches[0].clientX;
    const n = state.carousel.items.length;
    if (Math.abs(diff) > 40) {
      goCarousel(diff > 0
        ? Math.min(state.carousel.idx + 1, n - 1)
        : Math.max(state.carousel.idx - 1, 0));
    }
  }, { passive: true });
}

// Helper to get carousel record by name for modal
function getCarouselRec(name) {
  return (state.carousel._recs || []).find(r => (r.DESIGNATION || '') === name);
}

function escAttr(s) { return s.replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }

function buildRegions() {
  const row = document.getElementById('regionsRow');
  const counts = {};
  state.data.infrastructures.forEach(r => {
    const reg = (r.REGION || '').toUpperCase();
    counts[reg] = (counts[reg] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const gradients = [
    'linear-gradient(135deg,#0a3d6b,#0d5fa0)','linear-gradient(135deg,#00695c,#00838f)',
    'linear-gradient(135deg,#6a1b9a,#8e24aa)','linear-gradient(135deg,#e65100,#f57c00)',
    'linear-gradient(135deg,#1a237e,#283593)','linear-gradient(135deg,#c62828,#e53935)',
    'linear-gradient(135deg,#1b5e20,#2e7d32)','linear-gradient(135deg,#004d40,#00695c)',
  ];
  row.innerHTML = sorted.map(([region, count], i) => {
    const emoji = REGION_EMOJIS[region] || REGION_EMOJIS.default;
    const grad = gradients[i % gradients.length];
    return `
      <div class="region-card" onclick="filterByRegion('${region}')">
        <div class="rc-bg" style="background:${grad}"></div>
        <div class="rc-overlay"></div>
        <div class="rc-content">
          <div class="rc-name">${emoji} ${region.charAt(0)+region.slice(1).toLowerCase()}</div>
          <div class="rc-count">${count} infrastructure${count>1?'s':''}</div>
        </div>
      </div>
    `;
  }).join('');
}

function filterByRegion(region) {
  switchTab('list');
  state.listFilters.region = region;
  document.getElementById('regionSelect').value = region;
  applyListFilters(true);
}

function buildMiniCards() {
  const grid = document.getElementById('miniCardsGrid');
  const typeCounts = {};
  state.data.infrastructures.forEach(r => {
    const t = getInfraType(r);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const sorted = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  grid.innerHTML = sorted.map(([type, count]) => {
    const conf = getTypeConf(type, false);
    return `
      <div class="mini-card fade-in" onclick="filterByType('${type.replace(/'/g,"\\'")}')">
        <div class="mini-card-icon" style="background:${conf.bg}; color:${conf.color}">${conf.icon}</div>
        <div class="mini-card-info">
          <div class="mini-card-name">${type}</div>
          <div class="mini-card-count">${count} lieu${count>1?'x':''}</div>
        </div>
      </div>
    `;
  }).join('');
}

function filterByType(type) {
  switchTab('list');
  state.listFilters.type = type;
  applyListFilters(true);
}

function buildStats() {
  const regions = new Set(state.data.infrastructures.map(r => r.REGION).filter(Boolean));
  animateCounter('statInfra',     state.data.infrastructures.length, 1600);
  animateCounter('statFormations', state.data.formations.length,     1200);
  animateCounter('statRegions',   regions.size,                       800);
}

function animateCounter(id, target, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
    const val = Math.round(ease * target);
    el.textContent = val.toLocaleString('fr-FR');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ════════════════════════════════════════════════════════════════
   LIST TAB
   ════════════════════════════════════════════════════════════════ */
function buildListFilters() {
  const sel = document.getElementById('regionSelect');
  const regions = [...new Set([
    ...state.data.infrastructures.map(r => r.REGION),
    ...state.data.formations.map(r => r.REGION),
  ].filter(Boolean))].sort();
  sel.innerHTML = '<option value="">Toutes les régions</option>' +
    regions.map(r => `<option value="${r}">${r.charAt(0)+r.slice(1).toLowerCase()}</option>`).join('');
}

function renderListTabs() {
  document.querySelectorAll('.list-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.set === state.listSet);
  });
  // Show/hide infra-only items
  const isInfra = state.listSet === 'infrastructures';
  document.querySelectorAll('.infra-only').forEach(el => {
    el.style.display = isInfra ? '' : 'none';
  });
  // Rebuild type chips (mobile + desktop)
  buildTypeChips();
  buildTypeChipsDt();
}

function buildTypeChips() {
  const chips = document.getElementById('typeChips');
  const isFormation = state.listSet === 'formations';
  const records = isFormation ? state.data.formations : state.data.infrastructures;
  const typeCounts = {};
  records.forEach(r => {
    const t = isFormation ? (r.BRANCHE || 'default') : getInfraType(r);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const sorted = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]);
  chips.innerHTML = sorted.map(([type]) => {
    const active = state.listFilters.type === type;
    return `<button class="type-chip${active?' active':''}" data-type="${type}">${type}</button>`;
  }).join('');
  chips.querySelectorAll('.type-chip').forEach(btn => {
    btn.onclick = () => {
      state.listFilters.type = state.listFilters.type === btn.dataset.type ? '' : btn.dataset.type;
      buildTypeChips();
      applyListFilters(true);
    };
  });
}

function applyListFilters(resetPage) {
  if (resetPage) state.page = 1;
  const isFormation = state.listSet === 'formations';
  const records = isFormation ? state.data.formations : state.data.infrastructures;
  const { search, region, type, milieu } = state.listFilters;
  const sNorm = norm(search);

  // Utiliser le SearchEngine IA si disponible et qu'il y a une recherche texte
  if (typeof SearchEngine !== 'undefined' && SearchEngine.ready && sNorm && sNorm.length >= 2) {
    const result = SearchEngine.search(search, { limit: 500 });
    // Filtrer par dataset actif (infra/formation) et appliquer les filtres supplémentaires
    state.filtered = result.results
      .map(r => r.doc.rec)
      .filter(r => {
        // Filtrer par dataset
        const recIsFormation = !!r.NOM_ETABLISSEMENT && !r.DESIGNATION;
        if (isFormation !== recIsFormation) {
          // Vérifier aussi via les listes source
          if (isFormation && !state.data.formations.includes(r)) return false;
          if (!isFormation && !state.data.infrastructures.includes(r)) return false;
        }
        // Filtres dropdown
        const reg = (r.REGION || '').toUpperCase();
        const typeKey = isFormation ? (r.BRANCHE || '') : getInfraType(r);
        const mil = (r.MILIEU || '').toUpperCase();
        if (region && reg !== region.toUpperCase()) return false;
        if (type && !norm(typeKey).includes(norm(type))) return false;
        if (milieu && mil !== milieu.toUpperCase()) return false;
        return true;
      });
  } else {
    // Fallback: filtrage classique sans recherche texte
    state.filtered = records.filter(r => {
      const name = norm(r.DESIGNATION || r.NOM_ETABLISSEMENT || '');
      const commune = norm(r.COMMUNE || '');
      const loc = norm(r.LOCALITES || r.LOCALITE || '');
      const reg = (r.REGION || '').toUpperCase();
      const typeKey = isFormation ? (r.BRANCHE || '') : getInfraType(r);
      const mil = (r.MILIEU || '').toUpperCase();

      if (sNorm && !name.includes(sNorm) && !commune.includes(sNorm) && !loc.includes(sNorm) && !norm(reg).includes(sNorm)) return false;
      if (region && reg !== region.toUpperCase()) return false;
      if (type && !norm(typeKey).includes(norm(type))) return false;
      if (milieu && mil !== milieu.toUpperCase()) return false;
      return true;
    });
  }

  // Update counts
  document.getElementById('listInfraCount').textContent = !isFormation ? `(${state.filtered.length})` : `(${state.data.infrastructures.length})`;
  document.getElementById('listFormCount').textContent  = isFormation  ? `(${state.filtered.length})` : `(${state.data.formations.length})`;

  renderListCards();
  renderPagination();
}

function renderListCards() {
  const container = document.getElementById('listCards');
  const isFormation = state.listSet === 'formations';
  const start = (state.page - 1) * state.perPage;
  const page = state.filtered.slice(start, start + state.perPage);

  if (page.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding-top:60px">
        <span class="empty-icon">🔍</span>
        <p>Aucun résultat</p>
        <small>Essayez de modifier vos filtres</small>
      </div>
    `;
    return;
  }

  container.innerHTML = page.map((rec, idx) => {
    const typeKey = isFormation ? (rec.BRANCHE || '') : getInfraType(rec);
    const conf = getTypeConf(typeKey, isFormation);
    const name = rec.DESIGNATION || rec.NOM_ETABLISSEMENT || 'Sans nom';
    const commune = rec.COMMUNE || '';
    const region  = rec.REGION || '';
    const milieu  = rec.MILIEU || '';
    const key = favKey(rec, isFormation);
    const isFav = state.favs.has(key);

    return `
      <div class="list-card fade-in" style="animation-delay:${idx*0.03}s">
        <div class="lc-icon" style="background:${conf.bg};color:${conf.color}" onclick="openModal(event,null,${isFormation},${start+idx},null)">${conf.icon}</div>
        <div class="lc-info" onclick="openModal(event,null,${isFormation},${start+idx},null)">
          <div class="lc-name">${name}</div>
          <div class="lc-meta">
            <span class="lc-type" style="background:${conf.bg};color:${conf.color}">${typeKey}</span>
            <span class="lc-loc">📍 ${commune}${region ? ', ' + region : ''}</span>
          </div>
          ${milieu ? `<span class="lc-milieu ${milieu==='URBAIN'?'milieu-urban':'milieu-rural'}">${milieu==='URBAIN'?'Urbain':'Rural'}</span>` : ''}
        </div>
        <button class="lc-fav-btn${isFav?' fav-active':''}" onclick="toggleFav(event,'${key.replace(/'/g,"\\'")}',${start+idx},${isFormation})" aria-label="Favori">${isFav?'♥':'♡'}</button>
      </div>
    `;
  }).join('');
}

function renderPagination() {
  const total = Math.ceil(state.filtered.length / state.perPage);
  const pag = document.getElementById('pagination');
  if (total <= 1) { pag.innerHTML = ''; return; }
  const p = state.page;
  let btns = [];

  const addBtn = (i, label) => {
    btns.push(`<button class="pg-btn${i===p?' active':''}" onclick="goPage(${i})">${label||i}</button>`);
  };
  const addDots = () => btns.push(`<span style="padding:0 4px;color:#a0b8cc">…</span>`);

  addBtn(1);
  if (p > 3) addDots();
  for (let i = Math.max(2, p-1); i <= Math.min(total-1, p+1); i++) addBtn(i);
  if (p < total-2) addDots();
  if (total > 1) addBtn(total);

  pag.innerHTML = btns.join('');
}

function goPage(p) {
  state.page = p;
  renderListCards();
  renderPagination();
  document.getElementById('listCards').scrollTop = 0;
}

function toggleFav(e, key, idx, isFormation) {
  e.stopPropagation();
  if (state.favs.has(key)) state.favs.delete(key);
  else state.favs.add(key);
  saveFavs();
  renderListCards();
  renderFavs();
}

/* ════════════════════════════════════════════════════════════════
   FAVORITES TAB
   ════════════════════════════════════════════════════════════════ */
function renderFavs() {
  const container = document.getElementById('favsContent');
  if (state.favs.size === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">💙</span>
        <p>Aucun favori pour l'instant</p>
        <small>Appuyez sur ♡ sur une fiche pour l'ajouter</small>
      </div>
    `;
    return;
  }

  const allRecs = [
    ...state.data.infrastructures.map(r => ({ rec: r, isFormation: false })),
    ...state.data.formations.map(r => ({ rec: r, isFormation: true })),
  ].filter(({ rec, isFormation }) => state.favs.has(favKey(rec, isFormation)));

  container.innerHTML = '<div class="list-cards" style="overflow:visible;padding:0;gap:10px">' +
    allRecs.map(({ rec, isFormation }) => {
      const typeKey = isFormation ? (rec.BRANCHE || '') : getInfraType(rec);
      const conf = getTypeConf(typeKey, isFormation);
      const name = rec.DESIGNATION || rec.NOM_ETABLISSEMENT || 'Sans nom';
      const commune = rec.COMMUNE || '';
      const region  = rec.REGION || '';
      const key = favKey(rec, isFormation);
      return `
        <div class="list-card">
          <div class="lc-icon" style="background:${conf.bg};color:${conf.color}" onclick='openModal(event,${JSON.stringify(rec).replace(/'/g,"&#39;")},${isFormation},null,null)'>${conf.icon}</div>
          <div class="lc-info" onclick='openModal(event,${JSON.stringify(rec).replace(/'/g,"&#39;")},${isFormation},null,null)'>
            <div class="lc-name">${name}</div>
            <div class="lc-meta">
              <span class="lc-type" style="background:${conf.bg};color:${conf.color}">${typeKey}</span>
              <span class="lc-loc">📍 ${commune}${region ? ', '+region : ''}</span>
            </div>
          </div>
          <button class="lc-fav-btn fav-active" onclick="removeFav(event,'${key.replace(/'/g,"\\'")}')">♥</button>
        </div>
      `;
    }).join('') + '</div>';
}

function removeFav(e, key) {
  e.stopPropagation();
  state.favs.delete(key);
  saveFavs();
  renderFavs();
  renderListCards();
}

/* ════════════════════════════════════════════════════════════════
   EXPLORE / MAP TAB
   ════════════════════════════════════════════════════════════════ */
function initMap() {
  if (state.map) return;
  initMapLeaflet();
}

function initMapLeaflet() {
  const el = document.getElementById('exploreMap');
  state.map = L.map(el, { zoomControl: true, attributionControl: false }).setView([14.5, -14.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(state.map);
  state.mapCluster = L.markerClusterGroup({ maxClusterRadius: 60, showCoverageOnHover: false });
  state.map.addLayer(state.mapCluster);
  state.map.zoomControl.setPosition('bottomright');

  MAP.setView = (lat, lng, zoom) => state.map.setView([lat, lng], zoom);
  MAP.fitBounds = (pts) => state.map.fitBounds(L.latLngBounds(pts));
  MAP.clearMarkers = () => state.mapCluster.clearLayers();
  MAP.addMarkers = (ms) => ms.forEach(m => state.mapCluster.addLayer(m));
  MAP.createMarker = (lat, lon, conf, html) => {
    const m = L.marker([lat, lon], { icon: createLeafletIcon(conf) });
    m.bindPopup(html, { maxWidth: 280 });
    return m;
  };
  MAP.resize = () => state.map.invalidateSize();
  MAP.closeInfoWindow = () => state.map.closePopup();
  MAP.addUserMarker = (lat, lng) => {
    L.circleMarker([lat, lng], { radius: 8, fillColor: '#00b4d8', color: 'white', weight: 3, fillOpacity: 1 })
      .addTo(state.map).bindPopup('📍 Vous êtes ici').openPopup();
    state.map.setView([lat, lng], 13);
  };
  populateMapLayer('all');
  setupMapSearch();
}

function createLeafletIcon(conf) {
  return L.divIcon({
    html: `<div class="custom-marker" style="background:${conf.color};border-color:white">${conf.icon}</div>`,
    iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -44], className: '',
  });
}

function populateMapLayer(layer) {
  MAP.clearMarkers();
  state.mapMarkers = [];
  state.nlpStore = [];

  const addRecords = (records, isFormation) => {
    const batch = [];
    records.forEach(rec => {
      const lat = parseFloat(rec.LATITUDE);
      const lon = parseFloat(rec.LONGITUDE);
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

      const typeKey = isFormation ? (rec.BRANCHE || '') : getInfraType(rec);
      const conf = getTypeConf(typeKey, isFormation);
      const name = rec.DESIGNATION || rec.NOM_ETABLISSEMENT || 'Sans nom';
      const commune = rec.COMMUNE || rec.LOCALITE || '';
      const region  = rec.REGION || '';
      const idx = state.nlpStore.length;
      state.nlpStore.push({ lat, lon, name, isFormation, rec });

      const html = `<div class="map-popup">
        <div class="mp-type" style="background:${conf.bg};color:${conf.color}">${conf.icon} ${typeKey}</div>
        <div class="mp-name">${name}</div>
        <div class="mp-loc">📍 ${commune}${region ? ', '+region : ''}</div>
        <div class="mp-actions">
          <button class="mp-btn mp-btn-primary" onclick="openModalFromMap(${idx})">Voir la fiche</button>
          <button class="mp-btn mp-btn-secondary" onclick="navigateTo(${lat},${lon})">🧭 Y aller</button>
        </div>
      </div>`;

      const marker = MAP.createMarker(lat, lon, conf, html);
      state.mapMarkers.push({ marker, rec, isFormation, typeKey });
      batch.push(marker);
    });
    MAP.addMarkers(batch);
  };

  if (layer === 'all' || layer === 'infrastructures') addRecords(state.data.infrastructures, false);
  if (layer === 'all' || layer === 'formations') addRecords(state.data.formations, true);

  updateMapChipCounts();
}

function updateMapChipCounts() {
  document.getElementById('chipAll').textContent = state.data.infrastructures.length + state.data.formations.length;
  document.getElementById('chipInfra').textContent = state.data.infrastructures.length;
  document.getElementById('chipFormation').textContent = state.data.formations.length;
}

function setupMapSearch() {
  const input = document.getElementById('mapSearch');
  const clearBtn = document.getElementById('mapSearchClear');
  let timer;
  let sugTimer;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    clearTimeout(sugTimer);
    const val = input.value.trim();
    clearBtn.classList.toggle('hidden', !val);

    // Autocomplétion en temps réel
    sugTimer = setTimeout(() => {
      if (val.length >= 2) {
        NLP.showSuggestionsPanel(input);
      } else {
        const panel = document.getElementById('nlpSuggestPanel');
        if (panel) panel.style.display = 'none';
      }
    }, 120);

    timer = setTimeout(() => {
      if (val) runNlpSearch(val);
    }, 350);
  });

  input.addEventListener('focus', () => {
    NLP.showSuggestionsPanel(input);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const panel = document.getElementById('nlpSuggestPanel');
      if (panel) panel.style.display = 'none';
      const val = input.value.trim();
      if (val) runNlpSearch(val);
    }
    if (e.key === 'Escape') {
      const panel = document.getElementById('nlpSuggestPanel');
      if (panel) panel.style.display = 'none';
    }
  });

  clearBtn.onclick = () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    document.getElementById('nlpChipsRow').classList.add('hidden');
    document.getElementById('mapBotBar').classList.add('hidden');
    populateMapLayer(state.mapFilters.layer);
    MAP.setView(14.5, -14.5, 6);
  };
}

/* ── NLP Search ─────────────────────────────────────────────────── */
function parseQuery(raw) {
  const s = norm(raw);
  const intent = { types: [], regions: [], milieu: '', free: raw };

  // Types — enrichi avec synonymes, pluriels, formes partielles
  const typeMap = {
    'mus':       'Musée',
    'galer':     'Galerie',
    'cin':       'Cinéma',
    'film':      'Cinéma',
    'bibl':      'Bibliothèque',
    'livre':     'Bibliothèque',
    'lecture':   'Bibliothèque',
    'theatr':    'Salle de spectacle',
    'spectacl':  'Salle de spectacle',
    'scene':     'Salle de spectacle',
    'concert':   'Salle de spectacle',
    'festival':  'Salle de spectacle',
    'danse':     'Salle de spectacle',
    'jeun':      'Foyer des jeunes',
    'femm':      'Foyer des femmes',
    'artisan':   'Village artisanal',
    'maison':    'Maison de la culture',
    'centre':    'Centre culturel',
    'cultur':    'Centre culturel',
    'formation': 'formations',
    'ecole':     'formations',
    'cours':     'formations',
    'apprenti':  'formations',
    'audiovis':  'formations',
    'peintur':   'formations',
  };
  for (const [kw, type] of Object.entries(typeMap)) {
    if (s.includes(kw) && !intent.types.includes(type)) intent.types.push(type);
  }

  // Régions — normalisées avec alias
  const regionMap = {
    'dakar':        'DAKAR',
    'saint-louis':  'SAINT-LOUIS',
    'saintlouis':   'SAINT-LOUIS',
    'st louis':     'SAINT-LOUIS',
    'thies':        'THIES',
    'diourbel':     'DIOURBEL',
    'fatick':       'FATICK',
    'kaolack':      'KAOLACK',
    'kaffrine':     'KAFFRINE',
    'ziguin':       'ZIGUINCHOR',
    'kolda':        'KOLDA',
    'sedhiou':      'SEDHIOU',
    'tambacounda':  'TAMBACOUNDA',
    'tamba':        'TAMBACOUNDA',
    'kedougou':     'KEDOUGOU',
    'louga':        'LOUGA',
    'matam':        'MATAM',
  };
  for (const [kw, reg] of Object.entries(regionMap)) {
    if (s.includes(norm(kw)) && !intent.regions.includes(reg)) intent.regions.push(reg);
  }

  // Milieu
  const milieuMap = { 'urban': 'URBAIN', 'ville': 'URBAIN', 'cit': 'URBAIN', 'rural': 'RURAL', 'campagne': 'RURAL' };
  for (const [kw, mil] of Object.entries(milieuMap)) {
    if (s.includes(kw)) { intent.milieu = mil; break; }
  }

  return intent;
}

function runNlpSearch(raw) {
  if (!raw) return;

  // Utiliser le SearchEngine IA
  if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {

    // ── Mémoire conversationnelle : résoudre le contexte ──
    let resolvedRaw = raw;
    let resolvedIntent = null;
    if (typeof ConversationMemory !== 'undefined' && ConversationMemory.isContextual(raw)) {
      const baseIntent = SearchEngine.parseIntent(raw);
      resolvedIntent = ConversationMemory.resolveContext(raw, baseIntent);
      // Reconstruire la requête enrichie
      const parts = [];
      if (resolvedIntent.types && resolvedIntent.types.length) parts.push(resolvedIntent.types.join(' '));
      if (resolvedIntent.wantFormations) parts.push('formation');
      if (resolvedIntent.branches && resolvedIntent.branches.length) parts.push(resolvedIntent.branches.join(' '));
      if (resolvedIntent.regions && resolvedIntent.regions.length) parts.push('à ' + resolvedIntent.regions[0]);
      if (resolvedIntent.milieu) parts.push(resolvedIntent.milieu);
      if (resolvedIntent.freeTokens && resolvedIntent.freeTokens.length) parts.push(resolvedIntent.freeTokens.join(' '));
      if (parts.length) resolvedRaw = parts.join(' ');
    }

    const result = SearchEngine.search(resolvedRaw, { limit: 200 });
    const intent = resolvedIntent || result.intent;

    // ── Sauvegarder dans la mémoire conversationnelle ──
    if (typeof ConversationMemory !== 'undefined') {
      ConversationMemory.push(raw, intent, result.results);
    }

    // ── Géolocalisation : enrichir avec distances si disponible ──
    let geoResults = result.results;
    const isProximity = typeof GeoSearch !== 'undefined' && GeoSearch.isProximityQuery(raw);
    if (isProximity && typeof GeoSearch !== 'undefined') {
      GeoSearch.getPosition().then(pos => {
        if (pos) {
          geoResults = GeoSearch.enrichWithDistance(result.results.map(r => r.doc.rec), pos);
          geoResults = GeoSearch.sortByDistance(geoResults, pos);
          // Re-render avec distances
          _renderNlpMapResults(geoResults.map(r => r), intent, raw, result, true);
        }
      }).catch(() => {});
    }

    // Trouver les markers correspondants aux résultats
    _renderNlpMapResults(result.results.map(r => r.doc.rec), intent, raw, result, false);

    NLP.saveHistory(raw);
    return;
  }

  // Fallback: ancien système (inchangé)
  _runNlpSearchFallback(raw);
}

/* ── Rendu des résultats NLP sur la carte ── */
function _renderNlpMapResults(recs, intent, raw, result, withGeo) {
  const matchedSet = new Set(recs);
  const matches = state.mapMarkers.filter(({ rec }) => matchedSet.has(rec));

  MAP.clearMarkers();
  MAP.addMarkers(matches.map(m => m.marker));

  // Chips avec le nouvel intent
  const chipIntent = {
    types: (intent.types || []).slice(),
    regions: intent.regions || [],
    milieu: intent.milieu || '',
  };
  if (intent.wantFormations) chipIntent.types.push('Formations');
  NLP.showChips(chipIntent);

  // ── Réponse NLG intelligente ──
  let botMsg = result.message;
  if (typeof NLGResponse !== 'undefined') {
    botMsg = NLGResponse.generate({
      query: raw,
      intent: intent,
      results: result.results,
      count: result.results.length,
      isContextual: typeof ConversationMemory !== 'undefined' && ConversationMemory.isContextual(raw),
      isProximity: withGeo,
    });
  }
  NLP.showBot(botMsg);

  // ── Analytics tracking ──
  if (typeof Analytics !== 'undefined' && Analytics.trackSearch) {
    Analytics.trackSearch(raw, result.results.length);
  }
  if (typeof Recommendations !== 'undefined' && Recommendations.trackSearch) {
    Recommendations.trackSearch(raw);
  }

  // ── Voice Conversation : lire la réponse à voix haute ──
  if (typeof VoiceConversation !== 'undefined' && VoiceConversation.isEnabled) {
    VoiceConversation.speakResponse(botMsg, result.results.length);
    // Poser une question de suivi si pertinent
    setTimeout(() => {
      if (VoiceConversation.isEnabled && !VoiceConversation.isSpeaking) {
        VoiceConversation.speakFollowUp({
          count: result.results.length,
          hasGeo: typeof GeoSearch !== 'undefined' && GeoSearch.isAvailable,
          hasFormations: intent.wantFormations,
        });
      }
    }, 3000);
  }

  // Auto zoom
  if (matches.length) {
    const pts = matches
      .map(m => [parseFloat(m.rec.LATITUDE), parseFloat(m.rec.LONGITUDE)])
      .filter(([la, lo]) => !isNaN(la) && !isNaN(lo) && (la || lo));
    if (pts.length) MAP.fitBounds(pts);
  }
}

function _runNlpSearchFallback(raw) {

  // Fallback: ancien système
  const intent = parseQuery(raw);
  const sNorm  = norm(raw);
  const matches = state.mapMarkers.filter(({ rec, isFormation, typeKey }) => {
    const name    = norm(rec.DESIGNATION || rec.NOM_ETABLISSEMENT || '');
    const commune = norm(rec.COMMUNE || rec.LOCALITE || '');
    const region  = (rec.REGION || '').toUpperCase();
    const mil     = (rec.MILIEU || '').toUpperCase();
    if (intent.regions.length && !intent.regions.includes(region)) return false;
    if (intent.milieu && mil !== intent.milieu) return false;
    if (intent.types.length) {
      const typeNorm = norm(typeKey);
      if (!intent.types.some(t => t === 'formations' ? isFormation : typeNorm.includes(norm(t)))) return false;
    }
    if (!intent.types.length && !intent.regions.length && !intent.milieu) {
      return name.includes(sNorm) || commune.includes(sNorm) || norm(region).includes(sNorm);
    }
    return true;
  });

  MAP.clearMarkers();
  MAP.addMarkers(matches.map(m => m.marker));
  NLP.showChips(intent);

  const n = matches.length;
  const infraTypes = intent.types.filter(t => t !== 'formations');
  const regStr = intent.regions.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(', ');
  let msg;
  if (n === 0) {
    msg = `Aucun résultat pour "${raw}". Essayez "musée Dakar" ou "cinéma Thiès".`;
  } else {
    msg = `${n} lieu${n > 1 ? 'x' : ''} trouvé${n > 1 ? 's' : ''}`;
    if (infraTypes.length) msg += ` · ${infraTypes.join(', ')}`;
    if (regStr)            msg += ` en ${regStr}`;
    if (intent.milieu)     msg += ` (${intent.milieu.charAt(0) + intent.milieu.slice(1).toLowerCase()})`;
    msg += ' ✓';
  }
  NLP.showBot(msg);

  if (matches.length) {
    const pts = matches
      .map(m => [parseFloat(m.rec.LATITUDE), parseFloat(m.rec.LONGITUDE)])
      .filter(([la, lo]) => !isNaN(la) && !isNaN(lo) && (la || lo));
    if (pts.length) MAP.fitBounds(pts);
  }
  NLP.saveHistory(raw);
}

/* ── NLP Engine Object ──────────────────────────────────────────── */
const NLP = {
  suggestions: [
    { label: '🖼 Galeries à Dakar',       q: 'galeries à Dakar' },
    { label: '🎬 Cinémas Dakar',          q: 'cinémas Dakar' },
    { label: '🏺 Musées du Sénégal',      q: 'musées' },
    { label: '📚 Bibliothèques Dakar',    q: 'bibliothèques Dakar' },
    { label: '🎓 Formations artistiques', q: 'formations' },
    { label: '🏛 Centres culturels',      q: 'centres culturels' },
    { label: '🎪 Salles de spectacle',    q: 'salles de spectacle' },
    { label: '🌴 Culture Ziguinchor',     q: 'Ziguinchor' },
    { label: '🌹 Patrimoine Saint-Louis', q: 'Saint-Louis' },
    { label: '🏗 Infrastructures Thiès',  q: 'Thiès' },
    { label: '👩 Foyers des femmes',      q: 'foyers femmes' },
    { label: '🌿 En zones rurales',       q: 'rural' },
  ],

  _botTimer: null,

  typewriter(el, text, speed) {
    speed = speed || 24;
    clearTimeout(this._botTimer);
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (i < text.length) { el.textContent += text.charAt(i++); this._botTimer = setTimeout(tick, speed); }
    };
    tick();
  },

  showBot(msg) {
    const bar   = document.getElementById('mapBotBar');
    const msgEl = document.getElementById('mapBotMsg');
    if (!bar || !msgEl) return;
    bar.classList.remove('hidden');
    bar.style.animation = 'none';
    void bar.offsetWidth; // reflow
    bar.style.animation = 'botSlideIn .3s ease';
    this.typewriter(msgEl, msg, 22);
  },

  showChips(intent) {
    const row = document.getElementById('nlpChipsRow');
    if (!row) return;
    const chips = [];
    const infraTypes = intent.types.filter(t => t !== 'formations');
    infraTypes.forEach(t => chips.push(`<span class="nlp-chip" style="background:#0d5fa0">🏛 ${t}</span>`));
    if (intent.types.includes('formations')) chips.push(`<span class="nlp-chip" style="background:#6a1b9a">🎓 Formations</span>`);
    intent.regions.forEach(r => chips.push(`<span class="nlp-chip" style="background:#1a6b3e">📍 ${r.charAt(0) + r.slice(1).toLowerCase()}</span>`));
    if (intent.milieu) chips.push(`<span class="nlp-chip" style="background:#e65100">🌍 ${intent.milieu.charAt(0) + intent.milieu.slice(1).toLowerCase()}</span>`);
    if (chips.length) { row.innerHTML = chips.join(''); row.classList.remove('hidden'); }
    else row.classList.add('hidden');
  },

  saveHistory(raw) {
    if (!raw || raw.trim().length < 2) return;
    const h = this.getHistory().filter(x => x !== raw.trim());
    h.unshift(raw.trim());
    try { localStorage.setItem('culte_nlp_history', JSON.stringify(h.slice(0, 8))); } catch(e) {}
  },

  getHistory() {
    try { return JSON.parse(localStorage.getItem('culte_nlp_history') || '[]'); } catch(e) { return []; }
  },

  showSuggestionsPanel(inputEl) {
    let panel = document.getElementById('nlpSuggestPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'nlpSuggestPanel';
      panel.className = 'nlp-suggest-panel';
      document.body.appendChild(panel);
      panel.addEventListener('mousedown', e => e.preventDefault());
    }

    const val = (inputEl.value || '').trim();
    const hist = this.getHistory();
    let html = '';

    // Autocomplétion IA si l'utilisateur tape quelque chose
    if (val.length >= 2 && typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      const completions = SearchEngine.autocomplete(val, 6);
      if (completions.length) {
        html += '<div class="nlp-suggest-sec"><span style="color:#48cae4">🤖</span> Suggestions IA</div>';
        html += completions.map(c => {
          const icon = c.type === 'formation' ? '🎓' : c.type === 'region' ? '📍' : c.type === 'categorie' ? '🏛' : c.type === 'lieu' ? '🗺' : '🔍';
          const badge = c.typeKey ? `<span class="nlp-sug-badge">${c.typeKey}</span>` : (c.region ? `<span class="nlp-sug-badge">${c.region}</span>` : '');
          return `<div class="nlp-suggest-item nlp-ai-suggest" data-q="${escAttr(c.query || c.label)}"><span class="nlp-sug-icon">${icon}</span><span>${escAttr(c.label)}</span>${badge}</div>`;
        }).join('');
        html += '<div class="nlp-suggest-divider"></div>';
      }
    }

    // Recherches récentes
    if (hist.length) {
      html += '<div class="nlp-suggest-sec">Recherches récentes</div>';
      html += hist.map(h =>
        `<div class="nlp-suggest-item" data-q="${escAttr(h)}"><span class="nlp-sug-icon">🕐</span><span>${escAttr(h)}</span></div>`
      ).join('');
      html += '<div class="nlp-suggest-divider"></div>';
    }

    // Suggestions curated
    html += '<div class="nlp-suggest-sec">Explorer</div>';
    html += this.suggestions.map(s =>
      `<div class="nlp-suggest-item" data-q="${escAttr(s.q)}">${s.label}</div>`
    ).join('');
    panel.innerHTML = html;

    panel.querySelectorAll('.nlp-suggest-item').forEach(item => {
      item.addEventListener('click', () => {
        const q = item.dataset.q;
        panel.style.display = 'none';
        inputEl.value = q;
        if (inputEl.id === 'mapSearch') {
          document.getElementById('mapSearchClear').classList.remove('hidden');
          runNlpSearch(q);
        } else {
          switchTab('list');
          NLP.applyToListTab(q);
        }
        NLP.saveHistory(q);
      });
    });

    const rect = inputEl.getBoundingClientRect();
    panel.style.left    = rect.left + 'px';
    panel.style.top     = (rect.bottom + window.scrollY + 4) + 'px';
    panel.style.width   = Math.max(rect.width, 280) + 'px';
    panel.style.display = 'block';

    const closePanel = e => {
      if (!panel.contains(e.target) && e.target !== inputEl) {
        panel.style.display = 'none';
        document.removeEventListener('mousedown', closePanel, true);
        document.removeEventListener('touchstart', closePanel, true);
      }
    };
    setTimeout(() => {
      document.addEventListener('mousedown', closePanel, true);
      document.addEventListener('touchstart', closePanel, true);
    }, 50);
  },

  applyToListTab(raw) {
    // Utiliser le SearchEngine IA pour comprendre l'intention
    let intent;
    if (typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
      intent = SearchEngine.parseIntent(raw);
    } else {
      intent = parseQuery(raw);
    }

    state.listFilters.search = raw;
    if (intent.regions && intent.regions.length) {
      state.listFilters.region = intent.regions[0];
      const sel = document.getElementById('regionSelect');
      if (sel) sel.value = intent.regions[0];
    }
    const infraTypes = (intent.types || []).filter(t => t !== 'formations');
    if (infraTypes.length) state.listFilters.type = infraTypes[0];
    if (intent.milieu) state.listFilters.milieu = intent.milieu;

    // Détection intelligente du dataset
    if (intent.wantFormations && !intent.wantInfra) {
      state.listSet = 'formations';
      renderListTabs();
    } else if (intent.types && intent.types.includes('formations')) {
      state.listSet = 'formations';
      renderListTabs();
    }

    const listSearch = document.getElementById('listSearch');
    if (listSearch) listSearch.value = raw;
    applyListFilters(true);
  },
};

function openModalFromMap(idx) {
  const entry = state.nlpStore[idx];
  if (!entry) return;
  MAP.closeInfoWindow();
  openModal(null, entry.rec, entry.isFormation, null, null);
}

function locateUser() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    MAP.setView(pos.coords.latitude, pos.coords.longitude, 12);
  });
}

function navigateTo(lat, lon) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => window.open(`https://www.google.com/maps/dir/${pos.coords.latitude},${pos.coords.longitude}/${lat},${lon}`),
      ()  => window.open(`https://www.google.com/maps?q=${lat},${lon}`)
    );
  } else {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`);
  }
}

/* ════════════════════════════════════════════════════════════════
   DETAIL MODAL
   ════════════════════════════════════════════════════════════════ */
function openModal(e, rec, isFormation, filteredIdx, carouselName) {
  if (e) e.stopPropagation();
  let r = rec;
  if (r === null && filteredIdx !== undefined && filteredIdx !== null) {
    r = state.filtered[filteredIdx];
  }
  if (r === null && carouselName) {
    r = getCarouselRec(carouselName);
  }
  if (!r) return;

  const typeKey = isFormation ? (r.BRANCHE || '') : getInfraType(r);
  const conf = getTypeConf(typeKey, isFormation);
  const name    = r.DESIGNATION || r.NOM_ETABLISSEMENT || 'Sans nom';
  const commune = r.COMMUNE || r.LOCALITE || '';
  const region  = r.REGION || '';
  const dept    = r.DEPARTEMENT || '';
  const lat     = parseFloat(r.LATITUDE);
  const lon     = parseFloat(r.LONGITUDE);
  const hasCoords = !isNaN(lat) && !isNaN(lon) && lat && lon;
  const imgUrl    = !isFormation ? getInfraImage(r, typeKey) : '';

  const hero = document.getElementById('modalHero');
  /* Image-based hero pour les infrastructures, gradient pour les formations */
  if (!isFormation && imgUrl) {
    hero.style.background = '#0a1929';
    hero.innerHTML = `
      <img class="modal-hero-img" src="${imgUrl}" alt="${name}"
           onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,${conf.color},#00b4d8)'">
      <div class="modal-hero-overlay"></div>
      <div class="modal-hero-content">
        <div class="modal-hero-type" style="background:${conf.bg};color:${conf.color}">${conf.icon} ${typeKey}</div>
        <div class="modal-hero-name">${name}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    `;
  } else {
    hero.style.background = `linear-gradient(135deg, ${conf.color}, #00b4d8)`;
    hero.innerHTML = `
      <div class="modal-hero-overlay"></div>
      <div class="modal-hero-content">
        <div class="modal-hero-type" style="background:${conf.bg};color:${conf.color}">${conf.icon} ${typeKey}</div>
        <div class="modal-hero-name">${name}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    `;
  }

  const rows = [
    { icon: '📍', label: 'Localisation', value: [commune, dept, region].filter(Boolean).join(' › ') },
    r.BRANCHE ? { icon: '🎓', label: 'Branche', value: r.BRANCHE } : null,
  ].filter(Boolean);

  const itemId = name.replace(/\s+/g, '_').toLowerCase().substring(0, 40);
  const socialButtons = typeof Social !== 'undefined' ? Social.renderShareButtons(name, typeKey, region, commune) : '';
  const starsHtml = typeof Social !== 'undefined' ? Social.renderStars(itemId) : '';
  const reviewFormHtml = typeof Social !== 'undefined' ? Social.renderReviewForm(itemId) : '';
  const reviewsListHtml = typeof Social !== 'undefined' ? Social.renderReviewsList(itemId, 3) : '';

  document.getElementById('modalBody').innerHTML = `
    ${rows.map(row => `
      <div class="modal-info-row">
        <span class="modal-info-icon">${row.icon}</span>
        <div><div class="modal-info-label">${row.label}</div><div class="modal-info-value">${row.value}</div></div>
      </div>
    `).join('')}
    <div class="modal-actions">
      ${hasCoords ? `<button class="modal-btn modal-btn-primary" onclick="navigateTo(${lat},${lon})">🧭 M'y rendre</button>` : ''}
      ${hasCoords ? `<button class="modal-btn modal-btn-secondary" onclick="showOnMap(${lat},${lon})">🗺 Sur la carte</button>` : ''}
      ${!isFormation && r._id !== undefined ? `<a class="modal-btn modal-btn-site" href="site/?id=${r._id}" target="_blank">🌐 Voir la page</a>` : ''}
    </div>
    ${starsHtml}
    ${socialButtons}
    ${reviewFormHtml}
    ${reviewsListHtml}
    <div style="height:12px"></div>
  `;

  // Tracker la vue pour recommandations / analytics
  if (typeof Analytics !== 'undefined' && Analytics.trackView) Analytics.trackView(itemId, typeKey, region);
  if (typeof Recommendations !== 'undefined' && Recommendations.trackView) Recommendations.trackView(r);

  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
  navPush({ modal: true, tab: state.activeTab });
  setupModalSwipe();
}

function sharePlace(name, loc) {
  const text = `${name} — ${loc} | Découvrez sur Culte Culture Sénégal`;
  if (navigator.share) {
    navigator.share({ title: name, text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => {
      const btn = document.querySelector('.modal-share-btn');
      if (btn) { btn.textContent = '✓ Copié !'; setTimeout(() => btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Partager`, 2000); }
    });
  }
}

function setupModalSwipe() {
  const sheet = document.getElementById('modalSheet');
  let startY = 0, currentY = 0, dragging = false;
  sheet.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY; dragging = true; currentY = 0;
    sheet.style.transition = 'none';
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (!dragging) return;
    currentY = Math.max(0, e.touches[0].clientY - startY);
    sheet.style.transform = `translateY(${currentY}px)`;
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (!dragging) return; dragging = false;
    sheet.style.transition = '';
    if (currentY > 100) {
      sheet.style.transform = `translateY(100%)`;
      setTimeout(() => { closeModal(); sheet.style.transform = ''; }, 260);
    } else {
      sheet.style.transform = '';
    }
  });
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  // Retirer l'entrée modal de l'historique
  if (navHistory.length && navHistory[navHistory.length - 1].modal) {
    navHistory.pop();
  }
}

function showOnMap(lat, lon) {
  closeModal();
  switchTab('explore');
  setTimeout(() => {
    if (state.map) {
      MAP.setView(lat, lon, 15);
    }
  }, 100);
}

/* ════════════════════════════════════════════════════════════════
   TAB NAVIGATION
   ════════════════════════════════════════════════════════════════ */
function switchTab(tabName) {
  if (tabName === state.activeTab) return;

  // Enregistrer le tab précédent dans l'historique pour retour arrière
  if (!handlingPopState) {
    navPush({ tab: state.activeTab });
  }

  const prevIdx = TAB_ORDER.indexOf(state.activeTab);
  const nextIdx = TAB_ORDER.indexOf(tabName);
  const goRight = nextIdx > prevIdx;

  // Animate out current
  const prevSection = document.getElementById(`tab-${state.activeTab}`);
  if (prevSection) {
    prevSection.classList.add(goRight ? 'slide-out-left' : 'slide-out-right');
    setTimeout(() => {
      prevSection.classList.remove('active', 'slide-out-left', 'slide-out-right');
    }, 220);
  }

  state.activeTab = tabName;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));

  const section = document.getElementById(`tab-${tabName}`);
  if (section) {
    section.classList.add('active', goRight ? 'slide-in-right' : 'slide-in-left');
    setTimeout(() => section.classList.remove('slide-in-right', 'slide-in-left'), 250);
  }

  const navBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
  if (navBtn) navBtn.classList.add('active');

  if (tabName === 'explore') {
    setTimeout(() => {
      initMap();
      if (state.map) MAP.resize();
    }, 100);
  }
  if (tabName === 'list') {
    renderListTabs();
    applyListFilters(false);
  }
  if (tabName === 'favorites') renderFavs();
}

/* ════════════════════════════════════════════════════════════════
   HOME SEARCH
   ════════════════════════════════════════════════════════════════ */
function setupHomeSearch() {
  const input = document.getElementById('homeSearch');
  let timer;
  let sugTimer;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    clearTimeout(sugTimer);
    const val = input.value.trim();

    // Autocomplétion en temps réel
    sugTimer = setTimeout(() => {
      if (val.length >= 2) {
        NLP.showSuggestionsPanel(input);
      }
    }, 150);

    timer = setTimeout(() => {
      if (!val) return;
      switchTab('list');
      NLP.applyToListTab(val);
    }, 500);
  });

  input.addEventListener('focus', () => {
    NLP.showSuggestionsPanel(input);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (!val) return;
      const panel = document.getElementById('nlpSuggestPanel');
      if (panel) panel.style.display = 'none';
      switchTab('list');
      NLP.applyToListTab(val);
    }
    if (e.key === 'Escape') {
      const panel = document.getElementById('nlpSuggestPanel');
      if (panel) panel.style.display = 'none';
    }
  });
}

/* ════════════════════════════════════════════════════════════════
   CLOCK
   ════════════════════════════════════════════════════════════════ */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const el = document.getElementById('statusTime');
  if (el) el.textContent = `${h}:${m}`;
}

/* ════════════════════════════════════════════════════════════════
   DESKTOP
   ════════════════════════════════════════════════════════════════ */
function isDesktop() { return window.innerWidth >= 1024; }

function applyLayout() {
  document.body.classList.toggle('is-desktop', isDesktop());
}

function setupDesktopFilters() {
  // Populate explore region select
  const mapRegSel = document.getElementById('mapRegionSelect');
  if (mapRegSel) {
    const regions = [...new Set([
      ...state.data.infrastructures.map(r => r.REGION),
      ...state.data.formations.map(r => r.REGION),
    ].filter(Boolean))].sort();
    mapRegSel.innerHTML = '<option value="">Toutes les régions</option>' +
      regions.map(r => `<option value="${r}">${r.charAt(0)+r.slice(1).toLowerCase()}</option>`).join('');
    mapRegSel.addEventListener('change', e => {
      state.mapFilters.region = e.target.value;
      if (state.map) applyMapFilters();
    });
  }

  // Desktop milieu pills for map
  document.querySelectorAll('#tab-explore .ep-milieu').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-explore .ep-milieu').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mapFilters.milieu = btn.dataset.milieu;
      if (state.map) applyMapFilters();
    });
  });

  // Desktop explore reset
  const epReset = document.getElementById('epReset');
  if (epReset) epReset.addEventListener('click', () => {
    state.mapFilters = { search: '', layer: 'all', region: '', milieu: '' };
    if (mapRegSel) mapRegSel.value = '';
    document.querySelectorAll('#tab-explore .ep-milieu').forEach(b => b.classList.toggle('active', b.dataset.milieu === ''));
    document.querySelectorAll('.map-chip').forEach(b => b.classList.toggle('active', b.dataset.layer === 'all'));
    document.getElementById('mapSearch').value = '';
    document.getElementById('mapSearchClear').classList.add('hidden');
    document.getElementById('nlpChipsRow').classList.add('hidden');
    document.getElementById('mapBotBar').classList.add('hidden');
    if (state.map) {
      populateMapLayer('all');
      MAP.setView(14.5, -14.5, 6);
    }
    updateEpStats();
  });

  // Desktop list filters
  const regSelDt = document.getElementById('regionSelectDt');
  if (regSelDt) {
    regSelDt.innerHTML = document.getElementById('regionSelect').innerHTML;
    regSelDt.addEventListener('change', e => {
      state.listFilters.region = e.target.value;
      document.getElementById('regionSelect').value = e.target.value;
      applyListFilters(true);
    });
  }

  document.querySelectorAll('#milieuRowDt .ep-milieu').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#milieuRowDt .ep-milieu').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.listFilters.milieu = btn.dataset.milieu;
      document.querySelectorAll('.milieu-pill').forEach(b => b.classList.toggle('active', b.dataset.milieu === btn.dataset.milieu));
      applyListFilters(true);
    });
  });

  const drawerResetDt = document.getElementById('drawerResetDt');
  if (drawerResetDt) drawerResetDt.addEventListener('click', () => {
    state.listFilters = { search: '', region: '', type: '', milieu: '' };
    document.getElementById('listSearch').value = '';
    document.getElementById('regionSelect').value = '';
    if (regSelDt) regSelDt.value = '';
    document.querySelectorAll('.milieu-pill, #milieuRowDt .ep-milieu').forEach(b => b.classList.toggle('active', b.dataset.milieu === ''));
    renderListTabs();
    applyListFilters(true);
  });

  // Desktop search bar
  const dtSearch = document.getElementById('dtSearch');
  if (dtSearch) {
    let dtTimer;
    dtSearch.addEventListener('input', () => {
      clearTimeout(dtTimer);
      dtTimer = setTimeout(() => {
        const val = dtSearch.value.trim();
        if (!val) return;
        switchTab('list');
        state.listFilters.search = val;
        document.getElementById('listSearch').value = val;
        applyListFilters(true);
      }, 350);
    });
    dtSearch.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = dtSearch.value.trim();
        if (!val) return;
        switchTab('list');
        state.listFilters.search = val;
        document.getElementById('listSearch').value = val;
        applyListFilters(true);
      }
    });
  }

  // Update total count
  const total = state.data.infrastructures.length + state.data.formations.length;
  const el = document.getElementById('dtTotalCount');
  if (el) el.textContent = total.toLocaleString('fr-FR');

  updateEpStats();
}

function updateEpStats() {
  const el = document.getElementById('epInfraCount');
  if (el) el.textContent = state.data.infrastructures.length;
  const el2 = document.getElementById('epFormCount');
  if (el2) el2.textContent = state.data.formations.length;
  const el3 = document.getElementById('epRegCount');
  if (el3) el3.textContent = new Set(state.data.infrastructures.map(r => r.REGION).filter(Boolean)).size;
}

function buildTypeChipsDt() {
  const container = document.getElementById('typeChipsDt');
  if (!container) return;
  const isFormation = state.listSet === 'formations';
  const records = isFormation ? state.data.formations : state.data.infrastructures;
  const typeCounts = {};
  records.forEach(r => {
    const t = isFormation ? (r.BRANCHE || 'default') : getInfraType(r);
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const sorted = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]);
  container.innerHTML = sorted.map(([type]) => {
    const active = state.listFilters.type === type;
    return `<button class="type-chip${active?' active':''}" data-type="${type}">${type}</button>`;
  }).join('');
  container.querySelectorAll('.type-chip').forEach(btn => {
    btn.onclick = () => {
      state.listFilters.type = state.listFilters.type === btn.dataset.type ? '' : btn.dataset.type;
      buildTypeChips(); buildTypeChipsDt();
      applyListFilters(true);
    };
  });
}

/* Extended map filter with region/milieu */
function applyMapFilters() {
  const { layer, region, milieu } = state.mapFilters;
  MAP.clearMarkers();
  const filtered = [];
  state.mapMarkers.forEach(({ marker, rec, isFormation }) => {
    const recRegion = (rec.REGION || '').toUpperCase();
    const recMilieu = (rec.MILIEU || '').toUpperCase();
    const layerOk = layer === 'all' || (layer === 'infrastructures' && !isFormation) || (layer === 'formations' && isFormation);
    const regionOk = !region || recRegion === region.toUpperCase();
    const milieuOk = !milieu || recMilieu === milieu;
    if (layerOk && regionOk && milieuOk) filtered.push(marker);
  });
  MAP.addMarkers(filtered);
  document.getElementById('chipAll').textContent = filtered.length;
}

/* ════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════ */
async function init() {
  applyLayout();
  window.addEventListener('resize', () => applyLayout());

  updateClock();
  setInterval(updateClock, 30000);

  await loadData();

  // Build home
  buildHome();
  buildListFilters();

  // Bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // See all buttons
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.goto));
  });

  // List tabs
  document.querySelectorAll('.list-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.listSet = btn.dataset.set;
      state.listFilters = { search: '', region: '', type: '', milieu: '' };
      document.getElementById('listSearch').value = '';
      document.getElementById('regionSelect').value = '';
      renderListTabs();
      buildTypeChipsDt();
      applyListFilters(true);
    });
  });

  // List search — avec autocomplétion IA
  const listSearch = document.getElementById('listSearch');
  let listTimer;
  let listSugTimer;
  listSearch.addEventListener('input', () => {
    clearTimeout(listTimer);
    clearTimeout(listSugTimer);
    state.listFilters.search = listSearch.value;

    // Autocomplétion temps réel
    listSugTimer = setTimeout(() => {
      const val = listSearch.value.trim();
      if (val.length >= 2) NLP.showSuggestionsPanel(listSearch);
    }, 150);

    listTimer = setTimeout(() => applyListFilters(true), 280);
  });
  listSearch.addEventListener('focus', () => {
    NLP.showSuggestionsPanel(listSearch);
  });
  listSearch.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('nlpSuggestPanel');
      if (panel) panel.style.display = 'none';
    }
  });

  // Region select (mobile drawer)
  document.getElementById('regionSelect').addEventListener('change', e => {
    state.listFilters.region = e.target.value;
    applyListFilters(true);
  });

  // Milieu pills (mobile drawer)
  document.querySelectorAll('.milieu-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.milieu-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.listFilters.milieu = btn.dataset.milieu;
      applyListFilters(true);
    });
  });

  // Drawer reset (mobile)
  document.getElementById('drawerReset').addEventListener('click', () => {
    state.listFilters = { search: '', region: '', type: '', milieu: '' };
    document.getElementById('listSearch').value = '';
    document.getElementById('regionSelect').value = '';
    document.querySelectorAll('.milieu-pill').forEach(b => b.classList.toggle('active', b.dataset.milieu === ''));
    renderListTabs();
    applyListFilters(true);
  });

  // Filter button toggle (mobile)
  document.getElementById('filterBtn').addEventListener('click', () => {
    const drawer = document.getElementById('listFilterDrawer');
    drawer.classList.toggle('hidden');
  });

  // Map layer chips
  document.querySelectorAll('.map-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.map-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mapFilters.layer = btn.dataset.layer;
      if (state.map) {
        if (isDesktop() && (state.mapFilters.region || state.mapFilters.milieu)) {
          applyMapFilters();
        } else {
          populateMapLayer(btn.dataset.layer);
        }
      }
    });
  });

  // Modal backdrop
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);

  // Home search
  setupHomeSearch();

  // Locate FAB — enrichi avec GeoSearch
  document.getElementById('locateFab').addEventListener('click', () => {
    const fab = document.getElementById('locateFab');
    fab.classList.add('locating');

    const onPos = (pos) => {
      fab.classList.remove('locating');
      MAP.setView(pos.coords ? pos.coords.latitude : pos.latitude,
                   pos.coords ? pos.coords.longitude : pos.longitude, 13);
      MAP.addUserMarker(pos.coords ? pos.coords.latitude : pos.latitude,
                        pos.coords ? pos.coords.longitude : pos.longitude);

      // Recherche de proximité automatique
      if (typeof GeoSearch !== 'undefined' && typeof SearchEngine !== 'undefined' && SearchEngine.ready) {
        const userPos = { latitude: pos.coords ? pos.coords.latitude : pos.latitude,
                          longitude: pos.coords ? pos.coords.longitude : pos.longitude };
        const allDocs = SearchEngine.docs.map(d => d.rec);
        const nearby = GeoSearch.filterByRadius(allDocs, userPos, 5);
        if (nearby.length) {
          NLP.showBot(`📍 ${nearby.length} lieu${nearby.length > 1 ? 'x' : ''} culturel${nearby.length > 1 ? 's' : ''} dans un rayon de 5 km`);
          if (typeof VoiceConversation !== 'undefined' && VoiceConversation.isEnabled) {
            VoiceConversation.speakResponse(`J'ai trouvé ${nearby.length} lieux culturels à moins de 5 kilomètres de vous.`, nearby.length);
          }
        }
      }
    };

    if (typeof GeoSearch !== 'undefined') {
      GeoSearch.getPosition().then(pos => {
        if (pos) onPos({ coords: pos });
        else fab.classList.remove('locating');
      }).catch(() => fab.classList.remove('locating'));
    } else {
      navigator.geolocation?.getCurrentPosition(onPos, () => fab.classList.remove('locating'));
    }
  });

  // Dark mode
  initDarkMode();

  // Chatbot IA
  if (typeof Chatbot !== 'undefined') Chatbot.init();

  // Partage social + Avis
  if (typeof Social !== 'undefined') Social.init();

  // Recommandations
  if (typeof Recommendations !== 'undefined') Recommendations.init?.();

  // Analytics
  if (typeof Analytics !== 'undefined') Analytics.init?.();

  // MultiLang (Pulaar, Serer, Diola)
  if (typeof MultiLang !== 'undefined') MultiLang.init?.();

  // Visites guidées
  if (typeof GuidedTours !== 'undefined') GuidedTours.init?.();

  // Statistiques visuelles
  if (typeof StatsDashboard !== 'undefined') StatsDashboard.init?.();

  // Export calendrier & rappels
  if (typeof CalendarExport !== 'undefined') CalendarExport.init?.();

  // Desktop filters setup
  setupDesktopFilters();

  // NLP enhanced search — mic, suggestions, history
  initNlpSearch();

  // Panneau ajout temps réel
  initLiveAddPanel();

  // PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Écouter les changements d'index en temps réel
  if (typeof SearchEngine !== 'undefined') {
    SearchEngine.onChange(evt => {
      // Mettre à jour les compteurs UI
      const stats = SearchEngine.getStats();
      if (stats) {
        const el1 = document.getElementById('statInfra');
        const el2 = document.getElementById('statFormations');
        if (el1) el1.textContent = stats.infraCount;
        if (el2) el2.textContent = stats.formCount;
        const chipAll = document.getElementById('chipAll');
        const chipInfra = document.getElementById('chipInfra');
        const chipForm = document.getElementById('chipFormation');
        if (chipAll) chipAll.textContent = stats.totalDocs;
        if (chipInfra) chipInfra.textContent = stats.infraCount;
        if (chipForm) chipForm.textContent = stats.formCount;
      }
      // Rafraîchir la liste si on est dans l'onglet list
      if (state.activeTab === 'list') {
        applyListFilters(false);
      }
    });
  }

  // Hide splash
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    document.getElementById('splash').style.transition = 'opacity .5s';
    setTimeout(() => {
      document.getElementById('splash').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
    }, 500);
  }, 1200);
}

/* ════════════════════════════════════════════════════════════════
   NLP SEARCH INIT — voix IA multilingue, suggestions, historique
   ════════════════════════════════════════════════════════════════ */
function initNlpSearch() {
  // ── Initialiser les modules révolutionnaires ──

  // 1. Voice Conversation (TTS)
  if (typeof VoiceConversation !== 'undefined') {
    VoiceConversation.init();
    // Accueil vocal
    setTimeout(() => {
      if (VoiceConversation.isEnabled) {
        VoiceConversation.speakGreeting();
      }
    }, 2000);
  }

  // 2. AutoSuggest — attacher aux champs de recherche
  if (typeof AutoSuggest !== 'undefined') {
    const _onSuggestSelect = (suggestion) => {
      const query = suggestion.query || suggestion.label;
      if (state.activeTab === 'explore') {
        const ms = document.getElementById('mapSearch');
        if (ms) { ms.value = query; document.getElementById('mapSearchClear')?.classList.remove('hidden'); }
        runNlpSearch(query);
      } else {
        switchTab('list');
        NLP.applyToListTab(query);
      }
    };

    setTimeout(() => {
      const homeSearch = document.getElementById('homeSearch');
      const mapSearch = document.getElementById('mapSearch');
      const listSearch = document.getElementById('listSearch');
      const dtSearch = document.getElementById('dtSearch');
      if (homeSearch) AutoSuggest.attach(homeSearch, _onSuggestSelect);
      if (mapSearch)  AutoSuggest.attach(mapSearch, _onSuggestSelect);
      if (listSearch) AutoSuggest.attach(listSearch, _onSuggestSelect);
      if (dtSearch)   AutoSuggest.attach(dtSearch, _onSuggestSelect);
    }, 500);
  }

  // 3. GeoSearch — pré-charger la position
  if (typeof GeoSearch !== 'undefined') {
    GeoSearch.getPosition().catch(() => {});
  }

  // ── Initialiser la recherche vocale IA (Français + Wolof) ──
  if (typeof VoiceSearch !== 'undefined') {
    VoiceSearch.init();
  } else {
    // Fallback si voice-search.js n'est pas chargé
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        micBtn.addEventListener('click', () => {
          const rec = new SR();
          rec.lang = 'fr-FR';
          micBtn.classList.add('mic-active');
          rec.onend   = () => micBtn.classList.remove('mic-active');
          rec.onerror = () => micBtn.classList.remove('mic-active');
          rec.onresult = e => {
            const text = e.results[0][0].transcript;
            micBtn.classList.remove('mic-active');
            NLP.saveHistory(text);
            if (state.activeTab === 'explore') {
              const ms = document.getElementById('mapSearch');
              ms.value = text;
              document.getElementById('mapSearchClear').classList.remove('hidden');
              runNlpSearch(text);
            } else {
              document.getElementById('homeSearch').value = text;
              switchTab('list');
              NLP.applyToListTab(text);
            }
          };
          rec.start();
        });
      } else {
        micBtn.style.opacity = '.35';
      }
    }
  }

  // ── dtSearch (desktop topbar) — suggestions on focus
  const dtSearch = document.getElementById('dtSearch');
  if (dtSearch) {
    dtSearch.addEventListener('focus', () => NLP.showSuggestionsPanel(dtSearch));
    dtSearch.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = dtSearch.value.trim();
        if (!val) return;
        NLP.hideSuggestionsPanel();
        NLP.saveHistory(val);
        switchTab('list');
        NLP.applyToListTab(val);
        document.getElementById('listSearch').value = val;
      }
    });
  }

  // ── Dialogue de recherche multicritères ──
  if (typeof SearchDialog !== 'undefined') {
    // Bouton Home
    const trigHome = document.getElementById('dialogTriggerHome');
    if (trigHome) {
      trigHome.addEventListener('click', () => {
        const hs = document.getElementById('homeSearch');
        SearchDialog.open(hs ? hs.value.trim() : '');
      });
    }
    // Bouton Explore (map)
    const trigMap = document.getElementById('dialogTriggerMap');
    if (trigMap) {
      trigMap.addEventListener('click', () => {
        const ms = document.getElementById('mapSearch');
        SearchDialog.open(ms ? ms.value.trim() : '');
      });
    }
    // Bouton List
    const trigList = document.getElementById('dialogTriggerList');
    if (trigList) {
      trigList.addEventListener('click', () => {
        const ls = document.getElementById('listSearch');
        SearchDialog.open(ls ? ls.value.trim() : '');
      });
    }
  }
}

/* Helper: hide the suggestions panel */
NLP.hideSuggestionsPanel = function() {
  const panel = document.getElementById('nlpSuggestPanel');
  if (panel) panel.style.display = 'none';
};

/* ════════════════════════════════════════════════════════════════
   PANNEAU AJOUT TEMPS RÉEL
   ════════════════════════════════════════════════════════════════ */
function initLiveAddPanel() {
  const panel   = document.getElementById('liveAddPanel');
  const fabBtn  = document.getElementById('fabAdd');
  const closeBtn = document.getElementById('liveAddClose');
  const backdrop = panel?.querySelector('.live-panel-backdrop');
  const submitBtn = document.getElementById('liveSubmitBtn');

  if (!panel || !fabBtn) return;

  let currentSet = 'infra'; // 'infra' | 'formation' | 'event'
  let currentMilieu = '';

  // Ouvrir
  fabBtn.addEventListener('click', () => {
    panel.classList.remove('hidden');
    _updateLivePreview();
  });

  // Fermer
  function closePanel() { panel.classList.add('hidden'); }
  closeBtn?.addEventListener('click', closePanel);
  backdrop?.addEventListener('click', closePanel);

  // Toggle set (infra / formation / event)
  document.querySelectorAll('[data-set]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-set]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSet = btn.dataset.set;

      // Montrer/cacher les champs selon le type
      const typeField = document.getElementById('liveTypeField');
      const brancheField = document.getElementById('liveBrancheField');
      const dateField = document.getElementById('liveDateField');

      if (currentSet === 'formation') {
        typeField?.classList.add('hidden');
        brancheField?.classList.remove('hidden');
        dateField?.classList.add('hidden');
      } else if (currentSet === 'event') {
        typeField?.classList.remove('hidden');
        brancheField?.classList.add('hidden');
        dateField?.classList.remove('hidden');
      } else {
        typeField?.classList.remove('hidden');
        brancheField?.classList.add('hidden');
        dateField?.classList.add('hidden');
      }
    });
  });

  // Toggle milieu
  document.querySelectorAll('[data-milieu]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-milieu]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMilieu = btn.dataset.milieu;
    });
  });

  // GPS
  const gpsBtn = document.getElementById('liveGpsBtn');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', () => {
      if (!navigator.geolocation) return;
      gpsBtn.textContent = '⏳';
      navigator.geolocation.getCurrentPosition(
        pos => {
          document.getElementById('liveLat').value = pos.coords.latitude.toFixed(6);
          document.getElementById('liveLon').value = pos.coords.longitude.toFixed(6);
          gpsBtn.textContent = '✅';
          setTimeout(() => { gpsBtn.textContent = '📍'; }, 1500);
        },
        () => {
          gpsBtn.textContent = '❌';
          setTimeout(() => { gpsBtn.textContent = '📍'; }, 1500);
        }
      );
    });
  }

  // Preview count en temps réel
  function _updateLivePreview() {
    const el = document.getElementById('livePreview');
    if (!el) return;
    const liveCount = LiveIndex.count();
    const totalDocs = (typeof SearchEngine !== 'undefined' && SearchEngine.ready)
      ? SearchEngine.docs.length : '—';
    el.innerHTML = `📊 ${totalDocs} dans l'index · <strong>${liveCount} ajouté${liveCount > 1 ? 's' : ''} manuellement</strong>`;
  }

  // Soumission
  submitBtn?.addEventListener('click', () => {
    const name = document.getElementById('liveName')?.value.trim();
    const region = document.getElementById('liveRegion')?.value;

    if (!name) {
      document.getElementById('liveName')?.focus();
      return;
    }
    if (!region) {
      document.getElementById('liveRegion')?.focus();
      return;
    }

    const isFormation = currentSet === 'formation';
    const record = {};

    if (isFormation) {
      record.NOM_ETABLISSEMENT = name;
      record.BRANCHE = document.getElementById('liveBranche')?.value || '';
    } else {
      record.DESIGNATION = name;
      const typeVal = document.getElementById('liveType')?.value;
      if (typeVal) {
        record.DESCRIPTIF = typeVal;
        record.THEMATIQUE = typeVal;
      }
    }

    record.REGION = region;
    record.COMMUNE = document.getElementById('liveCommune')?.value.trim() || '';
    record.LOCALITE = record.COMMUNE;
    record.DEPARTEMENT = document.getElementById('liveDept')?.value.trim() || '';
    record.MILIEU = currentMilieu;
    record.LATITUDE = document.getElementById('liveLat')?.value || '';
    record.LONGITUDE = document.getElementById('liveLon')?.value || '';
    record.DESCRIPTIF = record.DESCRIPTIF || document.getElementById('liveDesc')?.value.trim() || '';

    // Champs événement
    if (currentSet === 'event') {
      record._eventDate = document.getElementById('liveDate')?.value || '';
      record._isEvent = true;
    }

    // Ajouter via LiveIndex
    const entry = LiveIndex.add(record, isFormation, 'user');

    // Feedback visuel
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '✅ Indexé avec succès !';
    submitBtn.style.background = 'linear-gradient(135deg, #2e7d32, #4caf50)';

    // Réinitialiser le formulaire
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
      document.getElementById('liveName').value = '';
      document.getElementById('liveCommune').value = '';
      document.getElementById('liveDept').value = '';
      document.getElementById('liveLat').value = '';
      document.getElementById('liveLon').value = '';
      document.getElementById('liveDesc').value = '';
      _updateLivePreview();
    }, 1500);

    // Rafraîchir les vues si besoin
    if (state.activeTab === 'list') {
      applyListFilters(false);
    }
    if (state.map && state.activeTab === 'explore') {
      populateMapLayer(state.mapFilters.layer);
    }
  });
}

/* ════════════════════════════════════════════════════════════════
   DARK MODE
   ════════════════════════════════════════════════════════════════ */
function initDarkMode() {
  // Restaurer la préférence sauvegardée ou auto-détecter
  const saved = localStorage.getItem('culte_theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else {
    // Auto dark entre 19h et 6h (heures sénégalaises)
    const h = new Date().getHours();
    if (h >= 19 || h < 6) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  // Créer le bouton toggle
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Basculer mode sombre');
  btn.innerHTML = _isDark() ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const next = _isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('culte_theme', next);
    btn.innerHTML = next === 'dark' ? '☀️' : '🌙';
  });
  document.body.appendChild(btn);
}

function _isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

document.addEventListener('DOMContentLoaded', init);
