package domain

import (
	"time"

	"github.com/google/uuid"
)

// PasswordReset representa um token válido para redefinição de senha.
type PasswordReset struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	UserID    uuid.UUID `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
}
