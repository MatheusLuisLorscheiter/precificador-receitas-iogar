package service

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

// UserService concentra regras de negócio dos usuários.
type UserService struct {
	repo *repository.Store
	log  zerolog.Logger
}

func NewUserService(repo *repository.Store, log zerolog.Logger) *UserService {
	return &UserService{repo: repo, log: log}
}

func (s *UserService) Create(ctx context.Context, user *domain.User) error {
	user.Email = strings.ToLower(strings.TrimSpace(user.Email))
	user.Name = strings.TrimSpace(user.Name)
	user.Role = strings.ToUpper(strings.TrimSpace(user.Role))

	if err := s.repo.CreateUser(ctx, user); err != nil {
		return err
	}

	s.log.Info().Str("user_id", user.ID.String()).Str("tenant_id", user.TenantID.String()).Msg("usuário criado")
	return nil
}

func (s *UserService) List(ctx context.Context, tenantID uuid.UUID) ([]domain.User, error) {
	return s.repo.ListUsers(ctx, tenantID)
}

func (s *UserService) GetByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	return s.repo.GetUserByEmail(ctx, tenantID, email)
}

func (s *UserService) Get(ctx context.Context, tenantID, userID uuid.UUID) (*domain.User, error) {
	return s.repo.GetUserByID(ctx, tenantID, userID)
}

func (s *UserService) Update(ctx context.Context, user *domain.User) error {
	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return err
	}
	s.log.Info().Str("user_id", user.ID.String()).Msg("usuário atualizado")
	return nil
}

func (s *UserService) UpdatePassword(ctx context.Context, tenantID, userID uuid.UUID, hash string) error {
	return s.repo.UpdateUserPassword(ctx, tenantID, userID, hash)
}

func (s *UserService) Delete(ctx context.Context, tenantID, userID uuid.UUID) error {
	if err := s.repo.DeleteUser(ctx, tenantID, userID); err != nil {
		return err
	}
	s.log.Info().Str("user_id", userID.String()).Msg("usuário removido")
	return nil
}

// FindTenantsByEmail retorna todos os tenants onde o usuário possui conta.
func (s *UserService) FindTenantsByEmail(ctx context.Context, email string) ([]domain.Tenant, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	return s.repo.FindTenantsByUserEmail(ctx, email)
}
