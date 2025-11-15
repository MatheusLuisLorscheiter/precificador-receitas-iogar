package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/rs/zerolog"

	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/config"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/domain"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/httputil"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/http/requestctx"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/mailer"
	"github.com/MatheusLuisLorscheiter/precificador-receitas-iogar/backend/internal/service"
)

const (
	passwordResetMessage = "Se o e-mail existir, enviaremos instruções para redefinir a senha."
	invalidBodyMessage   = "Não foi possível interpretar os dados enviados."
	unauthorizedMessage  = "Autenticação necessária."
)

// AuthHandler gerencia endpoints de autenticação.
type AuthHandler struct {
	authService          *service.AuthService
	userService          *service.UserService
	tenantService        *service.TenantService
	passwordResetService *service.PasswordResetService
	mailer               *mailer.SMTPClient
	config               *config.Config
	logger               *zerolog.Logger
}

// NewAuthHandler cria uma nova instância do handler de autenticação.
func NewAuthHandler(
	authService *service.AuthService,
	userService *service.UserService,
	tenantService *service.TenantService,
	passwordResetService *service.PasswordResetService,
	mailerClient *mailer.SMTPClient,
	cfg *config.Config,
	logger *zerolog.Logger,
) *AuthHandler {
	return &AuthHandler{
		authService:          authService,
		userService:          userService,
		tenantService:        tenantService,
		passwordResetService: passwordResetService,
		mailer:               mailerClient,
		config:               cfg,
		logger:               logger,
	}
}

// RegisterRequest representa a requisição de registro.
type RegisterRequest struct {
	TenantName      string `json:"tenant_name"`
	TenantSlug      string `json:"tenant_slug,omitempty"` // Opcional - será gerado automaticamente se não fornecido
	TenantSubdomain string `json:"tenant_subdomain,omitempty"`
	TenantTimezone  string `json:"tenant_timezone,omitempty"`
	BillingEmail    string `json:"billing_email"`
	UserName        string `json:"user_name"`
	UserEmail       string `json:"user_email"`
	Password        string `json:"password"`
}

// LoginRequest representa a requisição de login.
type LoginRequest struct {
	TenantSlug string `json:"tenant_slug"`
	Email      string `json:"email"`
	Password   string `json:"password"`
}

// LoginResponse representa a resposta de login/registro.
type LoginResponse struct {
	AccessToken  string         `json:"access_token"`
	RefreshToken string         `json:"refresh_token"`
	User         domain.User    `json:"user"`
	Tenant       *domain.Tenant `json:"tenant,omitempty"`
}

// ForgotPasswordRequest representa a requisição de recuperação de senha.
type ForgotPasswordRequest struct {
	TenantSlug string `json:"tenant_slug"`
	Email      string `json:"email"`
}

// ResetPasswordRequest representa a requisição de redefinição de senha.
type ResetPasswordRequest struct {
	TenantSlug  string `json:"tenant_slug"`
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// Register registra um novo usuário e tenant.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidBodyMessage, httputil.WithErrorCode("auth_invalid_body"))
		return
	}

	// Validações
	if req.TenantName == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"O nome da empresa é obrigatório.",
			httputil.WithFieldError("tenant_name", "Informe o nome da empresa."),
		)
		return
	}

	if req.UserName == "" || req.UserEmail == "" || req.Password == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"Nome, e-mail e senha do responsável são obrigatórios.",
			httputil.WithFieldErrors(map[string]string{
				"user_name":  "Informe o nome do responsável.",
				"user_email": "Informe o e-mail corporativo.",
				"password":   "Defina uma senha para o primeiro acesso.",
			}),
		)
		return
	}

	if len(req.Password) < 8 {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"A senha precisa ter no mínimo 8 caracteres.",
			httputil.WithFieldError("password", "Use ao menos 8 caracteres."),
		)
		return
	}

	ctx := r.Context()

	// Definir timezone padrão se não fornecido
	timezone := req.TenantTimezone
	if timezone == "" {
		timezone = "America/Sao_Paulo"
	}

	registerInput := service.RegisterInput{
		TenantName:         req.TenantName,
		TenantSlug:         req.TenantSlug,
		TenantSubdomain:    req.TenantSubdomain,
		TenantBillingEmail: req.BillingEmail,
		TenantTimezone:     timezone,
		UserName:           req.UserName,
		UserEmail:          req.UserEmail,
		Password:           req.Password,
	}

	tenant, user, tokens, err := h.authService.Register(ctx, registerInput)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to register tenant")
		httputil.RespondError(w, http.StatusInternalServerError, "Não foi possível criar o cadastro da empresa.")
		return
	}

	h.sendTenantSlugEmail(req.UserName, req.UserEmail, tenant)

	response := LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User:         *user,
		Tenant:       tenant,
	}

	httputil.RespondJSON(w, http.StatusCreated, response)
}

// Login autentica um usuário existente.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidBodyMessage, httputil.WithErrorCode("auth_invalid_body"))
		return
	}

	if req.TenantSlug == "" || req.Email == "" || req.Password == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"Slug da empresa, e-mail e senha são obrigatórios.",
			httputil.WithFieldErrors(map[string]string{
				"tenant_slug": "Informe o slug recebido no cadastro.",
				"email":       "Informe o e-mail de acesso.",
				"password":    "Informe a senha.",
			}),
		)
		return
	}

	ctx := r.Context()

	// Usar AuthService.Login que busca o tenant pelo slug
	input := service.LoginInput{
		TenantSlug: req.TenantSlug,
		Email:      req.Email,
		Password:   req.Password,
		IP:         r.RemoteAddr,
	}

	user, tokens, err := h.authService.Login(ctx, input)
	if err != nil {
		h.logger.Error().Err(err).Msg("login failed")
		httputil.RespondError(w, http.StatusUnauthorized, "Credenciais inválidas. Verifique email, senha e empresa informados.", httputil.WithErrorCode("auth_invalid_credentials"))
		return
	}

	response := LoginResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User:         *user,
	}

	httputil.RespondJSON(w, http.StatusOK, response)
}

// RefreshToken renova o access token usando um refresh token válido.
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidBodyMessage)
		return
	}

	if req.RefreshToken == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"Refresh token é obrigatório.",
			httputil.WithFieldError("refresh_token", "Informe o refresh token vigente."),
		)
		return
	}

	// Validar refresh token
	claims, err := h.authService.ValidateToken(req.RefreshToken)
	if err != nil {
		httputil.RespondError(w, http.StatusUnauthorized, "Refresh token inválido ou expirado.", httputil.WithErrorCode("auth_refresh_invalid"))
		return
	}

	ctx := r.Context()

	// Buscar usuário
	user, err := h.userService.Get(ctx, claims.TenantID, claims.UserID)
	if err != nil {
		httputil.RespondError(w, http.StatusUnauthorized, "Usuário não encontrado.")
		return
	}

	if !user.Active {
		httputil.RespondError(w, http.StatusForbidden, "A conta do usuário está inativa.")
		return
	}

	// Gerar novos tokens
	tokens, err := h.authService.TokenManager.GenerateTokens(user.ID, user.TenantID, user.Role)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to generate tokens")
		httputil.RespondError(w, http.StatusInternalServerError, "Não foi possível gerar um novo token de acesso.")
		return
	}

	response := map[string]string{
		"access_token": tokens.AccessToken,
	}

	httputil.RespondJSON(w, http.StatusOK, response)
}

// ForgotPassword inicia o processo de recuperação de senha.
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidBodyMessage)
		return
	}

	if req.TenantSlug == "" || req.Email == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"Slug da empresa e e-mail são obrigatórios.",
			httputil.WithFieldErrors(map[string]string{
				"tenant_slug": "Informe em qual empresa deseja recuperar a senha.",
				"email":       "Informe o e-mail usado no acesso.",
			}),
		)
		return
	}

	ctx := r.Context()

	// Buscar tenant
	tenant, err := h.tenantService.GetBySlug(ctx, req.TenantSlug)
	if err != nil {
		// Não revelar se o tenant existe ou não (segurança)
		httputil.RespondJSON(w, http.StatusOK, map[string]string{
			"message": passwordResetMessage,
		})
		return
	}

	// Buscar usuário
	user, err := h.userService.GetByEmail(ctx, tenant.ID, req.Email)
	if err != nil {
		// Não revelar se o email existe ou não (segurança)
		httputil.RespondJSON(w, http.StatusOK, map[string]string{
			"message": passwordResetMessage,
		})
		return
	}

	// Criar token de reset
	if _, err := h.passwordResetService.IssueToken(ctx, tenant, user, h.config); err != nil {
		h.logger.Error().Err(err).Msg("failed to create password reset token")
		httputil.RespondError(w, http.StatusInternalServerError, "Não foi possível iniciar a recuperação de senha.")
		return
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{
		"message": passwordResetMessage,
	})
}

