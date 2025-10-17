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
    # Adicionar coluna tem_insumos_sem_preco (se não existir)
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receitas' AND column_name='tem_insumos_sem_preco'
            ) THEN
                ALTER TABLE receitas 
                ADD COLUMN tem_insumos_sem_preco BOOLEAN DEFAULT FALSE NOT NULL;
                
                COMMENT ON COLUMN receitas.tem_insumos_sem_preco 
                IS 'TRUE se a receita possui insumos sem preço definido';
            END IF;
        END $$;
    """)
    
    # Adicionar coluna insumos_pendentes (se não existir)
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receitas' AND column_name='insumos_pendentes'
            ) THEN
                ALTER TABLE receitas 
                ADD COLUMN insumos_pendentes JSON;
                
                COMMENT ON COLUMN receitas.insumos_pendentes 
                IS 'Lista de IDs dos insumos que estão sem preço';
            END IF;
        END $$;
    """)

def downgrade() -> None:
    """
    Remove os campos de controle de insumos pendentes.
    """
    op.drop_column('receitas', 'insumos_pendentes')
    op.drop_column('receitas', 'tem_insumos_sem_preco')