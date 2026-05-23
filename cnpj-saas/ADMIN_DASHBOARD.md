# 📊 Dashboard de Admin - Documentação Completa

## Visão Geral

O Dashboard de Admin é uma interface completa para gerenciar o SaaS de Consulta CNPJ, incluindo resellers, licenças, relatórios e configurações.

## 🔐 Acesso

- **URL**: `/admin`
- **Requerimento**: Usuário com role `admin`
- **Autenticação**: JWT Token

### Exemplo de Acesso
```bash
# Login como admin
POST /api/auth/login
{
  "email": "admin@seu-dominio.com",
  "password": "sua_senha"
}

# Usar token para acessar admin
GET /api/admin/stats
Authorization: Bearer <token>
```

## 📋 Seções do Dashboard

### 1. Visão Geral (`/admin`)

**Componentes:**
- Estatísticas globais (resellers, licenças, usuários)
- Gráfico de consultas processadas
- Média de uso por licença
- Cards de receita estimada

**Dados Exibidos:**
- Total de resellers ativos
- Licenças ativas/expiradas
- Total de usuários
- Consultas processadas
- Receita mensal estimada

### 2. Gerenciamento de Resellers (`/admin/resellers`)

**Funcionalidades:**
- Listar todos os resellers com paginação
- Buscar por nome ou email
- Filtrar por status (ativo/inativo)
- Ver detalhes de cada reseller
- Ativar/desativar reseller
- Visualizar estatísticas por reseller

**Colunas da Tabela:**
- Nome do reseller
- Email
- Licenças ativas
- Total de usuários
- Status (ativo/inativo)

**Ações:**
- Detalhes: Ver informações completas
- Desativar/Ativar: Mudar status

### 3. Gerenciamento de Licenças (`/admin/licenses`)

**Funcionalidades:**
- Listar todas as licenças com paginação
- Criar nova licença
- Renovar licença (estender validade)
- Revogar licença (desativar)
- Filtrar por status (ativa/expirada)

**Formulário de Criação:**
```javascript
{
  tenantId: string,      // ID do reseller
  ipAddress: string,     // IP da VPS (ex: 192.168.1.1)
  queriesLimit: number   // Limite de consultas (padrão: 1000)
}
```

**Colunas da Tabela:**
- Chave de licença
- Reseller
- Endereço IP
- Uso de consultas (com barra de progresso)
- Data de validade
- Status

**Ações:**
- Renovar: Estender validade por 30 dias
- Revogar: Desativar a licença

### 4. Relatórios (`/admin/reports`)

#### Relatório de Uso por Reseller
Mostra o desempenho de cada reseller:
- Total de consultas
- Consultas bem-sucedidas
- Consultas com erro
- Consultas não encontradas
- Taxa de sucesso (%)
- Usuários ativos
- Total de licenças

#### Relatório de Receita
Mostra a receita diária:
- Data
- Novas licenças criadas
- Licenças ativas
- Limite total de consultas
- Receita estimada (R$ 50 por licença)

**Filtros de Data:**
- Últimos 7 dias
- Últimos 30 dias
- Últimos 90 dias

### 5. Configurações (`/admin/settings`)

**Preços:**
- Preço por licença de reseller (mensal) - Padrão: R$ 50
- Preço por usuário adicional (mensal) - Padrão: R$ 10
- Preço por consulta extra - Padrão: R$ 0.01

**Limites Padrão:**
- Limite padrão de consultas - Padrão: 1000
- Validade padrão da licença (dias) - Padrão: 30
- Máximo de validações falhadas - Padrão: 3

**Receita Estimada:**
Calcula automaticamente a receita mensal com base nos preços configurados.

## 🔌 API Endpoints

### Estatísticas
```
GET /api/admin/stats
```
Retorna estatísticas globais do sistema.

### Resellers
```
GET /api/admin/resellers?page=1&limit=20&search=&status=
GET /api/admin/resellers/:tenantId
PUT /api/admin/resellers/:tenantId
```

### Licenças
```
GET /api/admin/licenses?page=1&limit=20&status=
POST /api/admin/licenses/create
PUT /api/admin/licenses/:licenseId/renew
DELETE /api/admin/licenses/:licenseId
```

### Relatórios
```
GET /api/admin/reports/resellers?startDate=&endDate=
GET /api/admin/reports/revenue?startDate=&endDate=
```

## 🛡️ Segurança

### Autenticação
- Apenas usuários com role `admin` podem acessar
- Token JWT obrigatório em todas as requisições
- Tokens expiram em 7 dias (configurável)

### Validações
- IP deve ser válido (formato: 0.0.0.0)
- Limite de consultas deve ser > 0
- Licenças não podem ser criadas sem reseller
- Renovação automática de 30 dias

### Proteção de Rotas
```typescript
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  return token && user?.role === 'admin' ? (
    <AdminLayout>{children}</AdminLayout>
  ) : (
    <Navigate to="/login" />
  );
}
```

## 📊 Componentes Reutilizáveis

### StatsCard
Exibe uma métrica com ícone, título e valor.
```typescript
<StatsCard
  title="Resellers Ativos"
  value={stats?.totalResellers || 0}
  color="blue"
  icon="🏢"
/>
```

### DataTable
Tabela genérica com paginação e ações.
```typescript
<DataTable
  columns={columns}
  data={data}
  loading={loading}
  actions={actions}
  pagination={pagination}
  onPageChange={setPage}
/>
```

### LicenseForm
Formulário para criar/editar licenças.
```typescript
<LicenseForm
  onSubmit={handleCreateLicense}
  onCancel={() => setShowForm(false)}
  loading={formLoading}
/>
```

## 🎯 Fluxo de Uso Típico

### Criar Novo Reseller
1. Reseller se registra no sistema
2. Admin acessa `/admin/resellers`
3. Verifica dados do reseller
4. Ativa o reseller se necessário

### Criar Licença para Reseller
1. Admin acessa `/admin/licenses`
2. Clica em "+ Nova Licença"
3. Preenche:
   - ID do reseller
   - IP da VPS do reseller
   - Limite de consultas
4. Clica em "Criar Licença"
5. Compartilha chave de licença com reseller

### Renovar Licença Expirada
1. Admin acessa `/admin/licenses`
2. Filtra por "Expiradas"
3. Clica em "Renovar" na licença
4. Licença é estendida por 30 dias

### Analisar Receita
1. Admin acessa `/admin/reports`
2. Seleciona período (7, 30 ou 90 dias)
3. Vê tabela de receita diária
4. Total aparece no card roxo

## 🔄 Sincronização em Tempo Real

Todas as operações são sincronizadas:
- Criar licença → Atualiza estatísticas
- Renovar licença → Atualiza data de validade
- Revogar licença → Remove de ativas
- Ativar/Desativar reseller → Afeta acesso

## 📱 Responsividade

O dashboard é totalmente responsivo:
- Desktop: Layout completo com sidebar
- Tablet: Sidebar colapsável
- Mobile: Navegação adaptada

## 🚀 Performance

- Paginação: 20 registros por página
- Cache: Dados são cacheados no cliente
- Lazy loading: Componentes carregam sob demanda
- Otimização: Queries SQL otimizadas com índices

## 🐛 Troubleshooting

### "Acesso negado: apenas administradores"
- Verifique se o usuário tem role `admin`
- Verifique se o token não expirou
- Faça login novamente

### "Licença não encontrada"
- Verifique o ID da licença
- Verifique se a licença não foi revogada

### "IP inválido"
- Use formato: 192.168.1.1
- Não use localhost ou 127.0.0.1

## 📚 Próximas Melhorias

- [ ] Exportar relatórios em PDF/CSV
- [ ] Gráficos de receita ao longo do tempo
- [ ] Alertas de licenças próximas de expirar
- [ ] Histórico de ações de admin
- [ ] Dois fatores de autenticação
- [ ] Auditoria de mudanças

---

**Desenvolvido com ❤️ para Atendo Sistemas**
