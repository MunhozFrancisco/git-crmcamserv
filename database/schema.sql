-- ============================================================
--  CAMSERV CRM — Schema PostgreSQL
--  Banco: camserv_crm
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- busca sem acento

-- ============================================================
--  ENUM TYPES
-- ============================================================
CREATE TYPE user_role         AS ENUM ('gestor', 'vendedor');
CREATE TYPE client_status     AS ENUM ('lead', 'cliente');
CREATE TYPE client_source     AS ENUM ('indicação', 'site', 'linkedin', 'evento', 'cold-call', 'outro');
CREATE TYPE temperature       AS ENUM ('frio', 'morno', 'quente');
CREATE TYPE opportunity_status AS ENUM ('aberta', 'ganha', 'perdida');
CREATE TYPE risk_level        AS ENUM ('baixo', 'medio', 'alto');
CREATE TYPE activity_type     AS ENUM ('ligação', 'email', 'reunião', 'whatsapp', 'tarefa');
CREATE TYPE task_priority     AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE task_type         AS ENUM ('ligação', 'email', 'reunião', 'whatsapp', 'outro');
CREATE TYPE product_type      AS ENUM ('produto', 'serviço');
CREATE TYPE product_category  AS ENUM ('Software', 'Hardware', 'Consultoria', 'Suporte', 'Treinamento', 'Infraestrutura', 'Outro');
CREATE TYPE alert_type        AS ENUM ('warning', 'danger', 'info');

