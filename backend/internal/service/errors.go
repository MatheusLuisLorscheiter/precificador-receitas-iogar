package service

import (
	"errors"
	"fmt"
)

// ErrValidation representa erros de validação em serviços de domínio.
var ErrValidation = errors.New("erro de validação")

// ValidationError cria um erro de validação simples com mensagem estática.
func ValidationError(message string) error {
	return fmt.Errorf("%w: %s", ErrValidation, message)
}

// ValidationErrorf cria um erro de validação formatado.
func ValidationErrorf(format string, args ...interface{}) error {
	return fmt.Errorf("%w: %s", ErrValidation, fmt.Sprintf(format, args...))
}
