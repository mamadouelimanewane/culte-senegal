/* ═══════════════════════════════════════════════════════════════
   VISITES GUIDÉES — Circuits culturels sénégalais
   Tours prédéfinis, navigation pas-à-pas, badges, audio-guide
   ═══════════════════════════════════════════════════════════════ */
const GuidedTours = (() => {
  'use strict';

  var STORAGE_KEY = 'culte_tours';
  var currentTour = null;
  var currentStopIdx = 0;

  // ── Circuits prédéfinis ──
  var TOURS = [
    { id: 'arts-dakar', name: 'Circuit Arts à Dakar', description: 'Musées, galeries et centres culturels de la capitale', region: 'DAKAR', duration: 4, difficulty: 'facile', icon: '🎨', color: '#E07A5F',
      typeFilters: ['MUSEE','GALERIE D\'ART','CENTRE CULTUREL'], defaultStops: [
        { name: 'Musée des Civilisations Noires', description: 'Inauguré en 2018, ce musée célèbre les cultures africaines et de la diaspora.', duration_min: 45 },
        { name: 'Village des Arts', description: 'Résidence d\'artistes et galeries contemporaines au cœur de Dakar.', duration_min: 30 },
        { name: 'Musée Théodore Monod (IFAN)', description: 'Le plus ancien musée d\'art ouest-africain, fondé en 1936.', duration_min: 40 }
      ]},
    { id: 'talibes-touba', name: 'Parcours Talibes à Touba', description: 'Lieux saints et patrimoine mouride de Diourbel', region: 'DIOURBEL', duration: 5, difficulty: 'moyen', icon: '🕌', color: '#3D405B',
      typeFilters: ['LIEU DE CULTE','MOSQUEE','SITE RELIGIEUX'], defaultStops: [
        { name: 'Grande Mosquée de Touba', description: 'La plus grande mosquée d\'Afrique de l\'Ouest, cœur du mouridisme.', duration_min: 60 },
        { name: 'Bibliothèque Cheikhoul Khadim', description: 'Archives et manuscrits de la confrérie mouride.', duration_min: 30 },
        { name: 'Mausolée de Cheikh Ahmadou Bamba', description: 'Lieu de pèlerinage sacré de millions de mourides.', duration_min: 40 }
      ]},
    { id: 'festivals-stlouis', name: 'Route des Festivals — Saint-Louis', description: 'Scènes culturelles et patrimoine colonial de Ndar', region: 'SAINT-LOUIS', duration: 6, difficulty: 'facile', icon: '🎵', color: '#3D9970',
      typeFilters: ['CENTRE CULTUREL','SALLE DE SPECTACLE','MUSEE'], defaultStops: [
        { name: 'Institut Français Saint-Louis', description: 'Lieu emblématique du Festival International de Jazz.', duration_min: 30 },
        { name: 'Pont Faidherbe', description: 'Monument historique reliant l\'île de Saint-Louis au continent.', duration_min: 20 },
        { name: 'Musée de la Photographie', description: 'Collection unique de l\'histoire visuelle du Sénégal.', duration_min: 35 }
      ]},
    { id: 'casamance', name: 'Découverte Casamance', description: 'Richesse culturelle diola et patrimoine naturel du sud', region: 'ZIGUINCHOR', duration: 8, difficulty: 'sportif', icon: '🌴', color: '#81B29A',
      typeFilters: ['MUSEE','CENTRE CULTUREL','SITE NATUREL'], defaultStops: [
        { name: 'Maison Culturelle de Ziguinchor', description: 'Centre de la culture diola et exposition artisanale.', duration_min: 40 },
        { name: 'Cases à impluvium d\'Enampor', description: 'Architecture traditionnelle diola classée patrimoine.', duration_min: 50 },
        { name: 'Forêt sacrée des Baïnouk', description: 'Site naturel et spirituel ancestral de Casamance.', duration_min: 45 }
      ]},
    { id: 'thies-mbour', name: 'Patrimoine Thiès-Mbour', description: 'Tapisseries, artisanat et stations balnéaires culturelles', region: 'THIES', duration: 5, difficulty: 'facile', icon: '🧵', color: '#F2CC8F',
      typeFilters: ['MANUFACTURE','CENTRE ARTISANAL','MUSEE'], defaultStops: [
        { name: 'Manufacture Sénégalaise des Arts Décoratifs', description: 'Célèbres tapisseries de Thiès, art textile monumental.', duration_min: 50 },
        { name: 'Musée de Thiès', description: 'Histoire régionale et collections archéologiques.', duration_min: 35 },
        { name: 'Village artisanal de Saly', description: 'Artisanat local et culture de la Petite Côte.', duration_min: 30 }
      ]},
    { id: 'musique-dakar', name: 'Circuit Musical Dakar', description: 'Studios, salles de concert et hauts lieux du mbalax', region: 'DAKAR', duration: 4, difficulty: 'facile', icon: '🎶', color: '#E9C46A',
      typeFilters: ['SALLE DE SPECTACLE','STUDIO','CENTRE CULTUREL'], defaultStops: [
        { name: 'Just 4 U (Youssou Ndour)', description: 'Le club mythique de Youssou N\'Dour, temple du mbalax.', duration_min: 30 },
        { name: 'Grand Théâtre National', description: 'Salle de spectacle moderne pour concerts et théâtre.', duration_min: 40 },
        { name: 'Institut Français de Dakar', description: 'Programmation musicale éclectique et rencontres d\'artistes.', duration_min: 30 }
      ]},
    { id: 'goree-historique', name: 'Parcours Historique Gorée', description: 'Mémoire de la traite négrière et patrimoine UNESCO', region: 'DAKAR', duration: 3, difficulty: 'facile', icon: '⚓', color: '#264653',
      typeFilters: ['MUSEE','MONUMENT','SITE HISTORIQUE'], defaultStops: [
        { name: 'Maison des Esclaves', description: 'Mémorial de la traite transatlantique, patrimoine UNESCO.', duration_min: 45 },
        { name: 'Musée Historique de Gorée', description: 'Histoire de l\'île depuis le XVe siècle.', duration_min: 35 },
        { name: 'Castel de Gorée', description: 'Fortification sommitale offrant une vue panoramique sur Dakar.', duration_min: 25 }
      ]},
    { id: 'arachide-kaolack', name: 'Route de l\'Arachide', description: 'Patrimoine agricole et culturel du bassin arachidier', region: 'KAOLACK', duration: 6, difficulty: 'moyen', icon: '🥜', color: '#D4A373',
      typeFilters: ['MARCHE','CENTRE CULTUREL','MOSQUEE'], defaultStops: [
        { name: 'Grand Marché de Kaolack', description: 'L\'un des plus grands marchés d\'Afrique de l\'Ouest.', duration_min: 40 },
        { name: 'Grande Mosquée de Kaolack', description: 'Architecture remarquable influencée par la Tidjaniya.', duration_min: 30 },
        { name: 'Musée du Sine', description: 'Histoire du royaume du Sine et de la culture sérère.', duration_min: 35 }
      ]},
    { id: 'kedougou-nature', name: 'Circuit Nature & Culture — Kédougou', description: 'Pays Bassari, cascades et patrimoine vivant', region: 'KEDOUGOU', duration: 10, difficulty: 'sportif', icon: '⛰️', color: '#606C38',
      typeFilters: ['SITE NATUREL','VILLAGE','MUSEE'], defaultStops: [
        { name: 'Pays Bassari (Salémata)', description: 'Paysage culturel UNESCO des Bassari et Bédik.', duration_min: 90 },
        { name: 'Cascade de Dindefelo', description: 'La plus haute cascade du Sénégal (100m), site sacré.', duration_min: 60 },
        { name: 'Village d\'Iwol', description: 'Village Bédik perché, architecture et rites traditionnels.', duration_min: 50 }
      ]},
    { id: 'litteraire', name: 'Parcours Littéraire Sénégal', description: 'Bibliothèques, maisons d\'écrivains et lieux de la négritude', region: 'DAKAR', duration: 5, difficulty: 'facile', icon: '📚', color: '#6C6F8B',
      typeFilters: ['BIBLIOTHEQUE','CENTRE CULTUREL','MUSEE'], defaultStops: [
        { name: 'Université Cheikh Anta Diop', description: 'Temple du savoir fondé par le grand savant sénégalais.', duration_min: 40 },
        { name: 'Bibliothèque Nationale du Sénégal', description: 'Fonds documentaire majeur sur la culture sénégalaise.', duration_min: 30 },
        { name: 'Maison Léopold Sédar Senghor', description: 'Résidence du poète-président, musée de la négritude.', duration_min: 45 }
      ]}
  ];

  // ── Haversine ──
  function _haversine(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // ── Enrichir les étapes depuis SearchEngine ──
  function _buildStops(tour) {
    if (typeof SearchEngine === 'undefined' || !SearchEngine.docs) return tour.defaultStops;
    var docs = SearchEngine.docs.filter(function(d) {
      return d.REGION === tour.region && tour.typeFilters.some(function(t) {
        return (d.TYPE_INFRA || '').toUpperCase().indexOf(t) >= 0;
      });
    });
    if (docs.length < 2) return tour.defaultStops;
    return docs.slice(0, 8).map(function(d, i) {
      var def = tour.defaultStops[i] || {};
      return {
        name: d.NOM || def.name || 'Étape ' + (i+1),
        type: d.TYPE_INFRA || '',
        region: d.REGION || tour.region,
        commune: d.COMMUNE || '',
        lat: parseFloat(d.latitude) || 0,
        lng: parseFloat(d.longitude) || 0,
        description: def.description || ('Un lieu de type ' + (d.TYPE_INFRA || 'culturel') + ' à ' + (d.COMMUNE || tour.region) + '.'),
        duration_min: def.duration_min || 30
      };
    });
  }

  // ── Gestion du tour ──
  function startTour(tourId) {
    var tour = TOURS.find(function(t) { return t.id === tourId; });
    if (!tour) return null;
    currentTour = Object.assign({}, tour, { stops: _buildStops(tour) });
    currentStopIdx = 0;
    _speakStop();
    return currentTour;
  }

  function nextStop() {
    if (!currentTour) return null;
    if (currentStopIdx < currentTour.stops.length - 1) {
      currentStopIdx++;
      _speakStop();
    } else {
      _completeTour();
    }
    return getCurrentStop();
  }

  function prevStop() {
    if (!currentTour || currentStopIdx <= 0) return null;
    currentStopIdx--;
    _speakStop();
    return getCurrentStop();
  }

  function getCurrentStop() {
    if (!currentTour) return null;
    return Object.assign({}, currentTour.stops[currentStopIdx], { index: currentStopIdx });
  }

  function getProgress() {
    if (!currentTour) return { current: 0, total: 0, percentage: 0 };
    var total = currentTour.stops.length;
    return { current: currentStopIdx + 1, total: total, percentage: Math.round((currentStopIdx + 1) / total * 100) };
  }

  function endTour() {
    currentTour = null;
    currentStopIdx = 0;
    _hideNavBar();
  }

  function _completeTour() {
    if (!currentTour) return;
    var data = _loadData();
    if (data.completed.indexOf(currentTour.id) < 0) {
      data.completed.push(currentTour.id);
    }
    data.totalStops = (data.totalStops || 0) + currentTour.stops.length;
    _saveData(data);
    if (typeof VoiceConversation !== 'undefined' && VoiceConversation.speak) {
      VoiceConversation.speak('Félicitations ! Vous avez terminé le circuit ' + currentTour.name + '. Bravo explorateur !');
    }
  }

  function _speakStop() {
    if (!currentTour) return;
    var stop = currentTour.stops[currentStopIdx];
    if (typeof VoiceConversation !== 'undefined' && VoiceConversation.speak) {
      var text = 'Étape ' + (currentStopIdx + 1) + ' sur ' + currentTour.stops.length + '. ' + stop.name + '. ' + (stop.description || '');
      VoiceConversation.speak(text);
    }
  }

  // ── Badges ──
  var BADGES = [
    { id: 'explorateur', name: 'Explorateur', icon: '🧭', description: '1 circuit complété', threshold: 1 },
    { id: 'aventurier', name: 'Aventurier', icon: '🎒', description: '3 circuits complétés', threshold: 3 },
    { id: 'expert', name: 'Expert Culturel', icon: '🏅', description: '5 circuits complétés', threshold: 5 },
    { id: 'legende', name: 'Légende', icon: '👑', description: 'Tous les circuits complétés', threshold: TOURS.length }
  ];

  function getBadges() {
    var data = _loadData();
    var count = data.completed.length;
    return BADGES.map(function(b) {
      return Object.assign({}, b, { earned: count >= b.threshold });
    });
  }

  function getCompletedTours() {
    return _loadData().completed;
  }

  // ── localStorage ──
  function _loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { completed: [], totalStops: 0 }; }
    catch(e) { return { completed: [], totalStops: 0 }; }
  }
  function _saveData(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
  }

  // ── UI : Panel des tours ──
  function open() {
    var overlay = document.getElementById('toursOverlay');
    if (overlay) { overlay.classList.add('active'); return; }
    overlay = document.createElement('div');
    overlay.className = 'tours-overlay active';
    overlay.id = 'toursOverlay';
    overlay.innerHTML =
      '<div class="tours-header">' +
        '<h2>🧭 Visites Guidées</h2>' +
        '<button class="tours-close" id="toursClose">✕</button>' +
      '</div>' +
      '<div class="tours-filters" id="toursFilters"></div>' +
      '<div class="tours-grid" id="toursGrid"></div>';
    document.body.appendChild(overlay);

    document.getElementById('toursClose').addEventListener('click', close);
    _renderFilters();
    _renderTourCards();
  }

  function close() {
    var o = document.getElementById('toursOverlay');
    if (o) { o.classList.remove('active'); setTimeout(function(){o.remove();}, 300); }
  }

  function _renderFilters() {
    var filtersEl = document.getElementById('toursFilters');
    if (!filtersEl) return;
    var regions = [];
    TOURS.forEach(function(t) { if (regions.indexOf(t.region) < 0) regions.push(t.region); });
    var html = '<button class="tours-filter-btn active" data-filter="all">Tous</button>';
    regions.forEach(function(r) { html += '<button class="tours-filter-btn" data-filter="' + r + '">' + r + '</button>'; });
    ['facile','moyen','sportif'].forEach(function(d) { html += '<button class="tours-filter-btn" data-filter="' + d + '">' + d.charAt(0).toUpperCase()+d.slice(1) + '</button>'; });
    filtersEl.innerHTML = html;
    filtersEl.addEventListener('click', function(e) {
      var btn = e.target.closest('.tours-filter-btn');
      if (!btn) return;
      filtersEl.querySelectorAll('.tours-filter-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      _renderTourCards(btn.dataset.filter);
    });
  }

  function _renderTourCards(filter) {
    var grid = document.getElementById('toursGrid');
    if (!grid) return;
    var completed = getCompletedTours();
    var tours = TOURS;
    if (filter && filter !== 'all') {
      tours = TOURS.filter(function(t) { return t.region === filter || t.difficulty === filter; });
    }
    grid.innerHTML = tours.map(function(t) {
      var isDone = completed.indexOf(t.id) >= 0;
      var stops = _buildStops(t);
      return '<div class="tour-card" data-tour="' + t.id + '">' +
        '<div class="tour-card-header" style="background:linear-gradient(135deg,' + t.color + ',' + t.color + '88)">' +
          '<div class="tour-card-icon">' + t.icon + '</div>' +
          '<div class="tour-card-name">' + (isDone ? '✅ ' : '') + t.name + '</div>' +
          '<div class="tour-card-desc">' + t.description + '</div>' +
        '</div>' +
        '<div class="tour-card-meta">' +
          '<span>⏱ ' + t.duration + 'h</span>' +
          '<span>📍 ' + stops.length + ' étapes</span>' +
          '<span class="tour-card-badge badge-' + t.difficulty + '">' + t.difficulty + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    grid.querySelectorAll('.tour-card').forEach(function(card) {
      card.addEventListener('click', function() { _showTourDetail(card.dataset.tour); });
    });
  }

  function _showTourDetail(tourId) {
    var tour = TOURS.find(function(t){return t.id === tourId;});
    if (!tour) return;
    var stops = _buildStops(tour);
    var grid = document.getElementById('toursGrid');
    if (!grid) return;

    grid.innerHTML =
      '<div class="tour-detail">' +
        '<div class="tour-detail-header" style="background:linear-gradient(135deg,' + tour.color + ',' + tour.color + '88)">' +
          '<div style="font-size:2.5rem">' + tour.icon + '</div>' +
          '<h2>' + tour.name + '</h2>' +
          '<p>' + tour.description + '</p>' +
          '<p>⏱ ' + tour.duration + 'h • 📍 ' + stops.length + ' étapes • ' + tour.difficulty + '</p>' +
        '</div>' +
        '<div class="tour-stops">' +
          stops.map(function(s, i) {
            return '<div class="tour-stop">' +
              '<div class="tour-stop-number">' + (i+1) + '</div>' +
              '<div class="tour-stop-name">' + s.name + '</div>' +
              '<div class="tour-stop-info">' + (s.description || '') + ' • ~' + (s.duration_min || 30) + ' min</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<button class="tour-start-btn" id="tourStartBtn" data-tour="' + tourId + '">▶ Démarrer le circuit</button>' +
        '<button class="tour-start-btn" style="background:#888;margin-top:8px" id="tourBackBtn">← Retour</button>' +
      '</div>';

    document.getElementById('tourStartBtn').addEventListener('click', function() {
      close();
      startTour(tourId);
      _showNavBar();
    });
    document.getElementById('tourBackBtn').addEventListener('click', function() { _renderTourCards(); });
  }

  // ── Navigation active ──
  function _showNavBar() {
    _hideNavBar();
    if (!currentTour) return;
    var bar = document.createElement('div');
    bar.className = 'tour-nav-bar';
    bar.id = 'tourNavBar';
    _updateNavBar(bar);
    document.body.appendChild(bar);
  }

  function _updateNavBar(bar) {
    bar = bar || document.getElementById('tourNavBar');
    if (!bar || !currentTour) return;
    var p = getProgress();
    var stop = getCurrentStop();
    bar.innerHTML =
      '<div class="tour-nav-progress"><div class="tour-nav-progress-fill" style="width:' + p.percentage + '%"></div></div>' +
      '<div class="tour-nav-info">' +
        '<div class="tour-nav-stop-name">' + stop.name + '</div>' +
        '<div class="tour-nav-counter">Étape ' + p.current + ' / ' + p.total + ' — ' + currentTour.name + '</div>' +
      '</div>' +
      '<div class="tour-nav-btns">' +
        '<button class="tour-nav-btn prev" id="tourPrev"' + (currentStopIdx <= 0 ? ' disabled' : '') + '>← Précédent</button>' +
        (currentStopIdx < currentTour.stops.length - 1
          ? '<button class="tour-nav-btn next" id="tourNext">Suivant →</button>'
          : '<button class="tour-nav-btn finish" id="tourFinish">🏆 Terminer</button>') +
        '<button class="tour-nav-btn prev" id="tourQuit" style="flex:0;padding:10px">✕</button>' +
      '</div>';

    var prevBtn = bar.querySelector('#tourPrev');
    var nextBtn = bar.querySelector('#tourNext');
    var finishBtn = bar.querySelector('#tourFinish');
    var quitBtn = bar.querySelector('#tourQuit');

    if (prevBtn) prevBtn.addEventListener('click', function() { prevStop(); _updateNavBar(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { nextStop(); _updateNavBar(); });
    if (finishBtn) finishBtn.addEventListener('click', function() { _completeTour(); endTour(); });
    if (quitBtn) quitBtn.addEventListener('click', function() { endTour(); });
  }

  function _hideNavBar() {
    var bar = document.getElementById('tourNavBar');
    if (bar) bar.remove();
  }

  // ── Badges widget ──
  function renderBadgesWidget() {
    var badges = getBadges();
    return '<div class="tour-badges">' +
      badges.map(function(b) {
        return '<div class="tour-badge" title="' + b.description + '">' +
          '<div class="tour-badge-icon ' + (b.earned ? 'earned' : 'locked') + '">' + b.icon + '</div>' +
          '<div class="tour-badge-label">' + b.name + '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  // ── Init ──
  function init() {
    if (document.querySelector('.tours-fab')) return;
    var fab = document.createElement('button');
    fab.className = 'tours-fab';
    fab.innerHTML = '🧭';
    fab.title = 'Visites guidées';
    fab.setAttribute('aria-label', 'Ouvrir les visites guidées');
    fab.addEventListener('click', open);
    document.body.appendChild(fab);
  }

  return {
    init: init, open: open, close: close,
    startTour: startTour, nextStop: nextStop, prevStop: prevStop,
    getCurrentStop: getCurrentStop, getProgress: getProgress, endTour: endTour,
    getBadges: getBadges, getCompletedTours: getCompletedTours,
    renderBadgesWidget: renderBadgesWidget,
    tours: TOURS
  };
})();
