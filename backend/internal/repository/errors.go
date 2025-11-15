package repository

import "errors"

var (
	// ErrNotFound indica que um registro não foi localizado.
	ErrNotFound = errors.New("registro não encontrado")

	// ErrConflict indica violação de unicidade ou conflito de estado.
	ErrConflict = errors.New("registro em conflito")
)
