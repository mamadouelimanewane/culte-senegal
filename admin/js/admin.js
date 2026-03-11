/* ════════════════════════════════════════════════════════════════
   CULTE Admin — Backoffice Logic
   ════════════════════════════════════════════════════════════════ */
'use strict';

/* ── Config ─────────────────────────────────────────────────────── */
const ADMIN_USERS = [
  { email: 'admin@culte.sn', pwd: 'admin2024', name: 'Administrateur' },
];
const LS_EDITS   = 'culte_admin_edits';
const LS_LOG     = 'culte_admin_log';
const LS_SESSION = 'culte_admin_session';
const PER_PAGE   = 20;

/* ── State ───────────────────────────────────────────────────────── */
const A = {
  session: null,
  data: { infras: [], forms: [] },
  edits: { infras: {}, forms: {}, deleted: { infras: [], forms: [] } },
  log: [],
  infraFiltered: [], formFiltered: [],
  infraPage: 1, formPage: 1,
  adminMap: null, adminCluster: null, adminLayer: 'all',
  confirmFn: null,
  editType: null, editIdx: null,
};

/* ── INIT ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadEdits();
  loadLog();

  const sess = sessionStorage.getItem(LS_SESSION);
  if (sess) {
    A.session = JSON.parse(sess);
    showApp();
  }

  // Login form
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pwd   = document.getElementById('loginPwd').value;
    const user  = ADMIN_USERS.find(u => u.email === email && u.pwd === pwd);
    if (user) {
      A.session = { email: user.email, name: user.name };
      sessionStorage.setItem(LS_SESSION, JSON.stringify(A.session));
      showApp();
    } else {
      document.getElementById('loginError').classList.remove('hidden');
    }
  });

  document.getElementById('btnLogout').addEventListener('click', logout);
  document.getElementById('hamburger').addEventListener('click', toggleSidebar);
  document.getElementById('hamburger2').addEventListener('click', toggleSidebar);
  document.getElementById('editModalBackdrop').addEventListener('click', closeEditModal);
  document.getElementById('confirmBackdrop').addEventListener('click', closeConfirm);
});

async function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  document.getElementById('sbUserName').textContent = A.session.name;
  document.getElementById('settingsUser').textContent = A.session.email + ' — ' + A.session.name;
  await loadData();
  setupNav();
  setupTableListeners();
  setupSettingsListeners();
  switchView('dashboard');
}

function logout() {
  sessionStorage.removeItem(LS_SESSION);
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

/* ── PERSISTENCE ─────────────────────────────────────────────────── */
function loadEdits() {
  const raw = localStorage.getItem(LS_EDITS);
  if (raw) A.edits = JSON.parse(raw);
}
function saveEdits() {
  localStorage.setItem(LS_EDITS, JSON.stringify(A.edits));
}
function loadLog() {
  const raw = localStorage.getItem(LS_LOG);
  if (raw) A.log = JSON.parse(raw);
}
function addLog(action, name) {
  A.log.unshift({ action, name, ts: new Date().toISOString() });
  if (A.log.length > 100) A.log.pop();
  localStorage.setItem(LS_LOG, JSON.stringify(A.log));
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
    formations: 'Formations', carte: 'Carte', parametres: 'Paramètres',
  }[name] || name;

  if (name === 'dashboard') renderDashboard();
  if (name === 'infrastructures') renderInfraTable(true);
  if (name === 'formations') renderFormTable(true);
  if (name === 'carte') initAdminMap();
  if (name === 'parametres') renderParametres();
}

