package middleware

import (
	"net/http"
	"strings"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/auth"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/rs/zerolog"
)

// Auth é um middleware que valida o JWT e injeta os claims no contexto.
func Auth(logger *zerolog.Logger, manager *auth.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if manager == nil {
				logger.Error().Msg("token manager não configurado")
				httputil.RespondError(w, http.StatusInternalServerError, "authentication service unavailable")
				return
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				httputil.RespondError(w, http.StatusUnauthorized, "missing authorization header")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				httputil.RespondError(w, http.StatusUnauthorized, "invalid authorization format")
				return
			}

			token := parts[1]
			claims, err := manager.ValidateToken(token)
			if err != nil {
				logger.Debug().Err(err).Msg("invalid token")
				httputil.RespondError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			// Injetar claims no contexto
			ctx := requestctx.WithClaims(r.Context(), claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// TenantIsolation garante que todas as operações respeitam o tenant_id do JWT.
// Este middleware deve ser usado após o Auth middleware.
func TenantIsolation(logger *zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := requestctx.GetClaims(r.Context())
			if claims == nil {
				logger.Error().Msg("tenant isolation middleware called without auth claims")
				httputil.RespondError(w, http.StatusUnauthorized, "unauthorized")
				return
			}

			if claims.TenantID.String() == "" || claims.TenantID.String() == "00000000-0000-0000-0000-000000000000" {
				logger.Error().Msg("invalid tenant_id in JWT claims")
				httputil.RespondError(w, http.StatusForbidden, "invalid tenant context")
				return
			}

			// Logar tenant_id para auditoria
			logger.Debug().
				Str("tenant_id", claims.TenantID.String()).
				Str("user_id", claims.Subject).
				Str("path", r.URL.Path).
				Msg("tenant-isolated request")

			next.ServeHTTP(w, r)
		})
	}
}

// CORS adiciona headers de CORS para permitir acesso do frontend.
func CORS() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			
			// Lista de origens permitidas (adicione mais conforme necessário)
			allowedOrigins := map[string]bool{
				"https://precificador-frontend.dmb6un.easypanel.host": true,
				"http://localhost:3000": true,
				"http://localhost:5173": true,
			}
			
			// Se a origem está na lista, permitir
			if allowedOrigins[origin] {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}
			
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// SecurityHeaders adiciona headers de segurança às respostas.
func SecurityHeaders() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
			w.Header().Set("Content-Security-Policy", "default-src 'self'")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

			next.ServeHTTP(w, r)
		})
	}
}

// RecoverPanic recupera de panics e retorna um erro 500.
func RecoverPanic(logger *zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					logger.Error().
						Interface("panic", err).
						Str("method", r.Method).
						Str("path", r.URL.Path).
						Msg("recovered from panic")

					httputil.RespondError(w, http.StatusInternalServerError, "internal server error")
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
