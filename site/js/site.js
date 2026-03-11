/* ════════════════════════════════════════════════════════════════
   CULTE — Page Publique de Site Culturel
   ════════════════════════════════════════════════════════════════ */
'use strict';

const LS_CONTENT = 'culte_site_content';

/* ── Init ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // Parse ?id= from URL
  const params = new URLSearchParams(location.search);
  const idStr  = params.get('id');
  const id     = parseInt(idStr, 10);

  if (idStr === null || isNaN(id)) {
    showError();
    return;
  }

  // Load infrastructure JSON
  let rec = null;
  try {
    const res = await fetch('../infrastructures_culturelles.json');
    const j   = await res.json();
    const recs = j.sheets?.INFRASTRUCTURES_CULTURELLES?.records || [];
    rec = recs[id] || null;
  } catch (e) {
    console.error('Fetch error:', e);
  }

  if (!rec) {
    showError();
    return;
  }

  // Load published content from localStorage
  const allContent = JSON.parse(localStorage.getItem(LS_CONTENT) || '{}');
  const content    = allContent[String(id)] || {};

  // Render page
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('sitePage').classList.remove('hidden');

  renderPage(rec, content);
});

/* ── Render ──────────────────────────────────────────────────────── */
function renderPage(rec, content) {
  const name    = rec.DESIGNATION || '—';
  const type    = getInfraType(rec);
  const commune = rec.COMMUNE  || '';
  const dept    = rec.DEPARTEMENT || '';
  const region  = rec.REGION   || '';
  const lat     = parseFloat(rec.LATITUDE);
  const lon     = parseFloat(rec.LONGITUDE);
  const hasCoords = !isNaN(lat) && !isNaN(lon) && lat && lon;

  // Meta
  document.title = name + ' — Culte Culture Sénégal';
  document.getElementById('metaDesc').content = `${type} à ${commune}, ${region} — Sénégal`;

  // Hero
  const hero = document.getElementById('siteHero');
  hero.style.background = `linear-gradient(135deg, ${typeColor(rec)}, #00b4d8)`;
  document.getElementById('heroBadge').textContent  = typeIcon(rec) + ' ' + type;
  document.getElementById('heroTitle').textContent  = name;
  document.getElementById('heroLoc').textContent    = [commune, dept, region].filter(Boolean).join(' › ');

  // About
  const aboutEl = document.getElementById('aboutContent');
  if (content.description) {
    aboutEl.textContent = content.description;
  } else {
    aboutEl.innerHTML = '<p class="empty-state">Aucune description disponible pour le moment.</p>';
  }

  // Gallery
  renderGallery(content.gallery || []);

  // Events
  renderEvents(content.events || []);

  // Actus
  renderActus(content.actus || []);

  // Contact
  renderContact(rec, content);

  // Map
  if (hasCoords) {
    renderMap(lat, lon, name);
  } else {
    document.getElementById('siteMap').innerHTML = '<p class="empty-state" style="padding:20px">Coordonnées GPS non disponibles.</p>';
  }
}

/* ── Gallery ─────────────────────────────────────────────────────── */
function renderGallery(photos) {
  const el = document.getElementById('galerieContent');
  if (!photos.length) {
    el.innerHTML = '<p class="empty-state">Aucune photo publiée pour le moment.</p>';
    return;
  }
  el.innerHTML = photos.map((ph, i) => `
    <div class="gallery-item" onclick="openLightbox(${i})">
      <img src="${ph.url}" alt="${esc(ph.caption||'')}" loading="lazy">
      ${ph.caption ? `<div class="gallery-caption">${esc(ph.caption)}</div>` : ''}
    </div>
  `).join('');

  // Store for lightbox
  window._galleryPhotos = photos;
}

/* ── Events ──────────────────────────────────────────────────────── */
let _showPast = false;
function renderEvents(events) {
  const el = document.getElementById('evContent');
  if (!events.length) {
    el.innerHTML = '<p class="empty-state">Aucun événement publié pour le moment.</p>';
    return;
  }

  const now = new Date();
  const upcoming = events.filter(ev => !ev.dateDebut || new Date(ev.dateDebut) >= now || (ev.dateFin && new Date(ev.dateFin) >= now));
  const past     = events.filter(ev => ev.dateDebut && new Date(ev.dateDebut) < now && (!ev.dateFin || new Date(ev.dateFin) < now));

  const showList = _showPast ? past : (upcoming.length ? upcoming : past);
  const html = `
    <div class="events-tabs">
      <button class="events-tab${!_showPast?' active':''}" onclick="toggleEventTab(false)">À venir (${upcoming.length})</button>
      <button class="events-tab${_showPast?' active':''}" onclick="toggleEventTab(true)">Passés (${past.length})</button>
    </div>
    ${showList.length ? showList.map(ev => renderEventCard(ev, _showPast)).join('') :
      `<p class="empty-state">${_showPast ? 'Aucun événement passé.' : 'Aucun événement à venir pour le moment.'}</p>`
    }
  `;
  el.innerHTML = html;
}

function toggleEventTab(past) {
  _showPast = past;
  const allContent = JSON.parse(localStorage.getItem(LS_CONTENT) || '{}');
  const params = new URLSearchParams(location.search);
  const content = allContent[params.get('id')] || {};
  renderEvents(content.events || []);
}

