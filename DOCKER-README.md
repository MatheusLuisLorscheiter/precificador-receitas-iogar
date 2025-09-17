# 🐳 Docker - Food Cost System

Documentação completa para configuração e uso do Docker no Food Cost System.

## 📋 Pré-requisitos

- ✅ **Docker Desktop** instalado e funcionando
- ✅ **Git** para controle de versão
- ✅ **VS Code** com extensão Container Tools (recomendado)

## 🚀 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações (IMPORTANTE!)
# Altere as senhas e chaves secretas antes de usar
```

### 2. Scripts de Automação

#### Para Linux/Mac:
```bash
# Dar permissão de execução
chmod +x docker-scripts.sh

# Configurar ambiente
./docker-scripts.sh setup
```

#### Para Windows:
```powershell
# Executar no PowerShell
.\docker-scripts.ps1 setup
```

## 🛠️ Comandos Principais

### Iniciar Sistema Completo
```bash
# Linux/Mac
./docker-scripts.sh start

# Windows
.\docker-scripts.ps1 start

# Ou manualmente
docker-compose up -d
```

### Parar Sistema
```bash
# Linux/Mac
./docker-scripts.sh stop

# Windows  
.\docker-scripts.ps1 stop

# Ou manualmente
docker-compose down
```

### Build das Imagens
```bash
# Linux/Mac
./docker-scripts.sh build

# Windows
.\docker-scripts.ps1 build

# Ou manualmente
docker-compose build --no-cache
```

## 🌐 Acessos do Sistema

Após iniciar o sistema, os serviços estarão disponíveis em:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost | Interface principal do sistema |
| **Backend API** | http://localhost:8000 | API REST do sistema |
| **API Docs** | http://localhost:8000/docs | Documentação Swagger |
| **PostgreSQL** | localhost:5432 | Banco de dados principal |
| **Redis** | localhost:6379 | Cache e sessões |

## 📊 Monitoramento

### Ver Status dos Serviços
```bash
# Com scripts
./docker-scripts.sh status

# Manualmente
docker-compose ps
```

### Ver Logs
```bash
# Todos os serviços
./docker-scripts.sh logs

# Serviço específico
./docker-scripts.sh logs backend

# Ou manualmente
docker-compose logs -f [nome_do_serviço]
```

### Health Checks
O sistema possui health checks automáticos:
- **Database**: Verifica conexão PostgreSQL
- **Redis**: Testa comandos básicos
- **Backend**: Endpoint `/health`
- **Frontend**: Endpoint `/health`

## 💾 Backup e Restore

### Criar Backup
```bash
# Usando script (recomendado)
./docker-scripts.sh backup

# Manualmente
docker-compose exec database pg_dump -U foodcost_user foodcost_db > backup.sql
```

### Restaurar Backup
```bash
# Parar sistema
docker-compose down

# Remover volume do banco
docker volume rm foodcost_postgres_data

# Reiniciar sistema
docker-compose up -d

# Aguardar inicialização e restaurar
docker-compose exec -T database psql -U foodcost_user -d foodcost_db < backup.sql
```

## 🔧 Solução de Problemas

### Problema: Containers não iniciam
```bash
# Verificar logs para identificar erro
docker-compose logs

# Rebuild completo
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problema: Erro de permissão (Linux)
```bash
# Ajustar permissões
sudo chown -R $USER:$USER .
chmod +x docker-scripts.sh
```

### Problema: Porta já em uso
```bash
# Verificar processos usando as portas
netstat -tulpn | grep :80
netstat -tulpn | grep :8000
netstat -tulpn | grep :5432

# Alterar portas no arquivo .env se necessário
```

### Reset Completo (CUIDADO!)
```bash
# Remove TODOS os dados e containers
./docker-scripts.sh reset

# Ou manualmente
docker-compose down -v --remove-orphans
docker system prune -a --volumes
```

## 🏗️ Estrutura do Projeto Docker

```
projeto/
├── docker-compose.yml          # Orquestração principal
├── .env                        # Variáveis de ambiente
├── .env.example                # Template de configuração
├── docker-scripts.sh           # Scripts Linux/Mac
├── docker-scripts.ps1          # Scripts Windows
├── DOCKER-README.md            # Esta documentação
├── backend/
│   ├── Dockerfile             # Container do backend
│   ├── requirements.txt       # Dependências Python
│   ├── requirements-ia.txt    # Dependências IA
│   └── app/                   # Código da aplicação
└── frontend/
    ├── Dockerfile             # Container do frontend  
    ├── nginx.conf             # Configuração Nginx
    ├── package.json           # Dependências Node.js
    └── src/                   # Código React
```

## 🔒 Configurações de Segurança

### Para Produção
1. **Alterar todas as senhas** no arquivo `.env`
2. **Gerar SECRET_KEY segura**: 
   ```bash
   openssl rand -base64 32
   ```
3. **Configurar CORS** adequadamente
4. **Usar HTTPS** com certificados SSL
5. **Configurar firewall** adequadamente

### Variáveis Críticas para Alterar
- `SECRET_KEY`
- `DB_PASSWORD`  
- `REDIS_PASSWORD`
- `ALLOWED_ORIGINS`

## 📈 Performance

### Otimizações Implementadas
- ✅ Multi-stage builds para imagens menores
- ✅ Health checks para monitoramento
- ✅ Volumes persistentes para dados
- ✅ Cache de dependências Docker
- ✅ Compressão gzip no Nginx
- ✅ Usuários não-root para segurança

### Monitorar Recursos
```bash
# Ver uso de recursos
docker stats

# Ver uso de volumes
docker system df
```

## 🆘 Suporte

