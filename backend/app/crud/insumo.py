#   ---------------------------------------------------------------------------------------------------
#   CRUD de Insumos - Operações de banco de dados
#   Descrição: Este arquivo contém todas as operações de banco de dados para insumos: criar, ler, atualizar e deletar.
#   Data: 11/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.insumo import Insumo
from app.schemas.insumo import InsumoCreate, InsumoUpdate, InsumoFilter

#   ---------------------------------------------------------------------------------------------------
#   Operação de leitura
#   ---------------------------------------------------------------------------------------------------

def get_insumo_by_id(db: Session, insumo_id: int) -> Optional[Insumo]:
    """
    Busca um insumo pelo ID.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo
        
    Returns:
        Optional[Insumo]: Insumo encontrado ou None
    """
    return db.query(Insumo).filter(Insumo.id == insumo_id).first()

def get_insumo_by_codigo(db: Session, codigo: str) -> Optional[Insumo]:
    """
    Busca um insumo pelo código único.
    
    Args:
        db (Session): Sessão do banco de dados
        codigo (str): Código do insumo
        
    Returns:
        Optional[Insumo]: Insumo encontrado ou None
    """ 
    return db.query(Insumo).filter(Insumo.codigo == codigo.upper()).first()

def get_insumos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    filters: Optional[InsumoFilter] = None
) -> List[Insumo]:
    """
    Lista insumos com paginação e filtros opcionais.
    
    Args:
        db (Session): Sessão do banco de dados
        skip (int): Número de registros para pular (paginação)
        limit (int): Limite de registros a retornar
        filters (InsumoFilter): Filtros de busca
        
    Returns:
        List[Insumo]: Lista de insumos
    """
    query = db.query(Insumo)

    # Aplicar filtros fornecidos
    if filters:
        # filtro por grupo
        if filters.grupo:
            query = query.filter(Insumo.grupo.ilike(f"%{filters.grupo}%"))

        # filtro por subgupo
        if filters.subgrupo:
            query = query.filter(Insumo.subgrupo.ilike(f"%{filters.subgrupo}%"))

        # filtro por codigo
        if filters.codigo:
            query = query.filter(Insumo.codigo.ilike(f"%{filters.codigo}%"))

        # filtro por nome
        if filters.nome:
            query = query.filter(Insumo.nome.ilike(f"%{filters.nome}%"))

        # filtro por unidade
        if filters.unidade:
            query = query.filter(Insumo.unidade.ilike(f"%{filters.unidade}%"))

        # filtro por faixa de preço
        if filters.preco_min is not None:
            preco_min_centavos = int(filters.preco_min * 100)
            query = query.filter(Insumo.preco_compra >= preco_min_centavos)

        if filters.preco_max is not None:
            preco_max_centavos = int(filters.preco_max * 100)
            query = query.filter(Insumo.preco_compra <= preco_max_centavos)

    # Aplicar paginação e ordenação
    return query.order_by(Insumo.grupo, Insumo.subgrupo, Insumo.nome).offset(skip).limit(limit).all()

def count_insumos(db: Session, filters: Optional[InsumoFilter] = None) -> int:
    """
    Conta o total de insumos (com filtros opcionais).
    
    Args:
        db (Session): Sessão do banco de dados
        filters (InsumoFilter): Filtros de busca
        
    Returns:
        int: Número total de insumos
    """
    query = db.query(Insumo)

    # Aplicar os mesmos filtros da função get_insumos
    if filters:
        if filters.grupo:
            query = query.filter(Insumo.grupo.ilike(f"%{filters.grupo}%"))
        if filters.subgrupo:
            query = query.filter(Insumo.subgrupo.ilike(f"%{filters.subgrupo}%"))
        if filters.codigo:
            query = query.filter(Insumo.codigo.ilike(f"%{filters.codigo}%"))
        if filters.nome:
            query = query.filter(Insumo.nome.ilike(f"%{filters.nome}%"))
        if filters.unidade:
            query = query.filter(Insumo.unidade == filters.unidade)
        if filters.preco_min is not None:
            preco_min_centavos = int(filters.preco_min * 100)
            query = query.filter(Insumo.preco_compra >= preco_min_centavos)
        if filters.preco_max is not None:
            preco_max_centavos = int(filters.preco_max * 100)
            query = query.flter(Insumo.preco_compra <= preco_max_centavos)

    return query.count()

def search_insumos(db: Session, termo_busca: str, limit: int = 20) -> List[Insumo]:
    """
    Busca insumos por termo geral (nome, código ou grupo).
    
    Args:
        db (Session): Sessão do banco de dados
        termo_busca (str): Termo para buscar
        limit (int): Limite de resultados
        
    Returns:
        List[Insumo]: Lista de insumos encontrados
    """

    termo = f"%{termo_busca}%"
    return db.query(Insumo).filter(
        or_(
            Insumo.nome.ilike(termo),
            Insumo.codigo.ilike(termo),
            Insumo.grupo.ilike(termo),
            Insumo.subgrupo.ilike(termo)
        )
    ).order_by(Insumo.nome).limit(limit).all()

#   ---------------------------------------------------------------------------------------------------
#   Operações de criação
#   ---------------------------------------------------------------------------------------------------

