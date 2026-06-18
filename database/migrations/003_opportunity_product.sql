-- Migration 003: Add product_id to opportunities
ALTER TABLE opportunities
  ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
