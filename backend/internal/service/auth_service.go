package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/auth"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/rate"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

const (
	defaultAdminRole        = "ADMIN"
	loginRateLimitKeyPrefix = "login"
)

var (
	// ErrInvalidCredentials indica falha de autenticação.
	ErrInvalidCredentials = errors.New("credenciais inválidas")

	// ErrTooManyAttempts indica que o cliente excedeu o limite de tentativas.
	ErrTooManyAttempts = errors.New("muitas tentativas, tente novamente em instantes")

	// ErrWeakPassword indica que a nova senha não atende aos requisitos mínimos.
	ErrWeakPassword = errors.New("senha não atende aos requisitos mínimos")
)

// AuthService concentra fluxos de autenticação, registro e manutenção de credenciais.
type AuthService struct {
	repo         *repository.Store
	TokenManager *auth.Manager
	pepper       string
	rateLimiter  *rate.Limiter
	log          zerolog.Logger
}

// RegisterInput descreve os dados necessários para criar um tenant e usuário administrador.
type RegisterInput struct {
	TenantName         string
	TenantSlug         string
	TenantSubdomain    string
	TenantBillingEmail string
	TenantTimezone     string
	UserName           string
	UserEmail          string
	Password           string
}

// LoginInput representa as credenciais de autenticação.
type LoginInput struct {
	TenantSlug string
	Email      string
	Password   string
	IP         string
}

// RefreshInput contém o token de atualização fornecido pelo cliente.
type RefreshInput struct {
	RefreshToken string
}

func NewAuthService(repo *repository.Store, manager *auth.Manager, pepper string, limiter *rate.Limiter, log zerolog.Logger) *AuthService {
	return &AuthService{repo: repo, TokenManager: manager, pepper: pepper, rateLimiter: limiter, log: log}
}

// Register cria um novo tenant e usuário administrador, retornando o par de tokens emitidos.
func (s *AuthService) Register(ctx context.Context, input RegisterInput) (*domain.Tenant, *domain.User, *auth.TokenPair, error) {
	tenant := &domain.Tenant{
		Name:         strings.TrimSpace(input.TenantName),
		Slug:         normalizeSlug(input.TenantSlug),
		Subdomain:    normalizeSlug(input.TenantSubdomain),
		BillingEmail: strings.ToLower(strings.TrimSpace(input.TenantBillingEmail)),
		Timezone:     strings.TrimSpace(input.TenantTimezone),
	}
	if tenant.Timezone == "" {
		tenant.Timezone = "America/Sao_Paulo"
	}

	if err := ensureTenantSlug(ctx, s.repo, tenant, input.UserName); err != nil {
		return nil, nil, nil, err
	}

	password := strings.TrimSpace(input.Password)
	hashedPassword, err := auth.HashPassword(password, s.pepper)
	if err != nil {
		return nil, nil, nil, err
	}

	user := &domain.User{
		Name:     strings.TrimSpace(input.UserName),
		Email:    strings.ToLower(strings.TrimSpace(input.UserEmail)),
		Role:     defaultAdminRole,
		Active:   true,
		Password: hashedPassword,
	}

	err = s.repo.ExecTx(ctx, func(tx pgx.Tx) error {
		if errTx := s.repo.CreateTenantTx(ctx, tx, tenant); errTx != nil {
			return errTx
		}
		user.TenantID = tenant.ID
		if errTx := s.repo.CreateUserTx(ctx, tx, user); errTx != nil {
			return errTx
		}
		return nil
	})
	if err != nil {
		return nil, nil, nil, err
	}

	tokens, err := s.TokenManager.GenerateTokens(user.ID, tenant.ID, user.Role)
	if err != nil {
		return nil, nil, nil, err
	}

	s.log.Info().Str("tenant_id", tenant.ID.String()).Str("user_id", user.ID.String()).Msg("tenant registrado com sucesso")
	return tenant, user, tokens, nil
}

// Login autentica o usuário e retorna os tokens válidos.
func (s *AuthService) Login(ctx context.Context, input LoginInput) (*domain.User, *auth.TokenPair, error) {
	slug := normalizeSlug(input.TenantSlug)
	email := strings.ToLower(strings.TrimSpace(input.Email))

	if s.rateLimiter != nil {
		key := strings.Join([]string{loginRateLimitKeyPrefix, slug, email, strings.TrimSpace(input.IP)}, ":")
		allowed, err := s.rateLimiter.Allow(ctx, key, 10, 1*time.Minute)
		if err != nil {
			return nil, nil, err
		}
		if !allowed {
			return nil, nil, ErrTooManyAttempts
		}
	}

	tenant, err := s.repo.GetTenantBySlug(ctx, slug)
	if err != nil {
		return nil, nil, err
	}

	user, err := s.repo.GetUserByEmail(ctx, tenant.ID, email)
	if err != nil {
		return nil, nil, err
	}

	if !user.Active {
		return nil, nil, ErrInvalidCredentials
	}

	if err := auth.CheckPassword(user.Password, strings.TrimSpace(input.Password), s.pepper); err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	tokens, err := s.TokenManager.GenerateTokens(user.ID, tenant.ID, user.Role)
	if err != nil {
		return nil, nil, err
	}

	s.log.Info().Str("user_id", user.ID.String()).Str("tenant_id", tenant.ID.String()).Msg("login efetuado")
	return user, tokens, nil
}

// Refresh valida o refresh token e emite um novo par de tokens.
func (s *AuthService) Refresh(ctx context.Context, input RefreshInput) (*auth.TokenPair, error) {
	claims, err := s.TokenManager.ValidateToken(strings.TrimSpace(input.RefreshToken))
	if err != nil {
		return nil, err
	}

	tenantID := claims.TenantID
	user, err := s.repo.GetUserByID(ctx, tenantID, claims.UserID)
	if err != nil {
		return nil, err
	}

	if !user.Active {
		return nil, ErrInvalidCredentials
	}

	tokens, err := s.TokenManager.GenerateTokens(user.ID, tenantID, user.Role)
	if err != nil {
		return nil, err
	}

	return tokens, nil
}

// ValidateToken centraliza a validação de tokens no serviço.
func (s *AuthService) ValidateToken(token string) (*auth.Claims, error) {
	return s.TokenManager.ValidateToken(token)
} // UpdatePassword aplica hashing e persiste uma nova senha para o usuário informado.
func (s *AuthService) UpdatePassword(ctx context.Context, tenantID, userID uuid.UUID, newPassword string) error {
	password := strings.TrimSpace(newPassword)
	if len(password) < 8 {
		return ErrWeakPassword
	}

	hash, err := auth.HashPassword(password, s.pepper)
	if err != nil {
		return err
	}

	if err := s.repo.UpdateUserPassword(ctx, tenantID, userID, hash); err != nil {
		return err
	}

	s.log.Info().Str("user_id", userID.String()).Msg("senha atualizada")
	return nil
}

func normalizeSlug(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, " ", "-")
	return value
}

// HashPassword faz o hash de uma senha usando bcrypt com pepper.
func (s *AuthService) HashPassword(password string) (string, error) {
	return auth.HashPassword(password, s.pepper)
}
