# ============================================================================
# CRUD TAXONOMIA - Operações de banco de dados para taxonomias hierárquicas
# ============================================================================
# Descrição: Este arquivo contém todas as operações de banco de dados para 
# taxonomias: criar, ler, atualizar e deletar taxonomias hierárquicas
# Data: 05/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from app.models.taxonomia import Taxonomia
from app.schemas.taxonomia import TaxonomiaCreate, TaxonomiaUpdate, TaxonomiaFilter
from app.models.insumo import Insumo

# ============================================================================
# OPERAÇÕES DE CRIAÇÃO
# ============================================================================

def create_taxonomia(db: Session, taxonomia: TaxonomiaCreate) -> Taxonomia:
    """
    Cria uma nova taxonomia na base de dados.
    
    Args:
        db (Session): Sessão do banco de dados
        taxonomia (TaxonomiaCreate): Dados da taxonomia a ser criada
        
    Returns:
        Taxonomia: Taxonomia criada com ID e códigos gerados
        
    Raises:
        ValueError: Se combinação hierárquica já existir
    """
    # Verificar se combinação hierárquica já existe
    existing = db.query(Taxonomia).filter(
        Taxonomia.categoria == taxonomia.categoria,
        Taxonomia.subcategoria == taxonomia.subcategoria,
        Taxonomia.especificacao == taxonomia.especificacao,
        Taxonomia.variante == taxonomia.variante
    ).first()
    
    if existing:
        raise ValueError(
            f"Taxonomia '{taxonomia.categoria} > {taxonomia.subcategoria} > "
            f"{taxonomia.especificacao} > {taxonomia.variante}' já existe"
        )
    
    # Criar objeto do modelo
    db_taxonomia = Taxonomia(
        categoria=taxonomia.categoria,
        subcategoria=taxonomia.subcategoria,
        especificacao=taxonomia.especificacao,
        variante=taxonomia.variante,
        descricao=taxonomia.descricao,
        ativo=taxonomia.ativo
    )
    
    # Gerar código e nome completo automaticamente
    db_taxonomia.codigo_taxonomia = db_taxonomia.gerar_codigo_taxonomia()
    db_taxonomia.nome_completo = db_taxonomia.gerar_nome_completo()
    
    try:
        # Salvar no banco
        db.add(db_taxonomia)
        db.commit()
        db.refresh(db_taxonomia)
        return db_taxonomia
        
    except Exception as e:
        db.rollback()
        raise ValueError(f"Erro ao salvar taxonomia: {str(e)}")

def create_taxonomias(db: Session, taxonomias: List[TaxonomiaCreate]) -> List[Taxonomia]:
    """
    Cria múltiplas taxonomias de uma vez (para importação em lote).
    
    Args:
        db (Session): Sessão do banco de dados
        taxonomias (List[TaxonomiaCreate]): Lista de taxonomias a serem criadas
        
    Returns:
        List[Taxonomia]: Lista de taxonomias criadas
    """
    taxonomias_criadas = []

    for taxonomia_data in taxonomias:
        try:
            taxonomia_criada = create_taxonomia(db, taxonomia_data)
            taxonomias_criadas.append(taxonomia_criada)
        except ValueError:
            # Se combinação já existe, pula para a próxima
            continue
    
    return taxonomias_criadas

# ============================================================================
# OPERAÇÕES DE LEITURA
# ============================================================================

def get_taxonomia_by_id(db: Session, taxonomia_id: int) -> Optional[Taxonomia]:
    """
    Busca uma taxonomia pelo ID.
    
    Args:
        db (Session): Sessão do banco de dados
        taxonomia_id (int): ID da taxonomia
        
    Returns:
        Optional[Taxonomia]: Taxonomia encontrada ou None
    """
    return db.query(Taxonomia).filter(Taxonomia.id == taxonomia_id).first()

