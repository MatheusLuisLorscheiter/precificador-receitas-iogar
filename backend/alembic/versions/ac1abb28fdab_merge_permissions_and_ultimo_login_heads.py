"""merge permissions and ultimo_login heads

Revision ID: ac1abb28fdab
Revises: add_created_by_field, add_ultimo_login_001
Create Date: 2025-10-22 11:36:17.723544

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac1abb28fdab'
down_revision: Union[str, Sequence[str], None] = ('add_created_by_field', 'add_ultimo_login_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
