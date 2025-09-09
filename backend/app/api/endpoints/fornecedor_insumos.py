# ============================================================================
# API ENDPOINTS FORNECEDOR_INSUMOS - Rotas para catálogo de fornecedores
# ============================================================================
# Descrição: Define todas as rotas da API REST para insumos do catálogo
# dos fornecedores (operações CRUD + funcionalidades específicas)
# Data: 28/08/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Importações internas do projeto
from app.api.deps import get_db
from app.crud import fornecedor_insumo as crud_fornecedor_insumo
from app.crud import fornecedor as crud_fornecedor
from app.schemas.fornecedor_insumo import (
    FornecedorInsumoCreate,
    FornecedorInsumoUpdate,
    FornecedorInsumoResponse,
    FornecedorInsumoListResponse,
    FornecedorInsumoSimples
)

# ============================================================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================================================

# Roteador para agrupar todas as rotas de insumos de fornecedores
router = APIRouter()

# ============================================================================
# ENDPOINTS DE CONSULTA (GET)
# ============================================================================

@router.get("/fornecedores/{fornecedor_id}/insumos/", response_model=FornecedorInsumoListResponse)
def listar_insumos_do_fornecedor(
    fornecedor_id: int,
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(20, ge=1, le=100, description="Máximo de registros por página"),
    busca: Optional[str] = Query(None, description="Termo de busca (código, nome)"),
    db: Session = Depends(get_db)
):
    """
    Lista insumos do catálogo de um fornecedor com paginação e busca.
    
    **Funcionalidades:**
    - Lista todos os insumos oferecidos pelo fornecedor
    - Busca por código ou nome do insumo
    - Paginação para performance
    - Ordenação alfabética por nome
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    - `skip`: Registros a pular (paginação)
    - `limit`: Máximo por página (1-100)
    - `busca`: Termo de busca opcional
    
    **Retorna:**
    - Lista paginada de insumos do catálogo
    - Total de insumos encontrados
    - Metadados de paginação
    """
    # Verificar se fornecedor existe
    fornecedor = crud_fornecedor.get_fornecedor_by_id(db, fornecedor_id)
    if not fornecedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fornecedor com ID {fornecedor_id} não encontrado"
        )
    
    # Buscar insumos do catálogo
    insumos = crud_fornecedor_insumo.get_fornecedor_insumos(
        db=db,
        fornecedor_id=fornecedor_id,
        skip=skip,
        limit=limit,
        busca=busca
    )
    
    # Contar total para paginação
    total = crud_fornecedor_insumo.count_fornecedor_insumos(
        db=db,
        fornecedor_id=fornecedor_id,
        busca=busca
    )
    
    return FornecedorInsumoListResponse(
        insumos=insumos,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/fornecedores/{fornecedor_id}/insumos/{insumo_id}", response_model=FornecedorInsumoResponse)
def obter_insumo_do_fornecedor(
    fornecedor_id: int,
    insumo_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtém detalhes de um insumo específico do catálogo do fornecedor.
    
    **Funcionalidades:**
    - Retorna dados completos do insumo
    - Valida se insumo pertence ao fornecedor
    - Inclui código completo formatado
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    - `insumo_id`: ID do insumo no catálogo
    
    **Respostas:**
    - 200: Dados do insumo
    - 404: Insumo ou fornecedor não encontrado
    """
    # Buscar insumo
    insumo = crud_fornecedor_insumo.get_fornecedor_insumo_by_id(db, insumo_id)
    
    if not insumo or insumo.fornecedor_id != fornecedor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo {insumo_id} não encontrado no catálogo do fornecedor {fornecedor_id}"
        )
    
    return insumo


@router.get("/fornecedores/{fornecedor_id}/insumos/selecao/", response_model=List[FornecedorInsumoSimples])
def listar_insumos_para_selecao(
    fornecedor_id: int,
    termo: Optional[str] = Query(None, description="Termo para filtrar insumos"),
    db: Session = Depends(get_db)
):
    """
    Lista insumos simplificados do fornecedor para seleção em formulários.
    
    **Uso específico:**
    - Usado no formulário de cadastro de insumos do sistema
    - Para popular dropdown de seleção
    - Retorna apenas campos essenciais
    - Limitado a 50 resultados para performance
    
    **Funcionalidades:**
    - Lista simplificada (id, código, nome, unidade, preço)
    - Filtro opcional por termo
    - Ordenação alfabética
    - Performance otimizada
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    - `termo`: Filtro opcional por código/nome
    """
    # Verificar se fornecedor existe
    fornecedor = crud_fornecedor.get_fornecedor_by_id(db, fornecedor_id)
    if not fornecedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fornecedor com ID {fornecedor_id} não encontrado"
        )
    
    # Buscar insumos para seleção
    insumos = crud_fornecedor_insumo.get_insumos_simples_para_selecao(
        db=db,
        fornecedor_id=fornecedor_id,
        termo=termo
    )
    
    return insumos


# ============================================================================
# ENDPOINTS DE CRIAÇÃO (POST)
# ============================================================================

@router.post("/fornecedores/{fornecedor_id}/insumos/", response_model=FornecedorInsumoResponse, status_code=status.HTTP_201_CREATED)
def criar_insumo_no_catalogo(
    fornecedor_id: int,
    insumo: FornecedorInsumoCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo insumo no catálogo do fornecedor.
    
    **Funcionalidades:**
    - Adiciona insumo ao catálogo do fornecedor
    - Valida código único por fornecedor
    - Padroniza código (maiúsculo) e nome (title case)
    - Valida preço, unidade e outros campos
    
    **Validações automáticas:**
    - Fornecedor deve existir
    - Código único por fornecedor
    - Preço maior que zero
    - Unidade válida
    - Nome não vazio
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    - `insumo`: Dados do insumo a criar
    
    **Respostas:**
    - 201: Insumo criado com sucesso
    - 400: Dados inválidos ou código duplicado
    - 404: Fornecedor não encontrado
    """
    # Verificar se fornecedor existe
    fornecedor = crud_fornecedor.get_fornecedor_by_id(db, fornecedor_id)
    if not fornecedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fornecedor com ID {fornecedor_id} não encontrado"
        )
    
    try:
        # Criar insumo no catálogo
        db_insumo = crud_fornecedor_insumo.create_fornecedor_insumo(
            db=db,
            fornecedor_id=fornecedor_id,
            insumo=insumo
        )
        return db_insumo
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar insumo: {str(e)}"
        )


