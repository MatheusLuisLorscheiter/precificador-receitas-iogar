# ============================================================================
# CRUD TAXONOMIA ALIAS - Sistema de Mapeamento Inteligente (Fase 2)
# ============================================================================
# Descrição: Operações de banco de dados para aliases de taxonomias
# Sistema de mapeamento de nomes alternativos para taxonomias hierárquicas
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc

from app.models.taxonomia_alias import TaxonomiaAlias
from app.models.taxonomia import Taxonomia
from app.schemas.taxonomia_alias import (
    TaxonomiaAliasCreate,
    TaxonomiaAliasUpdate,
    TaxonomiaAliasBase
)


# ============================================================================
# OPERAÇÕES BÁSICAS CRUD
# ============================================================================

def get_alias_by_id(db: Session, alias_id: int) -> Optional[TaxonomiaAlias]:
    """
    Busca um alias pelo ID com dados da taxonomia relacionada.
    """
    return db.query(TaxonomiaAlias)\
        .options(joinedload(TaxonomiaAlias.taxonomia))\
        .filter(TaxonomiaAlias.id == alias_id)\
        .first()


def get_aliases(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    taxonomia_id: Optional[int] = None,
    tipo_alias: Optional[str] = None,
    ativo: Optional[bool] = None,
    busca: Optional[str] = None
) -> List[TaxonomiaAlias]:
    """
    Lista aliases com filtros opcionais.
    """
    query = db.query(TaxonomiaAlias)\
        .options(joinedload(TaxonomiaAlias.taxonomia))
    
    # Aplicar filtros
    if taxonomia_id:
        query = query.filter(TaxonomiaAlias.taxonomia_id == taxonomia_id)
    
    if tipo_alias:
        query = query.filter(TaxonomiaAlias.tipo_alias == tipo_alias)
    
    if ativo is not None:
        query = query.filter(TaxonomiaAlias.ativo == ativo)
    
    if busca:
        busca_term = f"%{busca.lower()}%"
        query = query.filter(
            or_(
                TaxonomiaAlias.nome_alternativo.ilike(busca_term),
                TaxonomiaAlias.nome_normalizado.like(busca_term),
                TaxonomiaAlias.origem.ilike(busca_term)
            )
        )
    
    return query.order_by(TaxonomiaAlias.confianca.desc(), TaxonomiaAlias.nome_alternativo)\
        .offset(skip)\
        .limit(limit)\
        .all()


def count_aliases(
    db: Session,
    taxonomia_id: Optional[int] = None,
    tipo_alias: Optional[str] = None,
    ativo: Optional[bool] = None,
    busca: Optional[str] = None
) -> int:
    """
    Conta total de aliases com filtros opcionais.
    """
    query = db.query(TaxonomiaAlias)
    
    # Aplicar os mesmos filtros da função get_aliases
    if taxonomia_id:
        query = query.filter(TaxonomiaAlias.taxonomia_id == taxonomia_id)
    
    if tipo_alias:
        query = query.filter(TaxonomiaAlias.tipo_alias == tipo_alias)
    
    if ativo is not None:
        query = query.filter(TaxonomiaAlias.ativo == ativo)
    
    if busca:
        busca_term = f"%{busca.lower()}%"
        query = query.filter(
            or_(
                TaxonomiaAlias.nome_alternativo.ilike(busca_term),
                TaxonomiaAlias.nome_normalizado.like(busca_term),
                TaxonomiaAlias.origem.ilike(busca_term)
            )
        )
    
    return query.count()


def create_alias(db: Session, alias: TaxonomiaAliasCreate) -> TaxonomiaAlias:
    """
    Cria um novo alias de taxonomia.
    
    Gera automaticamente o nome_normalizado e valida duplicatas.
    """
    # Gerar nome normalizado
    nome_normalizado = TaxonomiaAliasBase.normalizar_nome(alias.nome_alternativo)
    
    # Verificar se já existe alias com mesmo nome normalizado
    existing_alias = db.query(TaxonomiaAlias)\
        .filter(TaxonomiaAlias.nome_normalizado == nome_normalizado)\
        .first()
    
    if existing_alias:
        raise ValueError(f"Já existe alias com nome similar: '{existing_alias.nome_alternativo}'")
    
    # Verificar se a taxonomia existe
    taxonomia = db.query(Taxonomia)\
        .filter(Taxonomia.id == alias.taxonomia_id)\
        .first()
    
    if not taxonomia:
        raise ValueError(f"Taxonomia com ID {alias.taxonomia_id} não encontrada")
    
    # Criar o alias
    db_alias = TaxonomiaAlias(
        taxonomia_id=alias.taxonomia_id,
        nome_alternativo=alias.nome_alternativo,
        nome_normalizado=nome_normalizado,
        tipo_alias=alias.tipo_alias,
        confianca=alias.confianca,
        origem=alias.origem,
        observacoes=alias.observacoes,
        ativo=alias.ativo
    )
    
    db.add(db_alias)
    db.commit()
    db.refresh(db_alias)
    
    return db_alias


