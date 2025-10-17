"""recriar_tabela_taxonomia_aliases

Revision ID: 13e08a9c79f9
Revises: 50f866955790
Create Date: 2025-10-17 11:43:57.999532

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13e08a9c79f9'
down_revision: Union[str, Sequence[str], None] = '50f866955790'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Recria a tabela taxonomia_aliases que foi deletada erroneamente"""
    
    # Recriar tabela taxonomia_aliases
    op.execute("""
        CREATE TABLE IF NOT EXISTS taxonomia_aliases (
            id SERIAL PRIMARY KEY,
            taxonomia_id INTEGER NOT NULL REFERENCES taxonomias(id) ON DELETE CASCADE,
            nome_alternativo VARCHAR(255) NOT NULL,
            nome_normalizado VARCHAR(255) NOT NULL,
            tipo_alias VARCHAR(50) DEFAULT 'automatico',
            origem VARCHAR(100) DEFAULT 'manual',
            confianca INTEGER DEFAULT 90,
            ativo BOOLEAN DEFAULT TRUE,
            observacoes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Recriar índices
    op.execute('CREATE INDEX IF NOT EXISTS ix_taxonomia_aliases_id ON taxonomia_aliases(id)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_taxonomia_aliases_taxonomia_id ON taxonomia_aliases(taxonomia_id)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_taxonomia_aliases_nome_alternativo ON taxonomia_aliases(nome_alternativo)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_taxonomia_aliases_nome_normalizado ON taxonomia_aliases(nome_normalizado)')
    
    print("✅ Tabela taxonomia_aliases recriada com sucesso")


def downgrade() -> None:
    """Remove a tabela taxonomia_aliases"""
    op.execute('DROP TABLE IF EXISTS taxonomia_aliases CASCADE')
