package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// RecipeHandler gerencia endpoints de receitas.
type RecipeHandler struct {
	service        *service.RecipeService
	pricingService *service.PricingService
	logger         *zerolog.Logger
}

const (
	recipeInvalidRequestBodyMessage   = "Não foi possível interpretar o corpo da requisição."
	recipeNameRequiredMessage         = "O nome da receita é obrigatório."
	recipeYieldQuantityPositive       = "A quantidade produzida deve ser maior que zero."
	recipeYieldUnitRequiredMessage    = "Informe a unidade de rendimento da receita."
	recipeUnauthorizedCode            = "RECEITA_AUTENTICACAO"
	recipeIdRequiredMessage           = "Informe o ID da receita."
	recipeInvalidIDMessage            = "O ID da receita é inválido."
	recipeNotFoundMessage             = "Receita não encontrada."
	recipeCreateFailedMessage         = "Não foi possível criar a receita agora."
	recipeListFailedMessage           = "Não foi possível listar as receitas no momento."
	recipeUpdateFailedMessage         = "Não foi possível atualizar a receita agora."
	recipeDeleteFailedMessage         = "Não foi possível remover a receita no momento."
	recipeDeletedSuccessMessage       = "Receita removida com sucesso."
	recipeItemQuantityPositiveMessage = "A quantidade do ingrediente deve ser maior que zero."
	recipeItemAddFailedMessage        = "Não foi possível adicionar o ingrediente à receita."
	recipeItemRemoveFailedMessage     = "Não foi possível remover o ingrediente da receita."
	recipeItemRemovedSuccessMessage   = "Ingrediente removido da receita com sucesso."
	recipeItemAddSuccessMessage       = "Ingrediente adicionado à receita com sucesso."
	recipeItemIdInvalidMessage        = "O ID do ingrediente da receita é inválido."
	recipeItemIdRequiredMessage       = "Informe o ID do ingrediente da receita."
	recipeItemIdsRequiredMessage      = "Informe o ID da receita e do item."
)

// NewRecipeHandler cria uma nova instância do handler de receitas.
func NewRecipeHandler(
	service *service.RecipeService,
	pricingService *service.PricingService,
	logger *zerolog.Logger,
) *RecipeHandler {
	return &RecipeHandler{
		service:        service,
		pricingService: pricingService,
		logger:         logger,
	}
}

// CreateRecipeRequest representa a requisição de criação de receita.
type CreateRecipeRequest struct {
	Name           string                    `json:"name"`
	Description    string                    `json:"description"`
	YieldQuantity  float64                   `json:"yield_quantity"`
	YieldUnit      string                    `json:"yield_unit"`
	ProductionTime int                       `json:"production_time"`
	Notes          string                    `json:"notes"`
	Items          []CreateRecipeItemRequest `json:"items"`
}

// CreateRecipeItemRequest representa um item da receita.
type CreateRecipeItemRequest struct {
	IngredientID uuid.UUID `json:"ingredient_id"`
	Quantity     float64   `json:"quantity"`
	Unit         string    `json:"unit"`
	WasteFactor  float64   `json:"waste_factor"`
}

// UpdateRecipeRequest representa a requisição de atualização de receita.
type UpdateRecipeRequest struct {
	Name           *string                    `json:"name,omitempty"`
	Description    *string                    `json:"description,omitempty"`
	YieldQuantity  *float64                   `json:"yield_quantity,omitempty"`
	YieldUnit      *string                    `json:"yield_unit,omitempty"`
	ProductionTime *int                       `json:"production_time,omitempty"`
	Notes          *string                    `json:"notes,omitempty"`
	Items          *[]CreateRecipeItemRequest `json:"items"`
}

