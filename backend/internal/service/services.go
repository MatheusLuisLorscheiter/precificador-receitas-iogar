package service

import (
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/auth"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/config"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/mailer"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/metrics"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/rate"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/storage"
)

// Dependencies centraliza as dependências compartilhadas dos serviços.
type Dependencies struct {
	Config       *config.Config
	Store        *repository.Store
	Logger       zerolog.Logger
	Redis        *redis.Client
	TokenManager *auth.Manager
	Storage      *storage.Client
	Mailer       *mailer.SMTPClient
	RateLimiter  *rate.Limiter
	Metrics      *metrics.Registry
}

// Services expõe todos os casos de uso do domínio.
type Services struct {
	Tenants      *TenantService
	Users        *UserService
	Auth         *AuthService
	Ingredients  *IngredientService
	Recipes      *RecipeService
	Products     *ProductService
	Pricing      *PricingService
	Passwords    *PasswordResetService
	PushSubs     *PushSubscriptionService
	Categories   *CategoryService
	Measurements *MeasurementService
}

// NewServices constrói todas as camadas de serviço com base nas dependências.
func NewServices(deps Dependencies) *Services {
	log := deps.Logger

	pricing := NewPricingService(deps.Store, deps.Redis, deps.Metrics, log)

	return &Services{
		Tenants:      NewTenantService(deps.Store, log),
		Users:        NewUserService(deps.Store, log),
		Auth:         NewAuthService(deps.Store, deps.TokenManager, deps.Config.JWT.PasswordPepper, deps.RateLimiter, log),
		Ingredients:  NewIngredientService(deps.Store, pricing, log),
		Recipes:      NewRecipeService(deps.Store, pricing, log),
		Products:     NewProductService(deps.Store, deps.Storage, pricing, log),
		Pricing:      pricing,
		Passwords:    NewPasswordResetService(deps.Store, deps.Mailer, log),
		PushSubs:     NewPushSubscriptionService(deps.Store, log),
		Categories:   NewCategoryService(deps.Store, log),
		Measurements: NewMeasurementService(log),
	}
}
