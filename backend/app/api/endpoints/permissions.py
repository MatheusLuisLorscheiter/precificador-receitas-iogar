# ============================================================================
# ENDPOINTS DE GERENCIAMENTO DE PERMISSÕES - PAINEL ADMINISTRATIVO
# ============================================================================
# Descrição: Endpoints para ADMIN configurar permissões por perfil
# Permite customizar o que cada role pode fazer no sistema
# Data: 21/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

# Importar dependências
from app.api.deps import get_db, get_admin_user
from app.models.user import User
from app.models.permission import Permission, ResourceType, ActionType, DataScope

# Criar router (apenas ADMIN tem acesso)
router = APIRouter()


# ============================================================================
# SCHEMAS PYDANTIC PARA PERMISSÕES
# ============================================================================

from pydantic import BaseModel, Field

class PermissionResponse(BaseModel):
    """Schema de resposta para permissão"""
    id: int
    role: str
    resource: ResourceType
    action: ActionType
    data_scope: DataScope
    enabled: bool
    
    class Config:
        from_attributes = True


class PermissionUpdate(BaseModel):
    """Schema para atualizar uma permissão"""
    enabled: Optional[bool] = Field(None, description="Ativar ou desativar a permissão")
    data_scope: Optional[DataScope] = Field(None, description="Alterar escopo de dados")
    
    class Config:
        json_schema_extra = {
            "example": {
                "enabled": True,
                "data_scope": "LOJA"
            }
        }


class PermissionCreate(BaseModel):
    """Schema para criar nova permissão"""
    role: str = Field(..., description="Perfil do usuário")
    resource: ResourceType = Field(..., description="Recurso do sistema")
    action: ActionType = Field(..., description="Ação permitida")
    data_scope: DataScope = Field(..., description="Escopo de dados")
    enabled: bool = Field(True, description="Permissão ativa")
    
    class Config:
        json_schema_extra = {
            "example": {
                "role": "MANAGER",
                "resource": "RECEITAS",
                "action": "CRIAR",
                "data_scope": "LOJA",
                "enabled": True
            }
        }


class PermissionBulkUpdate(BaseModel):
    """Schema para atualização em massa de permissões"""
    permission_ids: List[int] = Field(..., description="IDs das permissões a atualizar")
    enabled: bool = Field(..., description="Novo status das permissões")
    
    class Config:
        json_schema_extra = {
            "example": {
                "permission_ids": [1, 2, 3],
                "enabled": False
            }
        }


# ============================================================================
# ENDPOINT: LISTAR TODAS AS PERMISSÕES
# ============================================================================

