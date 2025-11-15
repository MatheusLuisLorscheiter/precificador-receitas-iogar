-- Revert: Attach optional categories to recipes

ALTER TABLE recipes
    DROP COLUMN IF EXISTS category_id;
