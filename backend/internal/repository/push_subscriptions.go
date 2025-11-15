package repository

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

// UpsertPushSubscription cria ou atualiza uma inscrição web push.
func (s *Store) UpsertPushSubscription(ctx context.Context, sub *domain.PushSubscription) error {
	if sub == nil {
		return ErrNotFound
	}

	now := time.Now().UTC()
	if sub.ID == uuid.Nil {
		sub.ID = uuid.New()
	}
	if sub.CreatedAt.IsZero() {
		sub.CreatedAt = now
	}
	sub.UpdatedAt = now
	sanitizedEndpoint := strings.TrimSpace(sub.Endpoint)

	_, err := s.pool.Exec(ctx, `
        INSERT INTO push_subscriptions (id, tenant_id, user_id, endpoint, auth, p256dh, user_agent, platform, last_used_at, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT ON CONSTRAINT uq_push_subscriptions_endpoint
        DO UPDATE SET
            auth = EXCLUDED.auth,
            p256dh = EXCLUDED.p256dh,
            user_agent = EXCLUDED.user_agent,
            platform = EXCLUDED.platform,
            last_used_at = EXCLUDED.last_used_at,
            expires_at = EXCLUDED.expires_at,
            updated_at = EXCLUDED.updated_at
    `,
		sub.ID,
		sub.TenantID,
		sub.UserID,
		sanitizedEndpoint,
		strings.TrimSpace(sub.Auth),
		strings.TrimSpace(sub.P256dh),
		strings.TrimSpace(sub.UserAgent),
		strings.TrimSpace(sub.Platform),
		nullableTime(sub.LastUsedAt),
		nullableTime(sub.ExpiresAt),
		sub.CreatedAt,
		sub.UpdatedAt,
	)

	return translateError(err)
}

// DeletePushSubscription remove uma inscrição pelo endpoint.
func (s *Store) DeletePushSubscription(ctx context.Context, tenantID, userID uuid.UUID, endpoint string) error {
	commandTag, err := s.pool.Exec(ctx, `
        DELETE FROM push_subscriptions
        WHERE tenant_id = $1 AND user_id = $2 AND endpoint = $3
    `, tenantID, userID, strings.TrimSpace(endpoint))
	if err != nil {
		return translateError(err)
	}
	if commandTag.RowsAffected() == 0 {
		return translateError(ErrNotFound)
	}
	return nil
}

// ListPushSubscriptions retorna todas as inscrições de um tenant.
func (s *Store) ListPushSubscriptions(ctx context.Context, tenantID uuid.UUID) ([]domain.PushSubscription, error) {
	rows, err := s.pool.Query(ctx, `
        SELECT id, tenant_id, user_id, endpoint, auth, p256dh, user_agent, platform, last_used_at, expires_at, created_at, updated_at
        FROM push_subscriptions
        WHERE tenant_id = $1
    `, tenantID)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var subs []domain.PushSubscription
	for rows.Next() {
		var sub domain.PushSubscription
		var lastUsed, expires sql.NullTime
		if err := rows.Scan(
			&sub.ID,
			&sub.TenantID,
			&sub.UserID,
			&sub.Endpoint,
			&sub.Auth,
			&sub.P256dh,
			&sub.UserAgent,
			&sub.Platform,
			&lastUsed,
			&expires,
			&sub.CreatedAt,
			&sub.UpdatedAt,
		); err != nil {
			return nil, translateError(err)
		}
		if lastUsed.Valid {
			t := lastUsed.Time
			sub.LastUsedAt = &t
		}
		if expires.Valid {
			t := expires.Time
			sub.ExpiresAt = &t
		}
		subs = append(subs, sub)
	}
	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}
	return subs, nil
}

// ListUserPushSubscriptions retorna inscrições de um usuário específico.
func (s *Store) ListUserPushSubscriptions(ctx context.Context, tenantID, userID uuid.UUID) ([]domain.PushSubscription, error) {
	rows, err := s.pool.Query(ctx, `
        SELECT id, tenant_id, user_id, endpoint, auth, p256dh, user_agent, platform, last_used_at, expires_at, created_at, updated_at
        FROM push_subscriptions
        WHERE tenant_id = $1 AND user_id = $2
    `, tenantID, userID)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var subs []domain.PushSubscription
	for rows.Next() {
		var sub domain.PushSubscription
		var lastUsed, expires sql.NullTime
		if err := rows.Scan(
			&sub.ID,
			&sub.TenantID,
			&sub.UserID,
			&sub.Endpoint,
			&sub.Auth,
			&sub.P256dh,
			&sub.UserAgent,
			&sub.Platform,
			&lastUsed,
			&expires,
			&sub.CreatedAt,
			&sub.UpdatedAt,
		); err != nil {
			return nil, translateError(err)
		}
		if lastUsed.Valid {
			t := lastUsed.Time
			sub.LastUsedAt = &t
		}
		if expires.Valid {
			t := expires.Time
			sub.ExpiresAt = &t
		}
		subs = append(subs, sub)
	}
	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}
	return subs, nil
}

func nullableTime(t *time.Time) interface{} {
	if t == nil {
		return nil
	}
	return *t
}
