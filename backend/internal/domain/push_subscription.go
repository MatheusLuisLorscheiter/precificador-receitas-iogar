package domain

import (
	"time"

	"github.com/google/uuid"
)

// PushSubscription representa uma inscrição Web Push (VAPID) persistida por usuário.
type PushSubscription struct {
    ID         uuid.UUID  `json:"id"`
    TenantID   uuid.UUID  `json:"tenant_id"`
    UserID     uuid.UUID  `json:"user_id"`
    Endpoint   string     `json:"endpoint"`
    Auth       string     `json:"auth"`
    P256dh     string     `json:"p256dh"`
    UserAgent  string     `json:"user_agent"`
    Platform   string     `json:"platform"`
    LastUsedAt *time.Time `json:"last_used_at"`
    ExpiresAt  *time.Time `json:"expires_at"`
    Auditable
}
