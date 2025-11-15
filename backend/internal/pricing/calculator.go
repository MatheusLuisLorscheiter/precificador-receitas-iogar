package pricing

import "math"

// Calculator concentra funções de cálculo de precificação.
type Calculator struct{}

// NewCalculator cria uma nova instância do calculador.
func NewCalculator() *Calculator {
	return &Calculator{}
}

// CalculateTotalWithMargin aplica margem percentual sobre o custo base.
func (c *Calculator) CalculateTotalWithMargin(baseCost, marginPercent float64) float64 {
	return roundCurrency(baseCost * (1 + marginPercent/100))
}

// CalculatePriceWithTax aplica taxa de imposto sobre o preço.
func (c *Calculator) CalculatePriceWithTax(price, taxPercent float64) float64 {
	return roundCurrency(price * (1 + taxPercent/100))
}

// CalculateCostPerUnit divide o custo total pela quantidade produzida.
func (c *Calculator) CalculateCostPerUnit(totalCost, quantity float64) float64 {
	if quantity <= 0 {
		return 0
	}
	return roundCurrency(totalCost / quantity)
}

// ApplyWasteFactor calcula quantidade considerando desperdício.
func (c *Calculator) ApplyWasteFactor(quantity, wasteFactor float64) float64 {
	return quantity * (1 + wasteFactor)
}

// roundCurrency arredonda valor para 2 casas decimais.
func roundCurrency(value float64) float64 {
	return math.Round(value*100) / 100
}