/* ── DASHBOARD ───────────────────────────────────────────────────── */
function renderDashboard() {
  const infras = getMergedInfras();
  const forms  = getMergedForms();
  const regions = new Set(infras.map(r => r.REGION).filter(Boolean));
  const editsCount = Object.keys(A.edits.infras).length + Object.keys(A.edits.forms).length;

  // Stats
  document.getElementById('dashStats').innerHTML = [
    { icon: '🏛', num: infras.length.toLocaleString('fr-FR'), lbl: 'Infrastructures', color: '#0d5fa0' },
    { icon: '🎓', num: forms.length.toLocaleString('fr-FR'),  lbl: 'Formations',       color: '#6a1b9a' },
    { icon: '📍', num: regions.size,                          lbl: 'Régions couvertes', color: '#00695c' },
    { icon: '✏️', num: editsCount,                            lbl: 'Modifications locales', color: '#e65100' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-info">
        <div class="stat-num" style="color:${s.color}">${s.num}</div>
        <div class="stat-lbl">${s.lbl}</div>
      </div>
    </div>
  `).join('');

  // Update topbar badge
  document.getElementById('topbarBadge').textContent =
    (infras.length + forms.length).toLocaleString('fr-FR') + ' lieux';

  // Chart: by region
  const regionCounts = {};
  infras.forEach(r => { const k = r.REGION || 'N/A'; regionCounts[k] = (regionCounts[k] || 0) + 1; });
  renderBarChart('chartRegions', regionCounts, 12);

  // Chart: by type
  const typeCounts = {};
  infras.forEach(r => { const k = getInfraType(r); typeCounts[k] = (typeCounts[k] || 0) + 1; });
  renderBarChart('chartTypes', typeCounts, 8);

  // Recent edits
  renderRecentEdits();
}

function renderBarChart(id, counts, limit) {
  const el = document.getElementById(id);
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, limit);
  const max = sorted[0]?.[1] || 1;
  el.innerHTML = sorted.map(([label, count]) => `
    <div class="bar-row">
      <div class="bar-label" title="${label}">${label.charAt(0) + label.slice(1).toLowerCase()}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count/max*100).toFixed(1)}%"></div></div>
      <div class="bar-count">${count}</div>
    </div>
  `).join('');
}

function renderRecentEdits() {
  const el = document.getElementById('recentEdits');
  if (!A.log.length) {
    el.innerHTML = '<p style="font-size:13px;color:#7a9ab8;padding:8px 0">Aucune modification locale.</p>';
    return;
  }
  el.innerHTML = A.log.slice(0, 8).map(item => {
    const ts = new Date(item.ts).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
    const cls = { edit: 'badge-edit', add: 'badge-add', delete: 'badge-del' }[item.action] || 'badge-edit';
    const lbl = { edit: 'Modif.', add: 'Ajout', delete: 'Supprim.' }[item.action] || item.action;
    return `<div class="recent-item">
      <span class="recent-badge ${cls}">${lbl}</span>
      <span class="recent-name">${item.name}</span>
      <span class="recent-date">${ts}</span>
    </div>`;
  }).join('');
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
  // Infras
  let infraTimer;
  document.getElementById('infraSearch').addEventListener('input', () => {
    clearTimeout(infraTimer);
    infraTimer = setTimeout(() => renderInfraTable(true), 250);
  });
  document.getElementById('infraRegionFilter').addEventListener('change', () => renderInfraTable(true));
  document.getElementById('infraTypeFilter').addEventListener('change', () => renderInfraTable(true));
  document.getElementById('btnAddInfra').addEventListener('click', () => openEditModal('infra', null));
  document.getElementById('btnExportInfra').addEventListener('click', () => exportCSV('infra'));

  // Forms
  let formTimer;
  document.getElementById('formSearch').addEventListener('input', () => {
    clearTimeout(formTimer);
    formTimer = setTimeout(() => renderFormTable(true), 250);
  });
  document.getElementById('formRegionFilter').addEventListener('change', () => renderFormTable(true));
  document.getElementById('formBrancheFilter').addEventListener('change', () => renderFormTable(true));
  document.getElementById('btnAddForm').addEventListener('click', () => openEditModal('form', null));
  document.getElementById('btnExportForm').addEventListener('click', () => exportCSV('form'));
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
    <td class="td-name" title="${r.DESIGNATION||''}">${r.DESIGNATION||'Sans nom'}</td>
    <td><span class="badge-type">${getInfraType(r)}</span></td>
    <td>${r.REGION||'—'}</td>
    <td>${r.COMMUNE||'—'}</td>
    <td>${r.MILIEU||'—'}</td>
    <td class="td-actions">
      <button class="btn-icon" title="Modifier" onclick="openEditModal('infra',${i})">✏️</button>
      <button class="btn-icon" title="Supprimer" onclick="confirmDelete('infra',${i})">🗑</button>
    </td>
  `);
  renderMobileCards('infraMobileCards', A.infraFiltered, A.infraPage, (r, i) => `
    <div class="m-card">
      <div class="m-card-name">${r.DESIGNATION||'Sans nom'}</div>
      <div class="m-card-meta">
        <span>${getInfraType(r)}</span><span>📍 ${r.COMMUNE||'—'}, ${r.REGION||'—'}</span>
        ${r.MILIEU ? `<span>${r.MILIEU}</span>` : ''}
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
    <td class="td-name" title="${r.NOM_ETABLISSEMENT||''}">${r.NOM_ETABLISSEMENT||'Sans nom'}</td>
    <td><span class="badge-type" style="background:#f3e5f5;color:#6a1b9a">${r.BRANCHE||'—'}</span></td>
    <td>${r.REGION||'—'}</td>
    <td>${r.COMMUNE||'—'}</td>
    <td class="td-actions">
      <button class="btn-icon" title="Modifier" onclick="openEditModal('form',${i})">✏️</button>
      <button class="btn-icon" title="Supprimer" onclick="confirmDelete('form',${i})">🗑</button>
    </td>
  `);
  renderMobileCards('formMobileCards', A.formFiltered, A.formPage, (r, i) => `
    <div class="m-card">
      <div class="m-card-name">${r.NOM_ETABLISSEMENT||'Sans nom'}</div>
      <div class="m-card-meta">
        <span>${r.BRANCHE||'—'}</span><span>📍 ${r.COMMUNE||'—'}, ${r.REGION||'—'}</span>
      </div>
      <div class="m-card-actions">
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px" onclick="openEditModal('form',${i})">✏️ Modifier</button>
        <button class="btn-secondary" style="font-size:12px;padding:6px 10px;color:var(--red)" onclick="confirmDelete('form',${i})">🗑 Supprimer</button>
      </div>
    </div>
  `);
  renderPagination('formPag', A.formFiltered.length, A.formPage, p => { A.formPage = p; renderFormTable(false); });
}

