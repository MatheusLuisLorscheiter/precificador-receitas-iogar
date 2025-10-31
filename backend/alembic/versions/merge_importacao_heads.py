"""merge importacao heads

Revision ID: merge_importacao_heads
Revises: 99c4d630b473, add_importacao_id
Create Date: 2025-10-31 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Identificadores de revisão usados pelo Alembic
revision: str = 'merge_importacao_heads'
down_revision: Union[str, Sequence[str], None] = ('99c4d630b473', 'add_importacao_id')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Migration de merge - não faz alterações no banco.
    Apenas unifica as duas branches do Alembic para resolver o conflito de múltiplas heads.
    """
    pass


def downgrade() -> None:
    """
    Rollback da migration de merge.
    """
    pass