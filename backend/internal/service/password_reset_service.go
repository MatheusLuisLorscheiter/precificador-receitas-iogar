package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/config"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/mailer"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/repository"
)

// PasswordResetService gerencia fluxos de recuperação de senha.
type PasswordResetService struct {
	repo   *repository.Store
	mailer *mailer.SMTPClient
	log    zerolog.Logger
}

func NewPasswordResetService(repo *repository.Store, mailer *mailer.SMTPClient, log zerolog.Logger) *PasswordResetService {
	return &PasswordResetService{repo: repo, mailer: mailer, log: log}
}

func generateToken(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

// IssueToken cria e envia um token de recuperação.
func (s *PasswordResetService) IssueToken(ctx context.Context, tenant *domain.Tenant, user *domain.User, appConfig *config.Config) (string, error) {
	token, err := generateToken(32)
	if err != nil {
		return "", err
	}

	expiresAt := time.Now().UTC().Add(30 * time.Minute)
	reset := &domain.PasswordReset{
		TenantID:  tenant.ID,
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: expiresAt,
	}

	if err := s.repo.CreatePasswordReset(ctx, reset); err != nil {
		return "", err
	}

	resetURL := fmt.Sprintf("%s/reset-password?token=%s&tenant=%s", appConfig.App.FrontendURL, token, tenant.Slug)

	body := fmt.Sprintf("Olá %s,\n\nRecebemos uma solicitação para redefinir a sua senha. Utilize o link abaixo até %s.\n\n%s\n\nSe você não solicitou, ignore este e-mail.\n\nPrecificador Receitas", user.Name, expiresAt.Format(time.RFC1123), resetURL)

	if s.mailer != nil {
		if err := s.mailer.Send(user.Email, "Recuperação de senha", body); err != nil {
			s.log.Error().Err(err).Msg("falha ao enviar e-mail de recuperação")
		}
	}

	return token, nil
}

// ValidateToken verifica se um token é válido.
func (s *PasswordResetService) ValidateToken(ctx context.Context, tenantID uuid.UUID, token string) (*domain.PasswordReset, error) {
	reset, err := s.repo.GetPasswordReset(ctx, tenantID, token)
	if err != nil {
		return nil, err
	}

	if reset.UsedAt != nil {
		return nil, repository.ErrConflict
	}

	if time.Now().UTC().After(reset.ExpiresAt) {
		return nil, repository.ErrConflict
	}

	return reset, nil
}

// Complete marca o token como utilizado.
func (s *PasswordResetService) Complete(ctx context.Context, resetID uuid.UUID) error {
	return s.repo.MarkPasswordResetUsed(ctx, resetID)
}
