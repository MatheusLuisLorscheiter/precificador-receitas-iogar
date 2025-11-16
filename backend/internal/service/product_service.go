package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"mime"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/storage"
)

type ProductService struct {
	repo    *repository.Store
	storage *storage.Client
	pricing *PricingService
	log     zerolog.Logger
}

func NewProductService(repo *repository.Store, storage *storage.Client, pricing *PricingService, log zerolog.Logger) *ProductService {
	return &ProductService{repo: repo, storage: storage, pricing: pricing, log: log}
}

func (s *ProductService) Create(ctx context.Context, product *domain.Product) error {
	if product.TenantID == uuid.Nil {
		return ValidationError("tenant obrigatório")
	}
	if s.pricing == nil {
		return errors.New("serviço de precificação não configurado")
	}

	if err := s.normalizeProduct(ctx, product); err != nil {
		return err
	}

	if product.ID == uuid.Nil {
		product.ID = uuid.New()
	}
	if !product.Active {
		product.Active = true
	}

	if _, err := s.pricing.CalculateProductPrice(ctx, product.TenantID, product); err != nil {
		return err
	}
	s.populateDerivedFields(ctx, product)

	if err := s.repo.CreateProduct(ctx, product); err != nil {
		return err
	}

	s.invalidateRecipeCache(ctx, product.TenantID, product.RecipeID)
	s.log.Info().Str("product_id", product.ID.String()).Msg("produto criado")
	return nil
}

func (s *ProductService) Update(ctx context.Context, product *domain.Product) error {
	if product.TenantID == uuid.Nil || product.ID == uuid.Nil {
		return ValidationError("produto inválido")
	}
	if s.pricing == nil {
		return errors.New("serviço de precificação não configurado")
	}
	oldRecipeID, err := s.getProductRecipeID(ctx, product.TenantID, product.ID)
	if err != nil {
		return err
	}

	if err := s.normalizeProduct(ctx, product); err != nil {
		return err
	}

	if _, err := s.pricing.CalculateProductPrice(ctx, product.TenantID, product); err != nil {
		return err
	}
	s.populateDerivedFields(ctx, product)

	if err := s.repo.UpdateProduct(ctx, product); err != nil {
		return err
	}

	s.invalidateRecipeCache(ctx, product.TenantID, oldRecipeID, product.RecipeID)
	s.log.Info().Str("product_id", product.ID.String()).Msg("produto atualizado")
	return nil
}

func (s *ProductService) Get(ctx context.Context, tenantID, productID uuid.UUID) (*domain.Product, error) {
	product, err := s.repo.GetProduct(ctx, tenantID, productID)
	if err != nil {
		return nil, err
	}
	s.populateDerivedFields(ctx, product)
	return product, nil
}

func (s *ProductService) List(ctx context.Context, tenantID uuid.UUID, opts *ProductListOptions) ([]domain.Product, error) {
	filter := &repository.ProductListFilter{}
	if opts != nil {
		filter.Search = opts.Search
		filter.CategoryID = opts.CategoryID
		filter.RecipeID = opts.RecipeID
		filter.Active = opts.Active
		filter.StockStatus = string(opts.StockStatus)
	}
	products, err := s.repo.ListProducts(ctx, tenantID, filter)
	if err != nil {
		return nil, err
	}

	for i := range products {
		s.populateDerivedFields(ctx, &products[i])
	}

	return products, nil
}

func (s *ProductService) Delete(ctx context.Context, tenantID, productID uuid.UUID) error {
	recipeID, err := s.getProductRecipeID(ctx, tenantID, productID)
	if err != nil {
		return err
	}
	if err := s.repo.DeleteProduct(ctx, tenantID, productID); err != nil {
		return err
	}
	s.invalidateRecipeCache(ctx, tenantID, recipeID)
	return nil
}

func (s *ProductService) BulkDelete(ctx context.Context, tenantID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}
	recipeMap, err := s.repo.ListProductRecipeIDs(ctx, tenantID, ids)
	if err != nil {
		return err
	}
	if err := s.repo.DeleteProducts(ctx, tenantID, ids); err != nil {
		return err
	}
	var affected []uuid.UUID
	for _, recipeID := range recipeMap {
		affected = append(affected, recipeID)
	}
	s.invalidateRecipeCache(ctx, tenantID, affected...)
	return nil
}

func (s *ProductService) GetByID(ctx context.Context, tenantID, productID uuid.UUID) (*domain.Product, error) {
	return s.Get(ctx, tenantID, productID)
}

