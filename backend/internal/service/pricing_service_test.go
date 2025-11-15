package service

import (
	"context"
	"io"
	"testing"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

func TestPricingServiceSuggestPrice(t *testing.T) {
    tenantID := uuid.New()
    recipeID := uuid.New()
    productID := uuid.New()
    ingredientA := uuid.New()
    ingredientB := uuid.New()

    repo := &stubPricingRepo{
        settings: map[uuid.UUID]*domain.PricingSettings{
            tenantID: {
                TenantID:             tenantID,
                LaborCostPerMinute:   0.65,
                DefaultPackagingCost: 0.4,
                DefaultMarginPercent: 35,
                FixedMonthlyCosts:    0,
                VariableCostPercent:  5,
                DefaultTaxRate:       8,
                DefaultSalesVolume:   0,
            },
        },
        recipes: map[uuid.UUID]*domain.Recipe{
            recipeID: {
                ID:             recipeID,
                TenantID:       tenantID,
                Name:           "Bolo de teste",
                YieldQuantity:  14,
                YieldUnit:      "un",
                ProductionTime: 70,
                Items: []domain.RecipeItem{
                    {
                        ID:           uuid.New(),
                        TenantID:     tenantID,
                        RecipeID:     recipeID,
                        IngredientID: ingredientA,
                        Quantity:     4,
                        WasteFactor:  0.1,
                    },
                    {
                        ID:           uuid.New(),
                        TenantID:     tenantID,
                        RecipeID:     recipeID,
                        IngredientID: ingredientB,
                        Quantity:     10,
                        WasteFactor:  0,
                    },
                },
            },
        },
        ingredients: map[uuid.UUID]*domain.Ingredient{
            ingredientA: {ID: ingredientA, TenantID: tenantID, CostPerUnit: 5},
            ingredientB: {ID: ingredientB, TenantID: tenantID, CostPerUnit: 2},
        },
        products: map[uuid.UUID]*domain.Product{
            productID: {
                ID:             productID,
                TenantID:       tenantID,
                RecipeID:       recipeID,
                MarginPercent:  25,
                PackagingCost:  0.3,
                TaxRate:        10,
                SuggestedPrice: 12,
            },
        },
    }

    svc := NewPricingService(repo, nil, nil, zerolog.New(io.Discard))
    ctx := context.Background()

    t.Run("flags when sales volume missing", func(t *testing.T) {
        input := &domain.PricingSuggestionInput{
            TenantID:            tenantID,
            RecipeID:            recipeID,
            IncludeTax:          false,
            MarginPercent:       floatPtr(30),
            PackagingCost:       floatPtr(0.4),
            VariableCostPercent: floatPtr(5),
            LaborCostPerMinute:  floatPtr(0.5),
            CurrentPrice:        floatPtr(7),
        }

        suggestion, err := svc.SuggestPrice(ctx, input)
        if err != nil {
            t.Fatalf("SuggestPrice returned error: %v", err)
        }

        assertFloatEquals(t, 5.9, suggestion.UnitCost)
        assertFloatEquals(t, 0, suggestion.FixedCostPerUnit)
        assertFloatEquals(t, 0.3, suggestion.VariableCostUnit)
        assertFloatEquals(t, 8.05, suggestion.PriceBeforeTax)
        assertFloatEquals(t, 0, suggestion.TaxValue)
        assertFloatEquals(t, 8.05, suggestion.SuggestedPrice)
        assertFloatEquals(t, 6.2, suggestion.BreakEvenPrice)
        assertFloatEquals(t, 1.86, suggestion.MarginValue)
        assertFloatEquals(t, 1.05, suggestion.DeltaVsCurrent)
        if !suggestion.Flags.MissingSalesVolume {
            t.Fatalf("expected MissingSalesVolume flag to be true")
        }
        if suggestion.Components.SalesVolumeMonthly != 0 {
            t.Fatalf("expected sales volume component to be 0, got %v", suggestion.Components.SalesVolumeMonthly)
        }
    })

    t.Run("overrides from product and request", func(t *testing.T) {
        prodID := productID
        input := &domain.PricingSuggestionInput{
            TenantID:            tenantID,
            RecipeID:            recipeID,
            ProductID:           &prodID,
            IncludeTax:          true,
            MarginPercent:       floatPtr(40),
            PackagingCost:       floatPtr(1.2),
            FixedMonthlyCosts:   floatPtr(1000),
            VariableCostPercent: floatPtr(12),
            LaborCostPerMinute:  floatPtr(0.8),
            SalesVolumeMonthly:  floatPtr(500),
            CurrentPrice:        floatPtr(17),
            TaxRate:             floatPtr(15),
        }

        suggestion, err := svc.SuggestPrice(ctx, input)
        if err != nil {
            t.Fatalf("SuggestPrice returned error: %v", err)
        }

        if suggestion.Flags.MissingSalesVolume {
            t.Fatalf("expected MissingSalesVolume flag to be false")
        }
        assertFloatEquals(t, 8.2, suggestion.UnitCost)
        assertFloatEquals(t, 2, suggestion.FixedCostPerUnit)
        assertFloatEquals(t, 1.22, suggestion.VariableCostUnit)
        assertFloatEquals(t, 15.99, suggestion.PriceBeforeTax)
        assertFloatEquals(t, 2.4, suggestion.TaxValue)
        assertFloatEquals(t, 18.39, suggestion.SuggestedPrice)
        assertFloatEquals(t, 13.82, suggestion.BreakEvenPrice)
        assertFloatEquals(t, 4.57, suggestion.MarginValue)
        assertFloatEquals(t, 1.39, suggestion.DeltaVsCurrent)
        if suggestion.Components.SalesVolumeMonthly != 500 {
            t.Fatalf("expected sales volume component to be 500, got %v", suggestion.Components.SalesVolumeMonthly)
        }
        if suggestion.Inputs.TaxRate != 15 {
            t.Fatalf("expected input tax rate to be 15, got %v", suggestion.Inputs.TaxRate)
        }
    })
}

func floatPtr(val float64) *float64 {
    v := val
    return &v
}

func assertFloatEquals(t *testing.T, expected, actual float64) {
    t.Helper()
    const epsilon = 0.01
    diff := expected - actual
    if diff < 0 {
        diff = -diff
    }
    if diff > epsilon {
        t.Fatalf("expected %.2f, got %.2f", expected, actual)
    }
}

type stubPricingRepo struct {
    settings    map[uuid.UUID]*domain.PricingSettings
    recipes     map[uuid.UUID]*domain.Recipe
    ingredients map[uuid.UUID]*domain.Ingredient
    products    map[uuid.UUID]*domain.Product
}

func (s *stubPricingRepo) GetPricingSettings(_ context.Context, tenantID uuid.UUID) (*domain.PricingSettings, error) {
    settings, ok := s.settings[tenantID]
    if !ok {
        return nil, repository.ErrNotFound
    }
    cp := *settings
    return &cp, nil
}

func (s *stubPricingRepo) UpsertPricingSettings(_ context.Context, settings *domain.PricingSettings) error {
    s.settings[settings.TenantID] = settings
    return nil
}

func (s *stubPricingRepo) GetRecipe(_ context.Context, _ uuid.UUID, recipeID uuid.UUID) (*domain.Recipe, error) {
    recipe, ok := s.recipes[recipeID]
    if !ok {
        return nil, repository.ErrNotFound
    }
    cp := *recipe
    cp.Items = append([]domain.RecipeItem(nil), recipe.Items...)
    return &cp, nil
}

func (s *stubPricingRepo) GetIngredient(_ context.Context, _ uuid.UUID, ingredientID uuid.UUID) (*domain.Ingredient, error) {
    ingredient, ok := s.ingredients[ingredientID]
    if !ok {
        return nil, repository.ErrNotFound
    }
    cp := *ingredient
    return &cp, nil
}

func (s *stubPricingRepo) GetProduct(_ context.Context, _ uuid.UUID, productID uuid.UUID) (*domain.Product, error) {
    product, ok := s.products[productID]
    if !ok {
        return nil, repository.ErrNotFound
    }
    cp := *product
    return &cp, nil
}
