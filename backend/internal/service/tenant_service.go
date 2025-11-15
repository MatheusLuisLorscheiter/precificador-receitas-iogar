package service

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

// TenantService encapsula regras de negócio relacionadas a tenants.
type TenantService struct {
	repo *repository.Store
	log  zerolog.Logger
}

func NewTenantService(repo *repository.Store, log zerolog.Logger) *TenantService {
	return &TenantService{repo: repo, log: log}
}

func (s *TenantService) Create(ctx context.Context, tenant *domain.Tenant) error {
	tenant.Name = strings.TrimSpace(tenant.Name)

	if err := ensureTenantSlug(ctx, s.repo, tenant, ""); err != nil {
		return err
	}

	tenant.Subdomain = strings.ToLower(strings.TrimSpace(tenant.Subdomain))
	tenant.BillingEmail = strings.ToLower(strings.TrimSpace(tenant.BillingEmail))
	if tenant.Timezone == "" {
		tenant.Timezone = "America/Sao_Paulo"
	}

	if err := s.repo.CreateTenant(ctx, tenant); err != nil {
		return err
	}

	s.log.Info().Str("tenant_id", tenant.ID.String()).Msg("tenant criado")
	return nil
}

func (s *TenantService) Get(ctx context.Context, tenantID uuid.UUID) (*domain.Tenant, error) {
	return s.repo.GetTenantByID(ctx, tenantID)
}

func (s *TenantService) GetBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	return s.repo.GetTenantBySlug(ctx, slug)
}

func (s *TenantService) Update(ctx context.Context, tenant *domain.Tenant) error {
	if err := s.repo.UpdateTenant(ctx, tenant); err != nil {
		return err
	}
	s.log.Info().Str("tenant_id", tenant.ID.String()).Msg("tenant atualizado")
	return nil
}

func (s *TenantService) Delete(ctx context.Context, tenantID uuid.UUID) error {
	if err := s.repo.DeleteTenant(ctx, tenantID); err != nil {
		return err
	}
	s.log.Info().Str("tenant_id", tenantID.String()).Msg("tenant removido")
	return nil
}
