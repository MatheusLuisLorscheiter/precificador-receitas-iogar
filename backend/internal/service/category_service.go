package service

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

var allowedCategoryTypes = map[string]struct{}{
	domain.CategoryTypeIngredient: {},
	domain.CategoryTypeRecipe:     {},
	domain.CategoryTypeProduct:    {},
}

// CategoryService oferece operações para gerenciar categorias multi-entidade.
type CategoryService struct {
	repo *repository.Store
	log  zerolog.Logger
}

// NewCategoryService cria uma nova instância do serviço de categorias.
func NewCategoryService(repo *repository.Store, log zerolog.Logger) *CategoryService {
	return &CategoryService{repo: repo, log: log}
}

// Create inclui uma nova categoria no tenant.
func (s *CategoryService) Create(ctx context.Context, category *domain.Category) error {
	if err := s.validate(category, false); err != nil {
		return err
	}
	if category.Slug == "" {
		category.Slug = repository.Slugify(category.Name)
	}
	if category.SortOrder == 0 {
		category.SortOrder = 1000
	}
	if err := s.repo.CreateCategory(ctx, category); err != nil {
		return err
	}
	s.log.Info().
		Str("category_id", category.ID.String()).
		Str("type", category.Type).
		Msg("categoria criada")
	return nil
}

// Update altera campos mutáveis de uma categoria existente.
func (s *CategoryService) Update(ctx context.Context, category *domain.Category) error {
	if category.ID == uuid.Nil {
		return ValidationError("categoria inválida")
	}
	if err := s.validate(category, true); err != nil {
		return err
	}
	if category.Slug == "" {
		category.Slug = repository.Slugify(category.Name)
	}
	if err := s.repo.UpdateCategory(ctx, category); err != nil {
		return err
	}
	s.log.Info().
		Str("category_id", category.ID.String()).
		Msg("categoria atualizada")
	return nil
}

// Delete realiza soft delete da categoria.
func (s *CategoryService) Delete(ctx context.Context, tenantID, categoryID uuid.UUID) error {
	if tenantID == uuid.Nil || categoryID == uuid.Nil {
		return ValidationError("identificadores inválidos")
	}
	if err := s.repo.SoftDeleteCategory(ctx, tenantID, categoryID); err != nil {
		return err
	}
	s.log.Info().
		Str("category_id", categoryID.String()).
		Msg("categoria excluída")
	return nil
}

// List retorna categorias por tipo.
func (s *CategoryService) List(ctx context.Context, tenantID uuid.UUID, categoryType string) ([]domain.Category, error) {
	if tenantID == uuid.Nil {
		return nil, ValidationError("tenant inválido")
	}
	categoryType = strings.TrimSpace(categoryType)
	if categoryType == "" {
		return nil, ValidationError("tipo é obrigatório")
	}
	if _, ok := allowedCategoryTypes[categoryType]; !ok {
		return nil, ValidationError("tipo de categoria inválido")
	}
	return s.repo.ListCategories(ctx, tenantID, categoryType)
}

// Get recupera uma categoria específica.
func (s *CategoryService) Get(ctx context.Context, tenantID, categoryID uuid.UUID) (*domain.Category, error) {
	if tenantID == uuid.Nil || categoryID == uuid.Nil {
		return nil, ValidationError("identificadores inválidos")
	}
	return s.repo.GetCategory(ctx, tenantID, categoryID)
}

func (s *CategoryService) validate(category *domain.Category, allowID bool) error {
	if category == nil {
		return ValidationError("categoria inválida")
	}
	if category.TenantID == uuid.Nil {
		return ValidationError("tenant inválido")
	}
	category.Type = strings.TrimSpace(strings.ToLower(category.Type))
	if category.Type == "" {
		return ValidationError("tipo é obrigatório")
	}
	if _, ok := allowedCategoryTypes[category.Type]; !ok {
		return ValidationError("tipo de categoria inválido")
	}
	category.Name = strings.TrimSpace(category.Name)
	if category.Name == "" {
		return ValidationError("nome é obrigatório")
	}
	category.Color = strings.TrimSpace(category.Color)
	category.Icon = strings.TrimSpace(category.Icon)
	category.Slug = strings.TrimSpace(category.Slug)
	if !allowID && category.ID != uuid.Nil {
		// ignore
	}
	return nil
}
