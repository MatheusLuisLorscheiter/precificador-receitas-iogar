# Migração: Suporte CPF/CNPJ para Fornecedores

## 📋 Visão Geral

Esta migração adiciona suporte para **CPF** e **CNPJ** na tabela `fornecedores`, permitindo o cadastro de fornecedores pessoa física (CPF) e pessoa jurídica (CNPJ).

### Alterações Principais
- ✅ Campo `cnpj` renomeado para `cpf_cnpj`
- ✅ Validação matemática de CPF e CNPJ no backend
- ✅ Formatação automática no frontend
- ✅ Preservação de todos os dados existentes

## 🚀 Como Executar a Migração

### Pré-requisitos
1. Backup do banco de dados
2. Aplicação parada
3. Acesso ao servidor de banco

### Executando a Migração

```bash
# 1. Navegue até o diretório do backend
cd backend

# 2. Execute o script de migração
python migrations/add_cpf_cnpj_support.py
```

### Saída Esperada
```
🔧 SCRIPT DE MIGRAÇÃO: Suporte CPF/CNPJ para Fornecedores
======================================================================
⚠️  Esta migração irá:
   - Alterar a estrutura da tabela 'fornecedores'
   - Renomear coluna 'cnpj' para 'cpf_cnpj'
   - Adicionar suporte a CPF (11 dígitos)
   - Manter compatibilidade com CNPJ (14 dígitos)

🤔 Deseja continuar? (s/N): s

🔄 Iniciando migração para suporte CPF/CNPJ...
📝 Etapa 1: Adicionando coluna cpf_cnpj...
📝 Etapa 2: Copiando dados da coluna cnpj para cpf_cnpj...
   📊 Total de registros: 15
   📊 Com CPF/CNPJ: 15
   📊 Com CNPJ original: 15
📝 Etapa 3: Adicionando constraints na coluna cpf_cnpj...
📝 Etapa 4: Removendo constraints da coluna cnpj antiga...
📝 Etapa 5: Removendo coluna cnpj antiga...
📝 Etapa 6: Atualizando comentário da coluna...
✅ Migração concluída com sucesso!
```

## 🔙 Rollback (Reverter Migração)

**⚠️ ATENÇÃO:** O rollback só pode ser executado se **NÃO** houver fornecedores com CPF cadastrados.

```bash
# Execute o script de rollback
python migrations/rollback_cpf_cnpj_support.py
```

### Quando o Rollback Falha
Se houver fornecedores com CPF cadastrados, você verá:

```
❌ ROLLBACK BLOQUEADO: Existem 5 fornecedores com CPF cadastrados.
   
   O rollback não pode ser executado porque resultaria em perda de dados.
   
   Opções:
   1. Remover manualmente os fornecedores com CPF
   2. Converter os CPFs para CNPJs fictícios
   3. Manter a nova estrutura com suporte a CPF/CNPJ
```

## 📊 Estrutura Antes vs Depois

### ANTES da Migração
```sql
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome_razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,  -- ❌ Apenas CNPJ
    telefone VARCHAR(20),
    ramo VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### DEPOIS da Migração
```sql
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome_razao_social VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(18) NOT NULL UNIQUE,  -- ✅ CPF ou CNPJ
    telefone VARCHAR(20),
    ramo VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🔧 Alterações no Código

### Backend
1. **Schema Pydantic** (`app/schemas/fornecedor.py`)
   - Campo `cnpj` → `cpf_cnpj`
   - Validação matemática com `app/utils/cpf_cnpj_validator.py`

2. **Modelo SQLAlchemy** (`app/models/fornecedor.py`)
   - Coluna `cnpj` → `cpf_cnpj`

3. **CRUD** (`app/crud/fornecedor.py`)
   - Função `get_fornecedor_by_cnpj()` → `get_fornecedor_by_cpf_cnpj()`
   - Busca atualizada para pesquisar em `cpf_cnpj`

4. **API Endpoints** (`app/api/endpoints/fornecedores.py`)
   - Documentação atualizada
   - Mensagens de erro ajustadas

### Frontend
1. **Formulário** (`frontend/src/App.tsx`)
   - Campo `cnpj` → `cpf_cnpj`
   - Formatação automática para CPF/CNPJ
   - Validação no frontend

2. **Exibição**
   - Detecta automaticamente se é CPF ou CNPJ
   - Mostra label correto ("CPF:" ou "CNPJ:")
   - Formatação adequada na exibição

## 📝 Validações Implementadas

### CPF (11 dígitos)
- ✅ Validação matemática dos dígitos verificadores
- ✅ Rejeita CPFs com todos os dígitos iguais
- ✅ Formatação: `XXX.XXX.XXX-XX`

### CNPJ (14 dígitos)
- ✅ Validação matemática dos dígitos verificadores
- ✅ Rejeita CNPJs com todos os dígitos iguais
- ✅ Formatação: `XX.XXX.XXX/XXXX-XX`

## 🧪 Testes

### Testando a Migração
1. **Antes da migração:**
   ```sql
   SELECT count(*) FROM fornecedores WHERE cnpj IS NOT NULL;
   ```

2. **Depois da migração:**
   ```sql
   SELECT count(*) FROM fornecedores WHERE cpf_cnpj IS NOT NULL;
   ```

3. **Verificar integridade:**
   ```sql
   -- Deve retornar 0 (coluna cnpj não existe mais)
   SELECT count(*) FROM information_schema.columns 
   WHERE table_name = 'fornecedores' AND column_name = 'cnpj';
   
   -- Deve retornar 1 (coluna cpf_cnpj existe)
   SELECT count(*) FROM information_schema.columns 
   WHERE table_name = 'fornecedores' AND column_name = 'cpf_cnpj';
   ```

### Testando Validações
```python
# Teste CPF válido
POST /api/v1/fornecedores/
{
  "nome_razao_social": "João Silva",
  "cpf_cnpj": "12345678901"  # ou "123.456.789-01"
}

# Teste CNPJ válido
POST /api/v1/fornecedores/
{
  "nome_razao_social": "Empresa LTDA",
  "cpf_cnpj": "12345678000195"  # ou "12.345.678/0001-95"
}

# Teste documento inválido
POST /api/v1/fornecedores/
{
  "nome_razao_social": "Teste",
  "cpf_cnpj": "123456789"  # Muito curto
}
# Resposta: 400 - "Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)"
```

## 🛟 Troubleshooting

### Erro: "coluna cnpj não existe"
```bash
# A aplicação ainda está usando o código antigo
# Certifique-se de:
1. Reiniciar o servidor backend
2. Atualizar imports no código
3. Verificar se não há cache de código compilado
```

### Erro: "constraint violation"
```bash
# Algum fornecedor tem documento duplicado
# Verifique:
SELECT cpf_cnpj, count(*) 
FROM fornecedores 
GROUP BY cpf_cnpj 
HAVING count(*) > 1;
```

### Erro na validação de CPF/CNPJ
```bash
# Problema no algoritmo de validação
# Teste manualmente:
python -c "
from app.utils.cpf_cnpj_validator import validar_cpf_ou_cnpj
print(validar_cpf_ou_cnpj('12345678901'))
"
```

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do banco de dados
2. Confirme que o backup foi feito
3. Execute o rollback se necessário
4. Entre em contato com a equipe de desenvolvimento

---

**Data da Migração:** 03/09/2025  
**Autor:** Will - IOGAR  
**Versão:** 1.0