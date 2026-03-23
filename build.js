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
  'js/seed.js',
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

// Remplacer les 6 CSS par le bundle
const cssLinks = CSS_FILES.map(f => `  <link rel="stylesheet" href="${f}">`).join('\n');
html = html.replace(cssLinks, '  <link rel="stylesheet" href="dist/css/app.bundle.min.css">');

// Remplacer les 19 scripts par le bundle
const scriptTags = JS_FILES.map(f => `<script src="${f}"></script>`).join('\n');
html = html.replace(scriptTags, '<script src="dist/js/app.bundle.min.js"></script>');

fs.writeFileSync(path.join(ROOT, 'index.prod.html'), html);

// ── Copier les données ──
console.log('📋 Copie des données...');
for (const f of ['infrastructures_culturelles.json', 'centre_formation_arts.json', 'manifest.json', 'sw.js', 'serve.js']) {
  if (fs.existsSync(path.join(ROOT, f))) {
    fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
  }
}

console.log('\n✅ Build terminé ! Fichiers dans dist/');
console.log('   → index.prod.html (utilise les bundles minifiés)');
