/* ════════════════════════════════════════════════════════════════
   CULTE — Espace Responsable Logic
   ════════════════════════════════════════════════════════════════ */
'use strict';

/* ── Storage Keys ────────────────────────────────────────────────── */
const LS_SESSION = 'culte_resp_session';
const LS_REG     = 'culte_registrations';
const LS_RESP    = 'culte_responsables';
const LS_PENDING = 'culte_pending';
const LS_CONTENT = 'culte_site_content';

/* ── State ───────────────────────────────────────────────────────── */
const R = {
  session: null,      // logged-in responsable
  infraData: [],      // all infrastructures (from JSON)
  infraRec: null,     // the responsable's infrastructure record
};

/* ── INIT ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Load infra data for the registration search
  try {
    const res = await fetch('../infrastructures_culturelles.json');
    const j   = await res.json();
    R.infraData = (j.sheets?.INFRASTRUCTURES_CULTURELLES?.records || []).map((r, i) => ({ ...r, _id: i }));
  } catch (e) {
    console.error('Erreur chargement JSON:', e);
  }

  // Check session
  const sess = sessionStorage.getItem(LS_SESSION);
  if (sess) {
    R.session = JSON.parse(sess);
    showApp();
    return;
  }

  // Login
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pwd   = document.getElementById('loginPwd').value;
    const resps = getResponsables();
    const resp  = resps.find(r => r.email === email && r.pwd === pwd && r.statut === 'active');
    const errEl = document.getElementById('loginError');
    if (resp) {
      R.session = { id: resp.id, nom: resp.nom, email: resp.email, infraId: resp.infraId, infraNom: resp.infraNom };
      sessionStorage.setItem(LS_SESSION, JSON.stringify(R.session));
      showApp();
    } else {
      const pending = getRegistrations().find(r => r.email === email);
      if (pending && pending.statut === 'pending') {
        errEl.textContent = 'Votre demande est en cours de validation. Merci de patienter.';
      } else if (pending && pending.statut === 'rejected') {
        errEl.textContent = 'Votre demande a été refusée. Contactez l\'administration pour plus d\'informations.';
      } else {
        errEl.textContent = 'Identifiants incorrects ou compte non approuvé.';
      }
      errEl.classList.remove('hidden');
    }
  });

  // Register modal
  document.getElementById('btnShowRegister').addEventListener('click', openRegisterModal);
  document.getElementById('registerBackdrop').addEventListener('click', closeRegisterModal);
  document.getElementById('btnSubmitRegister').addEventListener('click', submitRegistration);
  setupInfraSearch();
});

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('respApp').classList.remove('hidden');

  // Find infra record
  R.infraRec = R.infraData[R.session.infraId] || null;

  // Update sidebar
  document.getElementById('sbSiteName').textContent  = R.session.infraNom || 'Mon site';
  document.getElementById('sbUserName').textContent   = R.session.nom || R.session.email;
  const siteUrl = `../site/?id=${R.session.infraId}`;
  document.getElementById('sbSiteLink').href      = siteUrl;
  document.getElementById('topbarSiteLink').href  = siteUrl;

  // Nav
  document.querySelectorAll('.sb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      switchView(btn.dataset.view);
    });
  });
  // Mobile bottom nav
  document.querySelectorAll('.mbn-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.getElementById('btnLogout').addEventListener('click', () => {
    sessionStorage.removeItem(LS_SESSION);
    location.reload();
  });
  document.getElementById('hamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('hamburger2').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

  setupFormListeners();
  switchView('dashboard');
}

/* ── NAVIGATION ──────────────────────────────────────────────────── */
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sb-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.mbn-btn').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.getElementById('view-' + name)?.classList.add('active');
  document.getElementById('topbarTitle').textContent = {
    dashboard: 'Tableau de bord', profil: 'Profil du site',
    galerie: 'Galerie photos', evenements: 'Événements', actualites: 'Actualités',
  }[name] || name;

  if (name === 'dashboard')  renderDashboard();
  if (name === 'profil')     renderProfil();
  if (name === 'galerie')    renderGalerie();
  if (name === 'evenements') renderEvenements();
  if (name === 'actualites') renderActualites();
}

