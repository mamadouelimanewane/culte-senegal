/* ════════════════════════════════════════════════════════════════
   CULTE — Client API

   Toutes les données partagées (inscriptions, responsables,
   contributions, contenu publié) transitent désormais par le serveur.
   La session vit dans un cookie httpOnly : elle n'est ni lisible ni
   falsifiable depuis le navigateur.
   ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // Le backoffice est servi depuis /admin/ et /responsable/ : on
  // remonte à la racine pour joindre l'API quel que soit le portail.
  const BASE = '/api';

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  async function request(method, path, payload) {
    const opts = {
      method,
      credentials: 'same-origin',
      headers: {
        // En-tête custom : un formulaire inter-site ne peut pas le poser,
        // ce qui neutralise les requêtes CSRF côté serveur.
        'X-Requested-With': 'culte-app',
      },
    };
    if (payload !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(payload);
    }

    let res;
    try {
      res = await fetch(BASE + path, opts);
    } catch {
      throw new ApiError('Connexion au serveur impossible. Vérifiez votre réseau.', 0);
    }

    let body = null;
    try { body = await res.json(); } catch { /* réponse vide */ }

    if (!res.ok) {
      throw new ApiError(body?.error || `Erreur ${res.status}`, res.status);
    }
    return body || {};
  }

  const get   = p => request('GET', p);
  const post  = (p, b) => request('POST', p, b);
  const patch = (p, b) => request('PATCH', p, b);
  const put   = (p, b) => request('PUT', p, b);

  const API = {
    ApiError,

    /* ── Session ── */
    login:  (email, password, role) => post('/auth/login', { email, password, role }),
    logout: () => post('/auth/logout', {}),
    me:     () => get('/auth/me'),
    changePassword: (currentPassword, newPassword) =>
      post('/auth/password', { currentPassword, newPassword }),

    /* ── Inscriptions ── */
    listRegistrations: () => get('/registrations').then(r => r.registrations),
    submitRegistration: data => post('/registrations', data),
    reviewRegistration: (id, action, note) =>
      patch('/registrations/' + encodeURIComponent(id), { action, note }),

    /* ── Responsables ── */
    listResponsables: () => get('/responsables').then(r => r.responsables),

    /* ── Contributions ── */
    listContributions: () => get('/contributions').then(r => r.contributions),
    submitContribution: (type, data) => post('/contributions', { type, data }),
    reviewContribution: (id, action, note) =>
      patch('/contributions/' + encodeURIComponent(id), { action, note }),

    /* ── Contenu publié (lecture publique) ── */
    getContent: infraId =>
      get('/content' + (infraId != null ? '?infraId=' + encodeURIComponent(infraId) : ''))
        .then(r => r.content),

    /* ── Corrections du jeu de référence ── */
    getDatasetEdits: () => get('/dataset-edits').then(r => r.edits),
    saveDatasetEdit: (dataset, recordId, patchObj, deleted) =>
      put('/dataset-edits', { dataset, recordId, patch: patchObj, deleted: !!deleted }),
    clearDatasetEdits: () => request('DELETE', '/dataset-edits'),

    /* ── Journal ── */
    getAuditLog: () => get('/audit').then(r => r.log),
  };

  global.CulteAPI = API;
})(window);
