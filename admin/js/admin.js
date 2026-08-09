/* ════════════════════════════════════════════════════════════════
   CULTE Admin — Backoffice Logic
   ════════════════════════════════════════════════════════════════ */
'use strict';

/* ── Config ─────────────────────────────────────────────────────── */
// L'authentification est entièrement serveur : aucun compte, aucun
// hash et aucun jeton ne transitent par ce fichier. La session est
// portée par un cookie httpOnly posé par /api/auth/login.
const PER_PAGE = 20;

/* ── State ───────────────────────────────────────────────────────── */
const A = {
  session: null,
  data: { infras: [], forms: [] },
  edits: { infras: {}, forms: {}, deleted: { infras: [], forms: [] } },
  log: [],
  infraFiltered: [], formFiltered: [],
  inscFiltered: [], contFiltered: [],
  infraPage: 1, formPage: 1, inscPage: 1, contPage: 1,
  adminMap: null, adminCluster: null, adminLayer: 'all',
  confirmFn: null,
  editType: null, editIdx: null,
};

/* ── INIT ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Seul le serveur peut confirmer une session : on lui demande.
  try {
    const { user } = await CulteAPI.me();
    A.session = { email: user.email, name: user.nom };
    await showApp();
  } catch {
    /* non authentifié : l'écran de login reste affiché */
  }

  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email  = document.getElementById('loginEmail').value.trim();
    const pwd    = document.getElementById('loginPwd').value;
    const errEl  = document.getElementById('loginError');
    const submit = e.target.querySelector('[type=submit]');

    if (submit) submit.disabled = true;
    try {
      const { user } = await CulteAPI.login(email, pwd, 'admin');
      A.session = { email: user.email, name: user.nom };
      errEl.classList.add('hidden');
      document.getElementById('loginPwd').value = '';
      await showApp();
    } catch (err) {
      errEl.textContent = err.message || 'Identifiants incorrects';
      errEl.classList.remove('hidden');
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  document.getElementById('btnLogout').addEventListener('click', logout);
  document.getElementById('hamburger').addEventListener('click', toggleSidebar);
  document.getElementById('hamburger2').addEventListener('click', toggleSidebar);
  document.getElementById('editModalBackdrop').addEventListener('click', closeEditModal);
  document.getElementById('confirmBackdrop').addEventListener('click', closeConfirm);
  document.getElementById('reviewModalBackdrop').addEventListener('click', closeReviewModal);
});

async function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  document.getElementById('sbUserName').textContent = A.session.name;
  document.getElementById('settingsUser').textContent = A.session.email + ' — ' + A.session.name;
  await Promise.all([loadData(), refreshStore()]);
  setupNav();
  setupTableListeners();
  setupSettingsListeners();
  updateNotifBadges();
  switchView('dashboard');
}

async function logout() {
  try { await CulteAPI.logout(); } catch { /* le cookie expirera de toute façon */ }
  location.reload();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ── DATA LOADING ────────────────────────────────────────────────── */
async function loadData() {
  try {
    const [r1, r2] = await Promise.all([
      fetch('../infrastructures_culturelles.json'),
      fetch('../centre_formation_arts.json'),
    ]);
    const j1 = await r1.json();
    const j2 = await r2.json();
    A.data.infras = (j1.sheets?.INFRASTRUCTURES_CULTURELLES?.records || []).map((r, i) => ({ ...r, _id: i }));
    A.data.forms  = (j2.sheets?.CENTRE_FORMATION_CULTURE?.records  || []).map((r, i) => ({ ...r, _id: i }));
  } catch(e) {
    console.error('Erreur chargement données:', e);
  }
}

function getMergedInfras() {
  return A.data.infras
    .filter(r => !A.edits.deleted.infras.includes(r._id))
    .map(r => ({ ...r, ...(A.edits.infras[r._id] || {}) }));
}
function getMergedForms() {
  return A.data.forms
    .filter(r => !A.edits.deleted.forms.includes(r._id))
    .map(r => ({ ...r, ...(A.edits.forms[r._id]  || {}) }));
}

/* ── STORE SERVEUR ───────────────────────────────────────────────
   Miroir en mémoire des données de l'API. Les lectures restent
   synchrones (le rendu existant n'a pas à changer) ; toute écriture
   passe par l'API puis rafraîchit ce miroir. ───────────────────── */
const S = {
  registrations: [],
  responsables: [],
  contributions: [],
  content: {},
};

async function refreshStore() {
  const [regs, resps, contribs, content, edits, log] = await Promise.all([
    CulteAPI.listRegistrations().catch(() => S.registrations),
    CulteAPI.listResponsables().catch(() => S.responsables),
    CulteAPI.listContributions().catch(() => S.contributions),
    CulteAPI.getContent().catch(() => S.content),
    CulteAPI.getDatasetEdits().catch(() => A.edits),
    CulteAPI.getAuditLog().catch(() => A.log),
  ]);
  S.registrations = regs;
  S.responsables  = resps;
  S.contributions = contribs;
  S.content       = content;
  A.edits = edits;
  A.log   = log;
}

/** Affiche une erreur d'API sans casser la navigation. */
function apiError(err) {
  console.error('[admin]', err);
  alert(err?.message || 'Une erreur est survenue.');
}

/* ── Accès aux données (lecture depuis le miroir) ─────────────────── */
function getRegistrations() { return S.registrations; }
function getResponsables()  { return S.responsables; }
function getPending()       { return S.contributions; }
function getSiteContent()   { return S.content; }

function addLog(action, name) {
  // Le journal fait foi côté serveur ; on affiche l'entrée
  // immédiatement, refreshStore() la resynchronisera.
  A.log.unshift({ action, name, ts: new Date().toISOString() });
  if (A.log.length > 200) A.log.pop();
}

/** Enregistre une correction du jeu de référence côté serveur. */
function persistEdit(dataset, recordId, patch, deleted) {
  // Les enregistrements ajoutés en session (_id « new_… ») n'existent
  // pas dans le jeu de référence : rien à corriger côté serveur.
  if (typeof recordId !== 'number') return Promise.resolve();
  return CulteAPI.saveDatasetEdit(dataset, recordId, patch, deleted).catch(apiError);
}

/* ── NOTIFICATION BADGES ─────────────────────────────────────────── */
function updateNotifBadges() {
  const regPending  = getRegistrations().filter(r => r.statut === 'pending').length;
  const contPending = getPending().filter(p => p.statut === 'pending').length;

  const ni = document.getElementById('notifInscriptions');
  const nc = document.getElementById('notifContenus');
  if (ni) {
    ni.textContent = regPending;
    ni.classList.toggle('hidden', regPending === 0);
  }
  if (nc) {
    nc.textContent = contPending;
    nc.classList.toggle('hidden', contPending === 0);
  }
}

/* ── NAVIGATION ──────────────────────────────────────────────────── */
function setupNav() {
  document.querySelectorAll('.sb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      switchView(btn.dataset.view);
    });
  });
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sb-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.getElementById('view-' + name)?.classList.add('active');
  document.getElementById('topbarTitle').textContent = {
    dashboard: 'Tableau de bord', infrastructures: 'Infrastructures',
    formations: 'Formations', carte: 'Carte',
    inscriptions: 'Inscriptions Responsables', contenus: 'Validation des Contenus',
    parametres: 'Paramètres',
  }[name] || name;

  if (name === 'dashboard')      renderDashboard();
  if (name === 'infrastructures') renderInfraTable(true);
  if (name === 'formations')      renderFormTable(true);
  if (name === 'carte')           initAdminMap();
  if (name === 'inscriptions')    renderInscriptions(true);
  if (name === 'contenus')        renderContenus(true);
  if (name === 'parametres')      renderParametres();
}