/* ── DASHBOARD ───────────────────────────────────────────────────── */
function renderDashboard() {
  const rec = R.infraRec;
  const hero = document.getElementById('infraHero');
  if (rec) {
    const type = getInfraType(rec);
    const commune = rec.COMMUNE || '';
    const region  = rec.REGION  || '';
    hero.innerHTML = `
      <div class="hero-badge">${type}</div>
      <div class="hero-name">${esc(rec.DESIGNATION || R.session.infraNom)}</div>
      <div class="hero-loc">📍 ${[commune, region].filter(Boolean).join(', ')}</div>
      <div class="hero-actions">
        <button class="hero-btn hero-btn-primary" onclick="switchView('profil')">✏️ Modifier le profil</button>
        <a class="hero-btn hero-btn-secondary" href="../site/?id=${R.session.infraId}" target="_blank">🌐 Voir la page publique</a>
      </div>
    `;
  } else {
    hero.innerHTML = `<div class="hero-name">${esc(R.session.infraNom)}</div>`;
  }

  // Stats
  const myPending = getMyPending();
  const content   = getSiteContent()[String(R.session.infraId)] || {};
  const galCount  = (content.gallery || []).length;
  const evCount   = (content.events  || []).length;
  const acCount   = (content.actus   || []).length;
  const pendCount = myPending.filter(p => p.statut === 'pending').length;

  document.getElementById('dashStats').innerHTML = [
    { icon: '🖼', num: galCount,  lbl: 'Photos publiées',    color: '#0d5fa0' },
    { icon: '📅', num: evCount,   lbl: 'Événements publiés', color: '#1a6b3e' },
    { icon: '📰', num: acCount,   lbl: 'Actualités publiées', color: '#6a1b9a' },
    { icon: '⏳', num: pendCount, lbl: 'En attente de validation', color: '#e65100' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-info">
        <div class="stat-num" style="color:${s.color}">${s.num}</div>
        <div class="stat-lbl">${s.lbl}</div>
      </div>
    </div>
  `).join('');

  // Recent submissions
  const recent = document.getElementById('recentSubmissions');
  const all    = myPending.slice(0, 8);
  if (!all.length) {
    recent.innerHTML = '<p style="font-size:13px;color:#7a9ab8;padding:8px 0">Aucune soumission pour l\'instant.</p>';
    return;
  }
  recent.innerHTML = all.map(p => {
    const d = new Date(p.dateSubmit).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' });
    const badgeCls = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[p.statut] || 'badge-pending';
    const statusLbl = { pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' }[p.statut] || '';
    const title = p.data?.titre || p.data?.caption || typeLbl(p.type);
    return `<div class="recent-item">
      <span class="recent-badge ${badgeCls}">${statusLbl}</span>
      <span class="recent-name">${esc(typeLbl(p.type))} — ${esc(title)}</span>
      <span class="recent-date">${d}</span>
    </div>` +
    (p.statut === 'rejected' && p.noteAdmin ? `<div style="font-size:12px;color:var(--red);padding:4px 0 8px 86px;font-style:italic">💬 ${esc(p.noteAdmin)}</div>` : '');
  }).join('');
}

/* ── PROFIL ──────────────────────────────────────────────────────── */
function renderProfil() {
  const content = getSiteContent()[String(R.session.infraId)] || {};
  document.getElementById('pf-description').value = content.description || '';
  document.getElementById('pf-horaires').value    = content.horaires    || '';
  document.getElementById('pf-telephone').value   = content.telephone   || '';
  document.getElementById('pf-email').value       = content.email       || '';
  document.getElementById('pf-website').value     = content.website     || '';
}

/* ── GALERIE ─────────────────────────────────────────────────────── */
function renderGalerie() {
  const myPending = getMyPending().filter(p => p.type === 'gallery_add');
  const content   = getSiteContent()[String(R.session.infraId)] || {};
  const published = content.gallery || [];

  const container = document.getElementById('galList');
  if (!myPending.length && !published.length) {
    container.innerHTML = '<p style="font-size:13px;color:#7a9ab8;padding:8px 0">Aucune photo pour l\'instant.</p>';
    return;
  }

  container.innerHTML = [
    ...published.map(ph => `
      <div class="gal-item">
        <img src="${ph.url}" alt="${esc(ph.caption||'')}">
        <div class="gal-caption">${esc(ph.caption||'')}</div>
        <span class="gal-badge badge-approved">✓ Publiée</span>
      </div>
    `),
    ...myPending.filter(p => p.statut !== 'approved').map(p => `
      <div class="gal-item" style="opacity:.7">
        <img src="${p.data.url}" alt="${esc(p.data.caption||'')}">
        <div class="gal-caption">${esc(p.data.caption||'')}</div>
        <span class="gal-badge ${p.statut === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${p.statut === 'rejected' ? '✕ Refusée' : '⏳ En attente'}</span>
      </div>
    `),
  ].join('');
}

/* ── ÉVÉNEMENTS ──────────────────────────────────────────────────── */
function renderEvenements() {
  const myPending = getMyPending().filter(p => p.type === 'event');
  const content   = getSiteContent()[String(R.session.infraId)] || {};
  const published = content.events || [];
  const container = document.getElementById('evList');

  const all = [
    ...published.map(ev => ({ ...ev, statut: 'approved' })),
    ...myPending.filter(p => p.statut !== 'approved').map(p => ({ ...p.data, id: p.id, statut: p.statut, noteAdmin: p.noteAdmin })),
  ].sort((a, b) => new Date(b.dateDebut || 0) - new Date(a.dateDebut || 0));

  if (!all.length) {
    container.innerHTML = '<p style="font-size:13px;color:#7a9ab8;padding:8px 0">Aucun événement pour l\'instant.</p>';
    return;
  }
  container.innerHTML = all.map(ev => `
    <div class="submission-card ${ev.statut}">
      <div style="flex:1">
        <div class="sub-title">${esc(ev.titre||'Sans titre')}</div>
        <div class="sub-meta">${ev.dateDebut ? fmtDate(ev.dateDebut) : ''}${ev.dateFin ? ' → ' + fmtDate(ev.dateFin) : ''}${ev.lieu ? ' · ' + esc(ev.lieu) : ''}</div>
        ${ev.noteAdmin && ev.statut === 'rejected' ? `<div class="sub-note">💬 ${esc(ev.noteAdmin)}</div>` : ''}
      </div>
      <span class="sub-status badge-${ev.statut}">${statutLbl(ev.statut)}</span>
    </div>
  `).join('');
}

/* ── ACTUALITÉS ──────────────────────────────────────────────────── */
function renderActualites() {
  const myPending = getMyPending().filter(p => p.type === 'actu');
  const content   = getSiteContent()[String(R.session.infraId)] || {};
  const published = content.actus || [];
  const container = document.getElementById('acList');

  const all = [
    ...published.map(ac => ({ ...ac, statut: 'approved' })),
    ...myPending.filter(p => p.statut !== 'approved').map(p => ({ ...p.data, id: p.id, statut: p.statut, noteAdmin: p.noteAdmin, date: p.dateSubmit })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (!all.length) {
    container.innerHTML = '<p style="font-size:13px;color:#7a9ab8;padding:8px 0">Aucune actualité pour l\'instant.</p>';
    return;
  }
  container.innerHTML = all.map(ac => `
    <div class="submission-card ${ac.statut}">
      <div style="flex:1">
        <div class="sub-title">${esc(ac.titre||'Sans titre')}</div>
        <div class="sub-meta">${fmtDate(ac.date)}</div>
        ${ac.noteAdmin && ac.statut === 'rejected' ? `<div class="sub-note">💬 ${esc(ac.noteAdmin)}</div>` : ''}
      </div>
      <span class="sub-status badge-${ac.statut}">${statutLbl(ac.statut)}</span>
    </div>
  `).join('');
}

/* ── FORM LISTENERS ──────────────────────────────────────────────── */
function setupFormListeners() {
  // Profil
  document.getElementById('btnSubmitProfil').addEventListener('click', submitProfil);

  // Galerie — photo preview
  document.getElementById('gal-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    resizeAndPreview(file, 'gal-preview', 1200, 900);
  });
  document.getElementById('btnSubmitGalerie').addEventListener('click', submitGalerie);

  // Événements — multiple photos
  document.getElementById('ev-photos').addEventListener('change', e => {
    const files = [...e.target.files].slice(0, 3);
    const container = document.getElementById('ev-previews');
    container.innerHTML = '';
    files.forEach(f => {
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = ev => { img.src = ev.target.result; };
      reader.readAsDataURL(f);
      container.appendChild(img);
    });
  });
  document.getElementById('btnSubmitEvent').addEventListener('click', submitEvent);

  // Actualités
  document.getElementById('ac-photo').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    resizeAndPreview(file, 'ac-preview', 800, 600);
  });
  document.getElementById('btnSubmitActu').addEventListener('click', submitActu);
}

function resizeAndPreview(file, previewId, maxW, maxH) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxW) { h = h * maxW / w; w = maxW; }
      if (h > maxH) { w = w * maxH / h; h = maxH; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const container = document.getElementById(previewId);
      container.innerHTML = `<img src="${dataUrl}" alt="preview">`;
      container.classList.remove('hidden');
      container.dataset.url = dataUrl;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function submitProfil() {
  const data = {
    description: document.getElementById('pf-description').value.trim(),
    horaires:    document.getElementById('pf-horaires').value.trim(),
    telephone:   document.getElementById('pf-telephone').value.trim(),
    email:       document.getElementById('pf-email').value.trim(),
    website:     document.getElementById('pf-website').value.trim(),
  };
  if (!data.description && !data.horaires && !data.telephone) {
    showStatus('profilStatus', 'err', 'Remplissez au moins un champ avant d\'envoyer.');
    return;
  }
  submitPending('profile', data);
  showStatus('profilStatus', 'ok', '✓ Profil envoyé pour validation. Vous serez notifié par l\'équipe.');
}

function submitGalerie() {
  const preview = document.getElementById('gal-preview');
  const url     = preview.dataset.url;
  const caption = document.getElementById('gal-caption').value.trim();
  if (!url) {
    showStatus('galStatus', 'err', 'Veuillez sélectionner une photo.');
    return;
  }
  submitPending('gallery_add', { url, caption });
  showStatus('galStatus', 'ok', '✓ Photo envoyée pour validation.');
  document.getElementById('gal-file').value = '';
  document.getElementById('gal-caption').value = '';
  preview.innerHTML = '';
  preview.classList.add('hidden');
  delete preview.dataset.url;
  renderGalerie();
}

async function submitEvent() {
  const titre    = document.getElementById('ev-titre').value.trim();
  const dateDebut = document.getElementById('ev-dateDebut').value;
  if (!titre || !dateDebut) {
    showStatus('evStatus', 'err', 'Le titre et la date de début sont requis.');
    return;
  }
  // Collect photos
  const files    = [...document.getElementById('ev-photos').files].slice(0, 3);
  const photos   = [];
  for (const f of files) {
    const url = await fileToDataUrl(f, 800, 600);
    photos.push(url);
  }
  const data = {
    titre,
    dateDebut,
    dateFin:     document.getElementById('ev-dateFin').value,
    lieu:        document.getElementById('ev-lieu').value.trim(),
    description: document.getElementById('ev-description').value.trim(),
    photos,
  };
  submitPending('event', data);
  showStatus('evStatus', 'ok', '✓ Événement envoyé pour validation.');
  ['ev-titre','ev-dateDebut','ev-dateFin','ev-lieu','ev-description'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('ev-photos').value = '';
  document.getElementById('ev-previews').innerHTML = '';
  renderEvenements();
}

async function submitActu() {
  const titre  = document.getElementById('ac-titre').value.trim();
  const contenu = document.getElementById('ac-contenu').value.trim();
  if (!titre || !contenu) {
    showStatus('acStatus', 'err', 'Le titre et le contenu sont requis.');
    return;
  }
  const preview = document.getElementById('ac-preview');
  const photo   = preview.dataset.url || '';
  submitPending('actu', { titre, contenu, photo });
  showStatus('acStatus', 'ok', '✓ Actualité envoyée pour validation.');
  document.getElementById('ac-titre').value = '';
  document.getElementById('ac-contenu').value = '';
  document.getElementById('ac-photo').value = '';
  preview.innerHTML = '';
  preview.classList.add('hidden');
  delete preview.dataset.url;
  renderActualites();
}

function submitPending(type, data) {
  const pendings = getPending();
  pendings.push({
    id: 'pend_' + Date.now(),
    respId: R.session.id,
    respNom: R.session.nom,
    infraId: R.session.infraId,
    infraNom: R.session.infraNom,
    type,
    data,
    statut: 'pending',
    dateSubmit: new Date().toISOString(),
    noteAdmin: '',
  });
  savePending(pendings);
}

function showStatus(id, type, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'submit-status ' + type;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}

function fileToDataUrl(file, maxW, maxH) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * maxW / w; w = maxW; }
        if (h > maxH) { w = w * maxH / h; h = maxH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ── REGISTRATION ────────────────────────────────────────────────── */
let allInfras = [];

function setupInfraSearch() {
  const input    = document.getElementById('reg-infraSearch');
  const dropdown = document.getElementById('reg-infraDropdown');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { dropdown.classList.add('hidden'); return; }
    const matches = R.infraData
      .filter(r => (r.DESIGNATION || '').toLowerCase().includes(q))
      .slice(0, 12);
    if (!matches.length) { dropdown.classList.add('hidden'); return; }
    dropdown.innerHTML = matches.map(r => `
      <div class="infra-option" onclick="selectInfra(${r._id}, '${esc(r.DESIGNATION||'')}', '${esc(r.REGION||'')}')">
        <div class="opt-name">${esc(r.DESIGNATION||'')}</div>
        <div class="opt-meta">📍 ${esc(r.COMMUNE||'')}, ${esc(r.REGION||'')}</div>
      </div>
    `).join('');
    dropdown.classList.remove('hidden');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

function selectInfra(id, nom, region) {
  document.getElementById('reg-infraId').value     = id;
  document.getElementById('reg-infraNom').value    = nom;
  document.getElementById('reg-infraRegion').value = region;
  document.getElementById('reg-infraSearch').value = nom;
  document.getElementById('reg-infraDropdown').classList.add('hidden');

  const sel = document.getElementById('reg-infraSelected');
  sel.textContent = `✓ Sélectionné : ${nom} (${region})`;
  sel.classList.remove('hidden');
}

function openRegisterModal() {
  document.getElementById('registerModal').classList.remove('hidden');
}
function closeRegisterModal() {
  document.getElementById('registerModal').classList.add('hidden');
}

function submitRegistration() {
  const nom      = document.getElementById('reg-nom').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const tel      = document.getElementById('reg-tel').value.trim();
  const pwd      = document.getElementById('reg-pwd').value;
  const infraId  = document.getElementById('reg-infraId').value;
  const infraNom = document.getElementById('reg-infraNom').value;
  const region   = document.getElementById('reg-infraRegion').value;
  const justif   = document.getElementById('reg-justif').value.trim();

  if (!nom || !email || !pwd || !infraId || !justif) {
    alert('Veuillez remplir tous les champs obligatoires (*).');
    return;
  }
  if (pwd.length < 6) {
    alert('Le mot de passe doit contenir au moins 6 caractères.');
    return;
  }

  // Check duplicate
  const existing = getRegistrations().find(r => r.email === email);
  if (existing) {
    const lbls = { pending: 'en cours d\'examen', approved: 'déjà approuvée', rejected: 'refusée' };
    alert(`Une demande avec cet email est ${lbls[existing.statut] || 'existante'}. Contactez l\'administration si nécessaire.`);
    return;
  }
  const existingResp = getResponsables().find(r => r.email === email);
  if (existingResp) {
    alert('Cet email est déjà utilisé par un responsable. Connectez-vous directement.');
    return;
  }

  const regs = getRegistrations();
  regs.push({
    id: 'reg_' + Date.now(),
    nom, email, tel, pwd,
    infraId: parseInt(infraId),
    infraNom, region, justification: justif,
    statut: 'pending',
    dateInscription: new Date().toISOString(),
    noteAdmin: '',
  });
  saveRegistrations(regs);

  closeRegisterModal();
  document.getElementById('loginError').textContent = '✓ Demande envoyée ! Notre équipe l\'examinera et vous contactera par email.';
  document.getElementById('loginError').style.background = '#d1e7dd';
  document.getElementById('loginError').style.color = '#0f5132';
  document.getElementById('loginError').classList.remove('hidden');
}

/* ── localStorage Helpers ────────────────────────────────────────── */
function getRegistrations() { return JSON.parse(localStorage.getItem(LS_REG) || '[]'); }
function saveRegistrations(a) { localStorage.setItem(LS_REG, JSON.stringify(a)); }
function getResponsables()   { return JSON.parse(localStorage.getItem(LS_RESP) || '[]'); }
function getPending()        { return JSON.parse(localStorage.getItem(LS_PENDING) || '[]'); }
function savePending(a)      { localStorage.setItem(LS_PENDING, JSON.stringify(a)); }
function getSiteContent()    { return JSON.parse(localStorage.getItem(LS_CONTENT) || '{}'); }
function getMyPending() {
  return getPending().filter(p => p.respId === R.session.id || p.infraId === R.session.infraId)
    .sort((a, b) => new Date(b.dateSubmit) - new Date(a.dateSubmit));
}

/* ── Utils ───────────────────────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function statutLbl(s) {
  return { pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' }[s] || s;
}
function typeLbl(type) {
  return { profile: 'Profil', gallery_add: 'Photo', event: 'Événement', actu: 'Actualité' }[type] || type;
}
function getInfraType(rec) {
  const d = (rec.DESCRIPTIF || '').trim().toLowerCase();
  const types = ['centre culturel','cinéma','galerie','musée','foyer des femmes','foyer des jeunes',
    'salle de spectacle','salle des fêtes','bibliothèque','village artisanal','maison de la culture'];
  for (const t of types) { if (d.includes(t)) return t.charAt(0).toUpperCase() + t.slice(1); }
  return rec.DESCRIPTIF || '📍';
}
