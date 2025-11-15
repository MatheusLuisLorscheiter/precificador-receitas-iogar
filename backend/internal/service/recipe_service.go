package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

// RecipeService orquestra operações com receitas.
type RecipeService struct {
	repo    *repository.Store
	pricing *PricingService
	log     zerolog.Logger
}

func NewRecipeService(repo *repository.Store, pricing *PricingService, log zerolog.Logger) *RecipeService {
	return &RecipeService{repo: repo, pricing: pricing, log: log}
}

func (s *RecipeService) Create(ctx context.Context, recipe *domain.Recipe) error {
	if err := s.normalize(ctx, recipe); err != nil {
		return err
	}
	if err := s.repo.CreateRecipe(ctx, recipe); err != nil {
		return err
	}
	s.log.Info().Str("recipe_id", recipe.ID.String()).Msg("receita criada")
	return nil
}

func (s *RecipeService) Update(ctx context.Context, recipe *domain.Recipe) error {
	if recipe.ID == uuid.Nil || recipe.TenantID == uuid.Nil {
		return ValidationError("receita inválida")
	}
	if err := s.normalize(ctx, recipe); err != nil {
		return err
	}
	if err := s.repo.UpdateRecipe(ctx, recipe); err != nil {
		return err
	}
	s.log.Info().Str("recipe_id", recipe.ID.String()).Msg("receita atualizada")
	return nil
}

func (s *RecipeService) Get(ctx context.Context, tenantID, recipeID uuid.UUID) (*domain.Recipe, error) {
	recipe, err := s.repo.GetRecipe(ctx, tenantID, recipeID)
	if err != nil {
		return nil, err
	}

	summary, err := s.pricing.CalculateRecipeCost(ctx, tenantID, recipeID)
	if err == nil {
		recipe.CostSummary = summary
	}

	return recipe, nil
}

func (s *RecipeService) List(ctx context.Context, tenantID uuid.UUID, opts *RecipeListOptions) ([]domain.Recipe, error) {
	filter := &repository.RecipeListFilter{}
	if opts != nil {
		filter.Search = opts.Search
		filter.CategoryID = opts.CategoryID
	}
	recipes, err := s.repo.ListRecipes(ctx, tenantID, filter)
	if err != nil {
		return nil, err
	}

	for i := range recipes {
		summary, err := s.pricing.CalculateRecipeCost(ctx, tenantID, recipes[i].ID)
		if err == nil {
			recipes[i].CostSummary = summary
		}
	}

	return recipes, nil
}

func (s *RecipeService) Delete(ctx context.Context, tenantID, recipeID uuid.UUID) error {
	return s.repo.DeleteRecipe(ctx, tenantID, recipeID)
}

func (s *RecipeService) BulkDelete(ctx context.Context, tenantID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}
	return s.repo.DeleteRecipes(ctx, tenantID, ids)
}

func (s *RecipeService) GetByID(ctx context.Context, tenantID, recipeID uuid.UUID) (*domain.Recipe, error) {
	return s.Get(ctx, tenantID, recipeID)
}

func (s *RecipeService) AddItem(ctx context.Context, tenantID, recipeID uuid.UUID, item *domain.RecipeItem) error {
	if item == nil {
		return ValidationError("item de receita inválido")
	}
	recipe := &domain.Recipe{TenantID: tenantID, ID: recipeID, Items: []domain.RecipeItem{*item}}
	if err := s.normalizeItems(ctx, recipe); err != nil {
		return err
	}
	normalized := recipe.Items[0]
	normalized.RecipeID = recipeID
	return s.repo.AddRecipeItem(ctx, &normalized)
}

func (s *RecipeService) RemoveItem(ctx context.Context, tenantID, recipeID, itemID uuid.UUID) error {
	return s.repo.RemoveRecipeItem(ctx, tenantID, itemID)
}

func (s *RecipeService) normalize(ctx context.Context, recipe *domain.Recipe) error {
	if recipe == nil {
		return ValidationError("receita inválida")
	}
	recipe.Name = strings.TrimSpace(recipe.Name)
	if recipe.Name == "" {
		return ValidationError("nome da receita é obrigatório")
	}
	if recipe.TenantID == uuid.Nil {
		return ValidationError("tenant inválido")
	}
	if recipe.YieldQuantity <= 0 {
		return ValidationError("rendimento deve ser maior que zero")
	}
	recipe.YieldUnit = domain.NormalizeUnit(recipe.YieldUnit)
	if recipe.YieldUnit == "" {
		return ValidationError("unidade de rendimento é obrigatória")
	}
	if !domain.IsValidMeasurementUnit(recipe.YieldUnit) {
		return ValidationErrorf("unidade de rendimento '%s' não é suportada", recipe.YieldUnit)
	}
	if recipe.ProductionTime < 0 {
		return ValidationError("tempo de produção não pode ser negativo")
	}
	recipe.Description = strings.TrimSpace(recipe.Description)
	recipe.Notes = strings.TrimSpace(recipe.Notes)

	if recipe.CategoryID != nil {
		category, err := s.repo.GetCategory(ctx, recipe.TenantID, *recipe.CategoryID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return ValidationError("categoria informada não existe")
			}
			return err
		}
		if category.Type != domain.CategoryTypeRecipe {
			return ValidationError("categoria informada não é do tipo receita")
		}
	}

	return s.normalizeItems(ctx, recipe)
}

func (s *RecipeService) normalizeItems(ctx context.Context, recipe *domain.Recipe) error {
	for i := range recipe.Items {
		item := &recipe.Items[i]
		item.TenantID = recipe.TenantID
		if item.IngredientID == uuid.Nil {
			return ValidationError("ingrediente é obrigatório")
		}
		if item.Quantity <= 0 {
			return ValidationError("quantidade deve ser maior que zero")
		}
		item.Unit = domain.NormalizeUnit(item.Unit)
		if item.Unit == "" {
			ingredient, err := s.repo.GetIngredient(ctx, recipe.TenantID, item.IngredientID)
			if err != nil {
				return err
			}
			item.Unit = domain.NormalizeUnit(ingredient.Unit)
		}
		if !domain.IsValidMeasurementUnit(item.Unit) {
			return ValidationErrorf("unidade '%s' não é suportada", item.Unit)
		}
		if item.WasteFactor < 0 {
			return ValidationError("desperdício não pode ser negativo")
		}
	}
	return nil
}