/* ── DASHBOARD ───────────────────────────────────────────────────── */
function renderDashboard() {
  const infras  = getMergedInfras();
  const forms   = getMergedForms();
  const regs    = getRegistrations();
  const pend    = getPending();
  const regsPending  = regs.filter(r => r.statut === 'pending').length;
  const contPending  = pend.filter(p => p.statut === 'pending').length;
  const respsCount   = getResponsables().filter(r => r.statut === 'active').length;

  // ── Stat cards with trend arrows ──
  document.getElementById('dashStats').innerHTML = [
    {
      icon: '🏛', num: infras.length.toLocaleString('fr-FR'),
      lbl: 'Infrastructures', color: '#0d5fa0', border: '#0d5fa0',
      gradient: 'linear-gradient(135deg,#e8f4ff 0%,#fff 100%)',
      trend: '▲', trendColor: '#059669', trendTip: 'Base complète',
    },
    {
      icon: '🎓', num: forms.length.toLocaleString('fr-FR'),
      lbl: 'Formations', color: '#6a1b9a', border: '#6a1b9a',
      gradient: 'linear-gradient(135deg,#f3e8ff 0%,#fff 100%)',
      trend: '▲', trendColor: '#059669', trendTip: 'Base complète',
    },
    {
      icon: '👤', num: respsCount,
      lbl: 'Responsables actifs', color: '#065f46', border: '#059669',
      gradient: 'linear-gradient(135deg,#d1fae5 0%,#fff 100%)',
      trend: respsCount > 0 ? '▲' : '—', trendColor: respsCount > 0 ? '#059669' : '#94a3b8', trendTip: 'Comptes validés',
    },
    {
      icon: '📝', num: regsPending,
      lbl: 'Inscriptions en attente', color: '#b45309', border: '#f59e0b',
      gradient: 'linear-gradient(135deg,#fef3c7 0%,#fff 100%)',
      trend: regsPending > 0 ? '▲' : '✓', trendColor: regsPending > 0 ? '#d97706' : '#059669',
      trendTip: regsPending > 0 ? 'Action requise' : 'Tout traité',
    },
    {
      icon: '✅', num: contPending,
      lbl: 'Contenus à valider', color: '#991b1b', border: '#ef4444',
      gradient: 'linear-gradient(135deg,#fee2e2 0%,#fff 100%)',
      trend: contPending > 0 ? '▲' : '✓', trendColor: contPending > 0 ? '#dc2626' : '#059669',
      trendTip: contPending > 0 ? 'Action requise' : 'Tout traité',
    },
  ].map(s => `
    <div class="stat-card" style="border-left-color:${s.border};background:${s.gradient}">
      <div class="stat-icon" style="font-size:32px">${s.icon}</div>
      <div class="stat-info">
        <div class="stat-num" style="color:${s.color}">${s.num}</div>
        <div class="stat-lbl">${s.lbl}</div>
      </div>
      <div class="stat-trend" style="color:${s.trendColor}" title="${s.trendTip}">${s.trend}</div>
    </div>
  `).join('');

  document.getElementById('topbarBadge').textContent =
    (infras.length + forms.length).toLocaleString('fr-FR') + ' lieux';

  // ── Quick action buttons ──
  let quickEl = document.getElementById('dashQuickActions');
  if (!quickEl) {
    quickEl = document.createElement('div');
    quickEl.id = 'dashQuickActions';
    quickEl.className = 'dash-section';
    quickEl.innerHTML = `
      <h3 class="dash-section-title">Actions rapides</h3>
      <div class="dash-quick-actions">
        <button onclick="switchView('inscriptions')" class="quick-btn">
          📝 <span>Gérer les inscriptions${regsPending > 0 ? ' <span class="quick-badge">'+regsPending+'</span>' : ''}</span>
        </button>
        <button onclick="switchView('contenus')" class="quick-btn">
          ✅ <span>Valider les contenus${contPending > 0 ? ' <span class="quick-badge">'+contPending+'</span>' : ''}</span>
        </button>
        <button onclick="switchView('infrastructures')" class="quick-btn">
          🏛 <span>Gérer les infrastructures</span>
        </button>
        <button onclick="switchView('formations')" class="quick-btn">
          🎓 <span>Gérer les formations</span>
        </button>
      </div>
    `;
    document.getElementById('dashStats').after(quickEl);
  } else {
    // refresh badges
    quickEl.querySelector('.dash-quick-actions').innerHTML = `
      <button onclick="switchView('inscriptions')" class="quick-btn">
        📝 <span>Gérer les inscriptions${regsPending > 0 ? ' <span class="quick-badge">'+regsPending+'</span>' : ''}</span>
      </button>
      <button onclick="switchView('contenus')" class="quick-btn">
        ✅ <span>Valider les contenus${contPending > 0 ? ' <span class="quick-badge">'+contPending+'</span>' : ''}</span>
      </button>
      <button onclick="switchView('infrastructures')" class="quick-btn">
        🏛 <span>Gérer les infrastructures</span>
      </button>
      <button onclick="switchView('formations')" class="quick-btn">
        🎓 <span>Gérer les formations</span>
      </button>
    `;
  }

  const regionCounts = {};
  infras.forEach(r => { const k = r.REGION || 'N/A'; regionCounts[k] = (regionCounts[k] || 0) + 1; });
  renderBarChart('chartRegions', regionCounts, 12);

  const typeCounts = {};
  infras.forEach(r => { const k = getInfraType(r); typeCounts[k] = (typeCounts[k] || 0) + 1; });
  renderBarChart('chartTypes', typeCounts, 8);

  // ── Répartition géographique (geo bar chart section) ──
  let geoEl = document.getElementById('dashGeoChart');
  if (!geoEl) {
    geoEl = document.createElement('div');
    geoEl.id = 'dashGeoChart';
    geoEl.className = 'dash-section';
    geoEl.innerHTML = `
      <h3 class="dash-section-title">Répartition géographique</h3>
      <div class="dash-card">
        <div id="geoBarChart" class="geo-bar-chart"></div>
      </div>
    `;
    document.getElementById('dashQuickActions').after(geoEl);
  }
  // Render geo bar chart
  const sortedRegions = Object.entries(regionCounts).sort((a,b) => b[1]-a[1]).slice(0, 8);
  const maxGeo = sortedRegions[0]?.[1] || 1;
  const geoBarEl = document.getElementById('geoBarChart');
  if (geoBarEl) {
    geoBarEl.innerHTML = sortedRegions.length ? sortedRegions.map(([region, count]) => `
      <div class="geo-bar-row">
        <div class="geo-bar-label" title="${region}">${region.charAt(0) + region.slice(1).toLowerCase()}</div>
        <div class="geo-bar-track"><div class="geo-bar-fill" style="width:${(count/maxGeo*100).toFixed(1)}%"></div></div>
        <div class="geo-bar-count">${count}</div>
      </div>
    `).join('') : '<p style="font-size:13px;color:var(--text-sm);padding:8px 0;text-align:center">Chargement…</p>';
  }

  renderActivityTimeline();
  updateNotifBadges();
}