def update_alias(
    db: Session, 
    alias_id: int, 
    alias_update: TaxonomiaAliasUpdate
) -> Optional[TaxonomiaAlias]:
    """
    Atualiza um alias existente.
    """
    db_alias = get_alias_by_id(db, alias_id)
    
    if not db_alias:
        return None
    
    # Atualizar campos fornecidos
    update_data = alias_update.model_dump(exclude_unset=True)
    
    # Se nome_alternativo foi alterado, recalcular nome_normalizado
    if 'nome_alternativo' in update_data:
        novo_nome_normalizado = TaxonomiaAliasBase.normalizar_nome(
            update_data['nome_alternativo']
        )
        
        # Verificar duplicatas (excluindo o próprio registro)
        existing_alias = db.query(TaxonomiaAlias)\
            .filter(
                and_(
                    TaxonomiaAlias.nome_normalizado == novo_nome_normalizado,
                    TaxonomiaAlias.id != alias_id
                )
            )\
            .first()
        
        if existing_alias:
            raise ValueError(f"Já existe alias com nome similar: '{existing_alias.nome_alternativo}'")
        
        update_data['nome_normalizado'] = novo_nome_normalizado
    
    # Aplicar atualizações
    for field, value in update_data.items():
        setattr(db_alias, field, value)
    
    db.commit()
    db.refresh(db_alias)
    
    return db_alias


def delete_alias(db: Session, alias_id: int) -> bool:
    """
    Deleta um alias.
    """
    db_alias = get_alias_by_id(db, alias_id)
    
    if not db_alias:
        return False
    
    db.delete(db_alias)
    db.commit()
    
    return True


# ============================================================================
# OPERAÇÕES DE MAPEAMENTO INTELIGENTE
# ============================================================================

def buscar_mapeamento_por_nome(
    db: Session, 
    nome: str,
    incluir_inativos: bool = False
) -> Optional[Tuple[TaxonomiaAlias, str]]:
    """
    Busca mapeamento de um nome para taxonomia.
    
    Retorna: (TaxonomiaAlias, tipo_match) ou None
    tipo_match: 'exato', 'normalizado', 'parcial'
    """
    if not nome or not nome.strip():
        return None
    
    nome_limpo = nome.strip()
    nome_normalizado = TaxonomiaAliasBase.normalizar_nome(nome_limpo)
    
    query = db.query(TaxonomiaAlias)\
        .options(joinedload(TaxonomiaAlias.taxonomia))
    
    if not incluir_inativos:
        query = query.filter(TaxonomiaAlias.ativo == True)
    
    # 1. Busca exata por nome alternativo
    alias_exato = query.filter(TaxonomiaAlias.nome_alternativo == nome_limpo).first()
    if alias_exato:
        return (alias_exato, 'exato')
    
    # 2. Busca por nome normalizado
    alias_normalizado = query.filter(TaxonomiaAlias.nome_normalizado == nome_normalizado).first()
    if alias_normalizado:
        return (alias_normalizado, 'normalizado')
    
    # 3. Busca parcial (contém o termo)
    alias_parcial = query.filter(
        or_(
            TaxonomiaAlias.nome_alternativo.ilike(f"%{nome_limpo}%"),
            TaxonomiaAlias.nome_normalizado.like(f"%{nome_normalizado}%")
        )
    ).order_by(TaxonomiaAlias.confianca.desc()).first()
    
    if alias_parcial:
        return (alias_parcial, 'parcial')
    
    return None


