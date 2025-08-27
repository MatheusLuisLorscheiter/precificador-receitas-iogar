# ============================================================================
# API ENDPOINTS FORNECEDORES - Rotas REST para fornecedores
# ============================================================================
# Descrição: Define todas as rotas da API REST para operações com fornecedores
# Inclui endpoints para CRUD completo + funcionalidades específicas
# Data: 27/08/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Importações internas do projeto
from app.api.deps import get_db
from app.crud import fornecedor as crud_fornecedor
from app.schemas.fornecedor import (
    FornecedorCreate,
    FornecedorUpdate,
    FornecedorResponse,
    FornecedorListResponse
)

# ============================================================================
# CONFIGURAÇÃO DO ROTEADOR
# ============================================================================

# Cria o roteador para agrupar todas as rotas de fornecedores
router = APIRouter()

# ============================================================================
# ENDPOINTS DE CONSULTA (GET)
# ============================================================================

@router.get("/", response_model=FornecedorListResponse)
def listar_fornecedores(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(20, ge=1, le=100, description="Máximo de registros por pégina"),
    busca: Optional[str] = Query(None, description="Termo de busca (nome, CNPJ, cidade, ramo)"),
):
    """
    Lista todos os fornecedores com paginação e busca opcional.
    
    **Funcionalidades:**
    - Paginação com skip/limit
    - Busca por nome, CNPJ, cidade ou ramo
    - Retorna total de registros para paginação no frontend
    - Inclui lista de insumos de cada fornecedor
    
    **Parâmetros de consulta:**
    - `skip`: Registros a pular (padrão: 0)
    - `limit`: Registros por página (padrão: 20, máx: 100)
    - `busca`: Termo para buscar em vários campos
    
    **Exemplo de uso:**
    - GET /fornecedores/ - Lista primeiros 20 fornecedores
    - GET /fornecedores/?skip=20&limit=10 - Próxima página com 10 itens
    - GET /fornecedores/?busca=distribuidora - Busca fornecedores com termo "distribuidora"
    """
    try:
        # Busca os fornecedores com os filtros aplicados
        Fornecedores = crud_fornecedor.get_fornecedores(
            db=db,
            skip=skip,
            limit=limit,
            busca=busca
        )

        # Conta o total de registro (para paginação no frontend)
        total = crud_fornecedor.count_fornecedores(db=db, busca=busca)

        # Calcula a página atual baseado no skip/limit
        pagina_atual = (skip // limit) + 1

        return FornecedorListResponse(
            fornecedores=fornecedores,
            total=total,
            pagina=pagina_atual,
            por_pagina=limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )
    
@router.get("/{fornecedor_id}", response_model=FornecedorResponse)
def obter_fornecedor(
    fornecedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Busca um fornecedor específico pelo ID.
    
    **Funcionalidades:**
    - Retorna dados completos do fornecedor
    - Inclui lista de todos os insumos deste fornecedor
    - Usado para exibir detalhes na tela de fornecedores
    
    **Parâmetros:**
    - `fornecedor_id`: ID único do fornecedor
    
    **Respostas:**
    - 200: Fornecedor encontrado
    - 404: Fornecedor não encontrado
    """
    # Busca o fornecedor no banco de dados
    fornecedor = crud_fornecedor.get_fornecedor_by_id(db=db, fornecedor_id=fornecedor_id)

    if not fornecedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Forncedor com ID {fornecedor_id} não foi encontrado"
        )
    
    return fornecedor

# ============================================================================
# CONTINUAR AQUI
# ============================================================================