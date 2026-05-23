# CNPJ SaaS - Backend

Sistema SaaS completo para consulta de CNPJ com suporte a White Label, sistema de licenciamento por IP e múltiplos usuários.

## 🚀 Características

- **Autenticação JWT** — Login seguro com tokens JWT
- **Licenciamento por IP** — Validação online de licenças vinculadas ao IP
- **Multi-tenant** — Suporte a múltiplos clientes/resellers
- **White Label** — Customização de branding (logo, cores, domínio)
- **API de CNPJ** — Integração com API pública de CNPJ
- **Histórico de Consultas** — Rastreamento completo de todas as buscas
- **Dashboard Stats** — Estatísticas de uso em tempo real
- **Rate Limiting** — Proteção contra abuso de API
- **Docker Ready** — Pronto para deploy em containers

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose (opcional)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/cnpj-saas.git
cd cnpj-saas
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 4. Inicie o banco de dados

#### Opção A: Docker Compose (recomendado)

```bash
docker-compose up -d
```

#### Opção B: PostgreSQL local

```bash
# Crie o banco de dados
createdb cnpj_saas

# Execute o schema
psql cnpj_saas < Database/schema.sql
psql cnpj_saas < Database/seed.sql
```

### 5. Inicie o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 📚 Documentação da API

### Autenticação

#### Registrar novo usuário

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "tenant-uuid"
}
```

#### Fazer login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "tenantId": "tenant-uuid"
}
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "user"
    },
    "expiresIn": 604800
  }
}
```

### Consulta CNPJ

#### Realizar consulta

```bash
POST /api/cnpj/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "cnpj": "33.000.167/0001-01"
}
```

#### Obter histórico

```bash
GET /api/cnpj/history?page=1&limit=20
Authorization: Bearer {token}
```

#### Obter estatísticas

```bash
GET /api/cnpj/stats?days=30
Authorization: Bearer {token}
```

#### Obter dashboard

```bash
GET /api/cnpj/dashboard
Authorization: Bearer {token}
```

### Licenças

#### Validar licença

```bash
POST /api/licenses/validate
Content-Type: application/json

{
  "licenseKey": "LIC-XXXXX",
  "ipAddress": "192.168.1.1",
  "hostname": "server.example.com"
}
```

#### Listar licenças do tenant

```bash
GET /api/licenses/me?page=1&limit=20
Authorization: Bearer {token}
```

#### Obter estatísticas de licença

```bash
GET /api/licenses/{licenseId}/stats
Authorization: Bearer {token}
```

## 🔐 Segurança

- **Senhas com hash bcrypt** — Senhas armazenadas com salt 10
- **JWT com expiração** — Tokens expiram em 7 dias
- **Rate limiting** — Limite de 100 requisições por 15 minutos
- **CORS configurável** — Apenas origens permitidas
- **Helmet.js** — Headers de segurança HTTP
- **Validação de entrada** — Joi para validação de dados

## 🐳 Docker

### Build da imagem

```bash
docker build -t cnpj-saas:latest .
```

### Executar container

```bash
docker run -p 3000:3000 --env-file .env cnpj-saas:latest
```

### Docker Compose

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Logs
docker-compose logs -f backend
```

## 📦 Compilação para Produção

Para criar um binário executável (sem código-fonte visível):

```bash
npm run build
npm run pkg
```

Isso gerará um arquivo `cnpj-saas-backend` que pode ser executado diretamente.

## 🗄️ Estrutura do Banco de Dados

### Tabelas principais

- **tenants** — Clientes/Resellers
- **licenses** — Licenças por IP
- **users** — Usuários de cada tenant
- **query_history** — Histórico de consultas CNPJ
- **usage_stats** — Estatísticas diárias
- **plans** — Planos de preço
- **subscriptions** — Assinaturas ativas
- **payments** — Registro de pagamentos
- **audit_logs** — Log de auditoria

## 🚀 Deploy

### Em VPS com Docker

1. Clone o repositório na VPS
2. Configure as variáveis de ambiente
3. Execute `docker-compose up -d`
4. Configure Nginx como reverse proxy

### Exemplo de configuração Nginx

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📝 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `NODE_ENV` | Ambiente (development/production) | development |
| `PORT` | Porta do servidor | 3000 |
| `DATABASE_URL` | URL de conexão PostgreSQL | - |
| `JWT_SECRET` | Chave secreta JWT | - |
| `LICENSE_SECRET_KEY` | Chave secreta para licenças | - |
| `CNPJ_API_URL` | URL da API de CNPJ | https://publica.cnpj.ws/cnpj |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe | - |
| `RATE_LIMIT_WINDOW` | Janela de rate limit (ms) | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Máx requisições por janela | 100 |

## 📄 Licença

Proprietário - Desenvolvido para Atendo Sistemas

## 🤝 Suporte

Para suporte técnico, entre em contato com seu provedor de serviço.
