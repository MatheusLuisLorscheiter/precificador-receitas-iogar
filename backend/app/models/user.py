# ============================================================================
# MODELO DE USUÁRIO - SISTEMA DE AUTENTICAÇÃO
# ============================================================================
# Descrição: Modelo SQLAlchemy para gerenciamento de usuários com autenticação JWT
# Suporta três perfis: ADMIN, CONSULTANT e STORE
# Data: 17/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
import enum

# Importar a base do sistema
from app.models.base import Base

# ============================================================================
# ENUM DE ROLES (PERFIS DE USUÁRIO)
# ============================================================================

class UserRole(str, enum.Enum):
    """
    Enum para definir os perfis de usuário do sistema.
    
    ADMIN: Acesso total ao sistema, pode gerenciar usuários
    CONSULTANT: Acesso a todos os restaurantes para consultas e análises
    STORE: Acesso restrito apenas ao seu restaurante
    """
    ADMIN = "ADMIN"
    CONSULTANT = "CONSULTANT"
    STORE = "STORE"

# ============================================================================
# MODELO DE USUÁRIO
# ============================================================================

class User(Base):
    """
    Modelo de usuário para autenticação e controle de acesso.
    
    Atributos:
        id: Identificador único do usuário
        username: Nome de usuário para login (único)
        email: Email do usuário (único)
        password_hash: Hash bcrypt da senha (nunca armazenar senha em texto puro)
        role: Perfil do usuário (ADMIN, CONSULTANT, STORE)
        restaurante_id: ID do restaurante vinculado (obrigatório para STORE)
        ativo: Indica se o usuário está ativo no sistema
        primeiro_acesso: Flag para forçar troca de senha no primeiro login
        created_at: Data e hora de criação do registro
        updated_at: Data e hora da última atualização
    
    Relacionamentos:
        restaurante: Relacionamento com a tabela de restaurantes (apenas STORE)
    """
    __tablename__ = "users"

    # Campos principais
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Perfil e permissões
    role: Mapped[UserRole] = mapped_column(
        SQLAlchemyEnum(UserRole, native_enum=False, length=20),
        nullable=False,
        default=UserRole.STORE
    )
    
    # Vinculação com restaurante (obrigatório apenas para STORE)
    restaurante_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("restaurantes.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Controle de acesso
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    primeiro_acesso: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Auditoria
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # ============================================================================
    # RELACIONAMENTOS
    # ============================================================================
    
    # Relacionamento com restaurante (lazy loading para performance)
    restaurante = relationship("Restaurante", back_populates="usuarios", lazy="select")

    # ============================================================================backend/app/models/receita.py
    # MÉTODOS ESPECIAIS
    # ============================================================================

    def __repr__(self) -> str:
        """Representação string do usuário para debug"""
        return f"<User(id={self.id}, username='{self.username}', role='{self.role.value}')>"

    def to_dict(self) -> dict:
        """
        Converte o usuário para dicionário (sem incluir senha).
        Útil para retornar dados do usuário nas APIs.
        """
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role.value,
            "restaurante_id": self.restaurante_id,
            "ativo": self.ativo,
            "primeiro_acesso": self.primeiro_acesso,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }