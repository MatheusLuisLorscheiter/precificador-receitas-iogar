package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
)

// ProductHandler gerencia endpoints de produtos.
type ProductHandler struct {
	service *service.ProductService
	logger  *zerolog.Logger
}

const (
	maxProductImageSize = 5 << 20 // 5MB
)

var allowedProductImageMIMEs = map[string]struct{}{
	"image/jpeg": {},
	"image/png":  {},
	"image/webp": {},
}

const (
	invalidRequestBodyMessage     = "Não foi possível interpretar o corpo da requisição."
	nameRequiredMessage           = "O nome do produto é obrigatório."
	recipeRequiredMessage         = "Selecione uma receita para o produto."
	productIDRequiredMessage      = "Informe o ID do produto."
	invalidProductIDMessage       = "O ID do produto é inválido."
	listProductsErrorMessage      = "Não foi possível listar os produtos agora."
	imageFormInvalidMessage       = "Falha ao processar o formulário enviado."
	imageFileRequiredMessage      = "É necessário enviar um arquivo de imagem."
	imageReadErrorMessage         = "Não foi possível ler o arquivo enviado."
	imageTooLargeMessage          = "A imagem deve ter no máximo 5MB."
	imageTypeUnsupportedMessage   = "Formato de imagem não suportado."
	imageUploadErrorMessage       = "Não foi possível atualizar a imagem do produto no momento."
	productDeletedSuccessMessage  = "Produto removido com sucesso."
	defaultValidationErrorMessage = "Existem erros de validação nos dados enviados."
	defaultInternalErrorMessage   = "Não foi possível concluir a operação. Tente novamente em instantes."
	productNotFoundMessage        = "Produto não encontrado."
	productConflictMessage        = "Já existe um produto com essas informações."
)

// NewProductHandler cria uma nova instância do handler de produtos.
func NewProductHandler(
	service *service.ProductService,
	logger *zerolog.Logger,
) *ProductHandler {
	return &ProductHandler{
		service: service,
		logger:  logger,
	}
}

// CreateProductRequest representa a requisição de criação de produto.
type CreateProductRequest struct {
	Name            string     `json:"name"`
	Description     string     `json:"description"`
	SKU             string     `json:"sku"`
	Barcode         string     `json:"barcode"`
	RecipeID        uuid.UUID  `json:"recipe_id"`
	MarginPercent   float64    `json:"margin_percent"`
	PackagingCost   float64    `json:"packaging_cost"`
	CategoryID      *uuid.UUID `json:"category_id"`
	StockQuantity   float64    `json:"stock_quantity"`
	StockUnit       string     `json:"stock_unit"`
	ReorderPoint    float64    `json:"reorder_point"`
	StorageLocation string     `json:"storage_location"`
	Active          bool       `json:"active"`
}

// UpdateProductRequest representa a requisição de atualização de produto.
type UpdateProductRequest struct {
	Name            *string    `json:"name,omitempty"`
	Description     *string    `json:"description,omitempty"`
	SKU             *string    `json:"sku,omitempty"`
	Barcode         *string    `json:"barcode,omitempty"`
	RecipeID        *uuid.UUID `json:"recipe_id,omitempty"`
	MarginPercent   *float64   `json:"margin_percent,omitempty"`
	PackagingCost   *float64   `json:"packaging_cost,omitempty"`
	CategoryID      *uuid.UUID `json:"category_id,omitempty"`
	ClearCategory   *bool      `json:"clear_category,omitempty"`
	StockQuantity   *float64   `json:"stock_quantity,omitempty"`
	StockUnit       *string    `json:"stock_unit,omitempty"`
	ReorderPoint    *float64   `json:"reorder_point,omitempty"`
	StorageLocation *string    `json:"storage_location,omitempty"`
	Active          *bool      `json:"active,omitempty"`
}

// Create cria um novo produto.
func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("PRODUTO_AUTENTICACAO"))
		return
	}

	var req CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidRequestBodyMessage, httputil.WithErrorCode("PRODUTO_CORPO_INVALIDO"))
		return
	}

	// Validações
	if req.Name == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			nameRequiredMessage,
			httputil.WithErrorCode("PRODUTO_NOME_OBRIGATORIO"),
			httputil.WithFieldError("name", nameRequiredMessage),
		)
		return
	}

	if req.RecipeID == uuid.Nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			recipeRequiredMessage,
			httputil.WithErrorCode("PRODUTO_RECEITA_OBRIGATORIA"),
			httputil.WithFieldError("recipe_id", recipeRequiredMessage),
		)
		return
	}

	var categoryID *uuid.UUID
	if req.CategoryID != nil {
		id := *req.CategoryID
		categoryID = &id
	}

	product := &domain.Product{
		TenantID:        claims.TenantID,
		Name:            req.Name,
		Description:     req.Description,
		SKU:             req.SKU,
		Barcode:         req.Barcode,
		RecipeID:        req.RecipeID,
		MarginPercent:   req.MarginPercent,
		PackagingCost:   req.PackagingCost,
		CategoryID:      categoryID,
		StockQuantity:   req.StockQuantity,
		StockUnit:       req.StockUnit,
		ReorderPoint:    req.ReorderPoint,
		StorageLocation: req.StorageLocation,
		Active:          req.Active,
	}

	ctx := r.Context()

	if err := h.service.Create(ctx, product); err != nil {
		h.logger.Error().Err(err).Msg("failed to create product")
		h.handleServiceError(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusCreated, product)
}

