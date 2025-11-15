package service

import (
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

// PushSubscriptionService encapsula regras de negócio das inscrições web push.
type PushSubscriptionService struct {
	repo *repository.Store
	log  zerolog.Logger
}

// NewPushSubscriptionService cria uma nova instância do serviço de inscrições push.
func NewPushSubscriptionService(repo *repository.Store, log zerolog.Logger) *PushSubscriptionService {
	return &PushSubscriptionService{repo: repo, log: log}
}

// Upsert cria ou atualiza uma inscrição.
func (s *PushSubscriptionService) Upsert(ctx context.Context, sub *domain.PushSubscription) error {
	if err := s.validate(sub); err != nil {
		return err
	}

	now := time.Now().UTC()
	if sub.LastUsedAt == nil {
		sub.LastUsedAt = &now
	}

	if err := s.repo.UpsertPushSubscription(ctx, sub); err != nil {
		return err
	}

	s.log.Debug().
		Str("endpoint", sub.Endpoint).
		Str("user_id", sub.UserID.String()).
		Msg("push subscription upserted")
	return nil
}

// List retorna todas as inscrições do tenant.
func (s *PushSubscriptionService) List(ctx context.Context, tenantID uuid.UUID) ([]domain.PushSubscription, error) {
	if tenantID == uuid.Nil {
		return nil, ValidationError("tenant inválido")
	}
	return s.repo.ListPushSubscriptions(ctx, tenantID)
}

// ListByUser retorna todas as inscrições de um usuário específico.
func (s *PushSubscriptionService) ListByUser(ctx context.Context, tenantID, userID uuid.UUID) ([]domain.PushSubscription, error) {
	if tenantID == uuid.Nil || userID == uuid.Nil {
		return nil, ValidationError("identificadores inválidos")
	}
	return s.repo.ListUserPushSubscriptions(ctx, tenantID, userID)
}

// Delete remove uma inscrição (opt-out).
func (s *PushSubscriptionService) Delete(ctx context.Context, tenantID, userID uuid.UUID, endpoint string) error {
	if tenantID == uuid.Nil || userID == uuid.Nil {
		return ValidationError("identificadores inválidos")
	}
	endpoint = strings.TrimSpace(endpoint)
	if endpoint == "" {
		return ValidationError("endpoint é obrigatório")
	}
	if err := s.repo.DeletePushSubscription(ctx, tenantID, userID, endpoint); err != nil {
		return err
	}
	s.log.Debug().
		Str("endpoint", endpoint).
		Str("user_id", userID.String()).
		Msg("push subscription deleted")
	return nil
}

func (s *PushSubscriptionService) validate(sub *domain.PushSubscription) error {
	if sub == nil {
		return ValidationError("inscrição inválida")
	}
	if sub.TenantID == uuid.Nil || sub.UserID == uuid.Nil {
		return ValidationError("tenant e usuário são obrigatórios")
	}
	sub.Endpoint = strings.TrimSpace(sub.Endpoint)
	if sub.Endpoint == "" {
		return ValidationError("endpoint é obrigatório")
	}
	if _, err := url.ParseRequestURI(sub.Endpoint); err != nil {
		return ValidationError("endpoint inválido")
	}
	sub.Auth = strings.TrimSpace(sub.Auth)
	sub.P256dh = strings.TrimSpace(sub.P256dh)
	if sub.Auth == "" || sub.P256dh == "" {
		return ValidationError("chaves de criptografia são obrigatórias")
	}
	sub.UserAgent = strings.TrimSpace(sub.UserAgent)
	sub.Platform = strings.TrimSpace(sub.Platform)
	if sub.ExpiresAt != nil {
		expires := sub.ExpiresAt.UTC()
		sub.ExpiresAt = &expires
	}
	if sub.LastUsedAt != nil {
		lastUsed := sub.LastUsedAt.UTC()
		sub.LastUsedAt = &lastUsed
	}
	return nil
}
