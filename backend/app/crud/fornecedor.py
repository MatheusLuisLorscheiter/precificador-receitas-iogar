# ============================================================================
# CRUD FORNECEDOR - Operações de banco de dados para fornecedores
# ============================================================================
# Descrição: Implementa todas as operações CRUD (Create, Read, Update, Delete)
# para fornecedores no banco de dados PostgreSQL
# Data: 27/08/2025  | Atualizado 03/09/2025 
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from app.models.fornecedor import Fornecedor
from app.schemas.fornecedor import FornecedorCreate, FornecedorUpdate

# ============================================================================
# OPERAÇÕES DE CONSULTA (READ)
# ============================================================================

def get_fornecedor_by_id(db: Session, fornecedor_id: int) -> Optional[Fornecedor]:
    """
    Busca um fornecedor específico pelo ID.
    
    Inclui automaticamente os insumos relacionados através do relacionamento
    SQLAlchemy definido no modelo.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor a ser buscado
        
    Returns:
        Optional[Fornecedor]: Fornecedor encontrado ou None se não existir
    """
    return db.query(Fornecedor).filter(Fornecedor.id == fornecedor_id).first()

def get_fornecedor_by_cpf_cnpj(db: Session, cpf_cnpj: str) -> Optional[Fornecedor]:
    """
    Busca um fornecedor pelo CPF ou CNPJ.
    
    Útil para validar se já existe um fornecedor com o mesmo documento
    antes de criar um novo registro.
    
    Args:
        db (Session): Sessão do banco de dados
        cpf_cnpj (str): CPF ou CNPJ a ser buscado (apenas números)
        
    Returns:
        Optional[Fornecedor]: Fornecedor encontrado ou None se não existir
    """ 
    return db.query(Fornecedor).filter(Fornecedor.cpf_cnpj == cpf_cnpj).first()

def get_fornecedores(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    busca: Optional[str] = None
) -> List[Fornecedor]:
    """
    Lista fornecedores com paginação e busca opcional.
    
    A busca procura pelo termo em:
    - Nome/Razão Social
    - CNPJ
    - Cidade
    - Ramo de atividade
    
    Args:
        db (Session): Sessão do banco de dados
        skip (int): Número de registros a pular (para paginação)
        limit (int): Número máximo de registros a retornar
        busca (Optional[str]): Termo de busca opcional
        
    Returns:
        List[Fornecedor]: Lista de fornecedores encontrados
    """
    query = db.query(Fornecedor)

    # Aplica filtro de busca se fornecido
    if busca:
        # Remove espaços e converte para minúsculas para busca mais flexível
        termo_busca = f"%{busca.strip().lower()}%"

        query = query.filter(
            or_(
                Fornecedor.nome_razao_social.ilike(termo_busca),
                Fornecedor.cpf_cnpj.ilike(termo_busca),
                Fornecedor.cidade.ilike(termo_busca),
                Fornecedor.ramo.ilike(termo_busca)
            )
        )
    # Ordena por nome e aplica paginação
    return query.order_by(Fornecedor.nome_razao_social).offset(skip).limit(limit).all()

def count_fornecedores(db: Session, busca: Optional[str] = None) -> int:
    """
    Conta o total de fornecedores (para paginação).
    
    Aplica o mesmo filtro de busca da função get_fornecedores()
    para manter consistência na paginação.
    
    Args:
        db (Session): Sessão do banco de dados
        busca (Optional[str]): Termo de busca opcional
        
    Returns:
        int: Número total de fornecedores encontrados
    """
    query = db.query(Fornecedor)

    # Aplica o mesmo filtro de busca
    if busca:
        termo_busca = f"%{busca.strip().Lower()}%"
        query = query.filter(
            or_(
                Fornecedor.nome_razao_social.ilike(termo_busca),
                Fornecedor.cpf_cnpj.ilike(termo_busca),
                Fornecedor.cidade.ilike(termo_busca),
                Fornecedor.ramo.ilike(termo_busca)
            )
        )
    return query.count()

# ============================================================================
# OPERAÇÕES DE CRIAÇÃO (CREATE)
# ============================================================================

