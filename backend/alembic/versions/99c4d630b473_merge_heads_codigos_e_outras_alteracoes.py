"""merge heads codigos e outras alteracoes

Revision ID: 99c4d630b473
Revises: ac1abb28fdab, 8d9e0f11bc3g
Create Date: 2025-10-24 10:11:51.949640

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99c4d630b473'
down_revision: Union[str, Sequence[str], None] = ('ac1abb28fdab', '8d9e0f11bc3g')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
