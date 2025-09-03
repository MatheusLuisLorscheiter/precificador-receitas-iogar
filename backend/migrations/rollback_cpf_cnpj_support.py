# ============================================================================
# ROLLBACK: Reverter migração CPF/CNPJ na tabela fornecedores
# ============================================================================
# Descrição: Reverte a coluna 'cpf_cnpj' de volta para 'cnpj'
# ATENÇÃO: Este script irá falhar se houver fornecedores com CPF cadastrados
# Data: 03/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Carrega variáveis do arquivo .env
load_dotenv()

def verificar_cpfs_cadastrados():
    """
    Verifica se existem CPFs cadastrados na tabela.
    
    Returns:
        tuple: (bool, int) - (tem_cpfs, quantidade_cpfs)
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        return False, 0
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Verifica se há documentos com 11 dígitos (CPF)
            resultado = connection.execute(text("""
                SELECT COUNT(*) as total_cpfs
                FROM fornecedores 
                WHERE LENGTH(cpf_cnpj) = 11;
            """)).fetchone()
            
            total_cpfs = resultado.total_cpfs
            return total_cpfs > 0, total_cpfs
            
    except Exception:
        return False, 0

def executar_rollback():
    """
    Executa o rollback da migração CPF/CNPJ.
    
    Etapas do rollback:
    1. Verifica se não há CPFs cadastrados
    2. Adiciona nova coluna cnpj
    3. Copia dados da coluna cpf_cnpj para cnpj
    4. Remove a coluna cpf_cnpj
    5. Adiciona constraints e índices
    """
    
    # Configuração do banco
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ Erro: DATABASE_URL não encontrada no arquivo .env")
        return False
    
    try:
        engine = create_engine(DATABASE_URL)
        
        print("🔄 Iniciando rollback da migração CPF/CNPJ...")
        
        with engine.connect() as connection:
            # Inicia transação
            trans = connection.begin()
            
            try:
                # ============================================================================
                # ETAPA 1: Verificar se existem CPFs (11 dígitos)
                # ============================================================================
                print("📝 Etapa 1: Verificando CPFs cadastrados...")
                
                tem_cpfs, quantidade_cpfs = verificar_cpfs_cadastrados()
                
                if tem_cpfs:
                    raise Exception(f"""
❌ ROLLBACK BLOQUEADO: Existem {quantidade_cpfs} fornecedores com CPF cadastrados.
   
   O rollback não pode ser executado porque resultaria em perda de dados.
   
   Opções:
   1. Remover manualmente os fornecedores com CPF
   2. Converter os CPFs para CNPJs fictícios
   3. Manter a nova estrutura com suporte a CPF/CNPJ
                    """)
                
                print("   ✅ Nenhum CPF encontrado. Rollback pode prosseguir.")
                
                # ============================================================================
                # ETAPA 2: Adicionar nova coluna cnpj
                # ============================================================================
                print("📝 Etapa 2: Adicionando coluna cnpj...")
                
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    ADD COLUMN cnpj VARCHAR(18);
                """))
                
                # ============================================================================
                # ETAPA 3: Copiar dados da coluna cpf_cnpj para cnpj
                # ============================================================================
                print("📝 Etapa 3: Copiando dados da coluna cpf_cnpj para cnpj...")
                
                connection.execute(text("""
                    UPDATE fornecedores 
                    SET cnpj = cpf_cnpj 
                    WHERE cpf_cnpj IS NOT NULL;
                """))
                
                # Verificar se todos os dados foram copiados
                resultado = connection.execute(text("""
                    SELECT COUNT(*) as total_registros,
                           COUNT(cnpj) as com_cnpj,
                           COUNT(cpf_cnpj) as com_cpf_cnpj
                    FROM fornecedores;
                """)).fetchone()
                
                print(f"   📊 Total de registros: {resultado.total_registros}")
                print(f"   📊 Com CNPJ: {resultado.com_cnpj}")
                print(f"   📊 Com CPF/CNPJ original: {resultado.com_cpf_cnpj}")
                
                if resultado.com_cnpj != resultado.com_cpf_cnpj:
                    raise Exception("Falha na cópia dos dados!")
                
                # ============================================================================
                # ETAPA 4: Adicionar constraints NOT NULL e UNIQUE na nova coluna
                # ============================================================================
                print("📝 Etapa 4: Adicionando constraints na coluna cnpj...")
                
                # Adiciona constraint NOT NULL
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    ALTER COLUMN cnpj SET NOT NULL;
                """))
                
                # Adiciona constraint UNIQUE
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    ADD CONSTRAINT uk_fornecedores_cnpj 
                    UNIQUE (cnpj);
                """))
                
                # Adiciona índice para performance
                connection.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj 
                    ON fornecedores (cnpj);
                """))
                
                # ============================================================================
                # ETAPA 5: Remover índices e constraints da coluna cpf_cnpj
                # ============================================================================
                print("📝 Etapa 5: Removendo constraints da coluna cpf_cnpj...")
                
                # Remove constraint unique da coluna cpf_cnpj
                try:
                    connection.execute(text("""
                        ALTER TABLE fornecedores 
                        DROP CONSTRAINT IF EXISTS uk_fornecedores_cpf_cnpj;
                    """))
                except:
                    pass
                
                # Remove índice da coluna cpf_cnpj
                try:
                    connection.execute(text("""
                        DROP INDEX IF EXISTS idx_fornecedores_cpf_cnpj;
                    """))
                except:
                    pass
                
                # ============================================================================
                # ETAPA 6: Remover coluna cpf_cnpj
                # ============================================================================
                print("📝 Etapa 6: Removendo coluna cpf_cnpj...")
                
                connection.execute(text("""
                    ALTER TABLE fornecedores 
                    DROP COLUMN cpf_cnpj;
                """))
                
                # ============================================================================
                # ETAPA 7: Atualizar comentário da coluna
                # ============================================================================
                print("📝 Etapa 7: Atualizando comentário da coluna...")
                
                connection.execute(text("""
                    COMMENT ON COLUMN fornecedores.cnpj IS 
                    'CNPJ do fornecedor (formato: XX.XXX.XXX/XXXX-XX)';
                """))
                
                # Confirma transação
                trans.commit()
                
                print("✅ Rollback concluído com sucesso!")
                print("📋 Resumo das alterações:")
                print("   - Coluna 'cpf_cnpj' revertida para 'cnpj'")
                print("   - Suporte apenas a CNPJ (14 dígitos)")
                print("   - Constraints e índices restaurados")
                print("   - Dados preservados durante o rollback")
                
                return True
                
            except Exception as e:
                # Desfaz transação em caso de erro
                trans.rollback()
                raise e
                
    except Exception as e:
        print(f"❌ Erro durante o rollback: {e}")
        return False

def verificar_estado_atual():
    """
    Verifica o estado atual da tabela fornecedores.
    
    Returns:
        dict: Informações sobre as colunas existentes
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        return None
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Verifica quais colunas existem
            resultado = connection.execute(text("""
                SELECT column_name
                FROM information_schema.columns 
                WHERE table_name = 'fornecedores' 
                AND column_name IN ('cnpj', 'cpf_cnpj');
            """)).fetchall()
            
            colunas_existentes = [row.column_name for row in resultado]
            
            info = {
                'tem_cnpj': 'cnpj' in colunas_existentes,
                'tem_cpf_cnpj': 'cpf_cnpj' in colunas_existentes,
                'pode_fazer_rollback': 'cpf_cnpj' in colunas_existentes and 'cnpj' not in colunas_existentes
            }
            
            return info
            
    except Exception:
        return None

def main():
    """
    Função principal do script de rollback.
    """
    print("=" * 70)
    print("🔙 SCRIPT DE ROLLBACK: Reverter migração CPF/CNPJ")
    print("=" * 70)
    
    # Verifica estado atual
    estado = verificar_estado_atual()
    
    if not estado:
        print("❌ Erro ao verificar estado da tabela fornecedores.")
        return
    
    if not estado['pode_fazer_rollback']:
        if estado['tem_cnpj'] and not estado['tem_cpf_cnpj']:
            print("ℹ️  A tabela já está no estado original (coluna 'cnpj').")
            print("   Rollback não necessário.")
        else:
            print("❌ Estado da tabela não permite rollback.")
            print(f"   - Tem coluna 'cnpj': {estado['tem_cnpj']}")
            print(f"   - Tem coluna 'cpf_cnpj': {estado['tem_cpf_cnpj']}")
        return
    
    # Verifica se há CPFs cadastrados
    tem_cpfs, quantidade_cpfs = verificar_cpfs_cadastrados()
    
    print("⚠️  Este rollback irá:")
    print("   - Reverter coluna 'cpf_cnpj' de volta para 'cnpj'")
    print("   - Remover suporte a CPF (apenas CNPJ)")
    print("   - Restaurar estrutura original da tabela")
    print()
    
    if tem_cpfs:
        print(f"🚨 ATENÇÃO: Existem {quantidade_cpfs} fornecedores com CPF cadastrados!")
        print("   O rollback resultará em ERRO para preservar os dados.")
        print("   Remova os fornecedores com CPF antes de continuar.")
        return
    
    print("✅ Nenhum CPF encontrado. Rollback pode ser executado com segurança.")
    print()
    
    confirmacao = input("🤔 Deseja continuar com o rollback? (s/N): ").lower().strip()
    
    if confirmacao not in ['s', 'sim', 'y', 'yes']:
        print("❌ Rollback cancelado pelo usuário.")
        return
    
    # Executa rollback
    sucesso = executar_rollback()
    
    if sucesso:
        print()
        print("🎉 Rollback concluído com sucesso!")
        print("💡 Lembre-se de reverter o código da aplicação para usar 'cnpj'")
    else:
        print()
        print("❌ Falha no rollback. Verifique os logs acima.")
        sys.exit(1)

if __name__ == "__main__":
    main()