# ============================================================================
# TESTES UNITARIOS - SERVICO DE PDF
# ============================================================================
# Descricao: Testes para validar geracao de PDFs de receitas
# Data: 04/11/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import pytest
import os
from pathlib import Path
from app.services.pdf_service import PDFService, obter_pdf_service
from reportlab.lib.pagesizes import A4


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def pdf_service():
    """Fixture que retorna uma instancia do PDFService"""
    return obter_pdf_service()


@pytest.fixture
def receita_completa():
    """Fixture com dados completos de uma receita para teste"""
    return {
        'codigo': 'REC-3001',
        'nome': 'Bolo de Chocolate Premium',
        'categoria': 'Sobremesas',
        'status': 'ativo',
        'rendimento': 10,
        'unidade_rendimento': 'porcoes',
        'tempo_preparo': 45,
        'responsavel': 'Chef Maria Silva',
        'ingredientes': [
            {
                'nome': 'Farinha de Trigo',
                'quantidade': 2.5,
                'unidade': 'kg',
                'preco_unitario': 8.50,
                'custo_total': 21.25
            },
            {
                'nome': 'Chocolate em Po',
                'quantidade': 0.5,
                'unidade': 'kg',
                'preco_unitario': 35.00,
                'custo_total': 17.50
            },
            {
                'nome': 'Ovos',
                'quantidade': 12,
                'unidade': 'un',
                'preco_unitario': 0.80,
                'custo_total': 9.60
            },
            {
                'nome': 'Acucar',
                'quantidade': 1.0,
                'unidade': 'kg',
                'preco_unitario': 5.50,
                'custo_total': 5.50
            }
        ],
        'precificacao': {
            'cmv': 53.85,
            'cmv_unitario': 5.39,
            'margem_sugerida': 65.0,
            'preco_sugerido': 15.41,
            'preco_venda_atual': 18.00
        }
    }


@pytest.fixture
def receita_minima():
    """Fixture com dados minimos de uma receita para teste"""
    return {
        'codigo': 'REC-3002',
        'nome': 'Receita Teste Minima',
        'categoria': 'Geral',
        'status': 'pendente',
    }


@pytest.fixture
def output_dir(tmp_path):
    """Fixture que cria um diretorio temporario para saida de PDFs"""
    pdf_dir = tmp_path / "pdfs"
    pdf_dir.mkdir()
    return pdf_dir


# ============================================================================
# TESTES DE INICIALIZACAO
# ============================================================================

def test_criar_instancia_pdf_service():
    """Testa se a instancia do PDFService e criada corretamente"""
    service = PDFService()
    assert service is not None
    assert hasattr(service, 'styles')
    assert hasattr(service, 'gerar_pdf_receita')


def test_obter_pdf_service_function():
    """Testa a funcao auxiliar de obtencao do servico"""
    service = obter_pdf_service()
    assert isinstance(service, PDFService)


def test_estilos_customizados_criados(pdf_service):
    """Testa se os estilos customizados foram criados corretamente"""
    estilos_esperados = [
        'TituloPrincipal',
        'Subtitulo',
        'TextoDestaque',
        'TextoNormal',
        'Rodape'
    ]
    
    for estilo in estilos_esperados:
        assert estilo in pdf_service.styles.byName, f"Estilo {estilo} nao encontrado"


# ============================================================================
# TESTES DE GERACAO DE PDF
# ============================================================================

def test_gerar_pdf_receita_completa(pdf_service, receita_completa, output_dir):
    """Testa geracao de PDF com receita completa"""
    output_path = output_dir / "receita_completa.pdf"
    
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita_completa,
        output_path=str(output_path)
    )
    
    # Verificar se o arquivo foi criado
    assert os.path.exists(resultado)
    assert Path(resultado).suffix == '.pdf'
    
    # Verificar se o arquivo tem tamanho maior que zero
    assert os.path.getsize(resultado) > 0


def test_gerar_pdf_receita_minima(pdf_service, receita_minima, output_dir):
    """Testa geracao de PDF com dados minimos"""
    output_path = output_dir / "receita_minima.pdf"
    
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita_minima,
        output_path=str(output_path)
    )
    
    # Verificar se o arquivo foi criado mesmo com dados minimos
    assert os.path.exists(resultado)
    assert os.path.getsize(resultado) > 0


def test_gerar_pdf_sem_ingredientes(pdf_service, output_dir):
    """Testa geracao de PDF para receita sem ingredientes"""
    receita_sem_ingredientes = {
        'codigo': 'REC-3003',
        'nome': 'Receita Sem Ingredientes',
        'categoria': 'Teste',
        'status': 'pendente',
        'ingredientes': []
    }
    
    output_path = output_dir / "receita_sem_ingredientes.pdf"
    
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita_sem_ingredientes,
        output_path=str(output_path)
    )
    
    assert os.path.exists(resultado)


def test_gerar_pdf_sem_precificacao(pdf_service, output_dir):
    """Testa geracao de PDF para receita sem dados de precificacao"""
    receita_sem_precificacao = {
        'codigo': 'REC-3004',
        'nome': 'Receita Sem Precificacao',
        'categoria': 'Teste',
        'status': 'pendente',
        'ingredientes': [
            {
                'nome': 'Ingrediente Teste',
                'quantidade': 1.0,
                'unidade': 'kg',
                'preco_unitario': 10.00,
                'custo_total': 10.00
            }
        ]
    }
    
    output_path = output_dir / "receita_sem_precificacao.pdf"
    
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita_sem_precificacao,
        output_path=str(output_path)
    )
    
    assert os.path.exists(resultado)


# ============================================================================
# TESTES DE VALIDACAO DE DADOS
# ============================================================================

def test_gerar_pdf_com_valores_none(pdf_service, output_dir):
    """Testa geracao de PDF com valores None nos dados"""
    receita_com_none = {
        'codigo': None,
        'nome': 'Receita com Valores None',
        'categoria': None,
        'status': None,
        'rendimento': None,
        'responsavel': None
    }
    
    output_path = output_dir / "receita_com_none.pdf"
    
    # Nao deve lancar excecao
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita_com_none,
        output_path=str(output_path)
    )
    
    assert os.path.exists(resultado)


def test_gerar_pdf_com_ingredientes_vazios(pdf_service, output_dir):
    """Testa geracao de PDF com lista de ingredientes vazia"""
    receita = {
        'codigo': 'REC-3005',
        'nome': 'Receita Teste',
        'ingredientes': []
    }
    
    output_path = output_dir / "receita_ingredientes_vazios.pdf"
    
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita,
        output_path=str(output_path)
    )
    
    assert os.path.exists(resultado)


# ============================================================================
# TESTES DE FORMATACAO
# ============================================================================

def test_formatacao_valores_monetarios(pdf_service, receita_completa, output_dir):
    """Testa se valores monetarios sao formatados corretamente"""
    output_path = output_dir / "teste_formatacao.pdf"
    
    # Adicionar valores com muitas casas decimais
    receita_completa['precificacao']['cmv'] = 123.456789
    
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita_completa,
        output_path=str(output_path)
    )
    
    assert os.path.exists(resultado)
    # Se nao lancar excecao, a formatacao funcionou


def test_formatacao_quantidade_ingredientes(pdf_service, output_dir):
    """Testa formatacao de quantidades de ingredientes"""
    receita = {
        'codigo': 'REC-3006',
        'nome': 'Teste Formatacao Quantidade',
        'ingredientes': [
            {
                'nome': 'Teste',
                'quantidade': 1.123456,
                'unidade': 'kg',
                'preco_unitario': 10.00,
                'custo_total': 11.23
            }
        ]
    }
    
    output_path = output_dir / "teste_quantidade.pdf"
    
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita,
        output_path=str(output_path)
    )
    
    assert os.path.exists(resultado)


# ============================================================================
# TESTES DE RECURSOS OPCIONAIS
# ============================================================================

def test_pdf_sem_logo(pdf_service, receita_minima, output_dir):
    """Testa geracao de PDF quando logo nao existe"""
    output_path = output_dir / "pdf_sem_logo.pdf"
    
    # O PDF deve ser gerado mesmo sem o logo
    resultado = pdf_service.gerar_pdf_receita(
        receita_data=receita_minima,
        output_path=str(output_path)
    )
    
    assert os.path.exists(resultado)


# ============================================================================
# TESTES DE ROBUSTEZ
# ============================================================================

def test_gerar_multiplos_pdfs(pdf_service, receita_completa, output_dir):
    """Testa geracao de multiplos PDFs em sequencia"""
    for i in range(5):
        output_path = output_dir / f"receita_{i}.pdf"
        
        resultado = pdf_service.gerar_pdf_receita(
            receita_data=receita_completa,
            output_path=str(output_path)
        )
        
        assert os.path.exists(resultado)


def test_sobrescrever_pdf_existente(pdf_service, receita_minima, output_dir):
    """Testa sobrescrita de PDF ja existente"""
    output_path = output_dir / "receita_sobrescrever.pdf"
    
    # Gerar primeira vez
    pdf_service.gerar_pdf_receita(
        receita_data=receita_minima,
        output_path=str(output_path)
    )
    
    tamanho_original = os.path.getsize(output_path)
    
    # Gerar segunda vez (sobrescrever)
    pdf_service.gerar_pdf_receita(
        receita_data=receita_minima,
        output_path=str(output_path)
    )
    
    # Arquivo deve existir e pode ter tamanho diferente
    assert os.path.exists(output_path)