-- ============================================================
--  USERS
--  Perfis de acesso. Senha armazenada como bcrypt hash.
-- ============================================================
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          user_role   NOT NULL DEFAULT 'vendedor',
  meta          NUMERIC(12,2) NOT NULL DEFAULT 0,
  avatar        TEXT,
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
--  STAGES  (etapas do pipeline)
-- ============================================================
CREATE TABLE stages (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL,
  order_index INTEGER NOT NULL,
  probability INTEGER NOT NULL CHECK (probability BETWEEN 0 AND 100),
  color       TEXT    NOT NULL,   -- classe CSS (text-*)
  bg_color    TEXT    NOT NULL,   -- classe CSS (bg-*)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
--  CLIENTS  (leads + clientes ativos unificados)
-- ============================================================
CREATE TABLE clients (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  status           client_status  NOT NULL DEFAULT 'lead',
  name             TEXT           NOT NULL,
  razao_social     TEXT,
  cnpj             TEXT,
  site             TEXT,
  segment          TEXT,
  address          TEXT,
  source           client_source  NOT NULL DEFAULT 'outro',
  temperature      temperature    NOT NULL DEFAULT 'morno',
  responsible_name TEXT,
  assigned_to      UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ============================================================
--  CONTACTS  (interlocutores — múltiplos por cliente)
-- ============================================================
CREATE TABLE contacts (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID    NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  cargo       TEXT,
  department  TEXT,
  email       TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante no máximo 1 contato principal por cliente
CREATE UNIQUE INDEX uq_contacts_primary
  ON contacts (client_id)
  WHERE is_primary = true;

-- ============================================================
--  OPPORTUNITIES  (negócios no kanban)
-- ============================================================
CREATE TABLE opportunities (
  id                  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID               NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  stage_id            UUID               NOT NULL REFERENCES stages(id) ON DELETE RESTRICT,
  value               NUMERIC(12,2)      NOT NULL DEFAULT 0,
  status              opportunity_status NOT NULL DEFAULT 'aberta',
  assigned_to         UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  score               INTEGER            NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  risk_level          risk_level         NOT NULL DEFAULT 'medio',
  expected_close_date DATE,
  last_interaction    DATE               NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ        NOT NULL DEFAULT now()
);

-- ============================================================
--  ACTIVITIES  (histórico de interações)
-- ============================================================
CREATE TABLE activities (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID          NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id        UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type           activity_type NOT NULL,
  description    TEXT          NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ============================================================
--  TASKS
-- ============================================================
CREATE TABLE tasks (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT          NOT NULL,
  opportunity_id UUID          REFERENCES opportunities(id) ON DELETE SET NULL,
  client_id      UUID          REFERENCES clients(id)      ON DELETE SET NULL,
  assigned_to    UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date       DATE          NOT NULL,
  done           BOOLEAN       NOT NULL DEFAULT false,
  done_at        TIMESTAMPTZ,
  priority       task_priority NOT NULL DEFAULT 'media',
  type           task_type     NOT NULL DEFAULT 'outro',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ============================================================
--  PRODUCTS  (catálogo de produtos e serviços)
-- ============================================================
CREATE TABLE products (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT             NOT NULL,
  description TEXT,
  type        product_type     NOT NULL,
  category    product_category NOT NULL,
  price       NUMERIC(12,2)    NOT NULL DEFAULT 0,
  unit        TEXT             NOT NULL DEFAULT 'único',
  active      BOOLEAN          NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ============================================================
--  ALERTS  (gerados pela IA ou automações)
-- ============================================================
CREATE TABLE alerts (
  id             UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID       NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  message        TEXT       NOT NULL,
  type           alert_type NOT NULL DEFAULT 'info',
  resolved       BOOLEAN    NOT NULL DEFAULT false,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
--  INDEXES de performance
-- ============================================================
CREATE INDEX idx_clients_assigned_to    ON clients(assigned_to);
CREATE INDEX idx_clients_status         ON clients(status);
CREATE INDEX idx_clients_temperature    ON clients(temperature);
CREATE INDEX idx_contacts_client_id     ON contacts(client_id);
CREATE INDEX idx_opps_assigned_to       ON opportunities(assigned_to);
CREATE INDEX idx_opps_stage_id          ON opportunities(stage_id);
CREATE INDEX idx_opps_status            ON opportunities(status);
CREATE INDEX idx_opps_client_id         ON opportunities(client_id);
CREATE INDEX idx_opps_last_interaction  ON opportunities(last_interaction);
CREATE INDEX idx_activities_opp_id      ON activities(opportunity_id);
CREATE INDEX idx_activities_user_id     ON activities(user_id);
CREATE INDEX idx_tasks_assigned_to      ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date         ON tasks(due_date);
CREATE INDEX idx_tasks_done             ON tasks(done);
CREATE INDEX idx_alerts_opp_id          ON alerts(opportunity_id);
CREATE INDEX idx_alerts_resolved        ON alerts(resolved);

-- ============================================================
--  TRIGGER: atualiza updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clients_updated_at      BEFORE UPDATE ON clients      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contacts_updated_at     BEFORE UPDATE ON contacts     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated_at        BEFORE UPDATE ON tasks        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at     BEFORE UPDATE ON products     FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
--  VIEW: seller_stats  (calculado dinamicamente)
-- ============================================================
CREATE OR REPLACE VIEW seller_stats AS
SELECT
  u.id                                                                    AS user_id,
  u.name,
  u.email,
  u.meta,
  COUNT(o.id)                                                             AS total_opportunities,
  COUNT(o.id) FILTER (WHERE o.status = 'ganha')                          AS won,
  COUNT(o.id) FILTER (WHERE o.status = 'perdida')                        AS lost,
  COUNT(o.id) FILTER (WHERE o.status = 'aberta')                         AS open,
  CASE WHEN COUNT(o.id) > 0
    THEN ROUND(COUNT(o.id) FILTER (WHERE o.status = 'ganha')::numeric / COUNT(o.id) * 100, 1)
    ELSE 0
  END                                                                     AS conversion_rate,
  COALESCE(SUM(o.value) FILTER (WHERE o.status = 'ganha'), 0)            AS total_value,
  COALESCE(AVG(o.value) FILTER (WHERE o.status = 'ganha'), 0)            AS avg_ticket,
  COALESCE(AVG(
    EXTRACT(DAY FROM o.updated_at - o.created_at)
  ) FILTER (WHERE o.status = 'ganha'), 0)                                 AS avg_close_days
FROM users u
LEFT JOIN opportunities o ON o.assigned_to = u.id
WHERE u.role = 'vendedor' AND u.active = true
GROUP BY u.id, u.name, u.email, u.meta;

-- ============================================================
--  SEED: dados iniciais
-- ============================================================

-- Etapas do pipeline
INSERT INTO stages (name, order_index, probability, color, bg_color) VALUES
  ('Novo Lead',   0, 10,  'text-slate-600', 'bg-slate-100'),
  ('Qualificado', 1, 25,  'text-blue-600',  'bg-blue-100'),
  ('Processo',    2, 45,  'text-violet-600','bg-violet-100'),
  ('Negociação',  3, 70,  'text-amber-600', 'bg-amber-100'),
  ('Ganho',       4, 100, 'text-green-600', 'bg-green-100'),
  ('Perdido',     5, 0,   'text-red-600',   'bg-red-100');

-- Usuário gestor padrão (senha: Camserv@2025)
-- ATENÇÃO: troque a senha em produção via a interface do CRM
INSERT INTO users (name, email, password_hash, role, meta) VALUES
  ('Rafael Costa',
   'rafael@camserv.com.br',
   '$2b$10$placeholder_troque_via_reset',
   'gestor',
   150000);

-- ============================================================
--  ROLES do banco (segurança)
-- ============================================================

-- Role da aplicação (Next.js) — acesso restrito, sem superuser
CREATE ROLE camserv_app LOGIN PASSWORD 'TROQUE_ESTA_SENHA';
GRANT CONNECT ON DATABASE camserv_crm TO camserv_app;
GRANT USAGE ON SCHEMA public TO camserv_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO camserv_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO camserv_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO camserv_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO camserv_app;
