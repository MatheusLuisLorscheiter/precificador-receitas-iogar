package logger

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

// New cria uma instância configurada de zerolog baseada no ambiente informado.
func New(env string) zerolog.Logger {
	zerolog.TimeFieldFormat = time.RFC3339Nano

	level := zerolog.InfoLevel
	if strings.EqualFold(env, "development") {
		level = zerolog.DebugLevel
	}

	log := zerolog.New(os.Stdout).
		With().
		Timestamp().
		Logger().
		Level(level)

	return log
}
