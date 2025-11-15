package main

import (
	"context"
	"fmt"
	"os"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/config"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/database"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/logger"
)

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
	log.Info().Msg("Limpando banco de dados...")

	ctx := context.Background()

	// Conectar ao Postgres
	db, err := database.Connect(ctx, cfg.PostgresDSN(), 5)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao postgres: %w", err)
	}
	defer db.Close()

	tables := []string{
		"recipe_items",
		"recipes",
		"products",
		"ingredients",
		"password_resets",
		"users",
		"tenants",
		"schema_migrations",
	}

	for _, table := range tables {
		query := "DROP TABLE IF EXISTS " + table + " CASCADE"
		_, err := db.Exec(ctx, query)
		if err != nil {
			return fmt.Errorf("falha ao deletar tabela %s: %w", table, err)
		}
		log.Info().Str("table", table).Msg("Tabela deletada")
	}

	log.Info().Msg("Banco de dados limpo com sucesso!")
	log.Info().Msg("Execute 'go run cmd/migrate/main.go' para recriar as tabelas")

	return nil
}
