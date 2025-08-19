#   ---------------------------------------------------------------------------------------------------
#   CRUD RECEITAS - Operações de banco de dados para receitas
#   Descrição: Este arquivo contém todas as operações de banco de dados para receitas,
#   restaurantes e relacionamentos receita-insumo
#   Data: 14/08/2025 | Atualizado 19/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

from app.models.receita import Receita, Restaurante, ReceitaInsumo
from app.models.insumo import Insumo
from app.schemas.receita import (
    ReceitaCreate, ReceitaUpdate, ReceitaInsumoCreate, ReceitaInsumoUpdate,
    RestauranteCreate, RestauranteUpdate
)

# ---------------------------------------------------------------------------------------------------
# FUNÇÃO DE CONVERSÃO DE UNIDADES (CORRIGIDA COM SISTEMA DE FATOR)
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

def calcular_custo_insumo(insumo: Insumo, quantidade_necessaria: float, unidade_medida: str) -> float:
    """
    Calcula o custo de um insumo na receita baseado no sistema de conversão por fator.
    
    Sistema corrigido:
    - Fator sempre representa a quantidade real do produto
    - 1kg bacon = fator 1.0
    - 750ml maionese = fator 0.75
    - 1 caixa com 20 pães = fator 20.0
    
    Fórmula: Custo = (Preço ÷ Fator) × Quantidade convertida
    
    Args:
        insumo: Objeto do insumo
        quantidade_necessaria: Quantidade necessária na receita
        unidade_medida: Unidade da quantidade (g, kg, ml, L, unidade)
        
    Returns:
        float: Custo calculado em reais
        
    Exemplos:
        - Bacon 1kg (R$50,99, fator=1.0): 15g = (50,99÷1.0) × 0.015kg = R$0,765
        - Maionese 750ml (R$7,50, fator=0.75): 10ml = (7,50÷0.75) × 0.01L = R$0,10
        - Pão caixa 20un (R$12,50, fator=20.0): 1un = (12,50÷20.0) × 1 = R$0,625
    """
    if not insumo or not insumo.preco_compra or insumo.fator <= 0:
        return 0.0
    
    # Converter quantidade para unidade base
    quantidade_convertida = converter_para_unidade_base(quantidade_necessaria, unidade_medida)
    
    # Preço em reais
    preco_reais = insumo.preco_compra / 100.0
    
    # Cálculo: (Preço ÷ Fator) × Quantidade convertida
    custo_calculado = (preco_reais / insumo.fator) * quantidade_convertida
    
    # Arredondar para 6 casas decimais para precisão
    return round(custo_calculado, 6)

# ---------------------------------------------------------------------------------------------------
# CRUD Restaurantes
# ---------------------------------------------------------------------------------------------------

def create_restaurante(db: Session, restaurante: RestauranteCreate) -> Restaurante:
    """Cria um novo restaurante"""
    db_restaurante = Restaurante(**restaurante.model_dump())
    db.add(db_restaurante)
    db.commit()
    db.refresh(db_restaurante)
    return db_restaurante

def get_restaurante_by_id(db: Session, restaurante_id: int) -> Optional[Restaurante]:
    """Busca restaurante por ID"""
    return db.query(Restaurante).filter(Restaurante.id == restaurante_id).first()

def get_restaurantes(db: Session, skip: int = 0, limit: int = 100) -> List[Restaurante]:
    """Lista restaurantes com paginação"""
    return db.query(Restaurante).offset(skip).limit(limit).all()

def update_restaurante(db: Session, restaurante_id: int, restaurante_update: RestauranteUpdate) -> Optional[Restaurante]:
    """Atualiza um restaurante"""
    db_restaurante = get_restaurante_by_id(db, restaurante_id)
    if not db_restaurante:
        return None
    
    for field, value in restaurante_update.model_dump(exclude_unset=True).items():
        setattr(db_restaurante, field, value)
    
    db.commit()
    db.refresh(db_restaurante)
    return db_restaurante

def delete_restaurante(db: Session, restaurante_id: int) -> bool:
    """Deleta um restaurante"""
    db_restaurante = get_restaurante_by_id(db, restaurante_id)
    if not db_restaurante:
        return False
    
    db.delete(db_restaurante)
    db.commit()
    return True

# ---------------------------------------------------------------------------------------------------
# CRUD Receitas
# ---------------------------------------------------------------------------------------------------

def create_receita(db: Session, receita: ReceitaCreate) -> Receita:
    """Cria uma nova receita"""
    # Converter preço de reais para centavos se fornecido
    preco_venda_centavos = None
    if receita.preco_venda_real is not None:
        preco_venda_centavos = int(receita.preco_venda_real * 100)
    
    # Converter margem para centavos se fornecida
    margem_centavos = None
    if receita.margem_percentual_real is not None:
        margem_centavos = int(receita.margem_percentual_real * 100)
    
    db_receita = Receita(
        grupo=receita.grupo,
        subgrupo=receita.subgrupo,
        codigo=receita.codigo.upper(),
        nome=receita.nome,
        quantidade=receita.quantidade,
        fator=receita.fator,
        unidade=receita.unidade,
        preco_compra=0,  # Será calculado automaticamente
        restaurante_id=receita.restaurante_id,
        preco_venda=preco_venda_centavos,
        cmv=0,  # Será calculado automaticamente
        margem_percentual=margem_centavos,
        receita_pai_id=receita.receita_pai_id,
        variacao_nome=receita.variacao_nome,
        descricao=receita.descricao,
        modo_preparo=receita.modo_preparo,
        tempo_preparo_minutos=receita.tempo_preparo_minutos,
        rendimento_porcoes=receita.rendimento_porcoes,
        ativo=receita.ativo
    )

    db.add(db_receita)
    db.commit()
    db.refresh(db_receita)
    return db_receita

