/* ════════════════════════════════════════════════════════════════
   Helpers HTTP : réponses JSON, garde de méthode, parsing du corps,
   limitation de débit en mémoire.
   ════════════════════════════════════════════════════════════════ */
'use strict';

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Par défaut on ne cache rien ; une route publique peut avoir posé
  // sa propre politique avant d'appeler send().
  if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

const ok      = (res, body = { ok: true }) => send(res, 200, body);
const created = (res, body) => send(res, 201, body);
const fail    = (res, status, message, extra) =>
  send(res, status, { error: message, ...(extra || {}) });

/** Autorise uniquement les méthodes listées. Renvoie false si rejeté. */
function methods(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  res.setHeader('Allow', allowed.join(', '));
  fail(res, 405, 'Méthode non autorisée');
  return false;
}

/** Corps JSON (Vercel le pré-parse déjà la plupart du temps). */
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { return {}; }
}

/* ── Limitation de débit ──────────────────────────────────────────
   En mémoire, donc par instance : ce n'est pas une protection
   distribuée, mais cela suffit à casser le bourrinage d'un seul
   client sur /auth/login. ──────────────────────────────────────── */
const _hits = global.__culteRate || (global.__culteRate = new Map());

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/** true si la requête doit être bloquée. */
function rateLimited(req, bucket, limit = 10, windowMs = 60_000) {
  const key = bucket + ':' + clientIp(req);
  const now = Date.now();
  const entry = _hits.get(key);
  if (!entry || now > entry.reset) {
    _hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  if (_hits.size > 5000) _hits.clear(); // garde-fou mémoire
  return entry.count > limit;
}

/** Enveloppe un handler : convertit toute exception en 500 propre. */
function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error('[api]', req.method, req.url, '—', err);
      if (!res.writableEnded) fail(res, 500, 'Erreur serveur');
    }
  };
}

module.exports = {
  send, ok, created, fail, methods, body,
  rateLimited, clientIp, handler,
};
