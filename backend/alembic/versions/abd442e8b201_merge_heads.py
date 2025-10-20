"""merge heads

Revision ID: abd442e8b201
Revises: 13e08a9c79f9, 7c8d9e10ab2f
Create Date: 2025-10-20 13:14:51.136007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abd442e8b201'
down_revision: Union[str, Sequence[str], None] = ('13e08a9c79f9', '7c8d9e10ab2f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