# ============================================================================
# ENDPOINTS DE ATUALIZAÇÃO (PUT)
# ============================================================================

@router.put("/fornecedores/{fornecedor_id}/insumos/{insumo_id}", response_model=FornecedorInsumoResponse)
def atualizar_insumo_do_catalogo(
    fornecedor_id: int,
    insumo_id: int,
    insumo_update: FornecedorInsumoUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza um insumo do catálogo do fornecedor.
    
    **Funcionalidades:**
    - Atualização parcial (apenas campos fornecidos)
    - Valida código único se alterado
    - Mantém validações dos schemas
    - Preserva relacionamentos existentes
    - Suporta vinculação com taxonomias hierárquicas
    
    **Validações:**
    - Insumo deve pertencer ao fornecedor
    - Código único por fornecedor (se alterado)
    - Preço maior que zero (se fornecido)
    - Taxonomia deve existir (se fornecida)
    - Outros validadores do schema
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    - `insumo_id`: ID do insumo a atualizar
    - `insumo_update`: Campos a atualizar (parcial, incluindo taxonomia_id)
    
    **Respostas:**
    - 200: Insumo atualizado com sucesso
    - 400: Dados inválidos, código duplicado ou taxonomia inexistente
    - 404: Insumo ou fornecedor não encontrado
    """
    try:
        # Atualizar insumo
        db_insumo = crud_fornecedor_insumo.update_fornecedor_insumo(
            db=db,
            insumo_id=insumo_id,
            insumo_update=insumo_update
        )
        
        if not db_insumo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Insumo {insumo_id} não encontrado"
            )
        
        # Verificar se pertence ao fornecedor
        if db_insumo.fornecedor_id != fornecedor_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Insumo {insumo_id} não pertence ao fornecedor {fornecedor_id}"
            )
        
        return db_insumo
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao atualizar insumo: {str(e)}"
        )


# ============================================================================
# ENDPOINTS DE EXCLUSÃO (DELETE)
# ============================================================================

@router.delete("/fornecedores/{fornecedor_id}/insumos/{insumo_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_insumo_do_catalogo(
    fornecedor_id: int,
    insumo_id: int,
    db: Session = Depends(get_db)
):
    """
    Exclui um insumo do catálogo do fornecedor.
    
    **⚠️ ATENÇÃO:**
    Esta operação pode afetar insumos do sistema que usam este
    insumo como referência (serão marcados como fornecedor anônimo).
    
    **Funcionalidades:**
    - Remove insumo do catálogo
    - Operação irreversível
    - Insumos do sistema ficam órfãos (SET NULL)
    - Retorna 204 se bem-sucedida
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    - `insumo_id`: ID do insumo a excluir
    
    **Respostas:**
    - 204: Insumo excluído com sucesso (sem conteúdo)
    - 404: Insumo não encontrado
    """
    # Buscar insumo para validar se pertence ao fornecedor
    insumo = crud_fornecedor_insumo.get_fornecedor_insumo_by_id(db, insumo_id)
    
    if not insumo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo {insumo_id} não encontrado"
        )
    
    if insumo.fornecedor_id != fornecedor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo {insumo_id} não pertence ao fornecedor {fornecedor_id}"
        )
    
    try:
        # Excluir insumo
        foi_excluido = crud_fornecedor_insumo.delete_fornecedor_insumo(db, insumo_id)
        
        if not foi_excluido:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao excluir insumo do catálogo"
            )
        
        # Retorna 204 (sem conteúdo) para indicar sucesso
        return None
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao excluir insumo: {str(e)}"
        )


# ============================================================================
# ENDPOINTS AUXILIARES E UTILITÁRIOS
# ============================================================================

@router.get("/fornecedores/{fornecedor_id}/insumos/stats/", response_model=dict)
def obter_estatisticas_catalogo(
    fornecedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas do catálogo de insumos do fornecedor.
    
    **Funcionalidades:**
    - Total de insumos no catálogo
    - Preço médio dos insumos
    - Insumo mais caro
    - Útil para dashboards e relatórios
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    
    **Retorna:**
    ```json
    {
        "total_insumos": 150,
        "preco_medio": 25.50,
        "insumo_mais_caro": {
            "nome": "Carne Premium",
            "preco": 89.90
        }
    }
    ```
    """
    # Verificar se fornecedor existe
    fornecedor = crud_fornecedor.get_fornecedor_by_id(db, fornecedor_id)
    if not fornecedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fornecedor com ID {fornecedor_id} não encontrado"
        )
    
    # Obter estatísticas
    stats = crud_fornecedor_insumo.get_estatisticas_fornecedor_insumos(
        db=db,
        fornecedor_id=fornecedor_id
    )
    
    return stats


