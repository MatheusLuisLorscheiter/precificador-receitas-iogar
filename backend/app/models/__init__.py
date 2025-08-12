#   ---------------------------------------------------------------------------------------------------
#   Inicialização dos modelos -  Importa todos os modelos do sistema
#   Este arquivo importa todos os modelos para que o SQLAlchemy e 
#   Alembic possam detectá-los automaticamente para migrações.
#   Data: 08/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

# Importar Base primeiro
from .base import Base, BaseModel

# Depois importar os outros modelos
from .insumo import Insumo
# from .receita import Receita
# from .receita_insumo import ReceitaInsumo

__all__ = ["Base", "BaseModel", "Insumo"]
#   ---------------------------------------------------------------------------------------------------
#   Estrutura do banco de dados
#   ---------------------------------------------------------------------------------------------------

"""
TABELAS CRIADAS:

1. INSUMOS
   - Ingredientes/matérias-primas vindos do TOTVS
   - Campos: grupo, subgrupo, codigo, nome, quantidade, fator, unidade, preco_compra

2. RECEITAS  
   - Produtos finais/pratos vendidos
   - Campos: grupo, subgrupo, codigo, nome, preco_venda, cmv
   - Sistema de variações (receita_pai_id, variacao_nome)

3. RECEITA_INSUMOS
   - Relacionamento Many-to-Many entre receitas e insumos
   - Define quais ingredientes e quantidades cada receita usa
   - Usado para calcular CMV automaticamente

RELACIONAMENTOS:
- Receita 1:N ReceitaInsumo N:1 Insumo
- Receita 1:N Receita (para variações)
"""