"""adicionar_colunas_processada_e_rendimento_receitas

Revision ID: bf1e4ca961b0
Revises: df899ef5348c
Create Date: 2025-10-03 14:46:17.990949

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf1e4ca961b0'
down_revision: Union[str, Sequence[str], None] = 'df899ef5348c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Adicionar colunas processada e rendimento na tabela receitas."""
    # Adicionar coluna processada de forma resiliente
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receitas' AND column_name='processada'
            ) THEN
                ALTER TABLE receitas 
                ADD COLUMN processada BOOLEAN DEFAULT FALSE;
                
                COMMENT ON COLUMN receitas.processada 
                IS 'Indica se a receita já foi processada/finalizada';
            END IF;
        END $$;
    """)
    
    # Adicionar coluna rendimento de forma resiliente
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receitas' AND column_name='rendimento'
            ) THEN
                ALTER TABLE receitas 
                ADD COLUMN rendimento INTEGER;
                
                COMMENT ON COLUMN receitas.rendimento 
                IS 'Rendimento da receita (quantidade produzida)';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Remover colunas processada e rendimento da tabela receitas."""
    op.execute("ALTER TABLE receitas DROP COLUMN IF EXISTS processada")
    op.execute("ALTER TABLE receitas DROP COLUMN IF EXISTS rendimento")
