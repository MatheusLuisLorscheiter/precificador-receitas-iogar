package domain

import "github.com/google/uuid"

// Product representa o item final comercializado.
type Product struct {
	ID              uuid.UUID              `json:"id"`
	TenantID        uuid.UUID              `json:"tenant_id"`
	Name            string                 `json:"name"`
	Description     string                 `json:"description"`
	SKU             string                 `json:"sku"`
	Barcode         string                 `json:"barcode"`
	RecipeID        uuid.UUID              `json:"recipe_id"`
	BasePrice       float64                `json:"base_price"`
	SuggestedPrice  float64                `json:"suggested_price"`
	MarginPercent   float64                `json:"margin_percent"`
	PackagingCost   float64                `json:"packaging_cost"`
	ImageObjectKey  string                 `json:"image_object_key"`
	ImageURL        string                 `json:"image_url,omitempty"`
	CategoryID      *uuid.UUID             `json:"category_id"`
	StockQuantity   float64                `json:"stock_quantity"`
	StockUnit       string                 `json:"stock_unit"`
	ReorderPoint    float64                `json:"reorder_point"`
	StorageLocation string                 `json:"storage_location"`
	Active          bool                   `json:"active"`
	PricingSummary  *ProductPricingSummary `json:"pricing_summary,omitempty"`
	Auditable
}

// ProductPricingSummary expõe dados derivados utilizados pela camada de apresentação.
type ProductPricingSummary struct {
	UnitCost              float64 `json:"unit_cost"`
	MarginValue           float64 `json:"margin_value"`
	BreakEvenPrice        float64 `json:"break_even_price"`
	ContributionMargin    float64 `json:"contribution_margin"`
	ContributionMarginPct float64 `json:"contribution_margin_pct"`
	Markup                float64 `json:"markup"`
	MarginPercent         float64 `json:"margin_percent"`
}

// DerivePricingSummary calcula métricas derivadas usando os campos atuais do produto.
func (p *Product) DerivePricingSummary() *ProductPricingSummary {
	if p == nil {
		return nil
	}

	unitCost := p.BasePrice
	if unitCost < 0 {
		unitCost = 0
	}

	sellingPrice := p.SuggestedPrice
	if sellingPrice < 0 {
		sellingPrice = 0
	}

	marginValue := sellingPrice - unitCost
	if marginValue < 0 {
		marginValue = 0
	}

	breakEven := unitCost
	contributionMargin := marginValue
	var contributionMarginPct float64
	if sellingPrice > 0 {
		contributionMarginPct = (contributionMargin / sellingPrice) * 100
	}

	var markup float64
	if unitCost > 0 {
		markup = ((sellingPrice - unitCost) / unitCost) * 100
	}

	return &ProductPricingSummary{
		UnitCost:              RoundCurrency(unitCost),
		MarginValue:           RoundCurrency(marginValue),
		BreakEvenPrice:        RoundCurrency(breakEven),
		ContributionMargin:    RoundCurrency(contributionMargin),
		ContributionMarginPct: RoundCurrency(contributionMarginPct),
		Markup:                RoundCurrency(markup),
		MarginPercent:         RoundCurrency(p.MarginPercent),
	}
}