def create_insumo(db: Session, insumo: InsumoCreate) -> Insumo:
    """
    Cria um novo insumo no banco de dados.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo (InsumoCreate): Dados do insumo a ser criado
        
    Returns:
        Insumo: Insumo criado com ID
        
    Raises:
        ValueError: Se código já existir
    """
    # Converter preço de reais para centavos
    preco_centavos = None
    if insumo.preco_compra_real is not None:
        preco_centavos = int(insumo.preco_compra_real * 100)
    
    # Criar objeto do modelo
    db_insumo = Insumo(
        grupo=insumo.grupo,
        subgrupo=insumo.subgrupo,
        codigo=insumo.codigo.upper(),
        nome=insumo.nome,
        quantidade=insumo.quantidade,
        fator=insumo.fator,
        unidade=insumo.unidade,
        preco_compra=preco_centavos
    )

    # Salvar no banco
    db.add(db_insumo)
    db.commit()
    db.refresh(db_insumo)

    return db_insumo

def create_insumos(db: Session, insumos: List[InsumoCreate]) -> List[Insumo]:
    """
    Cria múltiplos insumos de uma vez (para importação em lote).
    
    Args:
        db (Session): Sessão do banco de dados
        insumos (List[InsumoCreate]): Lista de insumos a serem criados
        
    Returns:
        List[Insumo]: Lista de insumos criados
    """
    insumos_criados = []

    for insumo_data in insumos:
        try:
            insumo_criado = create_insumo(db, insumo_data)
            insumos_criados.append(insumo_criado)
        except ValueError:
            # Se codigo ja existe, pula para o proximo
            continue
    
    return insumos_criados


#   ---------------------------------------------------------------------------------------------------
#   Operações de atualização
#   ---------------------------------------------------------------------------------------------------

def update_insumo(db: Session, insumo_id: int, insumo_update: InsumoUpdate) -> Optional[Insumo]:
    """
    Atualiza um insumo existente.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo a ser atualizado
        insumo_update (InsumoUpdate): Dados para atualização
        
    Returns:
        Optional[Insumo]: Insumo atualizado ou None se não encontrado
    """

    db_insumo = get_insumo_by_id(db, insumo_id)
    if not db_insumo:
        return None
    
    # Atualizar apenas campoos fornecidos
    update_data = insumo_update.model_dump(exclude_unset=True)

    # Tratar conversão de preço se fornecido
    if "preco_compra_real" in update_data:
        preco_real = update_data.pop("preco_compra_real")
        if preco_real is not None:
            update_data["preco_compra"] = int(preco_real * 100)
        else:
            update_data["preco_compra"] = None

    # Converter código para maiúsculo se fornecido
    if "codigo" in update_data:
        update_data["codigo"] = update_data["codigo"].upper()

        # Verificar se novo código já existe
        existing_insumo = get_insumo_by_codigo(db, update_data["codigo"])
        if existing_insumo and existing_insumo.id != insumo_id:
            raise ValueError(f"Código '{update_data['codigo']}' já está em uso")
    
    # Aplicar atualizações
    for field, value in update_data.items():
        setattr(db_insumo, field, value)

    db.commit()
    db.refresh(db_insumo)

    return db_insumo

#   ---------------------------------------------------------------------------------------------------
#   Operações de exclusão
#   ---------------------------------------------------------------------------------------------------

def delete_insumo(db: Session, insumo_id: int) -> bool:
    """
    Deleta um insumo do banco de dados.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo a ser deletado
        
    Returns:
        bool: True se deletado com sucesso, False se não encontrado
        
    Raises:
        ValueError: Se insumo estiver sendo usado em receitas
    """
    db_insumo = get_insumo_by_id(db, insumo_id)
    if not db_insumo:
        return False
    
    # Verificar se insumo esta sendo usado em receitas
    if db_insumo.receitas:
        receitas_usando = [r.receita.nome for r in db_insumo.receitas]
        raise ValueError(
            f"Não é possivel deletar o insumo '{db_insumo.nome}'. "
            f"Ele está sendo usado nas receitas: {', '.join(receitas_usando)}"
        )
    
    db.delete(db_insumo)
    db.commit()

    return True

#   ---------------------------------------------------------------------------------------------------
#   Operações auxiliares
#   ---------------------------------------------------------------------------------------------------

def get_grupos_unicos(db: Session) -> List[str]:
    """
    Retorna lista única de grupos de insumos.
    
    Args:
        db (Session): Sessão do banco de dados
        
    Returns:
        List[str]: Lista de grupos únicos
    """
    return [grupo[0] for grupo in db.query(Insumo.grupo).distinct().order_by(Insumo.grupo).all()]

def get_subgrupos_por_grupo(db: Session, grupo: str) -> List[str]:
    """
    Retorna subgrupos de um grupo específico.
    
    Args:
        db (Session): Sessão do banco de dados
        grupo (str): Grupo para filtrar
        
    Returns:
        List[str]: Lista de subgrupos do grupo
    """
    return [
        subgrupo[0] for subgrupo in
        db.query(Insumo.subgrupo)
        .filter(Insumo.subgrupo == grupo)
        .distinct()
        .order_by(Insumo.subgrupo)
        .all()
    ]

def get_unidades_unicas(db: Session) -> List[str]:
    """
    Retorna lista única de unidades de medida.
    
    Args:
        db (Session): Sessão do banco de dados
        
    Returns:
        List[str]: Lista de unidades únicas
    """
    return [unidade[0] for unidade in db.query(Insumo.unidade).distinct().order_by(Insumo.unidade).all()]