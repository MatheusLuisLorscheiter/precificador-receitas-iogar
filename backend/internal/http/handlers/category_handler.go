package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
)

// CategoryHandler disponibiliza endpoints CRUD para categorias.
type CategoryHandler struct {
	categories *service.CategoryService
	logger     *zerolog.Logger
}

func NewCategoryHandler(categories *service.CategoryService, logger *zerolog.Logger) *CategoryHandler {
	return &CategoryHandler{categories: categories, logger: logger}
}

type createCategoryRequest struct {
	Name      string `json:"name"`
	Type      string `json:"type"`
	Color     string `json:"color"`
	Icon      string `json:"icon"`
	SortOrder *int   `json:"sort_order"`
}

type updateCategoryRequest struct {
	Name      *string `json:"name"`
	Color     *string `json:"color"`
	Icon      *string `json:"icon"`
	SortOrder *int    `json:"sort_order"`
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req createCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	category := &domain.Category{
		TenantID: claims.TenantID,
		Name:     req.Name,
		Type:     req.Type,
		Color:    req.Color,
		Icon:     req.Icon,
	}
	if req.SortOrder != nil {
		category.SortOrder = *req.SortOrder
	}

	if err := h.categories.Create(r.Context(), category); err != nil {
		h.logger.Error().Err(err).Msg("failed to create category")
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusCreated, category)
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	categoryType := r.URL.Query().Get("type")
	categories, err := h.categories.List(r.Context(), claims.TenantID, categoryType)
	if err != nil {
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, categories)
}

func (h *CategoryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	category, err := h.categories.Get(r.Context(), claims.TenantID, id)
	if err != nil {
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, category)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	var req updateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	category, err := h.categories.Get(r.Context(), claims.TenantID, id)
	if err != nil {
		httputil.Error(w, err)
		return
	}

	if req.Name != nil {
		category.Name = *req.Name
	}
	if req.Color != nil {
		category.Color = *req.Color
	}
	if req.Icon != nil {
		category.Icon = *req.Icon
	}
	if req.SortOrder != nil {
		category.SortOrder = *req.SortOrder
	}

	if err := h.categories.Update(r.Context(), category); err != nil {
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, category)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	if err := h.categories.Delete(r.Context(), claims.TenantID, id); err != nil {
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": "category deleted"})
}
