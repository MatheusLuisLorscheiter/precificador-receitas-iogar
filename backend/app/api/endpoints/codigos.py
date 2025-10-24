# ============================================================================
# API ENDPOINTS CODIGOS - Rotas para monitoramento de códigos automáticos
# ============================================================================
# Descricao: Endpoints para consultar estatísticas e status das faixas de códigos
# Autor: Will - Empresa: IOGAR
# Data: 15/10/2025
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from typing import Dict, List

# Imports do projeto
from app.api.deps import get_db
from app.services.codigo_service import obter_estatisticas_codigos
from app.config.codigo_config import TipoCodigo, FAIXAS_CODIGOS

# ============================================================================
# CONFIGURACAO DO ROTEADOR
# ============================================================================

router = APIRouter()

# ============================================================================
# ENDPOINT DE ESTATISTICAS GERAIS
# ============================================================================

@router.get("/estatisticas", summary="Estatísticas de todas as faixas por restaurante")
def obter_estatisticas_todas_faixas(
    restaurante_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas de uso de todas as faixas de códigos para um restaurante específico.
    
    **IMPORTANTE:** Cada restaurante possui suas próprias faixas de códigos independentes.
    
    **Parâmetros:**
    - restaurante_id: ID do restaurante (obrigatório)
    
    **Informações retornadas:**
    - Total de códigos disponíveis por faixa
    - Quantidade de códigos já utilizados
    - Quantidade de códigos disponíveis
    - Percentual de uso
    - Próximo código a ser gerado
    
    **Uso:**
    - Dashboard administrativo
    - Monitoramento de capacidade
    - Alertas de faixas próximas do limite
    """
    try:
        # Validar restaurante_id
        if not restaurante_id or restaurante_id <= 0:
            raise HTTPException(
                status_code=400,
                detail="restaurante_id é obrigatório e deve ser maior que zero"
            )
        
        estatisticas = {}
        
        # Obter estatisticas para cada tipo de codigo
        for tipo in TipoCodigo:
            stats = obter_estatisticas_codigos(db, tipo, restaurante_id)
            estatisticas[tipo.value] = stats
        
        # Calcular totais gerais
        total_geral = sum(s["total"] for s in estatisticas.values())
        usados_geral = sum(s["usados"] for s in estatisticas.values())
        disponiveis_geral = sum(s["disponiveis"] for s in estatisticas.values())
        
        return {
            "restaurante_id": restaurante_id,
            "estatisticas_por_tipo": estatisticas,
            "totais_gerais": {
                "total": total_geral,
                "usados": usados_geral,
                "disponiveis": disponiveis_geral,
                "percentual_uso_geral": round((usados_geral / total_geral * 100), 2) if total_geral > 0 else 0
            },
            "alertas": _gerar_alertas(estatisticas)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao obter estatísticas: {str(e)}"
        )

# ============================================================================
# ENDPOINT DE ESTATISTICAS POR TIPO
# ============================================================================

@router.get("/estatisticas/{tipo}", summary="Estatísticas de uma faixa específica por restaurante")
def obter_estatisticas_tipo(
    tipo: str = Path(..., description="Tipo de código (receita_normal, receita_processada, insumo)"),
    restaurante_id: int = Query(..., description="ID do restaurante"),
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas detalhadas de uma faixa específica para um restaurante.
    
    **IMPORTANTE:** As estatísticas são específicas do restaurante informado.
    
    **Parâmetros:**
    - tipo: receita_normal, receita_processada ou insumo (path)
    - restaurante_id: ID do restaurante (query obrigatória)
    
    **Retorna:**
    - Estatísticas detalhadas da faixa para o restaurante
    - Nível de alerta (ok, atenção, crítico)
    - Projeções de esgotamento
    """
    try:
        # Validar restaurante_id
        if not restaurante_id or restaurante_id <= 0:
            raise HTTPException(
                status_code=400,
                detail="restaurante_id é obrigatório e deve ser maior que zero"
            )
        
        # Validar tipo
        try:
            tipo_codigo = TipoCodigo(tipo)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido. Opções: {[t.value for t in TipoCodigo]}"
            )
        
        # Obter estatisticas para o restaurante específico
        stats = obter_estatisticas_codigos(db, tipo_codigo, restaurante_id)
        
        # Adicionar informacoes extras
        stats["alerta"] = _verificar_alerta_individual(stats)
        stats["projecao_esgotamento"] = _calcular_projecao_esgotamento(stats)
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao obter estatísticas: {str(e)}"
        )
    
# ============================================================================
# ENDPOINT PARA OBTER PRÓXIMO CÓDIGO
# ============================================================================

