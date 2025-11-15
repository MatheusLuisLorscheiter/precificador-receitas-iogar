package domain

import "github.com/google/uuid"

// Ingredient representa um insumo utilizado nas receitas.
type Ingredient struct {
	ID              uuid.UUID `json:"id"`
	TenantID        uuid.UUID `json:"tenant_id"`
	Name            string    `json:"name"`
	Unit            string    `json:"unit"`
	CostPerUnit     float64   `json:"cost_per_unit"`
	Supplier        string    `json:"supplier"`
	LeadTimeDays    int       `json:"lead_time_days"`
	MinStockLevel   float64   `json:"min_stock_level"`
	CurrentStock    float64   `json:"current_stock"`
	StorageLocation string    `json:"storage_location"`
	CategoryID      *uuid.UUID `json:"category_id"`
	Notes           string     `json:"notes"`
	Auditable
}
