# ============================================================================
# CONFIGURAÇÕES CENTRALIZADAS - FOOD COST SYSTEM
# ============================================================================
# Gerencia todas as variáveis de ambiente e configurações do sistema
# Suporta múltiplos ambientes (development, production)
# ============================================================================

import os
from typing import List

class Settings:
    """
    Configurações da aplicação
    
    Carrega variáveis de ambiente manualmente para evitar problemas com parsing
    """
    
    # Informações do projeto
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Food Cost System")
    VERSION: str = "1.0.0"
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    
    # Ambiente
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Banco de dados
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:IogaRcat_S44@localhost:5432/food_cost_db"
    )
    
    # Segurança JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sua-chave-secreta-desenvolvimento")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    
    # CORS - Origens permitidas
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        """
        Retorna lista de origens permitidas para CORS
        Remove espaços em branco de cada origem
        """
        origins_str = os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:3000"
        )
        return [origin.strip() for origin in origins_str.split(",")]

# Instância global de configurações
settings = Settings()