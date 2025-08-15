#   ---------------------------------------------------------------------------------------------------
#   CRUD RECEITAS - Operações de banco de dados para receitas
#   Descrição: Este arquivo contém todas as operações de banco de dados para receitas,
#   restaurantes e relacionamentos receita-insumo
#   Data: 14/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func

from app.models.receita import Restaurante, Receita, ReceitaInsumo
from app.models.insumo import Insumo
from app.schemas.receita import (
    RestauranteCreate, RestauranteUpdate,
    ReceitaCreate, ReceitaUpdate, ReceitaFilter,
    ReceitaInsumoCreate, ReceitaInsumoUpdate
)

#   ---------------------------------------------------------------------------------------------------
#   CRUD Restaurantes
#   ---------------------------------------------------------------------------------------------------

def create_restaurante(db: Session, restaurante: RestauranteCreate) -> Restaurante:
    """
    Cria um novo restaurante no banco de dados.
    
    Args:
        db (Session): Sessão do banco de dados
        restaurante (RestauranteCreate): Dados do restaurante a ser criado
        
    Returns:
        Restaurante: Restaurante criado com ID
        
    Raises:
        ValueError: Se já existir restaurante com mesmo CNPJ
    """
    # Verificar se CNPJ já existe
    if restaurante.cnpj:
        existing_restaurante = db.query(Restaurante).filter(
            Restaurante.cnpj == restaurante.cnpj
        ).first()
        if existing_restaurante:
            raise ValueError(f"Restaurante com CNPJ '{restaurante.cnpj}' já existe")
    
    # Criar objeto do modelo
    db_restaurante = Restaurante(
        nome=restaurante.nome,
        cnpj=restaurante.cnpj,
        endereco=restaurante.endereco,
        telefone=restaurante.telefone,
        ativo=restaurante.ativo
    )

    # Salvar no banco
    db.add(db_restaurante)
    db.commit()
    db.refresh(db_restaurante)

    return db_restaurante

def get_restaurantes(
        db:    Session,
        skip:  int = 0,
        limit: int = 100,
        ativo: Optional[bool] = None
) -> List[Restaurante]:
    """Lista restaurante com paginação e filtros"""
    query = db.query(Restaurante)

    # Aplicar filtros
    if ativo is not None:
        query = query.filter(Restaurante.ativo == ativo)
    
    return query.offset(skip).limit(limit).all()

def get_restaurante_by_id(db: Session, restaurante_id: int) -> Optional[Restaurante]:
    """Busca restaurante por ID"""
    return db.query(Restaurante).filter(Restaurante.id == restaurante_id).first()

def update_restaurante(db: Session, restaurante_id: int, restaurante: RestauranteUpdate) -> Optional[Restaurante]:
    """Atualiza dados de um restaurante"""
    db_restaurante = get_restaurante_by_id(db, restaurante_id)
    if not db_restaurante:
        return None
    
    # Atualizar campos fornecidos
    for field, value in restaurante.model_dump(exclude_unset=True).items():
        setattr(db_restaurante, field, value)

        db.commit()
        db.refresh(db_restaurante)
        return db_restaurante
    
def delete_restaurante(db: Session, restaurante_id: int) -> bool:
    """Remove um restaurante (apenas se não tiver receitas)"""
    db_restaurante = get_restaurante_by_id(db, restaurante_id)
    if not db_restaurante:
        return False
    
    # Verificar se tem receitas
    receitas_count = db.query(Receita).filter(Receita.restaurante_id == restaurante_id).count()
    if receitas_count > 0:
        raise ValueError(f"Não é possivel excluir restaurante com {receitas_count} receitas")
    
    db.delete(db_restaurante)
    db.commit()
    return True

#   ---------------------------------------------------------------------------------------------------
#   CRUD Receitas
#   ---------------------------------------------------------------------------------------------------

