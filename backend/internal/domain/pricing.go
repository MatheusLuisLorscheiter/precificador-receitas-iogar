package domain

import (
	"time"

	"github.com/google/uuid"
)

// PricingSettings armazena parâmetros padrão de precificação por tenant.
// Focado em precificação direta sem complexidade de impostos.
type PricingSettings struct {
	TenantID             uuid.UUID `json:"tenant_id"`
	LaborCostPerMinute   float64   `json:"labor_cost_per_minute"`   // Custo de mão de obra por minuto (R$/min)
	DefaultPackagingCost float64   `json:"default_packaging_cost"`  // Custo padrão de embalagem (R$)
	DefaultMarginPercent float64   `json:"default_margin_percent"`  // Margem de lucro padrão (%)
	FixedMonthlyCosts    float64   `json:"fixed_monthly_costs"`     // Custos fixos mensais: aluguel, luz, água, funcionários (R$)
	VariableCostPercent  float64   `json:"variable_cost_percent"`   // Custos variáveis como % da receita (%)
	DefaultSalesVolume   float64   `json:"default_sales_volume"`    // Volume mensal estimado para rateio (unidades)
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// PricingSuggestionInput reúne parâmetros recebidos via API para simulação.
// Focado em precificação direta: custos fixos, variáveis, margem e markup.
type PricingSuggestionInput struct {
	TenantID            uuid.UUID  `json:"-"`
	ProductID           *uuid.UUID `json:"product_id,omitempty"`
	RecipeID            uuid.UUID  `json:"recipe_id"`
	MarginPercent       *float64   `json:"margin_percent,omitempty"`       // Margem de lucro desejada (%)
	PackagingCost       *float64   `json:"packaging_cost,omitempty"`       // Custo de embalagem (R$)
	FixedMonthlyCosts   *float64   `json:"fixed_monthly_costs,omitempty"`  // Custos fixos mensais (R$)
	VariableCostPercent *float64   `json:"variable_cost_percent,omitempty"` // Custos variáveis (%)
	LaborCostPerMinute  *float64   `json:"labor_cost_per_minute,omitempty"` // Mão de obra (R$/min)
	SalesVolumeMonthly  *float64   `json:"sales_volume_monthly,omitempty"`  // Volume mensal para rateio (unidades)
	CurrentPrice        *float64   `json:"current_price,omitempty"`        // Preço atual praticado (R$)
}

// PricingSuggestion resume o cálculo devolvido ao frontend.
// Baseado em metodologia do Sebrae para formação de preços.
type PricingSuggestion struct {
	UnitCost              float64                     `json:"unit_cost"`               // Custo unitário base (ingredientes + mão de obra + embalagem)
	FixedCostPerUnit      float64                     `json:"fixed_cost_per_unit"`     // Rateio de custos fixos por unidade
	VariableCostUnit      float64                     `json:"variable_cost_unit"`      // Custos variáveis por unidade
	TotalCostPerUnit      float64                     `json:"total_cost_per_unit"`     // Custo total unitário (unit + fixed + variable)
	SuggestedPrice        float64                     `json:"suggested_price"`         // Preço sugerido final
	BreakEvenPrice        float64                     `json:"break_even_price"`        // Ponto de equilíbrio (preço mínimo)
	ContributionMargin    float64                     `json:"contribution_margin"`     // Margem de contribuição unitária (R$)
	ContributionMarginPct float64                     `json:"contribution_margin_pct"` // Margem de contribuição (%)
	MarginValue           float64                     `json:"margin_value"`            // Valor da margem de lucro (R$)
	MarginPercent         float64                     `json:"margin_percent"`          // Percentual da margem de lucro (%)
	Markup                float64                     `json:"markup"`                  // Markup aplicado (%)
	CurrentPrice          float64                     `json:"current_price"`           // Preço atual praticado (R$)
	DeltaVsCurrent        float64                     `json:"delta_vs_current"`        // Diferença vs preço atual (R$)
	DeltaPercent          float64                     `json:"delta_percent"`           // Diferença vs preço atual (%)
	Components            PricingSuggestionComponents `json:"components"`              // Detalhamento dos componentes de custo
	Inputs                PricingSuggestionInputs     `json:"inputs"`                  // Parâmetros utilizados no cálculo
	Flags                 PricingSuggestionFlags      `json:"flags"`                   // Alertas e avisos
}

// PricingSuggestionComponents detalha cada parcela de custo usada no cálculo.
type PricingSuggestionComponents struct {
	IngredientCost     float64 `json:"ingredient_cost"`      // Custo dos ingredientes (R$)
	LaborCost          float64 `json:"labor_cost"`           // Custo de mão de obra (R$)
	PackagingCost      float64 `json:"packaging_cost"`       // Custo de embalagem (R$)
	FixedCostPerUnit   float64 `json:"fixed_cost_per_unit"`  // Rateio de custos fixos (R$)
	VariableCostUnit   float64 `json:"variable_cost_unit"`   // Custos variáveis unitários (R$)
	SalesVolumeMonthly float64 `json:"sales_volume_monthly"` // Volume mensal usado no rateio (unidades)
}

// PricingSuggestionFlags fornece avisos para o usuário final.
type PricingSuggestionFlags struct {
	MissingSalesVolume   bool `json:"missing_sales_volume"`    // Volume de vendas não informado (afeta rateio de custos fixos)
	LowMargin            bool `json:"low_margin"`              // Margem de lucro abaixo de 20%
	BelowBreakEven       bool `json:"below_break_even"`        // Preço atual abaixo do ponto de equilíbrio
	HighFixedCostImpact  bool `json:"high_fixed_cost_impact"`  // Custos fixos representam mais de 30% do preço
}

// PricingSuggestionInputs expõe os parâmetros consolidados utilizados no cálculo.
type PricingSuggestionInputs struct {
	MarginPercent       float64 `json:"margin_percent"`        // Margem de lucro aplicada (%)
	PackagingCost       float64 `json:"packaging_cost"`        // Custo de embalagem (R$)
	FixedMonthlyCosts   float64 `json:"fixed_monthly_costs"`   // Custos fixos mensais (R$)
	VariableCostPercent float64 `json:"variable_cost_percent"` // Custos variáveis (%)
	LaborCostPerMinute  float64 `json:"labor_cost_per_minute"` // Custo mão de obra (R$/min)
	SalesVolumeMonthly  float64 `json:"sales_volume_monthly"`  // Volume mensal (unidades)
}
