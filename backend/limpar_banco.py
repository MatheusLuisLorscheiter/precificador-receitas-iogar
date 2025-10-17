# ============================================================================
# SCRIPT PARA LIMPAR TODO O BANCO DE DADOS
# ============================================================================
# ATENÇÃO: Este script apaga TODOS os dados!
# Use apenas em desenvolvimento
# ============================================================================

from sqlalchemy import create_engine, text
from app.database import DATABASE_URL
import os

def limpar_banco():
    """
    Apaga todos os dados das tabelas principais
    """
    print("=" * 80)
    print("⚠️  ATENÇÃO: Este script vai APAGAR TODOS OS DADOS!")
    print("=" * 80)
    
    confirmacao = input("Digite 'CONFIRMAR' para prosseguir: ")
    
    if confirmacao != "CONFIRMAR":
        print("❌ Operação cancelada.")
        return
    
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            print("\n🗑️  Iniciando limpeza do banco...")
            
            # Ordem importante: primeiro dependências, depois tabelas principais
            tabelas = [
                "receita_insumos",
                "receitas",
                "insumos",
                "fornecedor_insumos",
                "fornecedores",
                "restaurantes",
                "taxonomia_aliases",
                "taxonomias"
            ]
            
            for tabela in tabelas:
                try:
                    conn.execute(text(f"DELETE FROM {tabela}"))
                    conn.commit()
                    print(f"✅ Tabela '{tabela}' limpa")
                except Exception as e:
                    print(f"⚠️  Erro ao limpar '{tabela}': {e}")
            
            # Resetar sequências (IDs voltam para 1)
            print("\n🔄 Resetando sequências de IDs...")
            sequencias = [
                "receitas_id_seq",
                "insumos_id_seq",
                "fornecedores_id_seq",
                "restaurantes_id_seq",
                "taxonomias_id_seq"
            ]
            
            for seq in sequencias:
                try:
                    conn.execute(text(f"ALTER SEQUENCE {seq} RESTART WITH 1"))
                    conn.commit()
                    print(f"✅ Sequência '{seq}' resetada")
                except Exception as e:
                    print(f"⚠️  '{seq}': {e}")
            
            print("\n" + "=" * 80)
            print("✅ BANCO DE DADOS LIMPO COM SUCESSO!")
            print("=" * 80)
            print("\n📌 Próximos passos:")
            print("1. Reinicie o backend")
            print("2. Cadastre novos dados pelo sistema")
            print("3. Os códigos serão: 3000, 4000, 5000 (apenas números)")
            
        except Exception as e:
            print(f"\n❌ Erro geral: {e}")
            conn.rollback()

if __name__ == "__main__":
    limpar_banco()