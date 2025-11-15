package domain

import (
	"math"
	"time"
)

// Auditable define campos padrão de auditoria para todas as entidades.
type Auditable struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// RoundCurrency arredonda valores monetários para duas casas decimais.
func RoundCurrency(value float64) float64 {
	return math.Round(value*100) / 100
}
