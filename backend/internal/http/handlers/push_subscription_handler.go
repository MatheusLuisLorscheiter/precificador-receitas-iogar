package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
)

// PushSubscriptionHandler expõe endpoints para inscrições Web Push.
type PushSubscriptionHandler struct {
	service *service.PushSubscriptionService
	logger  *zerolog.Logger
}

func NewPushSubscriptionHandler(service *service.PushSubscriptionService, logger *zerolog.Logger) *PushSubscriptionHandler {
	return &PushSubscriptionHandler{service: service, logger: logger}
}

type pushSubscriptionKeys struct {
	Auth   string `json:"auth"`
	P256dh string `json:"p256dh"`
}

type pushSubscriptionRequest struct {
	Endpoint       string               `json:"endpoint"`
	Keys           pushSubscriptionKeys `json:"keys"`
	UserAgent      string               `json:"user_agent"`
	Platform       string               `json:"platform"`
	LastUsedAt     *time.Time           `json:"last_used_at"`
	ExpiresAt      *time.Time           `json:"expires_at"`
	ExpirationTime *int64               `json:"expirationTime"`
}

type deletePushSubscriptionRequest struct {
	Endpoint string `json:"endpoint"`
}

// Subscribe registra ou atualiza uma inscrição.
func (h *PushSubscriptionHandler) Subscribe(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req pushSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	sub := &domain.PushSubscription{
		TenantID:   claims.TenantID,
		UserID:     claims.UserID,
		Endpoint:   req.Endpoint,
		Auth:       req.Keys.Auth,
		P256dh:     req.Keys.P256dh,
		UserAgent:  req.UserAgent,
		Platform:   req.Platform,
		LastUsedAt: req.LastUsedAt,
		ExpiresAt:  pickExpires(req.ExpiresAt, req.ExpirationTime),
	}

	if err := h.service.Upsert(r.Context(), sub); err != nil {
		h.logger.Error().Err(err).Msg("failed to upsert push subscription")
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusCreated, sub)
}

// ListMine retorna as inscrições do usuário autenticado.
func (h *PushSubscriptionHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	subs, err := h.service.ListByUser(r.Context(), claims.TenantID, claims.UserID)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to list push subscriptions")
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, subs)
}

// Delete remove uma inscrição específica.
func (h *PushSubscriptionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req deletePushSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.service.Delete(r.Context(), claims.TenantID, claims.UserID, req.Endpoint); err != nil {
		h.logger.Error().Err(err).Msg("failed to delete push subscription")
		httputil.Error(w, err)
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{"message": "subscription deleted"})
}

// pickExpires converte expirationTime em *time.Time caso expiresAt não seja informado.
func pickExpires(expiresAt *time.Time, expirationMs *int64) *time.Time {
	if expiresAt != nil {
		t := expiresAt.UTC()
		return &t
	}
	if expirationMs == nil || *expirationMs <= 0 {
		return nil
	}
	t := time.UnixMilli(*expirationMs).UTC()
	return &t
}
