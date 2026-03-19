/* ════════════════════════════════════════════════════════════════
   CULTE — Partage Social & Avis Utilisateurs
   WhatsApp, Facebook, copie lien + système de notes 1-5 étoiles
   ════════════════════════════════════════════════════════════════ */
'use strict';

const Social = (() => {

  const BASE_URL = 'https://culte.vercel.app';

  /* ══════════════════════════════════════════════════════════
     PARTAGE SOCIAL
     ══════════════════════════════════════════════════════════ */

  function shareWhatsApp(name, type, region, commune) {
    const text = `🏛 Découvrez "${name}" — ${type || 'lieu culturel'} à ${commune || region || 'Sénégal'}\n\n` +
      `📍 Région : ${region}\n` +
      `🔗 ${BASE_URL}\n\n` +
      `Trouvé sur Scenews — Culture Sénégal`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
    _trackShare(name, 'whatsapp');
  }

  function shareFacebook(name, type, region) {
    const text = `Découvrez "${name}" — ${type || 'lieu culturel'} à ${region || 'Sénégal'} sur Scenews`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(BASE_URL)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,width=600,height=400');
    _trackShare(name, 'facebook');
  }

  function shareTwitter(name, type, region) {
    const text = `🏛 "${name}" — ${type || ''} à ${region || 'Sénégal'}\n🔗 ${BASE_URL}\n#Scenews #CultureSenegal`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,width=600,height=400');
    _trackShare(name, 'twitter');
  }

  function copyLink(name) {
    const text = `${BASE_URL} — "${name}" sur Scenews`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => _showToast('Lien copié !')).catch(() => _fallbackCopy(text));
    } else {
      _fallbackCopy(text);
    }
    _trackShare(name, 'copy');
  }

  function _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); _showToast('Lien copié !'); }
    catch(e) { _showToast('Impossible de copier'); }
    ta.remove();
  }

  function _trackShare(name, platform) {
    if (typeof Analytics !== 'undefined' && Analytics.trackShare) {
      Analytics.trackShare(name, platform);
    }
  }

  /* ── Boutons de partage (HTML à injecter) ─────────────────── */
  function renderShareButtons(name, type, region, commune) {
    const n = _esc(name), t = _esc(type), r = _esc(region), c = _esc(commune);
    return `
      <div class="social-share-row">
        <button class="share-btn share-whatsapp" data-action="whatsapp" data-name="${n}" data-type="${t}" data-region="${r}" data-commune="${c}" title="Partager sur WhatsApp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </button>
        <button class="share-btn share-facebook" data-action="facebook" data-name="${n}" data-type="${t}" data-region="${r}" title="Partager sur Facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </button>
        <button class="share-btn share-twitter" data-action="twitter" data-name="${n}" data-type="${t}" data-region="${r}" title="Partager sur X">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </button>
        <button class="share-btn share-copy" data-action="copy" data-name="${n}" title="Copier le lien">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════
     SYSTÈME D'AVIS ET NOTES
     ══════════════════════════════════════════════════════════ */

  const STORAGE_KEY = 'culte_reviews';

  function _loadReviews() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function _saveReviews(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch(e) {}
  }

  function addReview(itemId, rating, comment) {
    rating = Math.max(1, Math.min(5, Math.round(rating)));
    const reviews = _loadReviews();
    if (!reviews[itemId]) reviews[itemId] = [];
    reviews[itemId].push({
      rating,
      comment: (comment || '').substring(0, 300),
      date: new Date().toISOString(),
      id: 'r_' + Date.now()
    });
    _saveReviews(reviews);
    return getItemStats(itemId);
  }

  function getItemReviews(itemId) {
    const reviews = _loadReviews();
    return (reviews[itemId] || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function getItemStats(itemId) {
    const reviews = getItemReviews(itemId);
    if (!reviews.length) return { avg: 0, count: 0, stars: [0,0,0,0,0] };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    const stars = [0,0,0,0,0];
    reviews.forEach(r => stars[r.rating - 1]++);
    return {
      avg: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
      stars
    };
  }

  /* ── Widget étoiles (HTML) ────────────────────────────────── */
  function renderStars(itemId) {
    const stats = getItemStats(itemId);
    const fullStars = Math.floor(stats.avg);
    const halfStar = stats.avg - fullStars >= 0.5;
    let html = '<div class="review-stars-display">';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) html += '<span class="star-full">★</span>';
      else if (i === fullStars && halfStar) html += '<span class="star-half">★</span>';
      else html += '<span class="star-empty">☆</span>';
    }
    html += ` <span class="review-avg">${stats.avg || '—'}</span>`;
    html += ` <span class="review-count">(${stats.count} avis)</span>`;
    html += '</div>';
    return html;
  }

  /* ── Widget formulaire d'avis ─────────────────────────────── */
  function renderReviewForm(itemId) {
    return `
      <div class="review-form" data-item="${_esc(itemId)}">
        <div class="review-form-title">Votre avis</div>
        <div class="review-star-input" data-item="${_esc(itemId)}">
          ${[1,2,3,4,5].map(i => `<button class="star-btn" data-rating="${i}" aria-label="${i} étoile${i>1?'s':''}">☆</button>`).join('')}
        </div>
        <div class="review-input-row">
          <input type="text" class="review-comment-input" placeholder="Commentaire (optionnel)" maxlength="300">
          <button class="review-submit-btn" data-item="${_esc(itemId)}">Envoyer</button>
        </div>
      </div>
    `;
  }

  /* ── Widget liste d'avis ──────────────────────────────────── */
  function renderReviewsList(itemId, limit) {
    const reviews = getItemReviews(itemId).slice(0, limit || 5);
    if (!reviews.length) return '<div class="no-reviews">Aucun avis pour le moment. Soyez le premier !</div>';

    return `<div class="reviews-list">${reviews.map(r => `
      <div class="review-item">
        <div class="review-item-header">
          <span class="review-item-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
          <span class="review-item-date">${new Date(r.date).toLocaleDateString('fr-FR')}</span>
        </div>
        ${r.comment ? `<p class="review-item-comment">${_esc(r.comment)}</p>` : ''}
      </div>
    `).join('')}</div>`;
  }

  /* ── Toast notification ───────────────────────────────────── */
  function _showToast(msg) {
    const existing = document.querySelector('.social-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'social-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 2500);
  }

  function _esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  /* ── Délégation globale pour les boutons de partage ───────── */
  function init() {
    document.addEventListener('click', e => {
      // Boutons de partage
      const shareBtn = e.target.closest('.share-btn');
      if (shareBtn) {
        const action = shareBtn.dataset.action;
        const name = shareBtn.dataset.name;
        const type = shareBtn.dataset.type;
        const region = shareBtn.dataset.region;
        const commune = shareBtn.dataset.commune;
        if (action === 'whatsapp') shareWhatsApp(name, type, region, commune);
        else if (action === 'facebook') shareFacebook(name, type, region);
        else if (action === 'twitter') shareTwitter(name, type, region);
        else if (action === 'copy') copyLink(name);
        return;
      }

      // Étoiles du formulaire d'avis
      const starBtn = e.target.closest('.star-btn');
      if (starBtn) {
        const rating = parseInt(starBtn.dataset.rating);
        const container = starBtn.closest('.review-star-input');
        if (container) {
          container.querySelectorAll('.star-btn').forEach((b, i) => {
            b.textContent = i < rating ? '★' : '☆';
            b.classList.toggle('active', i < rating);
          });
          container.dataset.selected = rating;
        }
        return;
      }

      // Soumission d'avis
      const submitBtn = e.target.closest('.review-submit-btn');
      if (submitBtn) {
        const itemId = submitBtn.dataset.item;
        const form = submitBtn.closest('.review-form');
        const starInput = form?.querySelector('.review-star-input');
        const commentInput = form?.querySelector('.review-comment-input');
        const rating = parseInt(starInput?.dataset.selected || '0');
        if (!rating) { _showToast('Veuillez donner une note'); return; }
        const comment = commentInput?.value?.trim() || '';
        addReview(itemId, rating, comment);

        // Feedback
        _showToast('Merci pour votre avis !');
        submitBtn.textContent = '✅ Envoyé';
        submitBtn.disabled = true;
        if (commentInput) commentInput.value = '';

        // Rafraîchir l'affichage des étoiles
        const starsDisplay = document.querySelector(`.review-stars-display`);
        if (starsDisplay) {
          const parent = starsDisplay.parentElement;
          if (parent) {
            const newStars = document.createElement('div');
            newStars.innerHTML = renderStars(itemId);
            starsDisplay.replaceWith(newStars.firstElementChild);
          }
        }
      }
    });
  }

  return {
    init,
    // Partage
    shareWhatsApp,
    shareFacebook,
    shareTwitter,
    copyLink,
    renderShareButtons,
    // Avis
    addReview,
    getItemReviews,
    getItemStats,
    renderStars,
    renderReviewForm,
    renderReviewsList,
  };

})();
