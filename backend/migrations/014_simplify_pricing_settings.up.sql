-- Remove default_tax_rate da tabela pricing_settings
-- Foco em precificação direta sem impostos por padrão
ALTER TABLE pricing_settings DROP COLUMN IF EXISTS default_tax_rate;

-- Adiciona comentários descritivos para cada campo
COMMENT ON COLUMN pricing_settings.labor_cost_per_minute IS 'Custo de mão de obra por minuto (R$/min)';
COMMENT ON COLUMN pricing_settings.default_packaging_cost IS 'Custo padrão de embalagem por unidade (R$)';
COMMENT ON COLUMN pricing_settings.default_margin_percent IS 'Margem de lucro padrão em percentual (%)';
COMMENT ON COLUMN pricing_settings.fixed_monthly_costs IS 'Custos fixos mensais totais - Ex: aluguel, funcionários, luz, água (R$)';
COMMENT ON COLUMN pricing_settings.variable_cost_percent IS 'Custos variáveis como percentual da receita - Ex: embalagens extras, comissões (%)';
COMMENT ON COLUMN pricing_settings.default_sales_volume IS 'Volume de vendas mensal estimado para rateio de custos fixos (unidades)';
