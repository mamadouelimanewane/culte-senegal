/* POST /api/auth/logout */
'use strict';

const { ok, methods, handler } = require('../_lib/http');
const { clearSessionCookie } = require('../_lib/auth');

module.exports = handler(async (req, res) => {
  if (!methods(req, res, ['POST'])) return;
  clearSessionCookie(res);
  return ok(res);
});
