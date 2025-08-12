# ===================================================================
# MAIN.PY SIMPLIFICADO - SEM IMPORTAÇÕES COMPLEXAS
# ===================================================================

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar o router completo dos insumos
from app.api.endpoints import insumos

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Food Cost System API iniciada!")
    print("📖 Documentação: http://localhost:8000/docs")
    print("🔍 CRUD Insumos: http://localhost:8000/api/v1/insumos")
    yield
    print("🛑 API finalizada!")

app = FastAPI(
    title="Food Cost System API",
    description="Sistema de precificação de receitas",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================================================================
# INCLUIR ROUTER COMPLETO DOS INSUMOS
# ===================================================================

app.include_router(
    insumos.router,
    prefix="/api/v1/insumos",
    tags=["insumos"],
    responses={
        404: {"description": "Insumo não encontrado"},
        409: {"description": "Conflito - código duplicado ou insumo em uso"},
    }
)


# ===================================================================
# ENDPOINTS BÁSICOS 
# ===================================================================

@app.get("/", tags=["root"])
def read_root():
    return {
        "message": "Food Cost System API", 
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "endpoints": {
            "insumos": "/api/v1/insumos",
            "health": "/health"
        }
    }

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)