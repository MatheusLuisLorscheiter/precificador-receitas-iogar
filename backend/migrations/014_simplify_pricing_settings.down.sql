-- Restaura campo default_tax_rate para rollback
ALTER TABLE pricing_settings ADD COLUMN IF NOT EXISTS default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0;

-- Remove comentários
COMMENT ON COLUMN pricing_settings.labor_cost_per_minute IS NULL;
COMMENT ON COLUMN pricing_settings.default_packaging_cost IS NULL;
COMMENT ON COLUMN pricing_settings.default_margin_percent IS NULL;
COMMENT ON COLUMN pricing_settings.fixed_monthly_costs IS NULL;
COMMENT ON COLUMN pricing_settings.variable_cost_percent IS NULL;
COMMENT ON COLUMN pricing_settings.default_sales_volume IS NULL;