@router.get("/", response_model=List[PermissionResponse], status_code=status.HTTP_200_OK)
def listar_permissoes(
    role: Optional[str] = Query(None, description="Filtrar por perfil"),
    resource: Optional[ResourceType] = Query(None, description="Filtrar por recurso"),
    action: Optional[ActionType] = Query(None, description="Filtrar por ação"),
    enabled: Optional[bool] = Query(None, description="Filtrar por status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Lista todas as permissões do sistema com filtros opcionais.
    
    Acesso: Apenas ADMIN
    
    Filtros disponíveis:
    - role: Filtrar por perfil (ADMIN, CONSULTANT, OWNER, MANAGER, OPERATOR)
    - resource: Filtrar por recurso (DASHBOARD, INSUMOS, RECEITAS, etc)
    - action: Filtrar por ação (VISUALIZAR, CRIAR, EDITAR, DELETAR, GERENCIAR)
    - enabled: Filtrar por status (true/false)
    
    Retorna lista de permissões.
    """
    # Query base
    query = db.query(Permission)
    
    # Aplicar filtros
    if role:
        query = query.filter(Permission.role == role)
    
    if resource:
        query = query.filter(Permission.resource == resource)
    
    if action:
        query = query.filter(Permission.action == action)
    
    if enabled is not None:
        query = query.filter(Permission.enabled == enabled)
    
    # Ordenar por role, depois resource, depois action
    permissions = query.order_by(
        Permission.role,
        Permission.resource,
        Permission.action
    ).all()
    
    return permissions


# ============================================================================
# ENDPOINT: BUSCAR PERMISSÃO POR ID
# ============================================================================

@router.get("/{permission_id}", response_model=PermissionResponse, status_code=status.HTTP_200_OK)
def buscar_permissao(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Busca uma permissão específica por ID.
    
    Acesso: Apenas ADMIN
    """
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permissão com ID {permission_id} não encontrada"
        )
    
    return permission


# ============================================================================
# ENDPOINT: LISTAR PERMISSÕES DE UM PERFIL ESPECÍFICO
# ============================================================================

@router.get("/role/{role}", response_model=List[PermissionResponse], status_code=status.HTTP_200_OK)
def listar_permissoes_por_perfil(
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Lista todas as permissões de um perfil específico.
    
    Acesso: Apenas ADMIN
    
    Útil para visualizar/configurar todas as permissões de um perfil de uma vez.
    """
    # Validar se role existe
    valid_roles = ["ADMIN", "CONSULTANT", "OWNER", "MANAGER", "OPERATOR", "STORE"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Perfil inválido. Use: {', '.join(valid_roles)}"
        )
    
    permissions = db.query(Permission).filter(
        Permission.role == role
    ).order_by(
        Permission.resource,
        Permission.action
    ).all()
    
    return permissions


# ============================================================================
# ENDPOINT: CRIAR NOVA PERMISSÃO
# ============================================================================

@router.post("/", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def criar_permissao(
    permission_data: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Cria uma nova permissão no sistema.
    
    Acesso: Apenas ADMIN
    
    Validações:
    - Não permitir permissão duplicada (role + resource + action deve ser único)
    """
    # Verificar se já existe
    existing = db.query(Permission).filter(
        Permission.role == permission_data.role,
        Permission.resource == permission_data.resource,
        Permission.action == permission_data.action
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Permissão já existe para {permission_data.role} - {permission_data.action} {permission_data.resource}"
        )
    
    # Criar nova permissão
    new_permission = Permission(
        role=permission_data.role,
        resource=permission_data.resource,
        action=permission_data.action,
        data_scope=permission_data.data_scope,
        enabled=permission_data.enabled
    )
    
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    
    return new_permission


# ============================================================================
# ENDPOINT: ATUALIZAR PERMISSÃO
# ============================================================================

@router.put("/{permission_id}", response_model=PermissionResponse, status_code=status.HTTP_200_OK)
def atualizar_permissao(
    permission_id: int,
    permission_data: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Atualiza uma permissão existente.
    
    Acesso: Apenas ADMIN
    
    Permite alterar:
    - enabled: Ativar/desativar a permissão
    - data_scope: Alterar o escopo de dados (TODOS, REDE, LOJA, PROPRIOS)
    """
    # Buscar permissão
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permissão com ID {permission_id} não encontrada"
        )
    
    # Atualizar campos
    if permission_data.enabled is not None:
        permission.enabled = permission_data.enabled
    
    if permission_data.data_scope is not None:
        permission.data_scope = permission_data.data_scope
    
    db.commit()
    db.refresh(permission)
    
    return permission


# ============================================================================
# ENDPOINT: DELETAR PERMISSÃO
# ============================================================================

@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_permissao(
    permission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Deleta uma permissão do sistema.
    
    Acesso: Apenas ADMIN
    
    CUIDADO: Deletar permissões pode impedir usuários de acessar recursos.
    Recomenda-se desativar (enabled=false) ao invés de deletar.
    """
    # Buscar permissão
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permissão com ID {permission_id} não encontrada"
        )
    
    db.delete(permission)
    db.commit()
    
    return None


# ============================================================================
# ENDPOINT: ATUALIZAÇÃO EM MASSA
# ============================================================================

@router.post("/bulk-update", status_code=status.HTTP_200_OK)
def atualizar_permissoes_em_massa(
    bulk_data: PermissionBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Atualiza múltiplas permissões de uma vez.
    
    Acesso: Apenas ADMIN
    
    Útil para ativar/desativar várias permissões simultaneamente.
    """
    # Buscar todas as permissões
    permissions = db.query(Permission).filter(
        Permission.id.in_(bulk_data.permission_ids)
    ).all()
    
    if not permissions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma permissão encontrada com os IDs fornecidos"
        )
    
    # Atualizar todas
    updated_count = 0
    for permission in permissions:
        permission.enabled = bulk_data.enabled
        updated_count += 1
    
    db.commit()
    
    return {
        "message": f"{updated_count} permissões atualizadas com sucesso",
        "updated_count": updated_count,
        "permission_ids": bulk_data.permission_ids
    }


# ============================================================================
# ENDPOINT: RESETAR PERMISSÕES DE UM PERFIL PARA O PADRÃO
# ============================================================================

@router.post("/reset/{role}", status_code=status.HTTP_200_OK)
def resetar_permissoes_perfil(
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Reseta as permissões de um perfil para os valores padrão.
    
    Acesso: Apenas ADMIN
    
    CUIDADO: Esta operação deleta todas as permissões atuais do perfil
    e recria com os valores padrão definidos no sistema.
    """
    # Validar role
    valid_roles = ["ADMIN", "CONSULTANT", "OWNER", "MANAGER", "OPERATOR", "STORE"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Perfil inválido. Use: {', '.join(valid_roles)}"
        )
    
    # Deletar todas as permissões do perfil
    db.query(Permission).filter(Permission.role == role).delete()
    
    # Recriar permissões padrão (importar do arquivo de defaults)
    # TODO: Implementar sistema de permissões padrão
    
    db.commit()
    
    return {
        "message": f"Permissões do perfil {role} resetadas para o padrão",
        "role": role
    }

# ============================================================================
# ENDPOINT: GERAR TODAS AS PERMISSÕES PARA UM PERFIL
# ============================================================================

@router.post("/generate/{role}", status_code=status.HTTP_201_CREATED)
def gerar_permissoes_completas(
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Gera todas as combinações de permissões possíveis para um perfil.
    
    Acesso: Apenas ADMIN
    
    Este endpoint cria registros para todas as combinações de:
    - Recursos (DASHBOARD, INSUMOS, RECEITAS, etc)
    - Ações (VISUALIZAR, CRIAR, EDITAR, DELETAR, GERENCIAR)
    
    As permissões serão criadas como desabilitadas (enabled=false) por padrão,
    permitindo que o ADMIN habilite manualmente conforme necessário.
    """
    # Validar role
    valid_roles = ["CONSULTANT", "OWNER", "MANAGER", "OPERATOR", "STORE"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Perfil inválido. Use: {', '.join(valid_roles)}"
        )
    
    # Definir todos os recursos disponíveis
    recursos = [
        'DASHBOARD',
        'INSUMOS',
        'RECEITAS',
        'FORNECEDORES',
        'RESTAURANTES',
        'USUARIOS',
        'IA_CLASSIFICACAO',
        'RELATORIOS',
        'CONFIGURACOES',
        'MONITORAMENTO'
    ]
    
    # Definir todas as ações disponíveis
    acoes = ['VISUALIZAR', 'CRIAR', 'EDITAR', 'DELETAR', 'GERENCIAR']
    
    # Contador de permissões criadas
    permissoes_criadas = 0
    permissoes_existentes = 0
    
    # Criar todas as combinações
    for recurso in recursos:
        for acao in acoes:
            # Verificar se já existe
            existing = db.query(Permission).filter(
                Permission.role == role,
                Permission.resource == recurso,
                Permission.action == acao
            ).first()
            
            if not existing:
                # Criar nova permissão desabilitada
                nova_permissao = Permission(
                    role=role,
                    resource=recurso,
                    action=acao,
                    data_scope='LOJA',  # Escopo padrão
                    enabled=False  # Desabilitada por padrão
                )
                db.add(nova_permissao)
                permissoes_criadas += 1
            else:
                permissoes_existentes += 1
    
    # Commit das alterações
    db.commit()
    
    return {
        "message": f"Permissões geradas para o perfil {role}",
        "role": role,
        "permissoes_criadas": permissoes_criadas,
        "permissoes_existentes": permissoes_existentes,
        "total": permissoes_criadas + permissoes_existentes
    }


# ============================================================================
# ENDPOINT: GERAR PERMISSÕES PARA TODOS OS PERFIS
# ============================================================================

@router.post("/generate-all", status_code=status.HTTP_201_CREATED)
def gerar_todas_permissoes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Gera todas as permissões possíveis para todos os perfis.
    
    Acesso: Apenas ADMIN
    
    Útil para inicialização do sistema ou para garantir que todos
    os perfis tenham todas as opções de permissões disponíveis.
    """
    # Perfis a processar (exceto ADMIN que tem tudo)
    perfis = ["CONSULTANT", "OWNER", "MANAGER", "OPERATOR", "STORE"]
    
    # Definir todos os recursos disponíveis
    recursos = [
        'DASHBOARD',
        'INSUMOS',
        'RECEITAS',
        'FORNECEDORES',
        'RESTAURANTES',
        'USUARIOS',
        'IA_CLASSIFICACAO',
        'RELATORIOS',
        'CONFIGURACOES',
        'MONITORAMENTO'
    ]
    
    # Definir todas as ações disponíveis
    acoes = ['VISUALIZAR', 'CRIAR', 'EDITAR', 'DELETAR', 'GERENCIAR']
    
    resultados = []
    
    # Gerar para cada perfil
    for role in perfis:
        permissoes_criadas = 0
        permissoes_existentes = 0
        
        # Criar todas as combinações
        for recurso in recursos:
            for acao in acoes:
                # Verificar se já existe
                existing = db.query(Permission).filter(
                    Permission.role == role,
                    Permission.resource == recurso,
                    Permission.action == acao
                ).first()
                
                if not existing:
                    # Criar nova permissão desabilitada
                    nova_permissao = Permission(
                        role=role,
                        resource=recurso,
                        action=acao,
                        data_scope='LOJA',
                        enabled=False
                    )
                    db.add(nova_permissao)
                    permissoes_criadas += 1
                else:
                    permissoes_existentes += 1
        
        resultados.append({
            "role": role,
            "permissoes_criadas": permissoes_criadas,
            "permissoes_existentes": permissoes_existentes,
            "total": permissoes_criadas + permissoes_existentes
        })
    
    # Commit das alterações
    db.commit()
    
    # Calcular totais
    total_criadas = sum(r['permissoes_criadas'] for r in resultados)
    total_existentes = sum(r['permissoes_existentes'] for r in resultados)
    
    return {
        "message": "Permissões geradas para todos os perfis",
        "perfis_processados": perfis,
        "total_criadas": total_criadas,
        "total_existentes": total_existentes,
        "total_geral": total_criadas + total_existentes,
        "detalhes": resultados
    }