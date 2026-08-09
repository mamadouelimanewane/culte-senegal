#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   Tests d'intégration du backend.

   Postgres est fourni par PGlite (Postgres 16 compilé en WASM) :
   aucun serveur à installer, mais le SQL réellement exécuté est
   celui de production — schéma, transactions, index d'expression
   et contraintes compris.

   Usage : node test-api.js
   ════════════════════════════════════════════════════════════════ */
'use strict';

const fs   = require('fs');
const path = require('path');
const Module = require('module');

process.env.JWT_SECRET = 'test-secret-au-moins-trente-deux-caracteres-de-long';
process.env.NODE_ENV   = 'test';

/* ── Harnais HTTP minimal ───────────────────────────────────────── */
function mkReq({ method = 'GET', url = '/', body = null, query = {}, cookie = '', csrf = true }) {
  const headers = { host: 'localhost' };
  if (cookie) headers.cookie = cookie;
  if (csrf) headers['x-requested-with'] = 'culte-app';
  return { method, url, headers, query, body, socket: { remoteAddress: '127.0.0.1' } };
}

function mkRes() {
  const res = {
    statusCode: 200,
    _headers: {},
    _body: null,
    writableEnded: false,
    setHeader(k, v) { this._headers[k.toLowerCase()] = v; },
    getHeader(k) { return this._headers[k.toLowerCase()]; },
    end(payload) {
      this.writableEnded = true;
      try { this._body = JSON.parse(payload); } catch { this._body = payload; }
    },
  };
  return res;
}

async function call(handler, opts) {
  const req = mkReq(opts);
  const res = mkRes();
  await handler(req, res);
  return { status: res.statusCode, body: res._body, headers: res._headers };
}

/** Extrait la valeur du cookie de session d'une réponse de login. */
function cookieOf(res) {
  const sc = res.headers['set-cookie'];
  if (!sc) return '';
  return String(sc).split(';')[0];
}

/* ── Assertions ─────────────────────────────────────────────────── */
let passed = 0, failed = 0;
const results = [];

function check(name, cond, detail) {
  if (cond) { passed++; results.push(['✓', name, '']); }
  else { failed++; results.push(['✗', name, detail || '']); }
}

async function group(title, fn) {
  results.push(['', '', '']);
  results.push(['—', title, '']);
  await fn();
}

