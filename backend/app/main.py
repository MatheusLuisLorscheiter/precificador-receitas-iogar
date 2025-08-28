from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import time

# Configuração da aplicação
app = FastAPI(
    title="Food Cost System",
    description="Sistema de Controle de Custos para Restaurantes",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints básicos (sempre funcionam)
@app.get("/")
def root():
    return {
        "message": "Food Cost System API",
        "status": "running",
        "version": "1.0.0",
        "environment": "production" if os.getenv("RENDER") else "development"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "food-cost-api"}

# Importar e configurar banco de dados
try:
    from app.database import engine, Base
    print("✅ Banco de dados importado")
    
    # Tentar criar tabelas
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas/verificadas")
    except Exception as e:
        print(f"⚠️ Aviso ao criar tabelas: {e}")
    
    # Endpoint de teste do banco
    @app.get("/test-db")
    def test_database():
        try:
            with engine.connect() as connection:
                result = connection.execute("SELECT 1")
                return {"database": "connected", "status": "ok"}
        except Exception as e:
            return {"database": "error", "status": "failed", "error": str(e)}
            
except Exception as e:
    print(f"⚠️ Banco de dados não disponível: {e}")

# Importar routers (com proteção)
try:
    from app.api.endpoints import insumos
    app.include_router(insumos.router, prefix="/api/v1/insumos", tags=["insumos"])
    print("✅ Router insumos carregado")
except Exception as e:
    print(f"⚠️ Router insumos não carregado: {e}")

try:
    from app.api.endpoints import receitas
    app.include_router(receitas.router, prefix="/api/v1/receitas", tags=["receitas"])
    print("✅ Router receitas carregado")
except Exception as e:
    print(f"⚠️ Router receitas não carregado: {e}")

try:
    from app.api.endpoints import fornecedores
    app.include_router(fornecedores.router, prefix="/api/v1/fornecedores", tags=["fornecedores"])
    print("✅ Router fornecedores carregado")
except Exception as e:
    print(f"⚠️ Router fornecedores não carregado: {e}")

# Middleware de logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    print(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Iniciando Food Cost System API na porta {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
