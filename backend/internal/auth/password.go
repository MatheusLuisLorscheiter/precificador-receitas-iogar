package auth

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword aplica o bcrypt com pepper.
func HashPassword(raw, pepper string) (string, error) {
	salted := fmt.Sprintf("%s%s", raw, pepper)
	hash, err := bcrypt.GenerateFromPassword([]byte(salted), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CheckPassword compara o hash armazenado com a senha informada.
func CheckPassword(hash, raw, pepper string) error {
	salted := fmt.Sprintf("%s%s", raw, pepper)
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(salted))
}
