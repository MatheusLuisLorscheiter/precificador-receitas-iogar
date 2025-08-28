from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

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

# Endpoints básicos
@app.get("/")
def root():
    return {
        "message": "Food Cost System API",
        "status": "running ✅",
        "version": "1.0.0",
        "environment": "production" if os.getenv("RENDER") else "development",
        "port": os.getenv("PORT", "8000")
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "food-cost-api"}

# Testar banco de dados
@app.get("/test-db")
def test_database():
    try:
        # Tentar importar database
        from app.database import engine
        print("✅ Database importado")
        
        # Testar conexão
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            return {"database": "connected ✅", "status": "ok"}
    except ImportError as e:
        return {"database": "import_error", "status": "failed", "error": f"Import: {str(e)}"}
    except Exception as e:
        return {"database": "connection_error", "status": "failed", "error": str(e)}

# Tentar criar tabelas na inicialização
try:
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas criadas/verificadas")
except Exception as e:
    print(f"⚠️ Erro nas tabelas: {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Iniciando API na porta {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
