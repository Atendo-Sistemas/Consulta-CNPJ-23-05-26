# CNPJ SaaS - Guia de Deployment

## 🚀 Visão Geral

Este documento descreve como fazer deploy do CNPJ SaaS em sua VPS usando Docker e Portainer.

## 📋 Pré-requisitos

- VPS com Docker instalado
- Portainer instalado e configurado
- Domínio personalizado (opcional)
- Certificado SSL (recomendado)

## 🐳 Deployment com Docker Compose

### 1. Preparar a VPS

```bash
# SSH na VPS
ssh root@seu-servidor.com

# Criar diretório do projeto
mkdir -p /opt/cnpj-saas
cd /opt/cnpj-saas

# Clonar ou copiar os arquivos
git clone https://seu-repo/cnpj-saas .
# ou
scp -r cnpj-saas root@seu-servidor.com:/opt/
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Variáveis importantes:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://cnpj_user:SENHA_FORTE@postgres:5432/cnpj_saas
JWT_SECRET=GERAR_CHAVE_ALEATORIA_FORTE
LICENSE_SECRET_KEY=GERAR_CHAVE_ALEATORIA_FORTE
STRIPE_SECRET_KEY=sk_live_seu_key
```

### 3. Iniciar com Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f backend
```

### 4. Configurar Nginx como Reverse Proxy

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/cnpj-saas

# Adicionar configuração:
```

```nginx
upstream cnpj_backend {
    server localhost:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.seu-dominio.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.seu-dominio.com;

    # Certificados SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy para backend
    location / {
        proxy_pass http://cnpj_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "upgrade";
        proxy_set_header Upgrade $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/cnpj-saas /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 5. Gerar certificado SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --nginx -d api.seu-dominio.com

# Renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## 🔧 Deployment via Portainer

### 1. Acessar Portainer

```
https://seu-servidor.com:9443
```

### 2. Criar Stack

1. Ir para **Stacks** → **Add Stack**
2. Copiar conteúdo de `docker-compose.yml`
3. Configurar variáveis de ambiente
4. Deploy

### 3. Gerenciar Containers

- **Logs**: Visualizar logs em tempo real
- **Inspect**: Ver configurações do container
- **Restart**: Reiniciar serviços
- **Remove**: Deletar containers

## 📊 Monitoramento

### Verificar saúde do serviço

```bash
# Health check
curl http://localhost:3000/health

# Logs do backend
docker-compose logs backend

# Logs do banco de dados
docker-compose logs postgres

# Uso de recursos
docker stats
```

### Backup do banco de dados

```bash
# Backup manual
docker-compose exec postgres pg_dump -U cnpj_user cnpj_saas > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U cnpj_user cnpj_saas < backup.sql

# Backup automático (cron)
0 2 * * * cd /opt/cnpj-saas && docker-compose exec -T postgres pg_dump -U cnpj_user cnpj_saas > /backups/cnpj_saas_$(date +\%Y\%m\%d).sql
```

## 🔐 Segurança

### Checklist de segurança

- [ ] Alterar senhas padrão
- [ ] Configurar firewall
- [ ] Ativar SSL/TLS
- [ ] Configurar backups automáticos
- [ ] Monitorar logs de erro
- [ ] Atualizar dependências regularmente
- [ ] Configurar rate limiting
- [ ] Habilitar CORS apenas para domínios confiáveis

### Firewall (UFW)

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir Portainer
sudo ufw allow 9443/tcp

# Ativar firewall
sudo ufw enable
```

## 🚨 Troubleshooting

### Problema: Container não inicia

```bash
# Verificar logs
docker-compose logs backend

# Verificar porta em uso
sudo lsof -i :3000

# Reconstruir imagem
docker-compose build --no-cache
docker-compose up -d
```

### Problema: Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs do PostgreSQL
docker-compose logs postgres

# Reiniciar banco
docker-compose restart postgres
```

### Problema: Licença inválida

```bash
# Validar licença manualmente
curl -X POST http://localhost:3000/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "LIC-XXXXX",
    "ipAddress": "192.168.1.1"
  }'
```

## 📈 Escalabilidade

### Aumentar recursos

```bash
# Editar docker-compose.yml
nano docker-compose.yml

# Aumentar limite de memória
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### Load balancing

Para múltiplas instâncias, configure um load balancer (Nginx, HAProxy):

```nginx
upstream cnpj_backend {
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

## 📝 Logs e Monitoramento

### Centralizar logs

```bash
# Instalar ELK Stack (Elasticsearch, Logstash, Kibana)
docker-compose -f docker-compose.elk.yml up -d

# Configurar aplicação para enviar logs
# Editar backend para usar Logstash
```

### Alertas

Configure alertas para:
- Erro de conexão com banco de dados
- Taxa de erro alta
- Limite de requisições atingido
- Espaço em disco baixo

## 🔄 Atualizações

### Atualizar aplicação

```bash
# Parar serviços
docker-compose down

# Atualizar código
git pull origin main

# Reconstruir imagem
docker-compose build

# Iniciar novamente
docker-compose up -d

# Verificar saúde
curl http://localhost:3000/health
```

### Migração de banco de dados

```bash
# Executar migrations
docker-compose exec backend npm run migrate

# Verificar status
docker-compose exec backend npm run migrate:status
```

## 📞 Suporte

Para problemas de deployment, consulte:
- Documentação Docker: https://docs.docker.com
- Documentação Portainer: https://docs.portainer.io
- Logs da aplicação: `docker-compose logs`
