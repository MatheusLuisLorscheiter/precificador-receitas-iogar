"""add_ultimo_login_to_users

Revision ID: add_ultimo_login_001
Revises: merge_heads_001
Create Date: 2025-10-20 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_ultimo_login_001'
down_revision: Union[str, None] = 'merge_heads_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adiciona coluna ultimo_login na tabela users.
    """
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Verificar se a coluna já existe
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'ultimo_login' not in columns:
        op.add_column(
            'users',
            sa.Column(
                'ultimo_login',
                sa.DateTime(timezone=True),
                nullable=True,
                comment='Data e hora do último login'
            )
        )
        print("✅ Coluna 'ultimo_login' adicionada à tabela users")
    else:
        print("⚠️  Coluna 'ultimo_login' já existe, pulando criação")


def downgrade() -> None:
    """
    Remove coluna ultimo_login da tabela users.
    """
    op.drop_column('users', 'ultimo_login')
    print("✅ Coluna 'ultimo_login' removida da tabela users")