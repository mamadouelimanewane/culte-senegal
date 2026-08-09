/* ════════════════════════════════════════════════════════════════
   Authentification serveur : bcrypt + JWT en cookie httpOnly.

   Le jeton n'est jamais lisible par JavaScript côté navigateur :
   une faille XSS ne permet donc pas de voler la session, et
   fabriquer une session à la main est impossible sans JWT_SECRET.
   ════════════════════════════════════════════════════════════════ */
'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { fail } = require('./http');

const COOKIE_NAME = 'culte_session';
const MAX_AGE     = 60 * 60 * 8; // 8 h
const BCRYPT_COST = 12;

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error('[auth] JWT_SECRET manquant ou trop court (32 caractères minimum).');
}

const hashPassword   = pwd => bcrypt.hash(pwd, BCRYPT_COST);
const verifyPassword = (pwd, hash) => bcrypt.compare(pwd, hash || '');

/* ── Jetons ─────────────────────────────────────────────────────── */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: MAX_AGE, issuer: 'culte' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET, { issuer: 'culte' });
  } catch {
    return null;
  }
}

/* ── Cookies ────────────────────────────────────────────────────── */
function parseCookies(req) {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const out = {};
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${MAX_AGE}`);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`);
}

/* ── Session courante ───────────────────────────────────────────── */
/** Retourne { role, id, email, nom, infraId? } ou null. */
function session(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const claims = verifyToken(token);
  if (!claims || !claims.role) return null;
  return claims;
}

/**
 * Garde de rôle. Répond 401/403 et retourne null si l'accès est refusé.
 *   const me = requireRole('admin', req, res); if (!me) return;
 */
function requireRole(role, req, res) {
  const me = session(req);
  if (!me) { fail(res, 401, 'Authentification requise'); return null; }
  if (role && me.role !== role) { fail(res, 403, 'Accès refusé'); return null; }
  return me;
}

/**
 * Protection CSRF : le cookie étant SameSite=Lax, une requête POST
 * inter-site ne l'emporte pas. On exige en plus un en-tête custom,
 * impossible à poser via un formulaire HTML classique.
 */
function requireCsrf(req, res) {
  if (req.headers['x-requested-with'] === 'culte-app') return true;
  fail(res, 403, 'Requête non autorisée');
  return false;
}

module.exports = {
  COOKIE_NAME, MAX_AGE,
  hashPassword, verifyPassword,
  signToken, verifyToken,
  setSessionCookie, clearSessionCookie, parseCookies,
  session, requireRole, requireCsrf,
};
