# ============================================================================
# MIGRATION: Merge de Múltiplas Heads
# ============================================================================
# Descrição: Unifica as branches divergentes do Alembic
# Data: 20/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

"""merge heads

Revision ID: merge_heads_001
Revises: 52fb5e3cc39b, seed_admin_001
Create Date: 2025-10-20 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'merge_heads_001'
down_revision: Union[str, Sequence[str], None] = ('52fb5e3cc39b', 'seed_admin_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Migration de merge - não faz nenhuma alteração no banco.
    Apenas unifica as duas branches do Alembic.
    """
    pass


def downgrade() -> None:
    """
    Rollback da migration de merge.
    """
    pass


# ============================================================================
# EXPLICAÇÃO:
# ============================================================================
# Esta migration não altera o banco de dados, apenas resolve o conflito
# de múltiplas heads no Alembic, permitindo que 'alembic upgrade head' 
# funcione corretamente.
#
# Após aplicar esta migration, teremos uma única head novamente.
# ============================================================================