package handlers

import (
	"net/http"

	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
)

// MeasurementHandler responde com unidades de medida suportadas.
type MeasurementHandler struct {
	service *service.MeasurementService
	logger  *zerolog.Logger
}

func NewMeasurementHandler(service *service.MeasurementService, logger *zerolog.Logger) *MeasurementHandler {
	return &MeasurementHandler{service: service, logger: logger}
}

func (h *MeasurementHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	response := map[string]any{
		"units":  h.service.List(r.Context()),
		"groups": h.service.Grouped(r.Context()),
	}

	httputil.RespondJSON(w, http.StatusOK, response)
}
