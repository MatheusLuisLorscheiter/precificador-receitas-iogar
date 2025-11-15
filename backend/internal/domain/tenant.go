package domain

import "github.com/google/uuid"

// Tenant representa um cliente utilizando a plataforma.
type Tenant struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Subdomain   string    `json:"subdomain"`
	BillingEmail string   `json:"billing_email"`
	Timezone    string    `json:"timezone"`
	Auditable
}
