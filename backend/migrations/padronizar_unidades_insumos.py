# ============================================================================
# MIGRAÇÃO: Padronizar unidades de medida dos insumos
# ============================================================================
# Descrição: Atualiza unidades existentes para o padrão do sistema
# Data: 05/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Carregar variáveis de ambiente
load_dotenv()

def executar_migracao_unidades():
    """
    Executa a migração para padronizar unidades de medida.
    
    Conversões aplicadas:
    - 'G' → 'g'
    - 'cx' → 'caixa'
    - 'pct' → 'pacote'
    - 'un' → 'unidade'
    - 'l' → 'L'
    
    Returns:
        bool: True se sucesso, False caso contrário
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ Erro: DATABASE_URL não encontrada no arquivo .env")
        return False
    
    try:
        engine = create_engine(DATABASE_URL)
        
        print("🔄 Iniciando padronização de unidades de medida...")
        
        with engine.connect() as connection:
            # Inicia transação
            trans = connection.begin()
            
            try:
                # ================================================================
                # ETAPA 1: Verificar unidades atuais
                # ================================================================
                print("📝 Etapa 1: Verificando unidades atuais...")
                
                resultado = connection.execute(text("""
                    SELECT unidade, COUNT(*) as quantidade
                    FROM insumos 
                    GROUP BY unidade 
                    ORDER BY quantidade DESC;
                """)).fetchall()
                
                print("   📊 Unidades encontradas:")
                for row in resultado:
                    print(f"     - {row.unidade}: {row.quantidade} insumos")
                
                # ================================================================
                # ETAPA 2: Padronizar unidades na tabela insumos
                # ================================================================
                print("📝 Etapa 2: Padronizando unidades na tabela insumos...")
                
                # Mapear unidades para o padrão
                mapeamentos = {
                    'G': 'g',
                    'cx': 'caixa', 
                    'pct': 'pacote',
                    'un': 'unidade',
                    'l': 'L'
                }
                
                total_atualizados = 0
                for unidade_antiga, unidade_nova in mapeamentos.items():
                    resultado = connection.execute(text("""
                        UPDATE insumos 
                        SET unidade = :unidade_nova 
                        WHERE unidade = :unidade_antiga;
                    """), {"unidade_nova": unidade_nova, "unidade_antiga": unidade_antiga})
                    
                    if resultado.rowcount > 0:
                        print(f"   ✅ {resultado.rowcount} insumos: '{unidade_antiga}' → '{unidade_nova}'")
                        total_atualizados += resultado.rowcount
                
                # ================================================================
                # ETAPA 3: Padronizar unidades na tabela fornecedor_insumos
                # ================================================================
                print("📝 Etapa 3: Padronizando unidades na tabela fornecedor_insumos...")
                
                # Verificar se tabela existe
                tabela_existe = connection.execute(text("""
                    SELECT COUNT(*) as existe
                    FROM information_schema.tables 
                    WHERE table_name = 'fornecedor_insumos';
                """)).fetchone()
                
                if tabela_existe.existe > 0:
                    total_fornecedor_atualizados = 0
                    for unidade_antiga, unidade_nova in mapeamentos.items():
                        resultado = connection.execute(text("""
                            UPDATE fornecedor_insumos 
                            SET unidade = :unidade_nova 
                            WHERE unidade = :unidade_antiga;
                        """), {"unidade_nova": unidade_nova, "unidade_antiga": unidade_antiga})
                        
                        if resultado.rowcount > 0:
                            print(f"   ✅ {resultado.rowcount} fornecedor_insumos: '{unidade_antiga}' → '{unidade_nova}'")
                            total_fornecedor_atualizados += resultado.rowcount
                else:
                    print("   ℹ️  Tabela fornecedor_insumos não existe ainda")
                
                # ================================================================
                # ETAPA 4: Verificar resultado final
                # ================================================================
                print("📝 Etapa 4: Verificando resultado final...")
                
                resultado = connection.execute(text("""
                    SELECT unidade, COUNT(*) as quantidade
                    FROM insumos 
                    GROUP BY unidade 
                    ORDER BY quantidade DESC;
                """)).fetchall()
                
                print("   📊 Unidades após padronização:")
                for row in resultado:
                    print(f"     - {row.unidade}: {row.quantidade} insumos")
                
                # Confirmar transação
                trans.commit()
                
                print(f"   📈 Total de registros atualizados: {total_atualizados}")
                
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Erro durante a migração: {str(e)}")
                return False
                
    except Exception as e:
        print(f"❌ Erro de conexão: {str(e)}")
        return False

def verificar_migracao_necessaria():
    """
    Verifica se a migração é necessária.
    
    Returns:
        bool: True se há unidades não padronizadas
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        return False
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Verificar se há unidades não padronizadas
            resultado = connection.execute(text("""
                SELECT COUNT(*) as quantidade
                FROM insumos 
                WHERE unidade IN ('G', 'cx', 'pct', 'un', 'l');
            """)).fetchone()
            
            return resultado.quantidade > 0
            
    except Exception:
        return False

def main():
    """
    Função principal do script de migração.
    """
    print("=" * 70)
    print("🔧 MIGRAÇÃO: Padronizar Unidades de Medida dos Insumos")
    print("=" * 70)
    
    # Verificar se a migração é necessária
    if not verificar_migracao_necessaria():
        print("ℹ️  Não há unidades para padronizar.")
        print("   Todas as unidades já estão no padrão correto.")
        return
    
    # Solicitar confirmação
    print("⚠️  Esta migração irá:")
    print("   - Padronizar unidades de medida existentes")
    print("   - 'G' → 'g'")
    print("   - 'cx' → 'caixa'")
    print("   - 'pct' → 'pacote'")
    print("   - 'un' → 'unidade'")
    print("   - 'l' → 'L'")
    print()
    
    confirmacao = input("🤔 Deseja continuar? (s/N): ").lower().strip()
    
    if confirmacao not in ['s', 'sim', 'y', 'yes']:
        print("❌ Migração cancelada pelo usuário.")
        return
    
    # Executar migração
    sucesso = executar_migracao_unidades()
    
    if sucesso:
        print()
        print("✅ Padronização concluída com sucesso!")
        print("💡 Agora todas as unidades seguem o padrão: kg, g, L, ml, unidade, caixa, pacote")
    else:
        print()
        print("❌ Falha na padronização. Verifique os logs acima.")
        sys.exit(1)

if __name__ == "__main__":
    main()