package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

func (s *Store) CreateIngredient(ctx context.Context, ingredient *domain.Ingredient) error {
	ingredient.ID = uuid.New()
	now := time.Now().UTC()
	ingredient.CreatedAt = now
	ingredient.UpdatedAt = now

	_, err := s.pool.Exec(ctx, `
		INSERT INTO ingredients (id, tenant_id, name, unit, cost_per_unit, supplier, lead_time_days, min_stock_level, current_stock, storage_location, category_id, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`,
		ingredient.ID,
		ingredient.TenantID,
		strings.TrimSpace(ingredient.Name),
		domain.NormalizeUnit(ingredient.Unit),
		ingredient.CostPerUnit,
		strings.TrimSpace(ingredient.Supplier),
		ingredient.LeadTimeDays,
		ingredient.MinStockLevel,
		ingredient.CurrentStock,
		strings.TrimSpace(ingredient.StorageLocation),
		ingredient.CategoryID,
		strings.TrimSpace(ingredient.Notes),
		now,
		now,
	)

	return translateError(err)
}

func (s *Store) UpdateIngredient(ctx context.Context, ingredient *domain.Ingredient) error {
	ingredient.UpdatedAt = time.Now().UTC()

	commandTag, err := s.pool.Exec(ctx, `
		UPDATE ingredients
		SET name = $3,
			unit = $4,
			cost_per_unit = $5,
			supplier = $6,
			lead_time_days = $7,
			min_stock_level = $8,
			current_stock = $9,
			storage_location = $10,
			category_id = $11,
			notes = $12,
			updated_at = $13
		WHERE tenant_id = $1 AND id = $2
	`,
		ingredient.TenantID,
		ingredient.ID,
		strings.TrimSpace(ingredient.Name),
		domain.NormalizeUnit(ingredient.Unit),
		ingredient.CostPerUnit,
		strings.TrimSpace(ingredient.Supplier),
		ingredient.LeadTimeDays,
		ingredient.MinStockLevel,
		ingredient.CurrentStock,
		strings.TrimSpace(ingredient.StorageLocation),
		ingredient.CategoryID,
		strings.TrimSpace(ingredient.Notes),
		ingredient.UpdatedAt,
	)

	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

func (s *Store) GetIngredient(ctx context.Context, tenantID, ingredientID uuid.UUID) (*domain.Ingredient, error) {
	var ingredient domain.Ingredient
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, name, unit, cost_per_unit, supplier, lead_time_days, min_stock_level, current_stock, storage_location, category_id, notes, created_at, updated_at
		FROM ingredients
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, ingredientID).Scan(
		&ingredient.ID,
		&ingredient.TenantID,
		&ingredient.Name,
		&ingredient.Unit,
		&ingredient.CostPerUnit,
		&ingredient.Supplier,
		&ingredient.LeadTimeDays,
		&ingredient.MinStockLevel,
		&ingredient.CurrentStock,
		&ingredient.StorageLocation,
		&ingredient.CategoryID,
		&ingredient.Notes,
		&ingredient.CreatedAt,
		&ingredient.UpdatedAt,
	)
	if err != nil {
		return nil, translateError(err)
	}

	ingredient.Unit = domain.NormalizeUnit(ingredient.Unit)
	return &ingredient, nil
}

func (s *Store) ListIngredients(ctx context.Context, tenantID uuid.UUID, filter *IngredientListFilter) ([]domain.Ingredient, error) {
	if filter == nil {
		filter = &IngredientListFilter{}
	}

	queryBuilder := strings.Builder{}
	queryBuilder.WriteString(`
		SELECT id, tenant_id, name, unit, cost_per_unit, supplier, lead_time_days, min_stock_level, current_stock, storage_location, category_id, notes, created_at, updated_at
		FROM ingredients
		WHERE tenant_id = $1
	`)

	args := []any{tenantID}
	argPos := 2

	if search := strings.TrimSpace(filter.Search); search != "" {
		args = append(args, "%"+search+"%")
		queryBuilder.WriteString(fmt.Sprintf(" AND (name ILIKE $%d OR supplier ILIKE $%d)", argPos, argPos))
		argPos++
	}

	if supplier := strings.TrimSpace(filter.Supplier); supplier != "" {
		args = append(args, "%"+supplier+"%")
		queryBuilder.WriteString(fmt.Sprintf(" AND supplier ILIKE $%d", argPos))
		argPos++
	}

	if unit := strings.TrimSpace(filter.Unit); unit != "" {
		args = append(args, domain.NormalizeUnit(unit))
		queryBuilder.WriteString(fmt.Sprintf(" AND unit = $%d", argPos))
		argPos++
	}

	if filter.CategoryID != nil {
		args = append(args, *filter.CategoryID)
		queryBuilder.WriteString(fmt.Sprintf(" AND category_id = $%d", argPos))
		argPos++
	}

	switch strings.ToLower(strings.TrimSpace(filter.StockStatus)) {
	case "low":
		queryBuilder.WriteString(" AND (min_stock_level > 0 AND current_stock > 0 AND current_stock <= min_stock_level)")
	case "out":
		queryBuilder.WriteString(" AND current_stock <= 0")
	case "ok":
		queryBuilder.WriteString(" AND (min_stock_level = 0 OR current_stock > min_stock_level)")
	}

	queryBuilder.WriteString(" ORDER BY name ASC")

	rows, err := s.pool.Query(ctx, queryBuilder.String(), args...)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var items []domain.Ingredient
	for rows.Next() {
		var ingredient domain.Ingredient
		if err := rows.Scan(
			&ingredient.ID,
			&ingredient.TenantID,
			&ingredient.Name,
			&ingredient.Unit,
			&ingredient.CostPerUnit,
			&ingredient.Supplier,
			&ingredient.LeadTimeDays,
			&ingredient.MinStockLevel,
			&ingredient.CurrentStock,
			&ingredient.StorageLocation,
			&ingredient.CategoryID,
			&ingredient.Notes,
			&ingredient.CreatedAt,
			&ingredient.UpdatedAt,
		); err != nil {
			return nil, translateError(err)
		}
		ingredient.Unit = domain.NormalizeUnit(ingredient.Unit)
		items = append(items, ingredient)
	}

	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}

	return items, nil
}

func (s *Store) DeleteIngredient(ctx context.Context, tenantID, ingredientID uuid.UUID) error {
	commandTag, err := s.pool.Exec(ctx, `
		DELETE FROM ingredients
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, ingredientID)
	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

func (s *Store) DeleteIngredients(ctx context.Context, tenantID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}

	_, err := s.pool.Exec(ctx, `
		DELETE FROM ingredients
		WHERE tenant_id = $1 AND id = ANY($2)
	`, tenantID, ids)
	if err != nil {
		return translateError(err)
	}

	return nil
}
