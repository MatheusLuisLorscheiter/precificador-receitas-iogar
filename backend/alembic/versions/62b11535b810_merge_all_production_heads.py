"""merge_all_production_heads

Revision ID: 62b11535b810
Revises: 663f7b84ef6b, 697b91c39604, merge_importacao_heads
Create Date: 2025-11-03 13:35:39.025387

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62b11535b810'
down_revision: Union[str, Sequence[str], None] = ('663f7b84ef6b', '697b91c39604', 'merge_importacao_heads')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
