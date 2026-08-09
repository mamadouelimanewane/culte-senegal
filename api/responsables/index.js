/* GET /api/responsables — liste (admin) */
'use strict';

const { many } = require('../_lib/db');
const { ok, methods, handler } = require('../_lib/http');
const { requireRole } = require('../_lib/auth');
const shape = require('../_lib/shape');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['GET'])) return;
  if (!requireRole('admin', req, res)) return;

  const rows = await many(
    `SELECT id, nom, email, tel, infra_id, infra_nom, region, statut, created_at
       FROM responsables ORDER BY created_at DESC`,
  );
  return ok(res, { responsables: rows.map(shape.responsable) });
});
