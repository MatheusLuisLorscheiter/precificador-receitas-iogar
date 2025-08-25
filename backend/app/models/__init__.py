#   ===================================================================================================
#   Inicialização dos modelos -  Importa todos os modelos do sistema
#   Descrição: Este arquivo importa todos os modelos para que o SQLAlchemy e 
#   Alembic possam detectá-los automaticamente para migrações.
#   Data: 08/08/2025 | Atualizado 18/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

# Importar Base primeiro
from .base import Base, BaseModel

# Importar modelos de insumos
from .insumo import Insumo

# Importar modelos de receitas
from .receita import Restaurante, Receita, ReceitaInsumo

# Lista de todos os modelos para exportação
__all__ = [
    "Base", 
    "BaseModel", 
    "Insumo",
    "Restaurante",
    "Receita",
    "ReceitaInsumo"
    ]
