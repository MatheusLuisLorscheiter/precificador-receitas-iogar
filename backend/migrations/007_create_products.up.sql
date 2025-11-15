-- Migration: Create products table
-- Description: Stores final products with pricing information

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    base_price DECIMAL(12, 2) DEFAULT 0 CHECK (base_price >= 0),
    suggested_price DECIMAL(12, 2) DEFAULT 0 CHECK (suggested_price >= 0),
    tax_rate DECIMAL(5, 4) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate < 1),
    margin_percent DECIMAL(5, 2) DEFAULT 0 CHECK (margin_percent >= 0),
    packaging_cost DECIMAL(12, 2) DEFAULT 0 CHECK (packaging_cost >= 0),
    image_object_key VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT products_name_tenant_unique UNIQUE (name, tenant_id),
    CONSTRAINT products_sku_tenant_unique UNIQUE (sku, tenant_id)
);

-- Indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name ON products(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_recipe_id ON products(recipe_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_active ON products(active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_deleted_at ON products(deleted_at);

-- Comments
COMMENT ON TABLE products IS 'Final products with pricing and inventory tracking';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';
COMMENT ON COLUMN products.barcode IS 'Product barcode for scanning';
COMMENT ON COLUMN products.base_price IS 'Calculated cost base price';
COMMENT ON COLUMN products.suggested_price IS 'Recommended selling price';
COMMENT ON COLUMN products.tax_rate IS 'Tax percentage (0.0 to 0.99)';
COMMENT ON COLUMN products.margin_percent IS 'Profit margin percentage';
COMMENT ON COLUMN products.packaging_cost IS 'Additional packaging cost';
COMMENT ON COLUMN products.image_object_key IS 'MinIO object key for product image';
