-- ============================================================
--  Migration 002 — Campo interaction_date em activities
--  Data: 2026-06-15
--  Aplique na VPS com:
--    psql -h localhost -U camserv_app -d camserv_crm -f database/migrations/002_activity_interaction_date.sql
-- ============================================================

ALTER TABLE "activities"
  ADD COLUMN IF NOT EXISTS "interaction_date" DATE;
