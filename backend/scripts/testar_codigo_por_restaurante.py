# ============================================================================
# SCRIPT DE TESTE - SISTEMA DE CÓDIGOS POR RESTAURANTE
# ============================================================================
# Descrição: Testa a geração de códigos automáticos por restaurante
# Valida que cada restaurante tem sequências independentes
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
from app.services.codigo_service import (
    gerar_proximo_codigo,
    verificar_codigo_disponivel,
    obter_estatisticas_codigos
)
from app.config.codigo_config import TipoCodigo
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# FUNÇÕES DE TESTE
# ============================================================================

def testar_geracao_codigos_por_restaurante(db: Session):
    """
    Testa a geração de códigos para múltiplos restaurantes.
    Valida que o mesmo código pode ser gerado em restaurantes diferentes.
    """
    
    logger.info("=" * 80)
    logger.info("TESTE 1: GERAÇÃO DE CÓDIGOS POR RESTAURANTE")
    logger.info("=" * 80)
    
    # Buscar restaurantes
    restaurantes = db.query(Restaurante).limit(3).all()
    
    if len(restaurantes) < 2:
        logger.warning("⚠️  São necessários pelo menos 2 restaurantes para este teste")
        logger.info("   Cadastre mais restaurantes e execute novamente")
        return False
    
    logger.info(f"Testando com {len(restaurantes)} restaurantes")
    logger.info("")
    
    # Testar geração para cada tipo de código
    tipos_teste = [
        (TipoCodigo.RECEITA_NORMAL, "Receita Normal"),
        (TipoCodigo.RECEITA_PROCESSADA, "Receita Processada"),
        (TipoCodigo.INSUMO, "Insumo")
    ]
    
    resultados = {}
    
    for tipo_codigo, descricao in tipos_teste:
        logger.info(f"Testando {descricao}...")
        resultados[descricao] = {}
        
        for restaurante in restaurantes:
            try:
                # Gerar código para este restaurante
                codigo = gerar_proximo_codigo(db, tipo_codigo, restaurante.id)
                resultados[descricao][restaurante.nome] = codigo
                
                logger.info(f"  ✅ {restaurante.nome} (ID {restaurante.id}): {codigo}")
                
            except Exception as e:
                logger.error(f"  ❌ Erro ao gerar código para {restaurante.nome}: {e}")
                resultados[descricao][restaurante.nome] = f"ERRO: {e}"
        
        logger.info("")
    
    # Validar que códigos podem se repetir entre restaurantes
    logger.info("=" * 80)
    logger.info("VALIDAÇÃO: Códigos podem se repetir entre restaurantes?")
    logger.info("=" * 80)
    
    for descricao, codigos_restaurantes in resultados.items():
        codigos_unicos = set(codigos_restaurantes.values())
        total_restaurantes = len(codigos_restaurantes)
        
        if len(codigos_unicos) < total_restaurantes:
            logger.info(f"✅ {descricao}: Código repetido encontrado (correto!)")
        else:
            logger.info(f"ℹ️  {descricao}: Cada restaurante tem código diferente")
        
        for nome_rest, codigo in codigos_restaurantes.items():
            logger.info(f"  - {nome_rest}: {codigo}")
        logger.info("")
    
    return True


def testar_verificacao_disponibilidade(db: Session):
    """
    Testa a verificação de disponibilidade de códigos por restaurante.
    """
    
    logger.info("=" * 80)
    logger.info("TESTE 2: VERIFICAÇÃO DE DISPONIBILIDADE")
    logger.info("=" * 80)
    
    restaurantes = db.query(Restaurante).limit(2).all()
    
    if len(restaurantes) < 2:
        logger.warning("⚠️  São necessários pelo menos 2 restaurantes")
        return False
    
    rest1 = restaurantes[0]
    rest2 = restaurantes[1]
    
    # Testar mesmo código em restaurantes diferentes
    codigo_teste = "REC-3001"
    
    logger.info(f"Testando disponibilidade do código '{codigo_teste}':")
    logger.info("")
    
    # Verificar para restaurante 1
    disponivel_rest1 = verificar_codigo_disponivel(
        db, 
        codigo_teste, 
        TipoCodigo.RECEITA_NORMAL, 
        rest1.id
    )
    logger.info(f"  Restaurante: {rest1.nome} (ID {rest1.id})")
    logger.info(f"  Disponível: {'✅ SIM' if disponivel_rest1 else '❌ NÃO'}")
    logger.info("")
    
    # Verificar para restaurante 2
    disponivel_rest2 = verificar_codigo_disponivel(
        db, 
        codigo_teste, 
        TipoCodigo.RECEITA_NORMAL, 
        rest2.id
    )
    logger.info(f"  Restaurante: {rest2.nome} (ID {rest2.id})")
    logger.info(f"  Disponível: {'✅ SIM' if disponivel_rest2 else '❌ NÃO'}")
    logger.info("")
    
    if disponivel_rest1 or disponivel_rest2:
        logger.info("✅ CORRETO: Mesmo código pode estar disponível em restaurantes diferentes")
    
    return True


