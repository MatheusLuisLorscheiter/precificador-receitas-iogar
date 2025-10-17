# ============================================================================
# MÓDULO DE SEGURANÇA - AUTENTICAÇÃO JWT E CRIPTOGRAFIA
# ============================================================================
# Descrição: Funções para hash de senhas, geração e validação de tokens JWT
# Utiliza bcrypt para senhas e JWT para autenticação stateless
# Data: 17/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# ============================================================================
# CONFIGURAÇÕES DE SEGURANÇA
# ============================================================================

# Chave secreta para assinar os tokens JWT (deve estar no .env)
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE-ME-generate-a-secure-secret-key")

# Algoritmo de criptografia do JWT
ALGORITHM = "HS256"

# Tempo de expiração dos tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token de acesso expira em 30 minutos
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Token de refresh expira em 7 dias

# Contexto para hash de senhas usando bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============================================================================
# FUNÇÕES DE HASH DE SENHA
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha em texto puro corresponde ao hash armazenado.
    
    Args:
        plain_password: Senha em texto puro fornecida pelo usuário
        hashed_password: Hash bcrypt armazenado no banco de dados
    
    Returns:
        bool: True se a senha está correta, False caso contrário
    
    Exemplo:
        >>> verify_password("senha123", "$2b$12$...")
        True
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Gera um hash bcrypt de uma senha em texto puro.
    
    Args:
        password: Senha em texto puro a ser hasheada
    
    Returns:
        str: Hash bcrypt da senha
    
    Exemplo:
        >>> get_password_hash("senha123")
        "$2b$12$abcdefghijklmnopqrstuvwxyz..."
    
    Nota:
        Bcrypt adiciona salt automaticamente, tornando cada hash único
        mesmo para senhas idênticas.
    """
    return pwd_context.hash(password)


# ============================================================================
# FUNÇÕES DE TOKEN JWT
# ============================================================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT de acesso (access token).
    
    Args:
        data: Dicionário com os dados a serem incluídos no token (ex: user_id, role)
        expires_delta: Tempo customizado de expiração (opcional)
    
    Returns:
        str: Token JWT assinado
    
    Exemplo:
        >>> create_access_token({"sub": "1", "role": "ADMIN"})
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    
    Estrutura do token:
        - sub: Subject (user_id)
        - role: Perfil do usuário
        - exp: Timestamp de expiração
        - iat: Timestamp de criação
    """
    to_encode = data.copy()
    
    # Define tempo de expiração
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Adiciona campos padrão do JWT
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    # Codifica e assina o token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Cria um token JWT de refresh (refresh token).
    Usado para renovar o access token sem fazer login novamente.
    
    Args:
        data: Dicionário com os dados a serem incluídos no token (ex: user_id)
    
    Returns:
        str: Refresh token JWT assinado
    
    Exemplo:
        >>> create_refresh_token({"sub": "1"})
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    
    Nota:
        O refresh token tem vida útil maior (7 dias) e deve ser armazenado
        de forma segura no cliente (httpOnly cookie ou localStorage).
    """
    to_encode = data.copy()
    
    # Refresh token expira em 7 dias
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica e valida um token JWT.
    
    Args:
        token: Token JWT a ser decodificado
    
    Returns:
        Dict com os dados do token se válido, None se inválido/expirado
    
    Exemplo:
        >>> decode_token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        {"sub": "1", "role": "ADMIN", "exp": 1234567890, ...}
    
    Validações realizadas:
        - Assinatura do token (verifica se não foi alterado)
        - Tempo de expiração
        - Estrutura do payload
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # Token inválido, expirado ou com assinatura incorreta
        return None


def verify_token_type(token: str, expected_type: str) -> bool:
    """
    Verifica se o token é do tipo esperado (access ou refresh).
    
    Args:
        token: Token JWT a ser verificado
        expected_type: Tipo esperado ("access" ou "refresh")
    
    Returns:
        bool: True se o token é do tipo esperado, False caso contrário
    
    Exemplo:
        >>> verify_token_type(access_token, "access")
        True
        >>> verify_token_type(access_token, "refresh")
        False
    
    Nota:
        Previne uso de refresh token onde deveria ser access token e vice-versa.
    """
    payload = decode_token(token)
    if not payload:
        return False
    
    return payload.get("type") == expected_type


# ============================================================================
# FUNÇÕES AUXILIARES DE VALIDAÇÃO
# ============================================================================

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Valida a força de uma senha segundo critérios de segurança.
    
    Args:
        password: Senha a ser validada
    
    Returns:
        tuple: (is_valid, error_message)
            - is_valid: True se a senha atende aos critérios
            - error_message: Mensagem de erro se inválida, string vazia se válida
    
    Critérios:
        - Mínimo 8 caracteres
        - Pelo menos uma letra
        - Pelo menos um número
    
    Exemplo:
        >>> validate_password_strength("senha123")
        (True, "")
        >>> validate_password_strength("abc")
        (False, "A senha deve ter no mínimo 8 caracteres")
    """
    if len(password) < 8:
        return False, "A senha deve ter no mínimo 8 caracteres"
    
    if not any(char.isalpha() for char in password):
        return False, "A senha deve conter pelo menos uma letra"
    
    if not any(char.isdigit() for char in password):
        return False, "A senha deve conter pelo menos um número"
    
    return True, ""


# ============================================================================
# CONSTANTES EXPORTADAS
# ============================================================================

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "verify_token_type",
    "validate_password_strength",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "REFRESH_TOKEN_EXPIRE_DAYS"
]

