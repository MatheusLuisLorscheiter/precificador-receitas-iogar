# ============================================================================
# SCRIPT DE APLICAÇÃO DE MIGRATION
# ============================================================================
# Descrição: Aplica a migration de importação de insumos
# Data: 30/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import sys
from pathlib import Path
from sqlalchemy import text
from app.database import engine

def aplicar_migration():
    """
    Aplica a migration add_importacao_insumos.sql no banco de dados.
    """
    # Caminho do arquivo SQL
    migration_file = Path(__file__).parent / "migrations" / "add_importacao_insumos.sql"
    
    # Verificar se arquivo existe
    if not migration_file.exists():
        print(f"❌ Arquivo não encontrado: {migration_file}")
        sys.exit(1)
    
    print(f"📂 Lendo migration: {migration_file.name}")
    
    # Ler conteúdo do arquivo SQL
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print("🔄 Aplicando migration no banco de dados...")
    
    try:
        # Executar SQL
        with engine.begin() as connection:
            connection.execute(text(sql_content))
        
        print("✅ Migration aplicada com sucesso!")
        print("✅ Tabela 'importacoes_insumos' criada")
        print("✅ Campo 'importacao_id' adicionado em 'insumos'")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao aplicar migration: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("APLICAÇÃO DE MIGRATION - SISTEMA DE IMPORTAÇÃO")
    print("=" * 60)
    
    sucesso = aplicar_migration()
    
    print("=" * 60)
    sys.exit(0 if sucesso else 1)