// GetByID retorna um produto por ID.
func (h *ProductHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("PRODUTO_AUTENTICACAO"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			productIDRequiredMessage,
			httputil.WithErrorCode("PRODUTO_ID_OBRIGATORIO"),
			httputil.WithFieldError("id", productIDRequiredMessage),
		)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			invalidProductIDMessage,
			httputil.WithErrorCode("PRODUTO_ID_INVALIDO"),
			httputil.WithFieldError("id", invalidProductIDMessage),
		)
		return
	}

	ctx := r.Context()
	product, err := h.service.GetByID(ctx, claims.TenantID, id)
	if err != nil {
		h.handleServiceError(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, product)
}

// List retorna todos os produtos do tenant.
func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("PRODUTO_AUTENTICACAO"))
		return
	}

	ctx := r.Context()
	query := r.URL.Query()
	opts := &service.ProductListOptions{}
	if search := strings.TrimSpace(query.Get("search")); search != "" {
		opts.Search = search
	}
	if categoryID := strings.TrimSpace(query.Get("category_id")); categoryID != "" {
		if id, err := uuid.Parse(categoryID); err == nil {
			opts.CategoryID = &id
		}
	}
	if recipeID := strings.TrimSpace(query.Get("recipe_id")); recipeID != "" {
		if id, err := uuid.Parse(recipeID); err == nil {
			opts.RecipeID = &id
		}
	}
	if stock := strings.TrimSpace(query.Get("stock_status")); stock != "" {
		opts.StockStatus = service.StockStatus(stock)
	}
	if activeParam := strings.TrimSpace(query.Get("active")); activeParam != "" {
		if val, err := strconv.ParseBool(activeParam); err == nil {
			opts.Active = &val
		}
	}

	products, err := h.service.List(ctx, claims.TenantID, opts)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to list products")
		httputil.RespondError(
			w,
			http.StatusInternalServerError,
			listProductsErrorMessage,
			httputil.WithErrorCode("PRODUTOS_LISTAR_FALHA"),
		)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, products)
}

// Update atualiza um produto existente.
func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("PRODUTO_AUTENTICACAO"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			productIDRequiredMessage,
			httputil.WithErrorCode("PRODUTO_ID_OBRIGATORIO"),
			httputil.WithFieldError("id", productIDRequiredMessage),
		)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			invalidProductIDMessage,
			httputil.WithErrorCode("PRODUTO_ID_INVALIDO"),
			httputil.WithFieldError("id", invalidProductIDMessage),
		)
		return
	}

	var req UpdateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidRequestBodyMessage, httputil.WithErrorCode("PRODUTO_CORPO_INVALIDO"))
		return
	}

	ctx := r.Context()

	// Buscar produto existente
	product, err := h.service.GetByID(ctx, claims.TenantID, id)
	if err != nil {
		h.handleServiceError(w, err)
		return
	}

	// Atualizar campos
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.SKU != nil {
		product.SKU = *req.SKU
	}
	if req.Barcode != nil {
		product.Barcode = *req.Barcode
	}
	if req.RecipeID != nil {
		product.RecipeID = *req.RecipeID
	}
	if req.MarginPercent != nil {
		product.MarginPercent = *req.MarginPercent
	}
	if req.PackagingCost != nil {
		product.PackagingCost = *req.PackagingCost
	}
	if req.ClearCategory != nil && *req.ClearCategory {
		product.CategoryID = nil
	} else if req.CategoryID != nil {
		id := *req.CategoryID
		product.CategoryID = &id
	}
	if req.StockQuantity != nil {
		product.StockQuantity = *req.StockQuantity
	}
	if req.StockUnit != nil {
		product.StockUnit = *req.StockUnit
	}
	if req.ReorderPoint != nil {
		product.ReorderPoint = *req.ReorderPoint
	}
	if req.StorageLocation != nil {
		product.StorageLocation = *req.StorageLocation
	}
	if req.Active != nil {
		product.Active = *req.Active
	}

	if err := h.service.Update(ctx, product); err != nil {
		h.logger.Error().Err(err).Msg("failed to update product")
		h.handleServiceError(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, product)
}

