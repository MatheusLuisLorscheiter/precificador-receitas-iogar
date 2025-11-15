-- Migration: Extend ingredients with category and inventory metadata

ALTER TABLE ingredients
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS current_stock DECIMAL(12, 4) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    ADD COLUMN IF NOT EXISTS storage_location VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_ingredients_category_id ON ingredients(category_id) WHERE deleted_at IS NULL;
