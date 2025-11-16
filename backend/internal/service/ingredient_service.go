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

// IngredientService gerencia os casos de uso relacionados a ingredientes.
type IngredientService struct {
	repo    *repository.Store
	pricing *PricingService
	log     zerolog.Logger
}

func NewIngredientService(repo *repository.Store, pricing *PricingService, log zerolog.Logger) *IngredientService {
	return &IngredientService{repo: repo, pricing: pricing, log: log}
}

func (s *IngredientService) Create(ctx context.Context, ingredient *domain.Ingredient) error {
	if err := s.normalize(ctx, ingredient); err != nil {
		return err
	}
	if err := s.repo.CreateIngredient(ctx, ingredient); err != nil {
		return err
	}
	s.log.Info().Str("ingredient_id", ingredient.ID.String()).Msg("ingrediente criado")
	return nil
}

func (s *IngredientService) Update(ctx context.Context, ingredient *domain.Ingredient) error {
	if ingredient.ID == uuid.Nil || ingredient.TenantID == uuid.Nil {
		return ValidationError("ingrediente inválido")
	}
	if err := s.normalize(ctx, ingredient); err != nil {
		return err
	}
	recipeIDs, err := s.repo.ListRecipeIDsByIngredient(ctx, ingredient.TenantID, ingredient.ID)
	if err != nil {
		return err
	}
	if err := s.repo.UpdateIngredient(ctx, ingredient); err != nil {
		return err
	}
	s.invalidateRecipes(ctx, ingredient.TenantID, recipeIDs)
	s.log.Info().Str("ingredient_id", ingredient.ID.String()).Msg("ingrediente atualizado")
	return nil
}

func (s *IngredientService) Get(ctx context.Context, tenantID, ingredientID uuid.UUID) (*domain.Ingredient, error) {
	return s.repo.GetIngredient(ctx, tenantID, ingredientID)
}

func (s *IngredientService) List(ctx context.Context, tenantID uuid.UUID, opts *IngredientListOptions) ([]domain.Ingredient, error) {
	filter := &repository.IngredientListFilter{}
	if opts != nil {
		filter.Search = opts.Search
		filter.Supplier = opts.Supplier
		filter.Unit = opts.Unit
		filter.CategoryID = opts.CategoryID
		filter.StockStatus = string(opts.StockStatus)
	}
	return s.repo.ListIngredients(ctx, tenantID, filter)
}

func (s *IngredientService) Delete(ctx context.Context, tenantID, ingredientID uuid.UUID) error {
	recipeIDs, err := s.repo.ListRecipeIDsByIngredient(ctx, tenantID, ingredientID)
	if err != nil {
		return err
	}
	if err := s.repo.DeleteIngredient(ctx, tenantID, ingredientID); err != nil {
		return err
	}
	s.invalidateRecipes(ctx, tenantID, recipeIDs)
	return nil
}

func (s *IngredientService) BulkDelete(ctx context.Context, tenantID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}
	recipeIDs, err := s.repo.ListRecipeIDsByIngredients(ctx, tenantID, ids)
	if err != nil {
		return err
	}
	if err := s.repo.DeleteIngredients(ctx, tenantID, ids); err != nil {
		return err
	}
	s.invalidateRecipes(ctx, tenantID, recipeIDs)
	return nil
}

func (s *IngredientService) GetByID(ctx context.Context, tenantID, ingredientID uuid.UUID) (*domain.Ingredient, error) {
	return s.Get(ctx, tenantID, ingredientID)
}

func (s *IngredientService) normalize(ctx context.Context, ingredient *domain.Ingredient) error {
	if ingredient == nil {
		return ValidationError("ingrediente inválido")
	}

	ingredient.Name = strings.TrimSpace(ingredient.Name)
	if ingredient.Name == "" {
		return ValidationError("nome do ingrediente é obrigatório")
	}

	ingredient.Unit = domain.NormalizeUnit(ingredient.Unit)
	if ingredient.Unit == "" {
		return ValidationError("unidade do ingrediente é obrigatória")
	}
	if !domain.IsValidMeasurementUnit(ingredient.Unit) {
		return ValidationErrorf("unidade '%s' não é suportada", ingredient.Unit)
	}

	if ingredient.CostPerUnit < 0 {
		return ValidationError("custo por unidade não pode ser negativo")
	}
	if ingredient.MinStockLevel < 0 {
		return ValidationError("estoque mínimo não pode ser negativo")
	}
	if ingredient.CurrentStock < 0 {
		return ValidationError("estoque atual não pode ser negativo")
	}
	if ingredient.LeadTimeDays < 0 {
		return ValidationError("prazo de entrega não pode ser negativo")
	}

	ingredient.Supplier = strings.TrimSpace(ingredient.Supplier)
	ingredient.StorageLocation = strings.TrimSpace(ingredient.StorageLocation)
	ingredient.Notes = strings.TrimSpace(ingredient.Notes)

	if ingredient.CategoryID != nil {
		category, err := s.repo.GetCategory(ctx, ingredient.TenantID, *ingredient.CategoryID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return ValidationError("categoria informada não existe")
			}
			return err
		}
		if category.Type != domain.CategoryTypeIngredient {
			return ValidationError("categoria informada não é do tipo ingrediente")
		}
	}

	return nil
}

func (s *IngredientService) invalidateRecipes(ctx context.Context, tenantID uuid.UUID, recipeIDs []uuid.UUID) {
	if s.pricing == nil || len(recipeIDs) == 0 {
		return
	}
	seen := make(map[uuid.UUID]struct{}, len(recipeIDs))
	for _, recipeID := range recipeIDs {
		if recipeID == uuid.Nil {
			continue
		}
		if _, ok := seen[recipeID]; ok {
			continue
		}
		seen[recipeID] = struct{}{}
		s.pricing.InvalidateRecipeCache(ctx, tenantID, recipeID)
	}
}
