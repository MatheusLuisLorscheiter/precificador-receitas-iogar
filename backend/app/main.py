#   ---------------------------------------------------------------------------------------------------
#   Aplicação Principal FastAPI
#   Descrição: Este é o arquivo principal que configura e inicia a aplicação FastAPI
#   com todas as rotas de insumos e receitas
#   Data: 15/08/2025 (Atualizada)
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar o router completo dos insumos
from app.api.endpoints import insumos, receitas

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação.
    Executa código no startup e shutdown da aplicação.
    """
    # Startup - executa quando aplicação inicia
    print("Food Cost System API iniciada!")
    print("Documentação: http://localhost:8000/docs")
    print("CRUD Insumos: http://localhost:8000/api/v1/insumos")
    print("Crud Receitas: http://localhost:8000/api/v1/receitas")
    print("Crud restaurantes: http://localhost:8000/api/v1/receitas/restaurantes")

    yield #Aqui roda a aplicação

    # Shutdown - executa quando aplicação para
    print("API finalizando...")

# Criar instância do FastAPI com metadados
app = FastAPI(
    title="Food Cost System API",
    description="""
    Sistema de precificação e controle de custos para restaurantes e food service.
    
    ## Funcionalidades principais:
    
    ### Gestão de Insumos
    - CRUD completo de ingredientes/matérias-primas
    - Busca e filtros avançados
    - Controle de preços e unidades
    - Importação de dados do TOTVS (em desenvolvimento)
    
    ### Gestão de Receitas
    - CRUD de receitas por restaurante
    - Composição de receitas com insumos
    - Cálculo automático de CMV (Custo da Mercadoria Vendida)
    - Preços sugeridos com margens de 20%, 25% e 30%
    - Sistema de variações de receitas
    
    ### Gestão de Restaurantes
    - Cadastro de estabelecimentos
    - Organização de receitas por restaurante
    - Controle de ativação/desativação
    
    ### Cálculos Automáticos
    - CMV baseado nos custos dos insumos
    - Preços sugeridos com diferentes margens
    - Estatísticas e relatórios
    
    ## Integração TOTVS
    API preparada para integração com sistema TOTVS para importação
    automática de dados de insumos e preços.
    """,
    version="1.0.0",
    contact={
         "name": "Food Cost System",
        "email": "will.fidelis@iogar.com.br",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan
)

# Configurar CORS para permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, especificar dominios exatos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#   ---------------------------------------------------------------------------------------------------
#   Rotas Principais
#   ---------------------------------------------------------------------------------------------------


@app.get("/", summary="Informações da API")
def root():
    """
    Endpoint raiz da API.
    Retorna informações básicas e links úteis.
    """
    return {
        "massage": "Foodd Cost System API",
        "version": "1.0.0",
        "status":  "online",
        "docs":    "/docs",
        "health":  "/health",
        "endpoint": {
            "insumos":     "/api/v1/insumo",
            "receitas":    "/api/v1/receitas",
            "restaurante": "/api/v1/receitas/restaurante"
        }
    }
@app.get("/health", summary="Status de daúde da API")
def health_check():
    """
    Verifica se a API está funcionando.
    Útil para monitoramento e load balancers.
    """
    return {"staus", "healthy", "service", "food-cost-api"}

@app.get("/text-db", summary="Testar conexão com banco")
def test_database():
    """
    Testa a conexão com o banco de dados PostgreSQL.
    Retorna status da conexão.
    """
    try:
        from app.database import engine
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        return {"database": "connected", "status": "ok"}
    except Exception as e:
        return {"database": "error", "status": "failed", "error": str(e) }
    

#   ---------------------------------------------------------------------------------------------------
#   Incluir routers das APIs
#   ---------------------------------------------------------------------------------------------------

# APIs de Insumos  (Já em funcionamento)
app.include_router(
    insumos.router,
    prefix="/api/v1/insumos",
    tags=["insumos"],
    responses={
        404: {"description": "Insumo não encontrado"},
        433: {"description": "Erro de validação"},
        500: {"description": "Erro interno do servidor"}
    }
)

#APIs de Receitas e Restaurantes (novas)
app.include_router(
    receitas.router,
    prefix="/api/v1/receitas",
    tags=["receitas"],
    responses={
        404: {"description": "Receita não encontrada"},
        422: {"description": "Erro de validação"},
        500: {"description": "Erro interno do servidor"}
    }
)

#   ---------------------------------------------------------------------------------------------------
#   Configurações adicionas
#   ---------------------------------------------------------------------------------------------------

#Middleware para logging (opcional)
@app.middleware("http")
async def log_requests(request, call_next):
    """
    Middleware para log de requisições.
    Útil para debugging e monitoramento.
    """

    import time
    start_time =  time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    print(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")

    return response

#   ---------------------------------------------------------------------------------------------------
#   Tratamento de erros globais
#   ---------------------------------------------------------------------------------------------------

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handler customizado para erros 404"""
    return {
        "erroe": "Recurso não encontrado",
        "message": "O endpoint solicitado não existe",
        "path": str(request.url.path),
        "method": request.method
    }

@app.exception_handler(422)
async def validation_error_handler(request, exc):
    """Handler customizado para erros de validação"""
    return {
        "eroor": "Erro de validação",
        "message": "Os dados fornecidos não são válidos",
        "details": exc.detail if hasattr(exc, 'detail') else str(exc)
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handler customizado para erros internos"""
    return {
        "error": "Erro interno do servidor",
        "message": "Ocorreu um erro inesperado",
        "path": str(request.url.path)
    }

#   ---------------------------------------------------------------------------------------------------
#   Executar a aplicação
#   ---------------------------------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    print("Iniciando Food Cost System API...")
    print ("Local: http://localhost:8000")
    print ("Docs: http://localhost:8000/docs")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )