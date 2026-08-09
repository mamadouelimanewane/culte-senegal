#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   Insère le jeu de démonstration en base.

   Usage : node db/seed-demo.js
           DEMO_PASSWORD=… node db/seed-demo.js

   Idempotent : relancer le script ne crée pas de doublons.
   À réserver aux environnements de démonstration.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const demo = require('./demo-data');

function generatePassword(len = 16) {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL non défini.');
    process.exit(1);
  }

  const password = process.env.DEMO_PASSWORD || generatePassword();
  if (password.length < 10) {
    console.error('✗ DEMO_PASSWORD doit faire au moins 10 caractères.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL_DISABLE === '1' ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query('BEGIN');

    /* ── Demandes d'inscription ── */
    for (const r of demo.registrations) {
      await client.query(
        `INSERT INTO registrations
           (nom, email, tel, password_hash, infra_id, infra_nom, region,
            justification, statut, note_admin, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT DO NOTHING`,
        [r.nom, r.email, r.tel || '', hash, r.infraId, r.infraNom || '',
         r.region || '', r.justification || '', r.statut,
         r.noteAdmin || '', r.dateInscription || new Date().toISOString()],
      );
    }

    /* ── Comptes responsables ── */
    const respIdByInfra = new Map();
    for (const r of demo.responsables) {
      const { rows } = await client.query(
        `INSERT INTO responsables
           (email, password_hash, nom, tel, infra_id, infra_nom, region, statut, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (lower(email)) DO UPDATE SET nom = EXCLUDED.nom
         RETURNING id, infra_id`,
        [r.email, hash, r.nom, r.tel || '', r.infraId, r.infraNom || '',
         r.region || '', r.statut || 'active', r.dateCreation || new Date().toISOString()],
      );
      respIdByInfra.set(rows[0].infra_id, rows[0].id);
    }

    /* ── Contributions ── */
    for (const p of demo.pending) {
      await client.query(
        `INSERT INTO contributions
           (responsable_id, resp_nom, infra_id, infra_nom, type, data,
            statut, note_admin, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT DO NOTHING`,
        [respIdByInfra.get(p.infraId) || null, p.respNom || '', p.infraId,
         p.infraNom || '', p.type, JSON.stringify(p.data || {}),
         p.statut, p.noteAdmin || '', p.dateSubmit || new Date().toISOString()],
      );
    }

    /* ── Contenu publié ── */
    for (const [infraId, c] of Object.entries(demo.siteContent)) {
      await client.query(
        `INSERT INTO site_content
           (infra_id, description, horaires, telephone, email, website,
            gallery, events, actus, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
         ON CONFLICT (infra_id) DO UPDATE SET
           description = EXCLUDED.description, horaires = EXCLUDED.horaires,
           telephone = EXCLUDED.telephone, email = EXCLUDED.email,
           website = EXCLUDED.website, gallery = EXCLUDED.gallery,
           events = EXCLUDED.events, actus = EXCLUDED.actus,
           updated_at = now()`,
        [Number(infraId), c.description || '', c.horaires || '', c.telephone || '',
         c.email || '', c.website || '',
         JSON.stringify(c.gallery || []), JSON.stringify(c.events || []),
         JSON.stringify(c.actus || [])],
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }

  console.log('✓ Jeu de démonstration inséré :');
  console.log(`  ${demo.responsables.length} responsables, ` +
              `${demo.registrations.length} inscriptions, ` +
              `${demo.pending.length} contributions, ` +
              `${Object.keys(demo.siteContent).length} sites publiés`);
  if (!process.env.DEMO_PASSWORD) {
    console.log('');
    console.log('  Mot de passe des comptes de démonstration :');
    console.log('  ' + password);
    console.log('');
  }
}

main().catch(err => {
  console.error('✗ Échec du seed :', err.message);
  process.exit(1);
});
