# ============================================================================
# CRUD FORNECEDOR_INSUMO - Operações de banco para catálogo de fornecedores
# ============================================================================
# Descrição: Implementa todas as operações CRUD para insumos do catálogo
# dos fornecedores (tabela fornecedor_insumos)
# Data: 28/08/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Tuple
from app.models.fornecedor_insumo import FornecedorInsumo
from app.schemas.fornecedor_insumo import FornecedorInsumoCreate, FornecedorInsumoUpdate


# ============================================================================
# OPERAÇÕES DE CONSULTA (READ)
# ============================================================================

def get_fornecedor_insumo_by_id(db: Session, insumo_id: int) -> Optional[FornecedorInsumo]:
    """
    Busca um insumo do catálogo pelo ID.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo do catálogo
        
    Returns:
        Optional[FornecedorInsumo]: Insumo encontrado ou None
    """
    return db.query(FornecedorInsumo).filter(FornecedorInsumo.id == insumo_id).first()


def get_fornecedor_insumo_by_codigo(
    db: Session, 
    fornecedor_id: int, 
    codigo: str
) -> Optional[FornecedorInsumo]:
    """
    Busca insumo por código dentro do catálogo de um fornecedor.
    
    Útil para validar códigos únicos por fornecedor.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor
        codigo (str): Código do insumo
        
    Returns:
        Optional[FornecedorInsumo]: Insumo encontrado ou None
    """
    return db.query(FornecedorInsumo).filter(
        and_(
            FornecedorInsumo.fornecedor_id == fornecedor_id,
            FornecedorInsumo.codigo == codigo.upper()
        )
    ).first()


def get_fornecedor_insumos(
    db: Session,
    fornecedor_id: int,
    skip: int = 0,
    limit: int = 100,
    busca: Optional[str] = None
) -> List[FornecedorInsumo]:
    """
    Lista insumos do catálogo de um fornecedor com paginação e busca.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor
        skip (int): Número de registros a pular (paginação)
        limit (int): Máximo de registros por página
        busca (Optional[str]): Termo de busca (código, nome)
        
    Returns:
        List[FornecedorInsumo]: Lista de insumos do catálogo
    """
    query = db.query(FornecedorInsumo).filter(
        FornecedorInsumo.fornecedor_id == fornecedor_id
    )
    
    # Aplicar filtro de busca se fornecido
    if busca and busca.strip():
        termo_busca = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                FornecedorInsumo.codigo.ilike(termo_busca),
                FornecedorInsumo.nome.ilike(termo_busca)
            )
        )
    
    # Ordenar por nome e aplicar paginação
    return query.order_by(FornecedorInsumo.nome).offset(skip).limit(limit).all()


def count_fornecedor_insumos(
    db: Session, 
    fornecedor_id: int,
    busca: Optional[str] = None
) -> int:
    """
    Conta total de insumos no catálogo do fornecedor (para paginação).
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor
        busca (Optional[str]): Termo de busca (se aplicado)
        
    Returns:
        int: Total de insumos
    """
    query = db.query(FornecedorInsumo).filter(
        FornecedorInsumo.fornecedor_id == fornecedor_id
    )
    
    if busca and busca.strip():
        termo_busca = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                FornecedorInsumo.codigo.ilike(termo_busca),
                FornecedorInsumo.nome.ilike(termo_busca)
            )
        )
    
    return query.count()


def get_insumos_simples_para_selecao(
    db: Session, 
    fornecedor_id: int,
    termo: Optional[str] = None
) -> List[FornecedorInsumo]:
    """
    Lista insumos simplificados para seleção em formulários.
    
    Usado no formulário de cadastro de insumos do sistema para
    popular dropdown de seleção de insumos do fornecedor.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor
        termo (Optional[str]): Termo para busca/filtro
        
    Returns:
        List[FornecedorInsumo]: Lista simplificada para seleção
    """
    query = db.query(FornecedorInsumo).filter(
        FornecedorInsumo.fornecedor_id == fornecedor_id
    )
    
    if termo and termo.strip():
        termo_busca = f"%{termo.strip()}%"
        query = query.filter(
            or_(
                FornecedorInsumo.codigo.ilike(termo_busca),
                FornecedorInsumo.nome.ilike(termo_busca)
            )
        )
    
    # Limitar a 50 resultados para performance em dropdowns
    return query.order_by(FornecedorInsumo.nome).limit(50).all()


# ============================================================================
# OPERAÇÕES DE CRIAÇÃO (CREATE)
# ============================================================================

def create_fornecedor_insumo(
    db: Session, 
    fornecedor_id: int, 
    insumo: FornecedorInsumoCreate
) -> FornecedorInsumo:
    """
    Cria um novo insumo no catálogo do fornecedor.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor
        insumo (FornecedorInsumoCreate): Dados do insumo a criar
        
    Returns:
        FornecedorInsumo: Insumo criado
        
    Raises:
        ValueError: Se código já existir para este fornecedor
    """
    # Verificar se código já existe para este fornecedor
    insumo_existente = get_fornecedor_insumo_by_codigo(
        db, fornecedor_id, insumo.codigo
    )
    if insumo_existente:
        raise ValueError(f"Código '{insumo.codigo}' já existe para este fornecedor")
    
    # Criar novo insumo
    db_insumo = FornecedorInsumo(
        fornecedor_id=fornecedor_id,
        codigo=insumo.codigo.upper(),
        nome=insumo.nome,
        unidade=insumo.unidade,
        preco_unitario=insumo.preco_unitario,
        descricao=insumo.descricao
    )
    
    # Salvar no banco
    db.add(db_insumo)
    db.commit()
    db.refresh(db_insumo)
    
    return db_insumo


