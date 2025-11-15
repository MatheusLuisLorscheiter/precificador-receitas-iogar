package domain

import "github.com/google/uuid"

const (
	CategoryTypeIngredient = "ingredient"
	CategoryTypeRecipe     = "recipe"
	CategoryTypeProduct    = "product"
)

// Category representa taxonomias reutilizáveis por entidade.
type Category struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Type      string    `json:"type"`
	Color     string    `json:"color"`
	Icon      string    `json:"icon"`
	SortOrder int       `json:"sort_order"`
	Auditable
}