### Comandos Úteis de Diagnóstico
```bash
# Ver informações do sistema Docker
docker system info

# Ver imagens disponíveis
docker images

# Ver volumes
docker volume ls

# Ver redes
docker network ls

# Limpar recursos não utilizados
docker system prune
```

### Logs Detalhados
```bash
# Backend com detalhes
docker-compose logs --details backend

# Todos os serviços com timestamps
docker-compose logs -t
```

---

## 📞 Suporte Técnico

**Desenvolvedor**: Will - IOGAR  
**Data**: 17/09/2025  
**Versão Docker**: Configuração inicial v1.0  

Para problemas ou dúvidas, verifique:

1. **Logs do sistema** primeiro
2. **Documentação oficial Docker**
3. **Issues do projeto** no GitHub
4. **Status dos serviços** com `docker-compose ps`

---

## 🔄 Workflow Recomendado

### Desenvolvimento Diário
```bash
# 1. Iniciar desenvolvimento
./docker-scripts.sh start

# 2. Ver logs durante desenvolvimento
./docker-scripts.sh logs

# 3. Fazer alterações no código (hot reload ativo)

# 4. Reiniciar serviço específico se necessário
docker-compose restart backend

# 5. Parar no final do dia
./docker-scripts.sh stop
```

### Deploy/Atualização
```bash
# 1. Parar sistema atual
./docker-scripts.sh stop

# 2. Atualizar código (git pull)

# 3. Rebuild se houver mudanças no Dockerfile
./docker-scripts.sh build

# 4. Iniciar com nova versão
./docker-scripts.sh start

# 5. Verificar status
./docker-scripts.sh status
```

## 🧪 Ambiente de Testes

### Executar Testes do Backend
```bash
# Executar testes dentro do container
docker-compose exec backend python -m pytest

# Executar teste específico
docker-compose exec backend python -m pytest tests/test_api.py

# Executar testes de IA
docker-compose exec backend python teste_sistema_ia.py
```

### Executar Testes do Frontend
```bash
# Executar testes React
docker-compose exec frontend npm test

# Executar lint
docker-compose exec frontend npm run lint
```

## 🔧 Customizações Avançadas

### Adicionar Novo Serviço
Para adicionar um novo serviço ao `docker-compose.yml`:

```yaml
# Exemplo: Adicionar MongoDB
mongo:
  image: mongo:6-alpine
  container_name: foodcost-mongo
  restart: unless-stopped
  environment:
    MONGO_INITDB_DATABASE: foodcost_mongo
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
  volumes:
    - mongo_data:/data/db
  ports:
    - "27017:27017"
  networks:
    - foodcost-network
```

### Configuração de SSL (HTTPS)
Para ambiente de produção com SSL:

1. **Obter certificados SSL**
2. **Modificar nginx.conf**:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    # ... resto da configuração
}
```

### Múltiplos Ambientes
Criar arquivos específicos:
- `docker-compose.dev.yml` - Desenvolvimento
- `docker-compose.prod.yml` - Produção
- `docker-compose.test.yml` - Testes

```bash
# Usar ambiente específico
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## 📊 Métricas e Monitoramento

### Adicionar Prometheus + Grafana
```yaml
# Em docker-compose.yml
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  volumes:
    - grafana_data:/var/lib/grafana
```

### Logs Centralizados
Para logs centralizados, considere adicionar ELK Stack:
- **Elasticsearch**: Armazenamento de logs
- **Logstash**: Processamento de logs  
- **Kibana**: Visualização de logs

## 🚀 Otimizações de Produção

### 1. Configurações de Memória
```yaml
# Em docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### 2. Scaling Horizontal
```bash
# Escalar serviço específico
docker-compose up -d --scale backend=3

# Usar load balancer (nginx)
# Configurar upstream no nginx.conf
```

### 3. Cache Redis Distribuído
```yaml
redis-cluster:
  image: redis:7-alpine
  command: redis-server --cluster-enabled yes
  # ... configuração de cluster
```

## 🛡️ Backup Avançado

### Script de Backup Automatizado
```bash
#!/bin/bash
# backup-automatico.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup do PostgreSQL
docker-compose exec -T database pg_dump -U foodcost_user foodcost_db | gzip > "$BACKUP_DIR/postgres_$DATE.sql.gz"

# Backup dos volumes de dados
docker run --rm -v foodcost_ai_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/ai_data_$DATE.tar.gz /data

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### Restauração Automatizada
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore.sh backup_file.sql.gz"
    exit 1
fi

# Parar aplicação
docker-compose down

# Restaurar backup
zcat $BACKUP_FILE | docker-compose exec -T database psql -U foodcost_user -d foodcost_db

# Iniciar aplicação
docker-compose up -d
```

## 📋 Checklist de Produção

### Antes do Deploy
- [ ] Todas as senhas alteradas no `.env`
- [ ] SSL/HTTPS configurado
- [ ] CORS configurado adequadamente  
- [ ] Backup automatizado configurado
- [ ] Monitoramento configurado
- [ ] Logs centralizados
- [ ] Firewall configurado
- [ ] Health checks funcionando
- [ ] Recursos limitados adequadamente
- [ ] Testes passando

### Pós Deploy
- [ ] Verificar todos os serviços rodando
- [ ] Testar endpoints principais
- [ ] Verificar conectividade do banco
- [ ] Confirmar backups funcionando
- [ ] Monitorar logs por problemas
- [ ] Testar health checks
- [ ] Verificar performance

---

**🎉 Configuração Docker Completa!**

O sistema está pronto para desenvolvimento e produção. Use os scripts de automação para facilitar o gerenciamento diário do ambiente Docker.