def get_taxonomia_by_codigo(db: Session, codigo: str) -> Optional[Taxonomia]:
    """
    Busca uma taxonomia pelo código único.
    
    Args:
        db (Session): Sessão do banco de dados
        codigo (str): Código da taxonomia (ex: CAR-BOV-FIL-PREM)
        
    Returns:
        Optional[Taxonomia]: Taxonomia encontrada ou None
    """
    return db.query(Taxonomia).filter(Taxonomia.codigo_taxonomia == codigo.upper()).first()

def get_taxonomia_by_hierarquia(
    db: Session, 
    categoria: str, 
    subcategoria: str, 
    especificacao: Optional[str] = None,
    variante: Optional[str] = None
) -> Optional[Taxonomia]:
    """
    Busca uma taxonomia pela hierarquia completa.
    
    Args:
        db (Session): Sessão do banco de dados
        categoria (str): Categoria (nível 1)
        subcategoria (str): Subcategoria (nível 2)
        especificacao (Optional[str]): Especificação (nível 3)
        variante (Optional[str]): Variante (nível 4)
        
    Returns:
        Optional[Taxonomia]: Taxonomia encontrada ou None
    """
    query = db.query(Taxonomia).filter(
        Taxonomia.categoria == categoria,
        Taxonomia.subcategoria == subcategoria
    )
    
    if especificacao:
        query = query.filter(Taxonomia.especificacao == especificacao)
    else:
        query = query.filter(Taxonomia.especificacao.is_(None))
        
    if variante:
        query = query.filter(Taxonomia.variante == variante)
    else:
        query = query.filter(Taxonomia.variante.is_(None))
    
    return query.first()

def get_taxonomias(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    filters: Optional[TaxonomiaFilter] = None
) -> List[Taxonomia]:
    """
    Lista taxonomias com filtros opcionais e paginação.
    
    Args:
        db (Session): Sessão do banco de dados
        skip (int): Número de registros a pular (paginação)
        limit (int): Número máximo de registros a retornar
        filters (Optional[TaxonomiaFilter]): Filtros de busca
        
    Returns:
        List[Taxonomia]: Lista de taxonomias encontradas
    """
    query = db.query(Taxonomia)
    
    # Aplicar filtros se fornecidos
    if filters:
        if filters.categoria:
            query = query.filter(Taxonomia.categoria.ilike(f"%{filters.categoria}%"))
            
        if filters.subcategoria:
            query = query.filter(Taxonomia.subcategoria.ilike(f"%{filters.subcategoria}%"))
            
        if filters.especificacao:
            query = query.filter(Taxonomia.especificacao.ilike(f"%{filters.especificacao}%"))
            
        if filters.variante:
            query = query.filter(Taxonomia.variante.ilike(f"%{filters.variante}%"))
            
        if filters.busca_texto:
            search_term = f"%{filters.busca_texto}%"
            query = query.filter(
                or_(
                    Taxonomia.nome_completo.ilike(search_term),
                    Taxonomia.codigo_taxonomia.ilike(search_term),
                    Taxonomia.descricao.ilike(search_term)
                )
            )
            
        if filters.ativo is not None:
            query = query.filter(Taxonomia.ativo == filters.ativo)
    
    # Ordenar por hierarquia: categoria > subcategoria > especificação > variante
    return query.order_by(
        Taxonomia.categoria, 
        Taxonomia.subcategoria, 
        Taxonomia.especificacao, 
        Taxonomia.variante
    ).offset(skip).limit(limit).all()

