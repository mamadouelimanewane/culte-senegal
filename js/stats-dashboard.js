/* ═══════════════════════════════════════════════════════════════
   STATS DASHBOARD — Tableau de bord statistiques visuelles
   Graphiques Canvas, agrégation de données, 5 onglets
   ═══════════════════════════════════════════════════════════════ */
const StatsDashboard = (() => {
  'use strict';

  const COLORS = ['#E07A5F','#3D9970','#F2CC8F','#3D405B','#81B29A','#6C6F8B','#D4A373','#CCD5AE','#E9C46A','#264653','#2A9D8F','#E76F51','#606C38','#DDA15E'];
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = () => isDark() ? '#ccc' : '#555';
  const gridColor = () => isDark() ? '#333' : '#e8e8e8';

  function _getDocs() {
    return (typeof SearchEngine !== 'undefined' && SearchEngine.docs) ? SearchEngine.docs : [];
  }

  // ── Agrégation ──
  function getInfraByRegion() {
    const m = {}; _getDocs().forEach(d => { const r = d.REGION || 'Inconnu'; m[r] = (m[r]||0)+1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }
  function getInfraByType() {
    const m = {}; _getDocs().forEach(d => { const t = d.TYPE_INFRA || 'Autre'; m[t] = (m[t]||0)+1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }
  function getMilieuDistribution() {
    const m = {}; _getDocs().forEach(d => { const k = d.MILIEU||'Non précisé'; m[k] = (m[k]||0)+1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }
  function getTopCommunes(limit) {
    limit = limit || 10;
    const m = {}; _getDocs().forEach(d => { const c = d.COMMUNE||'Inconnu'; m[c] = (m[c]||0)+1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0, limit);
  }
  function getTypeByRegion() {
    const regions = new Set(), types = new Set(), matrix = {};
    _getDocs().forEach(d => {
      const r = d.REGION||'Inconnu', t = d.TYPE_INFRA||'Autre';
      regions.add(r); types.add(t);
      const k = r+'|'+t; matrix[k] = (matrix[k]||0)+1;
    });
    return { regions: [...regions].sort(), types: [...types].sort(), matrix: matrix };
  }
  function getCulturalDensity() {
    const counts = {}; _getDocs().forEach(d => { const r = d.REGION||'Inconnu'; counts[r] = (counts[r]||0)+1; });
    const total = _getDocs().length || 1;
    return Object.entries(counts).map(function(e) { return [e[0], +(e[1]/total*100).toFixed(1)]; }).sort((a,b) => b[1]-a[1]);
  }
  function getRegionDiversity() {
    const regionTypes = {};
    _getDocs().forEach(d => {
      const r = d.REGION||'Inconnu', t = d.TYPE_INFRA||'Autre';
      if (!regionTypes[r]) regionTypes[r] = {};
      regionTypes[r][t] = (regionTypes[r][t]||0)+1;
    });
    return Object.entries(regionTypes).map(function(e) {
      var r = e[0], types = e[1];
      var total = Object.values(types).reduce(function(s,v){return s+v;}, 0);
      var H = -Object.values(types).reduce(function(s,v){ var p = v/total; return s + (p > 0 ? p*Math.log2(p) : 0); }, 0);
      return [r, +H.toFixed(2)];
    }).sort((a,b) => b[1]-a[1]);
  }

  // ── Dessin Canvas ──
  function drawBarChart(canvas, data, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.parentElement.clientWidth || 320;
    var h = opts.height || 250;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx.scale(dpr, dpr);

    var maxVal = Math.max.apply(null, data.map(function(d){return d[1];})) || 1;
    var barH = Math.min(28, (h-40) / data.length);
    var labelW = opts.labelWidth || 100;
    var chartW = w - labelW - 50;

    data.forEach(function(item, i) {
      var label = item[0], val = item[1];
      var y = 10 + i * (barH + 4);
      ctx.fillStyle = textColor();
      ctx.font = '11px system-ui';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(label.length > 14 ? label.slice(0,13)+'…' : label, labelW - 6, y + barH/2);
      var bw = (val/maxVal) * chartW;
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.beginPath();
      ctx.rect(labelW, y, bw, barH);
      ctx.fill();
      ctx.fillStyle = textColor();
      ctx.textAlign = 'left';
      ctx.fillText(val, labelW + bw + 6, y + barH/2);
    });
  }

  function drawPieChart(canvas, data) {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = Math.min(canvas.parentElement.clientWidth || 280, 280);
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size+'px'; canvas.style.height = size+'px';
    ctx.scale(dpr, dpr);

    var total = data.reduce(function(s,d){return s+d[1];}, 0) || 1;
    var cx = size/2, cy = size/2, r = size/2 - 30, ir = r * 0.55;
    var angle = -Math.PI/2;

    data.forEach(function(item, i) {
      var label = item[0], val = item[1];
      var sweep = (val/total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle+sweep);
      ctx.arc(cx, cy, ir, angle+sweep, angle, true);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      if (sweep > 0.15) {
        var mid = angle + sweep/2;
        var lx = cx + Math.cos(mid) * (r+ir)/2;
        var ly = cy + Math.sin(mid) * (r+ir)/2;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(val/total*100)+'%', lx, ly);
      }
      angle += sweep;
    });
    ctx.fillStyle = textColor();
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy-6);
    ctx.font = '10px system-ui';
    ctx.fillText('Total', cx, cy+10);
  }

  function drawLineChart(canvas, labels, values, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.parentElement.clientWidth || 320;
    var h = opts.height || 180;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx.scale(dpr, dpr);

    var pad = { l: 40, r: 16, t: 16, b: 30 };
    var cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
    var maxV = Math.max.apply(null, values) || 1;

    ctx.strokeStyle = gridColor(); ctx.lineWidth = 0.5;
    for (var gi = 0; gi <= 4; gi++) {
      var gy = pad.t + (ch/4)*gi;
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(w-pad.r, gy); ctx.stroke();
      ctx.fillStyle = textColor(); ctx.font = '9px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxV - (maxV/4)*gi), pad.l-4, gy+3);
    }

    var pts = values.map(function(v, i) {
      return { x: pad.l + (cw/(values.length-1||1))*i, y: pad.t + ch - (v/maxV)*ch };
    });
    ctx.beginPath();
    pts.forEach(function(p, i) { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.strokeStyle = '#3D9970'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.lineTo(pts[pts.length-1].x, pad.t+ch);
    ctx.lineTo(pts[0].x, pad.t+ch);
    ctx.closePath();
    ctx.fillStyle = 'rgba(61,153,112,.12)'; ctx.fill();
    pts.forEach(function(p) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fillStyle = '#3D9970'; ctx.fill(); });
    ctx.fillStyle = textColor(); ctx.font = '9px system-ui'; ctx.textAlign = 'center';
    labels.forEach(function(l, i) {
      if (labels.length > 10 && i % 2 !== 0) return;
      ctx.fillText(l, pad.l + (cw/(labels.length-1||1))*i, h - 6);
    });
  }

  function drawHeatmap(canvas, data) {
    var regions = data.regions, types = data.types, matrix = data.matrix;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var cellW = 36, cellH = 26;
    var labelW = 110, labelH = 80;
    var w = labelW + types.length * cellW + 10;
    var h = labelH + regions.length * cellH + 10;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx.scale(dpr, dpr);
    var allVals = Object.values(matrix);
    var maxV = Math.max.apply(null, allVals) || 1;

    ctx.fillStyle = textColor(); ctx.font = '9px system-ui'; ctx.textAlign = 'center';
    types.forEach(function(t, j) {
      ctx.save();
      ctx.translate(labelW + j*cellW + cellW/2, labelH - 4);
      ctx.rotate(-Math.PI/4);
      ctx.fillText(t.length > 12 ? t.slice(0,11)+'…' : t, 0, 0);
      ctx.restore();
    });
    regions.forEach(function(r, i) {
      var y = labelH + i * cellH;
      ctx.fillStyle = textColor(); ctx.font = '10px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(r.length > 14 ? r.slice(0,13)+'…' : r, labelW - 6, y + cellH/2 + 3);
      types.forEach(function(t, j) {
        var v = matrix[r+'|'+t] || 0;
        var intensity = v / maxV;
        ctx.fillStyle = 'rgba(224,122,95,' + (0.08 + intensity * 0.9) + ')';
        ctx.fillRect(labelW + j*cellW, y, cellW-2, cellH-2);
        if (v > 0) {
          ctx.fillStyle = intensity > 0.5 ? '#fff' : textColor();
          ctx.font = '9px system-ui'; ctx.textAlign = 'center';
          ctx.fillText(v, labelW + j*cellW + cellW/2, y + cellH/2 + 3);
        }
      });
    });
  }

  // ── Panneaux ──
  function renderOverview() {
    var docs = _getDocs();
    var regions = new Set(docs.map(function(d){return d.REGION;})).size;
    var types = new Set(docs.map(function(d){return d.TYPE_INFRA;})).size;
    var avg = regions ? Math.round(docs.length / regions) : 0;
    return '<div class="stats-kpis">' +
      '<div class="stats-kpi"><div class="stats-kpi-value">' + docs.length + '</div><div class="stats-kpi-label">Infrastructures</div></div>' +
      '<div class="stats-kpi"><div class="stats-kpi-value">' + regions + '</div><div class="stats-kpi-label">Régions</div></div>' +
      '<div class="stats-kpi"><div class="stats-kpi-value">' + types + '</div><div class="stats-kpi-label">Types</div></div>' +
      '<div class="stats-kpi"><div class="stats-kpi-value">' + avg + '</div><div class="stats-kpi-label">Moy./région</div></div>' +
      '</div>' +
      '<div class="stats-chart-box"><h3>🏆 Top régions</h3><canvas id="statsBarRegion"></canvas></div>' +
      '<div class="stats-chart-box"><h3>📊 Répartition par type</h3><canvas id="statsPieType"></canvas></div>' +
      '<div class="stats-chart-box"><h3>🏘 Milieu (urbain/rural)</h3><canvas id="statsPieMilieu"></canvas></div>';
  }

  function renderRegionDetail() {
    var regions = getInfraByRegion();
    var options = regions.map(function(r){return '<option value="'+r[0]+'">'+r[0]+'</option>';}).join('');
    return '<select class="stats-region-selector" id="statsRegionSel">' + options + '</select>' +
      '<div class="stats-chart-box"><h3>Types dans cette région</h3><canvas id="statsRegionPie"></canvas></div>' +
      '<div class="stats-chart-box"><h3>Top communes</h3><canvas id="statsRegionBar"></canvas></div>';
  }

  function renderHeatmapPanel() {
    return '<div class="stats-chart-box"><h3>🗺 Carte thermique — Régions × Types</h3><canvas id="statsHeatmap"></canvas></div>' +
      '<div class="stats-heatmap-legend"><span>Densité :</span>' +
      '<span style="background:rgba(224,122,95,.1)"></span> Faible ' +
      '<span style="background:rgba(224,122,95,.5)"></span> Moyen ' +
      '<span style="background:rgba(224,122,95,.95)"></span> Fort</div>';
  }

  function renderTrendsPanel() {
    return '<div class="stats-chart-box"><h3>📈 Activité de recherche (7 jours)</h3><canvas id="statsTrends"></canvas></div>' +
      '<div class="stats-chart-box"><h3>🕐 Activité horaire</h3><canvas id="statsHourly"></canvas></div>';
  }

  function renderDiversityPanel() {
    return '<div class="stats-chart-box"><h3>🌈 Indice de diversité culturelle (Shannon)</h3><canvas id="statsDiversity"></canvas></div>' +
      '<div class="stats-chart-box"><h3>📍 Densité culturelle (%)</h3><canvas id="statsDensity"></canvas></div>';
  }

  // ── Rendu graphiques par onglet ──
  function _drawTabCharts(tabId) {
    setTimeout(function() {
      if (tabId === 'overview') {
        var c1 = document.getElementById('statsBarRegion');
        var c2 = document.getElementById('statsPieType');
        var c3 = document.getElementById('statsPieMilieu');
        if (c1) drawBarChart(c1, getInfraByRegion().slice(0,10), { height: 280 });
        if (c2) drawPieChart(c2, getInfraByType().slice(0,8));
        if (c3) drawPieChart(c3, getMilieuDistribution());
      } else if (tabId === 'region') {
        _drawRegionCharts();
      } else if (tabId === 'heatmap') {
        var c = document.getElementById('statsHeatmap');
        if (c) drawHeatmap(c, getTypeByRegion());
      } else if (tabId === 'trends') {
        _drawTrendsCharts();
      } else if (tabId === 'diversity') {
        var cd1 = document.getElementById('statsDiversity');
        var cd2 = document.getElementById('statsDensity');
        if (cd1) drawBarChart(cd1, getRegionDiversity(), { height: 320, labelWidth: 110 });
        if (cd2) drawBarChart(cd2, getCulturalDensity(), { height: 280, labelWidth: 110 });
      }
    }, 50);
  }

  function _drawRegionCharts(region) {
    var docs = _getDocs();
    var sel = region || (document.getElementById('statsRegionSel') || {}).value || '';
    if (!sel) return;
    var filtered = docs.filter(function(d){return d.REGION === sel;});
    var typeCounts = {};
    filtered.forEach(function(d){ var t = d.TYPE_INFRA||'Autre'; typeCounts[t] = (typeCounts[t]||0)+1; });
    var c1 = document.getElementById('statsRegionPie');
    if (c1) drawPieChart(c1, Object.entries(typeCounts).sort(function(a,b){return b[1]-a[1];}));
    var comCounts = {};
    filtered.forEach(function(d){ var c = d.COMMUNE||'Inconnu'; comCounts[c] = (comCounts[c]||0)+1; });
    var c2 = document.getElementById('statsRegionBar');
    if (c2) drawBarChart(c2, Object.entries(comCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,8), { height: 220 });
  }

  function _drawTrendsCharts() {
    if (typeof Analytics === 'undefined') return;
    var trends = Analytics.getSearchTrends ? Analytics.getSearchTrends() : [];
    var c1 = document.getElementById('statsTrends');
    if (c1 && trends.length) {
      drawLineChart(c1, trends.map(function(t){return t[0].slice(5);}), trends.map(function(t){return t[1];}));
    }
    var hourly = Analytics.getHourlyActivity ? Analytics.getHourlyActivity() : [];
    if (!hourly.length) hourly = new Array(24).fill(0);
    var c2 = document.getElementById('statsHourly');
    if (c2) {
      var hLabels = hourly.map(function(_, i){return i+'h';});
      drawBarChart(c2, hLabels.map(function(l,i){return [l, hourly[i]];}), { height: 200, labelWidth: 36 });
    }
  }

  // ── Export CSV ──
  function exportCSV() {
    var byRegion = getInfraByRegion();
    var csv = 'Région,Nombre\n';
    byRegion.forEach(function(r){ csv += '"' + r[0] + '",' + r[1] + '\n'; });
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'statistiques_culture_senegal.csv';
    a.click();
  }

  // ── Dashboard principal ──
  var TABS = [
    { id: 'overview', label: "Vue d'ensemble", render: renderOverview },
    { id: 'region', label: 'Régions', render: renderRegionDetail },
    { id: 'heatmap', label: 'Carte thermique', render: renderHeatmapPanel },
    { id: 'trends', label: 'Tendances', render: renderTrendsPanel },
    { id: 'diversity', label: 'Diversité', render: renderDiversityPanel }
  ];

  function open() {
    var overlay = document.getElementById('statsDashboardOverlay');
    if (overlay) { overlay.classList.add('active'); return; }
    overlay = document.createElement('div');
    overlay.className = 'stats-overlay active';
    overlay.id = 'statsDashboardOverlay';
    overlay.innerHTML =
      '<div class="stats-header">' +
        '<h2>📊 Tableau de bord culturel</h2>' +
        '<button class="stats-export-btn" id="statsExportCSV">📥 CSV</button>' +
        '<button class="stats-close" id="statsClose">✕</button>' +
      '</div>' +
      '<div class="stats-tabs">' +
        TABS.map(function(t,i){return '<button class="stats-tab'+(i===0?' active':'')+'" data-tab="'+t.id+'">'+t.label+'</button>';}).join('') +
      '</div>' +
      '<div class="stats-content" id="statsContent"></div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#statsClose').addEventListener('click', close);
    overlay.querySelector('#statsExportCSV').addEventListener('click', exportCSV);
    overlay.querySelectorAll('.stats-tab').forEach(function(btn) {
      btn.addEventListener('click', function() {
        overlay.querySelectorAll('.stats-tab').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
        _showTab(btn.dataset.tab);
      });
    });
    _showTab('overview');
  }

  function _showTab(tabId) {
    var content = document.getElementById('statsContent');
    if (!content) return;
    var tab = TABS.find(function(t){return t.id === tabId;});
    if (!tab) return;
    content.innerHTML = tab.render();
    _drawTabCharts(tabId);
    if (tabId === 'region') {
      var sel = document.getElementById('statsRegionSel');
      if (sel) sel.addEventListener('change', function(){_drawRegionCharts(sel.value);});
    }
  }

  function close() {
    var o = document.getElementById('statsDashboardOverlay');
    if (o) { o.classList.remove('active'); setTimeout(function(){o.remove();}, 300); }
  }

  function init() {
    if (document.querySelector('.stats-fab')) return;
    var fab = document.createElement('button');
    fab.className = 'stats-fab';
    fab.innerHTML = '📊';
    fab.title = 'Statistiques culturelles';
    fab.setAttribute('aria-label', 'Ouvrir le tableau de bord statistiques');
    fab.addEventListener('click', open);
    document.body.appendChild(fab);
  }

  return { init: init, open: open, close: close, exportCSV: exportCSV, getInfraByRegion: getInfraByRegion, getInfraByType: getInfraByType, getTypeByRegion: getTypeByRegion, getMilieuDistribution: getMilieuDistribution, getTopCommunes: getTopCommunes, getCulturalDensity: getCulturalDensity, getRegionDiversity: getRegionDiversity };
})();
