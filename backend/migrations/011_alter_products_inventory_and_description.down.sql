-- Revert: Extend products with description, category, inventory metadata, and adjust tax constraint

ALTER TABLE products
    DROP COLUMN IF EXISTS storage_location,
    DROP COLUMN IF EXISTS reorder_point,
    DROP COLUMN IF EXISTS stock_unit,
    DROP COLUMN IF EXISTS stock_quantity,
    DROP COLUMN IF EXISTS category_id,
    DROP COLUMN IF EXISTS description;

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_tax_rate_range,
    ALTER COLUMN tax_rate TYPE DECIMAL(5, 4) USING tax_rate::DECIMAL(5, 4),
    ADD CONSTRAINT products_tax_rate_check CHECK (tax_rate >= 0 AND tax_rate < 1);
