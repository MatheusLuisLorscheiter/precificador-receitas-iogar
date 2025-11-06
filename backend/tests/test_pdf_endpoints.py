# ============================================================================
# TESTES UNITARIOS - ENDPOINTS DE PDF
# ============================================================================
# Descricao: Testes para validar endpoints de geracao de PDFs
# Data: 04/11/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base
from app.api.deps import get_db
import os


# ============================================================================
# CONFIGURACAO DE TESTES
# ============================================================================

# Banco de dados de teste em memória
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_pdf.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override da dependencia de banco para usar banco de teste"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def client():
    """Fixture do cliente de teste"""
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def db():
    """Fixture da sessao de banco de dados"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


# ============================================================================
# FIXTURES DE DADOS
# ============================================================================

@pytest.fixture
def restaurante_teste(db):
    """Cria restaurante de teste"""
    from app.models.receita import Restaurante
    
    restaurante = Restaurante(
        nome="Restaurante Teste",
        tipo_estabelecimento="matriz"
    )
    db.add(restaurante)
    db.commit()
    db.refresh(restaurante)
    return restaurante


@pytest.fixture
def insumo_teste(db, restaurante_teste):
    """Cria insumo de teste"""
    from app.models.insumo import Insumo
    
    insumo = Insumo(
        codigo=5001,
        nome="Farinha de Trigo Teste",
        unidade="kg",
        preco_compra=850,  # R$ 8.50 em centavos
        restaurante_id=restaurante_teste.id
    )
    db.add(insumo)
    db.commit()
    db.refresh(insumo)
    return insumo


@pytest.fixture
def receita_teste(db, restaurante_teste):
    """Cria receita de teste"""
    from app.models.receita import Receita
    
    receita = Receita(
        codigo="REC-TEST-001",
        nome="Bolo de Teste",
        categoria="Sobremesas",
        status="ativo",
        rendimento=10,
        unidade_rendimento="porcoes",
        tempo_preparo=45,
        responsavel="Chef Teste",
        restaurante_id=restaurante_teste.id
    )
    db.add(receita)
    db.commit()
    db.refresh(receita)
    return receita


@pytest.fixture
def receita_com_insumo(db, receita_teste, insumo_teste):
    """Cria receita com insumo vinculado"""
    from app.models.receita import ReceitaInsumo
    
    receita_insumo = ReceitaInsumo(
        receita_id=receita_teste.id,
        insumo_id=insumo_teste.id,
        quantidade=2.5
    )
    db.add(receita_insumo)
    db.commit()
    return receita_teste


# ============================================================================
# TESTES DO ENDPOINT GET /api/v1/receitas/{id}/pdf
# ============================================================================

def test_gerar_pdf_receita_individual_sucesso(client, receita_com_insumo):
    """Testa geracao de PDF de uma receita com sucesso"""
    response = client.get(f"/api/v1/receitas/{receita_com_insumo.id}/pdf")
    
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/pdf'
    assert 'content-disposition' in response.headers
    assert len(response.content) > 0


def test_gerar_pdf_receita_nao_encontrada(client):
    """Testa geracao de PDF de receita inexistente"""
    response = client.get("/api/v1/receitas/99999/pdf")
    
    assert response.status_code == 404
    assert "não encontrada" in response.json()['detail'].lower()


def test_gerar_pdf_receita_sem_ingredientes(client, receita_teste):
    """Testa geracao de PDF de receita sem ingredientes"""
    response = client.get(f"/api/v1/receitas/{receita_teste.id}/pdf")
    
    # Deve gerar PDF mesmo sem ingredientes
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/pdf'


def test_headers_download_pdf_individual(client, receita_com_insumo):
    """Testa se headers de download estao corretos"""
    response = client.get(f"/api/v1/receitas/{receita_com_insumo.id}/pdf")
    
    assert response.status_code == 200
    assert 'attachment' in response.headers.get('content-disposition', '')
    assert 'cache-control' in response.headers
    assert response.headers['cache-control'] == 'no-cache'


# ============================================================================
# TESTES DO ENDPOINT POST /api/v1/receitas/pdf/lote
# ============================================================================

def test_gerar_pdf_lote_sucesso(client, receita_com_insumo, db):
    """Testa geracao de PDFs em lote com sucesso"""
    # Criar segunda receita
    from app.models.receita import Receita
    receita2 = Receita(
        codigo="REC-TEST-002",
        nome="Torta de Teste",
        categoria="Sobremesas",
        status="ativo",
        restaurante_id=receita_com_insumo.restaurante_id
    )
    db.add(receita2)
    db.commit()
    
    payload = {
        "receita_ids": [receita_com_insumo.id, receita2.id]
    }
    
    response = client.post("/api/v1/receitas/pdf/lote", json=payload)
    
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/zip'
    assert 'x-total-generated' in response.headers
    assert 'x-total-requested' in response.headers


def test_gerar_pdf_lote_lista_vazia(client):
    """Testa geracao de PDFs com lista vazia"""
    payload = {"receita_ids": []}
    
    response = client.post("/api/v1/receitas/pdf/lote", json=payload)
    
    assert response.status_code == 422  # Validation error


def test_gerar_pdf_lote_excede_limite(client):
    """Testa geracao de PDFs excedendo limite maximo"""
    # Criar lista com mais de 50 IDs
    payload = {"receita_ids": list(range(1, 52))}
    
    response = client.post("/api/v1/receitas/pdf/lote", json=payload)
    
    assert response.status_code == 422  # Validation error


def test_gerar_pdf_lote_com_ids_invalidos(client, receita_com_insumo):
    """Testa geracao de PDFs com alguns IDs invalidos"""
    payload = {
        "receita_ids": [receita_com_insumo.id, 99999, 88888]
    }
    
    response = client.post("/api/v1/receitas/pdf/lote", json=payload)
    
    # Deve gerar ZIP apenas com os PDFs validos
    assert response.status_code == 200
    assert int(response.headers['x-total-generated']) == 1
    assert int(response.headers['x-total-requested']) == 3


def test_headers_download_pdf_lote(client, receita_com_insumo):
    """Testa se headers de download do ZIP estao corretos"""
    payload = {"receita_ids": [receita_com_insumo.id]}
    
    response = client.post("/api/v1/receitas/pdf/lote", json=payload)
    
    assert response.status_code == 200
    assert 'attachment' in response.headers.get('content-disposition', '')
    assert '.zip' in response.headers.get('content-disposition', '')


# ============================================================================
# TESTES DE VALIDACAO DE DADOS
# ============================================================================

def test_pdf_com_dados_minimos(client, db, restaurante_teste):
    """Testa geracao de PDF com dados minimos da receita"""
    from app.models.receita import Receita
    
    receita_minima = Receita(
        codigo="REC-MIN",
        nome="Receita Minima",
        restaurante_id=restaurante_teste.id
    )
    db.add(receita_minima)
    db.commit()
    db.refresh(receita_minima)
    
    response = client.get(f"/api/v1/receitas/{receita_minima.id}/pdf")
    
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/pdf'


def test_pdf_com_valores_none(client, db, restaurante_teste):
    """Testa geracao de PDF com valores None nos campos opcionais"""
    from app.models.receita import Receita
    
    receita = Receita(
        codigo="REC-NONE",
        nome="Receita com None",
        categoria=None,
        status=None,
        rendimento=None,
        tempo_preparo=None,
        responsavel=None,
        restaurante_id=restaurante_teste.id
    )
    db.add(receita)
    db.commit()
    db.refresh(receita)
    
    response = client.get(f"/api/v1/receitas/{receita.id}/pdf")
    
    # Deve gerar PDF normalmente com valores padrao
    assert response.status_code == 200


# ============================================================================
# TESTES DE PERFORMANCE
# ============================================================================

def test_performance_pdf_individual(client, receita_com_insumo):
    """Testa tempo de resposta da geracao de PDF individual"""
    import time
    
    start_time = time.time()
    response = client.get(f"/api/v1/receitas/{receita_com_insumo.id}/pdf")
    end_time = time.time()
    
    tempo_execucao = end_time - start_time
    
    assert response.status_code == 200
    assert tempo_execucao < 5.0  # Deve gerar em menos de 5 segundos


def test_performance_pdf_lote(client, db, restaurante_teste):
    """Testa tempo de resposta da geracao de PDFs em lote"""
    from app.models.receita import Receita
    import time
    
    # Criar 5 receitas
    receitas = []
    for i in range(5):
        receita = Receita(
            codigo=f"REC-PERF-{i}",
            nome=f"Receita Performance {i}",
            restaurante_id=restaurante_teste.id
        )
        db.add(receita)
        receitas.append(receita)
    
    db.commit()
    
    ids = [r.id for r in receitas]
    payload = {"receita_ids": ids}
    
    start_time = time.time()
    response = client.post("/api/v1/receitas/pdf/lote", json=payload)
    end_time = time.time()
    
    tempo_execucao = end_time - start_time
    
    assert response.status_code == 200
    assert tempo_execucao < 10.0  # 5 PDFs em menos de 10 segundos