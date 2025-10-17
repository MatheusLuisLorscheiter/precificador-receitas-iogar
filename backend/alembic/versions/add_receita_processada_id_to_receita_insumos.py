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
    
    # Adicionar coluna receita_processada_id (se não existir)
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receita_insumos' AND column_name='receita_processada_id'
            ) THEN
                ALTER TABLE receita_insumos 
                ADD COLUMN receita_processada_id INTEGER;
                
                COMMENT ON COLUMN receita_insumos.receita_processada_id 
                IS 'ID da receita processada usada como insumo (quando aplicável)';
            END IF;
        END $$;
    """)
    
    # Criar foreign key (se não existir)
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'fk_receita_insumos_receita_processada'
            ) THEN
                ALTER TABLE receita_insumos 
                ADD CONSTRAINT fk_receita_insumos_receita_processada 
                FOREIGN KEY(receita_processada_id) REFERENCES receitas (id) ON DELETE CASCADE;
            END IF;
        END $$;
    """)
    
    # Criar índice (se não existir)
    op.execute('CREATE INDEX IF NOT EXISTS idx_receita_insumos_receita_processada ON receita_insumos (receita_processada_id)')
    
    # Alterar insumo_id para nullable (se necessário)
    op.execute("""
        DO $$ 
        BEGIN
            ALTER TABLE receita_insumos ALTER COLUMN insumo_id DROP NOT NULL;
        EXCEPTION
            WHEN others THEN NULL;
        END $$;
    """)
    
    # Criar constraint de check (se não existir)
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'check_insumo_ou_receita'
            ) THEN
                ALTER TABLE receita_insumos 
                ADD CONSTRAINT check_insumo_ou_receita 
                CHECK ((insumo_id IS NOT NULL AND receita_processada_id IS NULL) 
                    OR (insumo_id IS NULL AND receita_processada_id IS NOT NULL));
            END IF;
        END $$;
    """)


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