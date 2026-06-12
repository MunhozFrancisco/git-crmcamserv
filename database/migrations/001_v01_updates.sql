-- ============================================================
--  Migration 001 — Atualizações V01
--  Data: 2026-06-12
--  Aplique no PostgreSQL da VPS com:
--    psql -U camserv_app -d camserv_crm -f database/migrations/001_v01_updates.sql
-- ============================================================

-- 1) Novo enum para tipo de cliente (Privado / Governo)
CREATE TYPE "ClientType" AS ENUM ('privado', 'governo');

-- 2) Novos campos na tabela clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS client_type "ClientType" NOT NULL DEFAULT 'privado',
  ADD COLUMN IF NOT EXISTS phone       VARCHAR(30),
  ADD COLUMN IF NOT EXISTS whatsapp    VARCHAR(30);

-- 3) Novo campo na tabela opportunities
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS next_interaction_date DATE;

-- 4) Remover campo price da tabela products
--    (o preço será definido no momento da criação da oportunidade)
ALTER TABLE products DROP COLUMN IF EXISTS price;

-- Conceder uso do novo tipo ao role da aplicação
GRANT USAGE ON TYPE "ClientType" TO camserv_app;
