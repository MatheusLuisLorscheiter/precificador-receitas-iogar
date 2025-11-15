package requestctx

import (
	"context"

	"github.com/google/uuid"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/auth"
)

type ctxKey string

const (
	tenantIDKey ctxKey = "tenant_id"
	userIDKey   ctxKey = "user_id"
	roleKey     ctxKey = "role"
	claimsKey   ctxKey = "auth_claims"
)

// WithClaims injeta as claims completas no contexto e deriva campos auxiliares.
func WithClaims(ctx context.Context, claims *auth.Claims) context.Context {
	if ctx == nil || claims == nil {
		return ctx
	}
	ctx = context.WithValue(ctx, claimsKey, claims)
	ctx = WithTenantID(ctx, claims.TenantID)
	ctx = WithUserID(ctx, claims.UserID)
	ctx = WithRole(ctx, claims.Role)
	return ctx
}

// GetClaims retorna as claims armazenadas no contexto.
func GetClaims(ctx context.Context) *auth.Claims {
	if ctx == nil {
		return nil
	}
	claims, _ := ctx.Value(claimsKey).(*auth.Claims)
	return claims
}

// WithTenantID adiciona o identificador do tenant ao contexto.
func WithTenantID(ctx context.Context, tenantID uuid.UUID) context.Context {
	return context.WithValue(ctx, tenantIDKey, tenantID)
}

// TenantID retorna o tenant presente no contexto.
func TenantID(ctx context.Context) (uuid.UUID, bool) {
	value := ctx.Value(tenantIDKey)
	if value == nil {
		return uuid.Nil, false
	}
	id, ok := value.(uuid.UUID)
	return id, ok && id != uuid.Nil
}

// WithUserID adiciona o identificador do usuário ao contexto.
func WithUserID(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// UserID recupera o usuário do contexto.
func UserID(ctx context.Context) (uuid.UUID, bool) {
	value := ctx.Value(userIDKey)
	if value == nil {
		return uuid.Nil, false
	}
	id, ok := value.(uuid.UUID)
	return id, ok && id != uuid.Nil
}

// WithRole adiciona a role do usuário ao contexto.
func WithRole(ctx context.Context, role string) context.Context {
	return context.WithValue(ctx, roleKey, role)
}

// Role obtém a role armazenada no contexto.
func Role(ctx context.Context) (string, bool) {
	value := ctx.Value(roleKey)
	role, ok := value.(string)
	return role, ok && role != ""
}
