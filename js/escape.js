/* ════════════════════════════════════════════════════════════════
   CULTE — Échappement HTML

   Tout contenu venant d'un utilisateur (contribution d'un
   responsable, demande d'inscription, saisie publique) doit passer
   par escapeHtml() avant d'être injecté via innerHTML.
   ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const HTML_ENTITIES = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;', '`': '&#96;',
  };

  /** Texte sûr pour une insertion dans du HTML ou un attribut. */
  function escapeHtml(value) {
    if (value == null) return '';
    return String(value).replace(/[&<>"'`]/g, c => HTML_ENTITIES[c]);
  }

  /**
   * URL sûre pour href/src : n'autorise que http(s), mailto, tel et
   * les data-URL d'image. Bloque javascript: et data:text/html.
   */
  function safeUrl(value) {
    const url = String(value == null ? '' : value).trim();
    if (!url) return '';
    if (/^(https?:|mailto:|tel:)/i.test(url)) return escapeHtml(url);
    if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(url)) {
      return escapeHtml(url);
    }
    if (/^[./#?]/.test(url) && !/^\/\//.test(url)) return escapeHtml(url); // chemin relatif
    return '';
  }

  /**
   * Valeur sûre pour une chaîne JavaScript placée dans un attribut
   * de gestionnaire inline (onclick="f('…')").
   *
   * L'échappement HTML seul ne suffit pas ici : le parseur décode les
   * entités AVANT que le JavaScript ne soit évalué, donc un &#39;
   * redeviendrait une apostrophe fermante. On échappe donc d'abord
   * pour le contexte JS, puis pour le contexte HTML.
   */
  function jsAttr(value) {
    const js = String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
    return escapeHtml(js);
  }

  /**
   * Objet sérialisé pour un gestionnaire inline délimité par des
   * apostrophes : onclick='f(${jsonAttr(obj)})'.
   *
   * Les apostrophes sont converties en échappement Unicode JSON
   * (') AVANT l'échappement HTML : elles survivent au décodage
   * du parseur sans jamais refermer l'attribut.
   */
  function jsonAttr(value) {
    const json = JSON.stringify(value == null ? null : value)
      .replace(/'/g, '\\u0027')
      .replace(/</g, '\\u003c');
    return escapeHtml(json);
  }

  /** Balise de gabarit : échappe automatiquement chaque interpolation.
   *  html`<p>${saisieUtilisateur}</p>` */
  function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) {
      out += escapeHtml(values[i]) + strings[i + 1];
    }
    return out;
  }

  global.escapeHtml = escapeHtml;
  global.safeUrl    = safeUrl;
  global.jsAttr     = jsAttr;
  global.jsonAttr   = jsonAttr;
  global.htmlSafe   = html;
})(window);
