# ============================================================================
# MIGRAÇÃO: Adicionar suporte a CPF/CNPJ na tabela fornecedores
# ============================================================================
# Descrição: Altera a coluna 'cnpj' para 'cpf_cnpj' na tabela fornecedores
# para suportar tanto CPF quanto CNPJ
# Data: 03/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Carrega variáveis do arquivo .env
load_dotenv()

def executar_migracao():
    """
    Executa a migração para adicionar suporte a CPF/CNPJ.
    
    Etapas da migração:
    1. Adiciona nova coluna cpf_cnpj
    2. Copia dados da coluna cnpj para cpf_cnpj
    3. Remove a coluna cnpj antiga
    4. Adiciona constraints e índices
    """
    
    # Configuração do banco
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ Erro: DATABASE_URL não encontrada no arquivo .env")
        return False
    
    try:
        engine = create_engine(DATABASE_URL)
        
        print("🔄 Iniciando migração para suporte CPF/CNPJ...")
        
        with engine.connect() as connection:
            # Inicia transação
            trans = connection.begin()
            
            try:
                # ============================================================================
                # ETAPA 1: Adicionar nova coluna cpf_cnpj
                # ============================================================================
                print("📝 Etapa 1: Adicionando coluna cpf_cnpj...")
                
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    ADD COLUMN cpf_cnpj VARCHAR(18);
                """))
                
                # ============================================================================
                # ETAPA 2: Copiar dados da coluna cnpj para cpf_cnpj
                # ============================================================================
                print("📝 Etapa 2: Copiando dados da coluna cnpj para cpf_cnpj...")
                
                connection.execute(text("""
                    UPDATE fornecedores 
                    SET cpf_cnpj = cnpj 
                    WHERE cnpj IS NOT NULL;
                """))
                
                # Verificar se todos os dados foram copiados
                resultado = connection.execute(text("""
                    SELECT COUNT(*) as total_registros,
                           COUNT(cpf_cnpj) as com_cpf_cnpj,
                           COUNT(cnpj) as com_cnpj
                    FROM fornecedores;
                """)).fetchone()
                
                print(f"   📊 Total de registros: {resultado.total_registros}")
                print(f"   📊 Com CPF/CNPJ: {resultado.com_cpf_cnpj}")
                print(f"   📊 Com CNPJ original: {resultado.com_cnpj}")
                
                if resultado.com_cpf_cnpj != resultado.com_cnpj:
                    raise Exception("Falha na cópia dos dados!")
                
                # ============================================================================
                # ETAPA 3: Adicionar constraints NOT NULL e UNIQUE na nova coluna
                # ============================================================================
                print("📝 Etapa 3: Adicionando constraints na coluna cpf_cnpj...")
                
                # Adiciona constraint NOT NULL
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    ALTER COLUMN cpf_cnpj SET NOT NULL;
                """))
                
                # Adiciona constraint UNIQUE
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    ADD CONSTRAINT uk_fornecedores_cpf_cnpj 
                    UNIQUE (cpf_cnpj);
                """))
                
                # Adiciona índice para performance
                connection.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_fornecedores_cpf_cnpj 
                    ON fornecedores (cpf_cnpj);
                """))
                
                # ============================================================================
                # ETAPA 4: Remover índices e constraints da coluna cnpj antiga
                # ============================================================================
                print("📝 Etapa 4: Removendo constraints da coluna cnpj antiga...")
                
                # Remove constraint unique da coluna cnpj (se existir)
                try:
                    connection.execute(text("""
                        ALTER TABLE fornecedores 
                        DROP CONSTRAINT IF EXISTS uk_fornecedores_cnpj;
                    """))
                except:
                    pass  # Constraint pode não existir
                
                # Remove índice da coluna cnpj (se existir)
                try:
                    connection.execute(text("""
                        DROP INDEX IF EXISTS idx_fornecedores_cnpj;
                    """))
                except:
                    pass  # Índice pode não existir
                
                # ============================================================================
                # ETAPA 5: Remover coluna cnpj antiga
                # ============================================================================
                print("📝 Etapa 5: Removendo coluna cnpj antiga...")
                
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    DROP COLUMN cnpj;
                """))
                
                # ============================================================================
                # ETAPA 6: Atualizar comentário da coluna
                # ============================================================================
                print("📝 Etapa 6: Atualizando comentário da coluna...")
                
                connection.execute(text("""
                    COMMENT ON COLUMN fornecedores.cpf_cnpj IS 
                    'CPF ou CNPJ do fornecedor (apenas números: 11 dígitos CPF ou 14 dígitos CNPJ)';
                """))
                
                # Confirma transação
                trans.commit()
                
                print("✅ Migração concluída com sucesso!")
                print("📋 Resumo das alterações:")
                print("   - Coluna 'cnpj' renomeada para 'cpf_cnpj'")
                print("   - Suporte a CPF (11 dígitos) e CNPJ (14 dígitos)")
                print("   - Constraints e índices atualizados")
                print("   - Dados preservados durante a migração")
                
                return True
                
            except Exception as e:
                # Desfaz transação em caso de erro
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        return False

def verificar_migracao():
    """
    Verifica se a migração foi aplicada corretamente.
    
    Returns:
        bool: True se a migração foi aplicada, False caso contrário
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        return False
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Verifica se a coluna cpf_cnpj existe
            resultado = connection.execute(text("""
                SELECT COUNT(*) as existe
                FROM information_schema.columns 
                WHERE table_name = 'fornecedores' 
                AND column_name = 'cpf_cnpj';
            """)).fetchone()
            
            cpf_cnpj_existe = resultado.existe > 0
            
            # Verifica se a coluna cnpj ainda existe (não deveria)
            resultado = connection.execute(text("""
                SELECT COUNT(*) as existe
                FROM information_schema.columns 
                WHERE table_name = 'fornecedores' 
                AND column_name = 'cnpj';
            """)).fetchone()
            
            cnpj_existe = resultado.existe > 0
            
            return cpf_cnpj_existe and not cnpj_existe
            
    except Exception:
        return False

def main():
    """
    Função principal do script de migração.
    """
    print("=" * 70)
    print("🔧 SCRIPT DE MIGRAÇÃO: Suporte CPF/CNPJ para Fornecedores")
    print("=" * 70)
    
    # Verifica se a migração já foi aplicada
    if verificar_migracao():
        print("ℹ️  A migração já foi aplicada anteriormente.")
        print("   Coluna 'cpf_cnpj' já existe e 'cnpj' foi removida.")
        return
    
    # Solicita confirmação
    print("⚠️  Esta migração irá:")
    print("   - Alterar a estrutura da tabela 'fornecedores'")
    print("   - Renomear coluna 'cnpj' para 'cpf_cnpj'")
    print("   - Adicionar suporte a CPF (11 dígitos)")
    print("   - Manter compatibilidade com CNPJ (14 dígitos)")
    print()
    
    confirmacao = input("🤔 Deseja continuar? (s/N): ").lower().strip()
    
    if confirmacao not in ['s', 'sim', 'y', 'yes']:
        print("❌ Migração cancelada pelo usuário.")
        return
    
    # Executa migração
    sucesso = executar_migracao()
    
    if sucesso:
        print()
        print("🎉 Migração concluída com sucesso!")
        print("💡 Lembre-se de atualizar o código da aplicação para usar 'cpf_cnpj'")
    else:
        print()
        print("❌ Falha na migração. Verifique os logs acima.")
        sys.exit(1)

if __name__ == "__main__":
    main()