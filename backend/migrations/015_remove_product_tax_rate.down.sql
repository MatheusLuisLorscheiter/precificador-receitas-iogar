-- Restaura a coluna de impostos caso seja necessário realizar rollback
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0;
