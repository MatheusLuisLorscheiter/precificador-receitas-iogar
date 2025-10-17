#   ===================================================================================================
#   Dependencias das APIs - Gerencia conexões e validações
#   Descrição: Este arquivo contém dependências reutilizáveis para as APIs,
#   principalmente para injeção de dependência da sessão do banco de dados
#   Data: 08/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from typing import Generator
from sqlalchemy.orm import Session
from app.database import SessionLocal

def get_db() -> Generator:
    """
    Função geradora que fornece uma sessão do banco de dados.
    Como funciona:
    1. Cria uma nova sessão do banco (SessionLocal)
    2. Yield retorna a sessão para uso na API
    3. Finally garante que a sessão seja fechada após o uso
    
    Uso nas APIs:
    @app.get("/insumos")
    def listar_insumos(db: Session = Depends(get_db)):
        # Usar db aqui
    
    Yields:
        Session: Sessão ativa do banco de dados
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#   ===================================================================================================
#   DEPENDÊNCIAS DE AUTENTICAÇÃO JWT
#   ===================================================================================================

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

# Importar funções de segurança e modelos
from app.core.security import decode_token, verify_token_type
from app.models.user import User, UserRole

# Configurar esquema de segurança Bearer Token
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência que valida o token JWT e retorna o usuário autenticado.
    
    Como funciona:
    1. Extrai o token do header Authorization: Bearer <token>
    2. Decodifica e valida o token JWT
    3. Verifica se é um access_token (não refresh_token)
    4. Busca o usuário no banco de dados
    5. Verifica se o usuário está ativo
    6. Retorna o objeto User completo
    
    Args:
        credentials: Credenciais Bearer extraídas do header
        db: Sessão do banco de dados
    
    Returns:
        User: Objeto do usuário autenticado
    
    Raises:
        HTTPException 401: Token inválido, expirado ou usuário não encontrado
        HTTPException 403: Usuário inativo
    
    Uso nas rotas:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    """
    # Extrair token do header
    token = credentials.credentials
    
    # Decodificar e validar token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se é um access_token (não refresh_token)
    if not verify_token_type(token, "access"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token inválido. Use um access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extrair user_id do payload
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: user_id não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuário no banco de dados
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se usuário está ativo
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Entre em contato com o administrador.",
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependência que garante que o usuário está ativo.
    Alias para get_current_user (validação já inclusa).
    
    Args:
        current_user: Usuário obtido via get_current_user
    
    Returns:
        User: Usuário ativo autenticado
    
    Uso:
        @router.get("/profile")
        def get_profile(user: User = Depends(get_current_active_user)):
            return user.to_dict()
    """
    return current_user


def require_role(*allowed_roles: UserRole):
    """
    Factory de dependência que valida se o usuário tem uma das roles permitidas.
    
    Como funciona:
    1. Recebe lista de roles permitidas
    2. Retorna uma função de dependência
    3. A função verifica se o usuário atual tem role permitida
    4. Levanta exceção 403 se não autorizado
    
    Args:
        *allowed_roles: Roles permitidas (ADMIN, CONSULTANT, STORE)
    
    Returns:
        Função de dependência que valida a role
    
    Raises:
        HTTPException 403: Usuário não tem permissão
    
    Uso:
        @router.get("/admin")
        def admin_only(user: User = Depends(require_role(UserRole.ADMIN))):
            return {"message": "Admin area"}
        
        @router.get("/consultant-or-admin")
        def multi_role(user: User = Depends(require_role(UserRole.ADMIN, UserRole.CONSULTANT))):
            return {"message": "Consultant or Admin area"}
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        """Valida se o usuário tem uma das roles permitidas"""
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permissão negada. Requer uma das roles: {[r.value for r in allowed_roles]}",
            )
        return current_user
    
    return role_checker


def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependência que valida se o usuário é ADMIN.
    Atalho para require_role(UserRole.ADMIN).
    
    Args:
        current_user: Usuário autenticado
    
    Returns:
        User: Usuário com role ADMIN
    
    Raises:
        HTTPException 403: Usuário não é ADMIN
    
    Uso:
        @router.post("/users")
        def create_user(admin: User = Depends(get_admin_user)):
            return {"message": "User created"}
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores",
        )
    return current_user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependência que retorna o usuário autenticado se token fornecido, senão None.
    Útil para rotas que podem funcionar com ou sem autenticação.
    
    Args:
        credentials: Credenciais Bearer (opcional)
        db: Sessão do banco de dados
    
    Returns:
        Optional[User]: Usuário autenticado ou None
    
    Uso:
        @router.get("/public-or-private")
        def flexible_route(user: Optional[User] = Depends(get_current_user_optional)):
            if user:
                return {"message": f"Olá {user.username}"}
            return {"message": "Olá visitante"}
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        
        if not payload or not verify_token_type(token, "access"):
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.ativo:
            return None
        
        return user
    except Exception:
        return None


def filter_by_user_restaurant(
    current_user: User = Depends(get_current_user)
) -> Optional[int]:
    """
    Dependência que retorna o restaurante_id para filtrar queries.
    
    Regras:
    - ADMIN e CONSULTANT: retorna None (veem todos os restaurantes)
    - STORE: retorna o restaurante_id vinculado
    
    Args:
        current_user: Usuário autenticado
    
    Returns:
        Optional[int]: ID do restaurante para filtrar ou None
    
    Uso:
        @router.get("/receitas")
        def list_receitas(
            db: Session = Depends(get_db),
            restaurante_filter: Optional[int] = Depends(filter_by_user_restaurant)
        ):
            query = db.query(Receita)
            if restaurante_filter:
                query = query.filter(Receita.restaurante_id == restaurante_filter)
            return query.all()
    """
    # ADMIN e CONSULTANT veem tudo
    if current_user.role in [UserRole.ADMIN, UserRole.CONSULTANT]:
        return None
    
    # STORE vê apenas seu restaurante
    return current_user.restaurante_id