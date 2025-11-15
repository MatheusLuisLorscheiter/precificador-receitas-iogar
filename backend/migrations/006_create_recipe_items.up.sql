-- Migration: Create recipe_items table
-- Description: Stores ingredients used in each recipe

CREATE TABLE IF NOT EXISTS recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity DECIMAL(12, 4) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    waste_factor DECIMAL(5, 4) DEFAULT 0 CHECK (waste_factor >= 0 AND waste_factor < 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT recipe_items_unique UNIQUE (recipe_id, ingredient_id)
);

-- Indexes
CREATE INDEX idx_recipe_items_tenant_id ON recipe_items(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipe_items_recipe_id ON recipe_items(recipe_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipe_items_ingredient_id ON recipe_items(ingredient_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipe_items_deleted_at ON recipe_items(deleted_at);

-- Comments
COMMENT ON TABLE recipe_items IS 'Junction table linking recipes to ingredients';
COMMENT ON COLUMN recipe_items.quantity IS 'Amount of ingredient needed';
COMMENT ON COLUMN recipe_items.unit IS 'Measurement unit for this ingredient in recipe';
COMMENT ON COLUMN recipe_items.waste_factor IS 'Expected waste percentage (0.0 to 0.99)';
COMMENT ON CONSTRAINT recipe_items_unique ON recipe_items IS 'One ingredient can appear only once per recipe';
