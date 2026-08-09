/* GET  /api/contributions — admin : tout ; responsable : ses contributions
   POST /api/contributions — dépôt d'une contribution (responsable) */
'use strict';

const { many, one } = require('../_lib/db');
const { ok, created, fail, methods, body, rateLimited, handler } = require('../_lib/http');
const { session, requireCsrf } = require('../_lib/auth');
const shape = require('../_lib/shape');

const TYPES = ['profile', 'gallery_add', 'event', 'actu'];

/* Champs autorisés par type : tout le reste est écarté avant stockage. */
const FIELDS = {
  profile:     ['description', 'horaires', 'telephone', 'email', 'website'],
  gallery_add: ['url', 'caption'],
  event:       ['titre', 'dateDebut', 'dateFin', 'lieu', 'description', 'photos'],
  actu:        ['titre', 'contenu', 'photo'],
};

const MAX_TEXT  = 5000;
const MAX_IMAGE = 400_000; // ~400 Ko par data-URL

function sanitize(type, raw) {
  const out = {};
  for (const key of FIELDS[type]) {
    const v = raw?.[key];
    if (v == null) continue;
    if (Array.isArray(v)) {
      out[key] = v.filter(x => typeof x === 'string' && x.length <= MAX_IMAGE).slice(0, 12);
    } else if (typeof v === 'string') {
      out[key] = v.slice(0, key === 'photo' || key === 'url' ? MAX_IMAGE : MAX_TEXT);
    }
  }
  return out;
}

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['GET', 'POST'])) return;

  const me = session(req);
  if (!me) return fail(res, 401, 'Authentification requise');

  if (req.method === 'GET') {
    const rows = me.role === 'admin'
      ? await many(
          `SELECT id, responsable_id, resp_nom, infra_id, infra_nom, type,
                  data, statut, note_admin, created_at
             FROM contributions ORDER BY created_at DESC`)
      : await many(
          `SELECT id, responsable_id, resp_nom, infra_id, infra_nom, type,
                  data, statut, note_admin, created_at
             FROM contributions WHERE responsable_id = $1
            ORDER BY created_at DESC`, [me.id]);
    return ok(res, { contributions: rows.map(shape.contribution) });
  }

  /* ── Dépôt ── */
  if (!requireCsrf(req, res)) return;
  if (me.role !== 'responsable') return fail(res, 403, 'Accès refusé');
  if (rateLimited(req, 'contrib', 30, 3_600_000)) {
    return fail(res, 429, 'Trop de contributions envoyées. Réessayez plus tard.');
  }

  const b = await body(req);
  if (!TYPES.includes(b.type)) return fail(res, 400, 'Type de contribution invalide');

  const data = sanitize(b.type, b.data);
  if (!Object.keys(data).length) return fail(res, 400, 'Contribution vide');

  // L'infrastructure vient de la session, jamais du client : un
  // responsable ne peut pas publier sur l'établissement d'un autre.
  const row = await one(
    `INSERT INTO contributions (responsable_id, resp_nom, infra_id, infra_nom, type, data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, responsable_id, resp_nom, infra_id, infra_nom, type,
               data, statut, note_admin, created_at`,
    [me.id, me.nom || '', me.infraId, me.infraNom || '', b.type, JSON.stringify(data)],
  );

  return created(res, { contribution: shape.contribution(row) });
});
