package domain

import "github.com/google/uuid"

// Recipe representa uma receita composta por ingredientes.
type Recipe struct {
	ID              uuid.UUID      `json:"id"`
	TenantID        uuid.UUID      `json:"tenant_id"`
	Name            string         `json:"name"`
	Description     string         `json:"description"`
	YieldQuantity   float64        `json:"yield_quantity"`
	YieldUnit       string         `json:"yield_unit"`
	ProductionTime  int            `json:"production_time"`
	Notes           string         `json:"notes"`
	CategoryID      *uuid.UUID     `json:"category_id"`
	Items           []RecipeItem   `json:"items"`
	CostSummary     *RecipeSummary `json:"cost_summary,omitempty"`
	Auditable
}

// RecipeItem representa um ingrediente dentro de uma receita.
type RecipeItem struct {
	ID           uuid.UUID `json:"id"`
	TenantID     uuid.UUID `json:"tenant_id"`
	RecipeID     uuid.UUID `json:"recipe_id"`
	IngredientID uuid.UUID `json:"ingredient_id"`
	Quantity     float64   `json:"quantity"`
	Unit         string    `json:"unit"`
	WasteFactor  float64   `json:"waste_factor"`
	Auditable
}

// RecipeSummary consolida o custo da receita.
type RecipeSummary struct {
	IngredientCost float64 `json:"ingredient_cost"`
	LaborCost      float64 `json:"labor_cost"`
	PackagingCost  float64 `json:"packaging_cost"`
	TotalCost      float64 `json:"total_cost"`
	CostPerUnit    float64 `json:"cost_per_unit"`
}
