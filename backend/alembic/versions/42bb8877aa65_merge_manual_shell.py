"""merge manual shell

Revision ID: 42bb8877aa65
Revises: 99c4d630b473, add_importacao_id
Create Date: 2025-10-31 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Identificadores de revisão
revision: str = '42bb8877aa65'
down_revision: Union[str, Sequence[str], None] = ('99c4d630b473', 'add_importacao_id')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Migration vazia - foi criada manualmente no Shell do Render.
    Esta migration existe apenas para sincronizar o histórico do Alembic.
    """
    pass


def downgrade() -> None:
    """Rollback."""
    pass