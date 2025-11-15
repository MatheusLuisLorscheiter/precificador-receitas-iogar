package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// IngredientHandler gerencia endpoints de ingredientes.
type IngredientHandler struct {
	service *service.IngredientService
	logger  *zerolog.Logger
}

const (
	ingredientInvalidRequestBodyMessage = "Não foi possível interpretar o corpo da requisição."
	ingredientNameRequiredMessage       = "O nome do ingrediente é obrigatório."
	ingredientUnitRequiredMessage       = "Informe a unidade padrão do ingrediente."
	ingredientCostPositiveMessage       = "O custo unitário deve ser zero ou positivo."
	ingredientIdRequiredMessage         = "Informe o ID do ingrediente."
	ingredientInvalidIDMessage          = "O ID do ingrediente é inválido."
	ingredientNotFoundMessage           = "Ingrediente não encontrado."
	ingredientCreateFailedMessage       = "Não foi possível criar o ingrediente agora."
	ingredientListFailedMessage         = "Não foi possível listar os ingredientes no momento."
	ingredientUpdateFailedMessage       = "Não foi possível atualizar o ingrediente agora."
	ingredientDeleteFailedMessage       = "Não foi possível remover o ingrediente no momento."
	ingredientDeletedSuccessMessage     = "Ingrediente removido com sucesso."
)

// NewIngredientHandler cria uma nova instância do handler de ingredientes.
func NewIngredientHandler(service *service.IngredientService, logger *zerolog.Logger) *IngredientHandler {
	return &IngredientHandler{
		service: service,
		logger:  logger,
	}
}

// CreateIngredientRequest representa a requisição de criação de ingrediente.
type CreateIngredientRequest struct {
	Name          string  `json:"name"`
	Unit          string  `json:"unit"`
	CostPerUnit   float64 `json:"cost_per_unit"`
	Supplier      string  `json:"supplier"`
	LeadTimeDays  int     `json:"lead_time_days"`
	MinStockLevel float64 `json:"min_stock_level"`
	Notes         string  `json:"notes"`
}

// UpdateIngredientRequest representa a requisição de atualização de ingrediente.
type UpdateIngredientRequest struct {
	Name          *string  `json:"name,omitempty"`
	Unit          *string  `json:"unit,omitempty"`
	CostPerUnit   *float64 `json:"cost_per_unit,omitempty"`
	Supplier      *string  `json:"supplier,omitempty"`
	LeadTimeDays  *int     `json:"lead_time_days,omitempty"`
	MinStockLevel *float64 `json:"min_stock_level,omitempty"`
	Notes         *string  `json:"notes,omitempty"`
}

// Create cria um novo ingrediente.
func (h *IngredientHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("INGREDIENTE_AUTENTICACAO"))
		return
	}

	var req CreateIngredientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, ingredientInvalidRequestBodyMessage, httputil.WithErrorCode("INGREDIENTE_CORPO_INVALIDO"))
		return
	}

	// Validações
	if req.Name == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			ingredientNameRequiredMessage,
			httputil.WithErrorCode("INGREDIENTE_NOME_OBRIGATORIO"),
			httputil.WithFieldError("name", ingredientNameRequiredMessage),
		)
		return
	}
	if req.Unit == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			ingredientUnitRequiredMessage,
			httputil.WithErrorCode("INGREDIENTE_UNIDADE_OBRIGATORIA"),
			httputil.WithFieldError("unit", ingredientUnitRequiredMessage),
		)
		return
	}
	if req.CostPerUnit < 0 {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			ingredientCostPositiveMessage,
			httputil.WithErrorCode("INGREDIENTE_CUSTO_POSITIVO"),
			httputil.WithFieldError("cost_per_unit", ingredientCostPositiveMessage),
		)
		return
	}

	ingredient := &domain.Ingredient{
		TenantID:      claims.TenantID,
		Name:          req.Name,
		Unit:          req.Unit,
		CostPerUnit:   req.CostPerUnit,
		Supplier:      req.Supplier,
		LeadTimeDays:  req.LeadTimeDays,
		MinStockLevel: req.MinStockLevel,
		Notes:         req.Notes,
	}

	ctx := r.Context()
	if err := h.service.Create(ctx, ingredient); err != nil {
		h.logger.Error().Err(err).Msg("failed to create ingredient")
		httputil.RespondError(w, http.StatusInternalServerError, ingredientCreateFailedMessage, httputil.WithErrorCode("INGREDIENTE_CRIAR_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusCreated, ingredient)
}

// GetByID retorna um ingrediente por ID.
func (h *IngredientHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("INGREDIENTE_AUTENTICACAO"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(w, http.StatusBadRequest, ingredientIdRequiredMessage, httputil.WithErrorCode("INGREDIENTE_ID_OBRIGATORIO"), httputil.WithFieldError("id", ingredientIdRequiredMessage))
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, ingredientInvalidIDMessage, httputil.WithErrorCode("INGREDIENTE_ID_INVALIDO"), httputil.WithFieldError("id", ingredientInvalidIDMessage))
		return
	}

	ctx := r.Context()
	ingredient, err := h.service.GetByID(ctx, claims.TenantID, id)
	if err != nil {
		httputil.RespondError(w, http.StatusNotFound, ingredientNotFoundMessage, httputil.WithErrorCode("INGREDIENTE_NAO_ENCONTRADO"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, ingredient)
}

// List retorna todos os ingredientes do tenant.
func (h *IngredientHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("INGREDIENTE_AUTENTICACAO"))
		return
	}

	ctx := r.Context()
	opts := &service.IngredientListOptions{}
	query := r.URL.Query()
	if search := strings.TrimSpace(query.Get("search")); search != "" {
		opts.Search = search
	}
	if supplier := strings.TrimSpace(query.Get("supplier")); supplier != "" {
		opts.Supplier = supplier
	}
	if unit := strings.TrimSpace(query.Get("unit")); unit != "" {
		opts.Unit = unit
	}
	if stock := strings.TrimSpace(query.Get("stock_status")); stock != "" {
		opts.StockStatus = service.StockStatus(stock)
	}
	if categoryID := strings.TrimSpace(query.Get("category_id")); categoryID != "" {
		if id, err := uuid.Parse(categoryID); err == nil {
			opts.CategoryID = &id
		}
	}

	ingredients, err := h.service.List(ctx, claims.TenantID, opts)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to list ingredients")
		httputil.RespondError(w, http.StatusInternalServerError, ingredientListFailedMessage, httputil.WithErrorCode("INGREDIENTE_LISTAR_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, ingredients)
}

type bulkDeleteRequest struct {
	IDs []uuid.UUID `json:"ids"`
}

// BulkDelete remove múltiplos ingredientes.
func (h *IngredientHandler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("INGREDIENTE_AUTENTICACAO"))
		return
	}

	var req bulkDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, ingredientInvalidRequestBodyMessage, httputil.WithErrorCode("INGREDIENTE_CORPO_INVALIDO"))
		return
	}

	if len(req.IDs) == 0 {
		httputil.RespondError(w, http.StatusBadRequest, "Informe ao menos um ingrediente para exclusão.", httputil.WithErrorCode("INGREDIENTE_IDS_OBRIGATORIOS"))
		return
	}

	if err := h.service.BulkDelete(r.Context(), claims.TenantID, req.IDs); err != nil {
		h.logger.Error().Err(err).Msg("failed to bulk delete ingredients")
		httputil.RespondError(w, http.StatusInternalServerError, ingredientDeleteFailedMessage, httputil.WithErrorCode("INGREDIENTE_REMOVER_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": ingredientDeletedSuccessMessage})
}

// Update atualiza um ingrediente existente.
func (h *IngredientHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("INGREDIENTE_AUTENTICACAO"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(w, http.StatusBadRequest, ingredientIdRequiredMessage, httputil.WithErrorCode("INGREDIENTE_ID_OBRIGATORIO"), httputil.WithFieldError("id", ingredientIdRequiredMessage))
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, ingredientInvalidIDMessage, httputil.WithErrorCode("INGREDIENTE_ID_INVALIDO"), httputil.WithFieldError("id", ingredientInvalidIDMessage))
		return
	}

	var req UpdateIngredientRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, ingredientInvalidRequestBodyMessage, httputil.WithErrorCode("INGREDIENTE_CORPO_INVALIDO"))
		return
	}

	ctx := r.Context()

	// Buscar ingrediente existente
	ingredient, err := h.service.GetByID(ctx, claims.TenantID, id)
	if err != nil {
		httputil.RespondError(w, http.StatusNotFound, ingredientNotFoundMessage, httputil.WithErrorCode("INGREDIENTE_NAO_ENCONTRADO"))
		return
	}

	// Atualizar campos
	if req.Name != nil {
		ingredient.Name = *req.Name
	}
	if req.Unit != nil {
		ingredient.Unit = *req.Unit
	}
	if req.CostPerUnit != nil {
		if *req.CostPerUnit < 0 {
			httputil.RespondError(w, http.StatusBadRequest, ingredientCostPositiveMessage, httputil.WithErrorCode("INGREDIENTE_CUSTO_POSITIVO"), httputil.WithFieldError("cost_per_unit", ingredientCostPositiveMessage))
			return
		}
		ingredient.CostPerUnit = *req.CostPerUnit
	}
	if req.Supplier != nil {
		ingredient.Supplier = *req.Supplier
	}
	if req.LeadTimeDays != nil {
		ingredient.LeadTimeDays = *req.LeadTimeDays
	}
	if req.MinStockLevel != nil {
		ingredient.MinStockLevel = *req.MinStockLevel
	}
	if req.Notes != nil {
		ingredient.Notes = *req.Notes
	}

	if err := h.service.Update(ctx, ingredient); err != nil {
		h.logger.Error().Err(err).Msg("failed to update ingredient")
		httputil.RespondError(w, http.StatusInternalServerError, ingredientUpdateFailedMessage, httputil.WithErrorCode("INGREDIENTE_ATUALIZAR_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, ingredient)
}

// Delete remove um ingrediente (soft delete).
func (h *IngredientHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("INGREDIENTE_AUTENTICACAO"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(w, http.StatusBadRequest, ingredientIdRequiredMessage, httputil.WithErrorCode("INGREDIENTE_ID_OBRIGATORIO"), httputil.WithFieldError("id", ingredientIdRequiredMessage))
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, ingredientInvalidIDMessage, httputil.WithErrorCode("INGREDIENTE_ID_INVALIDO"), httputil.WithFieldError("id", ingredientInvalidIDMessage))
		return
	}

	ctx := r.Context()
	if err := h.service.Delete(ctx, claims.TenantID, id); err != nil {
		h.logger.Error().Err(err).Msg("failed to delete ingredient")
		httputil.RespondError(w, http.StatusInternalServerError, ingredientDeleteFailedMessage, httputil.WithErrorCode("INGREDIENTE_REMOVER_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": ingredientDeletedSuccessMessage})
}
