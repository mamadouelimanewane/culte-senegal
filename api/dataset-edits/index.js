/* GET /api/dataset-edits  — corrections du jeu de référence (public en
                             lecture : le portail doit afficher les mêmes
                             données corrigées que le backoffice)
   PUT    /api/dataset-edits — { dataset, recordId, patch, deleted } (admin)
   DELETE /api/dataset-edits — annule toutes les corrections (admin) */
'use strict';

const { many, query } = require('../_lib/db');
const { ok, fail, methods, body, handler } = require('../_lib/http');
const { requireRole, requireCsrf } = require('../_lib/auth');

const DATASETS = ['infras', 'forms'];

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['GET', 'PUT', 'POST', 'DELETE'])) return;

  if (req.method === 'GET') {
    const rows = await many(
      'SELECT dataset, record_id, patch, deleted FROM dataset_edits');
    const edits = { infras: {}, forms: {}, deleted: { infras: [], forms: [] } };
    for (const r of rows) {
      if (r.deleted) edits.deleted[r.dataset].push(r.record_id);
      else edits[r.dataset][r.record_id] = r.patch || {};
    }
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return ok(res, { edits });
  }

  if (!requireCsrf(req, res)) return;
  const me = requireRole('admin', req, res);
  if (!me) return;

  if (req.method === 'DELETE') {
    await query('DELETE FROM dataset_edits');
    await query(
      `INSERT INTO audit_log (actor_type, actor_id, actor_email, action, target)
       VALUES ('admin', $1, $2, 'clear_edits', '')`,
      [me.id, me.email],
    );
    return ok(res);
  }

  const b = await body(req);
  const dataset  = String(b.dataset || '');
  const recordId = Number(b.recordId);
  if (!DATASETS.includes(dataset)) return fail(res, 400, 'Jeu de données invalide');
  if (!Number.isInteger(recordId)) return fail(res, 400, 'Enregistrement invalide');

  const deleted = b.deleted === true;
  const patch   = (b.patch && typeof b.patch === 'object') ? b.patch : {};

  await query(
    `INSERT INTO dataset_edits (dataset, record_id, patch, deleted)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (dataset, record_id)
     DO UPDATE SET patch = EXCLUDED.patch,
                   deleted = EXCLUDED.deleted,
                   updated_at = now()`,
    [dataset, recordId, JSON.stringify(patch), deleted],
  );

  await query(
    `INSERT INTO audit_log (actor_type, actor_id, actor_email, action, target)
     VALUES ('admin', $1, $2, $3, $4)`,
    [me.id, me.email, deleted ? 'delete_record' : 'edit_record',
     `${dataset}#${recordId}`],
  );

  return ok(res);
});
