package repository

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

func (s *Store) CreatePasswordReset(ctx context.Context, reset *domain.PasswordReset) error {
	reset.ID = uuid.New()

	_, err := s.pool.Exec(ctx, `
		INSERT INTO password_resets (id, tenant_id, user_id, token, expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`, reset.ID, reset.TenantID, reset.UserID, reset.Token, reset.ExpiresAt)

	return translateError(err)
}

func (s *Store) GetPasswordReset(ctx context.Context, tenantID uuid.UUID, token string) (*domain.PasswordReset, error) {
	var reset domain.PasswordReset
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, user_id, token, expires_at, used_at
		FROM password_resets
		WHERE tenant_id = $1 AND token = $2
	`, tenantID, token).Scan(
		&reset.ID,
		&reset.TenantID,
		&reset.UserID,
		&reset.Token,
		&reset.ExpiresAt,
		&reset.UsedAt,
	)
	if err != nil {
		return nil, translateError(err)
	}

	return &reset, nil
}

func (s *Store) MarkPasswordResetUsed(ctx context.Context, resetID uuid.UUID) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE password_resets
		SET used_at = $2
		WHERE id = $1
	`, resetID, time.Now().UTC())
	return translateError(err)
}

func (s *Store) CleanupExpiredPasswordResets(ctx context.Context) error {
	_, err := s.pool.Exec(ctx, `
		DELETE FROM password_resets
		WHERE expires_at < NOW()
		   OR used_at IS NOT NULL AND used_at < NOW() - INTERVAL '30 days'
	`)
	return translateError(err)
}