function renderActivityTimeline() {
  const pending = getPending();
  const regs    = getRegistrations();

  const typeIconMap = {
    profile: '📋', gallery_add: '📸', event: '📅', actu: '📰',
  };
  const typeActionMap = {
    profile: 'a soumis une mise à jour du profil',
    gallery_add: 'a soumis une photo',
    event: 'a soumis un événement',
    actu: 'a soumis une actualité',
  };

  const combined = [
    ...pending.map(p => ({
      icon: typeIconMap[p.type] || '📄',
      actor: p.respNom || 'Responsable',
      action: typeActionMap[p.type] || 'a soumis un contenu',
      infra: p.infraNom || '',
      ts: p.dateSubmit,
      statut: p.statut,
    })),
    ...regs.map(r => ({
      icon: '👤',
      actor: r.nom || r.email,
      action: 'a demandé un accès responsable',
      infra: r.infraNom || '',
      ts: r.dateSubmit || r.date,
      statut: r.statut,
    })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);

  // Ensure activity section exists in dashboard view
  let actSection = document.getElementById('dashActivitySection');
  if (!actSection) {
    actSection = document.createElement('div');
    actSection.id = 'dashActivitySection';
    actSection.className = 'dash-section';
    actSection.innerHTML = `
      <h3 class="dash-section-title">Activité récente</h3>
      <div class="dash-card">
        <div id="activityTimeline" class="activity-timeline"></div>
      </div>
    `;
    // Append after geo chart section (or at end of dashboard view)
    const geoEl2 = document.getElementById('dashGeoChart');
    if (geoEl2) geoEl2.after(actSection);
    else document.getElementById('view-dashboard').appendChild(actSection);
  }

  const el = document.getElementById('activityTimeline');
  if (!el) return;

  if (!combined.length) {
    el.innerHTML = '<p style="font-size:13px;color:var(--text-sm);padding:8px 0;text-align:center">Aucune activité récente.</p>';
    return;
  }

  el.innerHTML = combined.map(item => {
    const statusMap = { pending: 'pending', approved: 'approved', rejected: 'rejected' };
    const statusLbl = { pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' };
    const cls = statusMap[item.statut] || 'pending';
    const lbl = statusLbl[item.statut] || item.statut;
    const ago = relativeTime(item.ts);
    const infoPart = item.infra ? ` · ${item.infra}` : '';
    return `<div class="activity-item">
      <div class="act-icon">${item.icon}</div>
      <div class="act-body">
        <div class="act-title">${escHtml(item.actor)} ${escHtml(item.action)}</div>
        <div class="act-sub">${escHtml(item.infra)}${ago ? ' · ' + ago : ''}</div>
      </div>
      <div class="act-status ${cls}">${lbl}</div>
    </div>`;
  }).join('');
}

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'à l\'instant';
  if (mins < 60)  return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (days < 30)  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  return new Date(ts).toLocaleDateString('fr-FR');
}

// Alias historique — pointe sur l'échappement partagé (js/escape.js),
// qui couvre aussi les apostrophes et les accents graves.
const escHtml = window.escapeHtml;

function renderBarChart(id, counts, limit) {
  const el = document.getElementById(id);
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, limit);
  if (!sorted.length) {
    el.innerHTML = `<p style="font-size:13px;color:var(--text-sm);padding:12px 0;text-align:center">Chargement des données…</p>`;
    return;
  }
  const max = sorted[0]?.[1] || 1;
  el.innerHTML = sorted.map(([label, count]) => `
    <div class="bar-row">
      <div class="bar-label" title="${esc(label)}">${esc(label.charAt(0) + label.slice(1).toLowerCase())}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count/max*100).toFixed(1)}%"></div></div>
      <div class="bar-count">${count}</div>
    </div>
  `).join('');
}

