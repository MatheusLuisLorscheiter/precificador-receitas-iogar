#   ===================================================================================================
#   Aplicação Principal FastAPI
#   Descrição: Este é o arquivo principal que configura e inicia a aplicação FastAPI
#   com todas as rotas de insumos e receitas
#   Data: 15/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

# Imports principais do FastAPI e configurações
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

# Imports dos routers/endpoints das APIs
try:
    from app.api.endpoints import insumos, receitas, fornecedores, taxonomias
    # Tentar importar o módulo fornecedor_insumos
    try:
        from app.api.endpoints import fornecedor_insumos
        HAS_FORNECEDOR_INSUMOS = True
    except ImportError:
        print("⚠️  Módulo fornecedor_insumos não encontrado, pulando...")
        HAS_FORNECEDOR_INSUMOS = False
    
    # Tentar importar o módulo taxonomia_aliases
    try:
        from app.api.endpoints import taxonomia_aliases
        HAS_TAXONOMIA_ALIASES = True
        print("✅ Módulo taxonomia_aliases importado com sucesso")
    except ImportError as e:
        print(f"⚠️  Módulo taxonomia_aliases não encontrado: {e}")
        HAS_TAXONOMIA_ALIASES = False
        
except ImportError as e:
    print(f"❌ Erro ao importar endpoints: {e}")
    raise

# Imports para configuração do banco de dados
from app.database import engine
from app.models.base import Base

# ============================================================================
# IMPORTAÇÕES DOS MODELOS (para registrar no SQLAlchemy)
# ============================================================================
from app.models import taxonomia, taxonomia_alias, insumo, fornecedor, fornecedor_insumo, receita

# Imports para variáveis de ambiente
import os
import time



