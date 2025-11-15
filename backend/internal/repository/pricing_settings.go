package repository

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

// GetPricingSettings retorna as configurações do tenant ou pgx.ErrNoRows caso não existam.
func (s *Store) GetPricingSettings(ctx context.Context, tenantID uuid.UUID) (*domain.PricingSettings, error) {
	var settings domain.PricingSettings
	settings.TenantID = tenantID

	err := s.pool.QueryRow(ctx, `
		SELECT labor_cost_per_minute,
		       default_packaging_cost,
		       default_margin_percent,
		       fixed_monthly_costs,
		       variable_cost_percent,
		       default_sales_volume,
		       created_at,
		       updated_at
		FROM pricing_settings
		WHERE tenant_id = $1
	`, tenantID).Scan(
		&settings.LaborCostPerMinute,
		&settings.DefaultPackagingCost,
		&settings.DefaultMarginPercent,
		&settings.FixedMonthlyCosts,
		&settings.VariableCostPercent,
		&settings.DefaultSalesVolume,
		&settings.CreatedAt,
		&settings.UpdatedAt,
	)
	if err != nil {
		return nil, translateError(err)
	}

	return &settings, nil
}

// UpsertPricingSettings cria ou atualiza as configurações de precificação do tenant.
func (s *Store) UpsertPricingSettings(ctx context.Context, settings *domain.PricingSettings) error {
	now := time.Now().UTC()
	if settings.CreatedAt.IsZero() {
		settings.CreatedAt = now
	}
	settings.UpdatedAt = now

	_, err := s.pool.Exec(ctx, `
		INSERT INTO pricing_settings (
		    tenant_id,
		    labor_cost_per_minute,
		    default_packaging_cost,
		    default_margin_percent,
		    fixed_monthly_costs,
		    variable_cost_percent,
		    default_sales_volume,
		    created_at,
		    updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		ON CONFLICT (tenant_id) DO UPDATE SET
		    labor_cost_per_minute = EXCLUDED.labor_cost_per_minute,
		    default_packaging_cost = EXCLUDED.default_packaging_cost,
		    default_margin_percent = EXCLUDED.default_margin_percent,
		    fixed_monthly_costs = EXCLUDED.fixed_monthly_costs,
		    variable_cost_percent = EXCLUDED.variable_cost_percent,
		    default_sales_volume = EXCLUDED.default_sales_volume,
		    updated_at = EXCLUDED.updated_at
	`,
		settings.TenantID,
		settings.LaborCostPerMinute,
		settings.DefaultPackagingCost,
		settings.DefaultMarginPercent,
		settings.FixedMonthlyCosts,
		settings.VariableCostPercent,
		settings.DefaultSalesVolume,
		settings.CreatedAt,
		settings.UpdatedAt,
	)
	return translateError(err)
}
