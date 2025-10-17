# ============================================================================
# ENDPOINTS DE AUTENTICAÇÃO - API REST
# ============================================================================
# Descrição: Endpoints para login, logout, refresh token, troca de senha
# e operações relacionadas à autenticação JWT
# Data: 17/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional

# Importar dependências e schemas
from app.api.deps import get_db, get_current_user, get_current_active_user
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    TokenResponse,
    ChangePasswordRequest,
    MessageResponse,
    UserResponse
)
from app.schemas.user import FirstAccessPasswordChange

# Importar modelos e funções de segurança
from app.models.user import User
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
    validate_password_strength
)

# Criar router
router = APIRouter()

# ============================================================================
# ENDPOINT: LOGIN
# ============================================================================

@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    
    # DEBUG: Adicionar logs temporários
    print(f"\n🔍 DEBUG LOGIN:")
    print(f"   Username recebido: '{login_data.username}'")
    print(f"   Senha recebida: '{login_data.password}'")
    
    # Buscar usuário por username ou email
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    # DEBUG: Verificar se encontrou usuário
    print(f"   Usuário encontrado: {user is not None}")
    if user:
        print(f"   Username no banco: '{user.username}'")
        print(f"   Email no banco: '{user.email}'")
        print(f"   Hash no banco (20 chars): {user.password_hash[:20]}...")
        
        # Testar verificação de senha
        senha_valida = verify_password(login_data.password, user.password_hash)
        print(f"   Senha válida: {senha_valida}")
    """
    Endpoint de login - autenticação de usuários.
    
    Fluxo:
    1. Recebe username/email e senha
    2. Busca usuário no banco (por username ou email)
    3. Valida a senha usando bcrypt
    4. Verifica se usuário está ativo
    5. Gera access_token e refresh_token
    6. Retorna tokens + dados do usuário
    
    Args:
        login_data: Credenciais de login (username/email + senha)
        request: Objeto Request do FastAPI (para capturar IP)
        db: Sessão do banco de dados
    
    Returns:
        LoginResponse: Tokens JWT e dados do usuário
    
    Raises:
        HTTPException 401: Credenciais inválidas
        HTTPException 403: Usuário inativo
    
    Exemplo de uso:
        POST /api/v1/auth/login
        {
            "username": "admin",
            "password": "senha123"
        }
        
        Resposta:
        {
            "access_token": "eyJhbGc...",
            "refresh_token": "eyJhbGc...",
            "token_type": "bearer",
            "user": {...}
        }
    """
    # Buscar usuário por username ou email
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    # Validar se usuário existe e senha está correta
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validar se usuário está ativo
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com o administrador.",
        )
    
    # Preparar dados para o token
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value
    }
    
    # Gerar tokens JWT
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Log de auditoria (implementar futuramente)
    # TODO: Registrar login no audit_log com IP do usuário
    # client_ip = request.client.host
    
    # Retornar resposta com tokens e dados do usuário
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user.to_dict()
    )


# ============================================================================
# ENDPOINT: REFRESH TOKEN
# ============================================================================

@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint para renovar access_token usando refresh_token.
    
    Fluxo:
    1. Recebe refresh_token
    2. Valida se é um refresh_token válido (não expirado)
    3. Extrai user_id do token
    4. Busca usuário no banco
    5. Verifica se usuário ainda está ativo
    6. Gera novo access_token
    7. Retorna novo access_token
    
    Args:
        token_data: Objeto contendo o refresh_token
        db: Sessão do banco de dados
    
    Returns:
        TokenResponse: Novo access_token
    
    Raises:
        HTTPException 401: Token inválido ou expirado
        HTTPException 403: Usuário inativo
    
    Exemplo de uso:
        POST /api/v1/auth/refresh
        {
            "refresh_token": "eyJhbGc..."
        }
        
        Resposta:
        {
            "access_token": "eyJhbGc...",
            "token_type": "bearer"
        }
    """
    # Decodificar e validar refresh_token
    payload = decode_token(token_data.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se é realmente um refresh_token
    if not verify_token_type(token_data.refresh_token, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token fornecido não é um refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extrair user_id do payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuário no banco
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se usuário ainda está ativo
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )
    
    # Gerar novo access_token
    token_data_new = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value
    }
    new_access_token = create_access_token(data=token_data_new)
    
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer"
    )


# ============================================================================
# ENDPOINT: LOGOUT
# ============================================================================

@router.post("/logout", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de logout - encerra sessão do usuário.
    
    Nota: Como JWT é stateless, o logout é feito no frontend removendo os tokens.
    Este endpoint serve para:
    1. Validar que o token ainda é válido
    2. Registrar logout no audit log (futuro)
    3. Invalidar refresh_token em blacklist (implementação futura)
    
    Args:
        current_user: Usuário autenticado obtido do token
    
    Returns:
        MessageResponse: Mensagem de sucesso
    
    Exemplo de uso:
        POST /api/v1/auth/logout
        Headers: Authorization: Bearer <access_token>
        
        Resposta:
        {
            "message": "Logout realizado com sucesso"
        }
    """
    # TODO: Implementar blacklist de tokens para invalidação no backend
    # TODO: Registrar logout no audit_log
    
    return MessageResponse(
        message="Logout realizado com sucesso"
    )


