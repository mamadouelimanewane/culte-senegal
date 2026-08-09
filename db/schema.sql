-- ════════════════════════════════════════════════════════════════
--  Scenews — Culture Sénégal : schéma Postgres
--  Remplace la persistance localStorage par un stockage serveur.
--  Compatible Neon / Supabase / Postgres standard (>= 13).
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admins (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  nom            TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_key ON admins (lower(email));

CREATE TABLE IF NOT EXISTS responsables (
  id             SERIAL PRIMARY KEY,
  email          TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  nom            TEXT NOT NULL,
  tel            TEXT DEFAULT '',
  infra_id       INTEGER NOT NULL,
  infra_nom      TEXT DEFAULT '',
  region         TEXT DEFAULT '',
  statut         TEXT NOT NULL DEFAULT 'active'
                 CHECK (statut IN ('active', 'suspended')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS responsables_email_key ON responsables (lower(email));

CREATE TABLE IF NOT EXISTS registrations (
  id             SERIAL PRIMARY KEY,
  nom            TEXT NOT NULL,
  email          TEXT NOT NULL,
  tel            TEXT DEFAULT '',
  password_hash  TEXT NOT NULL,
  infra_id       INTEGER NOT NULL,
  infra_nom      TEXT DEFAULT '',
  region         TEXT DEFAULT '',
  justification  TEXT NOT NULL DEFAULT '',
  statut         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (statut IN ('pending', 'approved', 'rejected')),
  note_admin     TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ
);
-- Une seule demande en attente par adresse e-mail.
CREATE UNIQUE INDEX IF NOT EXISTS registrations_pending_email_key
  ON registrations (lower(email)) WHERE statut = 'pending';

CREATE TABLE IF NOT EXISTS contributions (
  id              SERIAL PRIMARY KEY,
  responsable_id  INTEGER REFERENCES responsables(id) ON DELETE CASCADE,
  resp_nom        TEXT DEFAULT '',
  infra_id        INTEGER NOT NULL,
  infra_nom       TEXT DEFAULT '',
  type            TEXT NOT NULL
                  CHECK (type IN ('profile', 'gallery_add', 'event', 'actu')),
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,
  statut          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (statut IN ('pending', 'approved', 'rejected')),
  note_admin      TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS contributions_statut_idx ON contributions (statut);
CREATE INDEX IF NOT EXISTS contributions_resp_idx   ON contributions (responsable_id);

-- Contenu publié (validé par l'admin), lu publiquement par le portail.
CREATE TABLE IF NOT EXISTS site_content (
  infra_id    INTEGER PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  horaires    TEXT NOT NULL DEFAULT '',
  telephone   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  website     TEXT NOT NULL DEFAULT '',
  gallery     JSONB NOT NULL DEFAULT '[]'::jsonb,
  events      JSONB NOT NULL DEFAULT '[]'::jsonb,
  actus       JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           BIGSERIAL PRIMARY KEY,
  actor_type   TEXT NOT NULL DEFAULT 'admin',
  actor_id     INTEGER,
  actor_email  TEXT DEFAULT '',
  action       TEXT NOT NULL,
  target       TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);

-- Corrections apportées par l'admin au jeu de données de référence
-- (anciennement culte_admin_edits en localStorage).
CREATE TABLE IF NOT EXISTS dataset_edits (
  dataset   TEXT NOT NULL CHECK (dataset IN ('infras', 'forms')),
  record_id INTEGER NOT NULL,
  patch     JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted   BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dataset, record_id)
);
