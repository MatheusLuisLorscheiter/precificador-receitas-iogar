# Backend - Precificador de Receitas

Sistema de precificação de receitas multi-tenant em Go com PostgreSQL, Redis e MinIO.

## 🚀 Tecnologias

- **Go 1.22**
- **PostgreSQL** com pgx/v5
- **Redis** para cache
- **MinIO** para armazenamento de arquivos
- **JWT** para autenticação
- **Prometheus** para métricas
- **Zerolog** para logging estruturado

## 📦 Dependências

```bash
cd backend
go mod download
```

## ⚙️ Configuração

Crie um arquivo `.env` baseado em `.env.example`:

```env
# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
METRICS_PORT=9090

# Database
DATABASE_URL=postgres://user:password@localhost:5432/precificador?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=uploads

# Auth
JWT_SECRET=sua-chave-secreta-muito-forte-aqui
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h
PASSWORD_PEPPER=outro-segredo-para-senhas

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM_NAME=Precificador
SMTP_FROM_EMAIL=noreply@precificador.com

# Rate Limiting
RATE_LIMIT_RPS=10
RATE_LIMIT_BURST=20

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://precificador.com

# Environment
ENVIRONMENT=development
LOG_LEVEL=debug
```

## 🗄️ Migrações

Execute as migrações do banco de dados:

```bash
cd backend
go run cmd/migrate/main.go
```

## 🏃 Desenvolvimento

```bash
cd backend
go run cmd/server/main.go
```

API disponível em: http://localhost:8080

Métricas Prometheus: http://localhost:9090/metrics

## 🏗️ Build

```bash
cd backend
go build -o bin/server cmd/server/main.go
go build -o bin/migrate cmd/migrate/main.go
```

## 🐳 Docker

```bash
# Build
docker build -t precificador-backend .

# Run
docker run -p 8080:8080 --env-file .env precificador-backend
```

## 📂 Estrutura

```
backend/
├── cmd/
│   ├── server/          # HTTP server
│   └── migrate/         # Database migrations
├── internal/
│   ├── auth/            # JWT, password hashing
│   ├── cache/           # Redis client
│   ├── config/          # Configuration
│   ├── database/        # PostgreSQL client
│   ├── domain/          # Domain models
│   ├── http/
│   │   ├── handlers/    # HTTP handlers
│   │   ├── middleware/  # Middlewares
│   │   └── router/      # Route setup
│   ├── logger/          # Structured logging
│   ├── mailer/          # Email sending
│   ├── metrics/         # Prometheus metrics
│   ├── pricing/         # Pricing calculations
│   ├── rate/            # Rate limiting
│   ├── repository/      # Database queries
│   ├── service/         # Business logic
│   └── storage/         # MinIO client
└── migrations/          # SQL migrations
```

## 🔐 Segurança

- **Multi-tenant**: Isolamento por `tenant_id` em todas as queries
- **JWT**: Access token (15min) + Refresh token (7 dias)
- **CORS**: Configurável via env
- **Rate Limiting**: Por IP
- **Bcrypt + Pepper**: Para senhas
- **HTTPS**: Recomendado em produção
- **Security Headers**: CSP, HSTS, X-Frame-Options

## 🔄 Endpoints

### Autenticação
- `POST /api/auth/register` - Criar tenant + admin
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/forgot-password` - Solicitar reset
- `POST /api/auth/reset-password` - Resetar senha
- `GET /api/auth/me` - Dados do usuário logado

### Ingredientes (Protected)
- `GET /api/ingredients` - Listar
- `POST /api/ingredients` - Criar
- `GET /api/ingredients/:id` - Buscar por ID
- `PUT /api/ingredients/:id` - Atualizar
- `DELETE /api/ingredients/:id` - Deletar

### Receitas (Protected)
- `GET /api/recipes` - Listar
- `POST /api/recipes` - Criar
- `GET /api/recipes/:id` - Buscar por ID
- `PUT /api/recipes/:id` - Atualizar
- `DELETE /api/recipes/:id` - Deletar
- `POST /api/recipes/:id/items` - Adicionar item
- `DELETE /api/recipes/:id/items/:item_id` - Remover item

### Produtos (Protected)
- `GET /api/products` - Listar
- `POST /api/products` - Criar
- `GET /api/products/:id` - Buscar por ID
- `PUT /api/products/:id` - Atualizar
- `DELETE /api/products/:id` - Deletar

### Saúde
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /metrics` - Prometheus metrics

## 📊 Monitoramento

Métricas disponíveis no Prometheus:

- HTTP request duration
- HTTP request count
- Active connections
- Database connections
- Redis operations
- Cache hit/miss rate

## 🧪 Testes

```bash
cd backend
go test ./...
```

## 🚀 Deploy

### Nixpacks (Railway, Render, etc)

O projeto está configurado para deploy com Nixpacks. Basta conectar o repositório.

### Manual

1. Build: `go build -o app cmd/server/main.go`
2. Migrar: `./migrate`
3. Executar: `./app`

### Variáveis de Ambiente

Certifique-se de configurar todas as variáveis do `.env.example` no ambiente de produção.

## 📝 Notas de Desenvolvimento

- Sempre adicione `tenant_id` em queries de repository
- Use `requestctx.GetTenantID(ctx)` para obter tenant do JWT
- Handlers não devem ter lógica de negócio (use services)
- Services não devem saber de HTTP (use domain models)
- Repositories retornam domain models, não DTOs
