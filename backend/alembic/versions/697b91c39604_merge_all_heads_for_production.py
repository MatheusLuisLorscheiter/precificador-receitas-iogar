"""merge all heads for production

Revision ID: 697b91c39604
Revises: 663f7b84ef6b, merge_importacao_heads
Create Date: 2025-10-31 18:14:01.162590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '697b91c39604'
down_revision: Union[str, Sequence[str], None] = '42bb8877aa65'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
