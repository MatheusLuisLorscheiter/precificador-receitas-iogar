package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/config"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/database"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/logger"
)

const migrationTable = `
CREATE TABLE IF NOT EXISTS schema_migrations (
	version VARCHAR(255) PRIMARY KEY,
	applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "Erro: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	// Carregar configuração
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("falha ao carregar configuração: %w", err)
	}

	log := logger.New(cfg.App.Env)
	log.Info().Msg("Iniciando migration tool")

	ctx := context.Background()

	// Conectar ao Postgres
	db, err := database.Connect(ctx, cfg.PostgresDSN(), 5)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao postgres: %w", err)
	}
	defer db.Close()

	// Criar tabela de migrations se não existir
	if _, err := db.Exec(ctx, migrationTable); err != nil {
		return fmt.Errorf("falha ao criar tabela de migrations: %w", err)
	}

	// Ler migrations do diretório
	migrationsDir := cfg.Database.MigrationsDir
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("falha ao ler diretório de migrations: %w", err)
	}

	// Filtrar e ordenar migrations *.up.sql
	var migrations []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".up.sql") {
			migrations = append(migrations, file.Name())
		}
	}
	sort.Strings(migrations)

	if len(migrations) == 0 {
		log.Info().Msg("Nenhuma migration encontrada")
		return nil
	}

	// Verificar migrations já aplicadas
	rows, err := db.Query(ctx, "SELECT version FROM schema_migrations ORDER BY version")
	if err != nil {
		return fmt.Errorf("falha ao buscar migrations aplicadas: %w", err)
	}

	appliedMigrations := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			rows.Close()
			return fmt.Errorf("falha ao ler migration aplicada: %w", err)
		}
		appliedMigrations[version] = true
	}
	rows.Close()

	if err := rows.Err(); err != nil {
		return fmt.Errorf("erro ao iterar migrations aplicadas: %w", err)
	}

	// Aplicar migrations pendentes
	appliedCount := 0
	for _, migration := range migrations {
		version := strings.TrimSuffix(migration, ".up.sql")

		if appliedMigrations[version] {
			log.Debug().Str("migration", version).Msg("Migration já aplicada")
			continue
		}

		log.Info().Str("migration", version).Msg("Aplicando migration...")

		// Ler arquivo SQL
		sqlPath := filepath.Join(migrationsDir, migration)
		sqlBytes, err := os.ReadFile(sqlPath)
		if err != nil {
			return fmt.Errorf("falha ao ler migration %s: %w", migration, err)
		}

		// Executar migration em uma transação
		tx, err := db.Begin(ctx)
		if err != nil {
			return fmt.Errorf("falha ao iniciar transação: %w", err)
		}

		// Executar SQL da migration
		if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("falha ao executar migration %s: %w", migration, err)
		}

		// Registrar migration como aplicada
		if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", version); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("falha ao registrar migration %s: %w", migration, err)
		}

		// Commit da transação
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("falha ao fazer commit da migration %s: %w", migration, err)
		}

		log.Info().Str("migration", version).Msg("Migration aplicada com sucesso")
		appliedCount++
	}

	if appliedCount == 0 {
		log.Info().Msg("Todas as migrations já estão aplicadas")
	} else {
		log.Info().Msgf("%d migration(s) aplicada(s) com sucesso", appliedCount)
	}

	return nil
}
