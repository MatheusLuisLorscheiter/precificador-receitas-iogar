-- Migration: Extend products with description, category, inventory metadata, and adjust tax constraint

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    ADD COLUMN IF NOT EXISTS stock_unit VARCHAR(50) NOT NULL DEFAULT 'un',
    ADD COLUMN IF NOT EXISTS reorder_point DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    ADD COLUMN IF NOT EXISTS storage_location VARCHAR(120);

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_tax_rate_check,
    ALTER COLUMN tax_rate TYPE DECIMAL(5, 2) USING tax_rate::DECIMAL(5, 2),
    ADD CONSTRAINT products_tax_rate_range CHECK (tax_rate >= 0 AND tax_rate <= 100);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id) WHERE deleted_at IS NULL;
