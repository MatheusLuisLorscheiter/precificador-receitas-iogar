# Fluxo de Trabalho - Git Branches e Ambientes

## Estrutura de Branches

- **develop** - Desenvolvimento local (não faz deploy)
- **staging** - Ambiente de testes/validação no Render (deploy automático)
- **main** - Produção/QA no Render (deploy automático)

## Ambientes

### Desenvolvimento Local
- Branch: `develop`
- Arquivo de configuração: `.env.development`
- Deploy: Não
- Banco de dados: Local (PostgreSQL local)
- URL Backend: http://localhost:8000
- URL Frontend: http://localhost:3000 ou http://localhost:5173

### Staging/Testes (Render)
- Branch: `staging`
- Arquivo de configuração: `.env.staging`
- Deploy: Automático quando push na staging
- Banco de dados: Render PostgreSQL (separado da produção)
- URL Backend: https://food-cost-backend-staging.onrender.com (a configurar)
- URL Frontend: https://food-cost-frontend-staging.onrender.com (a configurar)

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
```

### Staging - Testar antes de produção
```bash
# Certifique-se que está na branch develop atualizada
git checkout develop
git pull origin develop

# Mude para staging e atualize com develop
git checkout staging
git merge develop

# Resolva conflitos se houver, então:
git add .
git commit -m "merge: atualizar staging com develop"

# Envie para o GitHub (trigger deploy automático no Render)
git push origin staging
```

### Promover Staging para Produção (Main)
```bash
# Depois de testar em staging, promover para main
git checkout main
git merge staging

# Envie para produção
git push origin main