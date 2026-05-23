# CNPJ SaaS - Guia de White Label

## 🎨 Visão Geral

O CNPJ SaaS suporta customização completa de branding para resellers. Cada tenant pode personalizar cores, logo, domínio e nome da plataforma.

## 🔑 Criando um Tenant White Label

### Via API

```bash
# Criar novo tenant
curl -X POST http://localhost:3000/api/admin/tenants \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Empresa CNPJ",
    "email": "admin@minhaempresa.com",
    "slug": "minhaempresa",
    "plan": "white-label"
  }'
```

### Via Dashboard Admin

1. Acessar `/admin/tenants`
2. Clicar em "Novo Tenant"
3. Preencher informações
4. Salvar

## 🎯 Customização de Branding

### Cores

```typescript
// Frontend - Aplicar cores dinamicamente
import { useTenantStore } from '@/stores/tenantStore';

const { tenant } = useTenantStore();

// CSS
<div style={{
  backgroundColor: tenant?.primaryColor,
  color: tenant?.secondaryColor
}}>
  Conteúdo customizado
</div>
```

### Logo

```typescript
// Exibir logo customizado
<img 
  src={tenant?.logoUrl} 
  alt={tenant?.name}
  className="h-10"
/>
```

### Domínio Customizado

```bash
# Configurar DNS
# Apontar seu domínio para o servidor
# Exemplo: cnpj.minhaempresa.com → seu-servidor.com

# Nginx - Configurar virtual host
server {
    server_name cnpj.minhaempresa.com;
    # ... resto da configuração
}
```

## 📦 Distribuindo para Resellers

### Passo 1: Preparar Docker Image

```bash
# Compilar backend sem código-fonte
npm run build
npm run pkg

# Resultado: binário executável `cnpj-saas-backend`

# Build imagem Docker
docker build -t cnpj-saas:v1.0.0 .

# Push para registry privado
docker tag cnpj-saas:v1.0.0 seu-registry.com/cnpj-saas:v1.0.0
docker push seu-registry.com/cnpj-saas:v1.0.0
```

### Passo 2: Gerar Licença para Reseller

```bash
# Obter IP do reseller
IP_RESELLER="192.168.1.100"

# Criar licença
curl -X POST http://localhost:3000/api/admin/licenses/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-uuid",
    "ipAddress": "'$IP_RESELLER'",
    "plan": "white-label",
    "validDays": 365,
    "hostname": "cnpj.minhaempresa.com"
  }'

# Resposta:
# {
#   "licenseKey": "LIC-ABC123DEF456",
#   "validUntil": "2027-05-20T00:00:00Z"
# }
```

### Passo 3: Entregar ao Reseller

Forneça ao reseller:

1. **Docker Image**
   ```bash
   docker pull seu-registry.com/cnpj-saas:v1.0.0
   ```

2. **docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     cnpj-saas:
       image: seu-registry.com/cnpj-saas:v1.0.0
       ports:
         - "3000:3000"
       environment:
         LICENSE_KEY: LIC-ABC123DEF456
         LICENSE_API_URL: https://api.seu-dominio.com
         TENANT_NAME: "Minha Empresa CNPJ"
         TENANT_PRIMARY_COLOR: "#FF6B6B"
         TENANT_SECONDARY_COLOR: "#4ECDC4"
   ```

3. **Guia de Instalação**
   - Instruções passo a passo
   - Requisitos de sistema
   - Suporte técnico

## 🔒 Proteção contra Engenharia Reversa

### Binário Compilado

```bash
# O backend é compilado com `pkg` em um binário
# Impossível extrair código-fonte
npm run pkg

# Resultado: arquivo executável `cnpj-saas-backend`
# Não contém código-fonte legível
```

### Validação de Licença Online

```typescript
// Toda requisição valida licença com servidor central
async validateLicense(request: LicenseValidationRequest) {
  const result = await query(
    `SELECT * FROM licenses 
     WHERE license_key = $1 AND ip_address = $2 
     AND is_active = true AND valid_until > NOW()`
  );
  
  if (result.rows.length === 0) {
    throw new Error('Licença inválida');
  }
  
  return result.rows[0];
}
```

### Detecção de Modificações

```bash
# Checksum de integridade
sha256sum cnpj-saas-backend > checksum.txt

# Verificar integridade
sha256sum -c checksum.txt

# Se falhar, arquivo foi modificado
```

## 💰 Modelo de Preço

### Opções de Cobrança

1. **Licença Mensal Fixa**
   - R$ 50/mês por reseller
   - Renovação automática
   - Suporte técnico incluído

2. **Licença Anual com Desconto**
   - R$ 500/ano (desconto de 16%)
   - Renovação manual
   - Suporte prioritário

3. **Modelo Híbrido**
   - Licença base: R$ 50/mês
   - Usuários adicionais: R$ 10/mês cada
   - Consultas extras: R$ 0.01 por consulta acima do limite

## 📊 Dashboard de Reseller

Cada reseller tem acesso a:

- **Estatísticas de Uso**
  - Total de consultas
  - Usuários ativos
  - Taxa de sucesso

- **Gerenciamento de Usuários**
  - Criar/editar/deletar usuários
  - Definir permissões
  - Resetar senhas

- **Histórico de Consultas**
  - Filtrar por período
  - Exportar relatórios
  - Análise de tendências

- **Configurações**
  - Atualizar branding
  - Gerenciar domínio
  - Configurar integrações

## 🔗 Integrações

### Webhook para Notificações

```bash
# Configurar webhook
curl -X POST http://localhost:3000/api/webhooks \
  -H "Authorization: Bearer {token}" \
  -d '{
    "url": "https://minhaempresa.com/webhook",
    "events": ["query.success", "query.error", "license.expiring"]
  }'

# Evento recebido
POST https://minhaempresa.com/webhook
{
  "event": "query.success",
  "data": {
    "cnpj": "33000167000101",
    "timestamp": "2026-05-20T10:30:00Z"
  }
}
```

### API para Resellers

```bash
# Consultar CNPJ
curl -X POST https://cnpj.minhaempresa.com/api/cnpj/query \
  -H "Authorization: Bearer {token}" \
  -d '{"cnpj": "33000167000101"}'

# Obter histórico
curl https://cnpj.minhaempresa.com/api/cnpj/history \
  -H "Authorization: Bearer {token}"

# Obter estatísticas
curl https://cnpj.minhaempresa.com/api/cnpj/stats \
  -H "Authorization: Bearer {token}"
```

## 📞 Suporte ao Reseller

### Canais de Suporte

1. **Email**: support@seu-dominio.com
2. **Chat**: Integração com Intercom/Zendesk
3. **Documentação**: Wiki privada
4. **Telefone**: Suporte prioritário para Enterprise

### SLA

- **Resposta**: 24 horas
- **Resolução**: 72 horas
- **Uptime**: 99.9%

## 🚀 Roadmap

- [ ] Customização de templates de email
- [ ] Temas escuros/claros
- [ ] Integrações com CRM
- [ ] Relatórios avançados
- [ ] API GraphQL
- [ ] Webhooks em tempo real
