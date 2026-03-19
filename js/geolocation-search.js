/**
 * GeoSearch — Module de recherche géolocalisée
 *
 * Module IIFE vanilla JS pour la recherche par proximité géographique.
 * Conçu pour l'infrastructure culturelle du Sénégal.
 *
 * Fonctionnalités :
 *  - Géolocalisation de l'utilisateur avec cache (5 min)
 *  - Calcul de distance Haversine
 *  - Détection de requêtes de proximité (français, wolof, anglais)
 *  - Tri et filtrage par distance
 *  - Fallback intelligent par région si GPS indisponible
 *
 * API publique : GeoSearch.init(), getPosition(), haversine(), etc.
 *
 * @author NDUGUMi
 * @license MIT
 */
var GeoSearch = (function () {
  'use strict';

  // ──────────────────────────────────────────────
  // Constantes
  // ──────────────────────────────────────────────

  /** Rayon de la Terre en kilomètres */
  var RAYON_TERRE_KM = 6371;

  /** Durée de validité du cache de position (5 minutes en ms) */
  var DUREE_CACHE_MS = 5 * 60 * 1000;

  /** Rayon par défaut pour le filtrage de proximité (en km) */
  var RAYON_DEFAUT_KM = 5;

  /** Délai max pour la requête de géolocalisation (10 secondes) */
  var TIMEOUT_GEOLOC_MS = 10000;

  /**
   * Coordonnées centrales des régions du Sénégal.
   * Utilisées comme fallback si le GPS n'est pas disponible.
   */
  var REGION_CENTERS = {
    'DAKAR':         { lat: 14.6928,  lng: -17.4467 },
    'THIES':         { lat: 14.7886,  lng: -16.9260 },
    'SAINT LOUIS':   { lat: 16.0326,  lng: -16.4818 },
    'DIOURBEL':      { lat: 14.6553,  lng: -16.2314 },
    'FATICK':        { lat: 14.3390,  lng: -16.4111 },
    'KAOLACK':       { lat: 14.1652,  lng: -16.0758 },
    'KAFFRINE':      { lat: 14.1059,  lng: -15.5508 },
    'ZIGUINCHOR':    { lat: 12.5681,  lng: -16.2719 },
    'KOLDA':         { lat: 12.8983,  lng: -14.9411 },
    'SEDHIOU':       { lat: 12.7081,  lng: -15.5569 },
    'TAMBACOUNDA':   { lat: 13.7709,  lng: -13.6673 },
    'KEDOUGOU':      { lat: 12.5605,  lng: -12.1747 },
    'LOUGA':         { lat: 15.6173,  lng: -16.2286 },
    'MATAM':         { lat: 15.6596,  lng: -13.2554 }
  };

  /**
   * Expressions régulières pour détecter les requêtes de proximité.
   * Couvre le français, l'anglais et le wolof.
   */
  var PATTERNS_PROXIMITE = [
    // Français
    /pr[eè]s\s+d[''']ici/i,
    /autour\s+de\s+moi/i,
    /[àa]\s+proximit[ée]/i,
    /le\s+plus\s+proche/i,
    /les?\s+plus\s+proches?/i,
    /dans\s+un\s+rayon/i,
    /[àa]\s+moins\s+de\s+\d+\s*km/i,
    /dans\s+\d+\s*km/i,
    /\bici\b/i,
    // Anglais
    /\bnear\s+me\b/i,
    /\bnearby\b/i,
    // Wolof
    /\bfi\b/i,
    /\bci\s+fi\b/i,
    /\bfii\s+nekk\b/i
  ];

  /**
   * Expressions pour extraire un rayon en km d'une requête textuelle.
   * Ex: "dans un rayon de 10 km" → 10, "à moins de 3 km" → 3
   */
  var PATTERNS_RAYON = [
    /dans\s+un\s+rayon\s+de\s+(\d+(?:[.,]\d+)?)\s*km/i,
    /[àa]\s+moins\s+de\s+(\d+(?:[.,]\d+)?)\s*km/i,
    /dans\s+(\d+(?:[.,]\d+)?)\s*km/i,
    /(\d+(?:[.,]\d+)?)\s*km\s+(?:autour|environ|max)/i
  ];

  // ──────────────────────────────────────────────
  // État interne
  // ──────────────────────────────────────────────

  /** Position mise en cache : { lat, lng, timestamp } ou null */
  var _positionCache = null;

  /** Indique si le GPS est disponible sur cet appareil */
  var _gpsDisponible = !!(navigator && navigator.geolocation);

  /** Promesse en cours pour éviter les requêtes simultanées */
  var _requeteEnCours = null;

  // ──────────────────────────────────────────────
  // Fonctions utilitaires internes
  // ──────────────────────────────────────────────

  /**
   * Convertit des degrés en radians.
   * @param {number} deg - Angle en degrés
   * @returns {number} Angle en radians
   */
  function versRadians(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Vérifie si le cache de position est encore valide.
   * @returns {boolean}
   */
  function cacheValide() {
    if (!_positionCache || !_positionCache.timestamp) return false;
    return (Date.now() - _positionCache.timestamp) < DUREE_CACHE_MS;
  }

  /**
   * Extrait les coordonnées numériques d'un enregistrement.
   * Les champs LATITUDE et LONGITUDE peuvent être des chaînes.
   * @param {Object} enregistrement - Objet avec LATITUDE et LONGITUDE
   * @returns {{ lat: number, lng: number } | null}
   */
  function extraireCoordonnees(enregistrement) {
    if (!enregistrement) return null;
    var lat = parseFloat(enregistrement.LATITUDE);
    var lng = parseFloat(enregistrement.LONGITUDE);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat: lat, lng: lng };
  }

  /**
   * Tente de détecter la région à partir du fuseau horaire.
   * Le fuseau Africa/Dakar couvre tout le Sénégal, donc on
   * renvoie Dakar comme position par défaut.
   * @returns {{ lat: number, lng: number } | null}
   */
  function fallbackParRegion() {
    try {
      var fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Si le fuseau est Africa/Dakar, on est probablement au Sénégal
      if (fuseau && fuseau.toLowerCase().indexOf('dakar') !== -1) {
        return { lat: REGION_CENTERS.DAKAR.lat, lng: REGION_CENTERS.DAKAR.lng };
      }
      // Vérifier d'autres indices dans le fuseau (Africa/*)
      if (fuseau && fuseau.toLowerCase().indexOf('africa') !== -1) {
        // Position par défaut : Dakar (capitale)
        return { lat: REGION_CENTERS.DAKAR.lat, lng: REGION_CENTERS.DAKAR.lng };
      }
    } catch (e) {
      // Intl non supporté — on ignore silencieusement
    }
    return null;
  }

  /**
   * Obtient le centre d'une région par son nom.
   * Recherche insensible à la casse et aux accents.
   * @param {string} nomRegion - Nom de la région
   * @returns {{ lat: number, lng: number } | null}
   */
  function obtenirCentreRegion(nomRegion) {
    if (!nomRegion) return null;
    var cle = nomRegion.toUpperCase().trim();
    if (REGION_CENTERS[cle]) {
      return { lat: REGION_CENTERS[cle].lat, lng: REGION_CENTERS[cle].lng };
    }
    // Recherche partielle
    var cles = Object.keys(REGION_CENTERS);
    for (var i = 0; i < cles.length; i++) {
      if (cle.indexOf(cles[i]) !== -1 || cles[i].indexOf(cle) !== -1) {
        return { lat: REGION_CENTERS[cles[i]].lat, lng: REGION_CENTERS[cles[i]].lng };
      }
    }
    return null;
  }

  // ──────────────────────────────────────────────
  // API publique
  // ──────────────────────────────────────────────

  var api = {

    /**
     * Initialise le module : demande la permission de géolocalisation
     * et récupère la position initiale.
     *
     * @returns {Promise<{ lat: number, lng: number }>}
     *   La position de l'utilisateur, ou un fallback régional.
     */
    init: function () {
      return this.getPosition().catch(function (erreur) {
        console.warn('[GeoSearch] Géolocalisation indisponible :', erreur.message || erreur);
        // Tenter le fallback par région
        var fallback = fallbackParRegion();
        if (fallback) {
          _positionCache = {
            lat: fallback.lat,
            lng: fallback.lng,
            timestamp: Date.now(),
            estFallback: true
          };
          console.info('[GeoSearch] Position estimée par fuseau horaire (Dakar).');
          return { lat: fallback.lat, lng: fallback.lng };
        }
        return null;
      });
    },

    /**
     * Récupère la position de l'utilisateur via l'API Geolocation.
     * Utilise le cache si la position a été obtenue il y a moins de 5 minutes.
     *
     * @returns {Promise<{ lat: number, lng: number }>}
     * @throws {Error} Si la géolocalisation n'est pas supportée ou refusée
     */
    getPosition: function () {
      // Retourner le cache s'il est encore valide
      if (cacheValide()) {
        return Promise.resolve({ lat: _positionCache.lat, lng: _positionCache.lng });
      }

      // Éviter les requêtes simultanées
      if (_requeteEnCours) return _requeteEnCours;

      if (!_gpsDisponible) {
        return Promise.reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur.'));
      }

      _requeteEnCours = new Promise(function (resoudre, rejeter) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            _positionCache = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: Date.now(),
              estFallback: false
            };
            _requeteEnCours = null;
            resoudre({ lat: _positionCache.lat, lng: _positionCache.lng });
          },
          function (erreur) {
            _requeteEnCours = null;
            var messages = {
              1: 'Permission de géolocalisation refusée par l\'utilisateur.',
              2: 'Position géographique indisponible.',
              3: 'Délai d\'attente dépassé pour la géolocalisation.'
            };
            rejeter(new Error(messages[erreur.code] || 'Erreur de géolocalisation inconnue.'));
          },
          {
            enableHighAccuracy: true,
            timeout: TIMEOUT_GEOLOC_MS,
            maximumAge: DUREE_CACHE_MS
          }
        );
      });

      return _requeteEnCours;
    },

    /**
     * Calcule la distance entre deux points géographiques
     * en utilisant la formule de Haversine.
     *
     * @param {number} lat1 - Latitude du premier point
     * @param {number} lng1 - Longitude du premier point
     * @param {number} lat2 - Latitude du second point
     * @param {number} lng2 - Longitude du second point
     * @returns {number} Distance en kilomètres
     */
    haversine: function (lat1, lng1, lat2, lng2) {
      var dLat = versRadians(lat2 - lat1);
      var dLng = versRadians(lng2 - lng1);

      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(versRadians(lat1)) * Math.cos(versRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return RAYON_TERRE_KM * c;
    },

    /**
     * Formate une distance pour l'affichage.
     * - Si < 1 km : affiche en mètres (ex: "800 m")
     * - Si >= 1 km : affiche en km avec 1 décimale (ex: "2.3 km")
     *
     * @param {number} km - Distance en kilomètres
     * @returns {string} Distance formatée
     */
    formatDistance: function (km) {
      if (km == null || isNaN(km)) return '';
      if (km < 1) {
        return Math.round(km * 1000) + ' m';
      }
      return km.toFixed(1) + ' km';
    },

    /**
     * Détecte si une requête textuelle exprime une intention de proximité.
     * Reconnaît les expressions en français, anglais et wolof.
     *
     * @param {string} texte - Requête de recherche
     * @returns {boolean} true si la requête exprime une proximité
     */
    isProximityQuery: function (texte) {
      if (!texte || typeof texte !== 'string') return false;
      var t = texte.trim().toLowerCase();
      for (var i = 0; i < PATTERNS_PROXIMITE.length; i++) {
        if (PATTERNS_PROXIMITE[i].test(t)) return true;
      }
      return false;
    },

    /**
     * Extrait un rayon en km à partir d'une requête textuelle.
     * Ex: "dans un rayon de 10 km" → 10
     *     "à moins de 3,5 km" → 3.5
     *
     * @param {string} texte - Requête de recherche
     * @returns {number | null} Rayon en km, ou null si non trouvé
     */
    extractRadius: function (texte) {
      if (!texte || typeof texte !== 'string') return null;
      for (var i = 0; i < PATTERNS_RAYON.length; i++) {
        var match = texte.match(PATTERNS_RAYON[i]);
        if (match && match[1]) {
          // Gérer la virgule comme séparateur décimal
          var valeur = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(valeur) && valeur > 0) return valeur;
        }
      }
      return null;
    },

    /**
     * Trie un tableau de résultats par distance croissante
     * depuis la position de l'utilisateur.
     *
     * Les résultats sans coordonnées valides sont placés à la fin.
     *
     * @param {Object[]} resultats - Tableau d'enregistrements avec LATITUDE/LONGITUDE
     * @param {number} userLat - Latitude de l'utilisateur
     * @param {number} userLng - Longitude de l'utilisateur
     * @returns {Object[]} Tableau trié (nouvelle copie)
     */
    sortByDistance: function (resultats, userLat, userLng) {
      if (!Array.isArray(resultats) || resultats.length === 0) return [];
      if (userLat == null || userLng == null) return resultats.slice();

      var self = this;
      return resultats.slice().sort(function (a, b) {
        var coordA = extraireCoordonnees(a);
        var coordB = extraireCoordonnees(b);

        // Éléments sans coordonnées → à la fin
        if (!coordA && !coordB) return 0;
        if (!coordA) return 1;
        if (!coordB) return -1;

        var distA = self.haversine(userLat, userLng, coordA.lat, coordA.lng);
        var distB = self.haversine(userLat, userLng, coordB.lat, coordB.lng);

        return distA - distB;
      });
    },

    /**
     * Filtre les résultats situés dans un rayon donné autour de l'utilisateur.
     *
     * @param {Object[]} resultats - Tableau d'enregistrements
     * @param {number} userLat - Latitude de l'utilisateur
     * @param {number} userLng - Longitude de l'utilisateur
     * @param {number} [rayonKm] - Rayon en km (défaut : 5 km)
     * @returns {Object[]} Résultats filtrés dans le rayon
     */
    filterByRadius: function (resultats, userLat, userLng, rayonKm) {
      if (!Array.isArray(resultats) || resultats.length === 0) return [];
      if (userLat == null || userLng == null) return [];

      var rayon = (rayonKm != null && rayonKm > 0) ? rayonKm : RAYON_DEFAUT_KM;
      var self = this;

      return resultats.filter(function (item) {
        var coord = extraireCoordonnees(item);
        if (!coord) return false;
        var distance = self.haversine(userLat, userLng, coord.lat, coord.lng);
        return distance <= rayon;
      });
    },

    /**
     * Enrichit chaque résultat avec un champ _distance (en km)
     * et un champ _distanceTexte (formaté pour l'affichage).
     *
     * @param {Object[]} resultats - Tableau d'enregistrements
     * @param {number} userLat - Latitude de l'utilisateur
     * @param {number} userLng - Longitude de l'utilisateur
     * @returns {Object[]} Résultats enrichis (même références, champs ajoutés)
     */
    enrichWithDistance: function (resultats, userLat, userLng) {
      if (!Array.isArray(resultats)) return [];
      if (userLat == null || userLng == null) return resultats;

      var self = this;
      resultats.forEach(function (item) {
        var coord = extraireCoordonnees(item);
        if (coord) {
          item._distance = self.haversine(userLat, userLng, coord.lat, coord.lng);
          item._distanceTexte = self.formatDistance(item._distance);
        } else {
          item._distance = null;
          item._distanceTexte = '';
        }
      });

      return resultats;
    },

    /**
     * Obtient le centre d'une région par son nom.
     * Utile pour centrer la carte sur une région donnée.
     *
     * @param {string} nomRegion - Nom de la région (ex: "DAKAR", "Thiès")
     * @returns {{ lat: number, lng: number } | null}
     */
    getRegionCenter: function (nomRegion) {
      return obtenirCentreRegion(nomRegion);
    },

    /**
     * Retourne la liste des centres de régions disponibles.
     * @returns {Object} Copie de REGION_CENTERS
     */
    getRegionCenters: function () {
      var copie = {};
      Object.keys(REGION_CENTERS).forEach(function (cle) {
        copie[cle] = { lat: REGION_CENTERS[cle].lat, lng: REGION_CENTERS[cle].lng };
      });
      return copie;
    }
  };

  // ──────────────────────────────────────────────
  // Propriétés en lecture seule (getters)
  // ──────────────────────────────────────────────

  /**
   * Position actuelle de l'utilisateur (depuis le cache).
   * Retourne { lat, lng } ou null si aucune position n'est disponible.
   */
  Object.defineProperty(api, 'userPosition', {
    get: function () {
      if (!_positionCache) return null;
      return { lat: _positionCache.lat, lng: _positionCache.lng };
    },
    enumerable: true
  });

  /**
   * Indique si la géolocalisation est disponible sur cet appareil.
   * @type {boolean}
   */
  Object.defineProperty(api, 'isAvailable', {
    get: function () {
      return _gpsDisponible;
    },
    enumerable: true
  });

  return api;

})();