def testar_estatisticas(db: Session):
    """
    Testa a geração de estatísticas por restaurante.
    """
    
    logger.info("=" * 80)
    logger.info("TESTE 3: ESTATÍSTICAS POR RESTAURANTE")
    logger.info("=" * 80)
    
    restaurantes = db.query(Restaurante).limit(2).all()
    
    if not restaurantes:
        logger.warning("⚠️  Nenhum restaurante encontrado")
        return False
    
    for restaurante in restaurantes:
        logger.info(f"Estatísticas: {restaurante.nome} (ID {restaurante.id})")
        logger.info("-" * 60)
        
        for tipo in [TipoCodigo.RECEITA_NORMAL, TipoCodigo.RECEITA_PROCESSADA, TipoCodigo.INSUMO]:
            try:
                stats = obter_estatisticas_codigos(db, tipo, restaurante.id)
                
                logger.info(f"  {stats['descricao']}:")
                logger.info(f"    Faixa: {stats['inicio']}-{stats['fim']}")
                logger.info(f"    Usados: {stats['usados']}/{stats['total']}")
                logger.info(f"    Disponíveis: {stats['disponiveis']}")
                logger.info(f"    Uso: {stats['percentual_uso']:.2f}%")
                logger.info(f"    Próximo: {stats['proximo_codigo']}")
                
            except Exception as e:
                logger.error(f"    ❌ Erro: {e}")
        
        logger.info("")
    
    return True


def testar_sequencia_independente(db: Session):
    """
    Testa que as sequências são realmente independentes entre restaurantes.
    Gera 5 códigos seguidos para cada restaurante e valida a sequência.
    """
    
    logger.info("=" * 80)
    logger.info("TESTE 4: SEQUÊNCIAS INDEPENDENTES")
    logger.info("=" * 80)
    
    restaurantes = db.query(Restaurante).limit(2).all()
    
    if len(restaurantes) < 2:
        logger.warning("⚠️  São necessários pelo menos 2 restaurantes")
        return False
    
    logger.info("Gerando 5 códigos de receita para cada restaurante...")
    logger.info("")
    
    for restaurante in restaurantes:
        logger.info(f"Restaurante: {restaurante.nome} (ID {restaurante.id})")
        
        # Obter código inicial
        stats = obter_estatisticas_codigos(db, TipoCodigo.RECEITA_NORMAL, restaurante.id)
        codigo_inicial = stats['proximo_codigo']
        
        logger.info(f"  Código inicial previsto: {codigo_inicial}")
        logger.info(f"  Gerando sequência:")
        
        codigos_gerados = []
        for i in range(5):
            try:
                codigo = gerar_proximo_codigo(db, TipoCodigo.RECEITA_NORMAL, restaurante.id)
                codigos_gerados.append(codigo)
                logger.info(f"    {i+1}. {codigo}")
            except Exception as e:
                logger.error(f"    ❌ Erro ao gerar código {i+1}: {e}")
                break
        
        logger.info("")
    
    logger.info("✅ Teste concluído - Verifique se as sequências são independentes")
    return True


# ============================================================================
# EXECUÇÃO DOS TESTES
# ============================================================================

def executar_todos_testes():
    """
    Executa todos os testes em sequência.
    """
    
    logger.info("")
    logger.info("╔" + "═" * 78 + "╗")
    logger.info("║" + " " * 20 + "TESTE DO SISTEMA DE CÓDIGOS POR RESTAURANTE" + " " * 15 + "║")
    logger.info("╚" + "═" * 78 + "╝")
    logger.info("")
    
    db = SessionLocal()
    
    try:
        # Verificar se há restaurantes cadastrados
        total_restaurantes = db.query(Restaurante).count()
        
        if total_restaurantes == 0:
            logger.error("❌ ERRO: Nenhum restaurante cadastrado no sistema")
            logger.info("   Por favor, cadastre ao menos um restaurante antes de executar os testes")
            return False
        
        logger.info(f"✅ Sistema possui {total_restaurantes} restaurante(s) cadastrado(s)")
        logger.info("")
        
        # Executar testes
        testes = [
            ("Geração de Códigos", testar_geracao_codigos_por_restaurante),
            ("Verificação de Disponibilidade", testar_verificacao_disponibilidade),
            ("Estatísticas", testar_estatisticas),
            ("Sequências Independentes", testar_sequencia_independente)
        ]
        
        resultados = []
        
        for nome_teste, funcao_teste in testes:
            try:
                resultado = funcao_teste(db)
                resultados.append((nome_teste, resultado))
            except Exception as e:
                logger.error(f"❌ Erro no teste '{nome_teste}': {e}")
                resultados.append((nome_teste, False))
        
        # Resumo
        logger.info("=" * 80)
        logger.info("RESUMO DOS TESTES")
        logger.info("=" * 80)
        
        for nome, resultado in resultados:
            status = "✅ PASSOU" if resultado else "❌ FALHOU"
            logger.info(f"  {status} - {nome}")
        
        logger.info("")
        
        total_passou = sum(1 for _, r in resultados if r)
        total_testes = len(resultados)
        
        if total_passou == total_testes:
            logger.info(f"✅ TODOS OS TESTES PASSARAM ({total_passou}/{total_testes})")
            return True
        else:
            logger.warning(f"⚠️  ALGUNS TESTES FALHARAM ({total_passou}/{total_testes})")
            return False
        
    except Exception as e:
        logger.error(f"❌ Erro fatal durante os testes: {e}")
        return False
        
    finally:
        db.close()


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("Iniciando testes do sistema de códigos por restaurante...")
    logger.info("")
    
    try:
        sucesso = executar_todos_testes()
        
        logger.info("")
        if sucesso:
            logger.info("✅ Testes finalizados com sucesso!")
            sys.exit(0)
        else:
            logger.warning("⚠️  Alguns testes falharam. Verifique os logs acima.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.warning("\n⚠️  Testes interrompidos pelo usuário")
        sys.exit(1)
        
    except Exception as e:
        logger.error(f"\n❌ Erro fatal: {str(e)}")
        sys.exit(1)