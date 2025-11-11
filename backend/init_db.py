#!/usr/bin/env python3
# ============================================================================
# SCRIPT DE INICIALIZACAO DO BANCO DE DADOS
# ============================================================================
# Descricao: Cria todas as tabelas do sistema na ordem correta
# Data: 11/11/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import sys
import os

# Adicionar o diretorio backend ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text

# Importar Base e engine do database
from app.database import engine, Base

# Importar todos os modelos para garantir que Base conheca todas as tabelas
# IMPORTANTE: Importar DEPOIS do Base para evitar circular imports
import app.models.fornecedor
import app.models.fornecedor_insumo
import app.models.importacao_insumo
import app.models.insumo
import app.models.taxonomia
import app.models.taxonomia_alias
import app.models.receita
import app.models.codigo_disponivel
import app.models.user
import app.models.permission

def init_database():
    """
    Inicializa o banco de dados criando todas as tabelas
    """
    print("=" * 80)
    print("INICIALIZANDO BANCO DE DADOS - FOOD COST SYSTEM")
    print("=" * 80)
    
    try:
        # Testar conexao
        print("\n1. Testando conexao com o banco de dados...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("   ✓ Conexao estabelecida com sucesso!")
        
        # Criar extensao uuid-ossp se nao existir (para PostgreSQL)
        print("\n2. Verificando extensoes do PostgreSQL...")
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""))
            conn.commit()
            print("   ✓ Extensao uuid-ossp verificada!")
        
        # Criar todas as tabelas
        print("\n3. Criando tabelas do sistema...")
        Base.metadata.create_all(bind=engine, checkfirst=True)
        print("   ✓ Tabelas criadas com sucesso!")

        # Criar usuario administrador
        print("\n4. Criando usuario administrador...")
        from sqlalchemy.orm import Session
        from app.models.user import User, UserRole
        from app.core.security import get_password_hash
        
        with Session(engine) as session:
            # Verificar se admin ja existe
            admin = session.query(User).filter(User.username == 'admin').first()
            
            if not admin:
                admin = User(
                    username='admin',
                    email='admin@iogar.com',
                    password_hash=get_password_hash('admin123'),
                    role=UserRole.ADMIN,
                    restaurante_id=None,
                    ativo=True,
                    primeiro_acesso=False
                )
                session.add(admin)
                session.commit()
                print("   ✓ Usuario admin criado!")
                print("   📧 Email: admin@iogar.com")
                print("   🔑 Senha: admin123")
            else:
                print("   ⚠️ Usuario admin ja existe!")
        
        # Listar tabelas criadas
        print("\n5. Verificando tabelas criadas...")
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                ORDER BY tablename
            """))
            tables = [row[0] for row in result]
            print(f"   ✓ Total de tabelas: {len(tables)}")
            for table in tables:
                print(f"     - {table}")
        
        print("\n" + "=" * 80)
        print("BANCO DE DADOS INICIALIZADO COM SUCESSO!")
        print("=" * 80)
        return True
        
    except Exception as e:
        print("\n" + "=" * 80)
        print("ERRO AO INICIALIZAR BANCO DE DADOS!")
        print("=" * 80)
        print(f"\nErro: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)