package domain

import "github.com/google/uuid"

// User representa um usuário autenticado na plataforma.
type User struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Password  string    `json:"-"`
	Active    bool      `json:"active"`
	Auditable
}
