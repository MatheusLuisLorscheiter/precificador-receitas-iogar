"""Adicionar tabela codigos_disponiveis e campo restaurante_id em insumos

Revision ID: 8d9e0f11bc3g
Revises: 7c8d9e10ab2f
Create Date: 2025-10-24 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# ===================================================================================================
# IDENTIFICADORES DA REVISION
# ===================================================================================================
revision: str = '8d9e0f11bc3g'
down_revision: Union[str, Sequence[str], None] = '7c8d9e10ab2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Aplica as alterações para suporte a códigos automáticos por restaurante.
    
    Alterações:
    1. Cria tabela codigos_disponiveis (se não existir)
    2. Adiciona campo restaurante_id na tabela insumos (se não existir)
    3. Cria índices e constraints necessários
    """
    
    # Obter conexão para verificar existência de objetos
    conn = op.get_bind()
    
    # ===================================================================================================
    # 1. CRIAR TABELA CODIGOS_DISPONIVEIS (SE NÃO EXISTIR)
    # ===================================================================================================
    
    # Verificar se tabela já existe
    result = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'codigos_disponiveis'
        );
    """))
    tabela_existe = result.scalar()
    
    if not tabela_existe:
        op.create_table(
            'codigos_disponiveis',
            sa.Column('id', sa.Integer(), nullable=False, comment='ID único do registro'),
            sa.Column('restaurante_id', sa.Integer(), nullable=False, comment='ID do restaurante proprietário do código'),
            sa.Column('codigo', sa.Integer(), nullable=False, comment='Código numérico (3000-5999)'),
            sa.Column('tipo', sa.String(length=20), nullable=False, comment="Tipo: 'receita', 'receita_processada', 'insumo'"),
            sa.Column('disponivel', sa.Boolean(), nullable=False, server_default='true', comment='True se código está disponível para uso'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, comment='Data de criação do registro'),
            sa.Column('usado_em', sa.DateTime(timezone=True), nullable=True, comment='Data em que o código foi usado'),
            
            # Primary Key
            sa.PrimaryKeyConstraint('id'),
            
            # Foreign Key para restaurantes
            sa.ForeignKeyConstraint(['restaurante_id'], ['restaurantes.id'], ondelete='CASCADE'),
            
            # Constraint de unicidade
            sa.UniqueConstraint('restaurante_id', 'codigo', 'tipo', name='uq_restaurante_codigo_tipo'),
        )
        
        # Criar índices para otimizar buscas
        op.create_index('ix_codigos_disponiveis_id', 'codigos_disponiveis', ['id'], unique=False)
        op.create_index('ix_codigos_disponiveis_restaurante_id', 'codigos_disponiveis', ['restaurante_id'], unique=False)
        op.create_index('ix_codigos_disponiveis_codigo', 'codigos_disponiveis', ['codigo'], unique=False)
        op.create_index('ix_codigos_disponiveis_tipo', 'codigos_disponiveis', ['tipo'], unique=False)
        op.create_index('idx_restaurante_tipo_disponivel', 'codigos_disponiveis', ['restaurante_id', 'tipo', 'disponivel'], unique=False)
    
    # ===================================================================================================
    # 2. ADICIONAR CAMPO RESTAURANTE_ID NA TABELA INSUMOS (SE NÃO EXISTIR)
    # ===================================================================================================
    
    # Verificar se coluna já existe
    result = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'insumos' 
            AND column_name = 'restaurante_id'
        );
    """))
    coluna_existe = result.scalar()
    
    if not coluna_existe:
        # Adicionar coluna restaurante_id (temporariamente nullable)
        op.add_column(
            'insumos',
            sa.Column(
                'restaurante_id',
                sa.Integer(),
                nullable=True,
                comment='ID do restaurante proprietário do insumo'
            )
        )
        
        # Atualizar insumos existentes com o primeiro restaurante disponível
        op.execute("""
            UPDATE insumos
            SET restaurante_id = (SELECT id FROM restaurantes ORDER BY id LIMIT 1)
            WHERE restaurante_id IS NULL
        """)
        
        # Tornar o campo NOT NULL
        op.alter_column('insumos', 'restaurante_id', nullable=False)
        
        # Criar foreign key
        op.create_foreign_key(
            'fk_insumos_restaurante',
            'insumos',
            'restaurantes',
            ['restaurante_id'],
            ['id'],
            ondelete='CASCADE'
        )
        
        # Criar índice
        op.create_index('ix_insumos_restaurante_id', 'insumos', ['restaurante_id'], unique=False)
        
def downgrade() -> None:
    """
    Reverte as alterações caso necessário.
    
    ATENÇÃO: O downgrade removerá a separação de insumos por restaurante.
    Use com cuidado em produção.
    """
    
    # Remover índice de insumos
    op.drop_index('ix_insumos_restaurante_id', table_name='insumos')
    
    # Remover foreign key de insumos
    op.drop_constraint('fk_insumos_restaurante', 'insumos', type_='foreignkey')
    
    # Remover coluna restaurante_id de insumos
    op.drop_column('insumos', 'restaurante_id')
    
    # Remover índices da tabela codigos_disponiveis
    op.drop_index('idx_restaurante_tipo_disponivel', table_name='codigos_disponiveis')
    op.drop_index('ix_codigos_disponiveis_tipo', table_name='codigos_disponiveis')
    op.drop_index('ix_codigos_disponiveis_codigo', table_name='codigos_disponiveis')
    op.drop_index('ix_codigos_disponiveis_restaurante_id', table_name='codigos_disponiveis')
    op.drop_index('ix_codigos_disponiveis_id', table_name='codigos_disponiveis')
    
    # Remover tabela codigos_disponiveis
    op.drop_table('codigos_disponiveis')