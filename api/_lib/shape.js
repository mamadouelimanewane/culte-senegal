/* ════════════════════════════════════════════════════════════════
   Conversion des lignes SQL vers la forme attendue par le front
   (camelCase), pour ne pas réécrire tout le rendu existant.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const iso = d => (d instanceof Date ? d.toISOString() : (d || ''));

const registration = r => ({
  id:       r.id,
  nom:      r.nom,
  email:    r.email,
  tel:      r.tel || '',
  infraId:  r.infra_id,
  infraNom: r.infra_nom || '',
  region:   r.region || '',
  justification: r.justification || '',
  statut:   r.statut,
  noteAdmin: r.note_admin || '',
  dateSubmit: iso(r.created_at),
});

const responsable = r => ({
  id:       r.id,
  nom:      r.nom,
  email:    r.email,
  tel:      r.tel || '',
  infraId:  r.infra_id,
  infraNom: r.infra_nom || '',
  region:   r.region || '',
  statut:   r.statut,
  dateCreation: iso(r.created_at),
});

const contribution = r => ({
  id:       r.id,
  respId:   r.responsable_id,
  respNom:  r.resp_nom || '',
  infraId:  r.infra_id,
  infraNom: r.infra_nom || '',
  type:     r.type,
  data:     r.data || {},
  statut:   r.statut,
  noteAdmin: r.note_admin || '',
  dateSubmit: iso(r.created_at),
});

const content = r => ({
  description: r.description || '',
  horaires:    r.horaires || '',
  telephone:   r.telephone || '',
  email:       r.email || '',
  website:     r.website || '',
  gallery:     r.gallery || [],
  events:      r.events || [],
  actus:       r.actus || [],
  updatedAt:   iso(r.updated_at),
});

const logEntry = r => ({
  action: r.action,
  name:   r.target || '',
  ts:     iso(r.created_at),
});

module.exports = { registration, responsable, contribution, content, logEntry };
