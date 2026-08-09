/* GET /api/audit — journal d'activité (admin) */
'use strict';

const { many } = require('../_lib/db');
const { ok, methods, handler } = require('../_lib/http');
const { requireRole } = require('../_lib/auth');
const shape = require('../_lib/shape');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['GET'])) return;
  if (!requireRole('admin', req, res)) return;

  const rows = await many(
    'SELECT action, target, created_at FROM audit_log ORDER BY created_at DESC LIMIT 200');
  return ok(res, { log: rows.map(shape.logEntry) });
});
