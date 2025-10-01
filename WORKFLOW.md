# Fluxo de Trabalho - Git Branches e Ambientes

## Estrutura de Branches

- **develop** - Desenvolvimento local (não faz deploy)
- **main** - QA/Homologação no Render (faz deploy automático)

## Ambientes

### Desenvolvimento Local
- Branch: `develop`
- Arquivo de configuração: `.env.development`
- Deploy: Não
- Banco de dados: Local (PostgreSQL local)
- URL Backend: http://localhost:8000
- URL Frontend: http://localhost:3000 ou http://localhost:5173

### QA/Homologação (Render)
- Branch: `main`
- Arquivo de configuração: `.env.qa`
- Deploy: Automático quando push na main
- Banco de dados: Render PostgreSQL
- URL Backend: Configurada no Render
- URL Frontend: Configurada no Render

## Comandos do Dia a Dia

### Desenvolvimento Local (Commits diários - NÃO deploya)
```bash
# Certifique-se que está na branch develop
git checkout develop

# Verifique o status
git status

# Adicione as alterações
git add .

# Faça o commit
git commit -m "tipo: descrição da alteração"

# Envie para o GitHub
git push origin develop