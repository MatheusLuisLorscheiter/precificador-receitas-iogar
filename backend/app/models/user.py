# ============================================================================
# MODELO USER - Sistema de Usuários e Autenticação
# ============================================================================
# Descrição: Modelo para gerenciamento de usuários do sistema
# Roles: ADMIN (administrador), CONSULTANT (consultor), STORE (loja)
# Data: 20/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base
import enum


# ============================================================================
# ENUM DE ROLES (PERFIS DE USUÁRIO)
# ============================================================================

class UserRole(str, enum.Enum):
    """
    Perfis de usuário do sistema
    
    - ADMIN: Administrador com acesso total
    - CONSULTANT: Consultor com acesso a todos os restaurantes
    - STORE: Loja com acesso apenas ao seu restaurante
    """
    ADMIN = "ADMIN"
    CONSULTANT = "CONSULTANT"
    STORE = "STORE"


# ============================================================================
# MODELO USER
# ============================================================================

class User(Base):
    """
    Modelo de usuários do sistema.
    
    Campos obrigatórios:
    - username: Nome de usuário único para login
    - password_hash: Senha criptografada com bcrypt
    - role: Perfil do usuário (ADMIN, CONSULTANT, STORE)
    
    Campos opcionais:
    - restaurante_id: Restaurante vinculado (obrigatório para STORE)
    - email: Email do usuário (futuro)
    - ativo: Status do usuário (ativo/inativo)
    - primeiro_acesso: Flag para forçar troca de senha
    
    Relacionamentos:
    - N users : 1 restaurante (para usuários STORE)
    """
    
    __tablename__ = "users"

    # ========================================================================
    # CAMPOS DE CONTROLE
    # ========================================================================
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ========================================================================
    # CAMPOS DE AUTENTICAÇÃO
    # ========================================================================
    
    username = Column(
        String(50), 
        unique=True, 
        nullable=False, 
        index=True,
        comment="Nome de usuário único para login"
    )
    
    password_hash = Column(
        String(255), 
        nullable=False,
        comment="Senha criptografada com bcrypt"
    )
    
    email = Column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
        comment="Email do usuário (opcional, para recuperação de senha futura)"
    )

    # ========================================================================
    # PERFIL E PERMISSÕES
    # ========================================================================
    
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.STORE,
        comment="Perfil do usuário: ADMIN, CONSULTANT ou STORE"
    )
    
    restaurante_id = Column(
        Integer,
        ForeignKey("restaurantes.id", ondelete="SET NULL"),
        nullable=True,
        comment="Restaurante vinculado (obrigatório para STORE, opcional para outros)"
    )

    # ========================================================================
    # STATUS E CONTROLE
    # ========================================================================
    
    ativo = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Status do usuário: True = ativo, False = inativo"
    )
    
    primeiro_acesso = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Flag para forçar troca de senha no primeiro acesso"
    )
    
    ultimo_login = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data e hora do último login"
    )

    # ========================================================================
    # RELACIONAMENTOS
    # ========================================================================
    
    # Relacionamento com restaurante (para usuários STORE)
    restaurante = relationship(
        "Restaurante",
        back_populates="usuarios",
        foreign_keys=[restaurante_id]
    )

    # ========================================================================
    # MÉTODOS ÚTEIS
    # ========================================================================
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
    
    def to_dict(self):
        """Converte o modelo para dicionário (sem senha)"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role.value if isinstance(self.role, UserRole) else self.role,
            "restaurante_id": self.restaurante_id,
            "ativo": self.ativo,
            "primeiro_acesso": self.primeiro_acesso,
            "ultimo_login": self.ultimo_login.isoformat() if self.ultimo_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }