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

func (s *Store) CreateRecipe(ctx context.Context, recipe *domain.Recipe) error {
	recipe.ID = uuid.New()
	now := time.Now().UTC()
	recipe.CreatedAt = now
	recipe.UpdatedAt = now

	return s.ExecTx(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `
			INSERT INTO recipes (id, tenant_id, name, description, yield_quantity, yield_unit, production_time, notes, category_id, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, recipe.ID, recipe.TenantID, strings.TrimSpace(recipe.Name), strings.TrimSpace(recipe.Description), recipe.YieldQuantity, strings.TrimSpace(recipe.YieldUnit), recipe.ProductionTime, strings.TrimSpace(recipe.Notes), recipe.CategoryID, now, now); err != nil {
			return translateError(err)
		}

		for i := range recipe.Items {
			recipe.Items[i].ID = uuid.New()
			recipe.Items[i].TenantID = recipe.TenantID
			recipe.Items[i].RecipeID = recipe.ID
			recipe.Items[i].CreatedAt = now
			recipe.Items[i].UpdatedAt = now
			item := recipe.Items[i]

			if _, err := tx.Exec(ctx, `
				INSERT INTO recipe_items (id, tenant_id, recipe_id, ingredient_id, quantity, unit, waste_factor, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			`, item.ID, item.TenantID, item.RecipeID, item.IngredientID, item.Quantity, strings.TrimSpace(item.Unit), item.WasteFactor, item.CreatedAt, item.UpdatedAt); err != nil {
				return translateError(err)
			}
		}

		return nil
	})
}

func (s *Store) UpdateRecipe(ctx context.Context, recipe *domain.Recipe) error {
	recipe.UpdatedAt = time.Now().UTC()

	return s.ExecTx(ctx, func(tx pgx.Tx) error {
		commandTag, err := tx.Exec(ctx, `
			UPDATE recipes
			SET name = $3,
			    description = $4,
			    yield_quantity = $5,
			    yield_unit = $6,
			    production_time = $7,
			    notes = $8,
			    category_id = $9,
			    updated_at = $10
			WHERE tenant_id = $1 AND id = $2
		`, recipe.TenantID, recipe.ID, strings.TrimSpace(recipe.Name), strings.TrimSpace(recipe.Description), recipe.YieldQuantity, strings.TrimSpace(recipe.YieldUnit), recipe.ProductionTime, strings.TrimSpace(recipe.Notes), recipe.CategoryID, recipe.UpdatedAt)
		if err != nil {
			return translateError(err)
		}
		if commandTag.RowsAffected() == 0 {
			return translateError(pgx.ErrNoRows)
		}

		if _, err := tx.Exec(ctx, `
			DELETE FROM recipe_items
			WHERE tenant_id = $1 AND recipe_id = $2
		`, recipe.TenantID, recipe.ID); err != nil {
			return translateError(err)
		}

		for i := range recipe.Items {
			recipe.Items[i].ID = uuid.New()
			recipe.Items[i].TenantID = recipe.TenantID
			recipe.Items[i].RecipeID = recipe.ID
			recipe.Items[i].CreatedAt = recipe.UpdatedAt
			recipe.Items[i].UpdatedAt = recipe.UpdatedAt
			item := recipe.Items[i]

			if _, err := tx.Exec(ctx, `
				INSERT INTO recipe_items (id, tenant_id, recipe_id, ingredient_id, quantity, unit, waste_factor, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			`, item.ID, item.TenantID, item.RecipeID, item.IngredientID, item.Quantity, strings.TrimSpace(item.Unit), item.WasteFactor, item.CreatedAt, item.UpdatedAt); err != nil {
				return translateError(err)
			}
		}

		return nil
	})
}

func (s *Store) GetRecipe(ctx context.Context, tenantID, recipeID uuid.UUID) (*domain.Recipe, error) {
	query := `
		SELECT id, tenant_id, name, description, yield_quantity, yield_unit, production_time, notes, category_id, created_at, updated_at
		FROM recipes
		WHERE tenant_id = $1 AND id = $2
	`

	var recipe domain.Recipe
	err := s.pool.QueryRow(ctx, query, tenantID, recipeID).Scan(
		&recipe.ID,
		&recipe.TenantID,
		&recipe.Name,
		&recipe.Description,
		&recipe.YieldQuantity,
		&recipe.YieldUnit,
		&recipe.ProductionTime,
		&recipe.Notes,
		&recipe.CategoryID,
		&recipe.CreatedAt,
		&recipe.UpdatedAt,
	)
	if err != nil {
		return nil, translateError(err)
	}

	recipe.YieldUnit = domain.NormalizeUnit(recipe.YieldUnit)
	items, err := s.listRecipeItems(ctx, tenantID, recipe.ID)
	if err != nil {
		return nil, err
	}
	recipe.Items = items

	return &recipe, nil
}

func (s *Store) listRecipeItems(ctx context.Context, tenantID, recipeID uuid.UUID) ([]domain.RecipeItem, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, tenant_id, recipe_id, ingredient_id, quantity, unit, waste_factor, created_at, updated_at
		FROM recipe_items
		WHERE tenant_id = $1 AND recipe_id = $2
		ORDER BY created_at ASC
	`, tenantID, recipeID)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var result []domain.RecipeItem
	for rows.Next() {
		var item domain.RecipeItem
		if err := rows.Scan(&item.ID, &item.TenantID, &item.RecipeID, &item.IngredientID, &item.Quantity, &item.Unit, &item.WasteFactor, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, translateError(err)
		}
		item.Unit = domain.NormalizeUnit(item.Unit)
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}

	return result, nil
}

func (s *Store) ListRecipes(ctx context.Context, tenantID uuid.UUID, filter *RecipeListFilter) ([]domain.Recipe, error) {
	if filter == nil {
		filter = &RecipeListFilter{}
	}

	queryBuilder := strings.Builder{}
	queryBuilder.WriteString(`
		SELECT id, tenant_id, name, description, yield_quantity, yield_unit, production_time, notes, category_id, created_at, updated_at
		FROM recipes
		WHERE tenant_id = $1
	`)

	args := []any{tenantID}
	argPos := 2

	if search := strings.TrimSpace(filter.Search); search != "" {
		args = append(args, "%"+search+"%")
		queryBuilder.WriteString(fmt.Sprintf(" AND (name ILIKE $%d OR description ILIKE $%d)", argPos, argPos))
		argPos++
	}

	if filter.CategoryID != nil {
		args = append(args, *filter.CategoryID)
		queryBuilder.WriteString(fmt.Sprintf(" AND category_id = $%d", argPos))
		argPos++
	}

	queryBuilder.WriteString(" ORDER BY name ASC")

	rows, err := s.pool.Query(ctx, queryBuilder.String(), args...)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var recipes []domain.Recipe
	for rows.Next() {
		var recipe domain.Recipe
		if err := rows.Scan(
			&recipe.ID,
			&recipe.TenantID,
			&recipe.Name,
			&recipe.Description,
			&recipe.YieldQuantity,
			&recipe.YieldUnit,
			&recipe.ProductionTime,
			&recipe.Notes,
			&recipe.CategoryID,
			&recipe.CreatedAt,
			&recipe.UpdatedAt,
		); err != nil {
			return nil, translateError(err)
		}

		recipe.YieldUnit = domain.NormalizeUnit(recipe.YieldUnit)
		items, err := s.listRecipeItems(ctx, tenantID, recipe.ID)
		if err != nil {
			return nil, err
		}
		recipe.Items = items

		recipes = append(recipes, recipe)
	}

	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}

	return recipes, nil
}

func (s *Store) DeleteRecipe(ctx context.Context, tenantID, recipeID uuid.UUID) error {
	return s.ExecTx(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `
			DELETE FROM recipe_items
			WHERE tenant_id = $1 AND recipe_id = $2
		`, tenantID, recipeID); err != nil {
			return translateError(err)
		}

		commandTag, err := tx.Exec(ctx, `
			DELETE FROM recipes
			WHERE tenant_id = $1 AND id = $2
		`, tenantID, recipeID)
		if err != nil {
			return translateError(err)
		}
		if commandTag.RowsAffected() == 0 {
			return translateError(pgx.ErrNoRows)
		}

		return nil
	})
}

