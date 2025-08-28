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

@app.get("/test")
def test_endpoint():
    return {
        "message": "Endpoint de teste funcionando!",
        "render": bool(os.getenv("RENDER")),
        "port": os.getenv("PORT")
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Iniciando API na porta {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
