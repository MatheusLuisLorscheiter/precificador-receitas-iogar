package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/auth"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/cache"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/config"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/database"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/handlers"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/middleware"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/router"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/logger"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/mailer"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/metrics"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/rate"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/storage"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "Erro fatal: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	// Tenta carregar variáveis de ambiente do arquivo .env local (conveniência para dev)
	if err := godotenv.Load(); err != nil {
		// Não é fatal; se não existir, usaremos as variáveis de ambiente do sistema
		fmt.Fprintln(os.Stderr, "No .env file found or failed to load; using system environment variables if present")
	}
	// Carregar configuração
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("falha ao carregar configuração: %w", err)
	}

	// Configurar logger
	log := logger.New(cfg.App.Env)
	log.Info().Msgf("Iniciando %s em modo %s", cfg.App.Name, cfg.App.Env)

	ctx := context.Background()

	// Conectar ao Postgres
	log.Info().Msg("Conectando ao PostgreSQL...")
	db, err := database.Connect(ctx, cfg.PostgresDSN(), 25)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao postgres: %w", err)
	}
	defer db.Close()
	log.Info().Msg("PostgreSQL conectado com sucesso")

	// Conectar ao Redis
	log.Info().Msg("Conectando ao Redis...")
	redisClient, err := cache.NewRedis(
		cfg.Redis.Addr,
		cfg.Redis.Username,
		cfg.Redis.Password,
		cfg.Redis.DB,
		cfg.Redis.TLSEnabled,
	)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao redis: %w", err)
	}
	defer redisClient.Close()
	log.Info().Msg("Redis conectado com sucesso")

	// Conectar ao MinIO
	log.Info().Msg("Conectando ao MinIO...")
	storageClient, err := storage.New(
		cfg.MinIO.Endpoint,
		cfg.MinIO.AccessKey,
		cfg.MinIO.SecretKey,
		cfg.MinIO.Bucket,
		cfg.MinIO.Region,
		cfg.MinIO.UseSSL,
		cfg.MinIO.PresignTTL,
	)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao minio: %w", err)
	}
	if err := storageClient.EnsureBucket(ctx); err != nil {
		return fmt.Errorf("falha ao garantir bucket do minio: %w", err)
	}
	log.Info().Msg("MinIO conectado com sucesso")

	// Configurar mailer
	mailClient := mailer.NewSMTPClient(
		cfg.SMTP.Host,
		cfg.SMTP.Port,
		cfg.SMTP.Username,
		cfg.SMTP.Password,
		cfg.SMTP.FromAddress,
		cfg.SMTP.TLSRequired,
	)

	tokenManager := auth.NewManager(
		cfg.JWT.Secret,
		cfg.JWT.Issuer,
		cfg.JWT.AccessTokenDuration,
		cfg.JWT.RefreshTokenDuration,
	)

	loginLimiter := rate.NewLimiter(redisClient)
	metricsRegistry := metrics.NewRegistry()

	// Inicializar repositórios
	store := repository.New(db)

	// Inicializar serviços
	services := service.NewServices(service.Dependencies{
		Config:       cfg,
		Store:        store,
		Logger:       log,
		Redis:        redisClient,
		TokenManager: tokenManager,
		Storage:      storageClient,
		Mailer:       mailClient,
		RateLimiter:  loginLimiter,
		Metrics:      metricsRegistry,
	})

	logPtr := &log

	// Inicializar handlers
	authHandler := handlers.NewAuthHandler(
		services.Auth,
		services.Users,
		services.Tenants,
		services.Passwords,
		cfg,
		logPtr,
	)

	ingredientHandler := handlers.NewIngredientHandler(services.Ingredients, logPtr)
	recipeHandler := handlers.NewRecipeHandler(services.Recipes, services.Pricing, logPtr)
	productHandler := handlers.NewProductHandler(services.Products, logPtr)
	pushHandler := handlers.NewPushSubscriptionHandler(services.PushSubs, logPtr)
	categoryHandler := handlers.NewCategoryHandler(services.Categories, logPtr)
	measurementHandler := handlers.NewMeasurementHandler(services.Measurements, logPtr)

	// Configurar rate limiter HTTP
	rateLimiter := middleware.NewRateLimiter(cfg.RateLimit.Requests, 20, logPtr)

	// Configurar router
	r := router.New(&router.Config{
		Logger:             logPtr,
		TokenManager:       tokenManager,
		AuthHandler:        authHandler,
		IngredientHandler:  ingredientHandler,
		RecipeHandler:      recipeHandler,
		ProductHandler:     productHandler,
		PushHandler:        pushHandler,
		CategoryHandler:    categoryHandler,
		MeasurementHandler: measurementHandler,
		RateLimiter:        rateLimiter,
	})

	// Configurar servidor HTTP
	addr := fmt.Sprintf("%s:%d", cfg.App.Host, cfg.App.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r.Handler(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Canal para erros do servidor
	serverErrors := make(chan error, 1)

	// Iniciar servidor em goroutine
	go func() {
		log.Info().Msgf("Servidor HTTP iniciado em %s", addr)
		serverErrors <- srv.ListenAndServe()
	}()

	// Canal para sinais de shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Aguardar erro ou sinal de shutdown
	select {
	case err := <-serverErrors:
		return fmt.Errorf("erro no servidor: %w", err)

	case sig := <-shutdown:
		log.Info().Msgf("Sinal de shutdown recebido: %v", sig)

		// Criar contexto com timeout para shutdown gracioso
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		// Shutdown gracioso
		if err := srv.Shutdown(ctx); err != nil {
			log.Error().Err(err).Msg("Erro durante shutdown gracioso")
			return err
		}

		log.Info().Msg("Servidor encerrado com sucesso")
	}

	return nil
}
