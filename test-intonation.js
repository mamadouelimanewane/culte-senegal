/* ════════════════════════════════════════════════════════════════
   TEST — Analyse d'intonation vocale
   ════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs');
function mkEl(){return{id:'',className:'',innerHTML:'',textContent:'',value:'',style:{},dataset:{},disabled:false,title:'',appendChild:()=>{},insertBefore:()=>{},querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{},removeEventListener:()=>{},classList:{add:()=>{},remove:()=>{},contains:()=>false,toggle:()=>{}},parentNode:{replaceChild:()=>{}},parentElement:{querySelector:()=>null},closest:()=>null,cloneNode:function(){return this},nextSibling:null,getBoundingClientRect:()=>({left:0,top:0,bottom:0,width:300}),setAttribute:()=>{}};}
global.document={createElement:()=>mkEl(),body:{appendChild:()=>{},classList:{toggle:()=>{}}},getElementById:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}};
global.window={SpeechRecognition:null,webkitSpeechRecognition:null,innerWidth:400,scrollY:0,addEventListener:()=>{}};
global.localStorage={getItem:()=>null,setItem:()=>{}};
global.history={pushState:()=>{}};
const VS=(new Function('window','document',fs.readFileSync('C:/gravity/culte/js/voice-search.js','utf8')+';return VoiceSearch;'))(global.window,global.document);

let _p=0,_f=0;
function t(name,fn){try{const r=fn();if(r===false)throw new Error('false');_p++;console.log('  ✅',name);}catch(e){_f++;console.log('  ❌',name,'—',e.message);}}
function ok(c,m){if(!c)throw new Error(m||'assertion failed');}
function eq(a,b,m){if(a!==b)throw new Error((m||'')+` "${a}" !== "${b}"`);}
function inc(s,sub,m){if(!s.includes(sub))throw new Error((m||'')+` "${sub}" not in "${s}"`);}

const A = VS.analyzeIntonation;

// ═══════════════════════════════════════════════════════════
// A. NETTOYAGE DES FILLERS / HÉSITATIONS
// ═══════════════════════════════════════════════════════════
console.log('\n══ A. Nettoyage des fillers / hésitations ══');

t('Filler "euh" retiré', () => {
  const r = A('euh musées de Dakar');
  ok(r.fillers.includes('euh'), 'filler non détecté');
  ok(!r.cleanText.includes('euh'), 'filler pas retiré: ' + r.cleanText);
  inc(r.cleanText, 'musées de Dakar');
});

t('Filler "hum" au milieu retiré', () => {
  const r = A('je cherche hum des galeries');
  ok(r.fillers.includes('hum'), 'filler non détecté');
  ok(!r.cleanText.includes('hum'), 'filler pas retiré: ' + r.cleanText);
  inc(r.cleanText, 'je cherche');
  inc(r.cleanText, 'galeries');
});

t('Filler "ben" retiré', () => {
  const r = A('ben les cinémas à Dakar');
  ok(r.fillers.includes('ben'), 'filler non détecté');
  ok(!r.cleanText.includes('ben'), 'filler pas retiré');
});

t('Multiples fillers retirés', () => {
  const r = A('euh alors les musées euh de Dakar quoi');
  ok(r.fillers.length >= 2, 'attendu ≥2 fillers, got ' + r.fillers.length);
  ok(!r.cleanText.includes('euh'), 'euh pas retiré');
  inc(r.cleanText, 'musées');
  inc(r.cleanText, 'Dakar');
});

t('"en fait" filler retiré', () => {
  const r = A('en fait les galeries à Thiès');
  ok(r.fillers.includes('en fait'), 'filler "en fait" non détecté');
});

t('Filler "genre" retiré', () => {
  const r = A('genre des spectacles à Saint-Louis');
  ok(r.fillers.includes('genre'), 'filler "genre" non détecté');
  inc(r.cleanText, 'spectacles');
});

t('"comment dire" filler', () => {
  const r = A('comment dire les centres culturels');
  ok(r.fillers.includes('comment dire'), 'non détecté');
});

t('Hesitation level augmente avec fillers', () => {
  const r = A('euh hum bon alors les musées');
  ok(r.hesitationLevel > 0.2, 'hesitationLevel trop bas: ' + r.hesitationLevel);
});

t('Filler Wolof "deh" retiré', () => {
  const r = A('deh musee ci ndakaaru');
  ok(r.fillers.includes('deh'), 'filler wolof non détecté');
});

// ═══════════════════════════════════════════════════════════
// B. DÉTECTION D'AUTO-CORRECTION
// ═══════════════════════════════════════════════════════════
console.log('\n══ B. Détection d\'auto-correction ══');

t('"non je veux dire galeries" → correction', () => {
  const r = A('musées non je veux dire galeries à Dakar');
  ok(r.selfCorrection, 'correction non détectée');
  inc(r.cleanText, 'galeries');
  ok(!r.cleanText.includes('musées'), 'ancien terme pas supprimé: ' + r.cleanText);
});

t('"non plutôt cinémas" → correction', () => {
  const r = A('bibliothèques non plutôt cinémas');
  ok(r.selfCorrection, 'correction non détectée');
  inc(r.cleanText, 'cinémas');
});

t('"pardon je veux dire Thiès" → correction', () => {
  const r = A('à Dakar pardon je veux dire Thiès');
  ok(r.selfCorrection, 'correction non détectée');
});

t('"non non les galeries" → correction', () => {
  const r = A('les musées non non les galeries');
  ok(r.selfCorrection, 'non non correction non détectée');
  inc(r.cleanText, 'galeries');
});

t('Tone = corrective après correction', () => {
  const r = A('centres non je veux dire musées');
  eq(r.tone, 'corrective');
  eq(r.toneEmoji, '✏️');
});

// ═══════════════════════════════════════════════════════════
// C. DÉTECTION D'INTONATION INTERROGATIVE
// ═══════════════════════════════════════════════════════════
console.log('\n══ C. Détection d\'intonation interrogative ══');

t('"?" à la fin → isQuestion', () => {
  const r = A('il y a des musées à Dakar?');
  ok(r.isQuestion, 'question non détectée');
});

t('"??" → isQuestion', () => {
  const r = A('combien de galeries??');
  ok(r.isQuestion, 'double ? non détecté');
});

t('"est-ce que..." → isQuestion', () => {
  const r = A('est-ce que il y a des musées');
  ok(r.isQuestion, 'est-ce que non détecté');
});

t('"combien" → isCountQuestion', () => {
  const r = A('combien de musées à Dakar');
  ok(r.searchModifiers.isCountQuestion, 'count question non détecté');
});

t('"où" → isQuestion', () => {
  const r = A('où sont les galeries');
  ok(r.isQuestion, 'où non détecté comme question');
});

t('"quel nombre" → isCountQuestion', () => {
  const r = A('quel nombre de cinémas à Thiès');
  ok(r.searchModifiers.isCountQuestion, 'count question non détecté');
});

// ═══════════════════════════════════════════════════════════
// D. DÉTECTION D'EMPHASE / RÉPÉTITION
// ═══════════════════════════════════════════════════════════
console.log('\n══ D. Détection d\'emphase / répétition ══');

t('Mot répété "musée musée" → emphase', () => {
  const r = A('musée musée à Dakar');
  ok(r.emphasis.length > 0, 'emphase non détectée');
  ok(r.emphasis.some(e => e.word === 'musée'), 'musée pas dans emphasis');
  ok(r.searchModifiers.emphasizedTerms.includes('musée'), 'pas dans emphasizedTerms');
});

t('Dédupliquer "galerie galerie" → 1 occurrence', () => {
  const r = A('galerie galerie à Thiès');
  // Le cleanText ne devrait pas avoir la duplication
  const count = (r.cleanText.match(/galerie/gi) || []).length;
  ok(count === 1, 'attendu 1 occurrence, got ' + count + ' dans "' + r.cleanText + '"');
});

t('Mot triple répété "vite vite vite"', () => {
  const r = A('musée vite vite vite à Dakar');
  ok(r.emphasis.some(e => e.word === 'vite'), 'vite pas détecté en emphase');
});

t('Élongation "muséeee" → nettoyé', () => {
  const r = A('muséeee à Dakar');
  ok(r.emphasis.length > 0, 'elongation non détectée');
  // Le mot devrait être nettoyé
  ok(!r.cleanText.includes('muséeee'), 'elongation pas nettoyée');
});

t('Élongation "ouiii" → nettoyé', () => {
  const r = A('ouiii des galeries');
  ok(r.emphasis.some(e => e.elongated), 'elongated flag pas mis');
});

// ═══════════════════════════════════════════════════════════
// E. DÉTECTION D'EXCLAMATION
// ═══════════════════════════════════════════════════════════
console.log('\n══ E. Détection d\'exclamation ══');

t('"!" → isExclamation', () => {
  const r = A('super les musées de Dakar!');
  ok(r.isExclamation, 'exclamation non détectée');
});

t('"!!" → isExclamation', () => {
  const r = A('génial!!');
  ok(r.isExclamation, 'double ! non détecté');
});

// ═══════════════════════════════════════════════════════════
// F. DÉTECTION D'ÉNUMÉRATION (MULTI-CRITÈRES)
// ═══════════════════════════════════════════════════════════
console.log('\n══ F. Détection d\'énumération (multi-critères) ══');

t('"musées et galeries" → enumeration', () => {
  const r = A('musées et galeries à Dakar');
  ok(r.enumeration.length >= 2, 'enumeration non détectée: ' + JSON.stringify(r.enumeration));
  ok(r.searchModifiers.multiCriteria, 'multiCriteria non activé');
});

t('"cinémas ou théâtres" → enumeration', () => {
  const r = A('cinémas ou théâtres à Thiès');
  ok(r.enumeration.length >= 2, 'enumeration non détectée');
  ok(r.searchModifiers.multiCriteria, 'multiCriteria non activé');
});

t('"musées et galeries et bibliothèques" → 3 critères', () => {
  const r = A('musées et galeries et bibliothèques');
  ok(r.enumeration.length >= 3, 'attendu 3+ critères, got ' + r.enumeration.length);
});

t('"musées ainsi que galeries" → enumeration', () => {
  const r = A('musées ainsi que galeries à Dakar');
  ok(r.searchModifiers.multiCriteria, 'multiCriteria non activé');
});

// ═══════════════════════════════════════════════════════════
// G. DÉTECTION DE TON
// ═══════════════════════════════════════════════════════════
console.log('\n══ G. Détection de ton ══');

t('Ton urgent "vite musées"', () => {
  const r = A('vite les musées à Dakar');
  eq(r.tone, 'urgent');
  eq(r.toneEmoji, '⚡');
  // "vite" doit être retiré du texte de recherche
  ok(!r.cleanText.includes('vite'), 'vite pas retiré du cleanText');
});

t('Ton urgent "s\'il vous plaît"', () => {
  const r = A('s\'il vous plaît les galeries à Thiès');
  eq(r.tone, 'urgent');
});

t('Ton urgent "rapidement"', () => {
  const r = A('rapidement les cinémas');
  eq(r.tone, 'urgent');
  ok(!r.cleanText.includes('rapidement'), 'urgency marker pas retiré');
});

t('Ton incertain "peut-être"', () => {
  const r = A('peut-être des musées');
  eq(r.tone, 'uncertain');
  eq(r.toneEmoji, '🤔');
  ok(r.searchModifiers.broaden, 'broaden non activé');
});

t('Ton incertain "je crois"', () => {
  const r = A('je crois qu\'il y a des galeries');
  eq(r.tone, 'uncertain');
});

t('Ton incertain "je sais pas trop"', () => {
  const r = A('je sais pas trop des centres culturels');
  eq(r.tone, 'uncertain');
  ok(r.searchModifiers.broaden, 'broaden non activé');
});

t('Ton enthousiaste "super"', () => {
  const r = A('super les musées de Dakar');
  eq(r.tone, 'enthusiastic');
  eq(r.toneEmoji, '🤩');
});

t('Ton enthousiaste "j\'adore"', () => {
  const r = A('j\'adore les galeries à Saint-Louis');
  eq(r.tone, 'enthusiastic');
});

t('Ton enthousiaste "!" avec texte neutre', () => {
  const r = A('les musées de Dakar!');
  eq(r.tone, 'enthusiastic');
});

t('Ton hésitant (≥3 fillers)', () => {
  const r = A('euh hum bon les musées');
  eq(r.tone, 'hesitant');
  eq(r.toneEmoji, '😶');
  ok(r.searchModifiers.broaden, 'broaden non activé');
});

t('Ton neutre — phrase claire', () => {
  const r = A('les musées de Dakar');
  eq(r.tone, 'neutral');
  eq(r.toneLabel, 'Clair');
});

// ═══════════════════════════════════════════════════════════
// H. CONFIANCE AJUSTÉE
// ═══════════════════════════════════════════════════════════
console.log('\n══ H. Confiance ajustée ══');

t('Confiance élevée sans fillers', () => {
  const r = A('musées à Dakar', [{ text: 'musées à Dakar', confidence: 0.95 }]);
  ok(r.confidenceAdjusted > 0.6, 'confiance trop basse: ' + r.confidenceAdjusted);
});

t('Confiance baisse avec fillers', () => {
  const clean = A('musées à Dakar', [{ text: 'musées à Dakar', confidence: 0.9 }]);
  const hesitant = A('euh hum musées à Dakar', [{ text: 'euh hum musées à Dakar', confidence: 0.9 }]);
  ok(hesitant.confidenceAdjusted < clean.confidenceAdjusted,
    `hésitant (${hesitant.confidenceAdjusted}) devrait < clean (${clean.confidenceAdjusted})`);
});

t('Confiance baisse avec divergence alternatives', () => {
  const r = A('musées à Dakar', [
    { text: 'musées à Dakar', confidence: 0.7 },
    { text: 'musey à Dakar', confidence: 0.2 },
    { text: 'musée Dakar', confidence: 0.1 },
  ]);
  ok(r.confidenceAdjusted < 0.8, 'confiance pas pénalisée: ' + r.confidenceAdjusted);
});

// ═══════════════════════════════════════════════════════════
// I. POINTS DE SUSPENSION / ELLIPSES
// ═══════════════════════════════════════════════════════════
console.log('\n══ I. Points de suspension / ellipses ══');

t('"..." augmente hésitation', () => {
  const r = A('les musées... à Dakar');
  ok(r.hesitationLevel >= 0.3, 'hésitation insuffisante: ' + r.hesitationLevel);
});

t('"…" (ellipse unicode)', () => {
  const r = A('je cherche… des galeries');
  ok(r.hesitationLevel >= 0.3, 'ellipse unicode non détectée');
});

// ═══════════════════════════════════════════════════════════
// J. FEEDBACK MESSAGES
// ═══════════════════════════════════════════════════════════
console.log('\n══ J. Feedback messages ══');

t('Feedback pour fillers', () => {
  const r = A('euh musées');
  inc(r.feedbackMessage, 'hésitation');
});

t('Feedback pour correction', () => {
  const r = A('cinémas non je veux dire musées');
  inc(r.feedbackMessage, 'correction');
});

t('Feedback pour emphase', () => {
  const r = A('musée musée à Dakar');
  inc(r.feedbackMessage, 'emphase');
});

t('Feedback pour multi-critères', () => {
  const r = A('musées et galeries');
  inc(r.feedbackMessage, 'critères');
});

t('Feedback vide pour phrase normale', () => {
  const r = A('les musées de Dakar');
  eq(r.feedbackMessage, '');
});

// ═══════════════════════════════════════════════════════════
// K. COMBINAISONS COMPLEXES
// ═══════════════════════════════════════════════════════════
console.log('\n══ K. Combinaisons complexes ══');

t('Filler + question', () => {
  const r = A('euh où sont les musées?');
  ok(r.fillers.length > 0, 'filler non détecté');
  ok(r.isQuestion, 'question non détectée');
  ok(!r.cleanText.includes('euh'), 'filler pas nettoyé');
});

t('Correction + urgence → urgence prioritaire', () => {
  const r = A('galeries non je veux dire musées vite');
  ok(r.selfCorrection, 'correction non détectée');
  // L'urgence a priorité sur la correction car c'est plus actionnable
  eq(r.tone, 'urgent');
});

t('Enumération + question', () => {
  const r = A('combien de musées et galeries à Dakar?');
  ok(r.isQuestion, 'question non détectée');
  ok(r.searchModifiers.multiCriteria, 'multiCriteria non détecté');
  ok(r.searchModifiers.isCountQuestion, 'count non détecté');
});

t('Filler + emphase + incertitude', () => {
  const r = A('euh peut-être musée musée');
  ok(r.fillers.length > 0, 'filler non détecté');
  ok(r.emphasis.length > 0, 'emphase non détectée');
  // Incertitude a priorité si pas de correction/urgence
  ok(r.tone === 'uncertain' || r.tone === 'hesitant', 'ton inapproprié: ' + r.tone);
});

t('Phrase propre sans rien de spécial', () => {
  const r = A('les centres culturels de Ziguinchor');
  eq(r.fillers.length, 0);
  eq(r.selfCorrection, false);
  eq(r.emphasis.length, 0);
  eq(r.tone, 'neutral');
  eq(r.cleanText, 'les centres culturels de Ziguinchor');
});

// ═══════════════════════════════════════════════════════════
// L. TEXTE PROPRE PRÉSERVÉ
// ═══════════════════════════════════════════════════════════
console.log('\n══ L. Texte propre préservé après nettoyage ══');

t('Texte simple inchangé', () => {
  const r = A('musées à Dakar');
  eq(r.cleanText, 'musées à Dakar');
});

t('Texte avec filler nettoyé correctement', () => {
  const r = A('euh les musées à Dakar');
  // Pas de double espace
  ok(!r.cleanText.includes('  '), 'double espace dans: "' + r.cleanText + '"');
  // Pas de virgule orpheline au début
  ok(!/^[,;.\s]/.test(r.cleanText), 'ponctuation orpheline: ' + r.cleanText);
});

t('Urgence retirée sans casser le texte', () => {
  const r = A('vite les musées à Dakar rapidement');
  ok(!r.cleanText.includes('vite'), 'vite reste');
  ok(!r.cleanText.includes('rapidement'), 'rapidement reste');
  inc(r.cleanText, 'musées');
  inc(r.cleanText, 'Dakar');
});

// ═══════════════════════════════════════════════════════════
// M. MODIFIEURS DE RECHERCHE
// ═══════════════════════════════════════════════════════════
console.log('\n══ M. Modifieurs de recherche ══');

t('Broaden activé par incertitude', () => {
  const r = A('peut-être des musées');
  ok(r.searchModifiers.broaden, 'broaden non activé');
});

t('Broaden activé par forte hésitation', () => {
  const r = A('euh hum bon les galeries');
  ok(r.searchModifiers.broaden, 'broaden non activé avec fillers');
});

t('MultiCriteria activé par "et"', () => {
  const r = A('musées et cinémas');
  ok(r.searchModifiers.multiCriteria, 'multiCriteria non activé');
});

t('EmphasizedTerms rempli', () => {
  const r = A('musée musée Dakar');
  ok(r.searchModifiers.emphasizedTerms.includes('musée'), 'musée pas dans emphasizedTerms');
});

t('CountQuestion activé par "combien"', () => {
  const r = A('combien de musées');
  ok(r.searchModifiers.isCountQuestion, 'countQuestion non activé');
});

// ══════════════════════════════════════════════════════════
// RÉSULTAT
// ══════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════╗
║  TESTS INTONATION: ${_p} ✅  ${_f} ❌  sur ${_p+_f} tests
╚══════════════════════════════════════════════════════╝
`);
if (_f === 0) console.log('🎉 TOUS LES TESTS D\'INTONATION PASSENT !');
else console.log(`⚠️  ${_f} test(s) échoué(s)`);
process.exit(_f > 0 ? 1 : 0);
