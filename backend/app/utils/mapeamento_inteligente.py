# ============================================================================
# UTILS MAPEAMENTO INTELIGENTE - Sistema de Mapeamento (Fase 2)
# ============================================================================
# Descrição: Utilitários para integração do sistema de aliases com
# o sistema de sugestões automáticas existente
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from typing import Optional, Dict, List, Tuple
from sqlalchemy.orm import Session

from app.crud import taxonomia_alias as crud_alias
from app.crud import taxonomia as crud_taxonomia
from app.models.taxonomia import Taxonomia
from app.models.taxonomia_alias import TaxonomiaAlias


def mapear_nome_inteligente(db: Session, nome_insumo: str) -> Optional[Dict]:
    """
    Função principal para mapeamento inteligente de nomes de insumos.
    
    Combina o sistema de aliases com o sistema de sugestões por palavras-chave
    para fornecer o melhor mapeamento possível.
    
    Args:
        db: Sessão do banco de dados
        nome_insumo: Nome do insumo a ser mapeado
        
    Returns:
        Dict com dados da taxonomia encontrada ou None
        {
            'taxonomia_id': int,
            'taxonomia_nome_completo': str,
            'taxonomia_codigo': str,
            'metodo_encontrado': str,  # 'alias_exato', 'alias_normalizado', 'alias_parcial', 'palavras_chave'
            'confianca': int,  # 0-100
            'detalhes': dict
        }
    """
    if not nome_insumo or not nome_insumo.strip():
        return None
    
    nome_limpo = nome_insumo.strip()
    
    # 1. Tentar mapeamento via sistema de aliases (mais preciso)
    resultado_alias = crud_alias.buscar_mapeamento_por_nome(db, nome_limpo)
    
    if resultado_alias:
        alias, tipo_match = resultado_alias
        
        return {
            'taxonomia_id': alias.taxonomia_id,
            'taxonomia_nome_completo': alias.taxonomia.nome_completo,
            'taxonomia_codigo': alias.taxonomia.codigo_taxonomia,
            'metodo_encontrado': f'alias_{tipo_match}',
            'confianca': alias.confianca,
            'detalhes': {
                'alias_usado': alias.nome_alternativo,
                'tipo_alias': alias.tipo_alias,
                'origem_alias': alias.origem
            }
        }
    
    # 2. Fallback para sistema de palavras-chave (menos preciso, mas mais abrangente)
    resultado_palavras = mapear_por_palavras_chave(db, nome_limpo)
    
    if resultado_palavras:
        return {
            'taxonomia_id': resultado_palavras['taxonomia_id'],
            'taxonomia_nome_completo': resultado_palavras['nome_completo'],
            'taxonomia_codigo': resultado_palavras['codigo_taxonomia'],
            'metodo_encontrado': 'palavras_chave',
            'confianca': resultado_palavras['confianca'],
            'detalhes': {
                'palavras_encontradas': resultado_palavras['palavras_encontradas'],
                'score': resultado_palavras['score']
            }
        }
    
    return None


