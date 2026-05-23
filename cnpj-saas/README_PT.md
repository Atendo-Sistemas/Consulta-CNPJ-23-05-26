# 🇧🇷 CNPJ SaaS - Plataforma Completa de Consulta CNPJ

Sistema SaaS profissional para consulta de CNPJ com suporte a **White Label**, **licenciamento por IP**, **múltiplos usuários** e **proteção contra engenharia reversa**.

## ✨ Características Principais

### 🎯 Para Usuários Finais

- ✅ Consulta rápida e confiável de CNPJ

- ✅ Histórico de consultas

- ✅ Exportação de dados

- ✅ Dashboard com estatísticas

- ✅ Interface intuitiva e responsiva

### 🏢 Para Resellers

- ✅ White Label completo (logo, cores, domínio)

- ✅ Gerenciamento de usuários

- ✅ Relatórios e analytics

- ✅ API para integrações

- ✅ Suporte técnico dedicado

### 🔐 Segurança

- ✅ Autenticação JWT

- ✅ Licenciamento por IP com validação online

- ✅ Backend compilado (sem código-fonte)

- ✅ Rate limiting

- ✅ Proteção contra DDoS

- ✅ Criptografia de dados sensíveis

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - Dashboard                                                │
│  - Consulta CNPJ                                            │
│  - Gerenciamento de usuários                                │
│  - White Label (cores, logo, domínio)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────┐
│                Backend (Node.js)                            │
│  - API REST                                                 │
│  - Autenticação JWT                                         │
│  - Licenciamento por IP                                     │
│  - Integração com API de CNPJ                               │
│  - Rate limiting                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              PostgreSQL Database                            │
│  - Tenants                                                  │
│  - Licenses                                                 │
│  - Users                                                    │
│  - Query History                                            │
│  - Usage Stats                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Início Rápido

### Pré-requisitos

- Docker & Docker Compose

- PostgreSQL 12+

- Node.js 18+ (para desenvolvimento)

### Instalação Local

```bash
# 1. Clonar repositório
git clone https://github.com/SEU_USUARIO/cnpj-saas.git
cd cnpj-saas

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env

# 3. Iniciar com Docker Compose
docker-compose up -d

# 4. Acessar aplicação
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# Portainer: http://localhost:9000
```

### Credenciais de Demo

- **Email**: [admin@demo.local](mailto:admin@demo.local)

- **Senha**: qualquer valor

- **Tenant**: demo

## 📚 Documentação

- [**DEPLOYMENT.md**](./DEPLOYMENT.md) - Guia completo de deployment em produção

- [**WHITE_LABEL.md**](./WHITE_LABEL.md) - Guia de customização e distribuição

- [**README.md**](./README.md) - Documentação técnica do backend

## 🔧 Stack Tecnológico

### Backend

- **Node.js 18+** - Runtime JavaScript

- **Express.js** - Framework web

- **PostgreSQL** - Banco de dados

- **JWT** - Autenticação

- **Axios** - HTTP client

- **TypeScript** - Type safety

### Frontend

- **React 19** - UI framework

- **Vite** - Build tool

- **Tailwind CSS** - Styling

- **Zustand** - State management

- **React Router** - Routing

- **Axios** - HTTP client

### DevOps

- **Docker** - Containerização

- **Docker Compose** - Orquestração local

- **Nginx** - Reverse proxy

- **Let's Encrypt** - SSL/TLS

## 📊 Modelos de Negócio

### SaaS Direto

Usuários pagam por planos mensais:

- **Free**: 50 consultas/mês

- **Pro**: 1.000 consultas/mês + R$ 99/mês

- **Enterprise**: Ilimitado + R$ 499/mês

### White Label para Resellers

Resellers pagam **R$ 50/mês** por licença e podem:

- Cobrar seus próprios clientes

- Customizar completamente a plataforma

- Gerenciar usuários

- Acessar relatórios

### Modelo Híbrido

- Licença base: R$ 50/mês

- Usuários adicionais: R$ 10/mês

- Consultas extras: R$ 0.01 cada

## 🔐 Sistema de Licenciamento

### Validação por IP

```bash
# Cada reseller recebe uma licença vinculada ao IP
# Exemplo de licença:
LIC-ABC123DEF456

# Validação online obrigatória
# Se falhar por 3 dias consecutivos: bloqueio de acesso
```

### Proteção contra Cópia

1. **Backend compilado com pkg** - Sem código-fonte visível

