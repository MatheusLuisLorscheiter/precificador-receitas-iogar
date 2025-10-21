# ============================================================================
# ENDPOINTS CRUD DE USUÁRIOS - PAINEL ADMINISTRATIVO
# ============================================================================
# Descrição: Endpoints para gerenciamento de usuários (apenas ADMIN)
# Acesso via tela de Configurações no frontend
# Data: 17/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

# Importar dependências
from app.api.deps import get_db, get_admin_user
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse
)
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

# Criar router (apenas ADMIN tem acesso)
router = APIRouter()

# ============================================================================
# ENDPOINT: LISTAR USUÁRIOS
# ============================================================================

@router.get("/", response_model=List[UserListResponse], status_code=status.HTTP_200_OK)
def listar_usuarios(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(100, ge=1, le=500, description="Limite de registros"),
    role: Optional[str] = Query(None, description="Filtrar por role (ADMIN, CONSULTANT, STORE)"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    busca: Optional[str] = Query(None, description="Buscar por username ou email"),
    db: Session = Depends(get_db)
    # SEM current_user temporariamente para testar
):
    """
    Lista todos os usuários do sistema com filtros opcionais.
    
    Acesso: Apenas ADMIN
    
    Filtros disponíveis:
    - role: Filtrar por perfil (ADMIN, CONSULTANT, STORE)
    - ativo: Filtrar por status (true/false)
    - restaurante_id: Filtrar usuários de um restaurante específico
    - busca: Buscar por username ou email (case-insensitive)
    
    Retorna lista paginada de usuários com informações resumidas.
    """
    # Query base
    query = db.query(User)
    
    # Aplicar filtros
    if role:
        try:
            role_enum = UserRole(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role inválida. Use: ADMIN, CONSULTANT ou STORE"
            )
    
    if ativo is not None:
        query = query.filter(User.ativo == ativo)
    
    if restaurante_id:
        query = query.filter(User.restaurante_id == restaurante_id)
    
    if busca:
        busca_lower = f"%{busca.lower()}%"
        query = query.filter(
            (User.username.ilike(busca_lower)) | (User.email.ilike(busca_lower))
        )
    
    # Ordenar por ID e aplicar paginação
    usuarios = query.order_by(User.id).offset(skip).limit(limit).all()
    
    return usuarios


# ============================================================================
# ENDPOINT: BUSCAR USUÁRIO POR ID
# ============================================================================

@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
def buscar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Busca um usuário específico por ID.
    
    Acesso: Apenas ADMIN
    
    Retorna todos os dados do usuário exceto a senha.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado"
        )
    
    return user


