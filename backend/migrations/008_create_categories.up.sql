-- Migration: Create categories table
-- Description: Shared category catalog for ingredients, recipes, and products per tenant

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ingredient', 'recipe', 'product')),
    color VARCHAR(9) DEFAULT '#3b82f6',
    icon VARCHAR(60),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT categories_name_unique UNIQUE (tenant_id, name, type),
    CONSTRAINT categories_slug_unique UNIQUE (tenant_id, slug, type)
);

CREATE INDEX idx_categories_tenant_type ON categories(tenant_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_slug ON categories(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);

COMMENT ON TABLE categories IS 'Reusable taxonomy categories partitioned per tenant';
COMMENT ON COLUMN categories.type IS 'Entity type the category applies to';
