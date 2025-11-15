package httputil

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
)

const maxBodyBytes = 1 << 20 // 1MB

// DecodeJSON realiza o unmarshal protegido contra payloads muito grandes.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	if r.Body == nil {
		return errors.New("corpo da requisição ausente")
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		switch {
		case errors.Is(err, io.EOF):
			return errors.New("corpo da requisição vazio")
		case errors.Is(err, io.ErrUnexpectedEOF):
			return errors.New("json malformado: fim inesperado")
		default:
			var syntaxErr *json.SyntaxError
			if errors.As(err, &syntaxErr) {
				return fmt.Errorf("json malformado na posição %d", syntaxErr.Offset)
			}
			var typeErr *json.UnmarshalTypeError
			if errors.As(err, &typeErr) {
				return fmt.Errorf("campo %q com tipo inválido", typeErr.Field)
			}
			return err
		}
	}

	if decoder.More() {
		return errors.New("json contém dados extras")
	}

	return nil
}