def count_taxonomias(db: Session, filters: Optional[TaxonomiaFilter] = None) -> int:
    """
    Conta o total de taxonomias (para paginação).
    
    Args:
        db (Session): Sessão do banco de dados
        filters (Optional[TaxonomiaFilter]): Filtros de busca
        
    Returns:
        int: Total de taxonomias encontradas
    """
    query = db.query(Taxonomia)
    
    # Aplicar os mesmos filtros da função get_taxonomias
    if filters:
        if filters.categoria:
            query = query.filter(Taxonomia.categoria.ilike(f"%{filters.categoria}%"))
            
        if filters.subcategoria:
            query = query.filter(Taxonomia.subcategoria.ilike(f"%{filters.subcategoria}%"))
            
        if filters.especificacao:
            query = query.filter(Taxonomia.especificacao.ilike(f"%{filters.especificacao}%"))
            
        if filters.variante:
            query = query.filter(Taxonomia.variante.ilike(f"%{filters.variante}%"))
            
        if filters.busca_texto:
            search_term = f"%{filters.busca_texto}%"
            query = query.filter(
                or_(
                    Taxonomia.nome_completo.ilike(search_term),
                    Taxonomia.codigo_taxonomia.ilike(search_term),
                    Taxonomia.descricao.ilike(search_term)
                )
            )
            
        if filters.ativo is not None:
            query = query.filter(Taxonomia.ativo == filters.ativo)
    
    return query.count()

# ============================================================================
# OPERAÇÕES DE BUSCA HIERÁRQUICA ESPECÍFICAS
# ============================================================================

def get_categorias_disponiveis(db: Session) -> List[str]:
    """
    Retorna lista de categorias disponíveis (nível 1).
    
    Args:
        db (Session): Sessão do banco de dados
        
    Returns:
        List[str]: Lista de categorias únicas
    """
    result = db.query(Taxonomia.categoria).filter(
        Taxonomia.ativo == True
    ).distinct().order_by(Taxonomia.categoria).all()
    
    return [row[0] for row in result]

def get_subcategorias_por_categoria(db: Session, categoria: str) -> List[str]:
    """
    Retorna subcategorias disponíveis para uma categoria específica.
    
    Args:
        db (Session): Sessão do banco de dados
        categoria (str): Categoria para filtrar
        
    Returns:
        List[str]: Lista de subcategorias da categoria
    """
    result = db.query(Taxonomia.subcategoria).filter(
        Taxonomia.categoria == categoria,
        Taxonomia.ativo == True
    ).distinct().order_by(Taxonomia.subcategoria).all()
    
    return [row[0] for row in result]

def get_especificacoes_por_subcategoria(
    db: Session, 
    categoria: str, 
    subcategoria: str
) -> List[str]:
    """
    Retorna especificações disponíveis para categoria e subcategoria.
    
    Args:
        db (Session): Sessão do banco de dados
        categoria (str): Categoria
        subcategoria (str): Subcategoria
        
    Returns:
        List[str]: Lista de especificações (filtrado por categoria e subcategoria)
    """
    result = db.query(Taxonomia.especificacao).filter(
        Taxonomia.categoria == categoria,
        Taxonomia.subcategoria == subcategoria,
        Taxonomia.especificacao.isnot(None),
        Taxonomia.ativo == True
    ).distinct().order_by(Taxonomia.especificacao).all()
    
    return [row[0] for row in result]

def get_variantes_por_especificacao(
    db: Session, 
    categoria: str, 
    subcategoria: str, 
    especificacao: str
) -> List[str]:
    """
    Retorna variantes disponíveis para categoria, subcategoria e especificação.
    
    Args:
        db (Session): Sessão do banco de dados
        categoria (str): Categoria
        subcategoria (str): Subcategoria
        especificacao (str): Especificação
        
    Returns:
        List[str]: Lista de variantes
    """
    result = db.query(Taxonomia.variante).filter(
        Taxonomia.categoria == categoria,
        Taxonomia.subcategoria == subcategoria,
        Taxonomia.especificacao == especificacao,
        Taxonomia.variante.isnot(None),
        Taxonomia.ativo == True
    ).distinct().order_by(Taxonomia.variante).all()
    
    return [row[0] for row in result]

def get_taxonomias_por_categoria(db: Session, categoria: str) -> List[Taxonomia]:
    """
    Retorna todas as taxonomias de uma categoria específica.
    
    Args:
        db (Session): Sessão do banco de dados
        categoria (str): Categoria para buscar
        
    Returns:
        List[Taxonomia]: Lista de taxonomias da categoria
    """
    return db.query(Taxonomia).filter(
        Taxonomia.categoria == categoria,
        Taxonomia.ativo == True
    ).order_by(
        Taxonomia.subcategoria, 
        Taxonomia.especificacao, 
        Taxonomia.variante
    ).all()

