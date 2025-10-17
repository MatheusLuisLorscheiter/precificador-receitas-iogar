# ============================================================================
# SCHEMAS PYDANTIC - AUTENTICAÇÃO E JWT
# ============================================================================
# Descrição: Schemas para validação de dados de autenticação, login, tokens
# e operações relacionadas a usuários
# Data: 17/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

# ============================================================================
# SCHEMAS DE LOGIN E AUTENTICAÇÃO
# ============================================================================

class LoginRequest(BaseModel):
    """
    Schema para requisição de login.
    Aceita username ou email como identificador.
    
    Atributos:
        username: Nome de usuário ou email
        password: Senha em texto puro (será hasheada no backend)
    
    Exemplo:
        {
            "username": "admin",
            "password": "senha123"
        }
    """
    username: str = Field(..., min_length=3, max_length=100, description="Username ou email")
    password: str = Field(..., min_length=8, description="Senha do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "senha123"
            }
        }


class LoginResponse(BaseModel):
    """
    Schema para resposta de login bem-sucedido.
    Retorna tokens JWT e informações básicas do usuário.
    
    Atributos:
        access_token: Token JWT de acesso (curta duração)
        refresh_token: Token JWT para renovação (longa duração)
        token_type: Tipo do token (sempre "bearer")
        user: Informações básicas do usuário logado
    
    Exemplo:
        {
            "access_token": "eyJhbGciOiJIUzI1NiIs...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
            "token_type": "bearer",
            "user": {...}
        }
    """
    access_token: str = Field(..., description="Token JWT de acesso")
    refresh_token: str = Field(..., description="Token JWT de renovação")
    token_type: str = Field(default="bearer", description="Tipo do token")
    user: dict = Field(..., description="Dados do usuário logado")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "username": "admin",
                    "email": "admin@iogar.com",
                    "role": "ADMIN"
                }
            }
        }


# ============================================================================
# SCHEMAS DE TOKENS
# ============================================================================

class RefreshTokenRequest(BaseModel):
    """
    Schema para requisição de renovação de token.
    
    Atributos:
        refresh_token: Token JWT de refresh válido
    
    Exemplo:
        {
            "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
        }
    """
    refresh_token: str = Field(..., description="Token de refresh válido")

    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class TokenResponse(BaseModel):
    """
    Schema para resposta de renovação de token.
    
    Atributos:
        access_token: Novo token JWT de acesso
        token_type: Tipo do token (sempre "bearer")
    
    Exemplo:
        {
            "access_token": "eyJhbGciOiJIUzI1NiIs...",
            "token_type": "bearer"
        }
    """
    access_token: str = Field(..., description="Novo token JWT de acesso")
    token_type: str = Field(default="bearer", description="Tipo do token")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }


# ============================================================================
# SCHEMAS DE TROCA DE SENHA
# ============================================================================

class ChangePasswordRequest(BaseModel):
    """
    Schema para troca de senha do usuário logado.
    
    Atributos:
        current_password: Senha atual para validação
        new_password: Nova senha (deve atender critérios de segurança)
        confirm_password: Confirmação da nova senha
    
    Validações:
        - Senha atual não pode ser vazia
        - Nova senha deve ter mínimo 8 caracteres
        - Nova senha deve conter letra e número
        - Confirmação deve ser idêntica à nova senha
    """
    current_password: str = Field(..., min_length=1, description="Senha atual")
    new_password: str = Field(..., min_length=8, description="Nova senha")
    confirm_password: str = Field(..., min_length=8, description="Confirmação da nova senha")

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        """Valida força da nova senha"""
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres")
        
        if not any(char.isalpha() for char in v):
            raise ValueError("A senha deve conter pelo menos uma letra")
        
        if not any(char.isdigit() for char in v):
            raise ValueError("A senha deve conter pelo menos um número")
        
        return v

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        """Valida se as senhas coincidem"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError("As senhas não coincidem")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "senhaAntiga123",
                "new_password": "senhaNova456",
                "confirm_password": "senhaNova456"
            }
        }


class ResetPasswordRequest(BaseModel):
    """
    Schema para reset de senha (esqueci minha senha).
    
    Atributos:
        email: Email do usuário para envio do link de reset
    
    Nota:
        Em produção, deve enviar email com token de reset.
        Por enquanto, implementação simplificada para admin resetar senha.
    """
    email: EmailStr = Field(..., description="Email cadastrado do usuário")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "usuario@iogar.com"
            }
        }


class ResetPasswordConfirm(BaseModel):
    """
    Schema para confirmar reset de senha com token.
    
    Atributos:
        token: Token de reset enviado por email
        new_password: Nova senha do usuário
        confirm_password: Confirmação da nova senha
    """
    token: str = Field(..., description="Token de reset recebido por email")
    new_password: str = Field(..., min_length=8, description="Nova senha")
    confirm_password: str = Field(..., min_length=8, description="Confirmação da nova senha")

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        """Valida força da nova senha"""
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres")
        
        if not any(char.isalpha() for char in v):
            raise ValueError("A senha deve conter pelo menos uma letra")
        
        if not any(char.isdigit() for char in v):
            raise ValueError("A senha deve conter pelo menos um número")
        
        return v

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        """Valida se as senhas coincidem"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError("As senhas não coincidem")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "token": "abc123def456",
                "new_password": "senhaNova789",
                "confirm_password": "senhaNova789"
            }
        }


# ============================================================================
# SCHEMAS DE RESPOSTA DO USUÁRIO
# ============================================================================

class UserResponse(BaseModel):
    """
    Schema para resposta com dados do usuário (sem senha).
    
    Atributos:
        id: ID do usuário
        username: Nome de usuário
        email: Email do usuário
        role: Perfil do usuário (ADMIN, CONSULTANT, STORE)
        restaurante_id: ID do restaurante vinculado (opcional)
        ativo: Status de ativação
        primeiro_acesso: Flag de primeiro acesso
        created_at: Data de criação
        updated_at: Data da última atualização
    """
    id: int
    username: str
    email: str
    role: str
    restaurante_id: Optional[int] = None
    ativo: bool
    primeiro_acesso: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "username": "admin",
                "email": "admin@iogar.com",
                "role": "ADMIN",
                "restaurante_id": None,
                "ativo": True,
                "primeiro_acesso": False,
                "created_at": "2025-10-17T10:00:00",
                "updated_at": "2025-10-17T10:00:00"
            }
        }


# ============================================================================
# SCHEMAS DE MENSAGENS PADRÃO
# ============================================================================

class MessageResponse(BaseModel):
    """
    Schema genérico para respostas de sucesso/erro.
    
    Atributos:
        message: Mensagem de feedback para o usuário
    """
    message: str = Field(..., description="Mensagem de feedback")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operação realizada com sucesso"
            }
        }


# ============================================================================
# EXPORTAÇÕES
# ============================================================================

__all__ = [
    "LoginRequest",
    "LoginResponse",
    "RefreshTokenRequest",
    "TokenResponse",
    "ChangePasswordRequest",
    "ResetPasswordRequest",
    "ResetPasswordConfirm",
    "UserResponse",
    "MessageResponse"
]