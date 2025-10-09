"""adicionar_coluna_unidade_receitas

Revision ID: adicionar_unidade_receita
Revises: bf1e4ca961b0
Create Date: 2025-10-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'adicionar_unidade_receita'
down_revision: Union[str, Sequence[str], None] = 'bf1e4ca961b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Adicionar coluna unidade na tabela receitas."""
    # Adicionar coluna unidade de forma resiliente
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receitas' AND column_name='unidade'
            ) THEN
                ALTER TABLE receitas 
                ADD COLUMN unidade VARCHAR(20) DEFAULT 'unidade' NOT NULL;
                
                COMMENT ON COLUMN receitas.unidade 
                IS 'Unidade de medida da receita (kg, g, L, ml, unidade, porção)';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Remover coluna unidade da tabela receitas."""
    op.execute("ALTER TABLE receitas DROP COLUMN IF EXISTS unidade")