# ============================================================================
# ENDPOINT: DADOS DO USUÁRIO LOGADO
# ============================================================================

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint que retorna informações do usuário autenticado.
    
    Usado pelo frontend para:
    1. Obter dados do usuário ao carregar a aplicação
    2. Validar se o token ainda é válido
    3. Atualizar informações após mudanças
    
    Args:
        current_user: Usuário autenticado obtido do token
    
    Returns:
        UserResponse: Dados completos do usuário (sem senha)
    
    Exemplo de uso:
        GET /api/v1/auth/me
        Headers: Authorization: Bearer <access_token>
        
        Resposta:
        {
            "id": 1,
            "username": "admin",
            "email": "admin@iogar.com",
            "role": "ADMIN",
            ...
        }
    """
    return UserResponse.model_validate(current_user)


# ============================================================================
# ENDPOINT: TROCAR SENHA (USUÁRIO LOGADO)
# ============================================================================

@router.put("/change-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def change_password(
    password_data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para trocar senha do usuário logado.
    
    Fluxo:
    1. Recebe senha atual + nova senha + confirmação
    2. Valida senha atual
    3. Valida força da nova senha
    4. Valida confirmação
    5. Atualiza senha no banco
    6. Remove flag primeiro_acesso se necessário
    
    Args:
        password_data: Dados da troca de senha
        db: Sessão do banco de dados
        current_user: Usuário autenticado
    
    Returns:
        MessageResponse: Mensagem de sucesso
    
    Raises:
        HTTPException 400: Senha atual incorreta ou nova senha inválida
    
    Exemplo de uso:
        PUT /api/v1/auth/change-password
        Headers: Authorization: Bearer <access_token>
        {
            "current_password": "senhaAntiga123",
            "new_password": "senhaNova456",
            "confirm_password": "senhaNova456"
        }
        
        Resposta:
        {
            "message": "Senha alterada com sucesso"
        }
    """
    # Validar senha atual
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )
    
    # Validar que nova senha é diferente da atual
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ser diferente da senha atual"
        )
    
    # Validar força da nova senha (já validado no schema, mas reforçando)
    is_valid, error_message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Atualizar senha no banco
    current_user.password_hash = get_password_hash(password_data.new_password)
    
    # Remover flag de primeiro acesso
    if current_user.primeiro_acesso:
        current_user.primeiro_acesso = False
    
    db.commit()
    
    # TODO: Registrar troca de senha no audit_log
    
    return MessageResponse(
        message="Senha alterada com sucesso"
    )


# ============================================================================
# ENDPOINT: TROCAR SENHA NO PRIMEIRO ACESSO
# ============================================================================

@router.post("/first-access-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def first_access_password_change(
    password_data: FirstAccessPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para troca de senha obrigatória no primeiro acesso.
    
    Diferenças do change-password:
    - Não requer senha atual (usuário usa senha padrão do admin)
    - Usado apenas quando primeiro_acesso = True
    - Remove flag primeiro_acesso após troca
    
    Fluxo:
    1. Verifica se usuário está em primeiro acesso
    2. Valida nova senha e confirmação
    3. Atualiza senha
    4. Remove flag primeiro_acesso
    
    Args:
        password_data: Nova senha e confirmação
        db: Sessão do banco de dados
        current_user: Usuário autenticado
    
    Returns:
        MessageResponse: Mensagem de sucesso
    
    Raises:
        HTTPException 400: Usuário não está em primeiro acesso
    
    Exemplo de uso:
        POST /api/v1/auth/first-access-password
        Headers: Authorization: Bearer <access_token>
        {
            "new_password": "minhaSenhaNova123",
            "confirm_password": "minhaSenhaNova123"
        }
        
        Resposta:
        {
            "message": "Senha definida com sucesso. Bem-vindo ao sistema!"
        }
    """
    # Verificar se usuário está em primeiro acesso
    if not current_user.primeiro_acesso:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este endpoint é apenas para primeiro acesso. Use /change-password."
        )
    
    # Validar força da nova senha
    is_valid, error_message = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Atualizar senha e remover flag de primeiro acesso
    current_user.password_hash = get_password_hash(password_data.new_password)
    current_user.primeiro_acesso = False
    
    db.commit()
    
    # TODO: Registrar primeiro acesso no audit_log
    
    return MessageResponse(
        message="Senha definida com sucesso. Bem-vindo ao sistema!"
    )


# ============================================================================
# ENDPOINT: RESET DE SENHA (ESQUECI MINHA SENHA)
# ============================================================================

@router.post("/reset-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def request_password_reset(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint para solicitar reset de senha (esqueci minha senha).
    
    Implementação futura completa:
    1. Validar email existe
    2. Gerar token único de reset
    3. Enviar email com link de reset
    4. Token expira em 1 hora
    
    Implementação atual (simplificada):
    - Sempre retorna sucesso (segurança: não revela se email existe)
    - Admin deve resetar senha manualmente
    
    Args:
        email: Email do usuário
        db: Sessão do banco de dados
    
    Returns:
        MessageResponse: Mensagem padrão
    
    Nota:
        Por segurança, sempre retorna sucesso mesmo se email não existir.
        Isso previne que atacantes descubram emails válidos no sistema.
    
    Exemplo de uso:
        POST /api/v1/auth/reset-password
        {
            "email": "usuario@iogar.com"
        }
        
        Resposta:
        {
            "message": "Se o email existir, você receberá instruções..."
        }
    """
    # TODO: Implementar envio de email com token de reset
    # TODO: Criar tabela password_reset_tokens
    # TODO: Gerar token único e salvar no banco
    # TODO: Enviar email com link: /reset-password/{token}
    
    # Por enquanto, apenas retorna mensagem genérica
    return MessageResponse(
        message="Se o email existir no sistema, você receberá instruções para reset de senha. "
                "Por favor, verifique sua caixa de entrada e spam."
    )


# ============================================================================
# EXPORTAR ROUTER
# ============================================================================

__all__ = ["router"]