def mapear_por_palavras_chave(db: Session, nome_insumo: str) -> Optional[Dict]:
    """
    Sistema de mapeamento por palavras-chave (sistema original).
    
    Mantém compatibilidade com o sistema anterior enquanto o sistema
    de aliases está sendo populado.
    """
    # Dicionário de palavras-chave para mapeamento (sistema legado)
    palavras_chave_mapeamento = {
        # Carnes
        ('carne', 'boi', 'bovino', 'filé', 'file'): ('Carnes', 'Bovino', 'Filé', None),
        ('carne', 'moída', 'moida', 'boi', 'bovino'): ('Carnes', 'Bovino', 'Moído', None),
        ('frango', 'peito', 'chicken'): ('Carnes', 'Frango', 'Peito', None),
        ('frango', 'coxa', 'chicken'): ('Carnes', 'Frango', 'Coxa', None),
        ('bacon', 'toucinho'): ('Carnes', 'Suíno', 'Bacon', None),
        ('salsicha', 'linguiça'): ('Embutidos', 'Salsicha', 'Defumado', None),
        
        # Peixes
        ('salmão', 'salmao', 'salmon', 'filé', 'file'): ('Peixes', 'Salmão', 'Filé', None),
        ('salmão', 'salmao', 'salmon', 'inteiro'): ('Peixes', 'Salmão', 'Inteiro', None),
        ('linguado', 'filé', 'file'): ('Peixes', 'Linguado', 'Filé', None),
        
        # Grãos
        ('arroz', 'branco', 'tipo'): ('Grãos', 'Arroz', 'Branco', None),
        ('arroz', 'integral'): ('Grãos', 'Arroz', 'Integral', None),
        ('feijão', 'feijao', 'carioca'): ('Grãos', 'Feijão', 'Carioca', None),
        
        # Laticínios
        ('queijo', 'mussarela', 'muçarela', 'mozzarella'): ('Laticínios', 'Queijo', 'Mussarela', None),
        ('leite', 'integral'): ('Laticínios', 'Leite', 'Integral', None),
        
        # Verduras
        ('tomate', 'maduro'): ('Verduras', 'Tomate', 'Inteiro', None),
        ('cebola',): ('Verduras', 'Cebola', 'Inteiro', None),
        
        # Óleos
        ('óleo', 'oleo', 'soja'): ('Óleos', 'Soja', 'Refinado', None),
        
        # Massas
        ('macarrão', 'macarrao', 'espaguete'): ('Massas', 'Espaguete', 'Seco', None),
        
        # Milho
        ('milho',): ('Grãos', 'Milho', 'Inteiro', None),
        
        # Sal
        ('sal',): ('Temperos', 'Sal', 'Refinado', None),
    }
    
    nome_lower = nome_insumo.lower()
    melhor_match = None
    melhor_score = 0
    palavras_encontradas = []
    
    # Buscar melhor combinação de palavras-chave
    for palavras_chave, taxonomia_hierarquia in palavras_chave_mapeamento.items():
        palavras_encontradas_temp = []
        score = 0
        
        for palavra in palavras_chave:
            if palavra in nome_lower:
                palavras_encontradas_temp.append(palavra)
                score += 1
        
        # Calcular score proporcional
        score_proporcional = score / len(palavras_chave)
        
        if score_proporcional > melhor_score:
            melhor_score = score_proporcional
            melhor_match = taxonomia_hierarquia
            palavras_encontradas = palavras_encontradas_temp
    
    # Se encontrou um match razoável, buscar a taxonomia
    if melhor_match and melhor_score >= 0.5:  # Pelo menos 50% das palavras-chave
        categoria, subcategoria, especificacao, variante = melhor_match
        
        # Buscar taxonomia no banco
        taxonomia = crud_taxonomia.get_taxonomia_by_hierarquia(
            db=db,
            categoria=categoria,
            subcategoria=subcategoria,
            especificacao=especificacao,
            variante=variante
        )
        
        if taxonomia:
            confianca = int(melhor_score * 80)  # Máximo 80% para sistema de palavras-chave
            
            return {
                'taxonomia_id': taxonomia.id,
                'nome_completo': taxonomia.nome_completo,
                'codigo_taxonomia': taxonomia.codigo_taxonomia,
                'confianca': confianca,
                'score': melhor_score,
                'palavras_encontradas': palavras_encontradas
            }
    
    return None


