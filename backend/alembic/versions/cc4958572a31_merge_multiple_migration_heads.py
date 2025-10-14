"""merge multiple migration heads

Revision ID: cc4958572a31
Revises: 1fe1d1547c32, adicionar_unidade_receita
Create Date: 2025-10-09 16:09:05.140684

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc4958572a31'
down_revision: Union[str, Sequence[str], None] = '1fe1d1547c32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