# ============================================================================
# OPERAÇÕES DE ATUALIZAÇÃO
# ============================================================================

def update_taxonomia(
    db: Session, 
    taxonomia_id: int, 
    taxonomia_update: TaxonomiaUpdate
) -> Optional[Taxonomia]:
    """
    Atualiza uma taxonomia existente.
    
    Args:
        db (Session): Sessão do banco de dados
        taxonomia_id (int): ID da taxonomia a ser atualizada
        taxonomia_update (TaxonomiaUpdate): Dados para atualização
        
    Returns:
        Optional[Taxonomia]: Taxonomia atualizada ou None se não encontrada
    """
    db_taxonomia = get_taxonomia_by_id(db, taxonomia_id)
    if not db_taxonomia:
        return None
    
    # Atualizar apenas campos fornecidos
    update_data = taxonomia_update.model_dump(exclude_unset=True)
    
    # Verificar se mudança criaria duplicata
    if any(field in update_data for field in ['categoria', 'subcategoria', 'especificacao', 'variante']):
        # Construir nova combinação hierárquica
        nova_categoria = update_data.get('categoria', db_taxonomia.categoria)
        nova_subcategoria = update_data.get('subcategoria', db_taxonomia.subcategoria)
        nova_especificacao = update_data.get('especificacao', db_taxonomia.especificacao)
        nova_variante = update_data.get('variante', db_taxonomia.variante)
        
        # Verificar se combinação já existe (diferente da atual)
        existing = db.query(Taxonomia).filter(
            Taxonomia.id != taxonomia_id,
            Taxonomia.categoria == nova_categoria,
            Taxonomia.subcategoria == nova_subcategoria,
            Taxonomia.especificacao == nova_especificacao,
            Taxonomia.variante == nova_variante
        ).first()
        
        if existing:
            raise ValueError(
                f"Taxonomia '{nova_categoria} > {nova_subcategoria} > "
                f"{nova_especificacao} > {nova_variante}' já existe"
            )
    
    # Aplicar atualizações
    for field, value in update_data.items():
        setattr(db_taxonomia, field, value)
    
    # Regenerar código e nome completo se hierarquia mudou
    if any(field in update_data for field in ['categoria', 'subcategoria', 'especificacao', 'variante']):
        db_taxonomia.codigo_taxonomia = db_taxonomia.gerar_codigo_taxonomia()
        db_taxonomia.nome_completo = db_taxonomia.gerar_nome_completo()

    try:
        db.commit()
        db.refresh(db_taxonomia)
        return db_taxonomia
    except Exception as e:
        db.rollback()
        raise ValueError(f"Erro ao atualizar taxonomia: {str(e)}")

# ============================================================================
# OPERAÇÕES DE EXCLUSÃO
# ============================================================================

def delete_taxonomia(db: Session, taxonomia_id: int) -> bool:
    """
    Deleta uma taxonomia do banco de dados.
    
    Args:
        db (Session): Sessão do banco de dados
        taxonomia_id (int): ID da taxonomia a ser deletada
        
    Returns:
        bool: True se deletada com sucesso, False se não encontrada
        
    Raises:
        ValueError: Se taxonomia estiver sendo usada por insumos
    """
    db_taxonomia = get_taxonomia_by_id(db, taxonomia_id)
    if not db_taxonomia:
        return False
    
    # Verificar se taxonomia está sendo usada por insumos
    insumos_usando = db.query(Insumo).filter(Insumo.taxonomia_id == taxonomia_id).count()
    
    if insumos_usando > 0:
        raise ValueError(
            f"Não é possível deletar taxonomia '{db_taxonomia.nome_completo}'. "
            f"Ela está sendo usada por {insumos_usando} insumo(s)."
        )
    
    try:
        db.delete(db_taxonomia)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise ValueError(f"Erro ao deletar taxonomia: {str(e)}")

