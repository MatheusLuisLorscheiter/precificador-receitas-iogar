package config

import (
	"fmt"
	"time"

	"github.com/caarlos0/env/v9"
)

// Config agrega toda a configuração de runtime do backend.
type Config struct {
	App struct {
		Name        string `env:"APP_NAME,notEmpty"`
		Env         string `env:"APP_ENV,notEmpty"`
		Host        string `env:"SERVER_HOST" envDefault:"0.0.0.0"`
		Port        int    `env:"SERVER_PORT" envDefault:"8080"`
		ExternalURL string `env:"SERVER_EXTERNAL_URL,notEmpty"`
	}

	Database struct {
		Host         string `env:"POSTGRES_HOST,notEmpty"`
		Port         int    `env:"POSTGRES_PORT" envDefault:"5432"`
		Name         string `env:"POSTGRES_DB,notEmpty"`
		User         string `env:"POSTGRES_USER,notEmpty"`
		Password     string `env:"POSTGRES_PASSWORD,notEmpty"`
		SSLMode      string `env:"POSTGRES_SSLMODE" envDefault:"disable"`
		MigrationsDir string `env:"POSTGRES_MIGRATIONS_DIR" envDefault:"migrations"`
	}

	Redis struct {
		Addr      string `env:"REDIS_ADDR,notEmpty"`
		Username  string `env:"REDIS_USERNAME"`
		Password  string `env:"REDIS_PASSWORD"`
		DB        int    `env:"REDIS_DB" envDefault:"0"`
		TLSEnabled bool   `env:"REDIS_TLS_ENABLED" envDefault:"false"`
	}

	MinIO struct {
		Endpoint    string `env:"MINIO_ENDPOINT,notEmpty"`
		Region      string `env:"MINIO_REGION" envDefault:"us-east-1"`
		AccessKey   string `env:"MINIO_ACCESS_KEY,notEmpty"`
		SecretKey   string `env:"MINIO_SECRET_KEY,notEmpty"`
		UseSSL      bool   `env:"MINIO_USE_SSL" envDefault:"false"`
		Bucket      string `env:"MINIO_BUCKET,notEmpty"`
		PresignTTL  time.Duration `env:"MINIO_PRESIGNED_EXPIRATION_MINUTES" envDefault:"15m"`
	}

	JWT struct {
		Secret               string        `env:"JWT_SECRET,notEmpty"`
		Issuer               string        `env:"JWT_ISSUER,notEmpty"`
		AccessTokenDuration  time.Duration `env:"JWT_ACCESS_TOKEN_MINUTES" envDefault:"60m"`
		RefreshTokenDuration time.Duration `env:"JWT_REFRESH_TOKEN_HOURS" envDefault:"720h"`
		PasswordPepper       string        `env:"PASSWORD_PEPPER,notEmpty"`
	}

	RateLimit struct {
		Requests int           `env:"RATE_LIMIT_REQUESTS" envDefault:"100"`
		Window   time.Duration `env:"RATE_LIMIT_WINDOW_SECONDS" envDefault:"60s"`
	}

	SMTP struct {
		Host        string `env:"SMTP_HOST,notEmpty"`
		Port        int    `env:"SMTP_PORT" envDefault:"587"`
		Username    string `env:"SMTP_USERNAME"`
		Password    string `env:"SMTP_PASSWORD"`
		FromAddress string `env:"SMTP_FROM_ADDRESS,notEmpty"`
		TLSRequired bool   `env:"SMTP_TLS_REQUIRED" envDefault:"true"`
	}

	Observability struct {
		PrometheusEnabled bool `env:"PROMETHEUS_METRICS_ENABLED" envDefault:"true"`
		PrometheusPort    int  `env:"PROMETHEUS_METRICS_PORT" envDefault:"9090"`
	}
}

// Load carrega todas as variáveis de ambiente e retorna uma estrutura Config preenchida.
func Load() (*Config, error) {
	cfg := &Config{}

	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("falha ao carregar variáveis de ambiente: %w", err)
	}

	return cfg, nil
}

// PostgresDSN monta a connection string para Postgres.
func (c *Config) PostgresDSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s", c.Database.User, c.Database.Password, c.Database.Host, c.Database.Port, c.Database.Name, c.Database.SSLMode)
}
