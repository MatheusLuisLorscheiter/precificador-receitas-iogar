package router

import (
	"net/http"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/auth"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/handlers"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog"
)

// Router configura todas as rotas da aplicação.
type Router struct {
	mux                *http.ServeMux
	logger             *zerolog.Logger
	tokenManager       *auth.Manager
	authHandler        *handlers.AuthHandler
	ingredientHandler  *handlers.IngredientHandler
	recipeHandler      *handlers.RecipeHandler
	productHandler     *handlers.ProductHandler
	pushHandler        *handlers.PushSubscriptionHandler
	categoryHandler    *handlers.CategoryHandler
	measurementHandler *handlers.MeasurementHandler
	rateLimiter        *middleware.RateLimiter
	allowedOrigins     []string
}

// Config contém as dependências necessárias para criar o router.
type Config struct {
	Logger             *zerolog.Logger
	TokenManager       *auth.Manager
	AuthHandler        *handlers.AuthHandler
	IngredientHandler  *handlers.IngredientHandler
	RecipeHandler      *handlers.RecipeHandler
	ProductHandler     *handlers.ProductHandler
	PushHandler        *handlers.PushSubscriptionHandler
	CategoryHandler    *handlers.CategoryHandler
	MeasurementHandler *handlers.MeasurementHandler
	RateLimiter        *middleware.RateLimiter
	AllowedOrigins     []string
}

// New cria um novo router configurado.
func New(cfg *Config) *Router {
	r := &Router{
		mux:                http.NewServeMux(),
		logger:             cfg.Logger,
		tokenManager:       cfg.TokenManager,
		authHandler:        cfg.AuthHandler,
		ingredientHandler:  cfg.IngredientHandler,
		recipeHandler:      cfg.RecipeHandler,
		productHandler:     cfg.ProductHandler,
		pushHandler:        cfg.PushHandler,
		categoryHandler:    cfg.CategoryHandler,
		measurementHandler: cfg.MeasurementHandler,
		rateLimiter:        cfg.RateLimiter,
		allowedOrigins:     cfg.AllowedOrigins,
	}

	r.setupRoutes()
	return r
}

// ServeHTTP implementa http.Handler.
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.mux.ServeHTTP(w, req)
}