def sugerir_taxonomias_para_nome(
    db: Session,
    nome: str,
    limite: int = 5
) -> List[Dict]:
    """
    Sugere possíveis taxonomias para um nome baseado em aliases similares.
    
    Retorna lista ordenada por relevância.
    """
    if not nome or not nome.strip():
        return []
    
    nome_normalizado = TaxonomiaAliasBase.normalizar_nome(nome.strip())
    palavras = nome_normalizado.split()
    
    if not palavras:
        return []
    
    # Buscar aliases que contenham qualquer palavra do nome
    query = db.query(TaxonomiaAlias)\
        .options(joinedload(TaxonomiaAlias.taxonomia))\
        .filter(TaxonomiaAlias.ativo == True)
    
    # Construir condições para busca por palavras
    condicoes = []
    for palavra in palavras:
        if len(palavra) >= 3:  # Apenas palavras com 3+ caracteres
            condicoes.append(TaxonomiaAlias.nome_normalizado.like(f"%{palavra}%"))
    
    if not condicoes:
        return []
    
    aliases = query.filter(or_(*condicoes))\
        .order_by(TaxonomiaAlias.confianca.desc())\
        .limit(limite * 2)\
        .all()  # Buscar mais para depois filtrar
    
    # Calcular relevância e remover duplicatas
    sugestoes = {}
    
    for alias in aliases:
        if not alias.taxonomia:
            continue
        
        taxonomia_id = alias.taxonomia.id
        
        if taxonomia_id not in sugestoes:
            # Calcular score de relevância
            score = calcular_relevancia_nome(nome_normalizado, alias.nome_normalizado)
            score *= (alias.confianca / 100.0)  # Fator de confiança
            
            sugestoes[taxonomia_id] = {
                'taxonomia_id': taxonomia_id,
                'taxonomia_nome_completo': alias.taxonomia.nome_completo,
                'taxonomia_codigo': alias.taxonomia.codigo_taxonomia,
                'alias_usado': alias.nome_alternativo,
                'confianca': alias.confianca,
                'score': score
            }
        else:
            # Se já existe, manter o de maior score
            score = calcular_relevancia_nome(nome_normalizado, alias.nome_normalizado)
            score *= (alias.confianca / 100.0)
            
            if score > sugestoes[taxonomia_id]['score']:
                sugestoes[taxonomia_id].update({
                    'alias_usado': alias.nome_alternativo,
                    'confianca': alias.confianca,
                    'score': score
                })
    
    # Ordenar por score e retornar top resultados
    resultado = sorted(sugestoes.values(), key=lambda x: x['score'], reverse=True)
    
    return resultado[:limite]


def calcular_relevancia_nome(nome1: str, nome2: str) -> float:
    """
    Calcula relevância entre dois nomes normalizados.
    
    Retorna score de 0.0 a 1.0.
    """
    if not nome1 or not nome2:
        return 0.0
    
    # Calcular sobreposição de palavras
    palavras1 = set(nome1.split())
    palavras2 = set(nome2.split())
    
    if not palavras1 or not palavras2:
        return 0.0
    
    # Score baseado em palavras em comum
    intersecao = len(palavras1.intersection(palavras2))
    uniao = len(palavras1.union(palavras2))
    
    score_palavras = intersecao / uniao if uniao > 0 else 0.0
    
    # Bonus se uma string contém a outra
    if nome1 in nome2 or nome2 in nome1:
        score_palavras += 0.2
    
    # Limitar a 1.0
    return min(score_palavras, 1.0)


# ============================================================================
# OPERAÇÕES EM LOTE
# ============================================================================

def create_aliases_lote(
    db: Session, 
    aliases: List[TaxonomiaAliasCreate]
) -> Tuple[List[TaxonomiaAlias], List[str]]:
    """
    Cria múltiplos aliases em lote.
    
    Retorna: (aliases_criados, erros)
    """
    aliases_criados = []
    erros = []
    
    for i, alias in enumerate(aliases):
        try:
            novo_alias = create_alias(db, alias)
            aliases_criados.append(novo_alias)
        except Exception as e:
            erros.append(f"Alias {i + 1} ('{alias.nome_alternativo}'): {str(e)}")
    
    return aliases_criados, erros


# ============================================================================
# ESTATÍSTICAS
# ============================================================================

def get_alias_stats(db: Session) -> Dict:
    """
    Retorna estatísticas do sistema de aliases.
    """
    # Contagens básicas
    total_aliases = db.query(TaxonomiaAlias).count()
    aliases_ativos = db.query(TaxonomiaAlias)\
        .filter(TaxonomiaAlias.ativo == True)\
        .count()
    
    # Aliases por tipo
    aliases_por_tipo = dict(
        db.query(TaxonomiaAlias.tipo_alias, func.count(TaxonomiaAlias.id))\
        .group_by(TaxonomiaAlias.tipo_alias)\
        .all()
    )
    
    # Aliases por nível de confiança (faixas)
    faixas_confianca = {
        'alta (90-100)': 0,
        'media (70-89)': 0,
        'baixa (0-69)': 0
    }
    
    resultados_confianca = db.query(TaxonomiaAlias.confianca).all()
    for (confianca,) in resultados_confianca:
        if confianca >= 90:
            faixas_confianca['alta (90-100)'] += 1
        elif confianca >= 70:
            faixas_confianca['media (70-89)'] += 1
        else:
            faixas_confianca['baixa (0-69)'] += 1
    
    # Taxonomias com aliases
    taxonomias_com_aliases = db.query(TaxonomiaAlias.taxonomia_id)\
        .distinct()\
        .count()
    
    return {
        'total_aliases': total_aliases,
        'aliases_ativos': aliases_ativos,
        'aliases_por_tipo': aliases_por_tipo,
        'aliases_por_confianca': faixas_confianca,
        'taxonomias_com_aliases': taxonomias_com_aliases
    }