func (s *ProductService) UploadImage(ctx context.Context, tenantID, productID uuid.UUID, filename, contentType string, size int64, reader io.Reader) (string, error) {
	if s.storage == nil {
		return "", errors.New("armazenamento não configurado")
	}

	if filename == "" {
		filename = "produto"
	}
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" && contentType != "" {
		if exts, _ := mime.ExtensionsByType(contentType); len(exts) > 0 {
			ext = exts[0]
		}
	}
	if ext == "" {
		ext = ".bin"
	}

	objectName := fmt.Sprintf("%s/products/%s/%s%s", tenantID.String(), productID.String(), uuid.NewString(), sanitizeExtension(ext))

	if _, err := s.storage.UploadObject(ctx, objectName, contentType, size, reader); err != nil {
		return "", err
	}

	if err := s.repo.SetProductImage(ctx, tenantID, productID, objectName); err != nil {
		return "", err
	}

	url, err := s.storage.PresignedURL(ctx, objectName)
	if err != nil {
		s.log.Warn().Err(err).Str("product_id", productID.String()).Msg("não foi possível gerar URL assinada")
		return objectName, nil
	}

	s.log.Info().Str("product_id", productID.String()).Msg("imagem de produto atualizada")
	return url.String(), nil
}

func (s *ProductService) GenerateImageURL(ctx context.Context, product *domain.Product) (string, error) {
	if s.storage == nil || product == nil || product.ImageObjectKey == "" {
		return "", nil
	}

	url, err := s.storage.PresignedURL(ctx, product.ImageObjectKey)
	if err != nil {
		return "", err
	}

	return url.String(), nil
}

func sanitizeExtension(ext string) string {
	cleaned := strings.TrimSpace(strings.ToLower(ext))
	cleaned = strings.ReplaceAll(cleaned, "\\", "")
	cleaned = strings.ReplaceAll(cleaned, "/", "")
	cleaned = strings.ReplaceAll(cleaned, "..", ".")
	if cleaned == "" {
		return ""
	}
	if !strings.HasPrefix(cleaned, ".") {
		cleaned = "." + cleaned
	}
	return cleaned
}

func (s *ProductService) getProductRecipeID(ctx context.Context, tenantID, productID uuid.UUID) (uuid.UUID, error) {
	if productID == uuid.Nil {
		return uuid.Nil, ValidationError("produto inválido")
	}
	mapping, err := s.repo.ListProductRecipeIDs(ctx, tenantID, []uuid.UUID{productID})
	if err != nil {
		return uuid.Nil, err
	}
	recipeID, ok := mapping[productID]
	if !ok {
		return uuid.Nil, repository.ErrNotFound
	}
	return recipeID, nil
}

func (s *ProductService) invalidateRecipeCache(ctx context.Context, tenantID uuid.UUID, recipeIDs ...uuid.UUID) {
	if s.pricing == nil {
		return
	}
	seen := make(map[uuid.UUID]struct{}, len(recipeIDs))
	for _, id := range recipeIDs {
		if id == uuid.Nil {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		s.pricing.InvalidateRecipeCache(ctx, tenantID, id)
	}
}

func (s *ProductService) normalizeProduct(ctx context.Context, product *domain.Product) error {
	product.Name = strings.TrimSpace(product.Name)
	if product.Name == "" {
		return ValidationError("nome do produto é obrigatório")
	}

	product.Description = strings.TrimSpace(product.Description)
	product.SKU = strings.ToUpper(strings.TrimSpace(product.SKU))
	product.Barcode = strings.TrimSpace(product.Barcode)
	product.StorageLocation = strings.TrimSpace(product.StorageLocation)
	product.ImageObjectKey = strings.TrimSpace(product.ImageObjectKey)

	if product.RecipeID == uuid.Nil {
		return ValidationError("produto precisa estar vinculado a uma receita")
	}

	if product.MarginPercent < 0 {
		return ValidationError("margem não pode ser negativa")
	}
	if product.PackagingCost < 0 {
		return ValidationError("custo de embalagem não pode ser negativo")
	}
	if product.StockQuantity < 0 {
		return ValidationError("estoque não pode ser negativo")
	}
	if product.ReorderPoint < 0 {
		return ValidationError("ponto de reposição não pode ser negativo")
	}

	product.StockUnit = domain.NormalizeUnit(product.StockUnit)
	if product.StockUnit == "" {
		product.StockUnit = domain.DefaultProductUnit
	}
	if !domain.IsValidMeasurementUnit(product.StockUnit) {
		return ValidationErrorf("unidade de estoque '%s' não suportada", product.StockUnit)
	}

	if product.CategoryID != nil {
		category, err := s.repo.GetCategory(ctx, product.TenantID, *product.CategoryID)
		if err != nil {
			if errors.Is(err, repository.ErrNotFound) {
				return ValidationError("categoria informada não existe")
			}
			return err
		}
		if category.Type != domain.CategoryTypeProduct {
			return ValidationError("categoria não é do tipo produto")
		}
	}

	return nil
}

func (s *ProductService) populateDerivedFields(ctx context.Context, product *domain.Product) {
	if product == nil {
		return
	}
	product.StockUnit = domain.NormalizeUnit(product.StockUnit)
	if product.StockUnit == "" {
		product.StockUnit = domain.DefaultProductUnit
	}
	product.PricingSummary = product.DerivePricingSummary()
	if url, err := s.GenerateImageURL(ctx, product); err == nil {
		product.ImageURL = url
	} else {
		s.log.Debug().Err(err).Str("product_id", product.ID.String()).Msg("falha ao gerar URL assinada do produto")
	}
}
