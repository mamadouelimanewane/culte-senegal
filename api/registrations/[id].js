/* PATCH /api/registrations/:id — { action: 'approve'|'reject', note } (admin)

   L'approbation crée le compte responsable en réutilisant le hash
   bcrypt déjà calculé lors de la demande : le mot de passe en clair
   n'a jamais transité ni été stocké. */
'use strict';

const { tx } = require('../_lib/db');
const { ok, fail, methods, body, handler } = require('../_lib/http');
const { requireRole, requireCsrf } = require('../_lib/auth');
const shape = require('../_lib/shape');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['PATCH', 'POST'])) return;
  if (!requireCsrf(req, res)) return;

  const me = requireRole('admin', req, res);
  if (!me) return;

  const id = Number(req.query?.id);
  if (!Number.isInteger(id)) return fail(res, 400, 'Identifiant invalide');

  const { action, note } = await body(req);
  if (action !== 'approve' && action !== 'reject') {
    return fail(res, 400, 'Action invalide');
  }
  const noteAdmin = String(note || '').slice(0, 2000);

  const result = await tx(async c => {
    // FOR UPDATE : deux admins qui valident en même temps ne peuvent
    // pas créer deux comptes pour la même demande.
    const { rows } = await c.query(
      'SELECT * FROM registrations WHERE id = $1 FOR UPDATE', [id]);
    const reg = rows[0];
    if (!reg) return { error: 404, message: 'Demande introuvable' };
    if (reg.statut !== 'pending') {
      return { error: 409, message: 'Cette demande a déjà été traitée.' };
    }

    const statut = action === 'approve' ? 'approved' : 'rejected';
    const { rows: upd } = await c.query(
      `UPDATE registrations
          SET statut = $1, note_admin = $2, reviewed_at = now()
        WHERE id = $3 RETURNING *`,
      [statut, noteAdmin, id],
    );

    if (action === 'approve') {
      await c.query(
        `INSERT INTO responsables (email, password_hash, nom, tel, infra_id, infra_nom, region)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (lower(email)) DO NOTHING`,
        [reg.email, reg.password_hash, reg.nom, reg.tel || '',
         reg.infra_id, reg.infra_nom || '', reg.region || ''],
      );
    }

    await c.query(
      `INSERT INTO audit_log (actor_type, actor_id, actor_email, action, target)
       VALUES ('admin', $1, $2, $3, $4)`,
      [me.id, me.email,
       action === 'approve' ? 'approve_reg' : 'reject_reg',
       action === 'approve' ? `${reg.nom} → ${reg.infra_nom || ''}` : reg.nom],
    );

    return { registration: shape.registration(upd[0]) };
  });

  if (result.error) return fail(res, result.error, result.message);
  return ok(res, result);
});