def get_receita_by_id(db: Session, receita_id: int) -> Optional[Receita]:
    """Busca receita por ID com relacionamentos"""
    return db.query(Receita).options(
        joinedload(Receita.restaurante),
        joinedload(Receita.receita_insumos).joinedload(ReceitaInsumo.insumo),
        joinedload(Receita.receita_pai),
        joinedload(Receita.variacoes)
    ).filter(Receita.id == receita_id).first()

def get_receitas(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    restaurante_id: Optional[int] = None,
    grupo: Optional[str] = None,
    ativo: Optional[bool] = None
) -> List[Receita]:
    """Lista receitas com filtros opcionais"""
    query = db.query(Receita).options(joinedload(Receita.restaurante))
    
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)
    if grupo:
        query = query.filter(Receita.grupo == grupo)
    if ativo is not None:
        query = query.filter(Receita.ativo == ativo)
    
    return query.offset(skip).limit(limit).all()

def search_receitas(db: Session, termo: str, restaurante_id: Optional[int] = None) -> List[Receita]:
    """Busca receitas por termo (nome ou código)"""
    query = db.query(Receita).options(joinedload(Receita.restaurante))
    
    # Buscar por nome ou código
    search_filter = or_(
        Receita.nome.ilike(f"%{termo}%"),
        Receita.codigo.ilike(f"%{termo}%")
    )
    query = query.filter(search_filter)
    
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)
    
    return query.limit(50).all()

def update_receita(db: Session, receita_id: int, receita_update: ReceitaUpdate) -> Optional[Receita]:
    """Atualiza uma receita"""
    db_receita = get_receita_by_id(db, receita_id)
    if not db_receita:
        return None
    
    # Atualizar campos fornecidos
    update_data = receita_update.model_dump(exclude_unset=True)
    
    # Converter preços se fornecidos
    if 'preco_venda_real' in update_data and update_data['preco_venda_real'] is not None:
        update_data['preco_venda'] = int(update_data['preco_venda_real'] * 100)
        del update_data['preco_venda_real']
    
    if 'margem_percentual_real' in update_data and update_data['margem_percentual_real'] is not None:
        update_data['margem_percentual'] = int(update_data['margem_percentual_real'] * 100)
        del update_data['margem_percentual_real']
    
    for field, value in update_data.items():
        setattr(db_receita, field, value)
    
    db.commit()
    db.refresh(db_receita)
    return db_receita

def delete_receita(db: Session, receita_id: int) -> bool:
    """Deleta uma receita"""
    db_receita = get_receita_by_id(db, receita_id)
    if not db_receita:
        return False
    
    db.delete(db_receita)
    db.commit()
    return True

# ---------------------------------------------------------------------------------------------------
# CRUD Receita-Insumos (COM AUTOMAÇÃO COMPLETA)
# ---------------------------------------------------------------------------------------------------

def add_insumo_to_receita(db: Session, receita_id: int, receita_insumo: ReceitaInsumoCreate) -> ReceitaInsumo:
    """
    Adiciona insumo à receita com cálculo automático de custo.
    
    AUTOMAÇÃO IMPLEMENTADA:
    1. Calcula custo do insumo automaticamente
    2. Salva o relacionamento receita-insumo
    3. Recalcula CMV total da receita automaticamente
    4. Atualiza preços sugeridos automaticamente
    """
    # Verificar se insumo existe
    insumo = db.query(Insumo).filter(Insumo.id == receita_insumo.insumo_id).first()
    if not insumo:
        raise ValueError("Insumo não encontrado")
    
    # Calcular custo automaticamente
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

    # ✅ AUTOMAÇÃO: Atualizar CMV total da receita
    calcular_cmv_receita(db, receita_id)

    return db_receita_insumo

def update_insumo_in_receita(
        db: Session,
        receita_insumo_id: int,
        receita_insumo_update: ReceitaInsumoUpdate
) -> Optional[ReceitaInsumo]:
    """
    Atualiza quantidade ou dados de um insumo na receita.
    
    AUTOMAÇÃO IMPLEMENTADA:
    1. Atualiza dados do relacionamento
    2. Recalcula custo se quantidade mudou
    3. Recalcula CMV total da receita automaticamente
    4. Atualiza preços sugeridos automaticamente
    """
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

    # ✅ AUTOMAÇÃO: Atualizar CMV da receita
    calcular_cmv_receita(db, db_receita_insumo.receita_id)

    return db_receita_insumo

