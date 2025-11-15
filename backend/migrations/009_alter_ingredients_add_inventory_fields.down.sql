-- Revert: Extend ingredients with category and inventory metadata

ALTER TABLE ingredients
    DROP COLUMN IF EXISTS storage_location,
    DROP COLUMN IF EXISTS current_stock,
    DROP COLUMN IF EXISTS category_id;
