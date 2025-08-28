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
    db: Session = Depends(get_db)
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
        fornecedores = crud_fornecedor.get_fornecedores(
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

@router.get("/por-estado/{estado}", response_model=List[FornecedorResponse])
def listar_fornecedores_por_estado(
    estado: str,
    db: Session = Depends(get_db)
):
    """
    Lista fornecedores de um estado específico.
    
    **Funcionalidades:**
    - Filtra fornecedores por UF (ex: "SP", "RJ")
    - Útil para relatórios regionais
    - Ordena por nome alfabeticamente
    
    **Parâmetros:**
    - `estado`: Sigla do estado (UF) com 2 caracteres
    
    **Exemplo de uso:**
    - GET /fornecedores/por-estado/SP - Fornecedores de São Paulo
    """
    if len(estado) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado deve ter exatamente 2 caracteres (ex: SP, RJ)"
        )
    fornecedores = crud_fornecedor.get_fornecedores_por_estado(db=db, estado=estado)
    return fornecedores

# ============================================================================
# ENDPOINTS DE CRIAÇÃO (POST)
# ============================================================================

@router.post("/", response_model=FornecedorResponse, status_code=status.HTTP_201_CREATED)
def criar_fornecedor(
    fornecedor: FornecedorCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo fornecedor no sistema.
    
    **Funcionalidades:**
    - Valida dados de entrada (nome e CNPJ obrigatórios)
    - Verifica se CNPJ já existe (deve ser único)
    - Formata e valida CNPJ automaticamente
    - Retorna fornecedor criado com ID gerado
    
    **Campos obrigatórios:**
    - `nome_razao_social`: Nome ou razão social
    - `cnpj`: CNPJ (com ou sem formatação)
    
    **Campos opcionais:**
    - `telefone`, `ramo`, `cidade`, `estado`
    
    **Respostas:**
    - 201: Fornecedor criado com sucesso
    - 400: Dados inválidos ou CNPJ duplicado
    """
    try:
        # Tentea criar o forncedor
        novo_fornecedor = crud_fornecedor.create_fornecedor(db=db, fornecedor=fornecedor)
        return novo_fornecedor
    
    except ValueError as e:
        # Erro de validação (CNPJ cuplicado, etc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Erro interno do servidor
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar fornecedor: {str(e)}"
        )
    
# ============================================================================
# ENDPOINTS DE ATUALIZAÇÃO (PUT)
# ============================================================================

@router.put("/{fornecedor_id}", response_model=FornecedorResponse)
def atualizar_fornecedor(
    fornecedor_id: int,
    fornecedor_update: FornecedorUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza um fornecedor existente.
    
    **Funcionalidades:**
    - Permite atualização parcial (apenas campos fornecidos)
    - Valida CNPJ duplicado se alterado
    - Mantém dados não informados inalterados
    - Atualiza automaticamente timestamp updated_at
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor a ser atualizado
    - Corpo da requisição: Campos a serem atualizados
    
    **Respostas:**
    - 200: Fornecedor atualizado com sucesso
    - 404: Fornecedor não encontrado
    - 400: Dados inválidos ou CNPJ duplicado
    """
    try:
        # Tenta atualizar o fornecedor
        fornecedor_atualizado = crud_fornecedor.update_fornecedor(
            db=db,
            fornecedor_id=fornecedor_id,
            fornecedor_update=fornecedor_update
        )

        if not fornecedor_atualizado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor com ID {fornecedor_id} não foi encontrado"
            )
        
        return fornecedor_atualizado
    
    except ValueError as e:
        # Erro de validação (CNPJ duplicado, etc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Erro interno do servidor
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar fornecedor: {str(e)}"
        )
    
# ============================================================================
# ENDPOINTS DE EXCLUSÃO (DELETE)
# ============================================================================

@router.delete("/{fornecedor_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_fornecedor(
    fornecedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Exclui um fornecedor do sistema.
    
    **⚠️ ATENÇÃO:** Esta operação também remove todos os insumos
    relacionados a este fornecedor devido ao cascade configurado
    no relacionamento.
    
    **Funcionalidades:**
    - Exclui fornecedor e insumos relacionados
    - Operação irreversível
    - Retorna 204 (sem conteúdo) se bem-sucedida
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor a ser excluído
    
    **Respostas:**
    - 204: Fornecedor excluído com sucesso
    - 404: Fornecedor não encontrado
    """
    try:
        # Tenta excluir o fornecedor
        foi_excluido = crud_fornecedor.delete_fornecedor(db=db, fornecedor_id=fornecedor_id)

        if not foi_excluido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor com ID {fornecedor_id} não foi encontrado"
            )
        
        # Retorna 204 (sem conteúdo) para indicar sucesso na exclusão
        return None
    
    except Exception as e:
        # Erro interno do servidor
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir fornecedor: {str(e)}"
        )
    
# ============================================================================
# ENDPOINTS AUXILIARES
# ============================================================================

@router.get("/ramo/{ramo}", response_model=List[FornecedorResponse])
def lisar_fornecedores_por_ramo(
    ramo: str,
    db: Session = Depends(get_db)
):
    """
    Lista fornecedores por ramo de atividade.
    
    **Funcionalidades:**
    - Busca por ramo (busca parcial, case-insensitive)
    - Útil para encontrar fornecedores especializados
    - Ordena por nome alfabeticamente
    
    **Parâmetros:**
    - `ramo`: Ramo de atividade a buscar
    
    **Exemplo de uso:**
    - GET /fornecedores/ramo/alimenticio - Fornecedores do ramo alimentício
    """
    fornecedor = crud_fornecedor.get_fornecedores_por_ramo(db=db, ramo=ramo)
    return FornecedorResponse

@router.get("/{fornecedor_id}/insumos", response_model=List[dict])
def listar_insumo_do_fornecedor(
    fornecedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Lista todos os insumos de um fornecedor específico.
    
    **Funcionalidades:**
    - Retorna apenas os insumos do fornecedor
    - Usado para popular a lista de insumos na tela
    - Inclui preços e informações completas
    
    **Parâmetros:**
    - `fornecedor_id`: ID do fornecedor
    
    **Respostas:**
    - 200: Lista de insumos
    - 404: Fornecedor não encontrado
    """
    # Verifica se o fornecedor existe
    fornecedor = crud_fornecedor.get_fornecedor_by_id(db=db, fornecedor_id=fornecedor_id)

    if not fornecedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fornecedor com ID {fornecedor_id} não foi encontrado"
        )

    # Retorna os insumos do fornecedor
    return fornecedor.insumos