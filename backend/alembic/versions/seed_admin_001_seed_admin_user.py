# ============================================================================
# MIGRATION: Seed Usuário Admin Inicial (CORRIGIDA)
# ============================================================================
# Localização: backend/alembic/versions/seed_admin_001_seed_admin_user.py
# Descrição: Cria usuário administrador padrão (apenas se não existir)
# Data: 20/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

"""seed_admin_user

Revision ID: seed_admin_001
Revises: 50f866955790
Create Date: 2025-10-20 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision: str = 'seed_admin_001'
down_revision: Union[str, None] = '50f866955790'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Configurar bcrypt para gerar hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    """
    Cria usuário administrador padrão se não existir.
    """
    # Obter conexão do Alembic
    bind = op.get_bind()
    session = Session(bind=bind)
    
    # Verificar se já existe usuário admin
    result = session.execute(
        text("SELECT id FROM users WHERE username = 'admin' LIMIT 1")
    )
    existing_admin = result.fetchone()
    
    if existing_admin:
        print("⚠️  Usuário 'admin' já existe. Pulando criação.")
        return
    
    # Gerar hash da senha 'admin123' dinamicamente
    password_hash = pwd_context.hash("admin123")
    
    # Inserir usuário admin
    session.execute(
        text("""
            INSERT INTO users (
                username, 
                email, 
                password_hash, 
                role, 
                restaurante_id, 
                ativo, 
                primeiro_acesso,
                created_at,
                updated_at
            ) VALUES (
                'admin',
                'admin@iogar.com',
                :password_hash,
                'ADMIN',
                NULL,
                true,
                false,
                NOW(),
                NOW()
            )
        """),
        {"password_hash": password_hash}
    )
    
    session.commit()
    print("✅ Usuário 'admin' criado com sucesso!")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Role: ADMIN")


def downgrade() -> None:
    """
    Remove usuário administrador padrão.
    """
    bind = op.get_bind()
    session = Session(bind=bind)
    
    session.execute(
        text("DELETE FROM users WHERE username = 'admin'")
    )
    
    session.commit()
    print("✅ Usuário 'admin' removido")


# ============================================================================
# MUDANÇAS NESTA VERSÃO CORRIGIDA:
# ============================================================================
# - Importa passlib.context.CryptContext
# - Gera hash dinamicamente com pwd_context.hash()
# - Remove hash hardcoded que não funcionava
# - Garante compatibilidade com a função verify_password do sistema
# ============================================================================