@router.get("/insumos/busca-global/", response_model=List[dict])
def buscar_insumos_globalmente(
    termo: str = Query(..., min_length=2, description="Termo de busca (mínimo 2 caracteres)"),
    limit: int = Query(20, ge=1, le=50, description="Máximo de resultados"),
    db: Session = Depends(get_db)
):
    """
    Busca insumos por nome em todos os fornecedores.
    
    **Uso específico:**
    - Sugestões globais ao cadastrar insumos no sistema
    - Busca por nome/código em todos os catálogos
    - Retorna insumo + nome do fornecedor
    
    **Funcionalidades:**
    - Busca em todos os fornecedores
    - Filtro por nome ou código
    - Limitado para performance
    - Inclui nome do fornecedor
    
    **Parâmetros:**
    - `termo`: Termo de busca (mínimo 2 caracteres)
    - `limit`: Máximo de resultados (1-50)
    
    **Retorna:**
    ```json
    [
        {
            "insumo": {...dados do insumo...},
            "fornecedor_nome": "Fornecedor ABC Ltda"
        }
    ]
    ```
    """
    try:
        # Buscar insumos globalmente
        resultados = crud_fornecedor_insumo.buscar_insumos_por_nome_global(
            db=db,
            termo=termo,
            limit=limit
        )
        
        # Formatar resposta
        response = []
        for insumo, fornecedor_nome in resultados:
            response.append({
                'insumo': insumo.to_dict(),
                'fornecedor_nome': fornecedor_nome
            })
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na busca global: {str(e)}"
        )