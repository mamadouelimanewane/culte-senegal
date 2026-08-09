#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   Crée ou réinitialise un compte administrateur.

   Usage : node db/create-admin.js <email> [nom]

   Le mot de passe n'est jamais passé en argument (il resterait dans
   l'historique du shell) : il est généré aléatoirement et affiché
   une seule fois, ou lu dans ADMIN_PASSWORD s'il est défini.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

function generatePassword(len = 20) {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%^&*-_';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function main() {
  const email = process.argv[2];
  const nom   = process.argv[3] || 'Administrateur';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Usage : node db/create-admin.js <email> [nom]');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('✗ DATABASE_URL non défini.');
    process.exit(1);
  }

  const password = process.env.ADMIN_PASSWORD || generatePassword();
  if (password.length < 10) {
    console.error('✗ ADMIN_PASSWORD doit faire au moins 10 caractères.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL_DISABLE === '1' ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO admins (email, password_hash, nom)
       VALUES ($1, $2, $3)
       ON CONFLICT (lower(email))
       DO UPDATE SET password_hash = EXCLUDED.password_hash, nom = EXCLUDED.nom
       RETURNING id, email, nom`,
      [email, hash, nom],
    );
    const a = rows[0];
    console.log(`✓ Compte admin #${a.id} : ${a.email} (${a.nom})`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log('');
      console.log('  Mot de passe généré (affiché une seule fois) :');
      console.log('  ' + password);
      console.log('');
    }
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('✗ Échec :', err.message);
  process.exit(1);
});
