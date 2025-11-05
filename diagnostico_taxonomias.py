# ============================================================================
# SCRIPT DE DIAGNÓSTICO - TAXONOMIAS
# ============================================================================
# Descrição: Verifica estado das taxonomias no banco de dados
# Autor: Will - Empresa: IOGAR
# ============================================================================

import sys
import os

# Adicionar path do backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Importar configuração do banco
from app.database import DATABASE_URL
from app.models.taxonomia import Taxonomia
from app.crud import taxonomia as crud_taxonomia

# ============================================================================
# FUNÇÕES DE DIAGNÓSTICO
# ============================================================================

def verificar_conexao_banco():
    """Verifica se consegue conectar no banco"""
    print("=" * 80)
    print("VERIFICANDO CONEXÃO COM BANCO DE DADOS")
    print("=" * 80)
    
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Conexão com banco de dados: OK")
            return engine
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return None

def verificar_tabela_taxonomias(engine):
    """Verifica se a tabela taxonomias existe"""
    print("\n" + "=" * 80)
    print("VERIFICANDO TABELA TAXONOMIAS")
    print("=" * 80)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'taxonomias'
                )
            """))
            existe = result.scalar()
            
            if existe:
                print("✅ Tabela 'taxonomias' existe")
                return True
            else:
                print("❌ Tabela 'taxonomias' NÃO existe")
                print("   Execute: alembic upgrade head")
                return False
    except Exception as e:
        print(f"❌ Erro ao verificar tabela: {e}")
        return False

def contar_taxonomias(engine):
    """Conta quantas taxonomias existem"""
    print("\n" + "=" * 80)
    print("CONTANDO TAXONOMIAS")
    print("=" * 80)
    
    try:
        with engine.connect() as conn:
            # Total de taxonomias
            result = conn.execute(text("SELECT COUNT(*) FROM taxonomias"))
            total = result.scalar()
            print(f"📊 Total de taxonomias: {total}")
            
            # Taxonomias ativas
            result = conn.execute(text("SELECT COUNT(*) FROM taxonomias WHERE ativo = true"))
            ativas = result.scalar()
            print(f"📊 Taxonomias ativas: {ativas}")
            
            # Taxonomias inativas
            inativas = total - ativas
            print(f"📊 Taxonomias inativas: {inativas}")
            
            return total, ativas, inativas
    except Exception as e:
        print(f"❌ Erro ao contar taxonomias: {e}")
        return 0, 0, 0

def listar_categorias(engine):
    """Lista todas as categorias únicas"""
    print("\n" + "=" * 80)
    print("LISTANDO CATEGORIAS")
    print("=" * 80)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT DISTINCT categoria 
                FROM taxonomias 
                WHERE ativo = true 
                ORDER BY categoria
            """))
            
            categorias = [row[0] for row in result]
            
            if categorias:
                print(f"✅ Encontradas {len(categorias)} categorias:")
                for i, cat in enumerate(categorias, 1):
                    print(f"   {i}. {cat}")
            else:
                print("⚠️  Nenhuma categoria encontrada")
                print("   O banco está vazio!")
            
            return categorias
    except Exception as e:
        print(f"❌ Erro ao listar categorias: {e}")
        return []

def listar_exemplos_taxonomias(engine):
    """Lista alguns exemplos de taxonomias"""
    print("\n" + "=" * 80)
    print("EXEMPLOS DE TAXONOMIAS (Primeiras 10)")
    print("=" * 80)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, categoria, subcategoria, especificacao, variante, nome_completo, ativo
                FROM taxonomias 
                ORDER BY id 
                LIMIT 10
            """))
            
            taxonomias = result.fetchall()
            
            if taxonomias:
                print(f"\n{'ID':<5} {'Categoria':<20} {'Subcategoria':<20} {'Ativo':<6}")
                print("-" * 80)
                for tax in taxonomias:
                    id_tax, cat, subcat, espec, var, nome, ativo = tax
                    status = "Sim" if ativo else "Não"
                    print(f"{id_tax:<5} {cat:<20} {subcat:<20} {status:<6}")
            else:
                print("⚠️  Nenhuma taxonomia encontrada no banco")
                print("\n💡 SOLUÇÃO:")
                print("   Execute o script de população:")
                print("   python backend/popular_taxonomias_gerais.py")
            
            return len(taxonomias)
    except Exception as e:
        print(f"❌ Erro ao listar taxonomias: {e}")
        return 0

def main():
    """Função principal"""
    print("\n")
    print("🔍 DIAGNÓSTICO DO SISTEMA DE TAXONOMIAS")
    print("\n")
    
    # 1. Verificar conexão
    engine = verificar_conexao_banco()
    if not engine:
        return
    
    # 2. Verificar se tabela existe
    if not verificar_tabela_taxonomias(engine):
        return
    
    # 3. Contar taxonomias
    total, ativas, inativas = contar_taxonomias(engine)
    
    # 4. Listar categorias
    categorias = listar_categorias(engine)
    
    # 5. Listar exemplos
    exemplos = listar_exemplos_taxonomias(engine)
    
    # Resumo final
    print("\n" + "=" * 80)
    print("RESUMO DO DIAGNÓSTICO")
    print("=" * 80)
    print(f"✅ Conexão: OK")
    print(f"✅ Tabela: OK")
    print(f"📊 Total de taxonomias: {total}")
    print(f"📊 Taxonomias ativas: {ativas}")
    print(f"📊 Categorias únicas: {len(categorias)}")
    
    if total == 0:
        print("\n⚠️  PROBLEMA IDENTIFICADO:")
        print("   O banco de dados está VAZIO!")
        print("\n💡 SOLUÇÃO:")
        print("   Execute o script de população de taxonomias:")
        print("   python backend/popular_taxonomias_gerais.py")
    elif len(categorias) == 0:
        print("\n⚠️  PROBLEMA IDENTIFICADO:")
        print("   Existem taxonomias mas nenhuma está ATIVA!")
        print("\n💡 SOLUÇÃO:")
        print("   Verifique as taxonomias inativas no banco")
    else:
        print("\n✅ Sistema de taxonomias OK!")
        print("   As categorias deveriam aparecer no frontend")
        print("\n🔍 Verifique:")
        print("   1. Logs do backend (console onde roda o FastAPI)")
        print("   2. Console do navegador (F12 -> Console)")
        print("   3. Network do navegador (F12 -> Network)")
    
    print("=" * 80)
    print()

if __name__ == "__main__":
    main()