package repository

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
)

// CreateUser insere um novo usuário associado a um tenant.
func (s *Store) CreateUser(ctx context.Context, user *domain.User) error {
	return insertUser(ctx, s.pool, user)
}

// CreateUserTx cria um usuário utilizando a transação fornecida.
func (s *Store) CreateUserTx(ctx context.Context, tx pgx.Tx, user *domain.User) error {
	return insertUser(ctx, tx, user)
}

func insertUser(ctx context.Context, exec commandExecutor, user *domain.User) error {
	user.ID = uuid.New()
	now := time.Now().UTC()
	user.CreatedAt = now
	user.UpdatedAt = now

	query := `
		INSERT INTO users (id, tenant_id, name, email, role, password_hash, active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	_, err := exec.Exec(ctx, query,
		user.ID,
		user.TenantID,
		strings.TrimSpace(user.Name),
		strings.ToLower(strings.TrimSpace(user.Email)),
		strings.ToUpper(strings.TrimSpace(user.Role)),
		user.Password,
		user.Active,
		now,
		now,
	)

	return translateError(err)
}

// GetUserByEmail retorna um usuário pelo e-mail dentro de um tenant.
func (s *Store) GetUserByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*domain.User, error) {
	query := `
		SELECT id, tenant_id, name, email, role, password_hash, active, created_at, updated_at
		FROM users
		WHERE tenant_id = $1 AND email = $2
	`

	var user domain.User
	err := s.pool.QueryRow(ctx, query, tenantID, strings.ToLower(strings.TrimSpace(email))).Scan(
		&user.ID,
		&user.TenantID,
		&user.Name,
		&user.Email,
		&user.Role,
		&user.Password,
		&user.Active,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, translateError(err)
	}

	return &user, nil
}

// GetUserByID retorna um usuário pelo identificador dentro do tenant.
func (s *Store) GetUserByID(ctx context.Context, tenantID, userID uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, tenant_id, name, email, role, password_hash, active, created_at, updated_at
		FROM users
		WHERE tenant_id = $1 AND id = $2
	`

	var user domain.User
	err := s.pool.QueryRow(ctx, query, tenantID, userID).Scan(
		&user.ID,
		&user.TenantID,
		&user.Name,
		&user.Email,
		&user.Role,
		&user.Password,
		&user.Active,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, translateError(err)
	}

	return &user, nil
}

// ListUsers retorna todos os usuários pertencentes a um tenant.
func (s *Store) ListUsers(ctx context.Context, tenantID uuid.UUID) ([]domain.User, error) {
	query := `
		SELECT id, tenant_id, name, email, role, password_hash, active, created_at, updated_at
		FROM users
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.pool.Query(ctx, query, tenantID)
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var result []domain.User
	for rows.Next() {
		var user domain.User
		if err := rows.Scan(
			&user.ID,
			&user.TenantID,
			&user.Name,
			&user.Email,
			&user.Role,
			&user.Password,
			&user.Active,
			&user.CreatedAt,
			&user.UpdatedAt,
		); err != nil {
			return nil, translateError(err)
		}
		result = append(result, user)
	}

	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}

	return result, nil
}

// UpdateUser atualiza as propriedades mutáveis de um usuário.
func (s *Store) UpdateUser(ctx context.Context, user *domain.User) error {
	user.UpdatedAt = time.Now().UTC()

	commandTag, err := s.pool.Exec(ctx, `
		UPDATE users
		SET name = $3,
		    role = $4,
		    active = $5,
		    updated_at = $6
		WHERE tenant_id = $1 AND id = $2
	`, user.TenantID, user.ID, strings.TrimSpace(user.Name), strings.ToUpper(strings.TrimSpace(user.Role)), user.Active, user.UpdatedAt)

	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

// UpdateUserPassword atualiza a senha do usuário.
func (s *Store) UpdateUserPassword(ctx context.Context, tenantID, userID uuid.UUID, passwordHash string) error {
	commandTag, err := s.pool.Exec(ctx, `
		UPDATE users
		SET password_hash = $3,
		    updated_at = $4
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, userID, passwordHash, time.Now().UTC())

	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

// DeleteUser remove um usuário do tenant informado.
func (s *Store) DeleteUser(ctx context.Context, tenantID, userID uuid.UUID) error {
	commandTag, err := s.pool.Exec(ctx, `
		DELETE FROM users
		WHERE tenant_id = $1 AND id = $2
	`, tenantID, userID)
	if err != nil {
		return translateError(err)
	}

	if commandTag.RowsAffected() == 0 {
		return translateError(pgx.ErrNoRows)
	}

	return nil
}

// FindTenantsByUserEmail retorna todos os tenants onde o usuário possui conta.
func (s *Store) FindTenantsByUserEmail(ctx context.Context, email string) ([]domain.Tenant, error) {
	query := `
		SELECT DISTINCT t.id, t.name, t.slug, t.subdomain, t.timezone, t.billing_email, t.created_at, t.updated_at
		FROM tenants t
		INNER JOIN users u ON u.tenant_id = t.id
		WHERE LOWER(u.email) = LOWER($1)
		ORDER BY t.name ASC
	`

	rows, err := s.pool.Query(ctx, query, strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		return nil, translateError(err)
	}
	defer rows.Close()

	var result []domain.Tenant
	for rows.Next() {
		var tenant domain.Tenant
		if err := rows.Scan(
			&tenant.ID,
			&tenant.Name,
			&tenant.Slug,
			&tenant.Subdomain,
			&tenant.Timezone,
			&tenant.BillingEmail,
			&tenant.CreatedAt,
			&tenant.UpdatedAt,
		); err != nil {
			return nil, translateError(err)
		}
		result = append(result, tenant)
	}

	if err := rows.Err(); err != nil {
		return nil, translateError(err)
	}

	return result, nil
}
