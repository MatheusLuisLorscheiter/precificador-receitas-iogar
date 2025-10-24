# ============================================================================
# SCRIPT PARA CADASTRAR RESTAURANTES DE TESTE
# ============================================================================
# Descrição: Cadastra restaurantes de exemplo para testar o sistema
# Autor: Will - Empresa: IOGAR
# Data: 24/10/2025
# ============================================================================

import sys
import os
from pathlib import Path

# Adicionar diretório raiz ao path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.receita import Restaurante
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# DADOS DOS RESTAURANTES DE TESTE
# ============================================================================

RESTAURANTES_TESTE = [
    {
        "nome": "Sushi Bar Tokyo",
        "cnpj": "12345678000190",
        "tipo": "restaurante",
        "tem_delivery": True,
        "ativo": True,
        "eh_matriz": True,
        "endereco": "Rua Japão, 123",
        "bairro": "Liberdade",
        "cidade": "São Paulo",
        "estado": "SP",
        "telefone": "(11) 91234-5678"
    },
    {
        "nome": "Hamburgueria Gourmet",
        "cnpj": "98765432000199",
        "tipo": "hamburgueria",
        "tem_delivery": True,
        "ativo": True,
        "eh_matriz": True,
        "endereco": "Av. Paulista, 456",
        "bairro": "Bela Vista",
        "cidade": "São Paulo",
        "estado": "SP",
        "telefone": "(11) 98765-4321"
    },
    {
        "nome": "Café Colonial",
        "cnpj": "11223344000155",
        "tipo": "cafeteria",
        "tem_delivery": False,
        "ativo": True,
        "eh_matriz": True,
        "endereco": "Rua das Flores, 789",
        "bairro": "Jardins",
        "cidade": "São Paulo",
        "estado": "SP",
        "telefone": "(11) 93456-7890"
    }
]

# ============================================================================
# FUNÇÃO PRINCIPAL
# ============================================================================

def cadastrar_restaurantes_teste(db: Session):
    """
    Cadastra restaurantes de teste no banco de dados.
    """
    
    logger.info("=" * 80)
    logger.info("CADASTRO DE RESTAURANTES DE TESTE")
    logger.info("=" * 80)
    logger.info("")
    
    # Verificar quantos restaurantes já existem
    total_existentes = db.query(Restaurante).count()
    logger.info(f"Restaurantes já cadastrados: {total_existentes}")
    logger.info("")
    
    cadastrados = 0
    pulados = 0
    
    for dados in RESTAURANTES_TESTE:
        try:
            # Verificar se já existe pelo CNPJ
            existe = db.query(Restaurante).filter(
                Restaurante.cnpj == dados["cnpj"]
            ).first()
            
            if existe:
                logger.warning(f"⚠️  Restaurante '{dados['nome']}' já existe (CNPJ: {dados['cnpj']})")
                pulados += 1
                continue
            
            # Criar novo restaurante
            novo_restaurante = Restaurante(**dados)
            db.add(novo_restaurante)
            db.commit()
            db.refresh(novo_restaurante)
            
            logger.info(f"✅ Cadastrado: {novo_restaurante.nome} (ID: {novo_restaurante.id})")
            cadastrados += 1
            
        except Exception as e:
            logger.error(f"❌ Erro ao cadastrar '{dados['nome']}': {e}")
            db.rollback()
    
    logger.info("")
    logger.info("=" * 80)
    logger.info("RESUMO")
    logger.info("=" * 80)
    logger.info(f"  Cadastrados: {cadastrados}")
    logger.info(f"  Pulados (já existem): {pulados}")
    logger.info(f"  Total no sistema: {db.query(Restaurante).count()}")
    logger.info("")
    
    # Listar todos os restaurantes
    logger.info("Restaurantes no sistema:")
    restaurantes = db.query(Restaurante).all()
    for rest in restaurantes:
        logger.info(f"  - {rest.nome} (ID: {rest.id}) - {rest.cidade}/{rest.estado}")
    
    return cadastrados


# ============================================================================
# EXECUÇÃO
# ============================================================================

if __name__ == "__main__":
    logger.info("Iniciando cadastro de restaurantes de teste...")
    logger.info("")
    
    db = SessionLocal()
    
    try:
        total_cadastrados = cadastrar_restaurantes_teste(db)
        
        logger.info("")
        if total_cadastrados > 0:
            logger.info(f"✅ {total_cadastrados} restaurante(s) cadastrado(s) com sucesso!")
            logger.info("")
            logger.info("Agora você pode executar os testes novamente:")
            logger.info("  python scripts/testar_codigo_por_restaurante.py")
        else:
            logger.info("ℹ️  Nenhum restaurante novo foi cadastrado")
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️  Operação cancelada pelo usuário")
        sys.exit(1)
        
    except Exception as e:
        logger.error(f"\n❌ Erro fatal: {str(e)}")
        db.rollback()
        sys.exit(1)
        
    finally:
        db.close()