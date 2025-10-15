# ============================================================================
# SERVICE DE GERACAO DE CODIGOS AUTOMATICOS
# ============================================================================
# Descricao: Logica de negocio para geracao automatica de codigos unicos
# Autor: Will - Empresa: IOGAR
# Data: 15/10/2025
# ============================================================================

from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional
import logging

# Imports do projeto
from app.config.codigo_config import TipoCodigo, obter_faixa, formatar_codigo, validar_codigo_na_faixa
from app.models.receita import Receita
from app.models.insumo import Insumo

# Configurar logger
logger = logging.getLogger(__name__)

# ============================================================================
# FUNCAO PRINCIPAL DE GERACAO
# ============================================================================

def gerar_proximo_codigo(db: Session, tipo: TipoCodigo) -> str:
    """
    Gera o proximo codigo disponivel para o tipo especificado
    
    Args:
        db: Sessao do banco de dados
        tipo: Tipo de codigo a gerar (TipoCodigo enum)
        
    Returns:
        Codigo gerado no formato "PREFIXO-NUMERO" (ex: "REC-3045")
        
    Raises:
        ValueError: Se a faixa estiver esgotada
        Exception: Erros de banco de dados
    """
    try:
        # Obter configuracao da faixa
        faixa = obter_faixa(tipo)
        inicio = faixa["inicio"]
        fim = faixa["fim"]
        
        # Buscar ultimo codigo usado conforme o tipo
        ultimo_numero = _buscar_ultimo_codigo_usado(db, tipo)
        
        # Se nao existe nenhum codigo, comecar do inicio da faixa
        if ultimo_numero is None:
            proximo_numero = inicio
        else:
            # Incrementar o ultimo codigo
            proximo_numero = ultimo_numero + 1
        
        # Validar se ainda ha codigos disponiveis na faixa
        if proximo_numero > fim:
            raise ValueError(
                f"Faixa de codigos esgotada para {faixa['descricao']}. "
                f"Limite: {fim}"
            )
        
        # Formatar e retornar o codigo
        codigo_gerado = formatar_codigo(proximo_numero, tipo)
        
        logger.info(f"Codigo gerado: {codigo_gerado} (tipo: {tipo})")
        
        return codigo_gerado
        
    except Exception as e:
        logger.error(f"Erro ao gerar codigo para tipo {tipo}: {str(e)}")
        raise

# ============================================================================
# FUNCOES AUXILIARES
# ============================================================================

def _buscar_ultimo_codigo_usado(db: Session, tipo: TipoCodigo) -> Optional[int]:
    """
    Busca o ultimo numero de codigo usado para um tipo especifico
    
    Args:
        db: Sessao do banco de dados
        tipo: Tipo de codigo
        
    Returns:
        Ultimo numero usado ou None se nao existir nenhum
    """
    faixa = obter_faixa(tipo)
    inicio = faixa["inicio"]
    fim = faixa["fim"]
    
    try:
        # Determinar qual tabela consultar
        if tipo == TipoCodigo.RECEITA_NORMAL:
            # Buscar em receitas normais (is_processada = False)
            query = db.query(Receita).filter(
                Receita.is_processada == False,
                Receita.codigo.isnot(None)
            )
            
        elif tipo == TipoCodigo.RECEITA_PROCESSADA:
            # Buscar em receitas processadas (is_processada = True)
            query = db.query(Receita).filter(
                Receita.is_processada == True,
                Receita.codigo.isnot(None)
            )
            
        elif tipo == TipoCodigo.INSUMO:
            # Buscar em insumos
            query = db.query(Insumo).filter(
                Insumo.codigo.isnot(None)
            )
        else:
            return None
        
        # Buscar todos os codigos existentes
        registros = query.all()
        
        # Extrair numeros dos codigos que estao na faixa
        numeros_validos = []
        for registro in registros:
            try:
                # Extrair numero do codigo (formato: "PREFIXO-NUMERO")
                partes = registro.codigo.split("-")
                if len(partes) == 2:
                    numero = int(partes[1])
                    # Verificar se esta na faixa correta
                    if inicio <= numero <= fim:
                        numeros_validos.append(numero)
            except (ValueError, AttributeError, IndexError):
                # Ignorar codigos com formato invalido
                continue
        
        # Retornar o maior numero encontrado
        if numeros_validos:
            return max(numeros_validos)
        
        return None
        
    except Exception as e:
        logger.error(f"Erro ao buscar ultimo codigo: {str(e)}")
        return None

def verificar_codigo_disponivel(db: Session, codigo: str, tipo: TipoCodigo) -> bool:
    """
    Verifica se um codigo especifico esta disponivel
    
    Args:
        db: Sessao do banco de dados
        codigo: Codigo a verificar
        tipo: Tipo de codigo
        
    Returns:
        True se disponivel, False se ja existe
    """
    try:
        # Validar formato do codigo
        if not validar_codigo_na_faixa(codigo, tipo):
            return False
        
        # Verificar se ja existe no banco
        if tipo in [TipoCodigo.RECEITA_NORMAL, TipoCodigo.RECEITA_PROCESSADA]:
            existe = db.query(Receita).filter(Receita.codigo == codigo).first()
        elif tipo == TipoCodigo.INSUMO:
            existe = db.query(Insumo).filter(Insumo.codigo == codigo).first()
        else:
            return False
        
        return existe is None
        
    except Exception as e:
        logger.error(f"Erro ao verificar disponibilidade do codigo: {str(e)}")
        return False

def obter_estatisticas_codigos(db: Session, tipo: TipoCodigo) -> dict:
    """
    Retorna estatisticas de uso da faixa de codigos
    
    Args:
        db: Sessao do banco de dados
        tipo: Tipo de codigo
        
    Returns:
        Dicionario com estatisticas (usados, disponiveis, percentual)
    """
    try:
        faixa = obter_faixa(tipo)
        total_faixa = faixa["fim"] - faixa["inicio"] + 1
        
        # Contar codigos usados
        ultimo_numero = _buscar_ultimo_codigo_usado(db, tipo)
        
        if ultimo_numero is None:
            codigos_usados = 0
        else:
            codigos_usados = ultimo_numero - faixa["inicio"] + 1
        
        codigos_disponiveis = total_faixa - codigos_usados
        percentual_uso = (codigos_usados / total_faixa) * 100
        
        return {
            "tipo": tipo,
            "descricao": faixa["descricao"],
            "inicio": faixa["inicio"],
            "fim": faixa["fim"],
            "total": total_faixa,
            "usados": codigos_usados,
            "disponiveis": codigos_disponiveis,
            "percentual_uso": round(percentual_uso, 2),
            "proximo_codigo": formatar_codigo(
                ultimo_numero + 1 if ultimo_numero else faixa["inicio"], 
                tipo
            )
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter estatisticas: {str(e)}")
        raise