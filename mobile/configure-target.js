#!/usr/bin/env node
/**
 * configure-target.js
 * Configure l'app mobile pour une cible spécifique (client, admin, responsable)
 * Usage: node configure-target.js <target>
 */

const fs = require('fs');
const path = require('path');

const target = process.argv[2];
const targets = JSON.parse(fs.readFileSync(path.join(__dirname, 'targets.json'), 'utf8'));

if (!target || !targets[target]) {
  console.error(`Usage: node configure-target.js <${Object.keys(targets).join('|')}>`);
  process.exit(1);
}

const config = targets[target];
console.log(`\n🎯 Configuration cible: ${target.toUpperCase()}`);
console.log(`   Nom: ${config.name}`);
console.log(`   Package: ${config.package}`);
console.log(`   URL: ${config.url}`);

// 1. Mettre à jour app.json
const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

appJson.expo.name = config.name;
appJson.expo.slug = config.slug;
appJson.expo.android.package = config.package;
appJson.expo.ios.bundleIdentifier = config.package;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`   ✅ app.json mis à jour`);

// 2. Mettre à jour App.js (SITE_URL et StatusBar)
const appJsPath = path.join(__dirname, 'App.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Remplacer l'URL
appJs = appJs.replace(
  /const SITE_URL = '[^']*';/,
  `const SITE_URL = '${config.url}';`
);

// Remplacer la couleur de la barre de statut
appJs = appJs.replace(
  /backgroundColor="#[a-fA-F0-9]+"/g,
  `backgroundColor="${config.statusBarColor}"`
);

// Remplacer la couleur de fond du container
appJs = appJs.replace(
  /backgroundColor: '#[a-fA-F0-9]+'(,\s*\/\/ statusbar)?/g,
  (match) => {
    if (match.includes('container') || match.includes('loading')) {
      return `backgroundColor: '${config.statusBarColor}'`;
    }
    return match;
  }
);

fs.writeFileSync(appJsPath, appJs);
console.log(`   ✅ App.js mis à jour (URL: ${config.url})`);

// 3. Écrire un fichier .target pour le workflow
fs.writeFileSync(path.join(__dirname, '.current-target'), target);
console.log(`   ✅ Cible enregistrée: ${target}`);

console.log(`\n🚀 Prêt pour le build: ${config.apkName}\n`);
