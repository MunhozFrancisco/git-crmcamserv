-- ============================================================
--  CAMSERV CRM — Migration: Multitenancy
--  Executar via psql na VPS após deploy do schema atualizado
--  Ordem: 1 enum → 1 tabela → INSERT → ALTER TABLE → índices
-- ============================================================

-- 1. Criar enum plan_type
CREATE TYPE plan_type AS ENUM ('starter', 'essential', 'growth', 'full');

-- 2. Criar tabela tenants
CREATE TABLE tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj       VARCHAR(14) NOT NULL UNIQUE,
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  plan_type  plan_type   NOT NULL DEFAULT 'starter',
  modules    TEXT[]      NOT NULL DEFAULT '{}',
  active     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Inserir tenant padrão Camserv
INSERT INTO tenants (cnpj, name, slug, plan_type, modules)
VALUES (
  '00000000000000',
  'Camserv',
  'camserv',
  'full',
  ARRAY['crm', 'service-desk', 'copiloto', 'pagamentos']
);

-- 4. Capturar UUID gerado e adicionar tenant_id com DEFAULT temporário
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'camserv';

  EXECUTE format('ALTER TABLE users          ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id) DEFAULT %L', tenant_uuid);
  EXECUTE format('ALTER TABLE clients        ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id) DEFAULT %L', tenant_uuid);
  EXECUTE format('ALTER TABLE cliente_canais ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id) DEFAULT %L', tenant_uuid);
  EXECUTE format('ALTER TABLE ordens_servico ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id) DEFAULT %L', tenant_uuid);
  EXECUTE format('ALTER TABLE interacoes     ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id) DEFAULT %L', tenant_uuid);
  EXECUTE format('ALTER TABLE log_agentes    ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id) DEFAULT %L', tenant_uuid);
END;
$$;

-- 5. Criar índices
CREATE INDEX idx_users_tenant           ON users(tenant_id);
CREATE INDEX idx_clients_tenant         ON clients(tenant_id);
CREATE INDEX idx_clients_tenant_status  ON clients(tenant_id, status);
CREATE INDEX idx_cliente_canais_tenant  ON cliente_canais(tenant_id);
CREATE INDEX idx_ordens_tenant          ON ordens_servico(tenant_id);
CREATE INDEX idx_ordens_tenant_status   ON ordens_servico(tenant_id, status);
CREATE INDEX idx_interacoes_tenant      ON interacoes(tenant_id);
CREATE INDEX idx_log_agentes_tenant     ON log_agentes(tenant_id);

-- ============================================================
--  ATENÇÃO — após o código estar atualizado para usar tenantId,
--  remover os DEFAULTs com os comandos abaixo (não rodar agora):
--
--  ALTER TABLE users          ALTER COLUMN tenant_id DROP DEFAULT;
--  ALTER TABLE clients        ALTER COLUMN tenant_id DROP DEFAULT;
--  ALTER TABLE cliente_canais ALTER COLUMN tenant_id DROP DEFAULT;
--  ALTER TABLE ordens_servico ALTER COLUMN tenant_id DROP DEFAULT;
--  ALTER TABLE interacoes     ALTER COLUMN tenant_id DROP DEFAULT;
--  ALTER TABLE log_agentes    ALTER COLUMN tenant_id DROP DEFAULT;
-- ============================================================