1. **Validação online** - Impossível usar sem conexão

1. **Detecção de modificações** - Checksum de integridade

1. **Expiração de licença** - Renovação manual necessária

## 📈 Escalabilidade

### Suporta

- Múltiplos tenants

- Milhões de consultas

- Load balancing

- Cache distribuído

- Replicação de banco de dados

### Exemplo de Scale

```
1 servidor: ~1.000 consultas/min
3 servidores: ~3.000 consultas/min
10 servidores: ~10.000 consultas/min
```

## 🛠️ Desenvolvimento

### Estrutura de Pastas

```
cnpj-saas/
├── src/                    # Backend
│   ├── services/          # Lógica de negócio
│   ├── routes/            # Endpoints da API
│   ├── middleware/        # Middlewares
│   ├── config/            # Configurações
│   └── types/             # TypeScript types
├── client/                # Frontend
│   ├── src/
│   │   ├── pages/        # Páginas
│   │   ├── components/   # Componentes
│   │   ├── stores/       # Zustand stores
│   │   ├── lib/          # Utilitários
│   │   └── types/        # TypeScript types
│   └── index.html        # Entry point
├── Database/              # Scripts SQL
├── docker-compose.yml     # Orquestração
├── Dockerfile             # Imagem Docker
└── README.md              # Documentação
```

### Comandos Úteis

```bash
# Backend
npm run dev              # Desenvolvimento
npm run build            # Compilar TypeScript
npm run pkg              # Gerar binário executável
npm run check            # Verificar tipos

# Frontend
cd client
npm run dev              # Desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build

# Docker
docker-compose up -d     # Iniciar
docker-compose down      # Parar
docker-compose logs -f   # Ver logs
```

## 🧪 Testes

```bash
# Backend
npm test                 # Executar testes
npm run test:watch      # Watch mode

# Frontend
cd client
npm test                # Executar testes
npm run test:watch     # Watch mode
```

## 📝 API Endpoints

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário

- `POST /api/auth/login` - Fazer login

- `GET /api/auth/me` - Dados do usuário autenticado

- `PUT /api/auth/me` - Atualizar perfil

### CNPJ

- `POST /api/cnpj/query` - Consultar CNPJ

- `GET /api/cnpj/history` - Histórico de consultas

- `GET /api/cnpj/stats` - Estatísticas

- `GET /api/cnpj/dashboard` - Dashboard stats

### Licenças

- `POST /api/licenses/validate` - Validar licença

- `GET /api/licenses/me` - Minhas licenças

- `GET /api/licenses/:id/stats` - Stats da licença

- `POST /api/licenses/:id/renew` - Renovar licença

### Admin

- `GET /api/admin/stats` - Estatísticas globais

- `GET /api/admin/tenants` - Listar tenants

- `GET /api/admin/licenses` - Listar licenças

- `POST /api/admin/licenses/create` - Criar licença

## 🔄 Fluxo de Uso

### Para Usuário Final

1. Acessar plataforma

1. Fazer login

1. Consultar CNPJ

1. Ver resultados

1. Exportar dados (opcional)

### Para Reseller

1. Receber licença

1. Instalar na VPS

1. Customizar branding

1. Criar usuários

1. Gerenciar acesso

1. Monitorar uso

## 🚨 Troubleshooting

### Problema: Licença inválida

```bash
# Verificar IP
curl http://localhost:3000/api/licenses/validate \
  -d '{"licenseKey":"LIC-XXX","ipAddress":"192.168.1.1"}'
```

### Problema: Banco não conecta

```bash
# Verificar logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Problema: Limite de requisições atingido

```bash
# Aumentar limite em .env
RATE_LIMIT_MAX_REQUESTS=500
```

## 📞 Suporte

- **Email**: [support@seu-dominio.com](mailto:support@seu-dominio.com)

- **Documentação**: [https://docs.seu-dominio.com](https://docs.seu-dominio.com)

- **Issues**: GitHub Issues

- **Chat**: Discord/Slack (para clientes Enterprise )

## 📄 Licença

Proprietário - Desenvolvido para Atendo Sistemas

## 🙏 Agradecimentos

- [Express.js](https://expressjs.com/)

- [React](https://react.dev/)

- [PostgreSQL](https://www.postgresql.org/)

- [Docker](https://www.docker.com/)

- [Tailwind CSS](https://tailwindcss.com/)

---

**Desenvolvido com ❤️ por Atendo Sistemas**

