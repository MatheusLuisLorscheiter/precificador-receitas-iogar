"""adicionar_campos_faltantes_receitas

Revision ID: 4f5b4f21005c
Revises: 6e084e709b5e
Create Date: 2025-10-02 14:53:30.294153

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4f5b4f21005c'
down_revision: Union[str, Sequence[str], None] = '6e084e709b5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - migration vazia pois alterações já aplicadas."""
    # Esta migration foi gerada após as correções manuais já terem sido feitas
    # Mantendo vazia para não causar conflitos com o estado atual do banco
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass