# ===================================================================
# TESTE SIMPLES - Apenas para verificar se FastAPI funciona
# ===================================================================

from fastapi import FastAPI

app = FastAPI(title="Test API")

@app.get("/")
def read_root():
    return {"message": "API funcionando!"}

@app.get("/test")
def test_endpoint():
    return {"status": "ok", "test": "passed"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)