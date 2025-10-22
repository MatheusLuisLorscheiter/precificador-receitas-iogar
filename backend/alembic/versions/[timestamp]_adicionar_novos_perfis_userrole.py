"""Adicionar novos perfis ao enum UserRole (OWNER, MANAGER, OPERATOR)

Revision ID: add_new_user_roles
Revises: create_permissions_table
Create Date: 2025-10-21 00:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_new_user_roles'
down_revision: Union[str, Sequence[str], None] = 'create_permissions_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adiciona novos valores ao enum UserRole:
    - OWNER: Proprietário da Rede
    - MANAGER: Gerente de Loja
    - OPERATOR: Operador/Funcionário
    
    Mantém STORE para retrocompatibilidade (será migrado posteriormente).
    """
    
    # ========================================================================
    # ADICIONAR NOVOS VALORES AO ENUM userrole
    # ========================================================================
    
    # No PostgreSQL, precisamos adicionar valores ao enum existente
    # IMPORTANTE: Isto deve ser feito fora de uma transação no PostgreSQL
    
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OWNER'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'MANAGER'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OPERATOR'")
    
    # ========================================================================
    # ADICIONAR PERMISSÕES PADRÃO PARA OS NOVOS PERFIS
    # ========================================================================
    
    from sqlalchemy import table, column
    
    # Definir tabela temporária para insert
    permissions_table = table('permissions',
        column('role', sa.String),
        column('resource', sa.String),
        column('action', sa.String),
        column('data_scope', sa.String),
        column('enabled', sa.Boolean)
    )
    
    # Permissões padrão para os novos perfis
    new_permissions = [
        # ====================================================================
        # OWNER - Proprietário da Rede
        # Gerencia toda a rede de restaurantes, mas sem acesso admin
        # ====================================================================
        {'role': 'OWNER', 'resource': 'DASHBOARD', 'action': 'VISUALIZAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'INSUMOS', 'action': 'CRIAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'INSUMOS', 'action': 'EDITAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'INSUMOS', 'action': 'DELETAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'INSUMOS', 'action': 'VISUALIZAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'RECEITAS', 'action': 'CRIAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'RECEITAS', 'action': 'EDITAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'RECEITAS', 'action': 'DELETAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'RECEITAS', 'action': 'VISUALIZAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'FORNECEDORES', 'action': 'VISUALIZAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'RESTAURANTES', 'action': 'EDITAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'RESTAURANTES', 'action': 'VISUALIZAR', 'data_scope': 'REDE', 'enabled': True},
        {'role': 'OWNER', 'resource': 'RELATORIOS', 'action': 'VISUALIZAR', 'data_scope': 'REDE', 'enabled': True},
        
        # ====================================================================
        # MANAGER - Gerente de Loja
        # Gerencia uma loja específica
        # ====================================================================
        {'role': 'MANAGER', 'resource': 'DASHBOARD', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'INSUMOS', 'action': 'CRIAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'INSUMOS', 'action': 'EDITAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'INSUMOS', 'action': 'DELETAR', 'data_scope': 'LOJA', 'enabled': False},
        {'role': 'MANAGER', 'resource': 'INSUMOS', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'RECEITAS', 'action': 'CRIAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'RECEITAS', 'action': 'EDITAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'RECEITAS', 'action': 'DELETAR', 'data_scope': 'LOJA', 'enabled': False},
        {'role': 'MANAGER', 'resource': 'RECEITAS', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'FORNECEDORES', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'MANAGER', 'resource': 'RELATORIOS', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
        
        # ====================================================================
        # OPERATOR - Operador/Funcionário
        # Acesso limitado principalmente leitura + ações básicas
        # ====================================================================
        {'role': 'OPERATOR', 'resource': 'RECEITAS', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'OPERATOR', 'resource': 'INSUMOS', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
        {'role': 'OPERATOR', 'resource': 'RELATORIOS', 'action': 'VISUALIZAR', 'data_scope': 'LOJA', 'enabled': True},
    ]
    
    # Inserir permissões padrão
    op.bulk_insert(permissions_table, new_permissions)


def downgrade() -> None:
    """
    Remove as permissões dos novos perfis.
    
    NOTA: Não é possível remover valores de um enum no PostgreSQL
    sem recriar o enum completamente, o que quebraria dados existentes.
    Por isso, apenas removemos as permissões mas mantemos os valores no enum.
    """
    
    # ========================================================================
    # REMOVER PERMISSÕES DOS NOVOS PERFIS
    # ========================================================================
    
    op.execute("DELETE FROM permissions WHERE role IN ('OWNER', 'MANAGER', 'OPERATOR')")
    
    # ========================================================================
    # NOTA IMPORTANTE:
    # ========================================================================
    # PostgreSQL não permite remover valores de um ENUM após criação.
    # Para remover completamente, seria necessário:
    # 1. Criar novo enum sem esses valores
    # 2. Alterar coluna para usar novo enum
    # 3. Remover enum antigo
    # 
    # Isso é complexo e arriscado, então mantemos os valores no enum mesmo
    # após downgrade. Eles simplesmente não terão permissões associadas.


# ============================================================================
# EXPLICAÇÃO:
# ============================================================================
# Esta migration adiciona 3 novos perfis ao sistema:
#
# 1. OWNER (Proprietário da Rede)
#    - Gerencia toda a rede de restaurantes
#    - Cria/edita receitas e insumos para todas as lojas
#    - Vê relatórios consolidados
#
# 2. MANAGER (Gerente de Loja)
#    - Gerencia uma loja específica
#    - Pode criar/editar receitas e insumos da loja
#    - Não pode deletar (proteção)
#
# 3. OPERATOR (Operador/Funcionário)
#    - Apenas visualização
#    - Executa tarefas básicas da loja
#    - Sem permissões de edição
#
# O perfil STORE é mantido para retrocompatibilidade com dados existentes.
# Futuramente, usuários STORE podem ser migrados para MANAGER.
# ============================================================================