#   ===================================================================================================
#   Configuração do ciclo de vida da aplicação
#   ===================================================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia o ciclo de vida da aplicação FastAPI.
    Executa tarefas na inicialização e finalização.
    """
    # Startup: Criar tabelas no banco se não existirem
    print("🚀 Iniciando Food Cost System...")
    try:
        # Cria todas as tabelas definidas nos modelos
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas do banco de dados verificadas/criadas")
    except Exception as e:
        print(f"❌ Erro ao conectar com o banco: {e}")
    
    # Informações úteis para o desenvolvedor
    print("🔍 CRUD Insumos: http://localhost:8000/api/v1/insumos")
    print("🔍 CRUD Receitas: http://localhost:8000/api/v1/receitas")
    print("📖 Documentação: http://localhost:8000/docs")
    print("🔄 ReDoc: http://localhost:8000/redoc")
    
    yield  # Aplicação roda aqui
    
    # Shutdown: Limpeza se necessário
    print("🛑 Finalizando Food Cost System...")

#   ===================================================================================================
#   Configuração da aplicação FastAPI
#   ===================================================================================================

app = FastAPI(
    title="Food Cost System",
    description="""
    **Sistema de Controle de Custos para Restaurantes**
    
    Esta API permite:
    - 📦 Gerenciar insumos (ingredientes, matérias-primas)
    - 🍕 Criar e calcular custos de receitas
    - 🏪 Organizar por restaurantes
    - 💰 Calcular automaticamente CMV e preços sugeridos
    - 🔍 Buscar e filtrar dados
    
    **Funcionalidades principais:**
    - CRUD completo de insumos e receitas
    - Cálculos automáticos de custos
    - Preços sugeridos baseados em margens
    - Sistema de variações de receitas
    - Relacionamento receitas ↔ insumos
    """,
    version="1.0.0",
    contact={
        "name": "Will - Food Cost System",
        "email": "will@foodcost.com",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan
)

#   ===================================================================================================
#   Configuração de CORS para permitir acesso do frontend
#   ===================================================================================================

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
)

#   ===================================================================================================
#   Endpoints básicos de status e saúde
#   ===================================================================================================

@app.get("/", summary="Status da API")
def root():
    """
    Endpoint raiz que retorna o status da API.
    Útil para verificar se o serviço está rodando.
    """
    return {
        "message": "Food Cost System API",
        "status": "running",
        "version": "1.0.0",
        "docs": "http://localhost:8000/docs"
    }

@app.get("/health", summary="Health Check")
def health_check():
    """
    Endpoint de verificação de saúde do serviço.
    Útil para monitoramento e load balancers.
    """
    return {"status": "healthy", "service": "food-cost-api"}

@app.get("/test-db", summary="Testar conexão com banco")
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
        return {"database": "error", "status": "failed", "error": str(e)}

#   ===================================================================================================
#   Incluir routers das APIs
#   ===================================================================================================

# APIs de Insumos (Já em funcionamento)
app.include_router(
    insumos.router,
    prefix="/api/v1/insumos",
    tags=["insumos"]
)

# APIs de Receitas e Restaurantes (novas)
app.include_router(
    receitas.router,
    prefix="/api/v1/receitas", 
    tags=["receitas"]
)

# Router para operações com fornecedores
app.include_router(
    fornecedores.router, 
    prefix="/api/v1/fornecedores", 
    tags=["fornecedores"],
    responses={
        404: {"description": "Fornecedor não encontrado"},
        422: {"description": "Erro de validação"},
        500: {"description": "Erro interno do servidor"}
    }
)

# Router para operações com taxonomias hierárquicas
app.include_router(
    taxonomias.router,
    prefix="/api/v1/taxonomias",
    tags=["taxonomias"],
    responses={
        404: {"description": "Taxonomia não encontrada"},
        422: {"description": "Erro de validação"},
        500: {"description": "Erro interno do servidor"}
    }
)

# Router para sistema de IA de classificação (FASE 2)
try:
    from app.api.endpoints import ia as ia_endpoints
    app.include_router(
        ia_endpoints.router,
        prefix="/api/v1/ia",
        tags=["ia-classificacao"],
        responses={
            404: {"description": "Recurso não encontrado"},
            422: {"description": "Erro de validação"},
            500: {"description": "Erro interno do servidor"},
            503: {"description": "Sistema de IA indisponível"}
        }
    )
    print("✅ Router de IA incluído com sucesso")
except ImportError as e:
    print(f"⚠️  Sistema de IA não disponível: {e}")
    print("💡 Instale as dependências: pip install spacy fuzzywuzzy python-levenshtein")
except Exception as e:
    print(f"❌ Erro ao carregar sistema de IA: {e}")

# Router para operações com aliases de taxonomias (Sistema de Mapeamento - Fase 2)
if HAS_TAXONOMIA_ALIASES:
    app.include_router(
        taxonomia_aliases.router,
        prefix="/api/v1/taxonomias",
        tags=["taxonomia-aliases"],
        responses={
            404: {"description": "Alias não encontrado"},
            422: {"description": "Erro de validação"},
            500: {"description": "Erro interno do servidor"}
        }
    )
    print("✅ Router taxonomia_aliases incluído com sucesso")
else:
    print("⚠️  Router taxonomia_aliases não incluído (módulo não disponível)")

# Router para operações com insumos do catálogo dos fornecedores (condicional)
if HAS_FORNECEDOR_INSUMOS:
    app.include_router(
        fornecedor_insumos.router,
        prefix="/api/v1", 
        tags=["fornecedor-insumos"],
        responses={
            404: {"description": "Insumo ou fornecedor não encontrado"},
            422: {"description": "Erro de validação"},
            500: {"description": "Erro interno do servidor"}
        }
    )



#   ===================================================================================================
#   Middleware para logging de requisições
#   ===================================================================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware para monitorar e facilitar o 
    diagnóstico de problemas, mostrando no terminal 
    cada acesso à API e quanto tempo levou para responder.
    """
    start_time = time.time()
    
    # Log detalhado da requisição
    print(f"🔍 REQUISIÇÃO: {request.method} {request.url}")
    print(f"🔍 Headers: {dict(request.headers)}")
    print(f"🔍 Origin: {request.headers.get('origin', 'N/A')}")
    
    # Processar requisição
    response = await call_next(request)
    
    # Calcular tempo de processamento
    process_time = time.time() - start_time
    
    # Log da resposta
    print(f"📡 RESPOSTA: {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}s")
    print(f"📡 Response Headers: {dict(response.headers)}")
    
    return response

#   ===================================================================================================
#   Tratamento de erros globais
#   ===================================================================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Handler customizado para erros 404"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Recurso não encontrado",
            "message": "O endpoint solicitado não existe",
            "path": str(request.url.path),
            "method": request.method
        }
    )

@app.exception_handler(422)
async def validation_error_handler(request: Request, exc: HTTPException):
    """Handler customizado para erros de validação"""
    return JSONResponse(
        status_code=422,
        content={
            "error": "Erro de validação",
            "message": "Os dados fornecidos não são válidos",
            "details": exc.detail if hasattr(exc, 'detail') else str(exc)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    """Handler customizado para erros internos"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "message": "Ocorreu um erro inesperado",
            "path": str(request.url.path)
        }
    )

#   ===================================================================================================
#   Executar a aplicação (apenas se executado diretamente)
#   ===================================================================================================

if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando Food Cost System API...")
    print("🌐 Local: http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