function renderRecentEdits() {
  const el = document.getElementById('recentEdits');
  const combined = [
    ...A.log.slice(0, 5).map(item => ({ ...item, src: 'admin' })),
    ...getPending().filter(p => p.statut === 'pending').slice(0, 3).map(p => ({
      action: 'submit', name: `${p.respNom} → ${p.infraNom} (${typeLbl(p.type)})`,
      ts: p.dateSubmit, src: 'resp'
    })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);

  if (!combined.length) {
    el.innerHTML = '<p style="font-size:13px;color:#7a9ab8;padding:8px 0">Aucune activité.</p>';
    return;
  }
  el.innerHTML = combined.map(item => {
    const ts = new Date(item.ts).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    const badgeMap = { edit: 'badge-edit', add: 'badge-add', delete: 'badge-del', submit: 'badge-edit' };
    const lblMap   = { edit: 'Modif.', add: 'Ajout', delete: 'Supprim.', submit: 'Soumis' };
    const cls = badgeMap[item.action] || 'badge-edit';
    const lbl = lblMap[item.action]  || item.action;
    return `<div class="recent-item">
      <span class="recent-badge ${cls}">${esc(lbl)}</span>
      <span class="recent-name">${esc(item.name)}</span>
      <span class="recent-date">${esc(ts)}</span>
    </div>`;
  }).join('');
}

function typeLbl(type) {
  return { profile: 'Profil', gallery_add: 'Photo', event: 'Événement', actu: 'Actualité' }[type] || type;
}

function getInfraType(rec) {
  const d = (rec.DESCRIPTIF || '').trim().toLowerCase();
  const types = ['centre culturel','cinéma','galerie','musée','foyer des femmes','foyer des jeunes',
    'salle de spectacle','salle des fêtes','bibliothèque','village artisanal','maison de la culture'];
  for (const t of types) { if (d.includes(t)) return t.charAt(0).toUpperCase() + t.slice(1); }
  return rec.DESCRIPTIF || '—';
}

/* ── INFRASTRUCTURES TABLE ───────────────────────────────────────── */
function setupTableListeners() {
  let infraTimer;
  document.getElementById('infraSearch').addEventListener('input', () => {
    clearTimeout(infraTimer);
    infraTimer = setTimeout(() => renderInfraTable(true), 250);
  });
  document.getElementById('infraRegionFilter').addEventListener('change', () => renderInfraTable(true));
  document.getElementById('infraTypeFilter').addEventListener('change', () => renderInfraTable(true));
  document.getElementById('btnAddInfra').addEventListener('click', () => openEditModal('infra', null));
  document.getElementById('btnExportInfra').addEventListener('click', () => exportCSV('infra'));

  let formTimer;
  document.getElementById('formSearch').addEventListener('input', () => {
    clearTimeout(formTimer);
    formTimer = setTimeout(() => renderFormTable(true), 250);
  });
  document.getElementById('formRegionFilter').addEventListener('change', () => renderFormTable(true));
  document.getElementById('formBrancheFilter').addEventListener('change', () => renderFormTable(true));
  document.getElementById('btnAddForm').addEventListener('click', () => openEditModal('form', null));
  document.getElementById('btnExportForm').addEventListener('click', () => exportCSV('form'));

  // Inscriptions
  let inscTimer;
  document.getElementById('inscSearch').addEventListener('input', () => {
    clearTimeout(inscTimer);
    inscTimer = setTimeout(() => renderInscriptions(true), 250);
  });
  document.getElementById('inscStatutFilter').addEventListener('change', () => renderInscriptions(true));

  // Contenus
  let contTimer;
  document.getElementById('contSearch').addEventListener('input', () => {
    clearTimeout(contTimer);
    contTimer = setTimeout(() => renderContenus(true), 250);
  });
  document.getElementById('contTypeFilter').addEventListener('change', () => renderContenus(true));
  document.getElementById('contStatutFilter').addEventListener('change', () => renderContenus(true));
}

function renderInfraTable(reset) {
  if (reset) A.infraPage = 1;
  const infras = getMergedInfras();
  populateFilter('infraRegionFilter', infras.map(r => r.REGION).filter(Boolean));
  populateFilter('infraTypeFilter', infras.map(r => getInfraType(r)).filter(v => v && v !== '—'));

  const search = document.getElementById('infraSearch').value.toLowerCase();
  const region = document.getElementById('infraRegionFilter').value;
  const type   = document.getElementById('infraTypeFilter').value;
  A.infraFiltered = infras.filter(r => {
    if (search && !((r.DESIGNATION||'') + (r.COMMUNE||'') + (r.REGION||'')).toLowerCase().includes(search)) return false;
    if (region && (r.REGION||'').toUpperCase() !== region.toUpperCase()) return false;
    if (type   && getInfraType(r).toLowerCase() !== type.toLowerCase()) return false;
    return true;
  });

  renderTableBody('infraTbody', A.infraFiltered, A.infraPage, (r, i) => `
    <td class="td-name" title="${esc(r.DESIGNATION||'')}">${esc(r.DESIGNATION||'Sans nom')}</td>
    <td><span class="badge-type">${esc(getInfraType(r))}</span></td>
    <td>${esc(r.REGION||'—')}</td>
    <td>${esc(r.COMMUNE||'—')}</td>
    <td>${esc(r.MILIEU||'—')}</td>
    <td class="td-actions">
      <button class="btn-icon" title="Modifier" onclick="openEditModal('infra',${i})">✏️</button>
      <button class="btn-icon" title="Supprimer" onclick="confirmDelete('infra',${i})">🗑</button>
    </td>
  `, '🏛', 'Aucune infrastructure', 'Essayez de modifier vos filtres');
  renderMobileCards('infraMobileCards', A.infraFiltered, A.infraPage, (r, i) => `
    <div class="m-card">
      <div class="m-card-name">${esc(r.DESIGNATION||'Sans nom')}</div>
      <div class="m-card-meta">
        <span>${esc(getInfraType(r))}</span><span>📍 ${esc(r.COMMUNE||'—')}, ${esc(r.REGION||'—')}</span>
        ${r.MILIEU ? `<span>${esc(r.MILIEU)}</span>` : ''}
      </div>
      <div class="m-card-actions">
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px" onclick="openEditModal('infra',${i})">✏️ Modifier</button>
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px;color:var(--red)" onclick="confirmDelete('infra',${i})">🗑 Supprimer</button>
      </div>
    </div>
  `);
  renderPagination('infraPag', A.infraFiltered.length, A.infraPage, p => { A.infraPage = p; renderInfraTable(false); });
}

function renderFormTable(reset) {
  if (reset) A.formPage = 1;
  const forms = getMergedForms();
  populateFilter('formRegionFilter', forms.map(r => r.REGION).filter(Boolean));
  populateFilter('formBrancheFilter', forms.map(r => r.BRANCHE).filter(Boolean));

  const search  = document.getElementById('formSearch').value.toLowerCase();
  const region  = document.getElementById('formRegionFilter').value;
  const branche = document.getElementById('formBrancheFilter').value;
  A.formFiltered = forms.filter(r => {
    if (search && !((r.NOM_ETABLISSEMENT||'') + (r.COMMUNE||'') + (r.REGION||'')).toLowerCase().includes(search)) return false;
    if (region  && (r.REGION||'').toUpperCase()  !== region.toUpperCase())  return false;
    if (branche && (r.BRANCHE||'').toUpperCase() !== branche.toUpperCase()) return false;
    return true;
  });

  renderTableBody('formTbody', A.formFiltered, A.formPage, (r, i) => `
    <td class="td-name" title="${esc(r.NOM_ETABLISSEMENT||'')}">${esc(r.NOM_ETABLISSEMENT||'Sans nom')}</td>
    <td><span class="badge-type" style="background:#f3e5f5;color:#6a1b9a">${esc(r.BRANCHE||'—')}</span></td>
    <td>${esc(r.REGION||'—')}</td>
    <td>${esc(r.COMMUNE||'—')}</td>
    <td class="td-actions">
      <button class="btn-icon" title="Modifier" onclick="openEditModal('form',${i})">✏️</button>
      <button class="btn-icon" title="Supprimer" onclick="confirmDelete('form',${i})">🗑</button>
    </td>
  `, '🎓', 'Aucune formation', 'Essayez de modifier vos filtres');
  renderMobileCards('formMobileCards', A.formFiltered, A.formPage, (r, i) => `
    <div class="m-card">
      <div class="m-card-name">${esc(r.NOM_ETABLISSEMENT||'Sans nom')}</div>
      <div class="m-card-meta">
        <span>${esc(r.BRANCHE||'—')}</span><span>📍 ${esc(r.COMMUNE||'—')}, ${esc(r.REGION||'—')}</span>
      </div>
      <div class="m-card-actions">
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px" onclick="openEditModal('form',${i})">✏️ Modifier</button>
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px;color:var(--red)" onclick="confirmDelete('form',${i})">🗑 Supprimer</button>
      </div>
    </div>
  `);
  renderPagination('formPag', A.formFiltered.length, A.formPage, p => { A.formPage = p; renderFormTable(false); });
}

/* ── INSCRIPTIONS ────────────────────────────────────────────────── */
function renderInscriptions(reset) {
  if (reset) A.inscPage = 1;
  const regs   = getRegistrations();
  const search = document.getElementById('inscSearch').value.toLowerCase();
  const statut = document.getElementById('inscStatutFilter').value;

  A.inscFiltered = regs.filter(r => {
    if (search && !((r.nom||'') + (r.email||'') + (r.infraNom||'')).toLowerCase().includes(search)) return false;
    if (statut && r.statut !== statut) return false;
    return true;
  });

  renderTableBody('inscTbody', A.inscFiltered, A.inscPage, (r, i) => `
    <td class="td-name">${esc(r.nom||'')}</td>
    <td>${esc(r.email||'')}</td>
    <td class="td-name" title="${esc(r.infraNom||'')}">${esc(r.infraNom||'—')}</td>
    <td>${esc(r.region||'—')}</td>
    <td>${fmtDate(r.dateInscription)}</td>
    <td><span class="status-pill status-${r.statut}">${statutLbl(r.statut)}</span></td>
    <td class="td-actions">
      <button class="btn-icon" title="Réviser" onclick="openReviewInscription(${i})">👁</button>
    </td>
  `, '📝', 'Aucune inscription', 'Les demandes d\'accès apparaîtront ici');

  renderMobileCards('inscMobileCards', A.inscFiltered, A.inscPage, (r, i) => `
    <div class="m-card">
      <div class="m-card-name">${esc(r.nom||'')}</div>
      <div class="m-card-meta">
        <span>${esc(r.email||'')}</span>
        <span>📍 ${esc(r.infraNom||'—')}</span>
        <span class="status-pill status-${r.statut}">${statutLbl(r.statut)}</span>
      </div>
      <div class="m-card-actions">
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px" onclick="openReviewInscription(${i})">👁 Réviser</button>
      </div>
    </div>
  `);
  renderPagination('inscPag', A.inscFiltered.length, A.inscPage, p => { A.inscPage = p; renderInscriptions(false); });
  updateNotifBadges();
}

function openReviewInscription(idx) {
  const r = A.inscFiltered[idx];
  if (!r) return;
  document.getElementById('reviewModalTitle').textContent = 'Demande d\'inscription — ' + (r.nom || '');

  document.getElementById('reviewModalBody').innerHTML = `
    <div class="review-grid">
      <div class="review-field"><label>Nom</label><div class="rv-val">${esc(r.nom||'—')}</div></div>
      <div class="review-field"><label>Email</label><div class="rv-val">${esc(r.email||'—')}</div></div>
      <div class="review-field"><label>Téléphone</label><div class="rv-val">${esc(r.tel||'—')}</div></div>
      <div class="review-field"><label>Région</label><div class="rv-val">${esc(r.region||'—')}</div></div>
      <div class="review-field review-full"><label>Infrastructure gérée</label><div class="rv-val">${esc(r.infraNom||'—')}</div></div>
      <hr class="review-sep">
      <div class="review-field review-full"><label>Justification</label><div class="rv-val" style="white-space:pre-wrap">${esc(r.justification||'—')}</div></div>
      <div class="review-field"><label>Date de demande</label><div class="rv-val">${fmtDate(r.dateInscription)}</div></div>
      <div class="review-field"><label>Statut actuel</label><div class="rv-val"><span class="status-pill status-${r.statut}">${statutLbl(r.statut)}</span></div></div>
      ${r.noteAdmin ? `<div class="review-field review-full"><label>Note admin précédente</label><div class="rv-val" style="color:var(--red)">${esc(r.noteAdmin)}</div></div>` : ''}
    </div>
    <div class="review-note">
      <label style="font-size:11px;font-weight:700;color:var(--text-sm);text-transform:uppercase;letter-spacing:.05em">Note admin</label>
      <textarea id="reviewNote" placeholder="Commentaire visible par le responsable…">${esc(r.noteAdmin||'')}</textarea>
    </div>
  `;

  const footer = document.getElementById('reviewModalFooter');
  if (r.statut === 'pending') {
    footer.innerHTML = `
      <button class="btn-secondary" onclick="closeReviewModal()">Annuler</button>
      <button class="btn-reject"  onclick="rejectRegistration('${r.id}')">✕ Rejeter</button>
      <button class="btn-approve" onclick="approveRegistration('${r.id}')">✓ Approuver</button>
    `;
  } else {
    footer.innerHTML = `<button class="btn-secondary" onclick="closeReviewModal()">Fermer</button>`;
  }

  document.getElementById('reviewModal').classList.remove('hidden');
}

/* La création du compte responsable est faite par le serveur, dans la
   même transaction que l'approbation : le mot de passe choisi lors de
   l'inscription reste haché et n'est jamais manipulé ici. */
async function reviewRegistration(id, action) {
  const note = document.getElementById('reviewNote')?.value.trim() || '';
  try {
    await CulteAPI.reviewRegistration(id, action, note);
    await refreshStore();
    closeReviewModal();
    renderInscriptions(false);
    updateNotifBadges();
  } catch (err) {
    apiError(err);
  }
}

function approveRegistration(id) { return reviewRegistration(id, 'approve'); }
function rejectRegistration(id)  { return reviewRegistration(id, 'reject'); }

/* ── CONTENUS ────────────────────────────────────────────────────── */
function renderContenus(reset) {
  if (reset) A.contPage = 1;
  const pendings = getPending();
  const search   = document.getElementById('contSearch').value.toLowerCase();
  const type     = document.getElementById('contTypeFilter').value;
  const statut   = document.getElementById('contStatutFilter').value;

  A.contFiltered = pendings.filter(p => {
    if (search && !((p.respNom||'') + (p.infraNom||'')).toLowerCase().includes(search)) return false;
    if (type   && p.type   !== type)   return false;
    if (statut && p.statut !== statut) return false;
    return true;
  }).sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));

  renderTableBody('contTbody', A.contFiltered, A.contPage, (p, i) => `
    <td class="td-name">${esc(p.respNom||'—')}</td>
    <td class="td-name" title="${esc(p.infraNom||'')}">${esc(p.infraNom||'—')}</td>
    <td><span class="type-pill type-${p.type}">${typeLbl(p.type)}</span></td>
    <td>${fmtDate(p.dateSubmit)}</td>
    <td><span class="status-pill status-${p.statut}">${statutLbl(p.statut)}</span></td>
    <td class="td-actions">
      <button class="btn-icon" title="Réviser" onclick="openReviewContent(${i})">👁</button>
    </td>
  `, '✅', 'Aucune soumission', 'Les contenus soumis par les responsables apparaîtront ici');

  renderMobileCards('contMobileCards', A.contFiltered, A.contPage, (p, i) => `
    <div class="m-card">
      <div class="m-card-name">${esc(p.infraNom||'—')}</div>
      <div class="m-card-meta">
        <span>${esc(p.respNom||'—')}</span>
        <span class="type-pill type-${p.type}">${typeLbl(p.type)}</span>
        <span class="status-pill status-${p.statut}">${statutLbl(p.statut)}</span>
      </div>
      <div class="m-card-actions">
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px" onclick="openReviewContent(${i})">👁 Réviser</button>
      </div>
    </div>
  `);
  renderPagination('contPag', A.contFiltered.length, A.contPage, p => { A.contPage = p; renderContenus(false); });
  updateNotifBadges();
}

