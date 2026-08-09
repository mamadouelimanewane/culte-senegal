/* POST /api/auth/login — { email, password, role: 'admin'|'responsable' } */
'use strict';

const { one } = require('../_lib/db');
const { ok, fail, methods, body, rateLimited, handler } = require('../_lib/http');
const { verifyPassword, signToken, setSessionCookie } = require('../_lib/auth');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['POST'])) return;

  if (rateLimited(req, 'login', 8, 60_000)) {
    return fail(res, 429, 'Trop de tentatives. Réessayez dans une minute.');
  }

  const { email, password, role } = await body(req);
  if (!email || !password) return fail(res, 400, 'E-mail et mot de passe requis');
  if (role !== 'admin' && role !== 'responsable') {
    return fail(res, 400, 'Rôle invalide');
  }

  // Message d'erreur identique dans tous les cas d'échec : ne pas
  // révéler si l'adresse existe.
  const INVALID = 'Identifiants incorrects';

  if (role === 'admin') {
    const row = await one(
      'SELECT id, email, nom, password_hash FROM admins WHERE lower(email) = lower($1)',
      [String(email).trim()],
    );
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return fail(res, 401, INVALID);
    }
    const user = { role: 'admin', id: row.id, email: row.email, nom: row.nom };
    setSessionCookie(res, signToken(user));
    return ok(res, { user });
  }

  const row = await one(
    `SELECT id, email, nom, infra_id, infra_nom, statut, password_hash
       FROM responsables WHERE lower(email) = lower($1)`,
    [String(email).trim()],
  );

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    // Compte inexistant : peut-être une demande encore en instruction.
    const reg = await one(
      `SELECT statut FROM registrations
        WHERE lower(email) = lower($1) ORDER BY created_at DESC LIMIT 1`,
      [String(email).trim()],
    );
    if (reg && reg.statut === 'pending') {
      return fail(res, 403, 'Votre demande est en cours de validation. Merci de patienter.');
    }
    if (reg && reg.statut === 'rejected') {
      return fail(res, 403, 'Votre demande a été refusée. Contactez l\'administration pour plus d\'informations.');
    }
    return fail(res, 401, INVALID);
  }

  if (row.statut !== 'active') {
    return fail(res, 403, 'Compte suspendu. Contactez l\'administration.');
  }

  const user = {
    role: 'responsable',
    id: row.id, email: row.email, nom: row.nom,
    infraId: row.infra_id, infraNom: row.infra_nom || '',
  };
  setSessionCookie(res, signToken(user));
  return ok(res, { user });
});