def create_fornecedor(db: Session, fornecedor: FornecedorCreate) -> Fornecedor:
    """
    Cria um novo fornecedor no banco de dados.
    
    Antes de criar, valida se já existe um fornecedor com o mesmo CPF/CNPJ.
    O documento deve ser único no sistema.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor (FornecedorCreate): Dados do fornecedor a ser criado
        
    Returns:
        Fornecedor: Fornecedor criado com ID gerado automaticamente
        
    Raises:
        ValueError: Se já existir fornecedor com o mesmo CPF/CNPJ
    """
    # Verifica se já existe fornecedor com o mesmo CPF/CNPJ
    fornecedor_existente = get_fornecedor_by_cpf_cnpj(db, fornecedor.cpf_cnpj)
    if fornecedor_existente:
        raise ValueError(f"Já existe um fornecedor com este documento: {fornecedor.cpf_cnpj}")
    
    
    # Cria o novo registro no banco
    db_fornecedor = Fornecedor(
        nome_razao_social=fornecedor.nome_razao_social,
        cpf_cnpj=fornecedor.cpf_cnpj,
        telefone=fornecedor.telefone,
        ramo=fornecedor.ramo,
        cidade=fornecedor.cidade,
        estado=fornecedor.estado
    )

    # Salva no banco de dados
    db.add(db_fornecedor)
    db.commit()
    db.refresh(db_fornecedor) # Atualiza o objeto com dados do banco (ID, timestamps)

    return db_fornecedor

# ============================================================================
# OPERAÇÕES DE ATUALIZAÇÃO (UPDATE)
# ============================================================================

def update_fornecedor(
        db: Session,
        fornecedor_id: int,
        fornecedor_update: FornecedorUpdate
) -> Optional[Fornecedor]:
    """
    Atualiza um fornecedor existente.
    
    Permite atualização parcial - apenas os campos fornecidos serão atualizados.
    CPF/CNPJ não pode ser alterado após a criação por questões de segurança.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor a ser atualizado
        fornecedor_update (FornecedorUpdate): Dados a serem atualizados
        
    Returns:
        Optional[Fornecedor]: Fornecedor atualizado ou None se não encontrado
    """
    # Busca o fornecedor existente
    db_fornecedor = get_fornecedor_by_id(db, fornecedor_id)
    if not db_fornecedor:
        return None
        
    # Atualiza apenas os campos fornecidos (aualização parcial)
    update_data = fornecedor_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_fornecedor, field, value)

    # Salva as alterações
    db.commit()
    db.refresh(db_fornecedor)

    return db_fornecedor

# ============================================================================
# OPERAÇÕES DE EXCLUSÃO (DELETE)
# ============================================================================

def delete_fornecedor(db: Session, fornecedor_id: int) -> bool:
    """
    Exclui um fornecedor do banco de dados.
    
    ATENÇÃO: Esta operação também remove todos os insumos relacionados
    devido à configuração cascade="all, delete-orphan" no relacionamento.
    
    Args:
        db (Session): Sessão do banco de dados
        fornecedor_id (int): ID do fornecedor a ser excluído
        
    Returns:
        bool: True se foi excluído, False se não foi encontrado
    """
    db_fornecedor = get_fornecedor_by_id(db, fornecedor_id)
    if not db_fornecedor:
        return False
    
    # Exclui o fornecedor (e insumos relacionados por cascade)
    db.delete(db_fornecedor)
    db.commit()

    return True

# ============================================================================
# OPERAÇÕES AUXILIARES
# ============================================================================

def  get_fornecedores_por_estado(db: Session, estado: str) -> List[Fornecedor]:
    """
    Busca fornecedores por estado (UF).
    
    Útil para relatórios regionais ou análises geográficas.
    
    Args:
        db (Session): Sessão do banco de dados
        estado (str): UF do estado (ex: "SP", "RJ")
        
    Returns:
        List[Fornecedor]: Lista de fornecedores do estado
    """
    return db.query(Fornecedor).filter(
        Fornecedor.estado.ilike(estado.upper())
    ).order_by(Fornecedor.nome_razao_social).all()

def get_fornecedores_por_ramo(db: Session, ramo: str) -> List[Fornecedor]:
    """
    Busca fornecedores por ramo de atividade.
    
    Útil para encontrar fornecedores especializados em determinado segmento.
    
    Args:
        db (Session): Sessão do banco de dados
        ramo (str): Ramo de atividade a buscar
        
    Returns:
        List[Fornecedor]: Lista de fornecedores do ramo
    """
    return db.query(Fornecedor).filter(
        Fornecedor.ramo.ilike(f"%{ramo}%")
    ).order_by(Fornecedor.nome_razao_social).all()