function openReviewContent(idx) {
  const p = A.contFiltered[idx];
  if (!p) return;
  document.getElementById('reviewModalTitle').textContent = `${typeLbl(p.type)} — ${p.infraNom || ''}`;

  let bodyHtml = `
    <div class="review-grid">
      <div class="review-field"><label>Responsable</label><div class="rv-val">${esc(p.respNom||'—')}</div></div>
      <div class="review-field"><label>Infrastructure</label><div class="rv-val">${esc(p.infraNom||'—')}</div></div>
      <div class="review-field"><label>Type</label><div class="rv-val"><span class="type-pill type-${p.type}">${typeLbl(p.type)}</span></div></div>
      <div class="review-field"><label>Date de soumission</label><div class="rv-val">${fmtDate(p.dateSubmit)}</div></div>
      <hr class="review-sep">
  `;

  const d = p.data || {};
  if (p.type === 'profile') {
    bodyHtml += `
      <div class="review-field review-full"><label>Description</label><div class="rv-val" style="white-space:pre-wrap">${esc(d.description||'—')}</div></div>
      <div class="review-field"><label>Horaires</label><div class="rv-val">${esc(d.horaires||'—')}</div></div>
      <div class="review-field"><label>Téléphone</label><div class="rv-val">${esc(d.telephone||'—')}</div></div>
      <div class="review-field"><label>Email</label><div class="rv-val">${esc(d.email||'—')}</div></div>
      <div class="review-field"><label>Site web</label><div class="rv-val">${esc(d.website||'—')}</div></div>
    `;
  } else if (p.type === 'gallery_add') {
    bodyHtml += `
      <div class="review-field review-full"><label>Caption</label><div class="rv-val">${esc(d.caption||'—')}</div></div>
      <div class="review-field review-full"><label>Photo</label>
        ${safeUrl(d.url) ? `<img src="${safeUrl(d.url)}" class="review-photo" alt="photo">` : '<div class="rv-val">Aucune image</div>'}
      </div>
    `;
  } else if (p.type === 'event') {
    bodyHtml += `
      <div class="review-field review-full"><label>Titre</label><div class="rv-val">${esc(d.titre||'—')}</div></div>
      <div class="review-field"><label>Date début</label><div class="rv-val">${esc(d.dateDebut||'—')}</div></div>
      <div class="review-field"><label>Date fin</label><div class="rv-val">${esc(d.dateFin||'—')}</div></div>
      <div class="review-field"><label>Lieu</label><div class="rv-val">${esc(d.lieu||'—')}</div></div>
      <div class="review-field review-full"><label>Description</label><div class="rv-val" style="white-space:pre-wrap">${esc(d.description||'—')}</div></div>
      ${d.photos?.length ? `<div class="review-field review-full"><label>Photos (${d.photos.length})</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${d.photos.map(ph => `<img src="${safeUrl(ph)}" class="review-photo" style="max-height:120px;max-width:180px" alt="event">`).join('')}</div>
      </div>` : ''}
    `;
  } else if (p.type === 'actu') {
    bodyHtml += `
      <div class="review-field review-full"><label>Titre</label><div class="rv-val">${esc(d.titre||'—')}</div></div>
      <div class="review-field review-full"><label>Contenu</label><div class="rv-val" style="white-space:pre-wrap">${esc(d.contenu||'—')}</div></div>
      ${safeUrl(d.photo) ? `<div class="review-field review-full"><label>Photo</label><img src="${safeUrl(d.photo)}" class="review-photo" alt="actu"></div>` : ''}
    `;
  }

  if (p.noteAdmin) {
    bodyHtml += `<div class="review-field review-full"><label>Note admin précédente</label><div class="rv-val" style="color:var(--red)">${esc(p.noteAdmin)}</div></div>`;
  }
  bodyHtml += `</div>
    <div class="review-note">
      <label style="font-size:11px;font-weight:700;color:var(--text-sm);text-transform:uppercase;letter-spacing:.05em">Note admin</label>
      <textarea id="reviewNote" placeholder="Commentaire visible par le responsable…">${esc(p.noteAdmin||'')}</textarea>
    </div>
  `;

  document.getElementById('reviewModalBody').innerHTML = bodyHtml;

  const footer = document.getElementById('reviewModalFooter');
  if (p.statut === 'pending') {
    footer.innerHTML = `
      <button class="btn-secondary" onclick="closeReviewModal()">Annuler</button>
      <button class="btn-reject"  onclick="rejectContent('${p.id}')">✕ Rejeter</button>
      <button class="btn-approve" onclick="approveContent('${p.id}')">✓ Approuver</button>
    `;
  } else {
    footer.innerHTML = `<button class="btn-secondary" onclick="closeReviewModal()">Fermer</button>`;
  }

  document.getElementById('reviewModal').classList.remove('hidden');
}

