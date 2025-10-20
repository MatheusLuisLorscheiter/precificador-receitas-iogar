# ============================================================================
# SCRIPT: Corrigir Senha do Usuário Admin
# ============================================================================
# Localização: backend/fix_admin_password.py
# Descrição: Atualiza a senha do admin usando a função correta de hash
# Data: 20/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Configurar bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Gera hash da senha"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha bate com o hash"""
    return pwd_context.verify(plain_password, hashed_password)

def fix_admin_password():
    """
    Atualiza a senha do admin para 'admin123' usando hash correto.
    """
    print("=" * 80)
    print("CORRIGIR SENHA DO USUÁRIO ADMIN")
    print("=" * 80)
    print()
    
    # URL do banco de dados (ajuste se necessário)
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres123@localhost:5432/foodcost_dev"
    )
    
    print(f"📊 Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")
    
    # Conectar ao banco de dados
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        print("✅ Conectado ao banco de dados")
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco: {e}")
        print()
        print("💡 Verifique:")
        print("   1. PostgreSQL está rodando?")
        print("   2. Credenciais corretas em .env.development?")
        print("   3. Banco de dados 'foodcost_dev' existe?")
        return
    
    # Buscar usuário admin usando SQL direto
    try:
        result = db.execute(
            text("SELECT id, username, email, password_hash FROM users WHERE username = 'admin'")
        )
        admin = result.fetchone()
    except Exception as e:
        print(f"❌ Erro ao buscar usuário: {e}")
        db.close()
        return
    
    if not admin:
        print("❌ Usuário 'admin' não encontrado no banco de dados")
        print("💡 Execute primeiro a migration:")
        print("   cd backend")
        print("   alembic upgrade head")
        db.close()
        return
    
    admin_id, username, email, old_hash = admin
    print(f"✅ Usuário '{username}' encontrado")
    print(f"   ID: {admin_id}")
    print(f"   Email: {email}")
    print()
    
    # Gerar novo hash usando a função correta
    nova_senha = "admin123"
    novo_hash = get_password_hash(nova_senha)
    
    print(f"🔐 Gerando novo hash para senha '{nova_senha}'...")
    print(f"   Hash antigo: {old_hash[:50]}...")
    print(f"   Hash novo:   {novo_hash[:50]}...")
    print()
    
    # Testar se o novo hash funciona
    if verify_password(nova_senha, novo_hash):
        print("✅ Novo hash validado com sucesso!")
    else:
        print("❌ ERRO: Novo hash não valida corretamente!")
        db.close()
        return
    
    # Atualizar no banco usando SQL direto
    try:
        db.execute(
            text("UPDATE users SET password_hash = :hash, primeiro_acesso = false WHERE id = :id"),
            {"hash": novo_hash, "id": admin_id}
        )
        db.commit()
        print()
        print("✅ Senha do admin atualizada com sucesso!")
        print()
        print("📋 Credenciais:")
        print("   Username: admin")
        print("   Password: admin123")
        print()
        print("🔐 Tente fazer login novamente")
        
    except Exception as e:
        print(f"❌ Erro ao atualizar senha: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_password()

# ============================================================================
# INSTRUÇÕES DE USO:
# ============================================================================
# 1. Salve este arquivo como: backend/fix_admin_password.py
# 2. Execute: python backend/fix_admin_password.py
# 3. Tente fazer login com: admin / admin123
# ============================================================================