def create(db: Session, receita: ReceitaCreate) -> Receita:
    """
    Cria uma nova receita no banco de dados.
    
    Args:
        db (Session): Sessão do banco de dados
        receita (ReceitaCreate): Dados da receita a ser criada
        
    Returns:
        Receita: Receita criada com ID
        
    Raises:
        ValueError: Se código já existir no restaurante ou restaurante não existir
    """
    # Verificar se restaurante existe
    restaurante = get_restaurante_by_id(db, receita.restaurante_id)
    if not restaurante:
        raise ValueError(f"Restaudante com ID {receita.restaurante_id} não existe")
    
    # Verificar se código já existe no restaurante
    existing_receita = db.query(Receita).filter(
        and_(
            Receita.codigo == receita.codigo.upper(),
            Receita.restaurante_id == receita.restaurante_id
        )
    ).first()
    if existing_receita:
        raise ValueError(f"Receita com código '{receita.codigo}' já existe neste restaurante")
    
    # Converter preços de reais para centavos
    preco_venda_centavos = None
    if receita.preco_venda_real is not None:
        preco_venda_centavos = int(receita.preco_venda_real * 100)
    
    margem_centavos = None
    if receita.margem_percentual_real is not None:
        margem_centavos = int(receita.margem_percentual_real * 100)

    # Criar objeto do modelo
    db_receita = Receita(
        # Campos herdados do BaseModel
        grupo=receita.grupo,
        subgrupo=receita.subgrupo,
        codigo=receita.codigo.upper(),
        nome=receita.nome,
        quantidade=receita.quantidade,
        fator=receita.fator,
        unidade=receita.unidade,
        preco_compra=0,     # CMV será calculado depois

        # Campos específicos da receita
        restaurante_id=receita.restaurante_id,
        preco_venda=preco_venda_centavos,
        cmv=0,  #Será calculado quando adicionar insumos
        margem_percentual=margem_centavos,

        # Campos opcionais
        receita_pai_id=receita.receita_pai_id,
        variacao_nome=receita.variacao_nome,
        descricao=receita.descricao,
        modo_preparo=receita.modo_preparo,
        tempo_preparo_minutos=receita.tempo_preparo_minutos,
        rendimento_porcoes=receita.rendimento_porcoes,
        ativo=receita.ativo
    )

    # Salvar no banco
    db.add(db_receita)
    db.commit()
    db.refresh(db_receita)

    return db_receita

def get_receitas(
        db:      Session,
        skip:    int = 0,
        limit:   int = 100,
        filtros: Optional[ReceitaFilter] = None
) -> List[Receita]:
    """
    Lista receitas com paginação e filtros.
    
    Args:
        db (Session): Sessão do banco de dados
        skip (int): Quantos registros pular
        limit (int): Máximo de registros a retornar
        filtros (ReceitaFilter): Filtros a aplicar
        
    Returns:
        List[Receita]: Lista de receitas
    """
    query = db.query(Receita).options(
        joinedload(Receita.restaurante),
        joinedload(Receita.receita_insumos).joinedLoad(ReceitaInsumo.insumo)
    )

    # Aplica filtros
    if filtros:
        if filtros.grupo:
            query = query.filter(Receita.grupo == filtros.grupo)
        if filtros.subgrupo:
            query = query.filter(Receita.subgrupo == filtros.subgrupo)
        if filtros.restaurante_id:
            query = query.filter(Receita.restaurante_id == filtros.restaurante_id)
        if filtros.ativo is not None:
            query = query.filter(Receita.ativo == filtros.ativo)
        if filtros.preco_min is not None:
            preco_min_centavos = int(filtros.preco_min * 100)
            query = query.filter(Receita.preco_venda >= preco_min_centavos)
        if filtros.preco_max is not None:
            preco_max_centavos = int(filtros.preco_max * 100)
            query = query.filter(Receita.preco_venda <= preco_max_centavos)
        if filtros.tem_variacao is not None:
            if filtros.tem_variacao:
                query = query.filter(Receita.receita_pai_id.isnot(None))
            else:
                query = query.filter(Receita.receita_pai_id.is_(None))
    
    return query.offset(skip).limit(limit).all()

def get_receita_by_id(db: Session, receita_id: int) -> Optional[Receita]:
    """Busca receita por ID com relaciomento carregados"""
    return db.query(Receita).options(
        joinedload(Receita.restaurante),
        joinedload(Receita.restaurante),
        joinedload(Receita.receita_pai),
        joinedload(Receita.variacoes),
        joinedload(Receita.receita_insumos).joinedload(ReceitaInsumo.insumo)
    ).filter(Receita.id == receita_id).first()

def get_receita_by_codigo(db: Session, codigo: str, restaurante_id: int) -> Optional[Receita]:
    """Busca receita por codigo dentro de um restaurante"""
    return db.query(Receita).filter(
        and_(
            Receita.codigo == codigo.upper(),
            Receita.restaurante_id == restaurante_id
        )
    ).first()

