# Plano de implementação — Precificação direta

## Objetivos resumidos
- Simplificar o fluxo de precificação do pequeno comerciante.
- Calcular o preço sugerido a partir de custos fixos, variáveis, ingredientes e mão de obra.
- Registrar configurações por tenant e fornecer um endpoint de simulação em tempo real.
- Manter impostos como opção avançada (off por padrão), mas preservar suporte atual.

## Mudanças em camadas

### Persistência
1. **Tabela `pricing_settings`** (1:1 com `tenants`):
   | Campo | Tipo | Observação |
   | --- | --- | --- |
   | `tenant_id` | `uuid PK` | FK `tenants.id` + `ON DELETE CASCADE` |
   | `labor_cost_per_minute` | `numeric(10,4)` | default `0.65` |
   | `default_packaging_cost` | `numeric(10,4)` | fallback quando produto não informar |
   | `default_margin_percent` | `numeric(5,2)` | usado em novos produtos e sugestões |
   | `fixed_monthly_costs` | `numeric(14,2)` | soma mensal de custos fixos |
   | `variable_cost_percent` | `numeric(5,2)` | % aplicada sobre a receita |
   | `default_tax_rate` | `numeric(5,2)` | apenas para quem quiser ver impostos |
   | `default_sales_volume` | `numeric(14,2)` | unidades/mês para rateio padrão |
   | timestamps | `timestamptz` |

2. **Seed automático**: `INSERT ... ON CONFLICT` garantindo registro default ao criar tenant (feito via serviço ao acessar a primeira vez).

3. **Repositório** (`internal/repository/pricing_settings.go`):
   - `GetPricingSettings(ctx, tenantID)`
   - `UpsertPricingSettings(ctx, settings)`

### Domínio
- Novo arquivo `internal/domain/pricing.go` com:
  - `PricingSettings` + `ApplyDefaults()`
  - `PricingSuggestionInput` (overrides vindos do request)
  - `PricingSuggestion` (unit cost, fixed allocation, variable cost, margin, break-even, delta vs preço atual, flags de alerta)
  - Helpers `ContributionMargin` etc.

### Service layer
- `PricingService` agora recebe cache e `settingsRepo`.
- Métodos principais:
  1. `GetTenantSettings(ctx, tenantID)` com cache de 5 min (local + Redis opcional).
  2. `CalculateRecipeCost(ctx, tenantID, recipeID, opts)` onde `opts` permite informar custo de mão de obra / embalagem dinâmicos. Cache continua guardando apenas o custo dos ingredientes e a duração da receita para reaproveitar.
  3. `SuggestPrice(ctx, tenantID, input)` retornando `PricingSuggestion` com fórmulas:
     - `ingredient_cost` = soma dos ingredientes * (1 + waste).
     - `labor_cost` = `production_time_minutes * labor_cost_per_minute`.
     - `packaging_cost` = override do request -> senão produto -> senão default tenant.
     - `unit_cost` = `(ingredient + labor + packaging) / yield`.
     - `fixed_cost_per_unit` = `fixed_monthly_costs / max(1, sales_volume_monthly)`.
     - `variable_cost_unit` = `(unit_cost + fixed_cost_per_unit) * (variable_cost_percent/100)`.
     - `pre_margin_cost` = `unit_cost + fixed_cost_per_unit + variable_cost_unit`.
     - `target_margin` = `margin_percent` (produto -> override -> tenant default).
     - `price_before_tax` = `pre_margin_cost * (1 + margin/100)`.
     - `tax_value` = `include_tax ? price_before_tax * (tax_rate/100) : 0`.
     - `suggested_price` = `price_before_tax + tax_value`.
     - `break_even_price` = `pre_margin_cost + tax_value`.
     - `delta_vs_current` = `suggested_price - current_price` (se informado).
     - Flags: `missing_sales_volume` quando divisor <= 0.

### Handlers / Rotas
1. **`PricingHandler`** (`internal/http/handlers/pricing_handler.go`):
   - `GET /api/v1/pricing/settings`
   - `PUT /api/v1/pricing/settings`
   - `POST /api/v1/pricing/suggest`

2. **Request bodies**:
   - Settings: campos opcionais; `PUT` faz merge.
   - Suggestion:
     ```json
     {
       "recipe_id": "uuid", // obrigatório se product_id não vier
       "product_id": "uuid", // opcional
       "margin_percent": 35,
       "packaging_cost": 0.4,
       "fixed_monthly_costs": 2500,
       "variable_cost_percent": 7,
       "labor_cost_per_minute": 0.72,
       "sales_volume_monthly": 1800,
       "current_price": 12.5,
       "include_tax": false,
       "tax_rate": 8
     }
     ```

3. **Responses** deixam claro cada componente e incluem textos amigáveis para o frontend.

### Frontend (React + Vite)
- Nova store slice `pricingSettings` (zustand) para cache local.
- Tela de produto:
  - Formulário simplificado: embalagem, margem (slider), preço atual, toggle "Mostrar impostos" (default off) que revela `tax_rate`.
  - Seção "Custos do negócio" (drawer/modal) para informar custos fixos + variáveis + volume.
  - Preview em tempo real: chama `POST /pricing/suggest` com debounce a cada 400 ms, atualiza cards "Custo unitário", "Rateio fixo", "Custos variáveis", "Margem", "Preço sugerido" e `Δ vs preço atual`.
  - Botão "Salvar preço" envia `suggested_price` aceito para `productsAPI.update`.

### Documentação & Observabilidade
- Atualizar `backend/README.md` com fórmulas (incluindo referências Sebrae & Investopedia).
- Métrica Prometheus: `PricingSuggestionsTotal` com labels `source=manual|product`, `has_sales_volume=true|false`.
- Logs: avisos quando divisor de custos fixos ausente.

### Testes
- Unit tests para `PricingService.SuggestPrice` cobrindo:
  - Sem volume -> flag.
  - Overrides de margem, embalagem, impostos.
  - Produto existente vs input manual.
- Handler tests (httptest) garantindo validação e payloads.

---
Este plano cobre o MVP solicitado; próximos passos opcionais incluem importação automática IBPT (API) e índices SGS para reajustes periódicos.
