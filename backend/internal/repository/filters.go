package repository

import "github.com/google/uuid"

// IngredientListFilter contém os parâmetros de consulta para listar ingredientes.
type IngredientListFilter struct {
	Search      string
	Supplier    string
	Unit        string
	CategoryID  *uuid.UUID
	StockStatus string
}

// RecipeListFilter contém os parâmetros de consulta para listar receitas.
type RecipeListFilter struct {
	Search     string
	CategoryID *uuid.UUID
}

// ProductListFilter contém os parâmetros de consulta para listar produtos.
type ProductListFilter struct {
	Search      string
	CategoryID  *uuid.UUID
	RecipeID    *uuid.UUID
	Active      *bool
	StockStatus string
}
