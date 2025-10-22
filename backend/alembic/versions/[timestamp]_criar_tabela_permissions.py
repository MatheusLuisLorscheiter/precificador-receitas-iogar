"""Criar tabela permissions para sistema de permissões configuráveis

Revision ID: create_permissions_table
Revises: merge_heads_001
Create Date: 2025-10-21 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'create_permissions_table'
down_revision: Union[str, Sequence[str], None] = 'merge_heads_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Cria a tabela permissions para gerenciamento de permissões configuráveis.
    Permite que ADMIN configure permissões dinamicamente por perfil.
    """
    
    # ========================================================================
    # CRIAR ENUMS SE NÃO EXISTIREM (PostgreSQL)
    # ========================================================================
    
    from sqlalchemy import text
    
    conn = op.get_bind()
    
    # Verificar e criar ResourceType apenas se não existir
    result = conn.execute(text("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resourcetype')"))
    if not result.scalar():
        conn.execute(text("""
            CREATE TYPE resourcetype AS ENUM (
                'DASHBOARD', 'INSUMOS', 'RECEITAS', 'FORNECEDORES', 
                'RESTAURANTES', 'USUARIOS', 'IA_CLASSIFICACAO', 
                'RELATORIOS', 'CONFIGURACOES', 'MONITORAMENTO'
            )
        """))
    
    # Verificar e criar ActionType apenas se não existir
    result = conn.execute(text("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actiontype')"))
    if not result.scalar():
        conn.execute(text("""
            CREATE TYPE actiontype AS ENUM (
                'VISUALIZAR', 'CRIAR', 'EDITAR', 'DELETAR', 'GERENCIAR'
            )
        """))
    
    # Verificar e criar DataScope apenas se não existir
    result = conn.execute(text("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'datascope')"))
    if not result.scalar():
        conn.execute(text("""
            CREATE TYPE datascope AS ENUM (
                'TODOS', 'REDE', 'LOJA', 'PROPRIOS'
            )
        """))
    
    # ========================================================================
    # CRIAR TABELA PERMISSIONS
    # ========================================================================
    
    op.create_table(
        'permissions',
        
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('resource', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=20), nullable=False),
        sa.Column('data_scope', sa.String(length=20), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role', 'resource', 'action', name='uq_role_resource_action')
    )
    
    op.create_index('ix_permissions_id', 'permissions', ['id'])
    op.create_index('ix_permissions_role', 'permissions', ['role'])
    op.create_index('ix_permissions_resource', 'permissions', ['resource'])
    
    # ========================================================================
    # POPULAR TABELA COM PERMISSÕES PADRÃO
    # ========================================================================
    
    from sqlalchemy import table, column
    
    permissions_table = table('permissions',
        column('role', sa.String),
        column('resource', sa.String),
        column('action', sa.String),
        column('data_scope', sa.String),
        column('enabled', sa.Boolean)
    )
    
    default_permissions = [
        # ADMIN
        {'role': 'ADMIN', 'resource': 'DASHBOARD', 'action': 'VISUALIZAR', 'data_scope': 'TODOS', 'enabled': True},
        {'role': 'ADMIN', 'resource': 'INSUMOS', 'action': 'GERENCIAR', 'data_scope': 'TODOS', 'enabled': True},
        {'role': 'ADMIN', 'resource': 'RECEITAS', 'action': 'GERENCIAR', 'data_scope': 'TODOS', 'enabled': True},
        {'role': 'ADMIN', 'resource': 'FORNECEDORES', 'action': 'GERENCIAR', 'data_scope': 'TODOS', 'enabled': True},
        {'role': 'ADMIN', 'resource': 'RESTAURANTES', 'action': 'GERENCIAR', 'data_scope': 'TODOS', 'enabled': True},
        {'role': 'ADMIN', 'resource': 'USUARIOS', 'action': 'GERENCIAR', 'data_scope': 'TODOS', 'enabled': True},
        
        # CONSULTANT
        {'role': 'CONSULTANT', 'resource': 'INSUMOS', 'action': 'CRIAR', 'data_scope': 'TODOS', 'enabled': True},
        {'role': 'CONSULTANT', 'resource': 'RECEITAS', 'action': 'CRIAR', 'data_scope': 'TODOS', 'enabled': True},
        
        # STORE
        {'role': 'STORE', 'resource': 'RECEITAS', 'action': 'CRIAR', 'data_scope': 'LOJA', 'enabled': True},
    ]
    
    op.bulk_insert(permissions_table, default_permissions)


def downgrade() -> None:
    """
    Remove a tabela permissions e os enums criados.
    """
    
    # Remover índices
    op.drop_index('ix_permissions_resource', table_name='permissions')
    op.drop_index('ix_permissions_role', table_name='permissions')
    op.drop_index('ix_permissions_id', table_name='permissions')
    
    # Remover tabela
    op.drop_table('permissions')
    
    # Remover enums (PostgreSQL)
    op.execute('DROP TYPE IF EXISTS datascope')
    op.execute('DROP TYPE IF EXISTS actiontype')
    op.execute('DROP TYPE IF EXISTS resourcetype')


# ============================================================================
# EXPLICAÇÃO:
# ============================================================================
# Esta migration cria a estrutura completa para permissões configuráveis:
#
# 1. Tabela 'permissions' com todos os campos necessários
# 2. Enums para garantir valores válidos
# 3. Índices para performance
# 4. Constraint unique para evitar duplicatas
# 5. Permissões padrão para os 3 perfis existentes (ADMIN, CONSULTANT, STORE)
#
# Os novos perfis (OWNER, MANAGER, OPERATOR) terão suas permissões 
# configuradas posteriormente pelo ADMIN através da interface.
# ============================================================================