// Create cria uma nova receita.
func (h *RecipeHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	var req CreateRecipeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeInvalidRequestBodyMessage,
			httputil.WithErrorCode("RECEITA_CORPO_INVALIDO"),
		)
		return
	}

	// Validações
	if req.Name == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeNameRequiredMessage,
			httputil.WithErrorCode("RECEITA_NOME_OBRIGATORIO"),
			httputil.WithFieldError("name", recipeNameRequiredMessage),
		)
		return
	}
	if req.YieldQuantity <= 0 {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeYieldQuantityPositive,
			httputil.WithErrorCode("RECEITA_RENDIMENTO_POSITIVO"),
			httputil.WithFieldError("yield_quantity", recipeYieldQuantityPositive),
		)
		return
	}
	if req.YieldUnit == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeYieldUnitRequiredMessage,
			httputil.WithErrorCode("RECEITA_UNIDADE_OBRIGATORIA"),
			httputil.WithFieldError("yield_unit", recipeYieldUnitRequiredMessage),
		)
		return
	}

	recipe := &domain.Recipe{
		TenantID:       claims.TenantID,
		Name:           req.Name,
		Description:    req.Description,
		YieldQuantity:  req.YieldQuantity,
		YieldUnit:      req.YieldUnit,
		ProductionTime: req.ProductionTime,
		Notes:          req.Notes,
		Items:          make([]domain.RecipeItem, 0, len(req.Items)),
	}

	// Converter items
	for idx, item := range req.Items {
		if item.Quantity <= 0 {
			field := fmt.Sprintf("items[%d].quantity", idx)
			httputil.RespondError(
				w,
				http.StatusBadRequest,
				recipeItemQuantityPositiveMessage,
				httputil.WithErrorCode("RECEITA_ITEM_QUANTIDADE_POSITIVA"),
				httputil.WithFieldError(field, recipeItemQuantityPositiveMessage),
			)
			return
		}
		recipe.Items = append(recipe.Items, domain.RecipeItem{
			TenantID:     claims.TenantID,
			IngredientID: item.IngredientID,
			Quantity:     item.Quantity,
			Unit:         item.Unit,
			WasteFactor:  item.WasteFactor,
		})
	}

	ctx := r.Context()
	if err := h.service.Create(ctx, recipe); err != nil {
		h.logger.Error().Err(err).Msg("failed to create recipe")
		httputil.RespondError(
			w,
			http.StatusInternalServerError,
			recipeCreateFailedMessage,
			httputil.WithErrorCode("RECEITA_CRIAR_FALHA"),
		)
		return
	}

	// Calcular custo da receita
	summary, err := h.pricingService.CalculateRecipeCost(ctx, claims.TenantID, recipe.ID)
	if err != nil {
		h.logger.Warn().Err(err).Msg("failed to calculate recipe cost")
	} else {
		recipe.CostSummary = summary
	}

	httputil.RespondJSON(w, http.StatusCreated, recipe)
}

// GetByID retorna uma receita por ID.
func (h *RecipeHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeIdRequiredMessage,
			httputil.WithErrorCode("RECEITA_ID_OBRIGATORIO"),
			httputil.WithFieldError("id", recipeIdRequiredMessage),
		)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeInvalidIDMessage,
			httputil.WithErrorCode("RECEITA_ID_INVALIDO"),
			httputil.WithFieldError("id", recipeInvalidIDMessage),
		)
		return
	}

	ctx := r.Context()
	recipe, err := h.service.GetByID(ctx, claims.TenantID, id)
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusNotFound,
			recipeNotFoundMessage,
			httputil.WithErrorCode("RECEITA_NAO_ENCONTRADA"),
		)
		return
	}

	// Calcular custo da receita
	summary, err := h.pricingService.CalculateRecipeCost(ctx, claims.TenantID, recipe.ID)
	if err != nil {
		h.logger.Warn().Err(err).Msg("failed to calculate recipe cost")
	} else {
		recipe.CostSummary = summary
	}

	httputil.RespondJSON(w, http.StatusOK, recipe)
}

// List retorna todas as receitas do tenant.
func (h *RecipeHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	ctx := r.Context()
	query := r.URL.Query()
	opts := &service.RecipeListOptions{}
	if search := strings.TrimSpace(query.Get("search")); search != "" {
		opts.Search = search
	}
	if categoryID := strings.TrimSpace(query.Get("category_id")); categoryID != "" {
		if id, err := uuid.Parse(categoryID); err == nil {
			opts.CategoryID = &id
		}
	}

	recipes, err := h.service.List(ctx, claims.TenantID, opts)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to list recipes")
		httputil.RespondError(
			w,
			http.StatusInternalServerError,
			recipeListFailedMessage,
			httputil.WithErrorCode("RECEITA_LISTAR_FALHA"),
		)
		return
	}

	// Calcular custos para todas as receitas
	for i := range recipes {
		summary, err := h.pricingService.CalculateRecipeCost(ctx, claims.TenantID, recipes[i].ID)
		if err != nil {
			h.logger.Warn().Err(err).Str("recipe_id", recipes[i].ID.String()).Msg("failed to calculate recipe cost")
			continue
		}
		recipes[i].CostSummary = summary
	}

	httputil.RespondJSON(w, http.StatusOK, recipes)
}

