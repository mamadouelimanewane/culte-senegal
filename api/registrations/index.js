/* GET  /api/registrations — liste (admin)
   POST /api/registrations — demande d'inscription (public) */
'use strict';

const { many, one, query } = require('../_lib/db');
const { ok, created, fail, methods, body, rateLimited, handler } = require('../_lib/http');
const { requireRole, requireCsrf, hashPassword } = require('../_lib/auth');
const shape = require('../_lib/shape');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['GET', 'POST'])) return;

  if (req.method === 'GET') {
    if (!requireRole('admin', req, res)) return;
    const rows = await many(
      `SELECT id, nom, email, tel, infra_id, infra_nom, region, justification,
              statut, note_admin, created_at
         FROM registrations ORDER BY created_at DESC`,
    );
    return ok(res, { registrations: rows.map(shape.registration) });
  }

  /* ── Création publique ── */
  if (!requireCsrf(req, res)) return;
  if (rateLimited(req, 'register', 5, 3_600_000)) {
    return fail(res, 429, 'Trop de demandes envoyées. Réessayez plus tard.');
  }

  const b = await body(req);
  const nom      = String(b.nom || '').trim();
  const email    = String(b.email || '').trim();
  const tel      = String(b.tel || '').trim();
  const password = String(b.password || '');
  const infraId  = Number(b.infraId);
  const infraNom = String(b.infraNom || '').trim();
  const region   = String(b.region || '').trim();
  const justif   = String(b.justification || '').trim().slice(0, 3000);

  if (!nom || !email || !password) {
    return fail(res, 400, 'Nom, e-mail et mot de passe requis');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail(res, 400, 'Adresse e-mail invalide');
  }
  if (password.length < 10) {
    return fail(res, 400, 'Le mot de passe doit faire au moins 10 caractères');
  }
  if (!Number.isInteger(infraId) || infraId < 0) {
    return fail(res, 400, 'Infrastructure invalide');
  }

  const already = await one(
    'SELECT 1 FROM responsables WHERE lower(email) = lower($1)', [email]);
  if (already) {
    return fail(res, 409, 'Un compte existe déjà pour cette adresse e-mail.');
  }

  const pending = await one(
    `SELECT 1 FROM registrations
      WHERE lower(email) = lower($1) AND statut = 'pending'`, [email]);
  if (pending) {
    return fail(res, 409, 'Une demande est déjà en cours pour cette adresse e-mail.');
  }

  await query(
    `INSERT INTO registrations
       (nom, email, tel, password_hash, infra_id, infra_nom, region, justification)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [nom, email, tel, await hashPassword(password), infraId, infraNom, region, justif],
  );

  return created(res, { ok: true });
});
