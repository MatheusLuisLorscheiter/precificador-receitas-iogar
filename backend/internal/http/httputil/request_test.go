package httputil

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type samplePayload struct {
	Value int `json:"value"`
}

func TestDecodeJSONSuccess(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"value":42}`))
	w := httptest.NewRecorder()

	var dst samplePayload
	if err := DecodeJSON(w, req, &dst); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if dst.Value != 42 {
		t.Fatalf("expected value 42, got %d", dst.Value)
	}
}

func TestDecodeJSONEmptyBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", http.NoBody)
	// Simular body ausente definindo nil explicitamente
	req.Body = nil
	w := httptest.NewRecorder()

	var dst samplePayload
	err := DecodeJSON(w, req, &dst)
	if err == nil || err.Error() != "corpo da requisição ausente" {
		t.Fatalf("expected missing body error, got %v", err)
	}
}

func TestDecodeJSONMalformed(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"value":`))
	w := httptest.NewRecorder()

	var dst samplePayload
	err := DecodeJSON(w, req, &dst)
	if err == nil || !strings.Contains(err.Error(), "json malformado") {
		t.Fatalf("expected malformed json error, got %v", err)
	}
}