def remove_insumo_from_receita(db: Session, receita_insumo_id: int) -> bool:
    """
    Remove um insumo de uma receita.
    
    AUTOMAÇÃO IMPLEMENTADA:
    1. Remove o relacionamento
    2. Recalcula CMV total da receita automaticamente
    3. Atualiza preços sugeridos automaticamente
    """
    db_receita_insumo = db.query(ReceitaInsumo).filter(
        ReceitaInsumo.id == receita_insumo_id
    ).first()

    if not db_receita_insumo:
        return False
    
    receita_id = db_receita_insumo.receita_id

    db.delete(db_receita_insumo)
    db.commit()

    # ✅ AUTOMAÇÃO: Atualizar CMV da receita
    calcular_cmv_receita(db, receita_id)

    return True

def get_receita_insumos(db: Session, receita_id: int) -> List[ReceitaInsumo]:
    """Lista todos os insumos de uma receita"""
    return db.query(ReceitaInsumo).options(
        joinedload(ReceitaInsumo.insumo)
    ).filter(ReceitaInsumo.receita_id == receita_id).all()

# ---------------------------------------------------------------------------------------------------
# FUNÇÕES DE CÁLCULO (CORRIGIDAS COM SISTEMA DE PREÇOS AUTOMÁTICO)
# ---------------------------------------------------------------------------------------------------

def calcular_cmv_receita(db: Session, receita_id: int) -> float:
    """
    Recalcula o CMV de uma receita baseado nos insumos.
    
    AUTOMAÇÃO IMPLEMENTADA:
    - Soma todos os custos calculados dos insumos da receita
    - Recalcula custos individuais se necessário
    - Atualiza registro da receita automaticamente
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        
    Returns:
        float: Custo total de produção em reais
    """
    receita = get_receita_by_id(db, receita_id)
    if not receita:
        return 0.0
    
    # Somar custos de todos os insumos
    total_custo = 0.0
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
            
            total_custo += custo_recalculado
    
    # Atualizar CMV na receita (em centavos e reais)
    receita.cmv = int(total_custo * 100)  # Para compatibilidade
    receita.preco_compra = receita.cmv  # Para compatibilidade
    
    db.add(receita)
    db.commit()
    db.refresh(receita)

    return total_custo

def calcular_precos_sugeridos(db: Session, receita_id: int) -> dict:
    """
    Calcula preços sugeridos para uma receita baseado no custo de produção atual.
    
    SISTEMA CORRIGIDO:
    - custo_producao = quanto custa para fazer a receita
    - precos_sugeridos = quanto cobrar do cliente para ter lucro
    
    Fórmula: Preço de venda = Custo ÷ (1 - Margem decimal)
    
    Args:
        db (Session): Sessão do banco de dados
        receita_id (int): ID da receita
        
    Returns:
        dict: Dicionário com custo e preços sugeridos formatados conforme schema
    """
    receita = get_receita_by_id(db, receita_id)
    if not receita:
        return {"error": "Receita não encontrada"}
    
    # Garantir que custo está atualizado
    custo_producao = calcular_cmv_receita(db, receita_id)
    
    if custo_producao <= 0:
        return {
            "receita_id": receita_id,
            "custo_producao": 0.0,
            "precos_sugeridos": {
                "margem_20_porcento": 0.0,
                "margem_25_porcento": 0.0,
                "margem_30_porcento": 0.0
            }
        }

    # Calcular preços com margem sobre preço de venda
    # Fórmula: Preço = Custo ÷ (1 - Margem)
    precos_sugeridos = {
        "margem_20_porcento": round(custo_producao / (1 - 0.20), 2),  # Custo ÷ 0.80
        "margem_25_porcento": round(custo_producao / (1 - 0.25), 2),  # Custo ÷ 0.75
        "margem_30_porcento": round(custo_producao / (1 - 0.30), 2),  # Custo ÷ 0.70
    }

    return {
        "receita_id": receita_id,
        "custo_producao": round(custo_producao, 2),
        "precos_sugeridos": precos_sugeridos
    }

# ---------------------------------------------------------------------------------------------------
# Funções Utilitárias
# ---------------------------------------------------------------------------------------------------

def get_insumos_disponiveis(db: Session, termo: Optional[str] = None) -> List[Insumo]:
    """
    Lista insumos disponíveis para adicionar em receitas.
    
    Útil para:
    - Dropdown de seleção de insumos
    - Autocomplete ao adicionar insumos
    """
    query = db.query(Insumo)
    
    if termo:
        search_filter = or_(
            Insumo.nome.ilike(f"%{termo}%"),
            Insumo.codigo.ilike(f"%{termo}%")
        )
        query = query.filter(search_filter)
    
    return query.limit(50).all()

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
    receitas_ativas = query.filter(Receita.ativo == True).count()
    receitas_com_cmv = query.filter(Receita.cmv > 0).count()
    
    return {
        "total_receitas": total_receitas,
        "receitas_ativas": receitas_ativas,
        "receitas_inativas": total_receitas - receitas_ativas,
        "receitas_com_custo": receitas_com_cmv,
        "receitas_sem_custo": total_receitas - receitas_com_cmv
    }