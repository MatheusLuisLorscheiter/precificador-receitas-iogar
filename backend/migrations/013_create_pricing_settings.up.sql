CREATE TABLE IF NOT EXISTS pricing_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    labor_cost_per_minute NUMERIC(10,4) NOT NULL DEFAULT 0.65,
    default_packaging_cost NUMERIC(10,4) NOT NULL DEFAULT 0.35,
    default_margin_percent NUMERIC(5,2) NOT NULL DEFAULT 30.0,
    fixed_monthly_costs NUMERIC(14,2) NOT NULL DEFAULT 0,
    variable_cost_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    default_sales_volume NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
