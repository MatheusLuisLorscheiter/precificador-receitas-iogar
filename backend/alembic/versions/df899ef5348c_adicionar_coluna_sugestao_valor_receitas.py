"""adicionar_coluna_sugestao_valor_receitas

Revision ID: df899ef5348c
Revises: 4f5b4f21005c
Create Date: 2025-10-03 11:28:31.013873

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df899ef5348c'
down_revision: Union[str, Sequence[str], None] = '4f5b4f21005c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Adicionar coluna sugestao_valor na tabela receitas."""
    # Adicionar coluna de forma resiliente (não falha se já existir)
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receitas' AND column_name='sugestao_valor'
            ) THEN
                ALTER TABLE receitas 
                ADD COLUMN sugestao_valor INTEGER;
                
                COMMENT ON COLUMN receitas.sugestao_valor 
                IS 'Sugestão manual de preço pelo restaurante em centavos';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Remover coluna sugestao_valor da tabela receitas."""
    op.execute("ALTER TABLE receitas DROP COLUMN IF EXISTS sugestao_valor")
