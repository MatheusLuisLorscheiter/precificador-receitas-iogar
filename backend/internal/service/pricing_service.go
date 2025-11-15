package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/metrics"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

const (
	laborCostPerMinute   = 0.65
	defaultPackagingCost = 0.35
)

// PricingService concentra regras de precificação e caching.
type PricingService struct {
	repo    *repository.Store
	cache   *redis.Client
	metrics *metrics.Registry
	log     zerolog.Logger
}

func NewPricingService(repo *repository.Store, cache *redis.Client, metrics *metrics.Registry, log zerolog.Logger) *PricingService {
	return &PricingService{repo: repo, cache: cache, metrics: metrics, log: log}
}

func (s *PricingService) cacheKey(tenantID, recipeID uuid.UUID) string {
	return fmt.Sprintf("pricing:%s:%s", tenantID, recipeID)
}

// CalculateRecipeCost retorna o custo consolidado de uma receita aplicando cache em Redis.
func (s *PricingService) CalculateRecipeCost(ctx context.Context, tenantID, recipeID uuid.UUID) (*domain.RecipeSummary, error) {
	if s.cache != nil {
		if data, err := s.cache.Get(ctx, s.cacheKey(tenantID, recipeID)).Bytes(); err == nil {
			var summary domain.RecipeSummary
			if err := json.Unmarshal(data, &summary); err == nil {
				if s.metrics != nil {
					s.metrics.PricingCache.WithLabelValues("hit").Inc()
				}
				return &summary, nil
			}
		}
	}

	recipe, err := s.repo.GetRecipe(ctx, tenantID, recipeID)
	if err != nil {
		return nil, err
	}

	ingCost := 0.0
	for _, item := range recipe.Items {
		ingredient, err := s.repo.GetIngredient(ctx, tenantID, item.IngredientID)
		if err != nil {
			return nil, err
		}
		totalQty := item.Quantity * (1 + item.WasteFactor)
		ingCost += ingredient.CostPerUnit * totalQty
	}

	laborCost := float64(recipe.ProductionTime) * laborCostPerMinute
	packaging := defaultPackagingCost
	total := ingCost + laborCost + packaging
	costPerUnit := 0.0
	if recipe.YieldQuantity > 0 {
		costPerUnit = total / recipe.YieldQuantity
	}

	summary := &domain.RecipeSummary{
		IngredientCost: domain.RoundCurrency(ingCost),
		LaborCost:      domain.RoundCurrency(laborCost),
		PackagingCost:  domain.RoundCurrency(packaging),
		TotalCost:      domain.RoundCurrency(total),
		CostPerUnit:    domain.RoundCurrency(costPerUnit),
	}

	if s.cache != nil {
		payload, _ := json.Marshal(summary)
		s.cache.Set(ctx, s.cacheKey(tenantID, recipeID), payload, 10*time.Minute)
		if s.metrics != nil {
			s.metrics.PricingCache.WithLabelValues("miss").Inc()
		}
	}

	return summary, nil
}

// CalculateProductPrice define o preço sugerido considerando margem e impostos.
func (s *PricingService) CalculateProductPrice(ctx context.Context, tenantID uuid.UUID, product *domain.Product) (*domain.Product, error) {
	summary, err := s.CalculateRecipeCost(ctx, tenantID, product.RecipeID)
	if err != nil {
		return nil, err
	}

	cost := summary.CostPerUnit + product.PackagingCost
	marginMultiplier := 1 + (product.MarginPercent / 100)
	priceBeforeTax := cost * marginMultiplier
	totalPrice := priceBeforeTax * (1 + product.TaxRate/100)

	product.BasePrice = domain.RoundCurrency(cost)
	product.SuggestedPrice = domain.RoundCurrency(totalPrice)
	product.PricingSummary = product.DerivePricingSummary()
	return product, nil
}

// InvalidateRecipeCache remove informações armazenadas para uma receita.
func (s *PricingService) InvalidateRecipeCache(ctx context.Context, tenantID, recipeID uuid.UUID) {
	if s.cache == nil {
		return
	}
	s.cache.Del(ctx, s.cacheKey(tenantID, recipeID))
}

func (s *PricingService) CalculateProductPricing(ctx context.Context, tenantID uuid.UUID, product *domain.Product) (*domain.Product, error) {
	return s.CalculateProductPrice(ctx, tenantID, product)
}