// Update atualiza uma receita existente.
func (h *RecipeHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeIdRequiredMessage,
			httputil.WithErrorCode("RECEITA_ID_OBRIGATORIO"),
			httputil.WithFieldError("id", recipeIdRequiredMessage),
		)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeInvalidIDMessage,
			httputil.WithErrorCode("RECEITA_ID_INVALIDO"),
			httputil.WithFieldError("id", recipeInvalidIDMessage),
		)
		return
	}

	var req UpdateRecipeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, recipeInvalidRequestBodyMessage, httputil.WithErrorCode("RECEITA_CORPO_INVALIDO"))
		return
	}

	ctx := r.Context()

	// Buscar receita existente
	recipe, err := h.service.GetByID(ctx, claims.TenantID, id)
	if err != nil {
		httputil.RespondError(w, http.StatusNotFound, recipeNotFoundMessage, httputil.WithErrorCode("RECEITA_NAO_ENCONTRADA"))
		return
	}

	// Atualizar campos
	if req.Name != nil {
		recipe.Name = *req.Name
	}
	if req.Description != nil {
		recipe.Description = *req.Description
	}
	if req.YieldQuantity != nil {
		if *req.YieldQuantity <= 0 {
			httputil.RespondError(w, http.StatusBadRequest, recipeYieldQuantityPositive, httputil.WithErrorCode("RECEITA_RENDIMENTO_POSITIVO"), httputil.WithFieldError("yield_quantity", recipeYieldQuantityPositive))
			return
		}
		recipe.YieldQuantity = *req.YieldQuantity
	}
	if req.YieldUnit != nil {
		recipe.YieldUnit = *req.YieldUnit
	}
	if req.ProductionTime != nil {
		recipe.ProductionTime = *req.ProductionTime
	}
	if req.Notes != nil {
		recipe.Notes = *req.Notes
	}
	if req.Items != nil {
		items := make([]domain.RecipeItem, 0, len(*req.Items))
		for idx, item := range *req.Items {
			if item.Quantity <= 0 {
				field := fmt.Sprintf("items[%d].quantity", idx)
				httputil.RespondError(
					w,
					http.StatusBadRequest,
					recipeItemQuantityPositiveMessage,
					httputil.WithErrorCode("RECEITA_ITEM_QUANTIDADE_POSITIVA"),
					httputil.WithFieldError(field, recipeItemQuantityPositiveMessage),
				)
				return
			}
			items = append(items, domain.RecipeItem{
				TenantID:     claims.TenantID,
				IngredientID: item.IngredientID,
				Quantity:     item.Quantity,
				Unit:         item.Unit,
				WasteFactor:  item.WasteFactor,
			})
		}
		recipe.Items = items
	}

	if err := h.service.Update(ctx, recipe); err != nil {
		h.logger.Error().Err(err).Msg("failed to update recipe")
		httputil.RespondError(w, http.StatusInternalServerError, recipeUpdateFailedMessage, httputil.WithErrorCode("RECEITA_ATUALIZAR_FALHA"))
		return
	}

	// Recalcular custo
	summary, err := h.pricingService.CalculateRecipeCost(ctx, claims.TenantID, recipe.ID)
	if err != nil {
		h.logger.Warn().Err(err).Msg("failed to calculate recipe cost")
	} else {
		recipe.CostSummary = summary
	}

	httputil.RespondJSON(w, http.StatusOK, recipe)
}

// Delete remove uma receita (soft delete).
func (h *RecipeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(w, http.StatusBadRequest, recipeIdRequiredMessage, httputil.WithErrorCode("RECEITA_ID_OBRIGATORIO"), httputil.WithFieldError("id", recipeIdRequiredMessage))
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, recipeInvalidIDMessage, httputil.WithErrorCode("RECEITA_ID_INVALIDO"), httputil.WithFieldError("id", recipeInvalidIDMessage))
		return
	}

	ctx := r.Context()
	if err := h.service.Delete(ctx, claims.TenantID, id); err != nil {
		h.logger.Error().Err(err).Msg("failed to delete recipe")
		httputil.RespondError(w, http.StatusInternalServerError, recipeDeleteFailedMessage, httputil.WithErrorCode("RECEITA_REMOVER_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": recipeDeletedSuccessMessage})
}

