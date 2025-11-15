package domain

import (
	"time"

	"github.com/google/uuid"
)

// PricingSettings armazena parâmetros padrão de precificação por tenant.
type PricingSettings struct {
	TenantID             uuid.UUID `json:"tenant_id"`
	LaborCostPerMinute   float64   `json:"labor_cost_per_minute"`
	DefaultPackagingCost float64   `json:"default_packaging_cost"`
	DefaultMarginPercent float64   `json:"default_margin_percent"`
	FixedMonthlyCosts    float64   `json:"fixed_monthly_costs"`
	VariableCostPercent  float64   `json:"variable_cost_percent"`
	DefaultTaxRate       float64   `json:"default_tax_rate"`
	DefaultSalesVolume   float64   `json:"default_sales_volume"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// PricingSuggestionInput reúne parâmetros recebidos via API para simulação.
type PricingSuggestionInput struct {
	TenantID            uuid.UUID  `json:"-"`
	ProductID           *uuid.UUID `json:"product_id,omitempty"`
	RecipeID            uuid.UUID  `json:"recipe_id"`
	MarginPercent       *float64   `json:"margin_percent,omitempty"`
	PackagingCost       *float64   `json:"packaging_cost,omitempty"`
	FixedMonthlyCosts   *float64   `json:"fixed_monthly_costs,omitempty"`
	VariableCostPercent *float64   `json:"variable_cost_percent,omitempty"`
	LaborCostPerMinute  *float64   `json:"labor_cost_per_minute,omitempty"`
	SalesVolumeMonthly  *float64   `json:"sales_volume_monthly,omitempty"`
	CurrentPrice        *float64   `json:"current_price,omitempty"`
	IncludeTax          bool       `json:"include_tax"`
	TaxRate             *float64   `json:"tax_rate,omitempty"`
}

// PricingSuggestion resume o cálculo devolvido ao frontend.
type PricingSuggestion struct {
	UnitCost         float64                     `json:"unit_cost"`
	FixedCostPerUnit float64                     `json:"fixed_cost_per_unit"`
	VariableCostUnit float64                     `json:"variable_cost_unit"`
	PriceBeforeTax   float64                     `json:"price_before_tax"`
	SuggestedPrice   float64                     `json:"suggested_price"`
	BreakEvenPrice   float64                     `json:"break_even_price"`
	MarginValue      float64                     `json:"margin_value"`
	MarginPercent    float64                     `json:"margin_percent"`
	TaxValue         float64                     `json:"tax_value"`
	CurrentPrice     float64                     `json:"current_price"`
	DeltaVsCurrent   float64                     `json:"delta_vs_current"`
	Components       PricingSuggestionComponents `json:"components"`
	Inputs           PricingSuggestionInputs     `json:"inputs"`
	Flags            PricingSuggestionFlags      `json:"flags"`
}

// PricingSuggestionComponents detalha cada parcela de custo usada no cálculo.
type PricingSuggestionComponents struct {
	IngredientCost    float64 `json:"ingredient_cost"`
	LaborCost         float64 `json:"labor_cost"`
	PackagingCost     float64 `json:"packaging_cost"`
	FixedCostPerUnit  float64 `json:"fixed_cost_per_unit"`
	VariableCostUnit  float64 `json:"variable_cost_unit"`
	SalesVolumeMonthly float64 `json:"sales_volume_monthly"`
}

// PricingSuggestionFlags fornece avisos para o usuário final.
type PricingSuggestionFlags struct {
	MissingSalesVolume bool `json:"missing_sales_volume"`
}

// PricingSuggestionInputs expõe os parâmetros consolidados utilizados.
type PricingSuggestionInputs struct {
	MarginPercent       float64 `json:"margin_percent"`
	PackagingCost       float64 `json:"packaging_cost"`
	FixedMonthlyCosts   float64 `json:"fixed_monthly_costs"`
	VariableCostPercent float64 `json:"variable_cost_percent"`
	LaborCostPerMinute  float64 `json:"labor_cost_per_minute"`
	SalesVolumeMonthly  float64 `json:"sales_volume_monthly"`
	TaxRate             float64 `json:"tax_rate"`
}