def update_receita(db: Session, receita_id: int, receita: ReceitaUpdate) -> Optional[Receita]:
    """Atualiza dados de uma receita"""
    db_receita = get_receita_by_id(db, receita_id)
    if not db_receita:
        return None
    
    # Converter preços se fornecidos
    update_data = receita.model_dump(exclude_unset=True)

    if 'preco_venda_real' in update_data:
        if update_data['preco_venda_real'] is not None:
            update_data['preco_venda'] = int(update_data['preco_venda_real'] * 100)
        else:
            update_data['preco_venda'] = None
        del update_data['preco_venda_real']
    
    if 'margem_percentual_real' in update_data:
        if update_data['margem_percentual_real'] is not None:
            update_data['margem_percentual'] = int(update_data['margem_percentual_real'] * 100)
        else:
            update_data['margem_percentual'] = None
        del update_data['margem_percentual_real']

    # Atualizar campos fornecidos
    for field, value in update_data.items():
        setattr(db_receita, field, value)

    db.commit()
    db.refresh(db_receita)
    return db_receita

def delete_receita(db: Session, receita_id: int) -> bool:
    """Remove uma receita e seus insumos associados"""
    db_receita = get_receita_by_id(db, receita_id)
    if not db_receita:
        return False
    
    # Verificar se tem variações (receitas filhas)
    variacoes_count = db.query(Receita).filter(Receita.receita_pai_id == receita_id).count()
    if variacoes_count > 0:
        raise ValueError(f"Não é possivel excluir receita com {variacoes_count} variações")
    
    db.delete(db_receita)
    db.commit()
    return True

def search_receitas(db: Session, termo: str, restaurante_id: Optional[int] = None) -> List[Receita]:
    """
    Busca receitas por termo no nome ou código.
    
    Args:
        db (Session): Sessão do banco de dados
        termo (str): Termo a buscar
        restaurante_id (int, optional): ID do restaurante para filtrar
        
    Returns:
        List[Receita]: Lista de receitas encontradas
    """
    query = db.query(Receita).options(joinedload(Receita.restaurante))

    # Buscar no nome ou código
    search_filter = or_(
        Receita.nome.ilike(f"%{termo}%"),
        Receita.codigo.ilike(f"%{termo}%")
    )
    query = query.filter(search_filter)

    # Filter por restaurante se fornecido
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)

    return query.all()

#   ---------------------------------------------------------------------------------------------------
#   CRUD Receitas - Insumos
#   ---------------------------------------------------------------------------------------------------

def add_insumo_to_receita(
        db: Session,
        receita_id: int,
        receita_insumo: ReceitaInsumoCreate
)  -> ReceitaInsumo:
    """
    Adiciona um insumo a uma receita.
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        receita_insumo (ReceitaInsumoCreate): Dados do insumo a adicionar
        
    Returns:
        ReceitaInsumo: Relacionamento criado
        
    Raises:
        ValueError: Se receita ou insumo não existirem, ou insumo já estiver na receita
    """
    # Verificar se receita existe
    receita = get_receita_by_id(db, receita_id)
    if not receita:
        raise ValueError(f"Receita com ID {receita_id} não existe")
    
    # Verificar se insumo existe
    from app.crud.insumo import get_insumo_by_id
    insumo = get_insumo_by_id(db, receita_insumo.insumo_id)
    if not insumo:
        raise ValueError(f"Insumo com ID {receita_insumo.insumo_id} não existe")
    
    # Verificar se insumo já está na receita
    existing = db.query(ReceitaInsumo).filter(
        and_(
            ReceitaInsumo.receita_id == receita_id,
            ReceitaInsumo.insumo_id == receita_insumo.insumo_id
        )
    ).first()
    if existing:
        raise ValueError(f"Insumo '{insumo.nome}' já está nesta receita")
    
    # Criar relacionamento
    db_receita_insumo = ReceitaInsumo(
        receita_id=receita_id,
        insumo_id=receita_insumo.insumo_id,
        quantidade_necessaria=receita_insumo.quantidade_necessaria,
        unidade_medida=receita_insumo.unidade_medida,
        observacoes=receita_insumo.observacoes
    )

    db.add(db_receita_insumo)
    db.commit()
    db.refresh(db_receita_insumo)

    # Calcular custo deste insumo
    db_receita_insumo.calcular_custo(db)

    # Atualizar CMV total da receita
    receita.atualizar_cmv(db)

    return db_receita_insumo

