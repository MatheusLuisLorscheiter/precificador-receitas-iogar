-- Migration: Create ingredients table
-- Description: Stores raw materials and ingredients with tenant isolation

CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(12, 4) NOT NULL CHECK (cost_per_unit >= 0),
    supplier VARCHAR(255),
    lead_time_days INTEGER DEFAULT 0 CHECK (lead_time_days >= 0),
    min_stock_level DECIMAL(12, 4) DEFAULT 0 CHECK (min_stock_level >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT ingredients_name_tenant_unique UNIQUE (name, tenant_id)
);

-- Indexes
CREATE INDEX idx_ingredients_tenant_id ON ingredients(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ingredients_name ON ingredients(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_ingredients_supplier ON ingredients(supplier) WHERE deleted_at IS NULL;
CREATE INDEX idx_ingredients_deleted_at ON ingredients(deleted_at);

-- Comments
COMMENT ON TABLE ingredients IS 'Raw materials and ingredients with cost tracking';
COMMENT ON COLUMN ingredients.unit IS 'Measurement unit: kg, L, un, etc';
COMMENT ON COLUMN ingredients.cost_per_unit IS 'Cost per measurement unit in local currency';
COMMENT ON COLUMN ingredients.lead_time_days IS 'Days needed to restock from supplier';