def sugerir_taxonomias_inteligente(db: Session, nome_insumo: str, limite: int = 5) -> List[Dict]:
    """
    Combina sugestões do sistema de aliases com sugestões por palavras-chave.
    
    Retorna lista unificada ordenada por relevância.
    """
    if not nome_insumo or not nome_insumo.strip():
        return []
    
    sugestoes_finais = {}
    
    # 1. Sugestões via sistema de aliases
    sugestoes_alias = crud_alias.sugerir_taxonomias_para_nome(
        db=db,
        nome=nome_insumo.strip(),
        limite=limite
    )
    
    for sugestao in sugestoes_alias:
        taxonomia_id = sugestao['taxonomia_id']
        
        sugestoes_finais[taxonomia_id] = {
            'taxonomia_id': taxonomia_id,
            'taxonomia_nome_completo': sugestao['taxonomia_nome_completo'],
            'taxonomia_codigo': sugestao['taxonomia_codigo'],
            'confianca': sugestao['confianca'],
            'score': sugestao['score'],
            'metodo': 'alias',
            'detalhes': {
                'alias_usado': sugestao.get('alias_usado', ''),
                'score_alias': sugestao['score']
            }
        }
    
    # 2. Sugestão via palavras-chave (se não temos sugestões suficientes)
    if len(sugestoes_finais) < limite:
        resultado_palavras = mapear_por_palavras_chave(db, nome_insumo.strip())
        
        if resultado_palavras:
            taxonomia_id = resultado_palavras['taxonomia_id']
            
            # Adicionar apenas se não existe ou se tem score melhor
            if (taxonomia_id not in sugestoes_finais or 
                resultado_palavras['score'] > sugestoes_finais[taxonomia_id]['score']):
                
                sugestoes_finais[taxonomia_id] = {
                    'taxonomia_id': taxonomia_id,
                    'taxonomia_nome_completo': resultado_palavras['nome_completo'],
                    'taxonomia_codigo': resultado_palavras['codigo_taxonomia'],
                    'confianca': resultado_palavras['confianca'],
                    'score': resultado_palavras['score'],
                    'metodo': 'palavras_chave',
                    'detalhes': {
                        'palavras_encontradas': resultado_palavras['palavras_encontradas'],
                        'score_palavras': resultado_palavras['score']
                    }
                }
    
    # Ordenar por score e retornar
    resultado = sorted(sugestoes_finais.values(), key=lambda x: x['score'], reverse=True)
    
    return resultado[:limite]


def criar_alias_automatico(db: Session, nome_insumo: str, taxonomia_id: int, confianca: int = 85) -> Optional[TaxonomiaAlias]:
    """
    Cria automaticamente um alias baseado em mapeamento bem-sucedido.
    
    Útil para aprender automaticamente com mapeamentos manuais dos usuários.
    """
    try:
        # Verificar se taxonomia existe
        taxonomia = db.query(Taxonomia).filter(Taxonomia.id == taxonomia_id).first()
        if not taxonomia:
            return None
        
        # Verificar se já existe alias similar
        from app.schemas.taxonomia_alias import TaxonomiaAliasBase
        nome_normalizado = TaxonomiaAliasBase.normalizar_nome(nome_insumo)
        
        alias_existente = db.query(TaxonomiaAlias).filter(
            TaxonomiaAlias.nome_normalizado == nome_normalizado
        ).first()
        
        if alias_existente:
            return alias_existente  # Já existe
        
        # Criar novo alias automaticamente
        novo_alias = TaxonomiaAlias(
            taxonomia_id=taxonomia_id,
            nome_alternativo=nome_insumo.strip(),
            nome_normalizado=nome_normalizado,
            tipo_alias="automatico",
            confianca=confianca,
            origem="mapeamento_inteligente",
            observacoes="Criado automaticamente via mapeamento inteligente",
            ativo=True
        )
        
        db.add(novo_alias)
        db.commit()
        db.refresh(novo_alias)
        
        return novo_alias
        
    except Exception:
        db.rollback()
        return None


def estatisticas_mapeamento(db: Session) -> Dict:
    """
    Retorna estatísticas do sistema de mapeamento completo.
    """
    stats_alias = crud_alias.get_alias_stats(db)
    
    # Estatísticas adicionais
    total_taxonomias = db.query(Taxonomia).count()
    taxonomias_com_aliases = stats_alias['taxonomias_com_aliases']
    cobertura_aliases = (taxonomias_com_aliases / total_taxonomias * 100) if total_taxonomias > 0 else 0
    
    return {
        'sistema_aliases': stats_alias,
        'cobertura': {
            'total_taxonomias': total_taxonomias,
            'taxonomias_com_aliases': taxonomias_com_aliases,
            'percentual_cobertura': round(cobertura_aliases, 2)
        },
        'recomendacoes': {
            'aliases_recomendados': max(0, total_taxonomias - taxonomias_com_aliases),
            'status': 'completo' if cobertura_aliases >= 80 else 'em_desenvolvimento'
        }
    }