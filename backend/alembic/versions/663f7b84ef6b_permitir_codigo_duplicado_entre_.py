"""permitir_codigo_duplicado_entre_restaurantes

Revision ID: 663f7b84ef6b
Revises: 918a2fc23a38
Create Date: 2025-10-27 16:06:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '663f7b84ef6b'
down_revision: Union[str, None] = '918a2fc23a38'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Permite que o mesmo código seja usado em restaurantes diferentes.
    
    Alterações:
    1. Remove constraint UNIQUE do campo 'codigo' na tabela 'insumos'
    2. Adiciona constraint UNIQUE composta (restaurante_id, codigo)
    """
    
    # ========================================================================
    # ETAPA 1: Remover constraint UNIQUE antiga do campo 'codigo'
    # ========================================================================
    print("🔧 Removendo constraint UNIQUE do campo 'codigo'...")
    
    # Primeiro, descobrir o nome da constraint existente
    # (pode variar dependendo de como foi criada)
    conn = op.get_bind()
    
    # Buscar nome da constraint
    result = conn.execute(sa.text("""
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'insumos' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%codigo%';
    """))
    
    constraint_name = result.scalar()
    
    if constraint_name:
        print(f"   Encontrada constraint: {constraint_name}")
        op.drop_constraint(constraint_name, 'insumos', type_='unique')
        print(f"   ✅ Constraint {constraint_name} removida")
    else:
        print("   ⚠️  Nenhuma constraint UNIQUE encontrada no campo 'codigo'")
    
    # ========================================================================
    # ETAPA 2: Adicionar nova constraint UNIQUE composta
    # ========================================================================
    print("🔧 Adicionando constraint UNIQUE composta (restaurante_id, codigo)...")
    
    op.create_unique_constraint(
        'uq_insumo_restaurante_codigo',
        'insumos',
        ['restaurante_id', 'codigo']
    )
    
    print("   ✅ Constraint uq_insumo_restaurante_codigo criada")
    print("✅ Migration aplicada com sucesso!")
    print("📝 Agora o mesmo código pode existir em restaurantes diferentes")


def downgrade() -> None:
    """
    Reverte as alterações - volta ao estado anterior.
    """
    
    # ========================================================================
    # ETAPA 1: Remover constraint composta
    # ========================================================================
    print("🔧 Removendo constraint composta...")
    op.drop_constraint('uq_insumo_restaurante_codigo', 'insumos', type_='unique')
    
    # ========================================================================
    # ETAPA 2: Recriar constraint UNIQUE no campo 'codigo'
    # ========================================================================
    print("🔧 Recriando constraint UNIQUE no campo 'codigo'...")
    op.create_unique_constraint('insumos_codigo_key', 'insumos', ['codigo'])
    
    print("✅ Downgrade aplicado com sucesso!")