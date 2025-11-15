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

func (s *Store) CreateProduct(ctx context.Context, product *domain.Product) error {
	product.ID = uuid.New()
	now := time.Now().UTC()
	product.CreatedAt = now
	product.UpdatedAt = now

	_, err := s.pool.Exec(ctx, `
		INSERT INTO products (
			id, tenant_id, name, description, sku, barcode, recipe_id,
			base_price, suggested_price, tax_rate, margin_percent, packaging_cost,
			image_object_key, category_id, stock_quantity, stock_unit, reorder_point,
			storage_location, active, created_at, updated_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12,
			$13, $14, $15, $16, $17,
			$18, $19, $20, $21
		)
	`,
		product.ID,
		product.TenantID,
		strings.TrimSpace(product.Name),
		strings.TrimSpace(product.Description),
		strings.TrimSpace(strings.ToUpper(product.SKU)),
		strings.TrimSpace(product.Barcode),
		product.RecipeID,
		product.BasePrice,
		product.SuggestedPrice,
		product.TaxRate,
		product.MarginPercent,
		product.PackagingCost,
		strings.TrimSpace(product.ImageObjectKey),
		product.CategoryID,
		product.StockQuantity,
		domain.NormalizeUnit(product.StockUnit),
		product.ReorderPoint,
		strings.TrimSpace(product.StorageLocation),
		product.Active,
		now,
		now,
	)

	return translateError(err)
}

