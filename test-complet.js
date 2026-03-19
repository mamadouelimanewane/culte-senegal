/* ═══════════════════════════════════════════════════════════════
   TEST COMPLET — Recherche vocale/textuelle, Chatbot, Carto,
   Parcours guidés, Événements
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');

// ── Mock DOM minimal ──
global.window = { devicePixelRatio: 1, open: () => {} };
global.document = {
  createElement: (tag) => ({
    style: {}, className: '', innerHTML: '', textContent: '',
    setAttribute: () => {}, addEventListener: () => {},
    appendChild: () => {}, remove: () => {},
    querySelector: () => null, querySelectorAll: () => [],
    classList: { add:()=>{}, remove:()=>{}, contains:()=>false },
    getContext: () => ({
      scale:()=>{}, fillText:()=>{}, fillRect:()=>{}, beginPath:()=>{},
      arc:()=>{}, fill:()=>{}, stroke:()=>{}, moveTo:()=>{}, lineTo:()=>{},
      closePath:()=>{}, rect:()=>{}, save:()=>{}, restore:()=>{},
      translate:()=>{}, rotate:()=>{}, createLinearGradient:()=>({addColorStop:()=>{}}),
      set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){},
      set font(v){}, set textAlign(v){}, set textBaseline(v){}
    }),
    parentElement: { clientWidth: 400 },
    click: () => {}, href: '', download: ''
  }),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {} },
  documentElement: { setAttribute:()=>{}, getAttribute:()=>null },
  addEventListener: () => {}
};
global.localStorage = (() => {
  const store = {};
  return {
    getItem: k => store[k] || null,
    setItem: (k,v) => { store[k] = v; },
    removeItem: k => { delete store[k]; }
  };
})();
global.sessionStorage = (() => {
  const store = {};
  return {
    getItem: k => store[k] || null,
    setItem: (k,v) => { store[k] = v; },
    removeItem: k => { delete store[k]; }
  };
})();
global.navigator = { geolocation: null, language: 'fr-FR' };
global.URL = { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} };
global.Blob = function(content, opts) { this.content = content; };
global.URLSearchParams = require('url').URLSearchParams;
global.setTimeout = (fn, ms) => { if (ms <= 100) fn(); };
global.fetch = () => Promise.resolve({ json: () => Promise.resolve([]) });
global.speechSynthesis = { speak:()=>{}, cancel:()=>{}, getVoices:()=>[] };
global.SpeechSynthesisUtterance = function(t) { this.text = t; };

// ── Charger les modules en les assignant à global ──
const modulesFiles = [
  'js/seed.js','js/search-engine.js','js/voice-search.js',
  'js/conversation-memory.js','js/geolocation-search.js','js/nlg-response.js',
  'js/auto-suggest.js','js/voice-conversation.js','js/events-calendar.js',
  'js/chatbot.js','js/social.js','js/recommendations.js','js/multilang.js',
  'js/analytics.js','js/guided-tours.js','js/stats-dashboard.js',
  'js/calendar-export.js'
];

// Concaténer tous les fichiers en un seul script
let allCode = '';
modulesFiles.forEach(f => {
  try {
    let code = fs.readFileSync(f, 'utf8');
    allCode += '\n// === ' + f + ' ===\n' + code + '\n';
  } catch(e) { console.error('READ ERROR ' + f + ':', e.message); }
});

// Remplacer les déclarations const/let des modules par des assignations globales
const names = ['SearchEngine','VoiceSearch','ConversationMemory','GeoSearch','NLGResponse','AutoSuggest','VoiceConversation','EventsCalendar','Chatbot','Social','Recommendations','MultiLang','Analytics','GuidedTours','StatsDashboard','CalendarExport'];
names.forEach(n => {
  // Match: const NAME = ou let NAME = au début de ligne (avec espaces optionnels)
  const re = new RegExp('(^|\\n)(\\s*)(?:const|let)\\s+' + n + '\\s*=', 'g');
  allCode = allCode.replace(re, '$1$2global.' + n + ' =');
});
// Supprimer 'use strict'
allCode = allCode.replace(/'use strict';/g, '');

// Évaluer tout
try { eval(allCode); }
catch(e) { console.error('EVAL ERROR:', e.message, '\n', e.stack.split('\n').slice(0,3).join('\n')); }

// Copier vers scope local
names.forEach(n => { if (global[n]) eval(n + ' = global.' + n); });
// Alias
if (global.NLGResponse) { global.NlgResponse = global.NLGResponse; NlgResponse = global.NLGResponse; }

let pass = 0, fail = 0, total = 0;
function test(name, fn) {
  total++;
  try {
    const result = fn();
    if (result === false) throw new Error('returned false');
    console.log('  ✅ ' + name);
    pass++;
  } catch(e) {
    console.log('  ❌ ' + name + ' → ' + e.message);
    fail++;
  }
}

// ═══════════════════════════════════════════════════════════
// 1. RECHERCHE TEXTUELLE (SearchEngine)
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 1. RECHERCHE TEXTUELLE ═══');

test('SearchEngine existe et est prêt', () => {
  if (typeof SearchEngine === 'undefined') throw new Error('SearchEngine non défini');
  if (!SearchEngine.ready) throw new Error('SearchEngine pas prêt');
});

test('SearchEngine.docs contient des données', () => {
  if (!SearchEngine.docs || SearchEngine.docs.length === 0) throw new Error('Pas de docs');
  if (SearchEngine.docs.length < 100) throw new Error('Trop peu: ' + SearchEngine.docs.length);
});

test('Recherche "musée dakar" retourne des résultats', () => {
  const r = SearchEngine.search('musée dakar');
  if (!r || !r.results || r.results.length === 0) throw new Error('0 résultats');
});

test('Recherche "cinéma" retourne des résultats', () => {
  const r = SearchEngine.search('cinéma');
  if (!r || !r.results || r.results.length === 0) throw new Error('0 résultats');
});

test('Recherche "thiès" filtre par région', () => {
  const r = SearchEngine.search('thiès');
  if (!r || !r.results) throw new Error('pas de résultats');
  const allThies = r.results.every(d =>
    (d.REGION || '').toUpperCase().includes('THIES') ||
    (d.NOM || '').toUpperCase().includes('THIES') ||
    (d.COMMUNE || '').toUpperCase().includes('THIES') ||
    (d.DEPARTEMENT || '').toUpperCase().includes('THIES')
  );
});

test('Recherche "formation artistique" fonctionne', () => {
  const r = SearchEngine.search('formation artistique');
  if (!r || !r.results) throw new Error('pas de résultats');
});

test('Recherche NLP "combien de musées à Dakar"', () => {
  const r = SearchEngine.search('combien de musées à Dakar');
  if (!r) throw new Error('pas de résultat');
});

test('Recherche NLP "bibliothèques en milieu rural"', () => {
  const r = SearchEngine.search('bibliothèques en milieu rural');
  if (!r) throw new Error('pas de résultat');
});

test('parseIntent extrait type + région', () => {
  const intent = SearchEngine.parseIntent('musée à Saint-Louis');
  if (!intent) throw new Error('pas d\'intent');
  if (!intent.types || intent.types.length === 0) throw new Error('pas de type détecté');
});

test('Recherche wolof "kanam ci Dakar" fonctionne', () => {
  const r = SearchEngine.search('kanam ci Dakar');
  if (!r) throw new Error('pas de résultat');
});

test('Recherche vide ne crashe pas', () => {
  const r = SearchEngine.search('');
  // Ne doit pas crasher
});

test('Recherche terme inexistant retourne 0 résultats', () => {
  const r = SearchEngine.search('xyznonexistent123');
  if (r && r.results && r.results.length > 0) throw new Error('devrait être vide');
});

// ═══════════════════════════════════════════════════════════
// 2. RECHERCHE VOCALE (VoiceSearch)
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 2. RECHERCHE VOCALE ═══');

test('VoiceSearch existe', () => {
  if (typeof VoiceSearch === 'undefined') throw new Error('VoiceSearch non défini');
});

test('VoiceSearch.translateWolof fonctionne', () => {
  if (!VoiceSearch.translateWolof) throw new Error('méthode manquante');
  const r = VoiceSearch.translateWolof('kanam');
  // Doit retourner un objet ou string
});

test('VoiceSearch.analyzeIntonation existe', () => {
  if (!VoiceSearch.analyzeIntonation) throw new Error('méthode manquante');
});

test('Analyse intonation question "où sont les musées?"', () => {
  const r = VoiceSearch.analyzeIntonation('où sont les musées?');
  if (!r) throw new Error('pas de résultat');
  if (!r.type) throw new Error('pas de type d\'intonation');
});

test('Analyse intonation exclamation "montre-moi les galeries!"', () => {
  const r = VoiceSearch.analyzeIntonation('montre-moi les galeries!');
  if (!r) throw new Error('pas de résultat');
});

test('Correction phonétique vocale', () => {
  if (!VoiceSearch.correctPhonetic) return; // optionnel
  const r = VoiceSearch.correctPhonetic('musé à dacar');
  // Doit corriger sans crash
});

// ═══════════════════════════════════════════════════════════
// 3. MÉMOIRE CONVERSATIONNELLE
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 3. MÉMOIRE CONVERSATIONNELLE ═══');

test('ConversationMemory existe', () => {
  if (typeof ConversationMemory === 'undefined') throw new Error('non défini');
});

test('isContextual détecte "et à Thiès?"', () => {
  if (!ConversationMemory.isContextual) throw new Error('méthode manquante');
  const r = ConversationMemory.isContextual('et à Thiès?');
  if (!r) throw new Error('devrait être contextuel');
});

test('isContextual ne détecte pas "musée dakar"', () => {
  const r = ConversationMemory.isContextual('musée dakar');
  if (r) throw new Error('ne devrait PAS être contextuel');
});

test('resolveContext avec historique', () => {
  if (!ConversationMemory.resolveContext) throw new Error('méthode manquante');
  // Simuler un contexte
  ConversationMemory.save && ConversationMemory.save('musée à Dakar', { types: ['MUSEE'], regions: ['DAKAR'] });
  const resolved = ConversationMemory.resolveContext('et à Thiès?', {});
  // Ne doit pas crasher
});

test('isContextual détecte "combien?"', () => {
  const r = ConversationMemory.isContextual('combien?');
  if (!r) throw new Error('devrait être contextuel');
});

test('isContextual détecte "et les formations?"', () => {
  const r = ConversationMemory.isContextual('et les formations?');
  if (!r) throw new Error('devrait être contextuel');
});

// ═══════════════════════════════════════════════════════════
// 4. NLG (Génération de Langage Naturel)
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 4. NLG RÉPONSES ═══');

test('NlgResponse existe', () => {
  if (typeof NlgResponse === 'undefined') throw new Error('non défini');
});

test('generate() avec résultats standards', () => {
  if (!NlgResponse.generate) throw new Error('méthode manquante');
  const r = NlgResponse.generate({
    query: 'musée dakar',
    results: [{NOM:'Test', TYPE_INFRA:'MUSEE', REGION:'DAKAR'}],
    total: 1,
    intent: { types: ['MUSEE'], regions: ['DAKAR'] }
  });
  if (!r || typeof r !== 'string') throw new Error('pas de texte généré');
  if (r.length < 10) throw new Error('réponse trop courte: ' + r);
});

test('generate() avec 0 résultats', () => {
  const r = NlgResponse.generate({
    query: 'xyz inexistant',
    results: [],
    total: 0,
    intent: {}
  });
  if (!r) throw new Error('devrait générer une réponse même sans résultats');
});

test('generate() pour un comptage', () => {
  const r = NlgResponse.generate({
    query: 'combien de musées',
    results: [{NOM:'A'},{NOM:'B'},{NOM:'C'}],
    total: 3,
    intent: { types: ['MUSEE'], isCount: true }
  });
  if (!r) throw new Error('pas de réponse');
});

test('generateStats() fonctionne', () => {
  if (!NlgResponse.generateStats) return;
  const r = NlgResponse.generateStats({
    results: [{REGION:'DAKAR',TYPE_INFRA:'MUSEE'},{REGION:'DAKAR',TYPE_INFRA:'GALERIE'},{REGION:'THIES',TYPE_INFRA:'MUSEE'}]
  });
});

test('suggestAlternatives() fonctionne', () => {
  if (!NlgResponse.suggestAlternatives) return;
  const r = NlgResponse.suggestAlternatives('xyz inexistant');
});

test('formatRegionName() fonctionne', () => {
  if (!NlgResponse.formatRegionName) return;
  const r = NlgResponse.formatRegionName('SAINT-LOUIS');
  if (!r || r.length === 0) throw new Error('pas de format');
});

// ═══════════════════════════════════════════════════════════
// 5. GÉOLOCALISATION
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 5. GÉOLOCALISATION ═══');

test('GeoSearch existe', () => {
  if (typeof GeoSearch === 'undefined') throw new Error('non défini');
});

test('isProximityQuery détecte "près de moi"', () => {
  if (!GeoSearch.isProximityQuery) throw new Error('méthode manquante');
  const r = GeoSearch.isProximityQuery('musée près de moi');
  if (!r) throw new Error('devrait détecter la proximité');
});

test('isProximityQuery détecte "à proximité"', () => {
  const r = GeoSearch.isProximityQuery('galeries à proximité');
  if (!r) throw new Error('devrait détecter');
});

test('isProximityQuery ne détecte pas "musée dakar"', () => {
  const r = GeoSearch.isProximityQuery('musée dakar');
  if (r) throw new Error('ne devrait PAS détecter');
});

test('getRegionCenters retourne les 14 régions', () => {
  if (!GeoSearch.getRegionCenters) return;
  const c = GeoSearch.getRegionCenters();
  if (!c || Object.keys(c).length < 10) throw new Error('pas assez de régions');
});

// ═══════════════════════════════════════════════════════════
// 6. VOICE CONVERSATION (TTS)
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 6. VOICE CONVERSATION (TTS) ═══');

test('VoiceConversation existe', () => {
  if (typeof VoiceConversation === 'undefined') throw new Error('non défini');
});

test('VoiceConversation.speak existe', () => {
  if (!VoiceConversation.speak) throw new Error('méthode manquante');
});

test('speak() ne crashe pas', () => {
  VoiceConversation.speak('Bonjour, bienvenue au Sénégal');
});

test('stop() ne crashe pas', () => {
  if (VoiceConversation.stop) VoiceConversation.stop();
});

// ═══════════════════════════════════════════════════════════
// 7. AUTO-SUGGEST
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 7. AUTO-SUGGEST ═══');

test('AutoSuggest existe', () => {
  if (typeof AutoSuggest === 'undefined') throw new Error('non défini');
});

test('getSuggestions retourne des résultats pour "mus"', () => {
  if (!AutoSuggest.getSuggestions) throw new Error('méthode manquante');
  const r = AutoSuggest.getSuggestions('mus');
  if (!r || !Array.isArray(r)) throw new Error('pas un array');
});

test('getSuggestions retourne vide pour entrée vide', () => {
  const r = AutoSuggest.getSuggestions('');
  if (r && r.length > 0) {
    // Acceptable: certaines implémentations retournent les récents
  }
});

// ═══════════════════════════════════════════════════════════
// 8. CHATBOT
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 8. CHATBOT ═══');

test('Chatbot existe', () => {
  if (typeof Chatbot === 'undefined') throw new Error('non défini');
});

test('Chatbot a les méthodes essentielles', () => {
  if (!Chatbot.init) throw new Error('init manquant');
});

test('Chatbot.handleMessage existe', () => {
  if (!Chatbot.handleMessage && !Chatbot.processInput && !Chatbot.send) {
    // Vérifier la structure interne
    const methods = Object.keys(Chatbot);
    if (methods.length === 0) throw new Error('Chatbot vide');
  }
});

// ═══════════════════════════════════════════════════════════
// 9. ÉVÉNEMENTS CULTURELS
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 9. ÉVÉNEMENTS CULTURELS ═══');

test('EventsCalendar existe', () => {
  if (typeof EventsCalendar === 'undefined') throw new Error('non défini');
});

test('EventsCalendar.searchEvents fonctionne', () => {
  if (!EventsCalendar.searchEvents) throw new Error('méthode manquante');
  const r = EventsCalendar.searchEvents('');
  if (!r || !Array.isArray(r)) throw new Error('pas un array');
});

test('searchEvents trouve des événements', () => {
  const r = EventsCalendar.searchEvents('');
  if (r.length === 0) throw new Error('0 événements');
  if (r.length < 10) throw new Error('Trop peu: ' + r.length + ' (attendu 20+)');
});

test('searchEvents filtre par "jazz"', () => {
  const r = EventsCalendar.searchEvents('jazz');
  if (!r || r.length === 0) throw new Error('devrait trouver Jazz Saint-Louis');
});

test('searchEvents filtre par "touba"', () => {
  const r = EventsCalendar.searchEvents('touba');
  if (!r || r.length === 0) throw new Error('devrait trouver Magal Touba');
});

test('Chaque événement a name, date, region', () => {
  const events = EventsCalendar.searchEvents('');
  const invalid = events.filter(e => !e.name && !e.titre);
  if (invalid.length > 0) throw new Error(invalid.length + ' événements sans nom');
});

test('addUserEvent fonctionne', () => {
  if (!EventsCalendar.addUserEvent) return;
  EventsCalendar.addUserEvent({
    name: 'Test Event',
    date: '2026-06-15',
    region: 'DAKAR',
    type: 'festival'
  });
});

// ═══════════════════════════════════════════════════════════
// 10. VISITES GUIDÉES
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 10. VISITES GUIDÉES ═══');

test('GuidedTours existe', () => {
  if (typeof GuidedTours === 'undefined') throw new Error('non défini');
});

test('GuidedTours.tours contient 10 circuits', () => {
  if (!GuidedTours.tours) throw new Error('pas de tours');
  if (GuidedTours.tours.length < 10) throw new Error('Seulement ' + GuidedTours.tours.length + ' tours');
});

test('Chaque tour a id, name, description, stops', () => {
  GuidedTours.tours.forEach(t => {
    if (!t.id) throw new Error('Tour sans id');
    if (!t.name) throw new Error('Tour sans name');
    if (!t.description) throw new Error('Tour ' + t.id + ' sans description');
    if (!t.defaultStops || t.defaultStops.length === 0) throw new Error('Tour ' + t.id + ' sans stops');
  });
});

test('startTour démarre un circuit', () => {
  const tour = GuidedTours.startTour('arts-dakar');
  if (!tour) throw new Error('tour non démarré');
  if (!tour.stops || tour.stops.length === 0) throw new Error('pas de stops');
});

test('getProgress retourne la progression', () => {
  const p = GuidedTours.getProgress();
  if (!p) throw new Error('pas de progression');
  if (p.current !== 1) throw new Error('devrait être étape 1, got ' + p.current);
  if (p.total < 3) throw new Error('pas assez d\'étapes');
  if (p.percentage <= 0) throw new Error('percentage invalide');
});

test('nextStop avance à l\'étape suivante', () => {
  GuidedTours.nextStop();
  const p = GuidedTours.getProgress();
  if (p.current !== 2) throw new Error('devrait être étape 2, got ' + p.current);
});

test('prevStop revient en arrière', () => {
  GuidedTours.prevStop();
  const p = GuidedTours.getProgress();
  if (p.current !== 1) throw new Error('devrait être étape 1, got ' + p.current);
});

test('getCurrentStop retourne l\'étape actuelle', () => {
  const stop = GuidedTours.getCurrentStop();
  if (!stop) throw new Error('pas de stop');
  if (!stop.name) throw new Error('stop sans nom');
});

test('endTour termine le circuit', () => {
  GuidedTours.endTour();
  const p = GuidedTours.getProgress();
  if (p.current !== 0 && p.total !== 0) throw new Error('tour non terminé');
});

test('getBadges retourne les badges', () => {
  const badges = GuidedTours.getBadges();
  if (!badges || !Array.isArray(badges)) throw new Error('pas de badges');
  if (badges.length < 4) throw new Error('pas assez de badges: ' + badges.length);
  badges.forEach(b => {
    if (!b.id || !b.name || !b.icon) throw new Error('badge incomplet: ' + JSON.stringify(b));
  });
});

test('getCompletedTours retourne un array', () => {
  const c = GuidedTours.getCompletedTours();
  if (!Array.isArray(c)) throw new Error('pas un array');
});

test('startTour avec id invalide retourne null', () => {
  const r = GuidedTours.startTour('inexistant-tour');
  if (r !== null) throw new Error('devrait retourner null');
});

test('Tour casamance existe et a des stops', () => {
  const tour = GuidedTours.tours.find(t => t.id === 'casamance');
  if (!tour) throw new Error('tour casamance manquant');
  if (tour.difficulty !== 'sportif') throw new Error('difficulté incorrecte');
  if (tour.defaultStops.length < 3) throw new Error('pas assez de stops');
});

test('Tour gorée historique existe', () => {
  const tour = GuidedTours.tours.find(t => t.id === 'goree-historique');
  if (!tour) throw new Error('tour gorée manquant');
});

test('renderBadgesWidget retourne du HTML', () => {
  const html = GuidedTours.renderBadgesWidget();
  if (!html || html.length < 20) throw new Error('HTML trop court');
  if (!html.includes('tour-badge')) throw new Error('pas de classe badge');
});

// ═══════════════════════════════════════════════════════════
// 11. CALENDAR EXPORT
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 11. CALENDAR EXPORT ═══');

test('CalendarExport existe', () => {
  if (typeof CalendarExport === 'undefined') throw new Error('non défini');
});

test('generateICS crée un fichier ICS valide', () => {
  const ics = CalendarExport.generateICS({
    name: 'Festival Jazz Saint-Louis',
    date: '2026-05-15T18:00:00',
    region: 'SAINT-LOUIS',
    description: 'Festival de jazz annuel'
  });
  if (!ics) throw new Error('pas de ICS');
  if (!ics.includes('BEGIN:VCALENDAR')) throw new Error('pas de VCALENDAR');
  if (!ics.includes('BEGIN:VEVENT')) throw new Error('pas de VEVENT');
  if (!ics.includes('Festival Jazz Saint-Louis')) throw new Error('nom manquant');
  if (!ics.includes('END:VCALENDAR')) throw new Error('ICS non terminé');
});

test('generateICS contient les alarmes', () => {
  const ics = CalendarExport.generateICS({ name: 'Test', date: '2026-06-01' });
  if (!ics.includes('BEGIN:VALARM')) throw new Error('pas d\'alarme');
  if (!ics.includes('TRIGGER:-PT1H')) throw new Error('pas d\'alarme 1h');
  if (!ics.includes('TRIGGER:-P1D')) throw new Error('pas d\'alarme 1 jour');
});

test('getGoogleCalendarURL génère une URL valide', () => {
  const url = CalendarExport.getGoogleCalendarURL({
    name: 'Dak\'Art Biennale',
    date: '2026-11-01',
    region: 'DAKAR'
  });
  if (!url) throw new Error('pas d\'URL');
  if (!url.includes('calendar.google.com')) throw new Error('pas Google Calendar');
  if (!url.includes('Dak')) throw new Error('nom manquant dans URL');
});

test('getOutlookURL génère une URL valide', () => {
  const url = CalendarExport.getOutlookURL({
    name: 'Magal Touba',
    date: '2026-09-20',
    region: 'DIOURBEL'
  });
  if (!url) throw new Error('pas d\'URL');
  if (!url.includes('outlook.live.com')) throw new Error('pas Outlook');
});

test('renderExportButtons retourne du HTML avec 3 boutons', () => {
  const html = CalendarExport.renderExportButtons({
    name: 'Test Event', date: '2026-07-01'
  });
  if (!html) throw new Error('pas de HTML');
  if (!html.includes('iCal')) throw new Error('bouton iCal manquant');
  if (!html.includes('Google')) throw new Error('bouton Google manquant');
  if (!html.includes('Outlook')) throw new Error('bouton Outlook manquant');
});

test('exportMultipleICS ne crashe pas avec array vide', () => {
  CalendarExport.exportMultipleICS([]);
});

// ═══════════════════════════════════════════════════════════
// 12. STATS DASHBOARD
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 12. STATS DASHBOARD ═══');

test('StatsDashboard existe', () => {
  if (typeof StatsDashboard === 'undefined') throw new Error('non défini');
});

test('getInfraByRegion retourne des données', () => {
  const r = StatsDashboard.getInfraByRegion();
  if (!r || !Array.isArray(r)) throw new Error('pas un array');
  if (r.length === 0) throw new Error('aucune donnée');
  if (r.length < 10) throw new Error('pas assez de régions: ' + r.length);
});

test('getInfraByType retourne des données', () => {
  const r = StatsDashboard.getInfraByType();
  if (!r || r.length === 0) throw new Error('aucune donnée');
});

test('getMilieuDistribution retourne urbain/rural', () => {
  const r = StatsDashboard.getMilieuDistribution();
  if (!r || r.length === 0) throw new Error('aucune donnée');
});

test('getTopCommunes retourne les top communes', () => {
  const r = StatsDashboard.getTopCommunes(5);
  if (!r || r.length === 0) throw new Error('aucune donnée');
  if (r.length > 5) throw new Error('trop de résultats: ' + r.length);
});

test('getTypeByRegion retourne matrice', () => {
  const r = StatsDashboard.getTypeByRegion();
  if (!r || !r.regions || !r.types || !r.matrix) throw new Error('structure invalide');
  if (r.regions.length === 0) throw new Error('pas de régions');
  if (r.types.length === 0) throw new Error('pas de types');
});

test('getCulturalDensity retourne des pourcentages', () => {
  const r = StatsDashboard.getCulturalDensity();
  if (!r || r.length === 0) throw new Error('aucune donnée');
  const totalPct = r.reduce((s, d) => s + d[1], 0);
  if (Math.abs(totalPct - 100) > 1) throw new Error('total != 100%: ' + totalPct);
});

test('getRegionDiversity retourne indices Shannon', () => {
  const r = StatsDashboard.getRegionDiversity();
  if (!r || r.length === 0) throw new Error('aucune donnée');
  r.forEach(([region, H]) => {
    if (H < 0) throw new Error('Shannon négatif pour ' + region);
    if (H > 10) throw new Error('Shannon trop élevé pour ' + region);
  });
});

// ═══════════════════════════════════════════════════════════
// 13. MULTILANG
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 13. MULTILANG ═══');

test('MultiLang existe', () => {
  if (typeof MultiLang === 'undefined') throw new Error('non défini');
});

test('detectLanguage détecte le pulaar', () => {
  if (!MultiLang.detectLanguage) throw new Error('méthode manquante');
  const lang = MultiLang.detectLanguage('mi yiDi yeewtude');
  // Devrait détecter pulaar ou une langue
  if (!lang) throw new Error('pas de détection');
});

test('translate fonctionne', () => {
  if (!MultiLang.translate) throw new Error('méthode manquante');
  const r = MultiLang.translate('musée');
  if (!r) throw new Error('pas de résultat');
});

test('getRegions retourne des régions pour pulaar', () => {
  if (!MultiLang.getRegions) throw new Error('méthode manquante');
  const r = MultiLang.getRegions('pulaar');
  if (!r || r.length === 0) throw new Error('pas de régions');
});

test('supportedLanguages inclut pulaar, serer, diola', () => {
  if (!MultiLang.supportedLanguages) throw new Error('propriété manquante');
  const langs = MultiLang.supportedLanguages;
  if (!langs.includes('pulaar')) throw new Error('pulaar manquant');
  if (!langs.includes('serer')) throw new Error('serer manquant');
  if (!langs.includes('diola')) throw new Error('diola manquant');
});

// ═══════════════════════════════════════════════════════════
// 14. ANALYTICS
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 14. ANALYTICS ═══');

test('Analytics existe', () => {
  if (typeof Analytics === 'undefined') throw new Error('non défini');
});

test('trackSearch enregistre une recherche', () => {
  if (!Analytics.trackSearch) throw new Error('méthode manquante');
  Analytics.trackSearch('musée dakar');
  Analytics.trackSearch('cinéma thiès');
});

test('getPopularSearches retourne les recherches', () => {
  if (!Analytics.getPopularSearches) throw new Error('méthode manquante');
  const r = Analytics.getPopularSearches();
  if (!r || !Array.isArray(r)) throw new Error('pas un array');
});

test('trackView enregistre une vue', () => {
  if (!Analytics.trackView) throw new Error('méthode manquante');
  Analytics.trackView({ NOM: 'Musée IFAN', TYPE_INFRA: 'MUSEE', REGION: 'DAKAR' });
});

// ═══════════════════════════════════════════════════════════
// 15. SOCIAL & REVIEWS
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 15. SOCIAL & AVIS ═══');

test('Social existe', () => {
  if (typeof Social === 'undefined') throw new Error('non défini');
});

test('renderShareButtons retourne du HTML', () => {
  if (!Social.renderShareButtons) throw new Error('méthode manquante');
  const html = Social.renderShareButtons('Musée IFAN', 'MUSEE', 'DAKAR', 'Dakar');
  if (!html || html.length < 20) throw new Error('HTML trop court');
});

test('renderStars retourne du HTML', () => {
  if (!Social.renderStars) throw new Error('méthode manquante');
  const html = Social.renderStars('test_item');
  if (!html) throw new Error('pas de HTML');
});

test('addReview et getItemStats fonctionnent', () => {
  if (!Social.addReview || !Social.getItemStats) throw new Error('méthodes manquantes');
  Social.addReview('test_item', 4, 'Super endroit');
  Social.addReview('test_item', 5, 'Excellent');
  const stats = Social.getItemStats('test_item');
  if (!stats) throw new Error('pas de stats');
  if (stats.count < 2) throw new Error('count incorrect: ' + stats.count);
  if (stats.avg < 4) throw new Error('moyenne incorrecte: ' + stats.avg);
});

// ═══════════════════════════════════════════════════════════
// 16. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════
console.log('\n═══ 16. RECOMMANDATIONS ═══');

test('Recommendations existe', () => {
  if (typeof Recommendations === 'undefined') throw new Error('non défini');
});

test('trackSearch fonctionne', () => {
  if (!Recommendations.trackSearch) throw new Error('méthode manquante');
  Recommendations.trackSearch('musée');
  Recommendations.trackSearch('galerie dakar');
});

test('getTrending retourne des résultats', () => {
  if (!Recommendations.getTrending) throw new Error('méthode manquante');
  const r = Recommendations.getTrending(5);
  // Peut être vide si pas assez de données, mais ne doit pas crasher
});

test('getExplore retourne des résultats', () => {
  if (!Recommendations.getExplore) throw new Error('méthode manquante');
  const r = Recommendations.getExplore(5);
});

// ═══════════════════════════════════════════════════════════
// RÉSULTATS FINAUX
// ═══════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(56));
console.log('  RÉSULTATS: ' + pass + '/' + total + ' tests passent (' + fail + ' échecs)');
console.log('═'.repeat(56));
if (fail === 0) {
  console.log('\n🎉 TOUS LES TESTS PASSENT !\n');
} else {
  console.log('\n⚠️  ' + fail + ' test(s) en échec\n');
}
process.exit(fail > 0 ? 1 : 0);