@router.get("/proximo/{tipo}", summary="Obter próximo código disponível")
def obter_proximo_codigo(
    tipo: str = Path(..., description="Tipo de código (receita_normal, receita_processada, insumo)"),
    restaurante_id: int = Query(..., description="ID do restaurante"),
    db: Session = Depends(get_db)
):
    """
    Retorna o próximo código disponível para um tipo e restaurante específicos.
    
    **IMPORTANTE:** Não gera/reserva o código, apenas retorna qual seria o próximo.
    O código é efetivamente gerado apenas ao criar a receita/insumo.
    
    **Parâmetros:**
    - tipo: receita_normal, receita_processada ou insumo (path)
    - restaurante_id: ID do restaurante (query obrigatória)
    
    **Retorna:**
    - Próximo código disponível
    - Informações sobre a faixa
    - Status de disponibilidade
    
    **Uso:**
    - Preview no frontend antes de salvar
    - Validação de capacidade disponível
    """
    try:
        # Validar restaurante_id
        if not restaurante_id or restaurante_id <= 0:
            raise HTTPException(
                status_code=400,
                detail="restaurante_id é obrigatório e deve ser maior que zero"
            )
        
        # Validar tipo
        try:
            tipo_codigo = TipoCodigo(tipo)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo inválido. Opções: {[t.value for t in TipoCodigo]}"
            )
        
        # Importar serviço de geração de código
        from app.services.codigo_service import gerar_proximo_codigo
        
        # Obter próximo código (sem persistir)
        try:
            proximo_codigo = gerar_proximo_codigo(db, tipo_codigo, restaurante_id)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )
        
        # Obter estatísticas para contexto
        stats = obter_estatisticas_codigos(db, tipo_codigo, restaurante_id)
        
        return {
            "restaurante_id": restaurante_id,
            "tipo": tipo,
            "proximo_codigo": proximo_codigo,
            "faixa": {
                "inicio": stats["inicio"],
                "fim": stats["fim"],
                "descricao": stats["descricao"]
            },
            "disponibilidade": {
                "codigos_disponiveis": stats["disponiveis"],
                "percentual_uso": stats["percentual_uso"],
                "pode_gerar": stats["disponiveis"] > 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao obter próximo código: {str(e)}"
        )

# ============================================================================
# ENDPOINT DE CONFIGURACAO DAS FAIXAS
# ============================================================================

@router.get("/configuracao", summary="Configuração das faixas de códigos")
def obter_configuracao_faixas():
    """
    Retorna a configuração das faixas de códigos do sistema.
    
    **Informações:**
    - Início e fim de cada faixa
    - Prefixo utilizado
    - Descrição da faixa
    - Capacidade total
    
    **Uso:**
    - Documentação do sistema
    - Interface administrativa
    - Validações no frontend
    """
    configuracao = {}
    
    for tipo, config in FAIXAS_CODIGOS.items():
        configuracao[tipo.value] = {
            "inicio": config["inicio"],
            "fim": config["fim"],
            "prefixo": config["prefixo"],
            "descricao": config["descricao"],
            "capacidade": config["fim"] - config["inicio"] + 1
        }
    
    return {
        "faixas": configuracao,
        "total_codigos_sistema": sum(
            c["fim"] - c["inicio"] + 1 
            for c in FAIXAS_CODIGOS.values()
        )
    }

# ============================================================================
# FUNCOES AUXILIARES PRIVADAS
# ============================================================================

def _gerar_alertas(estatisticas: Dict) -> List[Dict]:
    """
    Gera alertas baseado no uso das faixas
    
    Args:
        estatisticas: Dicionario com estatisticas por tipo
        
    Returns:
        Lista de alertas com severidade
    """
    alertas = []
    
    for tipo, stats in estatisticas.items():
        percentual = stats["percentual_uso"]
        
        if percentual >= 90:
            alertas.append({
                "tipo": tipo,
                "severidade": "critico",
                "mensagem": f"Faixa {stats['descricao']} está com {percentual}% de uso!",
                "acao_recomendada": "Considere expandir a faixa ou fazer limpeza de códigos não utilizados"
            })
        elif percentual >= 75:
            alertas.append({
                "tipo": tipo,
                "severidade": "atencao",
                "mensagem": f"Faixa {stats['descricao']} está com {percentual}% de uso",
                "acao_recomendada": "Monitore o crescimento nos próximos meses"
            })
        elif percentual >= 50:
            alertas.append({
                "tipo": tipo,
                "severidade": "informativo",
                "mensagem": f"Faixa {stats['descricao']} está com {percentual}% de uso",
                "acao_recomendada": "Uso normal, sem ações necessárias"
            })
    
    return alertas

def _verificar_alerta_individual(stats: Dict) -> Dict:
    """
    Verifica nivel de alerta para estatisticas individuais
    
    Args:
        stats: Estatisticas de uma faixa
        
    Returns:
        Dicionario com informacoes de alerta
    """
    percentual = stats["percentual_uso"]
    
    if percentual >= 90:
        return {
            "nivel": "critico",
            "cor": "red",
            "mensagem": "Faixa próxima do limite!"
        }
    elif percentual >= 75:
        return {
            "nivel": "atencao",
            "cor": "yellow",
            "mensagem": "Monitorar crescimento"
        }
    else:
        return {
            "nivel": "ok",
            "cor": "green",
            "mensagem": "Uso normal"
        }

def _calcular_projecao_esgotamento(stats: Dict) -> Dict:
    """
    Calcula projecao aproximada de esgotamento da faixa
    
    Args:
        stats: Estatisticas de uma faixa
        
    Returns:
        Dicionario com projecoes
    """
    # Projecao simplificada (assumindo crescimento linear)
    usados = stats["usados"]
    disponiveis = stats["disponiveis"]
    
    if usados == 0:
        return {
            "previsao": "indeterminada",
            "mensagem": "Nenhum código utilizado ainda"
        }
    
    # Assumir taxa de uso (placeholder - idealmente usar dados históricos)
    taxa_uso_mensal_estimada = max(1, usados // 12)  # Estimativa simplificada
    
    meses_restantes = disponiveis // taxa_uso_mensal_estimada if taxa_uso_mensal_estimada > 0 else 999
    
    if meses_restantes > 24:
        return {
            "previsao": "mais_de_2_anos",
            "mensagem": f"Capacidade suficiente ({meses_restantes} meses estimados)"
        }
    elif meses_restantes > 12:
        return {
            "previsao": "1_a_2_anos",
            "mensagem": f"Aproximadamente {meses_restantes} meses de capacidade"
        }
    elif meses_restantes > 6:
        return {
            "previsao": "6_a_12_meses",
            "mensagem": f"Atenção: apenas {meses_restantes} meses estimados"
        }
    else:
        return {
            "previsao": "menos_de_6_meses",
            "mensagem": f"CRÍTICO: apenas {meses_restantes} meses estimados!"
        }