function renderEventCard(ev, isPast) {
  const d = ev.dateDebut ? new Date(ev.dateDebut) : null;
  const day = d ? d.getDate() : '';
  const mon = d ? d.toLocaleString('fr-FR', { month: 'short' }).toUpperCase() : '';
  const endStr = ev.dateFin ? '→ ' + new Date(ev.dateFin).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }) : '';
  return `
    <div class="event-card${isPast?' event-past':''}">
      <div class="event-date-block">
        <div class="event-date-day">${day}</div>
        <div class="event-date-mon">${mon}</div>
        ${endStr ? `<div class="event-date-end">${endStr}</div>` : ''}
      </div>
      <div class="event-info">
        <div class="event-title">${esc(ev.titre||'Sans titre')}</div>
        ${ev.lieu ? `<div class="event-lieu">📍 ${esc(ev.lieu)}</div>` : ''}
        ${ev.description ? `<div class="event-desc">${esc(ev.description)}</div>` : ''}
      </div>
    </div>
  `;
}

/* ── Actus ───────────────────────────────────────────────────────── */
function renderActus(actus) {
  const el = document.getElementById('acContent');
  if (!actus.length) {
    el.innerHTML = '<p class="empty-state">Aucune actualité publiée pour le moment.</p>';
    return;
  }
  el.innerHTML = actus.map(ac => `
    <div class="actu-card">
      ${ac.photo ? `<img src="${ac.photo}" class="actu-photo" alt="${esc(ac.titre||'')}">` : ''}
      <div class="actu-body">
        <div class="actu-title">${esc(ac.titre||'')}</div>
        <div class="actu-date">${fmtDate(ac.date)}</div>
        <div class="actu-text">${esc(ac.contenu||'')}</div>
      </div>
    </div>
  `).join('');
}

/* ── Contact ─────────────────────────────────────────────────────── */
function renderContact(rec, content) {
  const el = document.getElementById('contactContent');
  const items = [];
  const tel  = content.telephone || '';
  const mail = content.email     || '';
  const web  = content.website   || '';
  const hrs  = content.horaires  || '';
  const loc  = [rec.COMMUNE, rec.DEPARTEMENT, rec.REGION].filter(Boolean).join(', ');

  if (loc)  items.push({ icon: '📍', label: 'Adresse', value: loc });
  if (hrs)  items.push({ icon: '🕐', label: 'Horaires', value: hrs });
  if (tel)  items.push({ icon: '📞', label: 'Téléphone', value: `<a href="tel:${tel}">${esc(tel)}</a>` });
  if (mail) items.push({ icon: '✉️', label: 'Email', value: `<a href="mailto:${mail}">${esc(mail)}</a>` });
  if (web)  items.push({ icon: '🌐', label: 'Site web', value: `<a href="${esc(web)}" target="_blank" rel="noopener">${esc(web.replace(/^https?:\/\//, ''))}</a>` });

  if (!items.length && !loc) {
    el.innerHTML = '<p class="empty-state">Informations de contact non disponibles.</p>';
    return;
  }
  el.innerHTML = items.map(it => `
    <div class="contact-item">
      <span class="contact-icon">${it.icon}</span>
      <div>
        <div class="contact-label">${it.label}</div>
        <div class="contact-value">${it.value}</div>
      </div>
    </div>
  `).join('');
}

/* ── Leaflet Map ─────────────────────────────────────────────────── */
function renderMap(lat, lon, name) {
  const mapEl = document.getElementById('siteMap');
  const map = L.map(mapEl, { zoomControl: true, attributionControl: false }).setView([lat, lon], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  L.marker([lat, lon]).addTo(map).bindPopup(`<b>${name}</b>`).openPopup();
}

/* ── Lightbox ────────────────────────────────────────────────────── */
function openLightbox(idx) {
  const photos = window._galleryPhotos || [];
  const ph     = photos[idx];
  if (!ph) return;
  document.getElementById('lbImg').src          = ph.url;
  document.getElementById('lbCaption').textContent = ph.caption || '';
  document.getElementById('lightbox').classList.remove('hidden');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ── Error ───────────────────────────────────────────────────────── */
function showError() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('errorScreen').classList.remove('hidden');
}

/* ── Utils ───────────────────────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
}
function getInfraType(rec) {
  const d = (rec.DESCRIPTIF || '').trim().toLowerCase();
  const types = ['centre culturel','cinéma','galerie','musée','foyer des femmes','foyer des jeunes',
    'salle de spectacle','salle des fêtes','bibliothèque','village artisanal','maison de la culture'];
  for (const t of types) { if (d.includes(t)) return t.charAt(0).toUpperCase() + t.slice(1); }
  return rec.DESCRIPTIF || 'Site culturel';
}
const TYPE_COLORS = {
  'Centre culturel': '#0d5fa0', 'Cinéma': '#c0392b', 'Galerie': '#00838f',
  'Musée': '#6a1b9a', 'Foyer des femmes': '#e91e8c', 'Foyer des jeunes': '#e67e22',
  'Salle de spectacle': '#1565c0', 'Salle des fêtes': '#d81b60',
  'Bibliothèque': '#2e7d32', 'Village artisanal': '#f57f17', 'Maison de la culture': '#00695c',
};
const TYPE_ICONS = {
  'Centre culturel': '🏛', 'Cinéma': '🎬', 'Galerie': '🖼', 'Musée': '🏺',
  'Foyer des femmes': '👩', 'Foyer des jeunes': '🎭', 'Salle de spectacle': '🎪',
  'Salle des fêtes': '🎉', 'Bibliothèque': '📚', 'Village artisanal': '🏺',
  'Maison de la culture': '🏠',
};
function typeColor(rec) { return TYPE_COLORS[getInfraType(rec)] || '#0d5fa0'; }
function typeIcon(rec)  { return TYPE_ICONS[getInfraType(rec)]  || '📍'; }
