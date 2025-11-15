package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
)

// PricingHandler expõe endpoints relacionados a precificação direta.
type PricingHandler struct {
    service *service.PricingService
    logger  *zerolog.Logger
}

const (
    pricingUnauthorizedCode     = "PRECIFICACAO_AUTENTICACAO"
    pricingInvalidBodyMessage   = "Não foi possível interpretar o corpo da requisição."
    pricingMissingRecipeMessage = "Informe uma receita ou produto para simular o preço."
    pricingInvalidRecipeMessage = "O ID da receita é inválido."
    pricingInvalidProductMessage = "O ID do produto é inválido."
    pricingSettingsFetchError   = "Não foi possível carregar as configurações de precificação agora."
    pricingSettingsUpdateError  = "Não foi possível atualizar as configurações de precificação agora."
    pricingSuggestError         = "Não foi possível calcular o preço sugerido no momento."
)

// NewPricingHandler cria uma nova instância do handler de precificação.
func NewPricingHandler(service *service.PricingService, logger *zerolog.Logger) *PricingHandler {
    return &PricingHandler{
        service: service,
        logger:  logger,
    }
}

// GetSettings retorna as configurações atuais de precificação do tenant autenticado.
func (h *PricingHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
    claims := requestctx.GetClaims(r.Context())
    if claims == nil {
        httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(pricingUnauthorizedCode))
        return
    }

    settings, err := h.service.GetTenantSettings(r.Context(), claims.TenantID)
    if err != nil {
        if h.logger != nil {
            h.logger.Error().Err(err).Str("tenant_id", claims.TenantID.String()).Msg("failed to fetch pricing settings")
        }
        httputil.RespondError(w, http.StatusInternalServerError, pricingSettingsFetchError, httputil.WithErrorCode("PRECIFICACAO_CONFIG_LISTAR"))
        return
    }

    httputil.RespondJSON(w, http.StatusOK, settings)
}

// UpdateSettings aplica alterações parciais nas configurações de precificação.
func (h *PricingHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
    claims := requestctx.GetClaims(r.Context())
    if claims == nil {
        httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(pricingUnauthorizedCode))
        return
    }

    var payload service.PricingSettingsUpdate
    if err := httputil.DecodeJSON(w, r, &payload); err != nil {
        httputil.RespondError(w, http.StatusBadRequest, pricingInvalidBodyMessage, httputil.WithErrorCode("PRECIFICACAO_CONFIG_CORPO_INVALIDO"))
        return
    }

    updated, err := h.service.UpdateTenantSettings(r.Context(), claims.TenantID, &payload)
    if err != nil {
        if errors.Is(err, service.ErrValidation) {
            httputil.RespondError(w, http.StatusBadRequest, err.Error(), httputil.WithErrorCode("PRECIFICACAO_CONFIG_VALIDACAO"))
            return
        }

        if h.logger != nil {
            h.logger.Error().Err(err).Str("tenant_id", claims.TenantID.String()).Msg("failed to update pricing settings")
        }
        httputil.RespondError(w, http.StatusInternalServerError, pricingSettingsUpdateError, httputil.WithErrorCode("PRECIFICACAO_CONFIG_ATUALIZAR"))
        return
    }

    httputil.RespondJSON(w, http.StatusOK, updated)
}

// SuggestPriceRequest representa o payload aceito pelo endpoint de simulação.
type SuggestPriceRequest struct {
    ProductID          *string  `json:"product_id"`
    RecipeID           *string  `json:"recipe_id"`
    MarginPercent      *float64 `json:"margin_percent"`
    PackagingCost      *float64 `json:"packaging_cost"`
    FixedMonthlyCosts  *float64 `json:"fixed_monthly_costs"`
    VariableCostPercent *float64 `json:"variable_cost_percent"`
    LaborCostPerMinute *float64 `json:"labor_cost_per_minute"`
    SalesVolumeMonthly *float64 `json:"sales_volume_monthly"`
    CurrentPrice       *float64 `json:"current_price"`
    IncludeTax         bool     `json:"include_tax"`
    TaxRate            *float64 `json:"tax_rate"`
}

// Suggest calcula o preço sugerido considerando os parâmetros informados.
func (h *PricingHandler) Suggest(w http.ResponseWriter, r *http.Request) {
    claims := requestctx.GetClaims(r.Context())
    if claims == nil {
        httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(pricingUnauthorizedCode))
        return
    }

    var req SuggestPriceRequest
    if err := httputil.DecodeJSON(w, r, &req); err != nil {
        httputil.RespondError(w, http.StatusBadRequest, pricingInvalidBodyMessage, httputil.WithErrorCode("PRECIFICACAO_SIMULACAO_CORPO_INVALIDO"))
        return
    }

    productID, err := parseOptionalUUID(req.ProductID)
    if err != nil {
        httputil.RespondError(w, http.StatusBadRequest, pricingInvalidProductMessage, httputil.WithErrorCode("PRECIFICACAO_PRODUTO_INVALIDO"), httputil.WithFieldError("product_id", pricingInvalidProductMessage))
        return
    }

    recipeID, err := parseOptionalUUID(req.RecipeID)
    if err != nil {
        httputil.RespondError(w, http.StatusBadRequest, pricingInvalidRecipeMessage, httputil.WithErrorCode("PRECIFICACAO_RECEITA_INVALIDA"), httputil.WithFieldError("recipe_id", pricingInvalidRecipeMessage))
        return
    }

    if productID == uuid.Nil && recipeID == uuid.Nil {
        httputil.RespondError(
            w,
            http.StatusBadRequest,
            pricingMissingRecipeMessage,
            httputil.WithErrorCode("PRECIFICACAO_SIMULACAO_RECEITA_OBRIGATORIA"),
            httputil.WithFieldError("recipe_id", pricingMissingRecipeMessage),
        )
        return
    }

    input := &domain.PricingSuggestionInput{
        TenantID:   claims.TenantID,
        RecipeID:   recipeID,
        IncludeTax: req.IncludeTax,
    }

    if productID != uuid.Nil {
        pid := productID
        input.ProductID = &pid
    }
    input.MarginPercent = req.MarginPercent
    input.PackagingCost = req.PackagingCost
    input.FixedMonthlyCosts = req.FixedMonthlyCosts
    input.VariableCostPercent = req.VariableCostPercent
    input.LaborCostPerMinute = req.LaborCostPerMinute
    input.SalesVolumeMonthly = req.SalesVolumeMonthly
    input.CurrentPrice = req.CurrentPrice
    input.TaxRate = req.TaxRate

    suggestion, err := h.service.SuggestPrice(r.Context(), input)
    if err != nil {
        if errors.Is(err, service.ErrValidation) {
            httputil.RespondError(w, http.StatusBadRequest, err.Error(), httputil.WithErrorCode("PRECIFICACAO_SIMULACAO_VALIDACAO"))
            return
        }
        if h.logger != nil {
            h.logger.Error().Err(err).Str("tenant_id", claims.TenantID.String()).Msg("failed to suggest price")
        }
        httputil.RespondError(w, http.StatusInternalServerError, pricingSuggestError, httputil.WithErrorCode("PRECIFICACAO_SIMULACAO_FALHA"))
        return
    }

    httputil.RespondJSON(w, http.StatusOK, suggestion)
}

func parseOptionalUUID(value *string) (uuid.UUID, error) {
    if value == nil {
        return uuid.Nil, nil
    }
    trimmed := strings.TrimSpace(*value)
    if trimmed == "" {
        return uuid.Nil, nil
    }
    id, err := uuid.Parse(trimmed)
    if err != nil {
        return uuid.Nil, err
    }
    return id, nil
}
