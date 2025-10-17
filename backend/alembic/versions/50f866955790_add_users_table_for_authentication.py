"""add_users_table_for_authentication

Revision ID: 50f866955790
Revises: d6bb21dbdaa2
Create Date: 2025-10-17 11:16:13.381928

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50f866955790'
down_revision: Union[str, Sequence[str], None] = 'd6bb21dbdaa2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Cria a tabela de usuários para o sistema de autenticação.
    
    Estrutura:
    - id: Chave primária
    - username: Nome de usuário único
    - email: Email único
    - password_hash: Hash bcrypt da senha
    - role: Perfil do usuário (ADMIN, CONSULTANT, STORE)
    - restaurante_id: FK para restaurantes (obrigatório para STORE)
    - ativo: Status de ativação
    - primeiro_acesso: Flag para forçar troca de senha
    - created_at: Data de criação
    - updated_at: Data de atualização
    """
    # Criar tabela users
    op.create_table(
        'users',
        
        # Coluna de ID (chave primária)
        sa.Column('id', sa.Integer(), nullable=False),
        
        # Colunas de credenciais
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        
        # Coluna de perfil/role
        sa.Column('role', sa.String(length=20), nullable=False),
        
        # Relacionamento com restaurante
        sa.Column('restaurante_id', sa.Integer(), nullable=True),
        
        # Colunas de controle
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('primeiro_acesso', sa.Boolean(), nullable=False, server_default='true'),
        
        # Colunas de auditoria
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['restaurante_id'], ['restaurantes.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )
    
    # Criar índices para otimizar consultas
    op.create_index(
        'ix_users_id',
        'users',
        ['id'],
        unique=False
    )
    
    op.create_index(
        'ix_users_username',
        'users',
        ['username'],
        unique=True
    )
    
    op.create_index(
        'ix_users_email',
        'users',
        ['email'],
        unique=True
    )
    
    op.create_index(
        'ix_users_restaurante_id',
        'users',
        ['restaurante_id'],
        unique=False
    )
    
    # Criar constraint de check para validar roles
    op.create_check_constraint(
        'check_user_role',
        'users',
        "role IN ('ADMIN', 'CONSULTANT', 'STORE')"
    )
    
    print("✅ Tabela 'users' criada com sucesso")
    print("✅ Índices criados para otimização")
    print("✅ Constraints de validação aplicadas")


def downgrade() -> None:
    """
    Remove a tabela de usuários e todos os índices/constraints.
    
    ATENÇÃO: Esta operação é destrutiva e removerá todos os usuários!
    Use apenas em desenvolvimento ou com backup do banco.
    """
    # Remover constraint de check
    op.drop_constraint('check_user_role', 'users', type_='check')
    
    # Remover índices
    op.drop_index('ix_users_restaurante_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    
    # Remover tabela
    op.drop_table('users')
    
    print("⚠️  Tabela 'users' removida")
    print("⚠️  Todos os usuários foram deletados")