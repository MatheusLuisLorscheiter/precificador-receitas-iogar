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

# ---------------------------------------------------------------------------------------------------
# FUNÇÃO DE CONVERSÃO DE UNIDADES (NOVA)
# ---------------------------------------------------------------------------------------------------

def converter_para_unidade_base(quantidade: float, unidade: str) -> float:
    """
    Converte quantidade para unidade base compatível com o fator do insumo.
    
    Regras de conversão:
    - Para peso: converte tudo para kg (unidade base)
    - Para volume: converte tudo para L (unidade base)  
    - Para unidades: mantém como está
    
    Args:
        quantidade: Quantidade na unidade original
        unidade: Unidade original (g, kg, ml, L, unidade)
        
    Returns:
        float: Quantidade convertida para unidade base
        
    Exemplos:
        - 15g → 0.015kg
        - 10ml → 0.01L
        - 1 unidade → 1 unidade
    """
    conversoes = {
        'g': 0.001,    # g → kg (15g = 0.015kg)
        'kg': 1.0,     # kg → kg (1kg = 1kg)
        'ml': 0.001,   # ml → L (10ml = 0.01L)
        'L': 1.0,      # L → L (1L = 1L)
        'unidade': 1.0 # unidade → unidade (1un = 1un)
    }
    
    fator_conversao = conversoes.get(unidade, 1.0)
    quantidade_convertida = quantidade * fator_conversao
    
    # Arredondar para 6 casas decimais para evitar problemas de precisão
    return round(quantidade_convertida, 6)

# ---------------------------------------------------------------------------------------------------
# CRUD Restaurantes
# ---------------------------------------------------------------------------------------------------

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
        raise ValueError(f"Não é possível excluir restaurante com {receitas_count} receitas")
    
    db.delete(db_restaurante)
    db.commit()
    return True

# ---------------------------------------------------------------------------------------------------
# CRUD Receitas
# ---------------------------------------------------------------------------------------------------

def create_receita(db: Session, receita: ReceitaCreate) -> Receita:
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
        raise ValueError(f"Restaurante com ID {receita.restaurante_id} não existe")
    
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
        cmv=0,  # Será calculado quando adicionar insumos
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
        joinedload(Receita.receita_insumos).joinedload(ReceitaInsumo.insumo)
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
    """Busca receita por ID com relacionamentos carregados"""
    return db.query(Receita).options(
        joinedload(Receita.restaurante),
        joinedload(Receita.receita_pai),
        joinedload(Receita.variacoes),
        joinedload(Receita.receita_insumos).joinedload(ReceitaInsumo.insumo)
    ).filter(Receita.id == receita_id).first()

def get_receita_by_codigo(db: Session, codigo: str, restaurante_id: int) -> Optional[Receita]:
    """Busca receita por código dentro de um restaurante"""
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
        raise ValueError(f"Não é possível excluir receita com {variacoes_count} variações")
    
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

    # Filtrar por restaurante se fornecido
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)

    return query.all()

# ---------------------------------------------------------------------------------------------------
# CRUD Receitas - Insumos (CORRIGIDO COM CONVERSÃO DE UNIDADES)
# ---------------------------------------------------------------------------------------------------

def calcular_custo_insumo(insumo: Insumo, quantidade_necessaria: float, unidade_medida: str) -> float:
    """
    Calcula o custo de um insumo baseado no sistema de conversão por fator com conversão de unidades.
    
    Fórmula: Custo = (Preço de compra ÷ Fator) × Quantidade necessária (convertida)
    
    Exemplos:
    1. Bacon: R$ 50,99 por 1kg (fator 1.0), usar 15g
       - Conversão: 15g = 0.015kg
       - Custo = (50,99 ÷ 1.0) × 0.015 = R$ 0,765
       
    2. Maionese: R$ 7,50 por 750ml (fator 0.75), usar 10ml  
       - Conversão: 10ml = 0.01L
       - Custo = (7,50 ÷ 0.75) × 0.01 = R$ 0,10
       
    3. Pão: R$ 12,50 por caixa (fator 20.0), usar 1 unidade
       - Conversão: 1 unidade = 1 unidade  
       - Custo = (12,50 ÷ 20.0) × 1 = R$ 0,625
    
    Args:
        insumo (Insumo): Insumo com preço e fator
        quantidade_necessaria (float): Quantidade a usar na receita
        unidade_medida (str): Unidade da quantidade (g, kg, ml, L, unidade)
        
    Returns:
        float: Custo calculado em reais
    """
    if not insumo.preco_compra_real or not insumo.fator:
        return 0.0
    
    # Converter quantidade para unidade base compatível com o fator
    quantidade_convertida = converter_para_unidade_base(quantidade_necessaria, unidade_medida)
    
    # Fórmula de conversão corrigida
    custo_unitario = insumo.preco_compra_real / insumo.fator
    custo_total = custo_unitario * quantidade_convertida
    
    # Arredondar para 4 casas decimais para evitar problemas de precisão
    return round(custo_total, 4)