function renderTableBody(tbodyId, records, page, rowFn) {
  const tbody = document.getElementById(tbodyId);
  const start = (page - 1) * PER_PAGE;
  const slice = records.slice(start, start + PER_PAGE);
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-sm)">Aucun résultat</td></tr>`;
    return;
  }
  tbody.innerHTML = slice.map((r, localIdx) => {
    const globalIdx = start + localIdx;
    return `<tr>${rowFn(r, globalIdx)}</tr>`;
  }).join('');
}

function renderMobileCards(id, records, page, cardFn) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = (page - 1) * PER_PAGE;
  const slice = records.slice(start, start + PER_PAGE);
  el.innerHTML = slice.length ? slice.map((r, li) => cardFn(r, start + li)).join('') :
    '<p style="font-size:13px;color:var(--text-sm);padding:16px 0">Aucun résultat</p>';
}

function renderPagination(id, total, current, onPage) {
  const el = document.getElementById(id);
  const pages = Math.ceil(total / PER_PAGE);
  if (pages <= 1) { el.innerHTML = ''; return; }
  let html = '';
  if (current > 1) html += `<button class="pg-btn" onclick="(${onPage.toString()})(${current-1})">‹</button>`;
  for (let p = Math.max(1, current-2); p <= Math.min(pages, current+2); p++) {
    html += `<button class="pg-btn${p===current?' active':''}" onclick="(${onPage.toString()})(${p})">${p}</button>`;
  }
  if (current < pages) html += `<button class="pg-btn" onclick="(${onPage.toString()})(${current+1})">›</button>`;
  html += `<span style="font-size:12px;color:var(--text-sm);margin-left:8px">${total} résultats</span>`;
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
      if (rec) { A.edits.infras[rec._id] = data; addLog('edit', designation); }
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
      if (rec) { A.edits.forms[rec._id] = data; addLog('edit', nom); }
    }
  }

  saveEdits();
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
    // Remove from local array
    const src = type === 'infra' ? A.data.infras : A.data.forms;
    const i = src.findIndex(r => r._id === rec._id);
    if (i !== -1) src.splice(i, 1);
  } else {
    A.edits.deleted[type === 'infra' ? 'infras' : 'forms'].push(rec._id);
  }
  addLog('delete', name);
  saveEdits();
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
  document.getElementById('settingsStats').innerHTML =
    `<b>${infraEdits}</b> modification(s) d'infrastructures<br>` +
    `<b>${formEdits}</b> modification(s) de formations<br>` +
    `<b>${deleted}</b> suppression(s) locale(s)`;

  const log = document.getElementById('activityLog');
  log.innerHTML = A.log.slice(0, 30).map(item => {
    const ts = new Date(item.ts).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    const lbl = { edit: '✏️ Modif.', add: '➕ Ajout', delete: '🗑 Suppression' }[item.action] || item.action;
    return `<div class="log-item">${lbl} — <b>${item.name}</b><br><span class="log-time">${ts}</span></div>`;
  }).join('') || '<p style="font-size:13px;color:var(--text-sm)">Aucune activité.</p>';
}

function setupSettingsListeners() {
  document.getElementById('btnSavePwd').addEventListener('click', () => {
    const pwd = document.getElementById('newPwd').value;
    if (!pwd) return;
    const user = ADMIN_USERS.find(u => u.email === A.session.email);
    if (user) { user.pwd = pwd; alert('Mot de passe mis à jour (session uniquement).'); }
    document.getElementById('newPwd').value = '';
  });

  document.getElementById('btnExportAll').addEventListener('click', () => {
    const data = { infras: getMergedInfras(), forms: getMergedForms(), edits: A.edits, log: A.log };
    downloadJSON(data, 'culte_admin_export_' + dateStr() + '.json');
  });

  document.getElementById('btnClearEdits').addEventListener('click', () => {
    if (!confirm('Effacer toutes les modifications locales ? Les données JSON d\'origine seront restaurées.')) return;
    A.edits = { infras: {}, forms: {}, deleted: { infras: [], forms: [] } };
    saveEdits();
    alert('Modifications locales effacées.');
    renderParametres();
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
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function dateStr() { return new Date().toISOString().slice(0,10); }
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}