// BulkDelete remove múltiplas receitas.
func (h *RecipeHandler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	var req bulkDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, recipeInvalidRequestBodyMessage, httputil.WithErrorCode("RECEITA_CORPO_INVALIDO"))
		return
	}
	if len(req.IDs) == 0 {
		httputil.RespondError(w, http.StatusBadRequest, "Informe ao menos uma receita para exclusão.", httputil.WithErrorCode("RECEITA_IDS_OBRIGATORIOS"))
		return
	}

	if err := h.service.BulkDelete(r.Context(), claims.TenantID, req.IDs); err != nil {
		h.logger.Error().Err(err).Msg("failed to bulk delete recipes")
		httputil.RespondError(w, http.StatusInternalServerError, recipeDeleteFailedMessage, httputil.WithErrorCode("RECEITA_REMOVER_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": recipeDeletedSuccessMessage})
}

// AddItem adiciona um ingrediente à receita.
func (h *RecipeHandler) AddItem(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	recipeIDStr := r.PathValue("id")
	if recipeIDStr == "" {
		httputil.RespondError(w, http.StatusBadRequest, recipeIdRequiredMessage, httputil.WithErrorCode("RECEITA_ID_OBRIGATORIO"), httputil.WithFieldError("id", recipeIdRequiredMessage))
		return
	}

	recipeID, err := uuid.Parse(recipeIDStr)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, recipeInvalidIDMessage, httputil.WithErrorCode("RECEITA_ID_INVALIDO"), httputil.WithFieldError("id", recipeInvalidIDMessage))
		return
	}

	var req CreateRecipeItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, recipeInvalidRequestBodyMessage, httputil.WithErrorCode("RECEITA_CORPO_INVALIDO"))
		return
	}

	if req.Quantity <= 0 {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeItemQuantityPositiveMessage,
			httputil.WithErrorCode("RECEITA_ITEM_QUANTIDADE_POSITIVA"),
			httputil.WithFieldError("quantity", recipeItemQuantityPositiveMessage),
		)
		return
	}

	item := &domain.RecipeItem{
		TenantID:     claims.TenantID,
		RecipeID:     recipeID,
		IngredientID: req.IngredientID,
		Quantity:     req.Quantity,
		Unit:         req.Unit,
		WasteFactor:  req.WasteFactor,
	}

	ctx := r.Context()
	if err := h.service.AddItem(ctx, claims.TenantID, recipeID, item); err != nil {
		h.logger.Error().Err(err).Msg("failed to add recipe item")
		httputil.RespondError(w, http.StatusInternalServerError, recipeItemAddFailedMessage, httputil.WithErrorCode("RECEITA_ITEM_ADICIONAR_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusCreated, map[string]any{
		"message": recipeItemAddSuccessMessage,
		"item":    item,
	})
}

// RemoveItem remove um ingrediente da receita.
func (h *RecipeHandler) RemoveItem(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode(recipeUnauthorizedCode))
		return
	}

	recipeIDStr := r.PathValue("id")
	itemIDStr := r.PathValue("itemId")

	if recipeIDStr == "" || itemIDStr == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeItemIdsRequiredMessage,
			httputil.WithErrorCode("RECEITA_ITEM_IDS_OBRIGATORIOS"),
			httputil.WithFieldErrors(map[string]string{
				"recipe_id": recipeIdRequiredMessage,
				"item_id":   recipeItemIdRequiredMessage,
			}),
		)
		return
	}

	recipeID, err := uuid.Parse(recipeIDStr)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, recipeInvalidIDMessage, httputil.WithErrorCode("RECEITA_ID_INVALIDO"), httputil.WithFieldError("recipe_id", recipeInvalidIDMessage))
		return
	}

	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, recipeItemIdInvalidMessage, httputil.WithErrorCode("RECEITA_ITEM_ID_INVALIDO"), httputil.WithFieldError("item_id", recipeItemIdInvalidMessage))
		return
	}

	ctx := r.Context()
	if err := h.service.RemoveItem(ctx, claims.TenantID, recipeID, itemID); err != nil {
		h.logger.Error().Err(err).Msg("failed to remove recipe item")
		httputil.RespondError(w, http.StatusInternalServerError, recipeItemRemoveFailedMessage, httputil.WithErrorCode("RECEITA_ITEM_REMOVER_FALHA"))
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": recipeItemRemovedSuccessMessage})
}