// setupRoutes configura todas as rotas da API.
func (r *Router) setupRoutes() {
	// Health check (sem autenticação)
	r.mux.HandleFunc("GET /health", r.handleHealth)
	r.mux.HandleFunc("GET /ready", r.handleReady)

	// Métricas Prometheus (sem autenticação)
	r.mux.Handle("GET /metrics", promhttp.Handler())

	// Rotas públicas de autenticação (rotas específicas ANTES do handler geral)
	r.mux.HandleFunc("POST /api/v1/auth/register", r.authHandler.Register)
	r.mux.HandleFunc("POST /api/v1/auth/login", r.authHandler.Login)
	r.mux.HandleFunc("POST /api/v1/auth/refresh", r.authHandler.RefreshToken)
	r.mux.HandleFunc("POST /api/v1/auth/forgot-password", r.authHandler.ForgotPassword)
	r.mux.HandleFunc("POST /api/v1/auth/reset-password", r.authHandler.ResetPassword)
	r.mux.HandleFunc("GET /api/v1/auth/tenants-by-email", r.authHandler.GetTenantsByEmail)

	// Rotas autenticadas
	authMux := http.NewServeMux()

	// Auth
	authMux.HandleFunc("GET /api/v1/auth/me", r.authHandler.Me)

	// Ingredients
	authMux.HandleFunc("POST /api/v1/ingredients", r.ingredientHandler.Create)
	authMux.HandleFunc("GET /api/v1/ingredients", r.ingredientHandler.List)
	authMux.HandleFunc("GET /api/v1/ingredients/{id}", r.ingredientHandler.GetByID)
	authMux.HandleFunc("PUT /api/v1/ingredients/{id}", r.ingredientHandler.Update)
	authMux.HandleFunc("DELETE /api/v1/ingredients/{id}", r.ingredientHandler.Delete)
	authMux.HandleFunc("POST /api/v1/ingredients/bulk-delete", r.ingredientHandler.BulkDelete)

	// Recipes
	authMux.HandleFunc("POST /api/v1/recipes", r.recipeHandler.Create)
	authMux.HandleFunc("GET /api/v1/recipes", r.recipeHandler.List)
	authMux.HandleFunc("GET /api/v1/recipes/{id}", r.recipeHandler.GetByID)
	authMux.HandleFunc("PUT /api/v1/recipes/{id}", r.recipeHandler.Update)
	authMux.HandleFunc("DELETE /api/v1/recipes/{id}", r.recipeHandler.Delete)
	authMux.HandleFunc("POST /api/v1/recipes/{id}/items", r.recipeHandler.AddItem)
	authMux.HandleFunc("DELETE /api/v1/recipes/{id}/items/{itemId}", r.recipeHandler.RemoveItem)
	authMux.HandleFunc("POST /api/v1/recipes/bulk-delete", r.recipeHandler.BulkDelete)

	// Products
	authMux.HandleFunc("POST /api/v1/products", r.productHandler.Create)
	authMux.HandleFunc("GET /api/v1/products", r.productHandler.List)
	authMux.HandleFunc("GET /api/v1/products/{id}", r.productHandler.GetByID)
	authMux.HandleFunc("PUT /api/v1/products/{id}", r.productHandler.Update)
	authMux.HandleFunc("DELETE /api/v1/products/{id}", r.productHandler.Delete)
	authMux.HandleFunc("POST /api/v1/products/{id}/image", r.productHandler.UploadImage)
	authMux.HandleFunc("POST /api/v1/products/bulk-delete", r.productHandler.BulkDelete)

	// Push Subscriptions
	authMux.HandleFunc("GET /api/v1/push-subscriptions", r.pushHandler.ListMine)
	authMux.HandleFunc("POST /api/v1/push-subscriptions", r.pushHandler.Subscribe)
	authMux.HandleFunc("DELETE /api/v1/push-subscriptions", r.pushHandler.Delete)

	// Categories
	authMux.HandleFunc("POST /api/v1/categories", r.categoryHandler.Create)
	authMux.HandleFunc("GET /api/v1/categories", r.categoryHandler.List)
	authMux.HandleFunc("GET /api/v1/categories/{id}", r.categoryHandler.GetByID)
	authMux.HandleFunc("PUT /api/v1/categories/{id}", r.categoryHandler.Update)
	authMux.HandleFunc("DELETE /api/v1/categories/{id}", r.categoryHandler.Delete)

	// Measurement units
	authMux.HandleFunc("GET /api/v1/measurement-units", r.measurementHandler.List)

	// Aplicar middlewares na ordem correta
	authHandler := middleware.Auth(r.logger, r.tokenManager)(
		middleware.TenantIsolation(r.logger)(authMux),
	)

	r.mux.Handle("/api/v1/", authHandler)
}

// handleHealth retorna o status de saúde da aplicação.
func (r *Router) handleHealth(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

// handleReady retorna se a aplicação está pronta para receber tráfego.
func (r *Router) handleReady(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ready"}`))
}

// Handler retorna o handler HTTP principal com todos os middlewares aplicados.
func (r *Router) Handler() http.Handler {
	handler := http.Handler(r.mux)

	// Aplicar middlewares globais (ordem inversa da execução)
	handler = middleware.RecoverPanic(r.logger)(handler)
	handler = middleware.SecurityHeaders()(handler)
	if r.rateLimiter != nil {
		handler = r.rateLimiter.Middleware()(handler)
	}
	handler = middleware.CORS(r.allowedOrigins)(handler)
	handler = middleware.Logger(*r.logger)(handler)

	return handler
}