def soft_delete_taxonomia(db: Session, taxonomia_id: int) -> bool:
    """
    Desativa uma taxonomia ao invés de deletar (soft delete).
    
    Args:
        db (Session): Sessão do banco de dados
        taxonomia_id (int): ID da taxonomia a ser desativada
        
    Returns:
        bool: True se desativada com sucesso, False se não encontrada
    """
    db_taxonomia = get_taxonomia_by_id(db, taxonomia_id)
    if not db_taxonomia:
        return False
    
    db_taxonomia.ativo = False
    
    try:
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise ValueError(f"Erro ao desativar taxonomia: {str(e)}")

# ============================================================================
# OPERAÇÕES ESTATÍSTICAS
# ============================================================================

def get_estatisticas_taxonomia(db: Session) -> dict:
    """
    Retorna estatísticas gerais sobre as taxonomias.
    
    Args:
        db (Session): Sessão do banco de dados
        
    Returns:
        dict: Estatísticas das taxonomias
    """
    try:
        print("🔍 DEBUG: Iniciando get_estatisticas_taxonomia")
        
        # Teste 1: Contar taxonomias
        print("🔍 DEBUG: Contando taxonomias...")
        total_taxonomias = db.query(Taxonomia).count()
        print(f"🔍 DEBUG: total_taxonomias = {total_taxonomias}")
        
        # Teste 2: Contar ativas
        print("🔍 DEBUG: Contando taxonomias ativas...")
        total_ativas = db.query(Taxonomia).filter(Taxonomia.ativo == True).count()
        print(f"🔍 DEBUG: total_ativas = {total_ativas}")
        
        # Teste 3: Contar categorias
        print("🔍 DEBUG: Contando categorias...")
        total_categorias = db.query(Taxonomia.categoria).distinct().count()
        print(f"🔍 DEBUG: total_categorias = {total_categorias}")
        
        # Teste 4: Contar subcategorias
        print("🔍 DEBUG: Contando subcategorias...")
        total_subcategorias = db.query(Taxonomia.subcategoria).distinct().count()
        print(f"🔍 DEBUG: total_subcategorias = {total_subcategorias}")
        
        # Teste 5: Contar insumos (aqui pode estar o problema)
        print("🔍 DEBUG: Contando insumos com taxonomia...")
        insumos_com_taxonomia = db.query(Insumo).filter(Insumo.taxonomia_id.isnot(None)).count()
        print(f"🔍 DEBUG: insumos_com_taxonomia = {insumos_com_taxonomia}")
        
        print("🔍 DEBUG: Contando total de insumos...")
        total_insumos = db.query(Insumo).count()
        print(f"🔍 DEBUG: total_insumos = {total_insumos}")
        
        # Teste 6: Calcular percentual
        print("🔍 DEBUG: Calculando percentual...")
        percentual = round(
            (insumos_com_taxonomia / total_insumos * 100) if total_insumos > 0 else 0, 2
        )
        print(f"🔍 DEBUG: percentual = {percentual}")
        
        resultado = {
            "total_taxonomias": total_taxonomias,
            "taxonomias_ativas": total_ativas,
            "taxonomias_inativas": total_taxonomias - total_ativas,
            "total_categorias": total_categorias,
            "total_subcategorias": total_subcategorias,
            "insumos_com_taxonomia": insumos_com_taxonomia,
            "total_insumos": total_insumos,
            "percentual_insumos_com_taxonomia": percentual
        }
        
        print(f"🔍 DEBUG: Resultado final = {resultado}")
        return resultado
        
    except Exception as e:
        print(f"❌ DEBUG ERROR: {str(e)}")
        print(f"❌ DEBUG ERROR TYPE: {type(e)}")
        import traceback
        traceback.print_exc()
        raise e