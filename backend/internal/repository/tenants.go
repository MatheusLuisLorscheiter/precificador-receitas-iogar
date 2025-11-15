package repository

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

// CreateTenant cria um tenant e retorna o registro completo.
func (s *Store) CreateTenant(ctx context.Context, tenant *domain.Tenant) error {
	return insertTenant(ctx, s.pool, tenant)
}

// CreateTenantTx cria um tenant utilizando a transação fornecida.
func (s *Store) CreateTenantTx(ctx context.Context, tx pgx.Tx, tenant *domain.Tenant) error {
	return insertTenant(ctx, tx, tenant)
}

func insertTenant(ctx context.Context, exec commandExecutor, tenant *domain.Tenant) error {
	tenant.ID = uuid.New()
	now := time.Now().UTC()
	tenant.CreatedAt = now
	tenant.UpdatedAt = now

	query := `
		INSERT INTO tenants (id, name, slug, subdomain, billing_email, timezone, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := exec.Exec(ctx, query,
		tenant.ID,
		strings.TrimSpace(tenant.Name),
		strings.TrimSpace(strings.ToLower(tenant.Slug)),
		strings.TrimSpace(strings.ToLower(tenant.Subdomain)),
		strings.TrimSpace(strings.ToLower(tenant.BillingEmail)),
		strings.TrimSpace(tenant.Timezone),
		now,
		now,
	)

	return translateError(err)
}

// GetTenantByID retorna um tenant pelo identificador.
func (s *Store) GetTenantByID(ctx context.Context, id uuid.UUID) (*domain.Tenant, error) {
	query := `
		SELECT id, name, slug, subdomain, billing_email, timezone, created_at, updated_at
		FROM tenants
		WHERE id = $1
	`

	var tenant domain.Tenant
	err := s.pool.QueryRow(ctx, query, id).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Subdomain,
		&tenant.BillingEmail,
		&tenant.Timezone,
		&tenant.CreatedAt,
		&tenant.UpdatedAt,
	)

	if err != nil {
		return nil, translateError(err)
	}

	return &tenant, nil
}

// GetTenantBySlug retorna um tenant a partir do slug único.
func (s *Store) GetTenantBySlug(ctx context.Context, slug string) (*domain.Tenant, error) {
	query := `
		SELECT id, name, slug, subdomain, billing_email, timezone, created_at, updated_at
		FROM tenants
		WHERE slug = $1
	`

	var tenant domain.Tenant
	err := s.pool.QueryRow(ctx, query, strings.ToLower(slug)).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.Subdomain,
		&tenant.BillingEmail,
		&tenant.Timezone,
		&tenant.CreatedAt,
		&tenant.UpdatedAt,
	)

	if err != nil {
		return nil, translateError(err)
	}

	return &tenant, nil
}

// UpdateTenant atualiza dados básicos do tenant.
func (s *Store) UpdateTenant(ctx context.Context, tenant *domain.Tenant) error {
	tenant.UpdatedAt = time.Now().UTC()

	commandTag, err := s.pool.Exec(ctx, `
		UPDATE tenants
		SET name = $2,
		    slug = $3,
		    subdomain = $4,
		    billing_email = $5,
		    timezone = $6,
		    updated_at = $7
		WHERE id = $1
	`, tenant.ID, strings.TrimSpace(tenant.Name), strings.ToLower(strings.TrimSpace(tenant.Slug)),
		strings.ToLower(strings.TrimSpace(tenant.Subdomain)), strings.ToLower(strings.TrimSpace(tenant.BillingEmail)),
		strings.TrimSpace(tenant.Timezone), tenant.UpdatedAt)

	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

// DeleteTenant remove definitivamente um tenant e todos os seus dados.
func (s *Store) DeleteTenant(ctx context.Context, tenantID uuid.UUID) error {
	commandTag, err := s.pool.Exec(ctx, `
		DELETE FROM tenants
		WHERE id = $1
	`, tenantID)
	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}
