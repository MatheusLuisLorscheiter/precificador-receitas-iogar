package service

import "github.com/google/uuid"

// StockStatus representa filtros de estoque comuns entre entidades.
type StockStatus string

const (
	StockStatusAny     StockStatus = ""
	StockStatusLow     StockStatus = "low"
	StockStatusOut     StockStatus = "out"
	StockStatusHealthy StockStatus = "ok"
)

// IngredientListOptions define os filtros disponíveis para listar ingredientes.
type IngredientListOptions struct {
	Search      string
	Supplier    string
	Unit        string
	CategoryID  *uuid.UUID
	StockStatus StockStatus
}

// RecipeListOptions define os filtros disponíveis para listar receitas.
type RecipeListOptions struct {
	Search     string
	CategoryID *uuid.UUID
}

// ProductListOptions define os filtros disponíveis para listar produtos.
type ProductListOptions struct {
	Search      string
	CategoryID  *uuid.UUID
	RecipeID    *uuid.UUID
	Active      *bool
	StockStatus StockStatus
}