def add_insumo_to_receita(
        db: Session,
        receita_id: int,
        receita_insumo: ReceitaInsumoCreate
) -> ReceitaInsumo:
    """
    Adiciona um insumo a uma receita com cálculo automático de custo.
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        receita_insumo (ReceitaInsumoCreate): Dados do insumo a adicionar
        
    Returns:
        ReceitaInsumo: Relacionamento criado com custo calculado
        
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
    
    # Calcular custo automaticamente com conversão de unidades
    custo_calculado = calcular_custo_insumo(
        insumo, 
        receita_insumo.quantidade_necessaria, 
        receita_insumo.unidade_medida
    )
    
    # Criar relacionamento
    db_receita_insumo = ReceitaInsumo(
        receita_id=receita_id,
        insumo_id=receita_insumo.insumo_id,
        quantidade_necessaria=receita_insumo.quantidade_necessaria,
        unidade_medida=receita_insumo.unidade_medida,
        custo_calculado=custo_calculado,
        observacoes=receita_insumo.observacoes
    )

    db.add(db_receita_insumo)
    db.commit()
    db.refresh(db_receita_insumo)

    # Atualizar CMV total da receita
    calcular_cmv_receita(db, receita_id)

    return db_receita_insumo

def update_insumo_in_receita(
        db: Session,
        receita_insumo_id: int,
        receita_insumo_update: ReceitaInsumoUpdate
) -> Optional[ReceitaInsumo]:
    """Atualiza quantidade ou dados de um insumo na receita"""
    db_receita_insumo = db.query(ReceitaInsumo).options(
        joinedload(ReceitaInsumo.insumo)
    ).filter(ReceitaInsumo.id == receita_insumo_id).first()

    if not db_receita_insumo:
        return None
    
    # Atualizar campos fornecidos
    for field, value in receita_insumo_update.model_dump(exclude_unset=True).items():
        setattr(db_receita_insumo, field, value)

    # Recalcular custo se quantidade ou unidade foi alterada
    update_fields = receita_insumo_update.model_dump(exclude_unset=True)
    if 'quantidade_necessaria' in update_fields or 'unidade_medida' in update_fields:
        custo_recalculado = calcular_custo_insumo(
            db_receita_insumo.insumo, 
            db_receita_insumo.quantidade_necessaria,
            db_receita_insumo.unidade_medida
        )
        db_receita_insumo.custo_calculado = custo_recalculado

    db.commit()
    db.refresh(db_receita_insumo)

    # Atualizar CMV da receita
    calcular_cmv_receita(db, db_receita_insumo.receita_id)

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
    calcular_cmv_receita(db, receita_id)

    return True

def get_receita_insumos(db: Session, receita_id: int) -> List[ReceitaInsumo]:
    """Lista todos os insumos de uma receita"""
    return db.query(ReceitaInsumo).options(
        joinedload(ReceitaInsumo.insumo)
    ).filter(ReceitaInsumo.receita_id == receita_id).all()

# ---------------------------------------------------------------------------------------------------
# Funções de cálculo (MANTIDAS - já corretas)
# ---------------------------------------------------------------------------------------------------

def calcular_cmv_receita(db: Session, receita_id: int) -> float:
    """
    Recalcula o CMV de uma receita baseado nos insumos.
    
    Soma todos os custos calculados dos insumos da receita.
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        
    Returns:
        float: CMV total em reais
    """
    receita = get_receita_by_id(db, receita_id)
    if not receita:
        return 0.0
    
    # Somar custos de todos os insumos
    total_cmv = 0.0
    receita_insumos = get_receita_insumos(db, receita_id)
    
    for receita_insumo in receita_insumos:
        # Recalcular custo do insumo se necessário
        if receita_insumo.insumo:
            custo_recalculado = calcular_custo_insumo(
                receita_insumo.insumo, 
                receita_insumo.quantidade_necessaria,
                receita_insumo.unidade_medida
            )
            # Atualizar custo no relacionamento se mudou
            if abs(custo_recalculado - (receita_insumo.custo_calculado or 0)) > 0.001:
                receita_insumo.custo_calculado = custo_recalculado
                db.add(receita_insumo)
            
            total_cmv += custo_recalculado
    
    # Atualizar CMV na receita (em centavos e reais)
    receita.cmv = int(total_cmv * 100)  # Para compatibilidade
    receita.preco_compra = receita.cmv  # Para compatibilidade
    
    db.add(receita)
    db.commit()
    db.refresh(receita)

    return total_cmv

def calcular_precos_sugeridos(db: Session, receita_id: int) -> dict:
    """
    Calcula preços sugeridos para uma receita baseado no CMV atual.
    
    Fórmula: Preço de venda = CMV ÷ (1 - Margem decimal)
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        
    Returns:
        dict: Dicionário com preços sugeridos e CMV atual
    """
    receita = get_receita_by_id(db, receita_id)
    if not receita:
        return {"error": "Receita não encontrada"}
    
    # Garantir que CMV está atualizado
    cmv_atual = calcular_cmv_receita(db, receita_id)
    
    if cmv_atual <= 0:
        return {
            "receita_id": receita_id,
            "cmv_atual": 0.0,
            "precos_sugeridos": {
                "margem_20": 0.0,
                "margem_25": 0.0,
                "margem_30": 0.0
            }
        }

    # Calcular preços com margem sobre preço de venda
    precos_sugeridos = {
        "margem_20": round(cmv_atual / (1 - 0.20), 2),  # CMV ÷ 0.80
        "margem_25": round(cmv_atual / (1 - 0.25), 2),  # CMV ÷ 0.75
        "margem_30": round(cmv_atual / (1 - 0.30), 2),  # CMV ÷ 0.70
    }

    return {
        "receita_id": receita_id,
        "cmv_atual": cmv_atual,
        "precos_sugeridos": precos_sugeridos
    }

# ---------------------------------------------------------------------------------------------------
# Funções Utilitárias
# ---------------------------------------------------------------------------------------------------

def get_grupos_receitas(db: Session, restaurante_id: Optional[int] = None) -> List[str]:
    """Lista grupos únicos de receitas"""
    query = db.query(Receita.grupo).distinct()
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)
    return [grupo[0] for grupo in query.order_by(Receita.grupo).all()]

def get_subgrupos_receitas(db: Session, grupo: str, restaurante_id: Optional[int] = None) -> List[str]:
    """Lista subgrupos únicos de um grupo específico."""
    query = db.query(Receita.subgrupo).filter(Receita.grupo == grupo).distinct()
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)
    return [subgrupo[0] for subgrupo in query.order_by(Receita.subgrupo).all()]

def get_receitas_stats(db: Session, restaurante_id: Optional[int] = None) -> dict:
    """Retorna estatísticas das receitas."""
    query = db.query(Receita)
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)
    
    total_receitas = query.count()
    total_ativas = query.filter(Receita.ativo == True).count()
    total_grupos = query.with_entities(Receita.grupo).distinct().count()

    # Estatísticas de preços (apenas receitas com preços)
    precos_query = query.filter(Receita.preco_venda.isnot(None))
    precos = [r.preco_venda for r in precos_query.all()]

    preco_stats = {}
    if precos:
        preco_stats = {
            "preco_medio": round(sum(precos) / len(precos) / 100, 2),
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

# ---------------------------------------------------------------------------------------------------
# Função helper para buscar insumos disponíveis
# ---------------------------------------------------------------------------------------------------

def get_insumos_disponiveis(db: Session, termo: Optional[str] = None) -> List[Insumo]:
    """
    Lista insumos disponíveis para adicionar em receitas.
    
    Útil para:
    - Dropdown de seleção de insumos
    - Autocomplete ao adicionar insumos
    - Busca por nome ou código
    
    Args:
        db (Session): Sessão do banco de dados
        termo (str, optional): Termo para buscar por nome ou código
        
    Returns:
        List[Insumo]: Lista de insumos disponíveis
    """
    query = db.query(Insumo)
    
    # Se forneceu termo de busca, filtrar por nome ou código
    if termo:
        search_filter = or_(
            Insumo.nome.ilike(f"%{termo}%"),
            Insumo.codigo.ilike(f"%{termo}%")
        )
        query = query.filter(search_filter)
    
    # Ordenar por nome para facilitar seleção
    return query.order_by(Insumo.nome).all()