# ============================================================================
# OPERAÇÕES DE ATUALIZAÇÃO (UPDATE)
# ============================================================================

def update_fornecedor_insumo(
    db: Session,
    insumo_id: int,
    insumo_update: FornecedorInsumoUpdate
) -> Optional[FornecedorInsumo]:
    """
    Atualiza um insumo do catálogo do fornecedor.
    
    Permite atualização parcial - apenas os campos fornecidos serão atualizados.
    Valida código duplicado apenas se o código foi alterado.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo a ser atualizado
        insumo_update (FornecedorInsumoUpdate): Dados para atualização
        
    Returns:
        Optional[FornecedorInsumo]: Insumo atualizado ou None se não encontrado
        
    Raises:
        ValueError: Se código alterado já existir para o fornecedor
    """
    # Buscar insumo existente
    db_insumo = get_fornecedor_insumo_by_id(db, insumo_id)
    if not db_insumo:
        return None
    
    # Validar código duplicado se foi alterado
    if insumo_update.codigo and insumo_update.codigo.upper() != db_insumo.codigo:
        insumo_existente = get_fornecedor_insumo_by_codigo(
            db, db_insumo.fornecedor_id, insumo_update.codigo
        )
        if insumo_existente:
            raise ValueError(f"Código '{insumo_update.codigo}' já existe para este fornecedor")
    
    # Atualizar apenas os campos fornecidos
    update_data = insumo_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == 'codigo' and value:
            value = value.upper()  # Padronizar código
        setattr(db_insumo, field, value)
    
    # Salvar alterações
    db.commit()
    db.refresh(db_insumo)
    
    return db_insumo


# ============================================================================
# OPERAÇÕES DE EXCLUSÃO (DELETE)
# ============================================================================

def delete_fornecedor_insumo(db: Session, insumo_id: int) -> bool:
    """
    Exclui um insumo do catálogo do fornecedor.
    
    ATENÇÃO: Esta operação também pode afetar insumos do sistema
    que usam este insumo como referência (SET NULL).
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo a ser excluído
        
    Returns:
        bool: True se foi excluído, False se não foi encontrado
    """
    db_insumo = get_fornecedor_insumo_by_id(db, insumo_id)
    if not db_insumo:
        return False
    
    # Excluir insumo
    db.delete(db_insumo)
    db.commit()
    
    return True


# ============================================================================
# OPERAÇÕES AUXILIARES E ESTATÍSTICAS
# ============================================================================

def get_estatisticas_fornecedor_insumos(db: Session, fornecedor_id: int) -> dict:
    """
    Retorna estatísticas do catálogo de insumos do fornecedor.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor
        
    Returns:
        dict: Estatísticas do catálogo
    """
    total_insumos = db.query(FornecedorInsumo).filter(
        FornecedorInsumo.fornecedor_id == fornecedor_id
    ).count()
    
    # Preço médio dos insumos
    preco_medio = db.query(FornecedorInsumo.preco_unitario).filter(
        FornecedorInsumo.fornecedor_id == fornecedor_id
    ).all()
    
    preco_medio_valor = 0.0
    if preco_medio:
        precos = [float(p[0]) for p in preco_medio]
        preco_medio_valor = sum(precos) / len(precos)
    
    # Insumo mais caro
    insumo_mais_caro = db.query(FornecedorInsumo).filter(
        FornecedorInsumo.fornecedor_id == fornecedor_id
    ).order_by(desc(FornecedorInsumo.preco_unitario)).first()
    
    return {
        'total_insumos': total_insumos,
        'preco_medio': round(preco_medio_valor, 2),
        'insumo_mais_caro': {
            'nome': insumo_mais_caro.nome if insumo_mais_caro else None,
            'preco': float(insumo_mais_caro.preco_unitario) if insumo_mais_caro else 0.0
        }
    }


def buscar_insumos_por_nome_global(
    db: Session, 
    termo: str, 
    limit: int = 20
) -> List[Tuple[FornecedorInsumo, str]]:
    """
    Busca insumos por nome em todos os fornecedores.
    
    Útil para sugestões globais ao cadastrar insumos no sistema.
    
    Args:
        db (Session): Sessão do banco de dados
        termo (str): Termo de busca
        limit (int): Máximo de resultados
        
    Returns:
        List[Tuple[FornecedorInsumo, str]]: Lista com insumo e nome do fornecedor
    """
    if not termo or len(termo.strip()) < 2:
        return []
    
    from app.models.fornecedor import Fornecedor
    
    termo_busca = f"%{termo.strip()}%"
    
    results = db.query(FornecedorInsumo, Fornecedor.nome_razao_social).join(
        Fornecedor, FornecedorInsumo.fornecedor_id == Fornecedor.id
    ).filter(
        or_(
            FornecedorInsumo.nome.ilike(termo_busca),
            FornecedorInsumo.codigo.ilike(termo_busca)
        )
    ).order_by(FornecedorInsumo.nome).limit(limit).all()
    
    return results