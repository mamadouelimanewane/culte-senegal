/* ════════════════════════════════════════════════════════════════
   CULTE — Événements Culturels du Sénégal
   Calendrier, notifications, intégration recherche
   ════════════════════════════════════════════════════════════════ */
'use strict';

const EventsCalendar = (() => {

  /* ── Base de données des événements culturels majeurs ──────── */
  const EVENTS_DB = [
    // ── Festivals internationaux ──
    {
      id: 'dakart',
      nom: "Biennale de Dakar (Dak'Art)",
      type: 'festival',
      categorie: 'Arts visuels',
      description: "Biennale internationale d'art contemporain africain. Expositions, performances et installations dans toute la ville.",
      region: 'DAKAR',
      commune: 'Dakar-Plateau',
      lieu: 'Ancien Palais de Justice & divers lieux',
      mois: 5,
      duree: 30,
      recurrence: 'biennale',
      annees: [2024, 2026, 2028],
      importance: 5,
      tags: ['art contemporain', 'exposition', 'biennale', 'international', 'peinture', 'sculpture'],
      latitude: 14.6937,
      longitude: -17.4441,
      web: 'bfrece '
    },
    {
      id: 'jazz-stlouis',
      nom: 'Festival International de Jazz de Saint-Louis',
      type: 'festival',
      categorie: 'Musique',
      description: "Plus grand festival de jazz en Afrique. Concerts en plein air sur la Place Faidherbe et dans les rues de l'île.",
      region: 'SAINT LOUIS',
      commune: 'Saint-Louis',
      lieu: 'Place Faidherbe & Île de Saint-Louis',
      mois: 5,
      duree: 5,
      recurrence: 'annuel',
      importance: 5,
      tags: ['jazz', 'musique', 'concert', 'international', 'ndar'],
      latitude: 16.0200,
      longitude: -16.4900,
    },
    {
      id: 'festival-gorée',
      nom: 'Festival de Gorée - Regards croisés',
      type: 'festival',
      categorie: 'Arts visuels',
      description: "Festival d'arts visuels sur l'île de Gorée. Expositions, ateliers et performances artistiques.",
      region: 'DAKAR',
      commune: 'Gorée',
      lieu: 'Île de Gorée',
      mois: 11,
      duree: 7,
      recurrence: 'annuel',
      importance: 4,
      tags: ['art', 'exposition', 'gorée', 'patrimoine', 'histoire'],
      latitude: 14.6669,
      longitude: -17.3986,
    },
    {
      id: 'festa2h',
      nom: 'Festa2H — Festival International de Hip-Hop',
      type: 'festival',
      categorie: 'Musique',
      description: "Festival majeur de hip-hop africain. Rap, breakdance, graffiti, DJ et battles.",
      region: 'DAKAR',
      commune: 'Dakar',
      lieu: 'Place du Souvenir Africain',
      mois: 12,
      duree: 3,
      recurrence: 'annuel',
      importance: 4,
      tags: ['hip-hop', 'rap', 'danse', 'graffiti', 'musique urbaine'],
      latitude: 14.7167,
      longitude: -17.4677,
    },

    // ── Événements religieux / traditionnels ──
    {
      id: 'magal-touba',
      nom: 'Grand Magal de Touba',
      type: 'religieux',
      categorie: 'Patrimoine immatériel',
      description: "Plus grand pèlerinage mouride, commémorant le départ en exil de Cheikh Ahmadou Bamba. Des millions de fidèles convergent vers Touba.",
      region: 'DIOURBEL',
      commune: 'Touba',
      lieu: 'Grande Mosquée de Touba',
      mois: 0,
      duree: 3,
      recurrence: 'annuel',
      importance: 5,
      tags: ['magal', 'mouride', 'touba', 'bamba', 'pèlerinage', 'religion', 'islam'],
      latitude: 14.8558,
      longitude: -15.8827,
    },
    {
      id: 'gamou-tivaouane',
      nom: 'Gamou de Tivaouane (Mawlid)',
      type: 'religieux',
      categorie: 'Patrimoine immatériel',
      description: "Célébration de la naissance du Prophète Muhammad. Grand rassemblement tidiane à Tivaouane avec chants religieux et prières.",
      region: 'THIES',
      commune: 'Tivaouane',
      lieu: 'Grande Mosquée de Tivaouane',
      mois: 0,
      duree: 3,
      recurrence: 'annuel',
      importance: 5,
      tags: ['gamou', 'mawlid', 'tidiane', 'tivaouane', 'religion', 'islam'],
      latitude: 14.9500,
      longitude: -16.8167,
    },
    {
      id: 'koriteh',
      nom: 'Korité (Aïd el-Fitr)',
      type: 'religieux',
      categorie: 'Patrimoine immatériel',
      description: "Fête marquant la fin du Ramadan. Prières, repas festifs en famille et échanges de vœux dans tout le Sénégal.",
      region: 'DAKAR',
      commune: 'Tout le Sénégal',
      lieu: 'Tout le pays',
      mois: 0,
      duree: 2,
      recurrence: 'annuel',
      importance: 5,
      tags: ['korité', 'ramadan', 'aid', 'fête', 'religion', 'islam'],
      latitude: 14.6937,
      longitude: -17.4441,
    },
    {
      id: 'tabaski',
      nom: 'Tabaski (Aïd el-Kébir)',
      type: 'religieux',
      categorie: 'Patrimoine immatériel',
      description: "Fête du sacrifice. Prières à la mosquée, sacrifice du mouton et grands repas familiaux.",
      region: 'DAKAR',
      commune: 'Tout le Sénégal',
      lieu: 'Tout le pays',
      mois: 0,
      duree: 2,
      recurrence: 'annuel',
      importance: 5,
      tags: ['tabaski', 'aid', 'sacrifice', 'mouton', 'fête', 'religion'],
      latitude: 14.6937,
      longitude: -17.4441,
    },

    // ── Festivals culturels / danse / théâtre ──
    {
      id: 'kaay-fecc',
      nom: 'Kaay Fecc — Festival International de Danse',
      type: 'festival',
      categorie: 'Danse',
      description: "Festival international de danse contemporaine et traditionnelle africaine. Spectacles, ateliers et rencontres chorégraphiques.",
      region: 'DAKAR',
      commune: 'Dakar',
      lieu: 'Théâtre National Daniel Sorano',
      mois: 4,
      duree: 5,
      recurrence: 'annuel',
      importance: 4,
      tags: ['danse', 'sabar', 'contemporain', 'chorégraphie', 'spectacle'],
      latitude: 14.6750,
      longitude: -17.4350,
    },
    {
      id: 'fesnac',
      nom: 'FESNAC — Festival National des Arts et de la Culture',
      type: 'festival',
      categorie: 'Multidisciplinaire',
      description: "Festival national célébrant toutes les formes d'expression culturelle sénégalaise : musique, danse, théâtre, artisanat.",
      region: 'DAKAR',
      commune: 'Dakar',
      lieu: 'Grand Théâtre National',
      mois: 12,
      duree: 7,
      recurrence: 'biennale',
      annees: [2025, 2027, 2029],
      importance: 4,
      tags: ['culture', 'tradition', 'artisanat', 'musique', 'national'],
      latitude: 14.7100,
      longitude: -17.4700,
    },
    {
      id: 'sorano-theatre',
      nom: 'Saison Théâtrale du Sorano',
      type: 'spectacle',
      categorie: 'Théâtre',
      description: "Programmation annuelle du Théâtre National Daniel Sorano. Pièces de théâtre, ballets et concerts de l'Ensemble National.",
      region: 'DAKAR',
      commune: 'Dakar-Médina',
      lieu: 'Théâtre National Daniel Sorano',
      mois: 1,
      duree: 300,
      recurrence: 'annuel',
      importance: 3,
      tags: ['théâtre', 'ballet', 'sorano', 'spectacle', 'concert'],
      latitude: 14.6750,
      longitude: -17.4350,
    },

    // ── Festivals régionaux ──
    {
      id: 'abene',
      nom: "Festival d'Abéné",
      type: 'festival',
      categorie: 'Musique & Danse',
      description: "Festival de percussions et danses traditionnelles en Casamance. Djembé, sabar et danses mandingues sous les fromagers.",
      region: 'ZIGUINCHOR',
      commune: 'Abéné',
      lieu: 'Village d\'Abéné',
      mois: 12,
      duree: 7,
      recurrence: 'annuel',
      importance: 4,
      tags: ['percussion', 'djembé', 'danse', 'casamance', 'mandingue'],
      latitude: 13.0500,
      longitude: -16.7000,
    },
    {
      id: 'sahel-louga',
      nom: 'Festival du Sahel',
      type: 'festival',
      categorie: 'Multidisciplinaire',
      description: "Festival culturel de la région de Louga, célébrant les traditions peules et wolofes du Sahel sénégalais.",
      region: 'LOUGA',
      commune: 'Louga',
      lieu: 'Centre culturel de Louga',
      mois: 2,
      duree: 4,
      recurrence: 'annuel',
      importance: 3,
      tags: ['sahel', 'peul', 'tradition', 'folklore', 'louga'],
      latitude: 15.6167,
      longitude: -16.2500,
    },
    {
      id: 'fanal-stlouis',
      nom: 'Fanal de Saint-Louis',
      type: 'traditionnel',
      categorie: 'Patrimoine immatériel',
      description: "Défilé nocturne de lanternes géantes dans les rues de Saint-Louis. Tradition héritée de la période coloniale, avec chants et danses.",
      region: 'SAINT LOUIS',
      commune: 'Saint-Louis',
      lieu: 'Île de Saint-Louis',
      mois: 12,
      duree: 3,
      recurrence: 'annuel',
      importance: 4,
      tags: ['fanal', 'lanterne', 'tradition', 'ndar', 'patrimoine', 'défilé'],
      latitude: 16.0200,
      longitude: -16.4900,
    },
    {
      id: 'simb',
      nom: 'Festival du Simb (Faux Lion)',
      type: 'traditionnel',
      categorie: 'Patrimoine immatériel',
      description: "Spectacle traditionnel de lutte simulée avec le 'faux lion'. Musique, danse et performances masquées dans les quartiers.",
      region: 'DAKAR',
      commune: 'Dakar',
      lieu: 'Quartiers de Dakar',
      mois: 0,
      duree: 1,
      recurrence: 'ponctuel',
      importance: 3,
      tags: ['simb', 'lion', 'masque', 'tradition', 'lutte', 'spectacle'],
      latitude: 14.6937,
      longitude: -17.4441,
    },

    // ── Patrimoine / UNESCO ──
    {
      id: 'journee-patrimoine',
      nom: 'Journées du Patrimoine',
      type: 'exposition',
      categorie: 'Patrimoine',
      description: "Portes ouvertes des sites patrimoniaux : Île de Gorée, Saint-Louis, cercles mégalithiques de Sénégambie, Delta du Saloum.",
      region: 'DAKAR',
      commune: 'Tout le Sénégal',
      lieu: 'Sites patrimoniaux',
      mois: 9,
      duree: 2,
      recurrence: 'annuel',
      importance: 3,
      tags: ['patrimoine', 'UNESCO', 'gorée', 'monument', 'histoire'],
      latitude: 14.6937,
      longitude: -17.4441,
    },

    // ── Cinéma / Film ──
    {
      id: 'recidak',
      nom: 'RECIDAK — Rencontres Cinématographiques de Dakar',
      type: 'festival',
      categorie: 'Cinéma',
      description: "Festival de cinéma dédié aux films africains. Projections, masterclasses et rencontres avec des cinéastes du continent.",
      region: 'DAKAR',
      commune: 'Dakar',
      lieu: "Institut Français de Dakar & cinémas partenaires",
      mois: 2,
      duree: 5,
      recurrence: 'annuel',
      importance: 3,
      tags: ['cinéma', 'film', 'documentaire', 'projection', 'africain'],
      latitude: 14.6937,
      longitude: -17.4441,
    },

    // ── Artisanat ──
    {
      id: 'salon-artisanat',
      nom: 'SIACO — Salon International de l\'Artisanat de Ouagadougou section Sénégal',
      type: 'salon',
      categorie: 'Artisanat',
      description: "Exposition-vente d'artisanat sénégalais : tissage, poterie, bijoux, maroquinerie, vannerie. Démonstrations et ateliers.",
      region: 'DAKAR',
      commune: 'Dakar',
      lieu: 'CICES (Centre International du Commerce Extérieur)',
      mois: 11,
      duree: 10,
      recurrence: 'annuel',
      importance: 3,
      tags: ['artisanat', 'tissage', 'poterie', 'bijoux', 'exposition', 'salon'],
      latitude: 14.7256,
      longitude: -17.4762,
    },

    // ── Musique / Concert ──
    {
      id: 'just4u',
      nom: 'Just 4 U Festival',
      type: 'festival',
      categorie: 'Musique',
      description: "Festival de musique mbalax et afrobeats au stade. Grands noms de la scène musicale sénégalaise et africaine.",
      region: 'DAKAR',
      commune: 'Dakar',
      lieu: 'Stade Léopold Sédar Senghor',
      mois: 7,
      duree: 2,
      recurrence: 'annuel',
      importance: 3,
      tags: ['mbalax', 'concert', 'musique', 'afrobeats', 'festival'],
      latitude: 14.6912,
      longitude: -17.4489,
    },
    {
      id: 'blues-sahel',
      nom: 'Blues du Fleuve',
      type: 'festival',
      categorie: 'Musique',
      description: "Festival de blues et musiques du monde au bord du fleuve Sénégal. Ambiance unique entre tradition et modernité.",
      region: 'SAINT LOUIS',
      commune: 'Podor',
      lieu: 'Bords du fleuve Sénégal',
      mois: 3,
      duree: 3,
      recurrence: 'annuel',
      importance: 3,
      tags: ['blues', 'musique', 'fleuve', 'podor', 'world music'],
      latitude: 16.6500,
      longitude: -14.9500,
    },

    // ── Littérature ──
    {
      id: 'partcir',
      nom: 'Partcours — Nuit de la Littérature',
      type: 'festival',
      categorie: 'Littérature',
      description: "Nuit dédiée à la littérature africaine. Lectures publiques, slam, poésie et rencontres d'auteurs dans les galeries de Dakar.",
      region: 'DAKAR',
      commune: 'Dakar-Plateau',
      lieu: 'Galeries et espaces culturels',
      mois: 10,
      duree: 1,
      recurrence: 'annuel',
      importance: 3,
      tags: ['littérature', 'slam', 'poésie', 'lecture', 'auteur', 'livre'],
      latitude: 14.6937,
      longitude: -17.4441,
    },

    // ── Fêtes nationales ──
    {
      id: 'independance',
      nom: 'Fête de l\'Indépendance du Sénégal',
      type: 'national',
      categorie: 'Patrimoine',
      description: "Commémoration de l'indépendance du Sénégal (4 avril 1960). Défilé militaire, spectacles et festivités dans tout le pays.",
      region: 'DAKAR',
      commune: 'Tout le Sénégal',
      lieu: 'Place de la Nation & tout le pays',
      moisFixe: 3,
      jourFixe: 4,
      duree: 1,
      recurrence: 'annuel',
      importance: 5,
      tags: ['indépendance', 'national', 'défilé', 'fête', '4 avril'],
      latitude: 14.6937,
      longitude: -17.4441,
    },
  ];

  /* ── État interne ─────────────────────────────────────────── */
  let _events = [...EVENTS_DB];
  let _userEvents = [];
  let _notifications = [];
  let _selectedMonth = new Date().getMonth();
  let _selectedRegion = '';
  let _selectedType = '';
  let _panelEl = null;
  let _isOpen = false;

  /* ── Utilitaires ──────────────────────────────────────────── */
  const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const TYPE_ICONS = {
    festival: '🎪', religieux: '🕌', traditionnel: '🎭', spectacle: '🎬',
    exposition: '🖼', salon: '🏪', national: '🇸🇳', concert: '🎵', default: '📅'
  };
  const CAT_COLORS = {
    'Musique': '#1565c0', 'Arts visuels': '#6a1b9a', 'Danse': '#e91e8c',
    'Théâtre': '#e67e22', 'Cinéma': '#c0392b', 'Patrimoine': '#00695c',
    'Patrimoine immatériel': '#f57f17', 'Artisanat': '#2e7d32',
    'Littérature': '#0277bd', 'Multidisciplinaire': '#0d5fa0',
    'Musique & Danse': '#d81b60', 'default': '#546e7a'
  };

  function _getIcon(type) { return TYPE_ICONS[type] || TYPE_ICONS.default; }
  function _getColor(cat) { return CAT_COLORS[cat] || CAT_COLORS.default; }

  function _getEventsForMonth(month, year) {
    year = year || new Date().getFullYear();
    return _events.filter(e => {
      if (e.moisFixe !== undefined) return e.moisFixe === month;
      if (e.mois === 0) return true; // variable (religieux lunaire)
      if (e.recurrence === 'biennale' && e.annees && !e.annees.includes(year)) return false;
      return e.mois === month + 1;
    }).concat(_userEvents.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }));
  }

  function _getUpcoming(count) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const year = now.getFullYear();
    let upcoming = [];

    for (let offset = 0; offset < 12 && upcoming.length < (count || 5); offset++) {
      const m = (currentMonth + offset) % 12;
      const y = year + Math.floor((currentMonth + offset) / 12);
      const monthEvents = _getEventsForMonth(m, y);
      monthEvents.forEach(e => {
        if (upcoming.length < (count || 5) && !upcoming.find(u => u.id === e.id)) {
          upcoming.push({ ...e, _displayMonth: m, _displayYear: y });
        }
      });
    }
    return upcoming;
  }

  function _filterEvents(events) {
    return events.filter(e => {
      if (_selectedRegion && e.region !== _selectedRegion) return false;
      if (_selectedType && e.type !== _selectedType) return false;
      return true;
    });
  }

  /* ── Notifications ────────────────────────────────────────── */
  function _checkNotifications() {
    const saved = _loadNotifPrefs();
    const upcoming = _getUpcoming(3);
    const now = new Date();

    upcoming.forEach(evt => {
      if (saved[evt.id]) return; // déjà notifié
      // Notifier si l'événement est dans le mois en cours
      if (evt._displayMonth === now.getMonth()) {
        _notifications.push({
          id: evt.id,
          title: evt.nom,
          message: `${_getIcon(evt.type)} ${evt.nom} — ce mois-ci à ${evt.commune}`,
          time: new Date()
        });
      }
    });

    // Mettre à jour le badge
    _updateNotifBadge();
  }

  function _loadNotifPrefs() {
    try { return JSON.parse(localStorage.getItem('culte_evt_notifs') || '{}'); }
    catch(e) { return {}; }
  }

  function _updateNotifBadge() {
    const dots = document.querySelectorAll('.notif-dot');
    const hasNotif = _notifications.length > 0;
    dots.forEach(d => d.style.display = hasNotif ? 'block' : 'none');
  }

  /* ── Persistance des événements utilisateur ───────────────── */
  function _loadUserEvents() {
    try {
      _userEvents = JSON.parse(localStorage.getItem('culte_user_events') || '[]');
    } catch(e) { _userEvents = []; }
  }

  function _saveUserEvents() {
    try { localStorage.setItem('culte_user_events', JSON.stringify(_userEvents)); }
    catch(e) {}
  }

  /* ── Rendu du panneau calendrier ──────────────────────────── */
  function _createPanel() {
    if (_panelEl) return _panelEl;

    _panelEl = document.createElement('div');
    _panelEl.id = 'eventsPanel';
    _panelEl.className = 'events-panel hidden';
    _panelEl.innerHTML = `
      <div class="events-backdrop"></div>
      <div class="events-sheet">
        <div class="events-header">
          <div class="events-header-top">
            <h3>📅 Événements Culturels</h3>
            <button class="events-close" aria-label="Fermer">✕</button>
          </div>
          <div class="events-month-nav">
            <button class="events-month-prev" aria-label="Mois précédent">‹</button>
            <span class="events-month-label"></span>
            <button class="events-month-next" aria-label="Mois suivant">›</button>
          </div>
          <div class="events-filters">
            <select class="events-region-filter">
              <option value="">Toutes les régions</option>
              <option value="DAKAR">Dakar</option>
              <option value="SAINT LOUIS">Saint-Louis</option>
              <option value="THIES">Thiès</option>
              <option value="DIOURBEL">Diourbel</option>
              <option value="ZIGUINCHOR">Ziguinchor</option>
              <option value="LOUGA">Louga</option>
              <option value="FATICK">Fatick</option>
              <option value="KAOLACK">Kaolack</option>
              <option value="KOLDA">Kolda</option>
              <option value="TAMBACOUNDA">Tambacounda</option>
              <option value="KEDOUGOU">Kédougou</option>
              <option value="MATAM">Matam</option>
              <option value="SEDHIOU">Sédhiou</option>
              <option value="KAFFRINE">Kaffrine</option>
            </select>
            <div class="events-type-chips">
              <button class="evt-chip active" data-type="">Tous</button>
              <button class="evt-chip" data-type="festival">🎪 Festivals</button>
              <button class="evt-chip" data-type="religieux">🕌 Religieux</button>
              <button class="evt-chip" data-type="traditionnel">🎭 Tradition</button>
              <button class="evt-chip" data-type="spectacle">🎬 Spectacles</button>
            </div>
          </div>
        </div>
        <div class="events-body">
          <div class="events-list"></div>
        </div>
        <div class="events-footer">
          <div class="events-upcoming-label">Prochains événements</div>
          <div class="events-upcoming"></div>
        </div>
      </div>
    `;

    document.body.appendChild(_panelEl);

    // Event handlers
    _panelEl.querySelector('.events-backdrop').addEventListener('click', close);
    _panelEl.querySelector('.events-close').addEventListener('click', close);
    _panelEl.querySelector('.events-month-prev').addEventListener('click', () => {
      _selectedMonth = (_selectedMonth - 1 + 12) % 12;
      _render();
    });
    _panelEl.querySelector('.events-month-next').addEventListener('click', () => {
      _selectedMonth = (_selectedMonth + 1) % 12;
      _render();
    });
    _panelEl.querySelector('.events-region-filter').addEventListener('change', e => {
      _selectedRegion = e.target.value;
      _render();
    });
    _panelEl.querySelectorAll('.evt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        _panelEl.querySelectorAll('.evt-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        _selectedType = chip.dataset.type;
        _render();
      });
    });

    return _panelEl;
  }

  function _render() {
    if (!_panelEl) return;

    // Mois label
    const label = _panelEl.querySelector('.events-month-label');
    label.textContent = MOIS_NOMS[_selectedMonth] + ' ' + new Date().getFullYear();

    // Événements du mois
    const monthEvents = _filterEvents(_getEventsForMonth(_selectedMonth));
    const listEl = _panelEl.querySelector('.events-list');

    if (monthEvents.length === 0) {
      listEl.innerHTML = `
        <div class="events-empty">
          <span class="events-empty-icon">🌙</span>
          <p>Aucun événement ce mois-ci${_selectedRegion ? ' dans cette région' : ''}</p>
          <small>Naviguez vers un autre mois ou changez les filtres</small>
        </div>`;
    } else {
      listEl.innerHTML = monthEvents.map(evt => `
        <div class="event-card" data-id="${evt.id}">
          <div class="event-card-left" style="border-left: 3px solid ${_getColor(evt.categorie)}">
            <span class="event-icon">${_getIcon(evt.type)}</span>
            <div class="event-info">
              <div class="event-name">${_esc(evt.nom)}</div>
              <div class="event-meta">
                <span class="event-cat" style="color:${_getColor(evt.categorie)}">${_esc(evt.categorie)}</span>
                <span class="event-loc">📍 ${_esc(evt.commune)}, ${_formatRegion(evt.region)}</span>
              </div>
              <div class="event-desc">${_esc(evt.description).substring(0, 120)}${evt.description.length > 120 ? '…' : ''}</div>
            </div>
          </div>
          <div class="event-card-right">
            <span class="event-duration">${evt.duree > 30 ? 'Permanent' : evt.duree + 'j'}</span>
            ${evt.importance >= 4 ? '<span class="event-star">⭐</span>' : ''}
          </div>
        </div>
      `).join('');

      // Click handlers pour les cartes d'événements
      listEl.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('click', () => {
          const evt = _events.find(e => e.id === card.dataset.id) ||
                      _userEvents.find(e => e.id === card.dataset.id);
          if (evt) _showEventDetail(evt);
        });
      });
    }

    // Prochains événements
    const upcoming = _getUpcoming(4);
    const upEl = _panelEl.querySelector('.events-upcoming');
    upEl.innerHTML = upcoming.map(evt => `
      <div class="event-upcoming-item" data-id="${evt.id}">
        <span class="event-upcoming-icon">${_getIcon(evt.type)}</span>
        <div class="event-upcoming-info">
          <span class="event-upcoming-name">${_esc(evt.nom)}</span>
          <span class="event-upcoming-date">${MOIS_NOMS[evt._displayMonth]} ${evt._displayYear}</span>
        </div>
      </div>
    `).join('');

    upEl.querySelectorAll('.event-upcoming-item').forEach(item => {
      item.addEventListener('click', () => {
        const evt = _events.find(e => e.id === item.dataset.id);
        if (evt) {
          _selectedMonth = evt._displayMonth || (evt.moisFixe !== undefined ? evt.moisFixe : (evt.mois > 0 ? evt.mois - 1 : _selectedMonth));
          _render();
        }
      });
    });
  }

  function _showEventDetail(evt) {
    const detailHtml = `
      <div class="event-detail-overlay" id="eventDetailOverlay">
        <div class="event-detail-card">
          <div class="event-detail-header" style="background: linear-gradient(135deg, ${_getColor(evt.categorie)}, ${_getColor(evt.categorie)}88)">
            <button class="event-detail-back" aria-label="Retour">←</button>
            <span class="event-detail-icon">${_getIcon(evt.type)}</span>
            <h4>${_esc(evt.nom)}</h4>
            <span class="event-detail-cat">${_esc(evt.categorie)}</span>
          </div>
          <div class="event-detail-body">
            <p class="event-detail-desc">${_esc(evt.description)}</p>
            <div class="event-detail-meta">
              <div class="edm-row">📍 <strong>Lieu :</strong> ${_esc(evt.lieu || evt.commune)}</div>
              <div class="edm-row">🗺 <strong>Région :</strong> ${_formatRegion(evt.region)}</div>
              <div class="edm-row">📅 <strong>Période :</strong> ${evt.moisFixe !== undefined ? evt.jourFixe + ' ' + MOIS_NOMS[evt.moisFixe] : (evt.mois > 0 ? MOIS_NOMS[evt.mois - 1] : 'Date variable (calendrier lunaire)')}</div>
              <div class="edm-row">⏱ <strong>Durée :</strong> ${evt.duree > 30 ? 'Saison complète' : evt.duree + ' jour' + (evt.duree > 1 ? 's' : '')}</div>
              <div class="edm-row">🔄 <strong>Récurrence :</strong> ${evt.recurrence === 'annuel' ? 'Chaque année' : evt.recurrence === 'biennale' ? 'Tous les 2 ans' : 'Ponctuel'}</div>
            </div>
            ${evt.tags ? `<div class="event-detail-tags">${evt.tags.map(t => `<span class="edt-tag">${_esc(t)}</span>`).join('')}</div>` : ''}
            <div class="event-detail-actions">
              ${evt.latitude ? `<button class="eda-btn eda-map" data-lat="${evt.latitude}" data-lon="${evt.longitude}">🗺 Voir sur la carte</button>` : ''}
              <button class="eda-btn eda-search" data-query="${_esc(evt.categorie + ' ' + evt.commune)}">🔍 Lieux à proximité</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('eventDetailOverlay');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.innerHTML = detailHtml;
    const overlay = container.firstElementChild;
    document.body.appendChild(overlay);

    overlay.querySelector('.event-detail-back').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const mapBtn = overlay.querySelector('.eda-map');
    if (mapBtn) {
      mapBtn.addEventListener('click', () => {
        overlay.remove();
        close();
        if (typeof showOnMap === 'function') {
          showOnMap(parseFloat(mapBtn.dataset.lat), parseFloat(mapBtn.dataset.lon));
        }
      });
    }

    const searchBtn = overlay.querySelector('.eda-search');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        overlay.remove();
        close();
        if (typeof switchTab === 'function' && typeof runNlpSearch === 'function') {
          switchTab('explore');
          const ms = document.getElementById('mapSearch');
          if (ms) ms.value = searchBtn.dataset.query;
          setTimeout(() => runNlpSearch(searchBtn.dataset.query), 300);
        }
      });
    }
  }

  function _esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  function _formatRegion(r) {
    if (!r) return '';
    return r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
  }

  /* ── Intégration avec le moteur de recherche ──────────────── */
  function searchEvents(query) {
    if (!query) return [];
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return _events.filter(evt => {
      const haystack = [
        evt.nom, evt.type, evt.categorie, evt.description,
        evt.region, evt.commune, evt.lieu,
        ...(evt.tags || [])
      ].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return haystack.includes(q);
    });
  }

  /* ── Création du widget Home (carrousel événements) ───────── */
  function renderHomeWidget() {
    const upcoming = _getUpcoming(5);
    if (!upcoming.length) return '';

    return `
      <div class="section-header" style="margin-top:20px">
        <span class="section-title">📅 Événements à venir</span>
        <button class="see-all events-see-all">Calendrier</button>
      </div>
      <div class="events-carousel">
        ${upcoming.map(evt => `
          <div class="event-mini-card" data-id="${evt.id}" style="border-top: 3px solid ${_getColor(evt.categorie)}">
            <div class="emc-icon">${_getIcon(evt.type)}</div>
            <div class="emc-name">${_esc(evt.nom)}</div>
            <div class="emc-meta">${MOIS_NOMS[evt._displayMonth]} · ${_esc(evt.commune)}</div>
            ${evt.importance >= 4 ? '<div class="emc-badge">⭐ Majeur</div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function attachHomeHandlers() {
    document.querySelectorAll('.event-mini-card').forEach(card => {
      card.addEventListener('click', () => {
        const evt = _events.find(e => e.id === card.dataset.id);
        if (evt) { open(); _showEventDetail(evt); }
      });
    });
    const seeAllBtn = document.querySelector('.events-see-all');
    if (seeAllBtn) seeAllBtn.addEventListener('click', () => open());
  }

  /* ── Ajouter un événement utilisateur ─────────────────────── */
  function addUserEvent(evt) {
    evt.id = 'user_' + Date.now();
    evt.importance = evt.importance || 2;
    _userEvents.push(evt);
    _saveUserEvents();

    // Indexer dans le moteur de recherche
    if (typeof SearchEngine !== 'undefined' && SearchEngine.indexOne) {
      SearchEngine.indexOne({
        DESIGNATION: evt.nom,
        DESCRIPTIF: evt.categorie + ' ' + evt.description,
        THEMATIQUE: evt.categorie,
        REGION: evt.region,
        COMMUNE: evt.commune,
        LATITUDE: evt.latitude || '',
        LONGITUDE: evt.longitude || '',
        MILIEU: 'URBAIN',
        _isEvent: true,
      }, false);
    }

    return evt;
  }

  /* ── API publique ─────────────────────────────────────────── */
  function open() {
    _createPanel();
    _render();
    _panelEl.classList.remove('hidden');
    _isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (_panelEl) _panelEl.classList.add('hidden');
    _isOpen = false;
    document.body.style.overflow = '';
  }

  function init() {
    _loadUserEvents();
    _checkNotifications();
  }

  return {
    init,
    open,
    close,
    searchEvents,
    renderHomeWidget,
    attachHomeHandlers,
    addUserEvent,
    getUpcoming: _getUpcoming,
    get events() { return [..._events, ..._userEvents]; },
    get isOpen() { return _isOpen; },
    get notifications() { return [..._notifications]; },
    MOIS_NOMS,
  };

})();
