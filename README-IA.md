# Sistema de IA - Food Cost System

## Visão Geral

O Sistema de IA do Food Cost System é uma solução **100% gratuita** para classificação automática de insumos em taxonomias hierárquicas. Utiliza tecnologias de NLP (Processamento de Linguagem Natural) para analisar nomes de produtos e sugerir classificações apropriadas.

## Características Principais

### ✅ **100% Gratuito**
- Sem APIs pagas (OpenAI, Google, etc.)
- Utiliza apenas bibliotecas open-source
- Processamento local sem envio de dados externos

### 🧠 **Inteligência Integrada**
- Processamento NLP com spaCy (modelo português)
- Análise de similaridade com fuzzywuzzy
- Sistema de aprendizado contínuo via feedback
- Base de conhecimento evolutiva

### 🔄 **Sistema de Aprendizado**
- Feedback do usuário aprimora classificações
- Criação automática de aliases no sistema existente
- Padrões aprendidos salvos localmente

### 🚀 **Performance**
- Classificação em tempo real
- Suporte a classificação em lote
- Fallbacks para funcionamento sem dependências

## Arquitetura

```
backend/app/ai/
├── classificador_ia.py          # Core da IA
├── data/
│   ├── base_conhecimento.json   # Base de conhecimento
│   ├── padroes_aprendidos.json  # Padrões do sistema
│   └── logs_feedback.json       # Logs de feedback
├── models/                      # Modelos treinados (futuro)
└── logs/                        # Logs do sistema

backend/app/schemas/ia.py        # Schemas Pydantic
backend/app/api/endpoints/ia.py  # Endpoints REST
```

## Instalação e Configuração

### 1. Instalação Automática (Recomendado)

```bash
# Executar script de configuração automática
python backend/setup_ia.py
```

### 2. Instalação Manual

```bash
# Instalar dependências
pip install -r requirements-ia.txt

# Baixar modelo português do spaCy
python -m spacy download pt_core_news_sm

# Criar estrutura de diretórios
mkdir -p backend/app/ai/data
mkdir -p backend/app/ai/logs
```

### 3. Verificação da Instalação

```bash
# Executar testes completos
python backend/teste_sistema_ia.py

# Testes rápidos
python backend/teste_sistema_ia.py --quick

# Testes detalhados
python backend/teste_sistema_ia.py --verbose
```

## Como Usar

### 1. Iniciar o Servidor

```bash
# Navegar para o diretório backend
cd backend

# Iniciar servidor FastAPI
python -m uvicorn app.main:app --reload
```

### 2. Acessar Documentação

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Endpoints IA**: http://localhost:8000/api/v1/ia/

### 3. Endpoints Disponíveis

#### 🔍 **Classificar Produto**
```http
POST /api/v1/ia/classificar
Content-Type: application/json

{
  "nome_produto": "Salmão Atlântico Filé Fresco 1kg",
  "incluir_alternativas": true,
  "limite_alternativas": 3,
  "confianca_minima": 0.6
}
```

#### 💬 **Registrar Feedback**
```http
POST /api/v1/ia/feedback
Content-Type: application/json

{
  "produto_original": "Salmão Grelhado",
  "acao": "aceitar",
  "taxonomia_correta": {
    "categoria": "Peixes",
    "subcategoria": "Salmão",
    "especificacao": "Filé",
    "variante": "Premium"
  },
  "comentario": "Classificação correta"
}
```

#### 📊 **Verificar Status**
```http
GET /api/v1/ia/status
```

#### 📈 **Obter Estatísticas**
```http
GET /api/v1/ia/estatisticas
```

#### 📋 **Classificação em Lote**
```http
POST /api/v1/ia/classificar-lote
Content-Type: application/json

{
  "produtos": [
    "Salmão Atlântico",
    "Carne Bovina Alcatra",
    "Tomate Italiano"
  ],
  "confianca_minima": 0.5
}
```

## Integração com Sistema Existente

### 🔗 **Taxonomias**
- Utiliza taxonomias hierárquicas já cadastradas
- Busca automática por categoria > subcategoria > especificação > variante
- Integração com CRUD de taxonomias existente

### 🏷️ **Aliases**
- Sistema de aprendizado cria aliases reais no banco
- Utiliza sistema de aliases existente para mapeamento
- Feedback do usuário gera novos aliases automaticamente

### 📦 **Insumos**
- Sugestões de classificação para novos insumos
- Integração com cadastro de insumos existente
- Validação baseada em padrões aprendidos

## Algoritmos e Tecnologias

### 🧠 **Processamento NLP**
```python
# Análise com spaCy
doc = nlp("Salmão Atlântico Filé Fresco")
tokens = [token.lemma_ for token in doc if not token.is_stop]

# Extração de características
caracteristicas = extrair_caracteristicas(tokens)
```

### 📊 **Similaridade de Strings**
```python
# Fuzzy matching
score = fuzz.ratio("salmao atlantico", "salmão atlântico")
matches = process.extractBests(produto, base_conhecimento, limit=5)
```

### 🎯 **Sistema de Scoring**
- **Correspondência exata**: 100%
- **Palavras-chave principais**: 80-95%
- **Similaridade alta**: 60-80% 
- **Correspondência parcial**: 40-60%
- **Sem correspondência**: < 40%

## Monitoramento e Manutenção

### 📊 **Métricas Disponíveis**
- Taxa de acerto geral
- Confiança média das classificações
- Distribuição por categorias
- Número de feedbacks recebidos
- Performance do sistema

### 🔧 **Manutenção Preventiva**
```bash
# Verificar saúde do sistema
curl http://localhost:8000/api/v1/ia/status

# Obter estatísticas
curl http://localhost:8000/api/v1/ia/estatisticas

# Logs detalhados
tail -f backend/app/ai/logs/*.log
```

### 📈 **Otimização Contínua**
- Análise de padrões em classificações
- Identificação de produtos problemáticos
- Sugestões automáticas de melhorias
- Relatórios de aprendizado periódicos

## Troubleshooting

### ❌ **Problemas Comuns**

#### 1. Modelo spaCy não encontrado
```bash
# Solução
python -m spacy download pt_core_news_sm
```

#### 2. Dependências não instaladas
```bash
# Solução
pip install spacy fuzzywuzzy python-levenshtein unidecode
```

#### 3. Arquivos de configuração corrompidos
```bash
# Solução
python backend/setup_ia.py  # Recria arquivos
```

#### 4. Performance lenta
- Verificar se modelo spaCy está carregado
- Considerar aumentar limites de cache
- Analisar logs de performance

### 🔍 **Diagnóstico**
```bash
# Teste completo com diagnóstico
python backend/teste_sistema_ia.py --verbose

# Verificar apenas dependências
python -c "import spacy; print('spaCy OK')"
python -c "from fuzzywuzzy import fuzz; print('fuzzywuzzy OK')"
```

## Roadmap Futuro

### 🚀 **Próximas Funcionalidades**
- [ ] Interface React para feedback visual
- [ ] Sistema de templates para categorias específicas
- [ ] Análise de imagens de produtos (OCR)
- [ ] Importação de catálogos de fornecedores
- [ ] Integração com sistemas externos (TOTVS)

### 🎯 **Melhorias Planejadas**
- [ ] Cache inteligente para performance
- [ ] Modelos específicos por tipo de estabelecimento
- [ ] Análise de contexto (preço, fornecedor)
- [ ] Sistema de confiança adaptativo

## Contribuição

### 📝 **Reportar Problemas**
1. Descrever o problema detalhadamente
2. Incluir logs relevantes
3. Informar versões das dependências
4. Reproduzir com dados de exemplo

### 🔧 **Desenvolvimento**
1. Seguir padrões de código existentes
2. Comentários em todos os blocos
3. Testes para novas funcionalidades
4. Documentação atualizada

## Licença

Este sistema faz parte do Food Cost System - IOGAR.
Utiliza tecnologias open-source sob suas respectivas licenças.

---

**Suporte Técnico**: Will - IOGAR  
**Versão**: 2.0.0  
**Última Atualização**: Setembro 2025