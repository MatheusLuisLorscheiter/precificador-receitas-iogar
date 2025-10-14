"""merge_heads_a7cdaed17440_and_7c8d9e10ab2f

Revision ID: d6bb21dbdaa2
Revises: a7cdaed17440, 7c8d9e10ab2f
Create Date: 2025-10-14 17:04:18.926910

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd6bb21dbdaa2'
down_revision: Union[str, Sequence[str], None] = ('a7cdaed17440', '7c8d9e10ab2f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
