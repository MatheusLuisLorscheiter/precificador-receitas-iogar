package service

import (
	"context"

	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

// MeasurementService expõe unidades de medida suportadas.
type MeasurementService struct {
	log zerolog.Logger
}

// NewMeasurementService cria uma nova instância do serviço de unidades.
func NewMeasurementService(log zerolog.Logger) *MeasurementService {
	return &MeasurementService{log: log}
}

// List retorna todas as unidades disponíveis.
func (s *MeasurementService) List(_ context.Context) []domain.MeasurementUnit {
	return domain.MeasurementUnits()
}

// Grouped retorna as unidades agrupadas por tipo.
func (s *MeasurementService) Grouped(_ context.Context) map[string][]domain.MeasurementUnit {
	return domain.MeasurementUnitsByType()
}
