package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/metrics"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/pricing"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

const (
	settingsCacheTTL  = 5 * time.Minute
	recipeSnapshotTTL = 15 * time.Minute
)

// PricingService concentra as regras de precificação e caching relacionado.
type PricingService struct {
	repo    pricingRepository
	cache   *redis.Client
	metrics *metrics.Registry
	log     zerolog.Logger

	settingsCache map[uuid.UUID]cachedSettings
	settingsMu    sync.RWMutex
}

type cachedSettings struct {
	value     *domain.PricingSettings
	expiresAt time.Time
}

type pricingRepository interface {
	GetPricingSettings(ctx context.Context, tenantID uuid.UUID) (*domain.PricingSettings, error)
	UpsertPricingSettings(ctx context.Context, settings *domain.PricingSettings) error
	GetRecipe(ctx context.Context, tenantID, recipeID uuid.UUID) (*domain.Recipe, error)
	GetIngredient(ctx context.Context, tenantID, ingredientID uuid.UUID) (*domain.Ingredient, error)
	GetProduct(ctx context.Context, tenantID, productID uuid.UUID) (*domain.Product, error)
}

type recipeCostSnapshot struct {
	IngredientCost float64 `json:"ingredient_cost"`
	ProductionTime int     `json:"production_time"`
	YieldQuantity  float64 `json:"yield_quantity"`
}

// PricingSettingsUpdate permite atualizações parciais das configurações do tenant.
type PricingSettingsUpdate struct {
	LaborCostPerMinute   *float64 `json:"labor_cost_per_minute"`
	DefaultPackagingCost *float64 `json:"default_packaging_cost"`
	DefaultMarginPercent *float64 `json:"default_margin_percent"`
	FixedMonthlyCosts    *float64 `json:"fixed_monthly_costs"`
	VariableCostPercent  *float64 `json:"variable_cost_percent"`
	DefaultSalesVolume   *float64 `json:"default_sales_volume"`
}

// NewPricingService cria uma nova instância do serviço de precificação.
func NewPricingService(repo pricingRepository, cache *redis.Client, metrics *metrics.Registry, log zerolog.Logger) *PricingService {
	return &PricingService{
		repo:          repo,
		cache:         cache,
		metrics:       metrics,
		log:           log,
		settingsCache: make(map[uuid.UUID]cachedSettings),
	}
}

func (s *PricingService) recipeCacheKey(tenantID, recipeID uuid.UUID) string {
	return fmt.Sprintf("pricing:%s:%s", tenantID, recipeID)
}

func (s *PricingService) getSettingsFromCache(tenantID uuid.UUID) (*domain.PricingSettings, bool) {
	s.settingsMu.RLock()
	defer s.settingsMu.RUnlock()
	entry, ok := s.settingsCache[tenantID]
	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return cloneSettings(entry.value), true
}

func (s *PricingService) storeSettingsInCache(settings *domain.PricingSettings) {
	if settings == nil {
		return
	}
	clone := cloneSettings(settings)
	s.settingsMu.Lock()
	defer s.settingsMu.Unlock()
	s.settingsCache[settings.TenantID] = cachedSettings{
		value:     clone,
		expiresAt: time.Now().Add(settingsCacheTTL),
	}
}

func cloneSettings(settings *domain.PricingSettings) *domain.PricingSettings {
	if settings == nil {
		return nil
	}
	cp := *settings
	return &cp
}

