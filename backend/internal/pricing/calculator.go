package pricing

import "math"

// Calculator concentra funções de cálculo de precificação.
// Baseado em metodologias do Sebrae e Investopedia para formação de preços.
type Calculator struct{}

// NewCalculator cria uma nova instância do calculador.
func NewCalculator() *Calculator {
	return &Calculator{}
}

// CalculateTotalWithMargin aplica margem percentual sobre o custo base.
// Fórmula: Preço = Custo × (1 + Margem%)
func (c *Calculator) CalculateTotalWithMargin(baseCost, marginPercent float64) float64 {
	return roundCurrency(baseCost * (1 + marginPercent/100))
}

// CalculateMarkup calcula o markup sobre o custo.
// Markup = (Preço - Custo) / Custo × 100
func (c *Calculator) CalculateMarkup(price, cost float64) float64 {
	if cost <= 0 {
		return 0
	}
	return roundCurrency(((price - cost) / cost) * 100)
}

// CalculateContributionMargin calcula a margem de contribuição unitária.
// Margem de Contribuição = Preço de Venda - Custos Variáveis
// Fonte: Sebrae - Custos fixos e variáveis
func (c *Calculator) CalculateContributionMargin(price, variableCosts float64) float64 {
	return roundCurrency(price - variableCosts)
}

// CalculateContributionMarginPercent calcula o percentual da margem de contribuição.
// MCU% = (Margem de Contribuição / Preço de Venda) × 100
func (c *Calculator) CalculateContributionMarginPercent(contributionMargin, price float64) float64 {
	if price <= 0 {
		return 0
	}
	return roundCurrency((contributionMargin / price) * 100)
}

// CalculateBreakEvenPrice calcula o ponto de equilíbrio (preço mínimo sem lucro).
// Ponto de Equilíbrio = Custos Totais (sem margem de lucro)
func (c *Calculator) CalculateBreakEvenPrice(totalCost float64) float64 {
	return roundCurrency(totalCost)
}

// AllocateFixedCosts rateia custos fixos mensais pelo volume de vendas.
// Custo Fixo Unitário = Custos Fixos Mensais / Volume de Vendas Mensal
// Fonte: Sebrae - Como calcular preço de venda
func (c *Calculator) AllocateFixedCosts(fixedMonthlyCosts, salesVolumeMonthly float64) float64 {
	if salesVolumeMonthly <= 0 {
		return 0
	}
	return roundCurrency(fixedMonthlyCosts / salesVolumeMonthly)
}

// CalculateVariableCosts calcula custos variáveis como percentual.
// Custos Variáveis = (Custo Base + Custo Fixo Unitário) × Percentual Variável
func (c *Calculator) CalculateVariableCosts(baseCost, fixedCostPerUnit, variablePercent float64) float64 {
	return roundCurrency((baseCost + fixedCostPerUnit) * (variablePercent / 100))
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
