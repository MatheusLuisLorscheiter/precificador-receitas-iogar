package repository

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store reúne os repositórios persistentes da aplicação.
type Store struct {
	pool *pgxpool.Pool
}

// New cria um Store baseado no pool informado.
func New(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

// ExecTx executa a função informada dentro de uma transação, garantindo commit/rollback apropriados.
func (s *Store) ExecTx(ctx context.Context, fn func(pgx.Tx) error) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}

	if err := fn(tx); err != nil {
		tx.Rollback(ctx)
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		tx.Rollback(ctx)
		return err
	}

	return nil
}
