/* GET /api/auth/me — session courante (source de vérité côté serveur) */
'use strict';

const { ok, fail, methods, handler } = require('../_lib/http');
const { session } = require('../_lib/auth');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['GET'])) return;
  const me = session(req);
  if (!me) return fail(res, 401, 'Non authentifié');
  const { role, id, email, nom, infraId, infraNom } = me;
  return ok(res, { user: { role, id, email, nom, infraId, infraNom } });
});