// ResetPassword redefine a senha usando um token válido.
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, invalidBodyMessage)
		return
	}

	if req.TenantSlug == "" || req.Token == "" || req.NewPassword == "" {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"Slug da empresa, token e nova senha são obrigatórios.",
			httputil.WithFieldErrors(map[string]string{
				"tenant_slug":  "Informe a empresa correta.",
				"token":        "Informe o token recebido no e-mail.",
				"new_password": "Defina a nova senha.",
			}),
		)
		return
	}

	if len(req.NewPassword) < 8 {
		httputil.RespondError(
			w,
			http.StatusBadRequest,
			"A nova senha precisa ter no mínimo 8 caracteres.",
			httputil.WithFieldError("new_password", "Use ao menos 8 caracteres."),
		)
		return
	}

	ctx := r.Context()

	// Buscar tenant
	tenant, err := h.tenantService.GetBySlug(ctx, req.TenantSlug)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "Empresa inválida.")
		return
	}

	// Validar token
	resetToken, err := h.passwordResetService.ValidateToken(ctx, tenant.ID, req.Token)
	if err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "Token inválido ou expirado.", httputil.WithErrorCode("password_reset_token_invalid"))
		return
	}

	// Atualizar senha
	if err := h.authService.UpdatePassword(ctx, resetToken.TenantID, resetToken.UserID, req.NewPassword); err != nil {
		h.logger.Error().Err(err).Msg("failed to update password")
		httputil.RespondError(w, http.StatusInternalServerError, "Não foi possível atualizar a senha nesse momento.")
		return
	}

	// Marcar token como usado
	if err := h.passwordResetService.Complete(ctx, resetToken.ID); err != nil {
		h.logger.Error().Err(err).Msg("failed to mark token as used")
	}

	httputil.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Senha redefinida com sucesso.",
	})
}

// Me retorna os dados do usuário autenticado.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := requestctx.GetClaims(r.Context())
	if claims == nil {
		httputil.RespondError(w, http.StatusUnauthorized, unauthorizedMessage)
		return
	}

	ctx := r.Context()

	user, err := h.userService.Get(ctx, claims.TenantID, claims.UserID)
	if err != nil {
		httputil.RespondError(w, http.StatusNotFound, "Usuário não encontrado.")
		return
	}

	httputil.RespondJSON(w, http.StatusOK, user)
}

// TenantInfo representa informações básicas de um tenant.
type TenantInfo struct {
	Slug string `json:"slug"`
	Name string `json:"name"`
}

// GetTenantsByEmail retorna todos os tenants onde o usuário possui conta.
func (h *AuthHandler) GetTenantsByEmail(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		httputil.RespondError(w, http.StatusBadRequest, "email is required")
		return
	}

	ctx := r.Context()

	// Buscar todos os tenants onde este email existe
	tenants, err := h.userService.FindTenantsByEmail(ctx, email)
	if err != nil {
		h.logger.Error().Err(err).Msg("failed to find tenants by email")
		httputil.RespondError(w, http.StatusInternalServerError, "failed to find tenants")
		return
	}

	// Converter para resposta simplificada
	var response []TenantInfo
	for _, tenant := range tenants {
		response = append(response, TenantInfo{
			Slug: tenant.Slug,
			Name: tenant.Name,
		})
	}

	if response == nil {
		response = []TenantInfo{}
	}

	httputil.RespondJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) sendTenantSlugEmail(userName, userEmail string, tenant *domain.Tenant) {
	if tenant == nil || tenant.Slug == "" {
		return
	}

	if h.mailer == nil {
		h.logger.Warn().Msg("mailer not configured; skipping tenant slug email")
		return
	}

	loginBase := strings.TrimRight(h.config.App.FrontendURL, "/")
	loginURL := ""
	if loginBase != "" {
		loginURL = fmt.Sprintf("%s/login?tenant=%s", loginBase, url.QueryEscape(tenant.Slug))
	}

	subject := fmt.Sprintf("Bem-vindo ao %s", h.config.App.Name)
	bodyBuilder := &strings.Builder{}
	bodyBuilder.WriteString(fmt.Sprintf("Olá %s,\n\n", strings.TrimSpace(userName)))
	bodyBuilder.WriteString(fmt.Sprintf("Seu ambiente %s foi criado com sucesso!\n", tenant.Name))
	bodyBuilder.WriteString(fmt.Sprintf("Este é o slug da sua empresa: %s\n", tenant.Slug))
	bodyBuilder.WriteString("Ele será solicitado na tela de login para entrar no sistema.\n\n")
	if loginURL != "" {
		bodyBuilder.WriteString(fmt.Sprintf("Acesse: %s\n\n", loginURL))
	} else {
		bodyBuilder.WriteString("Use o slug acima quando acessar a tela de login do sistema.\n\n")
	}
	bodyBuilder.WriteString("Se não foi você quem solicitou o cadastro, ignore este e-mail.\n\n")
	bodyBuilder.WriteString(fmt.Sprintf("Abraços,\nEquipe %s", h.config.App.Name))

	if err := h.mailer.Send(userEmail, subject, bodyBuilder.String()); err != nil {
		h.logger.Error().Err(err).
			Str("email", userEmail).
			Str("tenant_id", tenant.ID.String()).
			Msg("failed to send tenant slug email")
	}
}
