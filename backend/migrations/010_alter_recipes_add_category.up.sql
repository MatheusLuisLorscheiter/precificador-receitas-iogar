-- Migration: Attach optional categories to recipes

ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_category_id ON recipes(category_id) WHERE deleted_at IS NULL;
