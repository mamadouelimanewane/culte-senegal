# Déploiement — Scenews Culture Sénégal

L'application est passée d'une démo 100 % navigateur à une plateforme
avec backend. Ce document décrit la mise en service.

## Architecture

| Couche | Technologie | Emplacement |
|---|---|---|
| Portail public | HTML/CSS/JS vanilla, PWA | `index.html`, `js/`, `css/` |
| Page publique d'un site | idem | `site/` |
| Portail responsable | idem | `responsable/` |
| Backoffice admin | idem | `admin/` |
| API | Vercel Functions (Node 20) | `api/` |
| Base de données | Postgres (Neon, Supabase, ou autre) | `db/schema.sql` |

Les données partagées — inscriptions, comptes responsables,
contributions, contenu publié, corrections du jeu de référence,
journal d'audit — vivent en base. Le navigateur ne conserve plus que
des préférences locales (favoris, thème, historique de recherche).

## Variables d'environnement

À définir dans Vercel (*Project Settings → Environment Variables*),
jamais dans le dépôt. Voir `.env.example`.

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion Postgres. Sur Neon, utiliser l'URL **pooled**. |
| `JWT_SECRET` | Secret de signature des sessions. 32 caractères minimum. |
| `PGSSL_DISABLE` | Optionnel, `1` pour un Postgres local sans TLS. |

Générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Mise en service

1. Créer la base (Neon, Supabase…) et récupérer `DATABASE_URL`.

2. Appliquer le schéma :

```bash
npm run db:migrate
```

3. Créer le premier administrateur. Le mot de passe est généré
   aléatoirement et affiché **une seule fois** :

```bash
node db/create-admin.js admin@culte.sn "Administrateur"
```

4. Facultatif — charger le jeu de démonstration (4 sites publiés,
   4 responsables, contributions en attente). À réserver aux
   environnements de démo :

```bash
node db/seed-demo.js
```

5. Déployer :

```bash
vercel --prod
```

## Développement local

L'API a besoin du runtime Vercel : `node serve.js` ne sert que les
fichiers statiques (le portail fonctionne alors en lecture seule,
sans contenu publié — c'est voulu et sans erreur).

```bash
vercel dev
```

## Tests

```bash
npm test
```

Trois suites :

- `test-escape.js` — primitives d'échappement confrontées aux charges
  XSS classiques (44 assertions).
- `test-api.js` — backend de bout en bout sur un Postgres réel fourni
  par PGlite : authentification, contrôle d'accès, workflow
  d'inscription et de validation, élévation de privilège (49 assertions).
- `test-complet.js` — modules front existants (100 assertions).

## Sécurité — ce qui a changé

- **Authentification serveur.** Plus aucun compte ni hash dans le
  JavaScript livré. Mots de passe en bcrypt (coût 12). Session portée
  par un JWT dans un cookie `HttpOnly; SameSite=Lax`, donc ni lisible
  ni forgeable depuis le navigateur.
- **Autorisation serveur.** Chaque route vérifie le rôle. Un
  responsable ne peut ni lire les données d'administration ni publier
  sur l'infrastructure d'un autre : l'`infraId` est pris dans la
  session, jamais dans la requête.
- **CSRF.** En-tête `X-Requested-With` exigé sur toute mutation, qu'un
  formulaire inter-site ne peut pas poser.
- **Limitation de débit** sur la connexion, l'inscription et le
  changement de mot de passe.
- **XSS.** Échappement systématique (`js/escape.js`) : `escapeHtml`
  pour le texte, `safeUrl` pour les URL (bloque `javascript:` et
  `data:text/html`), `jsAttr`/`jsonAttr` pour les gestionnaires
  inline, où l'échappement HTML seul est redécodé par le parseur.
- **En-têtes** CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy` (`vercel.json`). Les portails d'administration
  sont en `noindex` et `no-store`.
- **SRI** sur les ressources Leaflet chargées depuis unpkg.
- **Service worker** : `/api/*` n'est jamais mis en cache.

## Points restants

- Les gestionnaires `onclick=` inline empêchent une CSP stricte
  (`'unsafe-inline'` reste nécessaire pour `script-src`). Les
  supprimer permettrait de passer à une politique par nonce.
- L'ajout d'un enregistrement entièrement nouveau au jeu de référence
  depuis le backoffice reste limité à la session en cours : la table
  `dataset_edits` gère la correction et la suppression d'éléments
  existants, pas la création. Comportement inchangé par rapport à
  l'existant, mais à traiter si le besoin se confirme.
- Aucun envoi d'e-mail : un responsable dont la demande est validée
  n'est pas notifié automatiquement.
