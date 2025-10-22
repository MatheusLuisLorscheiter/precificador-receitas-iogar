# ============================================================================
# MODELO PERMISSION - Sistema de Permissões Configuráveis
# ============================================================================
# Descrição: Modelo para gerenciamento de permissões por perfil
# Permite que ADMIN configure permissões dinamicamente
# Data: 21/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
import enum


# ============================================================================
# ENUM DE RECURSOS DO SISTEMA
# ============================================================================

class ResourceType(str, enum.Enum):
    """
    Recursos/módulos do sistema que podem ter permissões controladas
    """
    DASHBOARD = "DASHBOARD"
    INSUMOS = "INSUMOS"
    RECEITAS = "RECEITAS"
    FORNECEDORES = "FORNECEDORES"
    RESTAURANTES = "RESTAURANTES"
    USUARIOS = "USUARIOS"
    IA_CLASSIFICACAO = "IA_CLASSIFICACAO"
    RELATORIOS = "RELATORIOS"
    CONFIGURACOES = "CONFIGURACOES"
    MONITORAMENTO = "MONITORAMENTO"


# ============================================================================
# ENUM DE AÇÕES POSSÍVEIS
# ============================================================================

class ActionType(str, enum.Enum):
    """
    Ações que podem ser realizadas em cada recurso
    """
    VISUALIZAR = "VISUALIZAR"       # Ver/Listar
    CRIAR = "CRIAR"                  # Criar novos registros
    EDITAR = "EDITAR"                # Editar registros
    DELETAR = "DELETAR"              # Deletar registros
    GERENCIAR = "GERENCIAR"          # Gestão completa (admin)


# ============================================================================
# ENUM DE ESCOPOS DE DADOS
# ============================================================================

class DataScope(str, enum.Enum):
    """
    Escopo de dados que o usuário pode acessar
    """
    TODOS = "TODOS"                  # Acesso a todos os dados
    REDE = "REDE"                    # Acesso a toda rede (Owner)
    LOJA = "LOJA"                    # Apenas sua loja (Manager/Operator)
    PROPRIOS = "PROPRIOS"            # Apenas registros que criou


# ============================================================================
# MODELO PERMISSION
# ============================================================================

class Permission(Base):
    """
    Modelo de permissões configuráveis por perfil.
    
    Cada registro define uma permissão específica para um perfil:
    - Qual recurso (Insumos, Receitas, etc)
    - Qual ação (Visualizar, Criar, Editar, Deletar)
    - Qual escopo de dados (Todos, Rede, Loja, Próprios)
    
    Exemplos:
    - MANAGER pode VISUALIZAR RECEITAS da LOJA
    - OWNER pode GERENCIAR RECEITAS de toda REDE
    - OPERATOR pode CRIAR INSUMOS mas só ve os PROPRIOS
    """
    
    __tablename__ = "permissions"

    # ========================================================================
    # CAMPOS PRINCIPAIS
    # ========================================================================
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="Perfil ao qual a permissão se aplica"
    )
    
    resource: Mapped[ResourceType] = mapped_column(
        SQLEnum(ResourceType),
        nullable=False,
        index=True,
        comment="Recurso/módulo do sistema"
    )
    
    action: Mapped[ActionType] = mapped_column(
        SQLEnum(ActionType),
        nullable=False,
        comment="Ação permitida"
    )
    
    data_scope: Mapped[DataScope] = mapped_column(
        SQLEnum(DataScope),
        nullable=False,
        comment="Escopo de dados acessíveis"
    )
    
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Permissão ativa ou desativada"
    )
    
    # ========================================================================
    # CONSTRAINT - Uma permissão única por role/resource/action
    # ========================================================================
    
    __table_args__ = (
        UniqueConstraint('role', 'resource', 'action', name='uq_role_resource_action'),
    )
    
    def __repr__(self):
        return f"<Permission {self.role} - {self.action} {self.resource} ({self.data_scope})>"