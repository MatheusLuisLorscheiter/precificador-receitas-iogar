# Documentação Técnica - Serviço de PDF

## Visão Geral

O **PDFService** é responsável pela geração de relatórios profissionais em PDF das receitas do Food Cost System. Utiliza a biblioteca ReportLab para criar documentos com identidade visual IOGAR.

---

## Características Principais

### ✅ Design Profissional
- Cores institucionais: Verde (#22c55e) e Rosa (#ec4899)
- Layout limpo e organizado
- Tipografia hierárquica clara

### ✅ Seções Completas
- Cabeçalho com logo IOGAR
- Informações básicas da receita
- Dados complementares
- Tabela de ingredientes estilizada
- Precificação e CMV destacados
- Rodapé com data de geração

### ✅ Robustez
- Tratamento de dados opcionais
- Funciona sem logo (fallback)
- Validação de valores None
- Formatação automática de valores monetários

---

## Instalação

### Dependências
```bash
# Instalar ReportLab
pip install reportlab==4.0.7
```

### Estrutura de Diretórios
```
backend/app/services/
├── pdf_service.py
└── templates/
    └── pdf/
        └── assets/
            └── logo_iogar.png
```

---

## Uso Básico

### Importação
```python
from app.services.pdf_service import obter_pdf_service

# Criar instância do serviço
pdf_service = obter_pdf_service()
```

### Geração de PDF Simples
```python
# Dados mínimos da receita
receita_data = {
    'codigo': 'REC-3001',
    'nome': 'Bolo de Chocolate',
    'categoria': 'Sobremesas',
    'status': 'ativo'
}

# Gerar PDF
caminho_pdf = pdf_service.gerar_pdf_receita(
    receita_data=receita_data,
    output_path='/tmp/receita.pdf'
)

print(f"PDF gerado: {caminho_pdf}")
```

### Geração de PDF Completo
```python
# Dados completos da receita
receita_completa = {
    'codigo': 'REC-3001',
    'nome': 'Bolo de Chocolate Premium',
    'categoria': 'Sobremesas',
    'status': 'ativo',
    'rendimento': 10,
    'unidade_rendimento': 'porções',
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
            'nome': 'Chocolate em Pó',
            'quantidade': 0.5,
            'unidade': 'kg',
            'preco_unitario': 35.00,
            'custo_total': 17.50
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

# Gerar PDF completo
caminho_pdf = pdf_service.gerar_pdf_receita(
    receita_data=receita_completa,
    output_path='/tmp/receita_completa.pdf'
)
```

---

## Formato de Dados

### Estrutura Completa
```python
{
    # Informações Básicas (obrigatórias)
    'codigo': str,              # Código da receita
    'nome': str,                # Nome da receita
    'categoria': str,           # Categoria
    'status': str,              # Status (ativo/inativo/pendente)
    
    # Dados Complementares (opcionais)
    'rendimento': float,        # Quantidade de porções
    'unidade_rendimento': str,  # Unidade do rendimento
    'tempo_preparo': int,       # Tempo em minutos
    'responsavel': str,         # Nome do responsável
    
    # Ingredientes (opcional)
    'ingredientes': [
        {
            'nome': str,            # Nome do ingrediente
            'quantidade': float,    # Quantidade usada
            'unidade': str,         # Unidade de medida
            'preco_unitario': float,# Preço por unidade
            'custo_total': float    # Custo total do ingrediente
        }
    ],
    
    # Precificação (opcional)
    'precificacao': {
        'cmv': float,              # Custo de Mercadoria Vendida total
        'cmv_unitario': float,     # CMV por unidade
        'margem_sugerida': float,  # Margem em percentual
        'preco_sugerido': float,   # Preço sugerido de venda
        'preco_venda_atual': float # Preço atual (opcional)
    }
}
```

---

## API Detalhada

### Classe PDFService

#### Método: `gerar_pdf_receita()`

Gera um PDF completo de uma receita.

**Assinatura:**
```python
def gerar_pdf_receita(
    self, 
    receita_data: Dict[str, Any], 
    output_path: str
) -> str
```

**Parâmetros:**
- `receita_data` (Dict): Dicionário com dados da receita
- `output_path` (str): Caminho onde o PDF será salvo

**Retorno:**
- `str`: Caminho do arquivo PDF gerado

**Exceções:**
- Pode lançar exceções de I/O se o caminho for inválido
- Valida automaticamente dados None

**Exemplo:**
```python
try:
    pdf_path = pdf_service.gerar_pdf_receita(
        receita_data=dados,
        output_path='/tmp/minha_receita.pdf'
    )
    print(f"Sucesso: {pdf_path}")
except Exception as e:
    print(f"Erro: {e}")
```

---

## Customização

### Cores Institucionais

As cores podem ser alteradas no início do arquivo:
```python
# Cores institucionais IOGAR
COR_VERDE_IOGAR = colors.HexColor('#22c55e')
COR_ROSA_IOGAR = colors.HexColor('#ec4899')
COR_CINZA_CLARO = colors.HexColor('#f3f4f6')
COR_CINZA_ESCURO = colors.HexColor('#6b7280')
COR_TEXTO_PRINCIPAL = colors.HexColor('#111827')
```

### Margens do Documento
```python
# Margens do documento
MARGEM_ESQUERDA = 2 * cm
MARGEM_DIREITA = 2 * cm
MARGEM_SUPERIOR = 2 * cm
MARGEM_INFERIOR = 2 * cm
```

### Logo

Para adicionar/alterar o logo:

1. Coloque a imagem em: `backend/app/services/templates/pdf/assets/logo_iogar.png`
2. Formatos suportados: PNG, JPG, JPEG
3. Tamanho recomendado: 400x200 pixels

---

## Testes

### Executar Testes
```bash
# Todos os testes
pytest backend/tests/test_pdf_service.py -v

# Teste específico
pytest backend/tests/test_pdf_service.py::test_gerar_pdf_receita_completa -v

# Com cobertura
pytest backend/tests/test_pdf_service.py --cov=app.services.pdf_service
```

### Cobertura de Testes

- ✅ Inicialização do serviço
- ✅ Criação de estilos customizados
- ✅ Geração com dados completos
- ✅ Geração com dados mínimos
- ✅ Tratamento de valores None
- ✅ Formatação de valores monetários
- ✅ Múltiplas gerações
- ✅ Sobrescrita de arquivos

---

## Integração com API

### Exemplo de Endpoint
```python
from fastapi import APIRouter, HTTPException
from app.services.pdf_service import obter_pdf_service
from app.schemas.receita import ReceitaResponse

router = APIRouter()

@router.get("/receitas/{receita_id}/pdf")
async def gerar_pdf_receita(receita_id: int):
    """Gera PDF de uma receita específica"""
    
    # Buscar receita no banco
    receita = buscar_receita_por_id(receita_id)
    
    if not receita:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    # Preparar dados
    receita_data = {
        'codigo': receita.codigo,
        'nome': receita.nome,
        'categoria': receita.categoria,
        'status': receita.status,
        # ... outros campos
    }
    
    # Gerar PDF
    pdf_service = obter_pdf_service()
    output_path = f"/tmp/receita_{receita_id}.pdf"
    
    try:
        pdf_path = pdf_service.gerar_pdf_receita(receita_data, output_path)
        
        # Retornar arquivo
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f'receita_{receita.codigo}.pdf'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Troubleshooting

### Problema: PDF não é gerado

**Solução:**
- Verifique se o ReportLab está instalado: `pip list | grep reportlab`
- Verifique permissões do diretório de saída
- Confirme que o caminho de saída é válido

### Problema: Logo não aparece

**Solução:**
- Verifique se o arquivo existe em: `backend/app/services/templates/pdf/assets/logo_iogar.png`
- Formatos aceitos: PNG, JPG, JPEG
- O PDF funciona sem logo (fallback automático)

### Problema: Valores monetários incorretos

**Solução:**
- Valores devem ser float, não string
- Use sempre 2 casas decimais nos dados de entrada
- Exemplo: `'preco_unitario': 10.50` (correto)

### Problema: Caracteres especiais não aparecem

**Solução:**
- ReportLab suporta UTF-8 por padrão
- Evite caracteres não-ASCII em nomes de arquivos
- Use normalização de texto se necessário

---

## Performance

### Benchmarks

- Receita simples (sem ingredientes): ~50ms
- Receita completa (10 ingredientes): ~100ms
- Geração em lote (10 receitas): ~1s

### Otimizações

1. **Reutilizar instância:** Não crie novo `PDFService` a cada chamada
2. **Gerar em background:** Use Celery/RQ para geração assíncrona
3. **Cache:** Cachear PDFs já gerados se dados não mudaram

---

## Roadmap Futuro

### Sprint 4 - Parte 2 (Planejado)

- [ ] Adicionar gráficos de composição de custos
- [ ] Suporte a múltiplas páginas
- [ ] QR Code para acesso digital
- [ ] Exportação em lote otimizada
- [ ] Templates customizáveis

---

## Changelog

### v1.0.0 - Sprint 3 (04/11/2025)

- ✅ Estrutura base do serviço
- ✅ Template básico com identidade IOGAR
- ✅ Seções: cabeçalho, informações, ingredientes, precificação
- ✅ Testes unitários completos
- ✅ Documentação técnica

---

## Contato e Suporte

**Projeto:** Food Cost System  
**Empresa:** IOGAR  
**Desenvolvedor:** Will  
**Data:** Novembro 2025

Para dúvidas ou sugestões, consulte o roadmap do projeto ou abra uma issue no repositório.