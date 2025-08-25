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
#   Dependências Futuras
#   ===================================================================================================

# def get_current_user():
#     """Validação de usuário logado (implementar futuramente)"""
#     pass

# def get_admin_user():
#     """Validação de usuário admin (implementar futuramente)"""
#     pass