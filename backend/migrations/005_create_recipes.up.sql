-- Migration: Create recipes table
-- Description: Stores recipes with production information

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    yield_quantity DECIMAL(12, 4) NOT NULL CHECK (yield_quantity > 0),
    yield_unit VARCHAR(50) NOT NULL,
    production_time INTEGER DEFAULT 0 CHECK (production_time >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT recipes_name_tenant_unique UNIQUE (name, tenant_id)
);

-- Indexes
CREATE INDEX idx_recipes_tenant_id ON recipes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_name ON recipes(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_recipes_deleted_at ON recipes(deleted_at);

-- Comments
COMMENT ON TABLE recipes IS 'Production recipes with yield information';
COMMENT ON COLUMN recipes.yield_quantity IS 'Amount produced by this recipe';
COMMENT ON COLUMN recipes.yield_unit IS 'Unit of production output';
COMMENT ON COLUMN recipes.production_time IS 'Production time in minutes';
