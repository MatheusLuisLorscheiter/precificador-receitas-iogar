package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgconn"
)

// commandExecutor define uma interface mínima para executar comandos SQL.
type commandExecutor interface {
    Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
}
