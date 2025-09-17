# 🚀 Primeiros Passos - Docker Food Cost System

Guia rápido para inicializar o sistema Docker pela primeira vez.

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Validar Configuração
```bash
# Executar validação completa
python validate-docker-setup.py
```

### 2️⃣ Dar Permissões (Linux/Mac)
```bash
# Tornar script executável
chmod +x docker-scripts.sh
```

### 3️⃣ Configurar Ambiente
```bash
# Linux/Mac
./docker-scripts.sh setup

# Windows
.\docker-scripts.ps1 setup
```

### 4️⃣ Iniciar Sistema
```bash
# Linux/Mac
./docker-scripts.sh start

# Windows  
.\docker-scripts.ps1 start
```

### 5️⃣ Verificar Status
```bash
# Verificar se todos os serviços estão rodando
./docker-scripts.sh status
```

## 🌐 Acessar Sistema

Após inicialização bem-sucedida:

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost | Interface principal |
| **API Backend** | http://localhost:8000 | API REST |
| **API Docs** | http://localhost:8000/docs | Documentação |
| **ReDoc** | http://localhost:8000/redoc | Docs alternativa |

## 🔍 Solução de Problemas Comuns

### Problema: Erro "port already in use"
```bash
# Verificar o que está usando a porta
netstat -tulpn | grep :80
netstat -tulpn | grep :8000

# Parar processos conflitantes ou alterar portas no .env
```

### Problema: Container não inicia
```bash
# Ver logs para diagnóstico
./docker-scripts.sh logs

# Ver logs de serviço específico
./docker-scripts.sh logs backend
./docker-scripts.sh logs frontend
./docker-scripts.sh logs database
```

### Problema: Erro de banco de dados
```bash
# Verificar se PostgreSQL iniciou corretamente
./docker-scripts.sh logs database

# Recriar volume do banco se necessário
docker-compose down -v
docker volume rm foodcost_postgres_data
./docker-scripts.sh start
```

### Problema: Erro de build
```bash
# Limpar cache e rebuildar
docker-compose down
docker system prune -f
./docker-scripts.sh build
./docker-scripts.sh start
```

## 📋 Checklist de Verificação

Após a primeira inicialização, verifique:

- [ ] **Validação passou** sem erros críticos
- [ ] **Todos os containers** estão rodando (`docker-compose ps`)
- [ ] **Frontend** carrega em http://localhost
- [ ] **Backend** responde em http://localhost:8000/health
- [ ] **API Docs** acessível em http://localhost:8000/docs
- [ ] **Logs** não mostram erros críticos

## 🛠️ Comandos Essenciais

### Controle Básico
```bash
# Iniciar sistema
./docker-scripts.sh start

# Parar sistema
./docker-scripts.sh stop

# Reiniciar sistema
./docker-scripts.sh restart

# Ver status
./docker-scripts.sh status
```

### Monitoramento
```bash
# Ver logs em tempo real
./docker-scripts.sh logs

# Ver logs de serviço específico
./docker-scripts.sh logs backend

# Ver uso de recursos
docker stats
```

### Manutenção
```bash
# Backup do banco
./docker-scripts.sh backup

# Reset completo (CUIDADO!)
./docker-scripts.sh reset
```

## 🔧 Configurações Personalizadas

### Alterar Portas
Edite o arquivo `.env`:
```bash
# Alterar porta do frontend
FRONTEND_PORT=3000

# Alterar porta do backend  
BACKEND_PORT=8080
```

### Configurar CORS
Para acesso de outros domínios, edite `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80,http://192.168.1.100:3000
```

### Configurar Banco Externo
Para usar PostgreSQL externo, edite `.env`:
```bash
DATABASE_URL=postgresql://user:pass@external-host:5432/database
```

## 🚀 Próximos Passos

Após sistema funcionando:

1. **Configurar Sistema de IA**
   ```bash
   # Entrar no container do backend
   docker-compose exec backend bash
   
   # Executar setup da IA
   python setup_ia.py
   
   # Testar sistema de IA
   python teste_sistema_ia.py
   ```

2. **Popular Dados Iniciais**
   ```bash
   # Criar tabelas
   docker-compose exec backend python create_tables.py
   
   # Popular taxonomias
   docker-compose exec backend python popular_taxonomias_gerais.py
   ```

3. **Configurar Ambiente de Desenvolvimento**
   - Instalar extensões do VS Code recomendadas
   - Configurar debugger para containers
   - Configurar hot reload

4. **Backup e Monitoramento**
   ```bash
   # Configurar backup automático
   crontab -e
   # Adicionar linha para backup diário
   0 2 * * * /path/to/project/docker-scripts.sh backup
   ```

## 📞 Suporte

### Logs Importantes
```bash
# Logs completos do sistema
./docker-scripts.sh logs > logs-sistema.txt

# Informações do Docker
docker system info > docker-info.txt

# Lista de containers
docker-compose ps > containers-status.txt
```

### Comandos de Diagnóstico
```bash
# Verificar imagens
docker images | grep foodcost

# Verificar volumes
docker volume ls | grep foodcost

# Verificar redes
docker network ls | grep foodcost

# Verificar uso de recursos
docker system df
```

---

## 🎉 Sistema Configurado!

Se chegou até aqui sem erros, seu ambiente Docker está funcionando perfeitamente!

**Desenvolvedor**: Will - IOGAR  
**Data**: 17/09/2025  
**Sistema**: Food Cost System v1.0