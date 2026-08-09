#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   CULTE — Script de build production
   Concatène et minifie JS + CSS → dist/
   Usage: node build.js
   ════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// Ordre exact des fichiers (doit correspondre à index.html)
const JS_FILES = [
  'js/escape.js',
  'js/api-client.js',
  'js/search-engine.js',
  'js/voice-search.js',
  'js/search-dialog.js',
  'js/conversation-memory.js',
  'js/geolocation-search.js',
  'js/nlg-response.js',
  'js/auto-suggest.js',
  'js/voice-conversation.js',
  'js/events-calendar.js',
  'js/chatbot.js',
  'js/social.js',
  'js/recommendations.js',
  'js/multilang.js',
  'js/analytics.js',
  'js/guided-tours.js',
  'js/stats-dashboard.js',
  'js/calendar-export.js',
  'js/app.js',
];

const CSS_FILES = [
  'css/style.css',
  'css/events.css',
  'css/chatbot.css',
  'css/tours.css',
  'css/stats.css',
  'css/desktop.css',
];

// ── Créer dist/ ──
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
if (!fs.existsSync(path.join(DIST, 'js'))) fs.mkdirSync(path.join(DIST, 'js'));
if (!fs.existsSync(path.join(DIST, 'css'))) fs.mkdirSync(path.join(DIST, 'css'));

// ── Concaténer JS ──
console.log('📦 Concaténation JS...');
const jsBundle = JS_FILES.map(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  return `/* === ${f} === */\n${content}`;
}).join('\n\n');
const jsBundlePath = path.join(DIST, 'js', 'app.bundle.js');
fs.writeFileSync(jsBundlePath, jsBundle);

// ── Minifier JS ──
console.log('🗜️  Minification JS...');
const jsMinPath = path.join(DIST, 'js', 'app.bundle.min.js');
try {
  execSync(`npx terser "${jsBundlePath}" -o "${jsMinPath}" --compress --mangle --source-map`, { cwd: ROOT, stdio: 'pipe' });
  const origSize = (fs.statSync(jsBundlePath).size / 1024).toFixed(1);
  const minSize = (fs.statSync(jsMinPath).size / 1024).toFixed(1);
  console.log(`   JS: ${origSize} KB → ${minSize} KB (${((1 - minSize / origSize) * 100).toFixed(0)}% réduit)`);
} catch (e) {
  console.error('   ⚠️  Erreur terser:', e.message);
}

// ── Concaténer CSS ──
console.log('📦 Concaténation CSS...');
const cssBundle = CSS_FILES.map(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  return `/* === ${f} === */\n${content}`;
}).join('\n\n');
const cssBundlePath = path.join(DIST, 'css', 'app.bundle.css');
fs.writeFileSync(cssBundlePath, cssBundle);

// ── Minifier CSS ──
console.log('🗜️  Minification CSS...');
const cssMinPath = path.join(DIST, 'css', 'app.bundle.min.css');
try {
  execSync(`npx cleancss -o "${cssMinPath}" "${cssBundlePath}"`, { cwd: ROOT, stdio: 'pipe' });
  const origSize = (fs.statSync(cssBundlePath).size / 1024).toFixed(1);
  const minSize = (fs.statSync(cssMinPath).size / 1024).toFixed(1);
  console.log(`   CSS: ${origSize} KB → ${minSize} KB (${((1 - minSize / origSize) * 100).toFixed(0)}% réduit)`);
} catch (e) {
  console.error('   ⚠️  Erreur clean-css:', e.message);
}

// ── Générer index.prod.html ──
console.log('📄 Génération index.prod.html...');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* Le remplacement se fait fichier par fichier et tolère les
   paramètres de cache (?v=12) ainsi que les attributs additionnels
   (defer, integrity…). Un remplacement par bloc exact, comme
   auparavant, échouait silencieusement dès qu'un « ?v= » était
   ajouté à un lien — et index.prod.html se retrouvait identique à
   index.html, donc non bundlé. */
function replaceBundle(source, files, bundleTag, buildPattern) {
  let first = true;
  let out = source;
  let replaced = 0;

  for (const f of files) {
    const pattern = buildPattern(f);
    out = out.replace(pattern, () => {
      replaced++;
      if (first) { first = false; return bundleTag; }
      return '';           // les suivants disparaissent
    });
  }

  if (replaced !== files.length) {
    console.warn(`   ⚠️  ${replaced}/${files.length} balises remplacées — vérifiez index.html`);
  }
  // Nettoie les lignes devenues vides
  return out.replace(/^[ \t]*\n/gm, m => (m === '\n' ? '' : m));
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// rel="stylesheet" explicitement : sinon le <link rel="preload"
// as="style"> portant la même URL serait consommé à sa place.
html = replaceBundle(
  html, CSS_FILES,
  '  <link rel="stylesheet" href="dist/css/app.bundle.min.css">',
  f => new RegExp(
    `[ \\t]*<link(?=[^>]*rel=["']stylesheet["'])[^>]*href=["']${esc(f)}(?:\\?[^"']*)?["'][^>]*>`, 'gi'),
);

html = replaceBundle(
  html, JS_FILES,
  '<script src="dist/js/app.bundle.min.js"></script>',
  f => new RegExp(`[ \\t]*<script[^>]*src=["']${esc(f)}(?:\\?[^"']*)?["'][^>]*><\\/script>`, 'gi'),
);

// Le preload de css/style.css pointe désormais vers le bundle.
html = html.replace(
  /<link rel="preload" href="css\/[^"]*" as="style">/,
  '<link rel="preload" href="dist/css/app.bundle.min.css" as="style">');
html = html.replace(
  /<link rel="preload" href="js\/[^"]*" as="script">/,
  '<link rel="preload" href="dist/js/app.bundle.min.js" as="script">');

fs.writeFileSync(path.join(ROOT, 'index.prod.html'), html);
fs.writeFileSync(path.join(DIST, 'index.html'), html.replace(/href="dist\//g, 'href="').replace(/src="dist\//g, 'src="'));

// ── Copier les données ──
console.log('📋 Copie des données...');
for (const f of ['infrastructures_culturelles.json', 'centre_formation_arts.json', 'manifest.json', 'sw.js', 'serve.js']) {
  if (fs.existsSync(path.join(ROOT, f))) {
    fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
  }
}

console.log('\n✅ Build terminé ! Fichiers dans dist/');
console.log('   → index.prod.html (utilise les bundles minifiés)');
