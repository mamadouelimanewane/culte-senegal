/* GET /api/content — contenu publié, lecture publique.
   GET /api/content?infraId=42 — une seule infrastructure. */
'use strict';

const { many } = require('../_lib/db');
const { ok, methods, handler } = require('../_lib/http');
const shape = require('../_lib/shape');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['GET'])) return;

  const raw = req.query?.infraId;
  const infraId = raw != null && raw !== '' ? Number(raw) : null;

  const rows = Number.isInteger(infraId)
    ? await many('SELECT * FROM site_content WHERE infra_id = $1', [infraId])
    : await many('SELECT * FROM site_content');

  // Forme identique à l'ancien objet localStorage : { "42": {...} }
  const content = {};
  for (const r of rows) content[String(r.infra_id)] = shape.content(r);

  // Contenu public et peu volatil : on autorise le cache CDN Vercel,
  // avec revalidation en arrière-plan.
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return ok(res, { content });
});