func (s *Store) UpdateProduct(ctx context.Context, product *domain.Product) error {
	product.UpdatedAt = time.Now().UTC()

	commandTag, err := s.pool.Exec(ctx, `
		UPDATE products
		SET name = $3,
		    description = $4,
		    sku = $5,
		    barcode = $6,
		    recipe_id = $7,
		    base_price = $8,
		    suggested_price = $9,
		    tax_rate = $10,
		    margin_percent = $11,
		    packaging_cost = $12,
		    image_object_key = $13,
		    category_id = $14,
		    stock_quantity = $15,
		    stock_unit = $16,
		    reorder_point = $17,
		    storage_location = $18,
		    active = $19,
		    updated_at = $20
		WHERE tenant_id = $1 AND id = $2
	`,
		product.TenantID,
		product.ID,
		strings.TrimSpace(product.Name),
		strings.TrimSpace(product.Description),
		strings.TrimSpace(strings.ToUpper(product.SKU)),
		strings.TrimSpace(product.Barcode),
		product.RecipeID,
		product.BasePrice,
		product.SuggestedPrice,
		product.TaxRate,
		product.MarginPercent,
		product.PackagingCost,
		strings.TrimSpace(product.ImageObjectKey),
		product.CategoryID,
		product.StockQuantity,
		domain.NormalizeUnit(product.StockUnit),
		product.ReorderPoint,
		strings.TrimSpace(product.StorageLocation),
		product.Active,
		product.UpdatedAt,
	)

	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

func (s *Store) GetProduct(ctx context.Context, tenantID, productID uuid.UUID) (*domain.Product, error) {
	var product domain.Product
	err := s.pool.QueryRow(ctx, `
		SELECT id, tenant_id, name, description, sku, barcode, recipe_id, base_price, suggested_price, tax_rate, margin_percent, packaging_cost,
		       image_object_key, category_id, stock_quantity, stock_unit, reorder_point, storage_location, active, created_at, updated_at
		FROM products
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, productID).Scan(
		&product.ID,
		&product.TenantID,
		&product.Name,
		&product.Description,
		&product.SKU,
		&product.Barcode,
		&product.RecipeID,
		&product.BasePrice,
		&product.SuggestedPrice,
		&product.TaxRate,
		&product.MarginPercent,
		&product.PackagingCost,
		&product.ImageObjectKey,
		&product.CategoryID,
		&product.StockQuantity,
		&product.StockUnit,
		&product.ReorderPoint,
		&product.StorageLocation,
		&product.Active,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		return nil, translateError(err)
	}

	product.StockUnit = domain.NormalizeUnit(product.StockUnit)

	return &product, nil
}

func (s *Store) ListProducts(ctx context.Context, tenantID uuid.UUID, filter *ProductListFilter) ([]domain.Product, error) {
	if filter == nil {
		filter = &ProductListFilter{}
	}

	queryBuilder := strings.Builder{}
	queryBuilder.WriteString(`
		SELECT id, tenant_id, name, description, sku, barcode, recipe_id, base_price, suggested_price, tax_rate, margin_percent, packaging_cost,
		       image_object_key, category_id, stock_quantity, stock_unit, reorder_point, storage_location, active, created_at, updated_at
		FROM products
		WHERE tenant_id = $1
	`)

	args := []any{tenantID}
	argPos := 2

	if search := strings.TrimSpace(filter.Search); search != "" {
		args = append(args, "%"+search+"%")
		queryBuilder.WriteString(fmt.Sprintf(" AND (name ILIKE $%d OR sku ILIKE $%d OR barcode ILIKE $%d)", argPos, argPos, argPos))
		argPos++
	}

	if filter.CategoryID != nil {
		args = append(args, *filter.CategoryID)
		queryBuilder.WriteString(fmt.Sprintf(" AND category_id = $%d", argPos))
		argPos++
	}

	if filter.RecipeID != nil {
		args = append(args, *filter.RecipeID)
		queryBuilder.WriteString(fmt.Sprintf(" AND recipe_id = $%d", argPos))
		argPos++
	}

	if filter.Active != nil {
		args = append(args, *filter.Active)
		queryBuilder.WriteString(fmt.Sprintf(" AND active = $%d", argPos))
		argPos++
	}

	switch strings.ToLower(strings.TrimSpace(filter.StockStatus)) {
	case "low":
		queryBuilder.WriteString(" AND (reorder_point > 0 AND stock_quantity > 0 AND stock_quantity <= reorder_point)")
	case "out":
		queryBuilder.WriteString(" AND (stock_quantity <= 0)")
	case "ok":
		queryBuilder.WriteString(" AND (reorder_point = 0 OR stock_quantity > reorder_point)")
	}

	queryBuilder.WriteString(" ORDER BY name ASC")

	rows, err := s.pool.Query(ctx, queryBuilder.String(), args...)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var product domain.Product
		if err := rows.Scan(
			&product.ID,
			&product.TenantID,
			&product.Name,
			&product.Description,
			&product.SKU,
			&product.Barcode,
			&product.RecipeID,
			&product.BasePrice,
			&product.SuggestedPrice,
			&product.TaxRate,
			&product.MarginPercent,
			&product.PackagingCost,
			&product.ImageObjectKey,
			&product.CategoryID,
			&product.StockQuantity,
			&product.StockUnit,
			&product.ReorderPoint,
			&product.StorageLocation,
			&product.Active,
			&product.CreatedAt,
			&product.UpdatedAt,
		); err != nil {
			return nil, translateError(err)
		}
		product.StockUnit = domain.NormalizeUnit(product.StockUnit)

		products = append(products, product)
	}

	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}

	return products, nil
}

func (s *Store) DeleteProduct(ctx context.Context, tenantID, productID uuid.UUID) error {
	commandTag, err := s.pool.Exec(ctx, `
		DELETE FROM products
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, productID)
	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

func (s *Store) DeleteProducts(ctx context.Context, tenantID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}

	_, err := s.pool.Exec(ctx, `
		DELETE FROM products
		WHERE tenant_id = $1 AND id = ANY($2)
	`, tenantID, ids)
	if err != nil {
		return translateError(err)
	}

	return nil
}

func (s *Store) SetProductImage(ctx context.Context, tenantID, productID uuid.UUID, objectKey string) error {
	commandTag, err := s.pool.Exec(ctx, `
		UPDATE products
		SET image_object_key = $3,
		    updated_at = $4
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, productID, strings.TrimSpace(objectKey), time.Now().UTC())
	if err != nil {
		return translateError(err)
	}
	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}
	return nil
}