// GetTenantSettings busca (ou cria) as configurações de precificação do tenant.
func (s *PricingService) GetTenantSettings(ctx context.Context, tenantID uuid.UUID) (*domain.PricingSettings, error) {
	if tenantID == uuid.Nil {
		return nil, ValidationError("tenant inválido para precificação")
	}
	if s.repo == nil {
		return nil, errors.New("repositório não configurado para precificação")
	}
	if settings, ok := s.getSettingsFromCache(tenantID); ok {
		return settings, nil
	}

	settings, err := s.repo.GetPricingSettings(ctx, tenantID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			settings = defaultPricingSettings(tenantID)
			if err := s.repo.UpsertPricingSettings(ctx, settings); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	s.storeSettingsInCache(settings)
	return cloneSettings(settings), nil
}

// UpdateTenantSettings aplica alterações parciais nas configurações do tenant.
func (s *PricingService) UpdateTenantSettings(ctx context.Context, tenantID uuid.UUID, patch *PricingSettingsUpdate) (*domain.PricingSettings, error) {
	if tenantID == uuid.Nil {
		return nil, ValidationError("tenant inválido para precificação")
	}
	if patch == nil {
		return nil, ValidationError("nenhuma alteração informada")
	}
	settings, err := s.GetTenantSettings(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	updated := *settings

	if patch.LaborCostPerMinute != nil {
		if *patch.LaborCostPerMinute < 0 {
			return nil, ValidationError("custo de mão de obra não pode ser negativo")
		}
		updated.LaborCostPerMinute = *patch.LaborCostPerMinute
	}
	if patch.DefaultPackagingCost != nil {
		if *patch.DefaultPackagingCost < 0 {
			return nil, ValidationError("custo de embalagem não pode ser negativo")
		}
		updated.DefaultPackagingCost = *patch.DefaultPackagingCost
	}
	if patch.DefaultMarginPercent != nil {
		if *patch.DefaultMarginPercent < 0 {
			return nil, ValidationError("margem não pode ser negativa")
		}
		updated.DefaultMarginPercent = *patch.DefaultMarginPercent
	}
	if patch.FixedMonthlyCosts != nil {
		if *patch.FixedMonthlyCosts < 0 {
			return nil, ValidationError("custos fixos não podem ser negativos")
		}
		updated.FixedMonthlyCosts = *patch.FixedMonthlyCosts
	}
	if patch.VariableCostPercent != nil {
		if *patch.VariableCostPercent < 0 {
			return nil, ValidationError("custos variáveis não podem ser negativos")
		}
		updated.VariableCostPercent = *patch.VariableCostPercent
	}
	if patch.DefaultSalesVolume != nil {
		if *patch.DefaultSalesVolume < 0 {
			return nil, ValidationError("volume de vendas não pode ser negativo")
		}
		updated.DefaultSalesVolume = *patch.DefaultSalesVolume
	}

	updated.TenantID = tenantID
	updated.UpdatedAt = time.Now().UTC()

	if err := s.repo.UpsertPricingSettings(ctx, &updated); err != nil {
		return nil, err
	}
	s.storeSettingsInCache(&updated)
	return &updated, nil
}

func defaultPricingSettings(tenantID uuid.UUID) *domain.PricingSettings {
	now := time.Now().UTC()
	return &domain.PricingSettings{
		TenantID:             tenantID,
		LaborCostPerMinute:   pricing.DefaultLaborCostPerMinute,
		DefaultPackagingCost: pricing.DefaultPackagingCost,
		DefaultMarginPercent: pricing.DefaultMarginPercent,
		FixedMonthlyCosts:    0,
		VariableCostPercent:  0,
		DefaultSalesVolume:   0,
		CreatedAt:            now,
		UpdatedAt:            now,
	}
}

// CalculateRecipeCost retorna o custo consolidado de uma receita.
func (s *PricingService) CalculateRecipeCost(ctx context.Context, tenantID, recipeID uuid.UUID) (*domain.RecipeSummary, error) {
	if tenantID == uuid.Nil || recipeID == uuid.Nil {
		return nil, ValidationError("identificadores inválidos para cálculo de receita")
	}
	settings, err := s.GetTenantSettings(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	summary, _, err := s.getRecipeSummary(ctx, tenantID, recipeID, settings)
	return summary, err
}

func (s *PricingService) getRecipeSummary(ctx context.Context, tenantID, recipeID uuid.UUID, settings *domain.PricingSettings) (*domain.RecipeSummary, *recipeCostSnapshot, error) {
	snapshot, err := s.loadRecipeSnapshot(ctx, tenantID, recipeID)
	if err != nil {
		return nil, nil, err
	}
	summary := buildRecipeSummary(snapshot, settings)
	return summary, snapshot, nil
}

func buildRecipeSummary(snapshot *recipeCostSnapshot, settings *domain.PricingSettings) *domain.RecipeSummary {
	if snapshot == nil || settings == nil {
		return &domain.RecipeSummary{}
	}
	yield := snapshot.YieldQuantity
	if yield <= 0 {
		yield = 1
	}
	ingredientPerUnit := snapshot.IngredientCost / yield
	laborPerUnit := (float64(snapshot.ProductionTime) * settings.LaborCostPerMinute) / yield
	packagingPerUnit := settings.DefaultPackagingCost
	totalPerUnit := ingredientPerUnit + laborPerUnit + packagingPerUnit

	return &domain.RecipeSummary{
		IngredientCost: domain.RoundCurrency(ingredientPerUnit),
		LaborCost:      domain.RoundCurrency(laborPerUnit),
		PackagingCost:  domain.RoundCurrency(packagingPerUnit),
		TotalCost:      domain.RoundCurrency(totalPerUnit),
		CostPerUnit:    domain.RoundCurrency(totalPerUnit),
	}
}

func (s *PricingService) loadRecipeSnapshot(ctx context.Context, tenantID, recipeID uuid.UUID) (*recipeCostSnapshot, error) {
	if tenantID == uuid.Nil || recipeID == uuid.Nil {
		return nil, ValidationError("identificadores inválidos para cache de receita")
	}
	if s.repo == nil {
		return nil, errors.New("repositório não configurado para precificação")
	}

	if s.cache != nil {
		if data, err := s.cache.Get(ctx, s.recipeCacheKey(tenantID, recipeID)).Bytes(); err == nil {
			var snapshot recipeCostSnapshot
			if err := json.Unmarshal(data, &snapshot); err == nil {
				s.observeCacheEvent("hit")
				return &snapshot, nil
			}
		} else if !errors.Is(err, redis.Nil) {
			s.log.Warn().Err(err).Str("recipe_id", recipeID.String()).Msg("falha ao recuperar cache de receita")
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

	snapshot := &recipeCostSnapshot{
		IngredientCost: ingCost,
		ProductionTime: recipe.ProductionTime,
		YieldQuantity:  recipe.YieldQuantity,
	}

	if s.cache != nil {
		payload, err := json.Marshal(snapshot)
		if err == nil {
			if err := s.cache.Set(ctx, s.recipeCacheKey(tenantID, recipeID), payload, recipeSnapshotTTL).Err(); err != nil {
				s.log.Warn().Err(err).Str("recipe_id", recipeID.String()).Msg("falha ao salvar cache de receita")
			} else {
				s.observeCacheEvent("miss")
			}
		}
	}

	return snapshot, nil
}

// CalculateProductPrice define o preço sugerido considerando margem e impostos.
func (s *PricingService) CalculateProductPrice(ctx context.Context, tenantID uuid.UUID, product *domain.Product) (*domain.Product, error) {
	if product == nil {
		return nil, ValidationError("produto inválido para precificação")
	}
	if tenantID == uuid.Nil {
		return nil, ValidationError("tenant inválido para cálculo de produto")
	}
	settings, err := s.GetTenantSettings(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	summary, _, err := s.getRecipeSummary(ctx, tenantID, product.RecipeID, settings)
	if err != nil {
		return nil, err
	}

	baseCost := summary.CostPerUnit - summary.PackagingCost
	if baseCost < 0 {
		baseCost = 0
	}
	cost := baseCost + product.PackagingCost
	marginMultiplier := 1 + (product.MarginPercent / 100)
	priceBeforeTax := cost * marginMultiplier
	totalPrice := priceBeforeTax * (1 + product.TaxRate/100)

	product.BasePrice = domain.RoundCurrency(cost)
	product.SuggestedPrice = domain.RoundCurrency(totalPrice)
	product.PricingSummary = product.DerivePricingSummary()
	return product, nil
}

// CalculateProductPricing mantém compatibilidade com chamadas anteriores do serviço.
func (s *PricingService) CalculateProductPricing(ctx context.Context, tenantID uuid.UUID, product *domain.Product) (*domain.Product, error) {
	return s.CalculateProductPrice(ctx, tenantID, product)
}

type suggestionParams struct {
	MarginPercent       float64
	PackagingCost       float64
	FixedMonthlyCosts   float64
	VariableCostPercent float64
	LaborCostPerMinute  float64
	SalesVolumeMonthly  float64
	CurrentPrice        float64
}

// SuggestPrice calcula o preço sugerido com base nos parâmetros informados.
func (s *PricingService) SuggestPrice(ctx context.Context, input *domain.PricingSuggestionInput) (*domain.PricingSuggestion, error) {
	if input == nil {
		return nil, ValidationError("dados de precificação não informados")
	}
	if input.TenantID == uuid.Nil {
		return nil, ValidationError("tenant inválido")
	}
	if s.repo == nil {
		return nil, errors.New("repositório não configurado para precificação")
	}

	var product *domain.Product
	var err error
	if input.ProductID != nil {
		product, err = s.repo.GetProduct(ctx, input.TenantID, *input.ProductID)
		if err != nil {
			return nil, err
		}
		if input.RecipeID == uuid.Nil {
			input.RecipeID = product.RecipeID
		}
	}
	if input.RecipeID == uuid.Nil {
		return nil, ValidationError("é necessário informar uma receita para calcular os custos")
	}

	settings, err := s.GetTenantSettings(ctx, input.TenantID)
	if err != nil {
		return nil, err
	}
	_, snapshot, err := s.getRecipeSummary(ctx, input.TenantID, input.RecipeID, settings)
	if err != nil {
		return nil, err
	}

	params, err := s.resolveSuggestionParams(input, product, settings)
	if err != nil {
		return nil, err
	}

	yield := snapshot.YieldQuantity
	if yield <= 0 {
		yield = 1
	}
	ingredientPerUnit := snapshot.IngredientCost / yield
	laborPerUnit := (float64(snapshot.ProductionTime) * params.LaborCostPerMinute) / yield
	unitCost := ingredientPerUnit + laborPerUnit + params.PackagingCost

	salesVolume := params.SalesVolumeMonthly
	missingSalesVolume := salesVolume <= 0
	effectiveSalesVolume := salesVolume
	if effectiveSalesVolume <= 0 {
		effectiveSalesVolume = 1
	}
	if missingSalesVolume {
		s.log.Warn().Str("tenant_id", input.TenantID.String()).Msg("volume de vendas não informado; rateio fixo usando 1 unidade")
	}

	fixedCostPerUnit := 0.0
	if params.FixedMonthlyCosts > 0 {
		fixedCostPerUnit = params.FixedMonthlyCosts / effectiveSalesVolume
	}
	variableCostUnit := (unitCost + fixedCostPerUnit) * (params.VariableCostPercent / 100)
	totalCostPerUnit := unitCost + fixedCostPerUnit + variableCostUnit
	
	// Cálculo do preço sugerido com margem de lucro
	// Fórmula: Preço = Custo Total × (1 + Margem%)
	suggestedPrice := totalCostPerUnit * (1 + params.MarginPercent/100)
	
	// Ponto de equilíbrio: preço mínimo sem lucro
	breakEven := totalCostPerUnit
	
	// Margem de contribuição: diferença entre preço e custos variáveis
	// MCU = Preço - (Custo Unitário + Custos Variáveis)
	contributionMargin := suggestedPrice - (unitCost + variableCostUnit)
	contributionMarginPct := 0.0
	if suggestedPrice > 0 {
		contributionMarginPct = (contributionMargin / suggestedPrice) * 100
	}
	
	// Valor da margem de lucro
	marginValue := suggestedPrice - totalCostPerUnit
	
	// Markup: percentual de acréscimo sobre o custo
	markup := 0.0
	if totalCostPerUnit > 0 {
		markup = ((suggestedPrice - totalCostPerUnit) / totalCostPerUnit) * 100
	}
	
	// Delta vs preço atual
	deltaVsCurrent := suggestedPrice - params.CurrentPrice
	deltaPercent := 0.0
	if params.CurrentPrice > 0 {
		deltaPercent = (deltaVsCurrent / params.CurrentPrice) * 100
	}
	
	// Flags de alerta
	lowMargin := params.MarginPercent < pricing.MinimumSafeMargin
	belowBreakEven := params.CurrentPrice > 0 && params.CurrentPrice < breakEven
	highFixedCostImpact := false
	if suggestedPrice > 0 {
		fixedCostPct := (fixedCostPerUnit / suggestedPrice) * 100
		highFixedCostImpact = fixedCostPct > pricing.HighFixedCostThreshold
	}

	components := domain.PricingSuggestionComponents{
		IngredientCost:     domain.RoundCurrency(ingredientPerUnit),
		LaborCost:          domain.RoundCurrency(laborPerUnit),
		PackagingCost:      domain.RoundCurrency(params.PackagingCost),
		FixedCostPerUnit:   domain.RoundCurrency(fixedCostPerUnit),
		VariableCostUnit:   domain.RoundCurrency(variableCostUnit),
		SalesVolumeMonthly: salesVolume,
	}

	suggestion := &domain.PricingSuggestion{
		UnitCost:              domain.RoundCurrency(unitCost),
		FixedCostPerUnit:      domain.RoundCurrency(fixedCostPerUnit),
		VariableCostUnit:      domain.RoundCurrency(variableCostUnit),
		TotalCostPerUnit:      domain.RoundCurrency(totalCostPerUnit),
		SuggestedPrice:        domain.RoundCurrency(suggestedPrice),
		BreakEvenPrice:        domain.RoundCurrency(breakEven),
		ContributionMargin:    domain.RoundCurrency(contributionMargin),
		ContributionMarginPct: domain.RoundCurrency(contributionMarginPct),
		MarginValue:           domain.RoundCurrency(marginValue),
		MarginPercent:         params.MarginPercent,
		Markup:                domain.RoundCurrency(markup),
		CurrentPrice:          domain.RoundCurrency(params.CurrentPrice),
		DeltaVsCurrent:        domain.RoundCurrency(deltaVsCurrent),
		DeltaPercent:          domain.RoundCurrency(deltaPercent),
		Components:            components,
		Inputs: domain.PricingSuggestionInputs{
			MarginPercent:       params.MarginPercent,
			PackagingCost:       domain.RoundCurrency(params.PackagingCost),
			FixedMonthlyCosts:   domain.RoundCurrency(params.FixedMonthlyCosts),
			VariableCostPercent: params.VariableCostPercent,
			LaborCostPerMinute:  domain.RoundCurrency(params.LaborCostPerMinute),
			SalesVolumeMonthly:  params.SalesVolumeMonthly,
		},
		Flags: domain.PricingSuggestionFlags{
			MissingSalesVolume:  missingSalesVolume,
			LowMargin:           lowMargin,
			BelowBreakEven:      belowBreakEven,
			HighFixedCostImpact: highFixedCostImpact,
		},
	}

	s.observeSuggestionMetrics(input.ProductID != nil, !missingSalesVolume)
	return suggestion, nil
}

func (s *PricingService) observeCacheEvent(event string) {
	if s.metrics == nil || s.metrics.PricingCache == nil {
		return
	}
	s.metrics.PricingCache.WithLabelValues(event).Inc()
}

func (s *PricingService) observeSuggestionMetrics(fromProduct, hasSalesVolume bool) {
	if s.metrics == nil || s.metrics.PricingSuggestions == nil {
		return
	}
	source := "manual"
	if fromProduct {
		source = "product"
	}
	volume := "false"
	if hasSalesVolume {
		volume = "true"
	}
	s.metrics.PricingSuggestions.WithLabelValues(source, volume).Inc()
}

func (s *PricingService) resolveSuggestionParams(input *domain.PricingSuggestionInput, product *domain.Product, settings *domain.PricingSettings) (suggestionParams, error) {
	params := suggestionParams{
		MarginPercent:       settings.DefaultMarginPercent,
		PackagingCost:       settings.DefaultPackagingCost,
		FixedMonthlyCosts:   settings.FixedMonthlyCosts,
		VariableCostPercent: settings.VariableCostPercent,
		LaborCostPerMinute:  settings.LaborCostPerMinute,
		SalesVolumeMonthly:  settings.DefaultSalesVolume,
		CurrentPrice:        0,
	}

	if product != nil {
		params.MarginPercent = product.MarginPercent
		params.PackagingCost = product.PackagingCost
		if product.SuggestedPrice > 0 {
			params.CurrentPrice = product.SuggestedPrice
		}
	}

	if input.MarginPercent != nil {
		if *input.MarginPercent < 0 {
			return params, ValidationError("margem não pode ser negativa")
		}
		params.MarginPercent = *input.MarginPercent
	}
	if input.PackagingCost != nil {
		if *input.PackagingCost < 0 {
			return params, ValidationError("custo de embalagem não pode ser negativo")
		}
		params.PackagingCost = *input.PackagingCost
	}
	if input.FixedMonthlyCosts != nil {
		if *input.FixedMonthlyCosts < 0 {
			return params, ValidationError("custos fixos não podem ser negativos")
		}
		params.FixedMonthlyCosts = *input.FixedMonthlyCosts
	}
	if input.VariableCostPercent != nil {
		if *input.VariableCostPercent < 0 {
			return params, ValidationError("custos variáveis não podem ser negativos")
		}
		params.VariableCostPercent = *input.VariableCostPercent
	}
	if input.LaborCostPerMinute != nil {
		if *input.LaborCostPerMinute < 0 {
			return params, ValidationError("custo de mão de obra não pode ser negativo")
		}
		params.LaborCostPerMinute = *input.LaborCostPerMinute
	}
	if input.SalesVolumeMonthly != nil {
		if *input.SalesVolumeMonthly < 0 {
			return params, ValidationError("volume de vendas não pode ser negativo")
		}
		params.SalesVolumeMonthly = *input.SalesVolumeMonthly
	}
	if input.CurrentPrice != nil {
		if *input.CurrentPrice < 0 {
			return params, ValidationError("preço atual não pode ser negativo")
		}
		params.CurrentPrice = *input.CurrentPrice
	}

	return params, nil
}

// InvalidateRecipeCache remove informações armazenadas para uma receita específica.
func (s *PricingService) InvalidateRecipeCache(ctx context.Context, tenantID, recipeID uuid.UUID) {
	if s.cache == nil {
		return
	}
	if err := s.cache.Del(ctx, s.recipeCacheKey(tenantID, recipeID)).Err(); err != nil && !errors.Is(err, redis.Nil) {
		s.log.Debug().Err(err).Str("recipe_id", recipeID.String()).Msg("falha ao invalidar cache de receita")
	}
}
