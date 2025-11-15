package repository

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

func (s *Store) CreateCategory(ctx context.Context, category *domain.Category) error {
    if category.ID == uuid.Nil {
        category.ID = uuid.New()
    }
    now := time.Now().UTC()
    category.CreatedAt = now
    category.UpdatedAt = now
    category.Name = strings.TrimSpace(category.Name)
    category.Slug = strings.TrimSpace(strings.ToLower(category.Slug))

    _, err := s.pool.Exec(ctx, `
        INSERT INTO categories (id, tenant_id, name, slug, type, color, icon, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
        category.ID,
        category.TenantID,
        category.Name,
        category.Slug,
        category.Type,
        category.Color,
        category.Icon,
        category.SortOrder,
        category.CreatedAt,
        category.UpdatedAt,
    )
    return translateError(err)
}

func (s *Store) UpdateCategory(ctx context.Context, category *domain.Category) error {
    category.Name = strings.TrimSpace(category.Name)
    category.Slug = strings.TrimSpace(strings.ToLower(category.Slug))
    category.UpdatedAt = time.Now().UTC()

    commandTag, err := s.pool.Exec(ctx, `
        UPDATE categories
        SET name = $4,
            slug = $5,
            color = $6,
            icon = $7,
            sort_order = $8,
            updated_at = $9
        WHERE tenant_id = $2 AND id = $3 AND type = $1 AND deleted_at IS NULL
    `,
        category.Type,
        category.TenantID,
        category.ID,
        category.Name,
        category.Slug,
        category.Color,
        category.Icon,
        category.SortOrder,
        category.UpdatedAt,
    )

    if err != nil {
        return translateError(err)
    }
    if commandTag.RowsAffected() == 0 {
        return translateError(pgx.ErrNoRows)
    }
    return nil
}

func (s *Store) ListCategories(ctx context.Context, tenantID uuid.UUID, categoryType string) ([]domain.Category, error) {
    rows, err := s.pool.Query(ctx, `
        SELECT id, tenant_id, name, slug, type, color, icon, sort_order, created_at, updated_at
        FROM categories
        WHERE tenant_id = $1 AND type = $2 AND deleted_at IS NULL
        ORDER BY sort_order ASC, name ASC
    `, tenantID, categoryType)
    if err != nil {
        return nil, translateError(err)
    }
    defer rows.Close()

    var result []domain.Category
    for rows.Next() {
        var category domain.Category
        if err := rows.Scan(
            &category.ID,
            &category.TenantID,
            &category.Name,
            &category.Slug,
            &category.Type,
            &category.Color,
            &category.Icon,
            &category.SortOrder,
            &category.CreatedAt,
            &category.UpdatedAt,
        ); err != nil {
            return nil, translateError(err)
        }
        result = append(result, category)
    }
    if err := rows.Err(); err != nil {
        return nil, translateError(err)
    }
    return result, nil
}

func (s *Store) GetCategory(ctx context.Context, tenantID, categoryID uuid.UUID) (*domain.Category, error) {
    var category domain.Category
    err := s.pool.QueryRow(ctx, `
        SELECT id, tenant_id, name, slug, type, color, icon, sort_order, created_at, updated_at
        FROM categories
        WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
    `, tenantID, categoryID).Scan(
        &category.ID,
        &category.TenantID,
        &category.Name,
        &category.Slug,
        &category.Type,
        &category.Color,
        &category.Icon,
        &category.SortOrder,
        &category.CreatedAt,
        &category.UpdatedAt,
    )
    if err != nil {
        return nil, translateError(err)
    }
    return &category, nil
}

func (s *Store) SoftDeleteCategory(ctx context.Context, tenantID, categoryID uuid.UUID) error {
    commandTag, err := s.pool.Exec(ctx, `
        UPDATE categories
        SET deleted_at = $3, updated_at = $3
        WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
    `, tenantID, categoryID, time.Now().UTC())
    if err != nil {
        return translateError(err)
    }
    if commandTag.RowsAffected() == 0 {
        return translateError(pgx.ErrNoRows)
    }
    return nil
}
