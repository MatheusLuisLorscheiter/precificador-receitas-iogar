# ============================================================================
# SCHEMAS PYDANTIC - MODELO USER (CRUD)
# ============================================================================
# Descrição: Schemas para criação, atualização e listagem de usuários
# Usado principalmente pelo painel administrativo
# Data: 17/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum

# ============================================================================
# ENUM DE ROLES (SINCRONIZADO COM O MODELO)
# ============================================================================

class UserRoleEnum(str, Enum):
    """
    Enum de perfis de usuário para validação Pydantic.
    Deve estar sincronizado com UserRole do modelo.
    """
    ADMIN = "ADMIN"
    CONSULTANT = "CONSULTANT"
    STORE = "STORE"


# ============================================================================
# SCHEMAS DE CRIAÇÃO DE USUÁRIO
# ============================================================================

class UserCreate(BaseModel):
    """
    Schema para criação de novo usuário (usado por ADMIN).
    
    Atributos:
        username: Nome de usuário único (3-50 caracteres)
        email: Email válido e único
        password: Senha inicial (será hasheada, mínimo 8 caracteres)
        role: Perfil do usuário (ADMIN, CONSULTANT, STORE)
        restaurante_id: ID do restaurante (obrigatório apenas para STORE)
        ativo: Define se usuário começa ativo (padrão: True)
    
    Validações:
        - Username único no sistema
        - Email válido e único
        - Senha com mínimo 8 caracteres, letra e número
        - Se role = STORE, restaurante_id é obrigatório
        - Se role != STORE, restaurante_id deve ser None
    
    Exemplo:
        {
            "username": "loja01",
            "email": "loja01@iogar.com",
            "password": "senha123",
            "role": "STORE",
            "restaurante_id": 1,
            "ativo": true
        }
    """
    username: str = Field(
        ..., 
        min_length=3, 
        max_length=50,
        description="Nome de usuário único"
    )
    email: EmailStr = Field(..., description="Email válido e único")
    password: str = Field(
        ..., 
        min_length=8,
        description="Senha inicial (será hasheada)"
    )
    role: UserRoleEnum = Field(..., description="Perfil do usuário")
    restaurante_id: Optional[int] = Field(
        None,
        description="ID do restaurante (obrigatório para STORE)"
    )
    ativo: bool = Field(
        default=True,
        description="Define se usuário está ativo"
    )

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Valida força da senha"""
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres")
        
        if not any(char.isalpha() for char in v):
            raise ValueError("A senha deve conter pelo menos uma letra")
        
        if not any(char.isdigit() for char in v):
            raise ValueError("A senha deve conter pelo menos um número")
        
        return v

    @field_validator('restaurante_id')
    @classmethod
    def validate_restaurante_for_store(cls, v, info):
        """Valida que STORE deve ter restaurante_id"""
        if 'role' in info.data:
            role = info.data['role']
            
            # Se é STORE, restaurante_id é obrigatório
            if role == UserRoleEnum.STORE and v is None:
                raise ValueError("Usuários STORE devem ter um restaurante vinculado")
            
            # Se não é STORE, restaurante_id deve ser None
            if role != UserRoleEnum.STORE and v is not None:
                raise ValueError("Apenas usuários STORE podem ter restaurante vinculado")
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "username": "loja01",
                "email": "loja01@iogar.com",
                "password": "senha123",
                "role": "STORE",
                "restaurante_id": 1,
                "ativo": True
            }
        }


# ============================================================================
# SCHEMAS DE ATUALIZAÇÃO DE USUÁRIO
# ============================================================================

class UserUpdate(BaseModel):
    """
    Schema para atualização de usuário existente (usado por ADMIN).
    Todos os campos são opcionais para permitir atualização parcial.
    
    Atributos:
        username: Novo nome de usuário (opcional)
        email: Novo email (opcional)
        role: Novo perfil (opcional)
        restaurante_id: Novo restaurante vinculado (opcional)
        ativo: Novo status de ativação (opcional)
    
    Nota:
        - Para trocar senha, use o endpoint específico de change-password
        - Não reseta primeiro_acesso automaticamente
        - Validações similares ao UserCreate
    
    Exemplo:
        {
            "ativo": false
        }
    """
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=50,
        description="Novo nome de usuário"
    )
    email: Optional[EmailStr] = Field(
        None,
        description="Novo email"
    )
    role: Optional[UserRoleEnum] = Field(
        None,
        description="Novo perfil"
    )
    restaurante_id: Optional[int] = Field(
        None,
        description="Novo restaurante vinculado"
    )
    ativo: Optional[bool] = Field(
        None,
        description="Novo status de ativação"
    )

    @field_validator('restaurante_id')
    @classmethod
    def validate_restaurante_for_role(cls, v, info):
        """Valida restaurante_id baseado no role"""
        if 'role' in info.data and info.data['role'] is not None:
            role = info.data['role']
            
            if role == UserRoleEnum.STORE and v is None:
                raise ValueError("Usuários STORE devem ter um restaurante vinculado")
            
            if role != UserRoleEnum.STORE and v is not None:
                raise ValueError("Apenas usuários STORE podem ter restaurante vinculado")
        
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "ativo": False
            }
        }


# ============================================================================
# SCHEMAS DE RESPOSTA DE USUÁRIO
# ============================================================================

class UserResponse(BaseModel):
    """
    Schema para resposta com dados completos do usuário.
    Retorna todas as informações exceto a senha.
    
    Atributos:
        id: ID único do usuário
        username: Nome de usuário
        email: Email do usuário
        role: Perfil do usuário
        restaurante_id: ID do restaurante vinculado (se STORE)
        ativo: Status de ativação
        primeiro_acesso: Flag de primeiro acesso
        created_at: Data de criação do registro
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


class UserListResponse(BaseModel):
    """
    Schema para listagem de usuários com informações resumidas.
    Usado em listagens e dropdowns.
    
    Atributos:
        id: ID do usuário
        username: Nome de usuário
        email: Email do usuário
        role: Perfil do usuário
        restaurante_id: ID do restaurante (se STORE)
        ativo: Status de ativação
    """
    id: int
    username: str
    email: str
    role: str
    restaurante_id: Optional[int] = None
    ativo: bool

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "username": "admin",
                "email": "admin@iogar.com",
                "role": "ADMIN",
                "restaurante_id": None,
                "ativo": True
            }
        }


# ============================================================================
# SCHEMAS DE PRIMEIRO ACESSO
# ============================================================================

class FirstAccessPasswordChange(BaseModel):
    """
    Schema para troca de senha obrigatória no primeiro acesso.
    Não requer senha atual, apenas nova senha e confirmação.
    
    Atributos:
        new_password: Nova senha do usuário
        confirm_password: Confirmação da nova senha
    
    Validações:
        - Nova senha deve ter mínimo 8 caracteres
        - Deve conter letra e número
        - Confirmação deve ser idêntica
    
    Exemplo:
        {
            "new_password": "minhaSenhaNova123",
            "confirm_password": "minhaSenhaNova123"
        }
    """
    new_password: str = Field(
        ...,
        min_length=8,
        description="Nova senha do usuário"
    )
    confirm_password: str = Field(
        ...,
        min_length=8,
        description="Confirmação da nova senha"
    )

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        """Valida força da senha"""
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
                "new_password": "minhaSenhaNova123",
                "confirm_password": "minhaSenhaNova123"
            }
        }


# ============================================================================
# EXPORTAÇÕES
# ============================================================================

__all__ = [
    "UserRoleEnum",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserListResponse",
    "FirstAccessPasswordChange"
]