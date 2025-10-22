"""Adicionar campo created_by nas tabelas principais para rastreamento

Revision ID: add_created_by_field
Revises: add_new_user_roles
Create Date: 2025-10-21 00:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_created_by_field'
down_revision: Union[str, Sequence[str], None] = 'add_new_user_roles'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adiciona campo created_by (FK para users) nas tabelas principais
    para rastrear quem criou cada registro.
    
    Tabelas afetadas:
    - receitas
    - insumos
    - fornecedores
    - restaurantes
    """
    
    # ========================================================================
    # ADICIONAR COLUNA created_by NA TABELA RECEITAS
    # ========================================================================
    
    op.add_column(
        'receitas',
        sa.Column(
            'created_by',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
            comment='ID do usuário que criou a receita'
        )
    )
    
    # Criar índice para performance
    op.create_index(
        'ix_receitas_created_by',
        'receitas',
        ['created_by']
    )
    
    # ========================================================================
    # ADICIONAR COLUNA created_by NA TABELA INSUMOS
    # ========================================================================
    
    op.add_column(
        'insumos',
        sa.Column(
            'created_by',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
            comment='ID do usuário que criou o insumo'
        )
    )
    
    # Criar índice para performance
    op.create_index(
        'ix_insumos_created_by',
        'insumos',
        ['created_by']
    )
    
    # ========================================================================
    # ADICIONAR COLUNA created_by NA TABELA FORNECEDORES
    # ========================================================================
    
    op.add_column(
        'fornecedores',
        sa.Column(
            'created_by',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
            comment='ID do usuário que criou o fornecedor'
        )
    )
    
    # Criar índice para performance
    op.create_index(
        'ix_fornecedores_created_by',
        'fornecedores',
        ['created_by']
    )
    
    # ========================================================================
    # ADICIONAR COLUNA created_by NA TABELA RESTAURANTES
    # ========================================================================
    
    op.add_column(
        'restaurantes',
        sa.Column(
            'created_by',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='SET NULL'),
            nullable=True,
            comment='ID do usuário que criou o restaurante'
        )
    )
    
    # Criar índice para performance
    op.create_index(
        'ix_restaurantes_created_by',
        'restaurantes',
        ['created_by']
    )


def downgrade() -> None:
    """
    Remove o campo created_by de todas as tabelas.
    """
    
    # ========================================================================
    # REMOVER DA TABELA RESTAURANTES
    # ========================================================================
    
    op.drop_index('ix_restaurantes_created_by', table_name='restaurantes')
    op.drop_column('restaurantes', 'created_by')
    
    # ========================================================================
    # REMOVER DA TABELA FORNECEDORES
    # ========================================================================
    
    op.drop_index('ix_fornecedores_created_by', table_name='fornecedores')
    op.drop_column('fornecedores', 'created_by')
    
    # ========================================================================
    # REMOVER DA TABELA INSUMOS
    # ========================================================================
    
    op.drop_index('ix_insumos_created_by', table_name='insumos')
    op.drop_column('insumos', 'created_by')
    
    # ========================================================================
    # REMOVER DA TABELA RECEITAS
    # ========================================================================
    
    op.drop_index('ix_receitas_created_by', table_name='receitas')
    op.drop_column('receitas', 'created_by')


# ============================================================================
# EXPLICAÇÃO:
# ============================================================================
# Esta migration adiciona rastreamento de criação de registros.
#
# O campo created_by:
# - É uma FK para users.id
# - Permite NULL (para registros antigos e compatibilidade)
# - ondelete='SET NULL' (se usuário for deletado, registro permanece)
# - Tem índice para queries eficientes
#
# Uso no código:
# - Ao criar receita: receita.created_by = current_user.id
# - Ao filtrar por PROPRIOS: query.filter(Receita.created_by == user.id)
# - Para validação: can_access_resource verifica o created_by
#
# Importante:
# - Registros existentes terão created_by = NULL
# - Novos registros devem sempre setar created_by
# - Sistema de permissões PROPRIOS depende deste campo
# ============================================================================