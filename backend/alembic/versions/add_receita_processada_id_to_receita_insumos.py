"""Adicionar suporte a receitas processadas como insumos

Revision ID: 7c8d9e10ab2f
Revises: 4f5b4f21005c
Create Date: 2025-10-07 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# ===================================================================================================
# IDENTIFICADORES DA REVISION
# ===================================================================================================
revision: str = '7c8d9e10ab2f'
down_revision: Union[str, Sequence[str], None] = 'cc4958572a31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adiciona suporte para receitas processadas serem usadas como insumos.
    
    Alterações:
    1. Adiciona coluna receita_processada_id (foreign key para receitas)
    2. Torna insumo_id nullable (agora pode ser NULL quando for receita processada)
    3. Adiciona check constraint para garantir que UM dos dois seja preenchido
    """
    
    # ===================================================================================================
    # ADICIONAR COLUNA receita_processada_id
    # ===================================================================================================
    op.add_column('receita_insumos', 
        sa.Column('receita_processada_id', sa.Integer(), nullable=True,
                  comment='ID da receita processada usada como insumo (quando aplicável)')
    )
    
    # ===================================================================================================
    # CRIAR FOREIGN KEY PARA RECEITAS
    # ===================================================================================================
    op.create_foreign_key(
        'fk_receita_insumos_receita_processada',
        'receita_insumos', 'receitas',
        ['receita_processada_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # ===================================================================================================
    # CRIAR ÍNDICE PARA PERFORMANCE
    # ===================================================================================================
    op.create_index(
        'idx_receita_insumos_receita_processada',
        'receita_insumos',
        ['receita_processada_id']
    )
    
    # ===================================================================================================
    # TORNAR insumo_id NULLABLE
    # ===================================================================================================
    op.alter_column('receita_insumos', 'insumo_id',
                    existing_type=sa.Integer(),
                    nullable=True,
                    comment='ID do insumo (NULL quando for receita processada)')
    
    # ===================================================================================================
    # ADICIONAR CHECK CONSTRAINT
    # Garante que EXATAMENTE UM dos dois campos seja preenchido
    # ===================================================================================================
    op.create_check_constraint(
        'check_insumo_ou_receita',
        'receita_insumos',
        '(insumo_id IS NOT NULL AND receita_processada_id IS NULL) OR '
        '(insumo_id IS NULL AND receita_processada_id IS NOT NULL)'
    )


def downgrade() -> None:
    """
    Reverte as alterações caso necessário.
    """
    
    # Remover check constraint
    op.drop_constraint('check_insumo_ou_receita', 'receita_insumos', type_='check')
    
    # Tornar insumo_id NOT NULL novamente
    op.alter_column('receita_insumos', 'insumo_id',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    # Remover índice
    op.drop_index('idx_receita_insumos_receita_processada', table_name='receita_insumos')
    
    # Remover foreign key
    op.drop_constraint('fk_receita_insumos_receita_processada', 'receita_insumos', type_='foreignkey')
    
    # Remover coluna
    op.drop_column('receita_insumos', 'receita_processada_id')