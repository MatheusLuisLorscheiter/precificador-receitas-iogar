-- Remove a coluna de impostos para simplificar a precificação direta
ALTER TABLE products DROP COLUMN IF EXISTS tax_rate;
