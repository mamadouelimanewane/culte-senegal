/* POST /api/auth/password — changement de mot de passe (admin ou responsable) */
'use strict';

const { query, one } = require('../_lib/db');
const { ok, fail, methods, body, rateLimited, handler } = require('../_lib/http');
const { session, requireCsrf, hashPassword, verifyPassword } = require('../_lib/auth');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['POST'])) return;
  if (!requireCsrf(req, res)) return;

  const me = session(req);
  if (!me) return fail(res, 401, 'Authentification requise');
  if (rateLimited(req, 'password', 5, 300_000)) {
    return fail(res, 429, 'Trop de tentatives. Réessayez plus tard.');
  }

  const { currentPassword, newPassword } = await body(req);
  if (!currentPassword || !newPassword) {
    return fail(res, 400, 'Mot de passe actuel et nouveau mot de passe requis');
  }
  if (String(newPassword).length < 10) {
    return fail(res, 400, 'Le nouveau mot de passe doit faire au moins 10 caractères');
  }

  const table = me.role === 'admin' ? 'admins' : 'responsables';
  const row = await one(`SELECT password_hash FROM ${table} WHERE id = $1`, [me.id]);
  if (!row) return fail(res, 404, 'Compte introuvable');

  if (!(await verifyPassword(currentPassword, row.password_hash))) {
    return fail(res, 401, 'Mot de passe actuel incorrect');
  }

  await query(`UPDATE ${table} SET password_hash = $1 WHERE id = $2`,
    [await hashPassword(newPassword), me.id]);

  await query(
    `INSERT INTO audit_log (actor_type, actor_id, actor_email, action, target)
     VALUES ($1, $2, $3, 'change_password', '')`,
    [me.role, me.id, me.email],
  );

  return ok(res);
});
