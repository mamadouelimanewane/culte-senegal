#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   Tests des primitives d'échappement (js/escape.js).

   Chaque charge utile est passée dans la fonction censée la
   neutraliser, puis on vérifie qu'il ne reste rien d'exécutable
   dans le contexte visé (HTML, attribut, URL, handler inline).

   Usage : node test-escape.js
   ════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

/* Charge js/escape.js dans un faux `window`. */
const sandbox = {};
new Function('window', fs.readFileSync(path.join(__dirname, 'js', 'escape.js'), 'utf8'))(sandbox);
const { escapeHtml, safeUrl, jsAttr, jsonAttr } = sandbox;

let passed = 0, failed = 0;
const rows = [];

function check(name, cond, detail) {
  if (cond) { passed++; rows.push(['✓', name, '']); }
  else { failed++; rows.push(['✗', name, detail || '']); }
}
function group(title) { rows.push(['', '', '']); rows.push(['—', title, '']); }

/* Charges utiles classiques de XSS stockée. */
const PAYLOADS = [
  '<script>alert(1)</script>',
  '"><script>alert(1)</script>',
  "'><img src=x onerror=alert(1)>",
  '<img src=x onerror=alert(1)>',
  '" onerror="alert(1)',
  "' onmouseover='alert(1)",
  '<svg/onload=alert(1)>',
  '`<div>`',
  '&lt;script&gt;',
  '</textarea><script>alert(1)</script>',
];

group('escapeHtml — contexte texte et attribut');
for (const p of PAYLOADS) {
  const out = escapeHtml(p);
  check(`neutralise ${JSON.stringify(p).slice(0, 42)}`,
    !/[<>"'`]/.test(out), out);
}
check('escapeHtml(null) → chaîne vide', escapeHtml(null) === '');
check('escapeHtml(undefined) → chaîne vide', escapeHtml(undefined) === '');
check('escapeHtml(0) → "0" (pas vide)', escapeHtml(0) === '0', escapeHtml(0));
check('le texte normal est préservé',
  escapeHtml('Galerie ATISS Dakar — Médina') === 'Galerie ATISS Dakar — Médina');

group('safeUrl — schémas dangereux');
const BAD_URLS = [
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  '  javascript:alert(1)',
  'java\tscript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
  '//evil.example.com/x',
];
for (const u of BAD_URLS) {
  check(`rejette ${JSON.stringify(u).slice(0, 46)}`, safeUrl(u) === '', safeUrl(u));
}

group('safeUrl — schémas légitimes');
const GOOD_URLS = [
  'https://cinema-medina.sn',
  'http://example.sn/page?a=1',
  'mailto:contact@culte.sn',
  'tel:+221338226790',
  '../site/?id=856',
  '/js/app.js',
  '#section',
];
for (const u of GOOD_URLS) {
  check(`accepte ${u}`, safeUrl(u) !== '', '(rejetée à tort)');
}
check('accepte une data-URL d\'image',
  safeUrl('data:image/png;base64,iVBORw0KGgo=') !== '');
check('une URL légitime avec guillemet est échappée',
  !safeUrl('https://x.sn/"onload="alert(1)').includes('"'),
  safeUrl('https://x.sn/"onload="alert(1)'));

group('jsAttr — handler inline onclick="f(\'…\')"');
/* Simule le navigateur : le parseur HTML décode les entités, puis le
   JS résultant est évalué. On vérifie que la charge reste une simple
   chaîne et ne s'échappe pas de ses délimiteurs. */
function decodeEntities(s) {
  return s.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
          .replace(/&quot;/g, '"').replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>').replace(/&#96;/g, '`')
          .replace(/&amp;/g, '&');
}

for (const p of ["MAISON D'ART", "'); alert(1); ('", "\\'); alert(1); //", 'a\nb']) {
  const attrSource = `f('${jsAttr(p)}')`;   // ce qu'on écrit dans le HTML
  const jsSource   = decodeEntities(attrSource); // ce que le navigateur évalue
  let captured = null, threw = false;
  try {
    new Function('f', jsSource)(v => { captured = v; });
  } catch (e) { threw = true; }
  check(`${JSON.stringify(p).slice(0, 34)} traversé intact`,
    !threw && captured === p, threw ? 'erreur de syntaxe JS' : JSON.stringify(captured));
}

group('jsonAttr — handler inline onclick=\'f(…)\'');
for (const rec of [
  { DESIGNATION: "MAISON D'ART", REGION: 'DAKAR' },
  { DESIGNATION: "'); alert(1); ({x:'" },
  { DESIGNATION: '<script>alert(1)</script>' },
  { DESIGNATION: 'guillemets " et \\ antislash' },
]) {
  const attrSource = `f(${jsonAttr(rec)})`;
  const jsSource   = decodeEntities(attrSource);
  let captured = null, threw = false;
  try {
    new Function('f', jsSource)(v => { captured = v; });
  } catch (e) { threw = true; }
  check(`objet ${JSON.stringify(rec.DESIGNATION).slice(0, 34)} traversé intact`,
    !threw && JSON.stringify(captured) === JSON.stringify(rec),
    threw ? 'erreur de syntaxe JS' : JSON.stringify(captured));

  check(`  └ pas d'apostrophe brute dans l'attribut`,
    !jsonAttr(rec).includes("'"), jsonAttr(rec).slice(0, 60));
}

/* ── Rapport ── */
console.log('');
for (const [mark, name, detail] of rows) {
  if (!mark) { console.log(''); continue; }
  if (mark === '—') { console.log('\x1b[1m' + name + '\x1b[0m'); continue; }
  const color = mark === '✓' ? '\x1b[32m' : '\x1b[31m';
  console.log(`  ${color}${mark}\x1b[0m ${name}${detail ? '  → ' + detail : ''}`);
}
console.log('');
console.log(`  ${passed} réussis, ${failed} échoués`);
console.log('');
process.exit(failed ? 1 : 0);
