/* ════════════════════════════════════════════════════════════════
   Connexion Postgres partagée entre les fonctions serverless.
   Le pool est créé au niveau module : il survit aux invocations
   chaudes de la même instance Vercel.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('[db] DATABASE_URL absent — les routes API vont échouer.');
}

let _pool = global.__cultePool;
if (!_pool) {
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon/Supabase imposent TLS ; la CA n'est pas dans le bundle Vercel.
    ssl: process.env.PGSSL_DISABLE === '1' ? false : { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  _pool.on('error', err => console.error('[db] erreur pool inactif:', err.message));
  global.__cultePool = _pool;
}

const pool = _pool;

/** Requête simple. `query('SELECT * FROM t WHERE id = $1', [id])` */
async function query(text, params) {
  return pool.query(text, params);
}

/** Première ligne ou null. */
async function one(text, params) {
  const { rows } = await pool.query(text, params);
  return rows[0] || null;
}

/** Toutes les lignes. */
async function many(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

/**
 * Transaction interactive.
 * `await tx(async c => { await c.query(...); return valeur; })`
 */
async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* connexion déjà perdue */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, one, many, tx };
