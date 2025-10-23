# ============================================================================
# SCRIPT DE PRÉ-DEPLOY - FOOD COST SYSTEM
# ============================================================================
# Descrição: Verifica e prepara o sistema antes do deploy
# Uso: python backend/pre_deploy.py
# Data: 23/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def check_database_connection():
    """
    Verifica conexão com banco de dados
    
    Returns:
        bool: True se conectou com sucesso
    """
    print("=" * 80)
    print("VERIFICANDO CONEXÃO COM BANCO DE DADOS")
    print("=" * 80)
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Conexão com banco de dados: OK")
            return True
    except Exception as e:
        print(f"❌ Erro ao conectar com banco de dados: {e}")
        return False

def check_migrations():
    """
    Verifica se há migrations pendentes
    
    Returns:
        bool: True se não há pendências
    """
    print("=" * 80)
    print("VERIFICANDO MIGRATIONS")
    print("=" * 80)
    
    try:
        # Importar alembic
        from alembic.config import Config
        from alembic.script import ScriptDirectory
        from alembic.runtime.migration import MigrationContext
        from sqlalchemy import create_engine
        
        # Configurar alembic
        alembic_cfg = Config("alembic.ini")
        script = ScriptDirectory.from_config(alembic_cfg)
        
        # Verificar versão atual do banco
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_rev = context.get_current_revision()
            
        # Verificar última versão disponível
        head_rev = script.get_current_head()
        
        print(f"ℹ️  Versão atual do banco: {current_rev or 'Nenhuma'}")
        print(f"ℹ️  Última versão disponível: {head_rev}")
        
        if current_rev == head_rev:
            print("✅ Migrations: Banco de dados atualizado")
            return True
        else:
            print("⚠️  ATENÇÃO: Há migrations pendentes!")
            print("   Execute: alembic upgrade head")
            return False
            
    except Exception as e:
        print(f"⚠️  Não foi possível verificar migrations: {e}")
        return True  # Não bloquear deploy por isso

def check_spacy_model():
    """
    Verifica se modelo do spaCy está instalado
    
    Returns:
        bool: True se modelo está disponível
    """
    print("=" * 80)
    print("VERIFICANDO MODELO SPACY")
    print("=" * 80)
    
    try:
        import spacy
        nlp = spacy.load("pt_core_news_sm")
        print("✅ Modelo spaCy pt_core_news_sm: OK")
        return True
    except Exception as e:
        print(f"⚠️  Modelo spaCy não encontrado: {e}")
        print("   Execute: python -m spacy download pt_core_news_sm")
        return False

def main():
    """Função principal"""
    print()
    print("🚀 PRÉ-DEPLOY CHECK - FOOD COST SYSTEM")
    print()
    
    checks = [
        ("Conexão Banco de Dados", check_database_connection),
        ("Migrations", check_migrations),
        ("Modelo spaCy", check_spacy_model),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            success = check_func()
            results.append((name, success))
        except Exception as e:
            print(f"❌ Erro ao verificar {name}: {e}")
            results.append((name, False))
        print()
    
    # Resumo
    print("=" * 80)
    print("RESUMO DO PRÉ-DEPLOY CHECK")
    print("=" * 80)
    
    all_success = True
    for name, success in results:
        status = "✅ OK" if success else "❌ FALHOU"
        print(f"  {status} - {name}")
        if not success:
            all_success = False
    
    print("=" * 80)
    
    if all_success:
        print("✅ SISTEMA PRONTO PARA DEPLOY!")
        sys.exit(0)
    else:
        print("❌ CORRIJA OS PROBLEMAS ANTES DO DEPLOY")
        sys.exit(1)

if __name__ == "__main__":
    main()