/* La fusion dans le contenu publié est faite par le serveur, dans la
   même transaction que le changement de statut : contenu publié et
   statut de la contribution ne peuvent pas diverger. */
async function reviewContent(id, action) {
  const note = document.getElementById('reviewNote')?.value.trim() || '';
  try {
    await CulteAPI.reviewContribution(id, action, note);
    await refreshStore();
    closeReviewModal();
    renderContenus(false);
    updateNotifBadges();
  } catch (err) {
    apiError(err);
  }
}

function approveContent(id) { return reviewContent(id, 'approve'); }
function rejectContent(id)  { return reviewContent(id, 'reject'); }

function closeReviewModal() {
  document.getElementById('reviewModal').classList.add('hidden');
}

/* ── TABLE UTILS ─────────────────────────────────────────────────── */
function renderTableBody(tbodyId, records, page, rowFn, emptyIcon, emptyMsg, emptyHint) {
  const tbody = document.getElementById(tbodyId);
  const cols   = tbody.closest('table')?.querySelectorAll('th').length || 8;
  const start  = (page - 1) * PER_PAGE;
  const slice  = records.slice(start, start + PER_PAGE);
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="${cols}" class="table-empty-row">
      <span class="empty-icon">${emptyIcon || '🔍'}</span>
      <span class="empty-msg">${emptyMsg  || 'Aucun résultat'}</span>
      ${emptyHint ? `<span class="empty-hint">${emptyHint}</span>` : ''}
    </td></tr>`;
    return;
  }
  tbody.innerHTML = slice.map((r, localIdx) => `<tr>${rowFn(r, start + localIdx)}</tr>`).join('');
}

function renderMobileCards(id, records, page, cardFn) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = (page - 1) * PER_PAGE;
  const slice = records.slice(start, start + PER_PAGE);
  el.innerHTML = slice.length ? slice.map((r, li) => cardFn(r, start + li)).join('') :
    `<div style="text-align:center;padding:40px 20px;color:var(--text-sm)">
      <div style="font-size:32px;margin-bottom:8px">🔍</div>
      <div style="font-weight:600;color:var(--text-md)">Aucun résultat</div>
    </div>`;
}

function renderPagination(id, total, current, onPage) {
  const el = document.getElementById(id);
  const pages = Math.ceil(total / PER_PAGE);
  if (pages <= 1) { el.innerHTML = total > 0 ? `<span class="pag-info">${total} résultat${total>1?'s':''}</span>` : ''; return; }
  let html = '';
  if (current > 1) html += `<button class="pg-btn" onclick="(${onPage.toString()})(${current-1})">‹</button>`;
  for (let p = Math.max(1, current-2); p <= Math.min(pages, current+2); p++) {
    html += `<button class="pg-btn${p===current?' active':''}" onclick="(${onPage.toString()})(${p})">${p}</button>`;
  }
  if (current < pages) html += `<button class="pg-btn" onclick="(${onPage.toString()})(${current+1})">›</button>`;
  html += `<span class="pag-info">${total.toLocaleString('fr-FR')} résultat${total>1?'s':''}</span>`;
  el.innerHTML = html;
}

function populateFilter(id, values) {
  const sel = document.getElementById(id);
  const current = sel.value;
  const unique = [...new Set(values.map(v => v.toUpperCase()))].sort();
  sel.innerHTML = `<option value="">${sel.querySelector('option')?.textContent || 'Tous'}</option>` +
    unique.map(v => `<option value="${v}"${v===current?' selected':''}>${v.charAt(0)+v.slice(1).toLowerCase()}</option>`).join('');
}

/* ── EDIT MODAL ──────────────────────────────────────────────────── */
function openEditModal(type, globalIdx) {
  A.editType = type;
  A.editIdx = globalIdx;
  const isAdd = globalIdx === null;
  document.getElementById('editModalTitle').textContent = isAdd ? 'Ajouter' : 'Modifier';

  let rec = {};
  if (!isAdd) {
    const arr = type === 'infra' ? A.infraFiltered : A.formFiltered;
    rec = arr[globalIdx] || {};
  }

  const regions = ['DAKAR','SAINT-LOUIS','THIÈS','DIOURBEL','FATICK','KAOLACK','KAFFRINE',
    'ZIGUINCHOR','KOLDA','SÉDHIOU','TAMBACOUNDA','KÉDOUGOU','LOUGA','MATAM'];
  const regOpts = regions.map(r => `<option value="${r}"${rec.REGION===r?' selected':''}>${r}</option>`).join('');

  if (type === 'infra') {
    document.getElementById('editModalBody').innerHTML = `
      <div class="edit-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label>Désignation *</label>
          <input id="ef-designation" value="${esc(rec.DESIGNATION||'')}" placeholder="Nom de l'infrastructure" required>
        </div>
        <div class="form-group">
          <label>Descriptif / Type</label>
          <input id="ef-descriptif" value="${esc(rec.DESCRIPTIF||'')}" placeholder="ex : Musée, Cinéma…">
        </div>
        <div class="form-group">
          <label>Région</label>
          <select id="ef-region"><option value="">—</option>${regOpts}</select>
        </div>
        <div class="form-group">
          <label>Département</label>
          <input id="ef-dept" value="${esc(rec.DEPARTEMENT||'')}">
        </div>
        <div class="form-group">
          <label>Commune</label>
          <input id="ef-commune" value="${esc(rec.COMMUNE||'')}">
        </div>
        <div class="form-group">
          <label>Localité</label>
          <input id="ef-localite" value="${esc(rec.LOCALITES||'')}">
        </div>
        <div class="form-group">
          <label>Milieu</label>
          <select id="ef-milieu">
            <option value="">—</option>
            <option value="URBAIN"${rec.MILIEU==='URBAIN'?' selected':''}>Urbain</option>
            <option value="RURAL"${rec.MILIEU==='RURAL'?' selected':''}>Rural</option>
          </select>
        </div>
        <div class="form-group">
          <label>Latitude</label>
          <input id="ef-lat" type="number" step="0.000001" value="${rec.LATITUDE||''}">
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input id="ef-lon" type="number" step="0.000001" value="${rec.LONGITUDE||''}">
        </div>
      </div>`;
  } else {
    const branches = ['ARTS','AUDIOVISUEL','INFOGRAPHIE','PEINTURE','SÉRIGRAPHIE','MUSIQUE','THÉÂTRE'];
    const brOpts = branches.map(b => `<option value="${b}"${rec.BRANCHE===b?' selected':''}>${b}</option>`).join('');
    document.getElementById('editModalBody').innerHTML = `
      <div class="edit-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label>Nom de l'établissement *</label>
          <input id="ef-nom" value="${esc(rec.NOM_ETABLISSEMENT||'')}" required>
        </div>
        <div class="form-group">
          <label>Branche</label>
          <select id="ef-branche"><option value="">—</option>${brOpts}</select>
        </div>
        <div class="form-group">
          <label>Région</label>
          <select id="ef-region"><option value="">—</option>${regOpts}</select>
        </div>
        <div class="form-group">
          <label>Département</label>
          <input id="ef-dept" value="${esc(rec.DEPARTEMENT||'')}">
        </div>
        <div class="form-group">
          <label>Commune</label>
          <input id="ef-commune" value="${esc(rec.COMMUNE||'')}">
        </div>
        <div class="form-group">
          <label>Localité</label>
          <input id="ef-localite" value="${esc(rec.LOCALITE||'')}">
        </div>
        <div class="form-group">
          <label>Latitude</label>
          <input id="ef-lat" type="number" step="0.000001" value="${rec.LATITUDE||''}">
        </div>
        <div class="form-group">
          <label>Longitude</label>
          <input id="ef-lon" type="number" step="0.000001" value="${rec.LONGITUDE||''}">
        </div>
      </div>`;
  }

  document.getElementById('btnSaveEdit').onclick = saveEdit;
  document.getElementById('editModal').classList.remove('hidden');
}

function saveEdit() {
  const type = A.editType;
  const isAdd = A.editIdx === null;

  if (type === 'infra') {
    const designation = document.getElementById('ef-designation')?.value.trim();
    if (!designation) { alert('La désignation est requise.'); return; }
    const data = {
      DESIGNATION: designation,
      DESCRIPTIF: document.getElementById('ef-descriptif')?.value.trim() || '',
      REGION: document.getElementById('ef-region')?.value || '',
      DEPARTEMENT: document.getElementById('ef-dept')?.value.trim() || '',
      COMMUNE: document.getElementById('ef-commune')?.value.trim() || '',
      LOCALITES: document.getElementById('ef-localite')?.value.trim() || '',
      MILIEU: document.getElementById('ef-milieu')?.value || '',
      LATITUDE: document.getElementById('ef-lat')?.value || '',
      LONGITUDE: document.getElementById('ef-lon')?.value || '',
    };
    if (isAdd) {
      const newRec = { ...data, _id: 'new_' + Date.now() };
      A.data.infras.push(newRec);
      addLog('add', designation);
    } else {
      const rec = A.infraFiltered[A.editIdx];
      if (rec) {
        A.edits.infras[rec._id] = data;
        addLog('edit', designation);
        persistEdit('infras', rec._id, data, false);
      }
    }
  } else {
    const nom = document.getElementById('ef-nom')?.value.trim();
    if (!nom) { alert('Le nom est requis.'); return; }
    const data = {
      NOM_ETABLISSEMENT: nom,
      BRANCHE: document.getElementById('ef-branche')?.value || '',
      REGION: document.getElementById('ef-region')?.value || '',
      DEPARTEMENT: document.getElementById('ef-dept')?.value.trim() || '',
      COMMUNE: document.getElementById('ef-commune')?.value.trim() || '',
      LOCALITE: document.getElementById('ef-localite')?.value.trim() || '',
      LATITUDE: document.getElementById('ef-lat')?.value || '',
      LONGITUDE: document.getElementById('ef-lon')?.value || '',
    };
    if (isAdd) {
      const newRec = { ...data, _id: 'new_' + Date.now() };
      A.data.forms.push(newRec);
      addLog('add', nom);
    } else {
      const rec = A.formFiltered[A.editIdx];
      if (rec) {
        A.edits.forms[rec._id] = data;
        addLog('edit', nom);
        persistEdit('forms', rec._id, data, false);
      }
    }
  }

  closeEditModal();
  if (type === 'infra') renderInfraTable(false);
  else renderFormTable(false);
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
}

/* ── CONFIRM DELETE ──────────────────────────────────────────────── */
function confirmDelete(type, idx) {
  const arr = type === 'infra' ? A.infraFiltered : A.formFiltered;
  const rec = arr[idx];
  const name = rec?.DESIGNATION || rec?.NOM_ETABLISSEMENT || 'cet élément';
  document.getElementById('confirmMsg').textContent = `Supprimer "${name}" ?`;
  A.confirmFn = () => doDelete(type, idx);
  document.getElementById('btnConfirmDelete').onclick = () => { A.confirmFn?.(); closeConfirm(); };
  document.getElementById('confirmModal').classList.remove('hidden');
}

function doDelete(type, idx) {
  const arr = type === 'infra' ? A.infraFiltered : A.formFiltered;
  const rec = arr[idx];
  if (!rec) return;
  const name = rec.DESIGNATION || rec.NOM_ETABLISSEMENT || '?';
  if (typeof rec._id === 'string' && rec._id.startsWith('new_')) {
    const src = type === 'infra' ? A.data.infras : A.data.forms;
    const i = src.findIndex(r => r._id === rec._id);
    if (i !== -1) src.splice(i, 1);
  } else {
    const dataset = type === 'infra' ? 'infras' : 'forms';
    A.edits.deleted[dataset].push(rec._id);
    persistEdit(dataset, rec._id, {}, true);
  }
  addLog('delete', name);
  if (type === 'infra') renderInfraTable(false);
  else renderFormTable(false);
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.add('hidden');
  A.confirmFn = null;
}

/* ── ADMIN MAP ───────────────────────────────────────────────────── */
function initAdminMap() {
  if (A.adminMap) { refreshAdminMap(); return; }

  A.adminMap = L.map('adminMap', { zoomControl: true, attributionControl: false }).setView([14.5, -14.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(A.adminMap);
  A.adminCluster = L.markerClusterGroup({ maxClusterRadius: 50, showCoverageOnHover: false });
  A.adminMap.addLayer(A.adminCluster);
  A.adminMap.zoomControl.setPosition('bottomright');

  document.querySelectorAll('.map-layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.map-layer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      A.adminLayer = btn.dataset.layer;
      refreshAdminMap();
    });
  });

  setTimeout(() => { A.adminMap.invalidateSize(); refreshAdminMap(); }, 100);
}

function refreshAdminMap() {
  A.adminCluster.clearLayers();
  const layer = A.adminLayer;

  const addMarkers = (records, color, label) => {
    const markers = [];
    records.forEach(rec => {
      const lat = parseFloat(rec.LATITUDE);
      const lon = parseFloat(rec.LONGITUDE);
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;
      const name = rec.DESIGNATION || rec.NOM_ETABLISSEMENT || '—';
      const m = L.circleMarker([lat, lon], {
        radius: 6, fillColor: color, color: 'white', weight: 2, fillOpacity: .85,
      }).bindPopup(`<b>${name}</b><br><small>${rec.COMMUNE||''}, ${rec.REGION||''}</small><br><small>${label}</small>`);
      markers.push(m);
    });
    markers.forEach(m => A.adminCluster.addLayer(m));
  };

  if (layer === 'all' || layer === 'infra') addMarkers(getMergedInfras(), '#0d5fa0', 'Infrastructure');
  if (layer === 'all' || layer === 'form')  addMarkers(getMergedForms(),  '#6a1b9a', 'Formation');
}

/* ── PARAMÈTRES ──────────────────────────────────────────────────── */
function renderParametres() {
  const infraEdits = Object.keys(A.edits.infras).length;
  const formEdits  = Object.keys(A.edits.forms).length;
  const deleted    = A.edits.deleted.infras.length + A.edits.deleted.forms.length;
  const resps      = getResponsables().length;
  const regs       = getRegistrations().length;
  const pends      = getPending().length;
  document.getElementById('settingsStats').innerHTML =
    `<b>${infraEdits}</b> modification(s) d'infrastructures<br>` +
    `<b>${formEdits}</b> modification(s) de formations<br>` +
    `<b>${deleted}</b> suppression(s) locale(s)<br>` +
    `<b>${resps}</b> responsable(s) créé(s)<br>` +
    `<b>${regs}</b> inscription(s) reçue(s)<br>` +
    `<b>${pends}</b> soumission(s) de contenu`;

  const log = document.getElementById('activityLog');
  log.innerHTML = A.log.slice(0, 30).map(item => {
    const ts = new Date(item.ts).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    const lbl = {
      edit: '✏️ Modif.', add: '➕ Ajout', delete: '🗑 Suppression',
      approve_reg: '✓ Inscription approuvée', reject_reg: '✕ Inscription rejetée',
      approve_content: '✓ Contenu approuvé', reject_content: '✕ Contenu rejeté',
    }[item.action] || item.action;
    return `<div class="log-item">${lbl} — <b>${item.name}</b><br><span class="log-time">${ts}</span></div>`;
  }).join('') || '<p style="font-size:13px;color:var(--text-sm)">Aucune activité.</p>';
}

