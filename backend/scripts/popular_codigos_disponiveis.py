# ============================================================================
# SCRIPT PARA POPULAR CÓDIGOS DISPONÍVEIS
# ============================================================================
# Descrição: Popula a tabela codigos_disponiveis com todas as faixas de códigos
#            para cada restaurante cadastrado no sistema
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
from app.database import SessionLocal, engine
from app.models.receita import Restaurante
from app.models.codigo_disponivel import CodigoDisponivel
from app.config.codigo_config import TipoCodigo, obter_faixa
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURAÇÃO DAS FAIXAS
# ============================================================================

FAIXAS = {
    TipoCodigo.RECEITA_NORMAL: {
        "inicio": 3000,
        "fim": 3999,
        "tipo": "receita"
    },
    TipoCodigo.RECEITA_PROCESSADA: {
        "inicio": 4000,
        "fim": 4999,
        "tipo": "receita_processada"
    },
    TipoCodigo.INSUMO: {
        "inicio": 5000,
        "fim": 5999,
        "tipo": "insumo"
    }
}

# ============================================================================
# FUNÇÃO PRINCIPAL
# ============================================================================

def popular_codigos_restaurante(db: Session, restaurante_id: int, nome_restaurante: str):
    """
    Popula todos os códigos disponíveis para um restaurante específico.
    
    Args:
        db: Sessão do banco de dados
        restaurante_id: ID do restaurante
        nome_restaurante: Nome do restaurante (para logs)
    """
    
    logger.info(f"Populando códigos para restaurante: {nome_restaurante} (ID: {restaurante_id})")
    
    total_inseridos = 0
    
    for tipo_codigo, config in FAIXAS.items():
        inicio = config["inicio"]
        fim = config["fim"]
        tipo = config["tipo"]
        
        logger.info(f"  Processando faixa {tipo}: {inicio}-{fim}")
        
        # Verificar quantos códigos já existem para este restaurante e tipo
        codigos_existentes = db.query(CodigoDisponivel).filter(
            CodigoDisponivel.restaurante_id == restaurante_id,
            CodigoDisponivel.tipo == tipo
        ).count()
        
        if codigos_existentes > 0:
            logger.warning(f"    ⚠️  Já existem {codigos_existentes} códigos do tipo '{tipo}'. Pulando...")
            continue
        
        # Criar todos os códigos da faixa
        codigos_batch = []
        for codigo in range(inicio, fim + 1):
            codigo_obj = CodigoDisponivel(
                restaurante_id=restaurante_id,
                codigo=codigo,
                tipo=tipo,
                disponivel=True
            )
            codigos_batch.append(codigo_obj)
            
            # Inserir em lotes de 500 para performance
            if len(codigos_batch) >= 500:
                db.bulk_save_objects(codigos_batch)
                db.commit()
                total_inseridos += len(codigos_batch)
                logger.info(f"    Inseridos {total_inseridos} códigos...")
                codigos_batch = []
        
        # Inserir códigos restantes
        if codigos_batch:
            db.bulk_save_objects(codigos_batch)
            db.commit()
            total_inseridos += len(codigos_batch)
        
        quantidade = fim - inicio + 1
        logger.info(f"    ✅ Faixa {tipo} completa: {quantidade} códigos")
    
    logger.info(f"✅ Total de códigos inseridos para {nome_restaurante}: {total_inseridos}")
    return total_inseridos


def popular_todos_restaurantes():
    """
    Popula códigos para todos os restaurantes cadastrados no sistema.
    """
    
    logger.info("=" * 80)
    logger.info("INICIANDO POPULAÇÃO DE CÓDIGOS DISPONÍVEIS")
    logger.info("=" * 80)
    
    db = SessionLocal()
    
    try:
        # Buscar todos os restaurantes
        restaurantes = db.query(Restaurante).all()
        
        if not restaurantes:
            logger.warning("⚠️  Nenhum restaurante encontrado no banco de dados!")
            logger.info("   Por favor, cadastre ao menos um restaurante antes de executar este script.")
            return
        
        logger.info(f"Encontrados {len(restaurantes)} restaurante(s)")
        logger.info("")
        
        total_geral = 0
        
        # Popular códigos para cada restaurante
        for restaurante in restaurantes:
            total = popular_codigos_restaurante(
                db, 
                restaurante.id, 
                restaurante.nome
            )
            total_geral += total
            logger.info("")
        
        logger.info("=" * 80)
        logger.info("POPULAÇÃO CONCLUÍDA COM SUCESSO")
        logger.info("=" * 80)
        logger.info(f"Total de restaurantes processados: {len(restaurantes)}")
        logger.info(f"Total de códigos inseridos: {total_geral}")
        logger.info("")
        logger.info("Distribuição por restaurante:")
        for restaurante in restaurantes:
            total_restaurante = db.query(CodigoDisponivel).filter(
                CodigoDisponivel.restaurante_id == restaurante.id
            ).count()
            logger.info(f"  - {restaurante.nome}: {total_restaurante} códigos")
        
    except Exception as e:
        logger.error(f"❌ Erro ao popular códigos: {str(e)}")
        db.rollback()
        raise
    
    finally:
        db.close()


# ============================================================================
# EXECUÇÃO DO SCRIPT
# ============================================================================

if __name__ == "__main__":
    logger.info("Iniciando script de população de códigos...")
    logger.info("")
    
    try:
        popular_todos_restaurantes()
        logger.info("")
        logger.info("✅ Script finalizado com sucesso!")
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️  Script interrompido pelo usuário")
        sys.exit(1)
        
    except Exception as e:
        logger.error(f"\n❌ Erro fatal: {str(e)}")
        sys.exit(1)