def update_insumo_in_receita(
        db: Session,
        receita_insumo_id: int,
        receita_insumo_update: ReceitaInsumoUpdate
)  -> Optional[ReceitaInsumo]:
    """Atualiza quantidade ou dados de um insumo na receita"""
    db_receita_insumo = db.query(ReceitaInsumo).filter(
        ReceitaInsumo.id == receita_insumo_id
    ).first()

    if not db_receita_insumo:
        return None
    
    # Atulizar campos fornecidos
    for field, value in receita_insumo_update.model_dump(exclude_unset=True).items():
        setattr(db_receita_insumo, field, value)

    db.commit()
    db.refresh(db_receita_insumo)

    # Recalcular custo
    db_receita_insumo.calcular_custo(db)

    # Atualizar CMV da receita
    receita = get_receita_by_id(db, db_receita_insumo.receita_id)
    if receita:
        receita.atualizar_cmv(db)

    return db_receita_insumo

def remove_insumo_from_receita(db: Session, receita_insumo_id: int) -> bool:
    """Remove um insumo de uma receita"""
    db_receita_insumo = db.query(ReceitaInsumo).filter(
        ReceitaInsumo.id == receita_insumo_id
    ).first()

    if not db_receita_insumo:
        return False
    
    receita_id = db_receita_insumo.receita_id

    db.delete(db_receita_insumo)
    db.commit()

    # Atualizar CMV da receita
    receita = get_receita_by_id(db, receita_id)
    if receita:
        receita.atualizar_cmv(db)

    return True

def get_receita_insumo(db: Session, receita_id: int) -> List[ReceitaInsumo]:
    """Lista todos os insumos de uma receita"""
    return db.query(ReceitaInsumo).options(
        joinedload(ReceitaInsumo.insumo)
    ).filter(ReceitaInsumo.receita_id == receita_id).all()


#   ---------------------------------------------------------------------------------------------------
#   Funções de calculo
#   ---------------------------------------------------------------------------------------------------

def calcular_cmv_receita(db: Session, receita_id: int) -> float:
    """
    Recalcula o CMV de uma receita baseado nos insumos.
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        
    Returns:
        float: CMV total em reais
    """
    receita = get_receita_by_id(db, receita_id)
    if not receita:
        return 0.0
    
    # Recalcular custos de todos os insumos
    for receita_insumo in receita.receita_insumo:
        receita_insumo.calcular_custo(db)

    # Atualizar CMV da receita
    receita.atualizar_cmv(db)

    return receita.cmv_real

def calcular_precos_sugeridos(db: Session, receita_id: int) -> dict:
    """
    Calcula preços sugeridos para uma receita baseado no CMV atual.
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        
    Returns:
        dict: Dicionário com preços sugeridos e CMV atual
    """
    receita = get_receita_by_id(db, receita_id)
    if not receita:
        return {"erro": "Receita não encontrada"}
    
    # Garantir que CMV está atualizado
    calcular_cmv_receita(db, receita_id)

    # Calcular preços sugeridos
    precos_sugeridos = receita.calcular_precos_sugeridos()

    return {
        "receita_id": receita_id,
        "cmv_atual": receita.cmv_real,
        "precos_sugeridos": precos_sugeridos
    }

#   ---------------------------------------------------------------------------------------------------
#   Funções Utilitarias
#   ---------------------------------------------------------------------------------------------------

def ge_grupos_receitas(db: Session, restaurante_id: Optional[int] = None) -> List[str]:
    """Lista grupos unicos de receitas"""
    query = db.query(Receita.grupo).distinct()
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)
    return [grupo[0] for grupo in query.order_by(Receita.grupo).all()]

def get_subgrupos_receitas(db: Session, grupo: str, restaurante_id: Optional[int] = None) -> List[str]:
    """LIsta subgrupos unicos de um grupo espeficico"""
    query = db.query(Receita.subgrupo).filter(Receita.grupo == grupo).distinct()
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)

    total_receitas = query.count()
    total_ativas = query.filter(Receita.ativo == True).count()
    total_grupos = query.with_entities(Receita.grupo).distinct().count()

    # Estatisticas de precos (apenas receitas com preços)
    precos_query = query.filter(Receita.preco_venda.isnot(None))
    precos = [r.preco_venda for r in precos_query.all()]

    preco_stats = {}
    if precos:
        preco_stats = {
            "preco_medio": round(sum(precos) /len(precos) / 100, 2),
            "preco_minimo": round(min(precos) / 100, 2),
            "preco_maximo": round(max(precos) / 100, 2),
        }

    return {
        "total_receitas": total_receitas,
        "total_ativas": total_ativas,
        "total_grupos": total_grupos,
        "com_preco": len(precos),
        **preco_stats
    }
