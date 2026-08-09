/* PATCH /api/contributions/:id — { action: 'approve'|'reject', note } (admin)

   L'approbation fusionne la contribution dans site_content au sein
   d'une même transaction : le contenu publié et le statut de la
   contribution ne peuvent pas diverger. */
'use strict';

const { tx } = require('../_lib/db');
const { ok, fail, methods, body, handler } = require('../_lib/http');
const { requireRole, requireCsrf } = require('../_lib/auth');
const shape = require('../_lib/shape');

const LABELS = {
  profile: 'Profil', gallery_add: 'Photo', event: 'Événement', actu: 'Actualité',
};

/** Applique la contribution sur la ligne de contenu (objet JS). */
function merge(content, contrib) {
  const d = contrib.data || {};
  const c = content;

  if (contrib.type === 'profile') {
    for (const k of ['description', 'horaires', 'telephone', 'email', 'website']) {
      if (d[k]) c[k] = d[k];
    }
  } else if (contrib.type === 'gallery_add') {
    c.gallery = c.gallery || [];
    c.gallery.push({
      id: contrib.id, url: d.url, caption: d.caption || '',
      dateAdded: contrib.created_at,
    });
  } else if (contrib.type === 'event') {
    c.events = c.events || [];
    c.events.push({
      id: contrib.id, titre: d.titre, dateDebut: d.dateDebut, dateFin: d.dateFin,
      lieu: d.lieu || '', description: d.description || '', photos: d.photos || [],
    });
  } else if (contrib.type === 'actu') {
    c.actus = c.actus || [];
    c.actus.unshift({
      id: contrib.id, titre: d.titre, contenu: d.contenu,
      photo: d.photo || '', date: contrib.created_at,
    });
  }
  return c;
}

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
    const { rows } = await c.query(
      'SELECT * FROM contributions WHERE id = $1 FOR UPDATE', [id]);
    const contrib = rows[0];
    if (!contrib) return { error: 404, message: 'Contribution introuvable' };
    if (contrib.statut !== 'pending') {
      return { error: 409, message: 'Cette contribution a déjà été traitée.' };
    }

    const statut = action === 'approve' ? 'approved' : 'rejected';
    const { rows: upd } = await c.query(
      `UPDATE contributions
          SET statut = $1, note_admin = $2, reviewed_at = now()
        WHERE id = $3
      RETURNING id, responsable_id, resp_nom, infra_id, infra_nom, type,
                data, statut, note_admin, created_at`,
      [statut, noteAdmin, id],
    );

    if (action === 'approve') {
      await c.query(
        `INSERT INTO site_content (infra_id) VALUES ($1)
         ON CONFLICT (infra_id) DO NOTHING`, [contrib.infra_id]);

      const { rows: cur } = await c.query(
        'SELECT * FROM site_content WHERE infra_id = $1 FOR UPDATE',
        [contrib.infra_id]);

      const merged = merge(cur[0], contrib);
      await c.query(
        `UPDATE site_content
            SET description = $2, horaires = $3, telephone = $4, email = $5,
                website = $6, gallery = $7, events = $8, actus = $9,
                updated_at = now()
          WHERE infra_id = $1`,
        [contrib.infra_id,
         merged.description || '', merged.horaires || '', merged.telephone || '',
         merged.email || '', merged.website || '',
         JSON.stringify(merged.gallery || []),
         JSON.stringify(merged.events  || []),
         JSON.stringify(merged.actus   || [])],
      );
    }

    await c.query(
      `INSERT INTO audit_log (actor_type, actor_id, actor_email, action, target)
       VALUES ('admin', $1, $2, $3, $4)`,
      [me.id, me.email,
       action === 'approve' ? 'approve_content' : 'reject_content',
       action === 'approve'
         ? `${LABELS[contrib.type] || contrib.type} — ${contrib.infra_nom || ''}`
         : (contrib.infra_nom || '')],
    );

    return { contribution: shape.contribution(upd[0]) };
  });

  if (result.error) return fail(res, result.error, result.message);
  return ok(res, result);
});
