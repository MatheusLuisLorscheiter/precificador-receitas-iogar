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
	TaxRate         float64                `json:"tax_rate"`
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
	UnitCost       float64 `json:"unit_cost"`
	MarginValue    float64 `json:"margin_value"`
	TaxValue       float64 `json:"tax_value"`
	ProfitPerUnit  float64 `json:"profit_per_unit"`
	BreakEvenPrice float64 `json:"break_even_price"`
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

	priceBeforeTax := p.SuggestedPrice
	if p.TaxRate > 0 {
		denominator := 1 + (p.TaxRate / 100)
		if denominator != 0 {
			priceBeforeTax = p.SuggestedPrice / denominator
		}
	}

	marginValue := priceBeforeTax - unitCost
	if marginValue < 0 {
		marginValue = 0
	}

	taxValue := p.SuggestedPrice - priceBeforeTax
	if taxValue < 0 {
		taxValue = 0
	}

	breakEven := unitCost + taxValue

	return &ProductPricingSummary{
		UnitCost:       RoundCurrency(unitCost),
		MarginValue:    RoundCurrency(marginValue),
		TaxValue:       RoundCurrency(taxValue),
		ProfitPerUnit:  RoundCurrency(marginValue),
		BreakEvenPrice: RoundCurrency(breakEven),
	}
}