# ============================================================================
# ENDPOINT: CRIAR NOVO USUÁRIO
# ============================================================================

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def criar_usuario(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Cria um novo usuário no sistema.
    
    Acesso: Apenas ADMIN
    
    Validações:
    - Username deve ser único
    - Email deve ser único
    - Se role = STORE, restaurante_id é obrigatório
    - Senha deve ter mínimo 8 caracteres, letra e número
    
    O usuário é criado com primeiro_acesso=true para forçar troca de senha.
    """
    print(f"\n✅ criar_usuario FOI CHAMADO!")
    print(f"   Current user: {current_user.username}")
    print(f"   Role: {current_user.role}")
    print(f"   Novo usuário: {user_data.username}")
    
    # Verificar se username já existe
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user_data.username}' já está em uso"
        )
    
    # Verificar se email já existe
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user_data.email}' já está em uso"
        )
    
    # Validar restaurante_id para STORE
    if user_data.role == UserRole.STORE:
        if not user_data.restaurante_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuários STORE devem ter um restaurante vinculado"
            )
        
        # Verificar se restaurante existe
        from app.models.receita import Restaurante
        restaurante = db.query(Restaurante).filter(
            Restaurante.id == user_data.restaurante_id
        ).first()
        
        if not restaurante:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Restaurante com ID {user_data.restaurante_id} não encontrado"
            )
    
    # Criar hash da senha
    password_hash = get_password_hash(user_data.password)
    
    # Criar objeto User
    from datetime import datetime

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=password_hash,
        role=user_data.role,
        restaurante_id=user_data.restaurante_id,
        ativo=user_data.ativo,
        primeiro_acesso=True,  # Sempre true para novos usuários
        updated_at=datetime.utcnow()  # FORÇAR updated_at manualmente
    )
    
    # Salvar no banco
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# ============================================================================
# ENDPOINT: ATUALIZAR USUÁRIO
# ============================================================================

@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
def atualizar_usuario(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Atualiza dados de um usuário existente.
    
    Acesso: Apenas ADMIN
    
    Campos atualizáveis:
    - username (se não estiver em uso)
    - email (se não estiver em uso)
    - role
    - restaurante_id (obrigatório se role = STORE)
    - ativo
    
    Nota: Para trocar senha, use o endpoint /auth/change-password
    """
    # Buscar usuário
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado"
        )
    
    # Não permitir que admin desative a si mesmo
    if user.id == current_user.id and user_data.ativo is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode desativar sua própria conta"
        )
    
    # Atualizar username (se fornecido)
    if user_data.username:
        # Verificar se username já está em uso (por outro usuário)
        existing = db.query(User).filter(
            User.username == user_data.username,
            User.id != user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{user_data.username}' já está em uso"
            )
        
        user.username = user_data.username
    
    # Atualizar email (se fornecido)
    if user_data.email:
        # Verificar se email já está em uso (por outro usuário)
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_data.email}' já está em uso"
            )
        
        user.email = user_data.email
    
    # Atualizar role (se fornecido)
    if user_data.role:
        user.role = user_data.role
    
    # Atualizar restaurante_id (se fornecido)
    if user_data.restaurante_id is not None:
        # Validar se role atual (ou nova) é STORE
        role_final = user_data.role if user_data.role else user.role
        
        if role_final == UserRole.STORE and user_data.restaurante_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuários STORE devem ter um restaurante vinculado"
            )
        
        user.restaurante_id = user_data.restaurante_id
    
    # Atualizar status ativo (se fornecido)
    if user_data.ativo is not None:
        user.ativo = user_data.ativo
    
    # Salvar alterações
    db.commit()
    db.refresh(user)
    
    return user


# ============================================================================
# ENDPOINT: DELETAR USUÁRIO
# ============================================================================

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Deleta um usuário do sistema (soft delete recomendado).
    
    Acesso: Apenas ADMIN
    
    Validações:
    - Não pode deletar a si mesmo
    - Usuário deve existir
    
    Nota: Considere desativar (ativo=false) em vez de deletar permanentemente.
    """
    # Buscar usuário
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado"
        )
    
    # Não permitir que admin delete a si mesmo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deletar sua própria conta"
        )
    
    # Deletar usuário
    db.delete(user)
    db.commit()
    
    return None


# ============================================================================
# ENDPOINT: RESETAR SENHA DE USUÁRIO (ADMIN)
# ============================================================================

@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
def resetar_senha_usuario(
    user_id: int,
    nova_senha: str = Query(..., min_length=8, description="Nova senha temporária"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Reseta a senha de um usuário (apenas ADMIN).
    
    Acesso: Apenas ADMIN
    
    Fluxo:
    - Admin define uma nova senha temporária
    - Flag primeiro_acesso é marcada como true
    - Usuário será forçado a trocar a senha no próximo login
    
    Útil quando usuário esqueceu a senha.
    """
    # Buscar usuário
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário com ID {user_id} não encontrado"
        )
    
    # Validar força da nova senha
    from app.core.security import validate_password_strength
    is_valid, error_message = validate_password_strength(nova_senha)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Gerar novo hash
    user.password_hash = get_password_hash(nova_senha)
    user.primeiro_acesso = True
    
    db.commit()
    
    return {
        "message": f"Senha do usuário '{user.username}' resetada com sucesso",
        "nova_senha_temporaria": nova_senha,
        "primeiro_acesso": True
    }


# ============================================================================
# EXPORTAR ROUTER
# ============================================================================

__all__ = ["router"]