func (s *Store) DeleteRecipes(ctx context.Context, tenantID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}

	return s.ExecTx(ctx, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `
			DELETE FROM recipe_items
			WHERE tenant_id = $1 AND recipe_id = ANY($2)
		`, tenantID, ids); err != nil {
			return translateError(err)
		}

		if _, err := tx.Exec(ctx, `
			DELETE FROM recipes
			WHERE tenant_id = $1 AND id = ANY($2)
		`, tenantID, ids); err != nil {
			return translateError(err)
		}

		return nil
	})
}

func (s *Store) AddRecipeItem(ctx context.Context, item *domain.RecipeItem) error {
	item.ID = uuid.New()
	now := time.Now().UTC()
	item.CreatedAt = now
	item.UpdatedAt = now

	_, err := s.pool.Exec(ctx, `
		INSERT INTO recipe_items (id, tenant_id, recipe_id, ingredient_id, quantity, unit, waste_factor, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, item.ID, item.TenantID, item.RecipeID, item.IngredientID, item.Quantity, strings.TrimSpace(item.Unit), item.WasteFactor, item.CreatedAt, item.UpdatedAt)

	return translateError(err)
}

func (s *Store) RemoveRecipeItem(ctx context.Context, tenantID, itemID uuid.UUID) error {
	commandTag, err := s.pool.Exec(ctx, `
		DELETE FROM recipe_items
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, itemID)
	if err != nil {
		return translateError(err)
	}
	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}
	return nil
}