// Delete remove um produto (soft delete).
func (h *ProductHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("PRODUTO_AUTENTICACAO"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			productIDRequiredMessage,
			httputil.WithErrorCode("PRODUTO_ID_OBRIGATORIO"),
			httputil.WithFieldError("id", productIDRequiredMessage),
		)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			invalidProductIDMessage,
			httputil.WithErrorCode("PRODUTO_ID_INVALIDO"),
			httputil.WithFieldError("id", invalidProductIDMessage),
		)
		return
	}

	ctx := r.Context()
	if err := h.service.Delete(ctx, claims.TenantID, id); err != nil {
		h.logger.Error().Err(err).Msg("failed to delete product")
		h.handleServiceError(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": productDeletedSuccessMessage})
}

// BulkDelete remove múltiplos produtos.
func (h *ProductHandler) BulkDelete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("PRODUTO_AUTENTICACAO"))
		return
	}

	var req bulkDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidRequestBodyMessage, httputil.WithErrorCode("PRODUTO_CORPO_INVALIDO"))
		return
	}
	if len(req.IDs) == 0 {
		httputil.RespondError(w, http.StatusBadRequest, "Informe ao menos um produto para exclusão.", httputil.WithErrorCode("PRODUTO_IDS_OBRIGATORIOS"))
		return
	}

	if err := h.service.BulkDelete(r.Context(), claims.TenantID, req.IDs); err != nil {
		h.logger.Error().Err(err).Msg("failed to bulk delete products")
		h.handleServiceError(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": productDeletedSuccessMessage})
}

// UploadImage atualiza a imagem do produto no armazenamento configurado.
func (h *ProductHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage, httputil.WithErrorCode("PRODUTO_AUTENTICACAO"))
		return
	}

	idStr := r.PathValue("id")
	if idStr == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			productIDRequiredMessage,
			httputil.WithErrorCode("PRODUTO_ID_OBRIGATORIO"),
			httputil.WithFieldError("id", productIDRequiredMessage),
		)
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			invalidProductIDMessage,
			httputil.WithErrorCode("PRODUTO_ID_INVALIDO"),
			httputil.WithFieldError("id", invalidProductIDMessage),
		)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxProductImageSize+512)
	if err := r.ParseMultipartForm(maxProductImageSize); err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			imageFormInvalidMessage,
			httputil.WithErrorCode("PRODUTO_IMAGEM_FORM_INVALIDO"),
		)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			imageFileRequiredMessage,
			httputil.WithErrorCode("PRODUTO_IMAGEM_OBRIGATORIA"),
			httputil.WithFieldError("file", imageFileRequiredMessage),
		)
		return
	}
	defer file.Close()

	var buf bytes.Buffer
	limitedReader := io.LimitReader(file, maxProductImageSize+1)
	if _, err := buf.ReadFrom(limitedReader); err != nil {
		httputil.RespondError(w, http.StatusInternalServerError, imageReadErrorMessage, httputil.WithErrorCode("PRODUTO_IMAGEM_LEITURA_FALHOU"))
		return
	}

	if int64(buf.Len()) > maxProductImageSize {
		httputil.RespondError(
			w,
			http.StatusRequestEntityTooLarge,
			imageTooLargeMessage,
			httputil.WithErrorCode("PRODUTO_IMAGEM_LIMITE_EXCEDIDO"),
		)
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(buf.Bytes())
	}
	contentType = strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))
	if _, ok := allowedProductImageMIMEs[contentType]; !ok {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			imageTypeUnsupportedMessage,
			httputil.WithErrorCode("PRODUTO_IMAGEM_FORMATO_INVALIDO"),
			httputil.WithFieldError("file", imageTypeUnsupportedMessage),
		)
		return
	}

	ctx := r.Context()
	if _, err := h.service.UploadImage(
		ctx,
		claims.TenantID,
		id,
		header.Filename,
		contentType,
		int64(buf.Len()),
		bytes.NewReader(buf.Bytes()),
	); err != nil {
		h.logger.Error().Err(err).Msg("failed to upload product image")
		httputil.RespondError(
			w,
			http.StatusInternalServerError,
			imageUploadErrorMessage,
			httputil.WithErrorCode("PRODUTO_IMAGEM_ATUALIZACAO_FALHOU"),
		)
		return
	}

	product, err := h.service.GetByID(ctx, claims.TenantID, id)
	if err != nil {
		h.handleServiceError(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, product)
}

func (h *ProductHandler) handleServiceError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}

	switch {
	case errors.Is(err, service.ErrValidation):
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			defaultValidationErrorMessage,
			httputil.WithErrorCode("PRODUTO_VALIDACAO"),
			httputil.WithErrorDetails(extractValidationMessage(err)),
		)
	case errors.Is(err, repository.ErrNotFound):
		httputil.RespondError(
			w,
			http.StatusNotFound,
			productNotFoundMessage,
			httputil.WithErrorCode("PRODUTO_NAO_ENCONTRADO"),
		)
	case errors.Is(err, repository.ErrConflict):
		httputil.RespondError(
			w,
			http.StatusConflict,
			productConflictMessage,
			httputil.WithErrorCode("PRODUTO_CONFLITO"),
		)
	default:
		httputil.RespondError(w, http.StatusInternalServerError, defaultInternalErrorMessage, httputil.WithErrorCode("PRODUTO_ERRO_INTERNO"))
	}
}

func extractValidationMessage(err error) string {
	message := err.Error()
	if idx := strings.Index(message, ": "); idx >= 0 {
		return strings.TrimSpace(message[idx+2:])
	}
	return message
}
