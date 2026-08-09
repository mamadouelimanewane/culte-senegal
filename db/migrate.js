#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   Applique db/schema.sql sur DATABASE_URL.
   Usage : node db/migrate.js
   ════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('✗ DATABASE_URL non défini.');
    console.error('  PowerShell : $env:DATABASE_URL = "postgres://…"');
    process.exit(1);
  }

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const client = new Client({
    connectionString: url,
    ssl: process.env.PGSSL_DISABLE === '1' ? false : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log('✓ Schéma appliqué.');

    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`);
    console.log('  Tables :', rows.map(r => r.table_name).join(', '));
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('✗ Migration échouée :', err.message);
  process.exit(1);
});
