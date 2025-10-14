"""adicionar_campos_insumos_pendentes_receita

Revision ID: [será gerado automaticamente]
Revises: cc4958572a31
Create Date: [será gerado automaticamente]

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a7cdaed17440'
down_revision = 'cc4958572a31'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Adiciona campos para rastreamento de insumos sem preço nas receitas.
    Permite marcar receitas como pendentes quando há insumos sem preço.
    """
    # Adicionar campo booleano para flag de pendência
    op.add_column('receitas', 
        sa.Column('tem_insumos_sem_preco', sa.Boolean(), nullable=False, 
                  server_default='false',
                  comment='TRUE se a receita possui insumos sem preço definido')
    )
    
    # Adicionar campo JSON para lista de insumos pendentes
    op.add_column('receitas',
        sa.Column('insumos_pendentes', postgresql.JSON(), nullable=True,
                  comment='Lista de IDs dos insumos que estão sem preço')
    )


def downgrade() -> None:
    """
    Remove os campos de controle de insumos pendentes.
    """
    op.drop_column('receitas', 'insumos_pendentes')
    op.drop_column('receitas', 'tem_insumos_sem_preco')