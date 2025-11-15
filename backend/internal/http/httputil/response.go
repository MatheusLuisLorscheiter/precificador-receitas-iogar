package httputil

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/auth"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
)

// ErrorResponse representa o payload padrão de erros para a API.
type ErrorResponse struct {
	Error   string            `json:"error"`
	Code    string            `json:"code,omitempty"`
	Details string            `json:"details,omitempty"`
	Fields  map[string]string `json:"fields,omitempty"`
}

// ErrorOption permite customizar campos opcionais do payload de erro.
type ErrorOption func(*ErrorResponse)

// WithErrorCode define um código de erro específico.
func WithErrorCode(code string) ErrorOption {
	return func(resp *ErrorResponse) {
		resp.Code = code
	}
}

// WithErrorDetails adiciona detalhes adicionais ao erro.
func WithErrorDetails(details string) ErrorOption {
	return func(resp *ErrorResponse) {
		resp.Details = details
	}
}

// WithFieldError registra uma mensagem específica para um campo.
func WithFieldError(field, message string) ErrorOption {
	return func(resp *ErrorResponse) {
		if resp.Fields == nil {
			resp.Fields = make(map[string]string)
		}
		resp.Fields[field] = message
	}
}

// WithFieldErrors adiciona múltiplos erros de campo.
func WithFieldErrors(fields map[string]string) ErrorOption {
	return func(resp *ErrorResponse) {
		if len(fields) == 0 {
			return
		}
		if resp.Fields == nil {
			resp.Fields = make(map[string]string, len(fields))
		}
		for k, v := range fields {
			resp.Fields[k] = v
		}
	}
}

// JSON escreve uma resposta JSON com o status informado.
func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(payload)
}

// RespondJSON responde com JSON (alias para JSON).
func RespondJSON(w http.ResponseWriter, status int, payload any) {
	JSON(w, status, payload)
}

// RespondError responde com uma mensagem de erro padronizada.
func RespondError(w http.ResponseWriter, status int, message string, opts ...ErrorOption) {
	resp := ErrorResponse{
		Error: message,
		Code:  fmt.Sprintf("HTTP_%d", status),
	}
	for _, opt := range opts {
		opt(&resp)
	}
	JSON(w, status, resp)
}

// Error traduz erros de domínio para respostas HTTP padronizadas.
func Error(w http.ResponseWriter, err error) {
	if err == nil {
		JSON(w, http.StatusOK, map[string]string{"message": "ok"})
		return
	}

	status := http.StatusInternalServerError
	message := "erro interno inesperado"

	switch {
	case errors.Is(err, repository.ErrNotFound):
		status = http.StatusNotFound
		message = "registro não encontrado"
	case errors.Is(err, repository.ErrConflict):
		status = http.StatusConflict
		message = "conflito ao processar a requisição"
	case errors.Is(err, auth.ErrInvalidToken):
		status = http.StatusUnauthorized
		message = "token inválido"
	case errors.Is(err, service.ErrInvalidCredentials):
		status = http.StatusUnauthorized
		message = "credenciais inválidas"
	case errors.Is(err, service.ErrTooManyAttempts):
		status = http.StatusTooManyRequests
		message = "muitas tentativas, aguarde"
	case errors.Is(err, service.ErrValidation):
		status = http.StatusBadRequest
		message = err.Error()
	default:
		var syntaxErr *json.SyntaxError
		if errors.As(err, &syntaxErr) {
			status = http.StatusBadRequest
			message = "json inválido"
		} else {
			message = err.Error()
		}
	}

	RespondError(w, status, message)
}