/* ── Base de test ───────────────────────────────────────────────── */
async function setupDb() {
  const { PGlite } = require('@electric-sql/pglite');
  const pg = new PGlite();
  await pg.exec(fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8'));

  const shim = {
    pool: null,
    async query(text, params) { return pg.query(text, params); },
    async one(text, params) { const r = await pg.query(text, params); return r.rows[0] || null; },
    async many(text, params) { const r = await pg.query(text, params); return r.rows; },
    async tx(fn) {
      await pg.exec('BEGIN');
      try {
        const out = await fn({ query: (t, p) => pg.query(t, p) });
        await pg.exec('COMMIT');
        return out;
      } catch (e) {
        await pg.exec('ROLLBACK');
        throw e;
      }
    },
  };

  // Injecte le shim à la place de api/_lib/db.js avant tout require.
  const dbPath = require.resolve('./api/_lib/db.js');
  require.cache[dbPath] = new Module(dbPath, null);
  require.cache[dbPath].filename = dbPath;
  require.cache[dbPath].loaded = true;
  require.cache[dbPath].exports = shim;

  return { pg, shim };
}

/* ── Scénario ───────────────────────────────────────────────────── */
async function main() {
  const { shim } = await setupDb();

  const login         = require('./api/auth/login.js');
  const me            = require('./api/auth/me.js');
  const changePwd     = require('./api/auth/password.js');
  const registrations = require('./api/registrations/index.js');
  const registrationId = require('./api/registrations/[id].js');
  const responsables  = require('./api/responsables/index.js');
  const contributions = require('./api/contributions/index.js');
  const contributionId = require('./api/contributions/[id].js');
  const content       = require('./api/content/index.js');
  const audit         = require('./api/audit/index.js');

  const bcrypt = require('bcryptjs');
  await shim.query(
    'INSERT INTO admins (email, password_hash, nom) VALUES ($1, $2, $3)',
    ['admin@culte.sn', await bcrypt.hash('MotDePasseAdmin!2026', 12), 'Administrateur'],
  );

  let adminCookie = '', respCookie = '';

  await group('Authentification', async () => {
    let r = await call(login, { method: 'POST', body: { email: 'admin@culte.sn', password: 'mauvais', role: 'admin' } });
    check('mot de passe erroné rejeté', r.status === 401, `reçu ${r.status}`);

    r = await call(login, { method: 'POST', body: { email: 'inconnu@x.sn', password: 'x'.repeat(12), role: 'admin' } });
    check('compte inexistant → même erreur 401 (pas d\'énumération)', r.status === 401, `reçu ${r.status}`);

    r = await call(login, { method: 'POST', body: { email: 'admin@culte.sn', password: 'MotDePasseAdmin!2026', role: 'admin' } });
    check('login admin valide', r.status === 200 && r.body?.user?.role === 'admin', JSON.stringify(r.body));
    adminCookie = cookieOf(r);

    const setCookie = String(r.headers['set-cookie'] || '');
    check('cookie de session httpOnly', /HttpOnly/i.test(setCookie), setCookie);
    check('cookie SameSite=Lax', /SameSite=Lax/i.test(setCookie), setCookie);
    check('mot de passe absent de la réponse', !JSON.stringify(r.body).match(/password|hash/i), JSON.stringify(r.body));

    r = await call(me, { cookie: adminCookie });
    check('/auth/me renvoie la session', r.status === 200 && r.body?.user?.email === 'admin@culte.sn');

    r = await call(me, { cookie: 'culte_session=jeton.bidon.forge' });
    check('jeton forgé rejeté', r.status === 401, `reçu ${r.status}`);

    r = await call(me, {});
    check('sans cookie → 401', r.status === 401);
  });

  await group('Contrôle d\'accès', async () => {
    let r = await call(registrations, { cookie: '' });
    check('liste des inscriptions refusée sans session', r.status === 401);

    r = await call(audit, { cookie: '' });
    check('journal d\'audit refusé sans session', r.status === 401);

    r = await call(responsables, { cookie: '' });
    check('liste des responsables refusée sans session', r.status === 401);
  });

  let regId = null;
  await group('Inscription responsable', async () => {
    let r = await call(registrations, {
      method: 'POST',
      body: { nom: 'Fatou Ndiaye', email: 'fatou@culte.sn', tel: '770000000',
              password: 'court', infraId: 12, infraNom: 'Musée Théodore Monod', region: 'DAKAR' },
    });
    check('mot de passe trop court refusé', r.status === 400, JSON.stringify(r.body));

    r = await call(registrations, {
      method: 'POST',
      body: { nom: 'Fatou Ndiaye', email: 'pas-un-email', password: 'MotDePasseFatou!26', infraId: 12 },
    });
    check('e-mail invalide refusé', r.status === 400);

    r = await call(registrations, {
      method: 'POST', csrf: false,
      body: { nom: 'X', email: 'x@y.sn', password: 'MotDePasseXY!2026', infraId: 1 },
    });
    check('requête sans en-tête anti-CSRF refusée', r.status === 403, `reçu ${r.status}`);

    r = await call(registrations, {
      method: 'POST',
      body: { nom: 'Fatou Ndiaye', email: 'fatou@culte.sn', tel: '770000000',
              password: 'MotDePasseFatou!26', infraId: 12,
              infraNom: 'Musée Théodore Monod', region: 'DAKAR' },
    });
    check('demande d\'inscription créée', r.status === 201, JSON.stringify(r.body));

    r = await call(registrations, {
      method: 'POST',
      body: { nom: 'Fatou Ndiaye', email: 'FATOU@culte.sn', password: 'MotDePasseFatou!26', infraId: 12 },
    });
    check('doublon détecté (casse ignorée)', r.status === 409, JSON.stringify(r.body));

    const stored = await shim.one('SELECT password_hash FROM registrations WHERE email = $1', ['fatou@culte.sn']);
    check('mot de passe stocké haché en bcrypt',
      stored.password_hash.startsWith('$2') && !stored.password_hash.includes('MotDePasse'),
      stored.password_hash.slice(0, 20));

    r = await call(login, { method: 'POST', body: { email: 'fatou@culte.sn', password: 'MotDePasseFatou!26', role: 'responsable' } });
    check('connexion impossible tant que non approuvée', r.status === 403, JSON.stringify(r.body));

    r = await call(registrations, { cookie: adminCookie });
    check('admin voit la demande', r.status === 200 && r.body.registrations.length === 1);
    regId = r.body.registrations[0].id;
    check('la liste admin n\'expose aucun hash', !JSON.stringify(r.body).includes('$2'), '');
  });

  await group('Validation par l\'admin', async () => {
    let r = await call(registrationId, {
      method: 'PATCH', query: { id: String(regId) },
      body: { action: 'approve', note: 'Dossier complet' },
    });
    check('approbation refusée sans session admin', r.status === 401);

    r = await call(registrationId, {
      method: 'PATCH', cookie: adminCookie, query: { id: String(regId) },
      body: { action: 'approve', note: 'Dossier complet' },
    });
    check('demande approuvée', r.status === 200 && r.body.registration.statut === 'approved', JSON.stringify(r.body));

    r = await call(registrationId, {
      method: 'PATCH', cookie: adminCookie, query: { id: String(regId) },
      body: { action: 'reject' },
    });
    check('double traitement bloqué', r.status === 409, JSON.stringify(r.body));

    r = await call(responsables, { cookie: adminCookie });
    check('compte responsable créé', r.status === 200 && r.body.responsables.length === 1);

    r = await call(login, { method: 'POST', body: { email: 'fatou@culte.sn', password: 'MotDePasseFatou!26', role: 'responsable' } });
    check('le responsable peut se connecter avec son mot de passe d\'inscription',
      r.status === 200 && r.body?.user?.role === 'responsable', JSON.stringify(r.body));
    respCookie = cookieOf(r);
    check('la session porte l\'infrastructure rattachée', r.body?.user?.infraId === 12);
  });

  let contribId = null;
  await group('Contributions', async () => {
    let r = await call(contributions, {
      method: 'POST', cookie: respCookie,
      body: { type: 'actu', data: { titre: 'Exposition Soleil', contenu: 'Vernissage samedi.' } },
    });
    check('contribution déposée', r.status === 201, JSON.stringify(r.body));
    contribId = r.body.contribution.id;
    check('infrastructure imposée par la session', r.body.contribution.infraId === 12);

    r = await call(contributions, {
      method: 'POST', cookie: respCookie,
      body: { type: 'actu', infraId: 999, data: { titre: 'Détournement', contenu: 'x' } },
    });
    check('infraId envoyé par le client ignoré', r.body.contribution.infraId === 12,
      String(r.body?.contribution?.infraId));

    r = await call(contributions, {
      method: 'POST', cookie: respCookie,
      body: { type: 'actu', data: { titre: 'T', contenu: 'C', statut: 'approved', noteAdmin: 'auto' } },
    });
    check('champs non autorisés écartés',
      r.status === 201 && !('statut' in r.body.contribution.data) && !('noteAdmin' in r.body.contribution.data),
      JSON.stringify(r.body?.contribution?.data));

    r = await call(contributions, {
      method: 'POST', cookie: respCookie, body: { type: 'evil', data: { x: 1 } },
    });
    check('type inconnu refusé', r.status === 400);

    r = await call(contributionId, {
      method: 'PATCH', cookie: respCookie, query: { id: String(contribId) },
      body: { action: 'approve' },
    });
    check('un responsable ne peut pas valider ses propres contenus', r.status === 403, `reçu ${r.status}`);

    r = await call(contributions, { cookie: respCookie });
    check('le responsable ne voit que ses contributions',
      r.status === 200 && r.body.contributions.every(c => c.respId != null));
  });

  await group('Publication du contenu', async () => {
    let r = await call(content, {});
    check('contenu public vide avant validation',
      r.status === 200 && Object.keys(r.body.content).length === 0, JSON.stringify(r.body));

    r = await call(contributionId, {
      method: 'PATCH', cookie: adminCookie, query: { id: String(contribId) },
      body: { action: 'approve', note: 'OK' },
    });
    check('contribution approuvée', r.status === 200 && r.body.contribution.statut === 'approved', JSON.stringify(r.body));

    r = await call(content, {});
    const c12 = r.body.content['12'];
    check('contenu publié et lisible publiquement', !!c12, JSON.stringify(r.body));
    check('actualité fusionnée', c12?.actus?.[0]?.titre === 'Exposition Soleil', JSON.stringify(c12?.actus));

    r = await call(content, { query: { infraId: '999' } });
    check('filtre par infraId', Object.keys(r.body.content).length === 0);

    r = await call(audit, { cookie: adminCookie });
    check('actions tracées dans le journal',
      r.status === 200 && r.body.log.some(l => l.action === 'approve_content'), JSON.stringify(r.body.log));
  });

  await group('Changement de mot de passe', async () => {
    let r = await call(changePwd, {
      method: 'POST', cookie: adminCookie,
      body: { currentPassword: 'faux', newPassword: 'NouveauMotDePasse!26' },
    });
    check('mot de passe actuel vérifié', r.status === 401, JSON.stringify(r.body));

    r = await call(changePwd, {
      method: 'POST', cookie: adminCookie,
      body: { currentPassword: 'MotDePasseAdmin!2026', newPassword: 'court' },
    });
    check('nouveau mot de passe trop court refusé', r.status === 400);

    r = await call(changePwd, {
      method: 'POST', cookie: adminCookie,
      body: { currentPassword: 'MotDePasseAdmin!2026', newPassword: 'NouveauMotDePasse!26' },
    });
    check('mot de passe changé', r.status === 200, JSON.stringify(r.body));

    r = await call(login, { method: 'POST', body: { email: 'admin@culte.sn', password: 'NouveauMotDePasse!26', role: 'admin' } });
    check('connexion avec le nouveau mot de passe', r.status === 200);

    r = await call(login, { method: 'POST', body: { email: 'admin@culte.sn', password: 'MotDePasseAdmin!2026', role: 'admin' } });
    check('ancien mot de passe invalidé', r.status === 401);
  });

  await group('Élévation de privilège', async () => {
    // Un responsable ne doit jamais atteindre les routes d'administration.
    for (const [nom, h] of [['inscriptions', registrations], ['responsables', responsables], ['audit', audit]]) {
      const r = await call(h, { cookie: respCookie });
      check(`responsable bloqué sur /${nom}`, r.status === 403, `reçu ${r.status}`);
    }

    // Le rôle vient du jeton signé : le déclarer dans le corps ne change rien.
    const r = await call(login, {
      method: 'POST',
      body: { email: 'fatou@culte.sn', password: 'MotDePasseFatou!26', role: 'admin' },
    });
    check('un responsable ne peut pas se connecter en tant qu\'admin', r.status === 401, `reçu ${r.status}`);
  });

  /* ── Rapport ── */
  console.log('');
  for (const [mark, name, detail] of results) {
    if (!mark) { console.log(''); continue; }
    if (mark === '—') { console.log('\x1b[1m' + name + '\x1b[0m'); continue; }
    const color = mark === '✓' ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${color}${mark}\x1b[0m ${name}${detail ? '  → ' + detail : ''}`);
  }
  console.log('');
  console.log(`  ${passed} réussis, ${failed} échoués`);
  console.log('');
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error('\n✗ Le harnais a planté :', err);
  process.exit(1);
});