function setupSettingsListeners() {
  document.getElementById('btnSavePwd').addEventListener('click', async () => {
    const current = document.getElementById('currentPwd').value;
    const next    = document.getElementById('newPwd').value;
    const status  = document.getElementById('pwdStatus');

    const show = (msg, ok) => {
      status.textContent = msg;
      status.style.color = ok ? 'var(--ok, #1a7f37)' : 'var(--danger, #c62828)';
      status.classList.remove('hidden');
    };

    if (!current || !next) return show('Renseignez le mot de passe actuel et le nouveau.', false);
    if (next.length < 12)  return show('Le nouveau mot de passe doit faire au moins 12 caractères.', false);

    try {
      await CulteAPI.changePassword(current, next);
      document.getElementById('currentPwd').value = '';
      document.getElementById('newPwd').value = '';
      show('✓ Mot de passe mis à jour.', true);
    } catch (err) {
      show(err.message || 'Échec de la mise à jour.', false);
    }
  });

  document.getElementById('btnExportAll').addEventListener('click', () => {
    const data = {
      infras: getMergedInfras(), forms: getMergedForms(), edits: A.edits, log: A.log,
      responsables: getResponsables(), registrations: getRegistrations(),
      pending: getPending(), siteContent: getSiteContent(),
    };
    downloadJSON(data, 'culte_admin_export_' + dateStr() + '.json');
  });

  document.getElementById('btnClearEdits').addEventListener('click', async () => {
    if (!confirm('Annuler toutes les corrections apportées au jeu de référence ? Les données d\'origine seront restaurées pour tout le monde.')) return;
    try {
      await CulteAPI.clearDatasetEdits();
      await refreshStore();
      alert('Corrections annulées.');
      renderParametres();
      renderInfraTable(true);
      renderFormTable(true);
    } catch (err) {
      apiError(err);
    }
  });
}

/* ── EXPORT CSV ──────────────────────────────────────────────────── */
function exportCSV(type) {
  const isInfra = type === 'infra';
  const records = isInfra ? getMergedInfras() : getMergedForms();
  const cols = isInfra
    ? ['DESIGNATION','DESCRIPTIF','REGION','DEPARTEMENT','COMMUNE','LOCALITES','MILIEU','LATITUDE','LONGITUDE']
    : ['NOM_ETABLISSEMENT','BRANCHE','REGION','DEPARTEMENT','COMMUNE','LOCALITE','LATITUDE','LONGITUDE'];
  const rows = [cols.join(';'), ...records.map(r => cols.map(c => `"${(r[c]||'').toString().replace(/"/g,'""')}"`).join(';'))];
  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (isInfra ? 'infrastructures' : 'formations') + '_' + dateStr() + '.csv';
  a.click(); URL.revokeObjectURL(url);
}

/* ── UTILS ───────────────────────────────────────────────────────── */
const esc = window.escapeHtml;
function dateStr() { return new Date().toISOString().slice(0,10); }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function statutLbl(s) {
  return { pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' }[s] || s;
}
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}
