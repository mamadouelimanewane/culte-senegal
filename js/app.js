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
  'Centre culturel':      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=700&q=75',
  'Cinéma':               'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700&q=75',
  'Galerie':              'https://images.unsplash.com/photo-1578926375604-c5e560b1da2f?w=700&q=75',
  'Musée':                'https://images.unsplash.com/photo-1566127992631-137a642a90f4?w=700&q=75',
  'Foyer des femmes':     'https://images.unsplash.com/photo-1607748851687-ba9a10438621?w=700&q=75',
  'Foyer des jeunes':     'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=75',
  'Salle de spectacle':   'https://images.unsplash.com/photo-1503095396549-807759245b35?w=700&q=75',
  'Salle des fêtes':      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=700&q=75',
  'Bibliothèque':         'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&q=75',
  'Village artisanal':    'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=700&q=75',
  'Maison de la culture': 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=75',
  'default':              'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=700&q=75',
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
}

/* ════════════════════════════════════════════════════════════════
   HOME TAB
   ════════════════════════════════════════════════════════════════ */
function buildHome() {
  buildCategories();
  buildFeatured();
  buildRegions();
  buildMiniCards();
  buildStats();
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
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const val = input.value.trim();
    clearBtn.classList.toggle('hidden', !val);
    timer = setTimeout(() => runNlpSearch(val), 320);
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

  // Detect types
  const typeMap = {
    'mus': 'Musée','cin': 'Cinéma','galer': 'Galerie','bibl': 'Bibliothèque',
    'theatr': 'Salle de spectacle','jeun': 'Foyer des jeunes','femm': 'Foyer des femmes',
    'artisan': 'Village artisanal','maison': 'Maison de la culture','centre': 'Centre culturel',
    'formation': 'formations','arts': 'ARTS','audiovis': 'AUDIOVISUEL',
  };
  for (const [kw, type] of Object.entries(typeMap)) {
    if (s.includes(kw)) intent.types.push(type);
  }

  // Detect regions
  const regions = ['DAKAR','SAINT-LOUIS','THIES','DIOURBEL','FATICK','KAOLACK','KAFFRINE',
    'ZIGUINCHOR','KOLDA','SEDHIOU','TAMBACOUNDA','KEDOUGOU','LOUGA','MATAM'];
  for (const reg of regions) {
    if (s.includes(norm(reg))) intent.regions.push(reg);
  }

  // Milieu
  if (s.includes('urban') || s.includes('ville')) intent.milieu = 'URBAIN';
  if (s.includes('rural') || s.includes('campagne')) intent.milieu = 'RURAL';

  return intent;
}

function runNlpSearch(raw) {
  if (!raw) return;
  const intent = parseQuery(raw);
  const sNorm = norm(raw);

  // Filter markers
  const matches = state.mapMarkers.filter(({ rec, isFormation, typeKey }) => {
    const name    = norm(rec.DESIGNATION || rec.NOM_ETABLISSEMENT || '');
    const commune = norm(rec.COMMUNE || rec.LOCALITE || '');
    const region  = (rec.REGION || '').toUpperCase();
    const mil     = (rec.MILIEU || '').toUpperCase();

    if (intent.regions.length && !intent.regions.includes(region)) return false;
    if (intent.milieu && mil !== intent.milieu) return false;
    if (intent.types.length) {
      const typeNorm = norm(typeKey);
      if (!intent.types.some(t => typeNorm.includes(norm(t)) || norm(typeKey).includes(norm(t)))) return false;
    }
    if (!intent.types.length && !intent.regions.length && !intent.milieu) {
      return name.includes(sNorm) || commune.includes(sNorm) || norm(region).includes(sNorm);
    }
    return true;
  });

  // Rebuild visible markers
  MAP.clearMarkers();
  MAP.addMarkers(matches.map(m => m.marker));

  // Show chips
  const nlpRow = document.getElementById('nlpChipsRow');
  const chips = [];
  if (intent.types.length) chips.push(`<span class="nlp-chip" style="background:#0d5fa0">🏛 ${intent.types.join(', ')}</span>`);
  if (intent.regions.length) chips.push(`<span class="nlp-chip" style="background:#00695c">📍 ${intent.regions.join(', ')}</span>`);
  if (intent.milieu) chips.push(`<span class="nlp-chip" style="background:#e65100">🌍 ${intent.milieu}</span>`);
  if (chips.length) {
    nlpRow.innerHTML = chips.join('');
    nlpRow.classList.remove('hidden');
  } else {
    nlpRow.classList.add('hidden');
  }

  // Bot bar
  const botBar = document.getElementById('mapBotBar');
  const botMsg = document.getElementById('mapBotMsg');
  const n = matches.length;
  if (n === 0) botMsg.textContent = `Aucun résultat pour "${raw}". Essayez "musée Dakar" ou "cinéma Thiès".`;
  else if (n === 1) botMsg.textContent = `1 lieu trouvé ✓`;
  else botMsg.textContent = `${n} lieux trouvés pour votre recherche.`;
  botBar.classList.remove('hidden');

  // Auto zoom
  if (matches.length > 0) {
    const lats = matches.map(m => parseFloat(m.rec.LATITUDE)).filter(Boolean);
    const lons = matches.map(m => parseFloat(m.rec.LONGITUDE)).filter(Boolean);
    if (lats.length) {
      MAP.fitBounds(lats.map((lat, i) => [lat, lons[i]]));
    }
  }
}

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

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-share-row">
      <button class="modal-share-btn" onclick="sharePlace('${name.replace(/'/g,"&#39;")}','${(commune+', '+region).replace(/'/g,"&#39;")}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Partager
      </button>
    </div>
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
    <div style="height:8px"></div>
  `;

  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
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
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const val = input.value.trim();
      if (!val) return;
      switchTab('list');
      state.listFilters.search = val;
      document.getElementById('listSearch').value = val;
      applyListFilters(true);
    }, 400);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (!val) return;
      switchTab('list');
      state.listFilters.search = val;
      document.getElementById('listSearch').value = val;
      applyListFilters(true);
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

  // List search
  const listSearch = document.getElementById('listSearch');
  let listTimer;
  listSearch.addEventListener('input', () => {
    clearTimeout(listTimer);
    state.listFilters.search = listSearch.value;
    listTimer = setTimeout(() => applyListFilters(true), 280);
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

  // Locate FAB
  document.getElementById('locateFab').addEventListener('click', () => {
    const fab = document.getElementById('locateFab');
    fab.classList.add('locating');
    navigator.geolocation?.getCurrentPosition(
      pos => {
        fab.classList.remove('locating');
        MAP.setView(pos.coords.latitude, pos.coords.longitude, 13);
        MAP.addUserMarker(pos.coords.latitude, pos.coords.longitude);
      },
      () => { fab.classList.remove('locating'); }
    );
  });

  // Mic button (voice search)
  const micBtn = document.getElementById('micBtn');
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    micBtn.addEventListener('click', () => {
      const rec = new SR();
      rec.lang = 'fr-FR';
      rec.onresult = e => {
        const text = e.results[0][0].transcript;
        document.getElementById('homeSearch').value = text;
        switchTab('list');
        state.listFilters.search = text;
        document.getElementById('listSearch').value = text;
        applyListFilters(true);
      };
      rec.start();
    });
  } else {
    micBtn.style.opacity = '.3';
  }

  // Desktop filters setup
  setupDesktopFilters();

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

document.addEventListener('DOMContentLoaded', init);
