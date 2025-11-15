package pricing

// Constantes de precificação padrão.
// Valores baseados em pesquisas do Sebrae e médias do mercado brasileiro.
const (
	// DefaultLaborCostPerMinute é o custo de mão de obra por minuto em R$.
	// Valor médio considerando salário mínimo + encargos / horas mensais.
	DefaultLaborCostPerMinute = 0.65

	// DefaultPackagingCost é o custo padrão de embalagem em R$.
	// Valor médio para embalagens simples de padaria/confeitaria.
	DefaultPackagingCost = 0.35

	// DefaultMarginPercent é a margem de lucro padrão em %.
	// Sebrae recomenda entre 20-40% para produtos alimentícios.
	DefaultMarginPercent = 30.0

	// MinimumSafeMargin é a margem mínima recomendada em %.
	// Abaixo deste valor, o negócio pode não ser sustentável.
	MinimumSafeMargin = 20.0

	// HighFixedCostThreshold é o limite percentual para alertar sobre custos fixos.
	// Quando custos fixos representam mais de 30% do preço, é importante revisar.
	HighFixedCostThreshold = 30.0
)

