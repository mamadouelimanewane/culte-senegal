/* ════════════════════════════════════════════════════════════════
   TEST — Phrases plausibles enrichies (FR + Wolof)
   ════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
function mkEl(){return{id:'',className:'',innerHTML:'',textContent:'',value:'',style:{},dataset:{},disabled:false,title:'',appendChild:()=>{},insertBefore:()=>{},querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{},removeEventListener:()=>{},classList:{add:()=>{},remove:()=>{},contains:()=>false,toggle:()=>{}},parentNode:{replaceChild:()=>{}},parentElement:{querySelector:()=>null},closest:()=>null,cloneNode:function(){return this},nextSibling:null,getBoundingClientRect:()=>({left:0,top:0,bottom:0,width:300}),setAttribute:()=>{}};}
global.document={createElement:()=>mkEl(),body:{appendChild:()=>{},classList:{toggle:()=>{}}},getElementById:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}};
global.window={SpeechRecognition:null,webkitSpeechRecognition:null,innerWidth:400,scrollY:0,addEventListener:()=>{}};
global.localStorage={getItem:()=>null,setItem:()=>{}};
global.history={pushState:()=>{}};
const SE=(new Function('window','document',fs.readFileSync('js/search-engine.js','utf8')+';return SearchEngine;'))(global.window,global.document);
const VS=(new Function('window','document',fs.readFileSync('js/voice-search.js','utf8')+';return VoiceSearch;'))(global.window,global.document);
const infras=JSON.parse(fs.readFileSync('infrastructures_culturelles.json','utf8')).sheets.INFRASTRUCTURES_CULTURELLES.records;
const forms=JSON.parse(fs.readFileSync('centre_formation_arts.json','utf8')).sheets.CENTRE_FORMATION_CULTURE.records;
SE.buildIndex(infras,forms);

let _p=0,_f=0;
function t(name,fn){try{const r=fn();if(r===false)throw new Error('false');_p++;console.log('  ✅',name);}catch(e){_f++;console.log('  ❌',name,'—',e.message);}}
function gt(v,min,m){if(v<=min)throw new Error((m||'')+' got '+v+', need >'+min);}
function inc(a,v,m){if(!a.includes(v))throw new Error((m||'')+' missing '+v+' in ['+a+']');}
function ok(c,m){if(!c)throw new Error(m||'assertion failed');}

// ═══════════════════════════════════════════════════════════
// A. PHRASES INTERROGATIVES FR — toutes doivent → isQuestion
// ═══════════════════════════════════════════════════════════
console.log('\n══ A. Phrases interrogatives FR → isQuestion ══');

const questionPhrases = [
  // Interrogatifs directs
  "où sont les musées de Dakar",
  "où est la bibliothèque la plus proche",
  "où se trouve le cinéma de Thiès",
  "où trouver des galeries à Ziguinchor",
  "où aller pour voir de l'art à Dakar",
  "quel musée visiter à Saint-Louis",
  "quelle galerie à Dakar",
  "quels sont les cinémas à Kaolack",
  "quelles formations à Thiès",
  // Est-ce que / Y a-t-il
  "est-ce qu'il y a des musées à Matam",
  "y a-t-il des cinémas à Kédougou",
  "il y a des galeries à Fatick",
  "existe-t-il des bibliothèques à Kolda",
  // Verbes de recherche
  "je cherche un musée à Dakar",
  "je recherche des formations artistiques",
  "trouver des galeries à Mbour",
  // Volonté / désir
  "je veux voir les musées de Gorée",
  "je voudrais visiter des galeries",
  "j'aimerais découvrir la culture à Ziguinchor",
  "je souhaite explorer les musées",
  // Impératifs / demandes
  "montre-moi les cinémas de Dakar",
  "montrez-moi les bibliothèques",
  "affiche les galeries de Thiès",
  "affichez les musées de Saint-Louis",
  "liste les formations à Dakar",
  "dites-moi les musées de Kaolack",
  "dis-moi où sont les cinémas",
  "donne-moi la liste des galeries",
  "donnez-moi les bibliothèques de Dakar",
  "indique-moi les musées de Gorée",
  "présente-moi les formations d'art",
  "recommande-moi des galeries",
  "suggère-moi des musées à visiter",
  "propose-moi des cinémas à Dakar",
  // Conseils
  "conseillez-moi des musées à Dakar",
  "les meilleurs musées du Sénégal",
  "les plus beaux musées de Dakar",
  "top galeries de Dakar",
  "incontournables à Saint-Louis",
  // Actions / découverte
  "visiter des musées à Dakar",
  "voir des galeries à Thiès",
  "découvrir la culture de Ziguinchor",
  "explorer les musées du Sénégal",
  "connaitre les galeries d'art",
  "apprendre la musique à Dakar",
  // Orientées objectif
  "que peut-on voir à Dakar",
  "que voir à Saint-Louis",
  "que faire à Ziguinchor",
  "quoi visiter à Kaolack",
  "quoi comme activités à Thiès",
  "on peut visiter quoi à Dakar",
  "un endroit pour voir de l'art",
  "un lieu pour apprendre la danse",
  "envie de voir des galeries",
  "à la recherche de musées",
  // Questions indirectes
  "quelque chose à voir à Dakar",
  "un coin culturel à Dakar",
  "disponible à Dakar en musée",
  "intéressant à visiter à Saint-Louis",
  "à ne pas manquer à Dakar",
  // Cours / formation
  "où apprendre la peinture à Dakar",
  "cours de musique à Thiès",
  "formation en audiovisuel à Dakar",
  "école de danse à Ziguinchor",
];

for (const phrase of questionPhrases) {
  t(`"${phrase.substring(0,50)}..." → isQuestion`, () => {
    const r = SE.search(phrase);
    ok(r.intent.isQuestion, 'not isQuestion for: ' + phrase);
    gt(r.results.length, 0, phrase);
  });
}

// ═══════════════════════════════════════════════════════════
// B. COMMANDES VOCALES — parsées correctement
// ═══════════════════════════════════════════════════════════
console.log('\n══ B. Commandes vocales FR parsées ══');

const voiceCmdTests = [
  // Impératifs classiques
  { q: "montre-moi les musées à Dakar", query: 'musées', region: 'Dakar' },
  { q: "trouve-moi des galeries à Thiès", query: 'galeries', region: 'Thiès' },
  { q: "cherche les cinémas à Kaolack", query: 'cinémas', region: 'Kaolack' },
  { q: "voir les bibliothèques à Matam", query: 'bibliothèques', region: 'Matam' },
  // Impératifs variés
  { q: "indique-moi les musées à Saint-Louis", query: 'musées', region: 'Saint-Louis' },
  { q: "présente-moi les galeries à Dakar", query: 'galeries', region: 'Dakar' },
  { q: "recommande-moi des musées à Ziguinchor", query: 'musées', region: 'Ziguinchor' },
  // Questions
  { q: "où sont les musées à Dakar", query: 'musées', region: 'Dakar' },
  { q: "où se trouvent les galeries", query: 'galeries', region: null },
  { q: "combien de cinémas à Thiès", query: 'cinémas', region: 'Thiès', count: true },
  // Familières
  { q: "c'est quoi les musées à Dakar", query: 'musées', region: 'Dakar' },
  { q: "je voudrais voir des galeries à Thiès", query: 'galeries', region: 'Thiès' },
  { q: "je cherche un musée à Kaolack", query: 'musée', region: 'Kaolack' },
  { q: "est-ce qu'il y a des cinémas à Dakar", query: 'cinémas', region: 'Dakar' },
  { q: "dites-moi les bibliothèques à Matam", query: 'bibliothèques', region: 'Matam' },
  { q: "donne-moi les musées", query: 'musées', region: null },
  // Objectif
  { q: "que peut-on visiter à Saint-Louis", query: 'culture', region: 'Saint-Louis' },
  { q: "quoi voir à Ziguinchor", query: 'culture', region: 'Ziguinchor' },
  { q: "activités culturelles à Thiès", query: 'culture', region: 'Thiès' },
  { q: "lieux culturels à Dakar", query: 'culture', region: 'Dakar' },
  // Formation
  { q: "où apprendre la peinture à Dakar", query: null, region: 'Dakar' }, // query contient "formation"
  { q: "cours de musique à Thiès", query: null, region: 'Thiès' },
  // Proximité
  { q: "musées près de Gorée", near: 'Gorée' },
  { q: "galeries à proximité de Mbour", near: 'Mbour' },
  // Contexte / situation
  { q: "je suis à Dakar, que voir", query: 'culture', region: 'Dakar' },
  // Conseils
  { q: "les meilleurs musées à Dakar", query: 'musées', region: 'Dakar' },
  { q: "top galeries à Thiès", query: 'galeries', region: 'Thiès' },
  // Sans région
  { q: "montre-moi les galeries", query: 'galeries', region: null },
  { q: "liste les musées", query: 'musées', region: null },
  { q: "cherche des cinémas", query: 'cinémas', region: null },
  { q: "trouve les bibliothèques", query: 'bibliothèques', region: null },
];

for (const tc of voiceCmdTests) {
  t(`CMD: "${tc.q.substring(0,45)}..."`, () => {
    const c = VS.parseVoiceCommand(tc.q);
    ok(c, 'non parsé: ' + tc.q);
    if (tc.query) ok(c.query.toLowerCase().includes(tc.query.toLowerCase()), 'query "'+c.query+'" missing "'+tc.query+'"');
    if (tc.region !== undefined) {
      if (tc.region === null) ok(!c.region, 'region should be null, got: '+c.region);
      else ok(c.region && c.region.includes(tc.region), 'region "'+c.region+'" != "'+tc.region+'"');
    }
    if (tc.count) ok(c.countMode, 'not countMode');
    if (tc.near) ok(c.near && c.near.includes(tc.near), 'near "'+c.near+'" missing "'+tc.near+'"');
  });
}

// ═══════════════════════════════════════════════════════════
// C. PHRASES WOLOF — correctement traduites
// ═══════════════════════════════════════════════════════════
console.log('\n══ C. Phrases Wolof traduites ══');

const wolofTests = [
  { wo: 'fan la musee', fr: 'où est musée' },
  { wo: 'fan la nekk galerie ci ndakaaru', fr: 'où est galerie' },
  { wo: 'ana musee ci ndar', fr: 'où est musée' },
  { wo: 'won ma galerie ci ndakaaru', fr: 'montre-moi galerie' },
  { wo: 'wone ma musee', fr: 'montre-moi musée' },
  { wo: 'jox ma musee ci ndar', fr: 'donne-moi musée' },
  { wo: 'wax ma galerie ci ndakaaru', fr: 'dis-moi galerie' },
  { wo: 'nata musee ci ndakaaru', fr: 'combien de musée' },
  { wo: 'nata lay cinema', fr: 'combien de cinema' },
  { wo: 'seet musee', fr: 'chercher musée' },
  { wo: 'seetlu galerie ci ndar', fr: 'rechercher galerie' },
  { wo: 'dama buga gis musee', fr: 'je veux voir musée' },
  { wo: 'dama buga dem ci ndakaaru', fr: 'je veux aller à Dakar' },
  { wo: 'dama buga jang peinture', fr: 'je veux apprendre peinture' },
  { wo: 'dama seet cinema', fr: 'je cherche cinema' },
  { wo: 'lu am ci ndakaaru', fr: "qu'y a-t-il à Dakar" },
  { wo: 'lu nekk ci ndar', fr: "qu'y a-t-il à Saint-Louis" },
  { wo: 'am na musee ci ndakaaru', fr: 'y a-t-il musée à Dakar' },
  { wo: 'ndax am na cinema ci ndar', fr: "est-ce qu'il y a cinema" },
  { wo: 'dem ci ndakaaru', fr: 'aller à Dakar' },
  { wo: 'lu baax ci ndakaaru', fr: 'quoi de bien à Dakar' },
  { wo: 'nanga def', fr: 'bonjour' },
  { wo: 'baal ma', fr: 'excusez-moi' },
  { wo: 'yepp musee ci ndakaaru', fr: 'tous les musée à Dakar' },
];

for (const tc of wolofTests) {
  t(`WO: "${tc.wo}" → contient "${tc.fr.substring(0,30)}"`, () => {
    const tr = VS.translateWolofToFrench(tc.wo);
    ok(tr.text.toLowerCase().includes(tc.fr.toLowerCase()),
      '"'+tc.fr+'" not in "'+tr.text+'"');
  });
}

// ═══════════════════════════════════════════════════════════
// D. PHRASES FR COMPLEXES — résultats + intent correct
// ═══════════════════════════════════════════════════════════
console.log('\n══ D. Phrases FR complexes → résultats ══');

const complexTests = [
  // Avec préposition variée
  { q: "les musées de la région de Dakar", types: ['Musée'], regions: ['DAKAR'] },
  { q: "cinémas en zone urbaine", types: ['Cinéma'], milieu: 'URBAIN' },
  { q: "galeries d'art à Saint-Louis", types: ['Galerie'], regions: ['SAINT LOUIS'] },
  { q: "foyers des jeunes en milieu rural", types: ['Foyer des jeunes'], milieu: 'RURAL' },
  // Avec quantité
  { q: "combien de musées à Dakar", quantity: 'count', types: ['Musée'], regions: ['DAKAR'] },
  { q: "le nombre total de cinémas", quantity: 'count', types: ['Cinéma'] },
  // Avec exclusion (nouveau)
  { q: "musées sauf Dakar", types: ['Musée'] },
  { q: "galeries hors Thiès", types: ['Galerie'] },
  // Formulations élaborées
  { q: "je souhaite explorer les musées et galeries de Dakar", types: ['Musée'], regions: ['DAKAR'] },
  { q: "quelqu'un peut me recommander une galerie à Thiès", types: ['Galerie'], regions: ['THIES'] },
  { q: "les lieux culturels incontournables à Ziguinchor", regions: ['ZIGUINCHOR'] },
  { q: "les espaces culturels pour les jeunes à Dakar", types: ['Foyer des jeunes'], regions: ['DAKAR'] },
  { q: "où apprendre la peinture au Sénégal", formation: true },
  { q: "école de musique à Dakar", formation: true, regions: ['DAKAR'] },
  { q: "les artisans de Thiès", types: ['Village artisanal'], regions: ['THIES'] },
  { q: "salle de spectacle urbaine Dakar", types: ['Salle de spectacle'], milieu: 'URBAIN', regions: ['DAKAR'] },
  // Noms de localités
  { q: "musée Gorée", regions: ['DAKAR'] },
  { q: "galerie Mbour", regions: ['THIES'] },
  { q: "culture Podor", regions: ['SAINT LOUIS'] },
];

for (const tc of complexTests) {
  t(`"${tc.q.substring(0,50)}..."`, () => {
    const r = SE.search(tc.q);
    gt(r.results.length, 0, tc.q);
    if (tc.types) {
      for (const tp of tc.types) ok(r.intent.types.includes(tp), 'missing type '+tp+', got: '+r.intent.types);
    }
    if (tc.regions) {
      for (const rg of tc.regions) inc(r.intent.regions, rg);
    }
    if (tc.milieu) ok(r.intent.milieu === tc.milieu, 'milieu: '+r.intent.milieu);
    if (tc.quantity) ok(r.intent.quantity === tc.quantity, 'quantity: '+r.intent.quantity);
    if (tc.formation) ok(r.intent.wantFormations, 'not wantFormations');
  });
}

// ═══════════════════════════════════════════════════════════
// E. PIPELINE VOCAL COMPLET ENRICHI (Speech FR → Wolof → FR → résultats)
// ═══════════════════════════════════════════════════════════
console.log('\n══ E. Pipeline vocal complet enrichi ══');

const pipelineTests = [
  { speech: 'vont ma les musee ci end art', desc: 'montre musée Saint-Louis', minResults: 1 },
  { speech: 'natte à cinema ci dague à na', desc: 'combien cinéma Dagana', minResults: 0 },
  { speech: 'fan la galerie ci gombo', desc: 'où galerie Mbour', minResults: 0 },
  { speech: 'dama set formation ci ndakaaru', desc: 'je cherche formation Dakar', minResults: 1 },
  { speech: 'guervel ci ndar', desc: 'griot Saint-Louis', minResults: 0 },
  { speech: 'le gai ci ndakaaru', desc: 'liggey (travail) Dakar', minResults: 0 },
  { speech: 'tasse ou ci ndar', desc: 'taasu Saint-Louis', minResults: 0 },
  { speech: 'mari bout ci touba', desc: 'marabout Diourbel', minResults: 0 },
  { speech: 'musées à Dakar', desc: 'FR direct', minResults: 10 },
  { speech: 'je voudrais voir des galeries à Thiès', desc: 'FR familier', minResults: 1 },
  { speech: 'que peut-on visiter à Saint-Louis', desc: 'FR objectif', minResults: 10 },
];

for (const tc of pipelineTests) {
  t(`PIPE: "${tc.speech}" (${tc.desc})`, () => {
    const lang = VS.detectLanguage(tc.speech);
    let searchText = tc.speech;
    if (lang.language === 'wo') {
      const tr = VS.translateWolofToFrench(tc.speech);
      if (tr.wasTranslated) searchText = tr.text;
    }
    // Si c'est une commande vocale, parser
    const cmd = VS.parseVoiceCommand(searchText);
    if (cmd) {
      searchText = cmd.query;
      if (cmd.region) searchText += ' ' + cmd.region;
    }
    const r = SE.search(searchText);
    console.log(`      🔊 "${tc.speech}" → 🔤 "${searchText}" → ${r.results.length} rés.`);
    if (tc.minResults > 0) gt(r.results.length, tc.minResults - 1, tc.desc);
  });
}

// ═══════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════
const total = _p + _f;
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log(`║  TESTS PHRASES: ${_p} ✅  ${_f} ❌  sur ${total} tests`);
console.log('╚══════════════════════════════════════════════════════╝');
if(_f>0){console.log('\n⚠️  '+_f+' test(s) échoué(s)');process.exit(1);}
else console.log('\n🎉 TOUS LES TESTS DE PHRASES PASSENT !');
