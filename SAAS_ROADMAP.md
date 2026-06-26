# 🚀 Roadmap: SaaS Consulta CNPJ - Versão Vendável

> Transformar sistema técnico em produto comercial pronto para vendas B2B

---

## 📊 VISÃO DO PRODUTO

### Positioning
**"A plataforma de consulta CNPJ mais confiável para empresas que precisam validar dados de fornecedores, clientes e parceiros em tempo real - com compliance total e sem limite técnico."**

### Público-Alvo (Em Ordem de Prioridade)
1. **Fintechs & Marketplaces** - Validação KYB em onboarding
2. **Consultórios & Contadores** - Gestão de clientes corporativos
3. **Plataformas de Crédito** - Análise de risco automática
4. **Gestoras & Fundos** - Due diligence rápida
5. **Softwares ERP/CRM** - Integração nativa

---

## 🎯 FASE 1: FUNDAÇÃO COMERCIAL (Semanas 1-3)

### 1.1 Estrutura de Preços (Modelos Testados)

```
┌─────────────────────────────────────────────────────────┐
│ PLANO             │ USO MENSAL    │ PREÇO    │ PÚBLICO  │
├─────────────────────────────────────────────────────────┤
│ STARTER           │ 500 consultas │ R$ 99    │ Freelancers  │
│ PROFESSIONAL      │ 5.000 consultas│ R$ 299   │ Pequenas emp │
│ ENTERPRISE        │ Ilimitado     │ Custom   │ Corporativos │
│ RESELLER          │ Ilimitado + API│ Custom   │ Agências     │
└─────────────────────────────────────────────────────────┘

Receita Mensal Alvo (Year 1): R$ 50K-100K MRR
Crescimento Esperado: 15% MoM
```

### 1.2 Modelo de Monetização Adicional

```javascript
// pricing.config.ts
export const MONETIZATION = {
  // Core: Consultas CNPJ
  queryPricing: {
    costPerQuery: 0.10,      // Seu custo (API pública + infra)
    markupPercentage: 300,   // 300% markup = R$ 0.40/consulta
  },

  // Add-ons Upsell
  addOns: {
    bulkExport: { price: 49, description: "Exportar 100k+ registros" },
    apiAccess: { price: 199, description: "REST API integrações" },
    whiteLabel: { price: 499, description: "Domínio customizado" },
    advancedReports: { price: 149, description: "Relatórios + análise de risco" },
    dedicatedAccount: { price: 299, description: "Suporte prioritário 24/7" },
  },

  // Por-uso (Pay-As-You-Go)
  overage: {
    costPerExtraQuery: 0.25, // Acima do limite do plano
  }
};
```

### 1.3 Documentos Legais Necessários

**Criar arquivos:**
- `docs/TERMOS_SERVICO.md` - Compliance LGPD, SLA 99.5%, Responsabilidades
- `docs/POLITICA_PRIVACIDADE.md` - LGPD completa
- `docs/ACORDO_CLIENTE.md` - NDA para enterprise
- `docs/DPA.md` - Data Processing Agreement

---

## 🎨 FASE 2: PRODUTO MVP PREMIUM (Semanas 4-7)

### 2.1 Aprimoramentos Críticos do Backend

#### A. Sistema de Assinatura + Pagamento Integrado

```typescript
// src/features/billing/subscription.service.ts
import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';

export class SubscriptionService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  async createSubscription(tenantId: string, planId: string) {
    // 1. Criar customer no Stripe
    const customer = await this.stripe.customers.create({
      email: tenant.email,
      name: tenant.companyName,
      metadata: { tenantId },
    });

    // 2. Criar subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: planId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // 3. Salvar no DB
    await db.subscriptions.create({
      tenantId,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      planId,
      status: 'trialing', // 14 dias grátis
      renewalDate: addDays(new Date(), 14),
      queryQuota: getPlanQuota(planId),
      queriesUsedThisMonth: 0,
    });

    return {
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    };
  }

  // Webhook: Atualizar quotas quando renovar
  async handleSubscriptionRenewal(stripeSubscriptionId: string) {
    const subscription = await db.subscriptions.findByStripeId(
      stripeSubscriptionId
    );
    
    await db.subscriptions.update(subscription.id, {
      queriesUsedThisMonth: 0, // Reset quota
      renewalDate: addMonths(new Date(), 1),
    });
  }
}
```

#### B. Sistema de Rate Limiting Inteligente

```typescript
// src/middleware/rateLimiter.ts
import Redis from 'ioredis';

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenantId = req.user.tenantId;
  const subscription = await db.subscriptions.findByTenant(tenantId);

  // Chave no Redis
  const key = `quota:${tenantId}:${getCurrentMonth()}`;
  
  // Verificar limite
  const used = await redis.get(key) || 0;
  if (used >= subscription.queryQuota) {
    return res.status(429).json({
      error: 'Cota mensal atingida',
      retryAfter: getNextMonthDate(),
      canUpgrade: true,
    });
  }

  // Permitir e incrementar
  await redis.incr(key);
  await redis.expire(key, getSecondsUntilMonthEnd());

  res.set('X-RateLimit-Limit', subscription.queryQuota);
  res.set('X-RateLimit-Remaining', subscription.queryQuota - (used + 1));
  
  next();
}
```

#### C. Relatórios & Analytics de Uso

```typescript
// src/features/analytics/dashboard.service.ts
export class DashboardService {
  async getTenantDashboard(tenantId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const year = now.getFullYear();

    // 1. Resumo de Uso
    const monthlyUsage = await db.query_history.aggregate({
      tenantId,
      createdAt: { $gte: monthStart },
      $group: {
        _id: dateToDay(),
        queries: { $sum: 1 },
      },
    });

    // 2. Top Empresas Consultadas
    const topCompanies = await db.query_history.findMany({
      tenantId,
      createdAt: { $gte: monthStart },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        cnpj: true,
        razaoSocial: true,
        createdAt: true,
      },
    });

    // 3. Insights de Risco (usar dados públicos)
    const riskAnalysis = await this.analyzeRisk(topCompanies);

    // 4. Próximas renovações
    const subscription = await db.subscriptions.findByTenant(tenantId);
    const remainingQueries = subscription.queryQuota - monthlyUsage.total;
    const daysUntilRenewal = differenceInDays(
      subscription.renewalDate,
      now
    );

    return {
      usage: {
        thisMonth: monthlyUsage.total,
        limit: subscription.queryQuota,
        percentage: (monthlyUsage.total / subscription.queryQuota) * 100,
        chart: monthlyUsage.breakdown, // Gráfico diário
      },
      remainingQueries,
      daysUntilRenewal,
      estimatedOverage: remainingQueries < 0 ? Math.abs(remainingQueries) * 0.25 : 0,
      topCompanies,
      riskAnalysis,
      canUpgrade: remainingQueries < (subscription.queryQuota * 0.2), // 20% aviso
    };
  }
}
```

### 2.2 Frontend Admin Dashboard Premium

#### Criar estrutura:
```
cnpj-saas-frontend/client/src/
├── pages/
│   ├── Dashboard.tsx          // Visão geral de uso
│   ├── QueryHistory.tsx       # Histórico filtrado/exportável
│   ├── BillingPlans.tsx       # Seleção de planos
│   ├── SubscriptionManager.tsx# Gerenciar assinatura
│   ├── TeamMembers.tsx        # Gerenciar usuários da equipe
│   ├── WhiteLabel.tsx         # Customização de branding
│   └── AnalyticsAdvanced.tsx  # Relatórios e insights
├── components/
│   ├── BillingCard.tsx        # Card de cobrança
│   ├── UsageChart.tsx         # Gráfico de consumo
│   └── UpgradePrompt.tsx      # CTA para upgrade
└── hooks/
    ├── useBilling.ts          # Hook para billing API
    └── useSubscription.ts     # Hook para subscription
```

#### Exemplo: Dashboard.tsx
```typescript
export function Dashboard() {
  const { subscription } = useSubscription();
  const { usage } = useBilling();
  const percentUsed = (usage / subscription.queryQuota) * 100;

  return (
    <div className="space-y-6">
      {/* Card de Status */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Consultas este mês
              </p>
              <p className="text-3xl font-bold">{usage}</p>
              <p className="text-xs text-muted-foreground mt-1">
                de {subscription.queryQuota}
              </p>
            </div>
            <div className="text-4xl font-bold text-muted">
              {Math.round(percentUsed)}%
            </div>
          </div>
          <Progress value={percentUsed} className="mt-4" />
        </Card>

        <Card>
          <p className="text-sm text-muted-foreground">Plano Atual</p>
          <p className="text-2xl font-bold">{subscription.planName}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Renova em {formatDate(subscription.renewalDate)}
          </p>
          <Button size="sm" className="mt-4" variant="outline">
            Alterar Plano
          </Button>
        </Card>

        <Card>
          <p className="text-sm text-muted-foreground">Valor Mensal</p>
          <p className="text-2xl font-bold">
            R$ {subscription.monthlyPrice}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            + R$ {estimatedOverage} em uso excedente
          </p>
          <a href="/billing" className="text-xs text-primary mt-4 inline-block">
            Ver fatura →
          </a>
        </Card>
      </div>

      {/* Gráfico de Uso */}
      <Card>
        <h3 className="font-semibold mb-4">Uso Diário</h3>
        <UsageChart data={usage.chart} />
      </Card>

      {/* Empresas Consultadas */}
      <Card>
        <h3 className="font-semibold mb-4">Últimas Consultas</h3>
        <QueryTable queries={usage.topQueries} />
      </Card>

      {/* CTA para Upgrade (se 80%+ usado) */}
      {percentUsed > 80 && (
        <UpgradePrompt
          message={`Você atingiu ${percentUsed}% da sua cota. Considere fazer upgrade.`}
        />
      )}
    </div>
  );
}
```

### 2.3 Sistema de Suporte & Ticketing

```typescript
// src/features/support/support.controller.ts
export class SupportController {
  async createTicket(req: Request, res: Response) {
    const { subject, description, priority } = req.body;
    const tenantId = req.user.tenantId;

    const ticket = await db.support_tickets.create({
      id: uuid(),
      tenantId,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date(),
    });

    // Notificar suporte via email/Slack
    await sendSlackNotification({
      channel: '#support',
      text: `🎫 Novo ticket: ${subject} (${priority})`,
      details: `Tenant: ${tenantId}\n${description}`,
    });

    return res.json({ ticketId: ticket.id });
  }

  // Chat em tempo real com suporte
  async initSupportChat(tenantId: string) {
    const socket = this.setupSocketConnection(tenantId);
    
    socket.on('message', async (msg) => {
      await db.chat_messages.create({
        ticketId: msg.ticketId,
        sender: 'user',
        message: msg.text,
      });

      // Notificar suporte via WebSocket
      this.notifySupportTeam(msg.ticketId, msg.text);
    });
  }
}
```

---

## 🚀 FASE 3: ESCALABILIDADE & GO-TO-MARKET (Semanas 8-10)

### 3.1 Infraestrutura de Escalabilidade

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  # API Backend com auto-scaling
  api:
    image: cnpj-saas:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
    environment:
      - DATABASE_URL=postgres://user:pwd@postgres:5432/cnpj_saas
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production

  # Cache distribuído
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Banco de dados principal
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=cnpj_saas
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  # Fila de jobs assíncrona
  bullmq:
    image: node:18-alpine
    command: node dist/workers/queue.js
    depends_on:
      - redis

  # Monitoramento
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  grafana_data:
```

### 3.2 Estratégia de Go-to-Market

#### A. Onboarding Automático + Trials

```typescript
// src/features/onboarding/onboarding.service.ts
export class OnboardingService {
  async startTrial(email: string, companyName: string) {
    const tenant = await db.tenants.create({
      id: uuid(),
      email,
      companyName,
      status: 'trialing',
      createdAt: new Date(),
      trialEndsAt: addDays(new Date(), 14), // 14 dias grátis
    });

    const subscription = await db.subscriptions.create({
      tenantId: tenant.id,
      planId: 'STARTER', // Plano trial automático
      queryQuota: 500,
      status: 'trialing',
    });

    // Email de boas-vindas com onboarding
    await sendOnboardingEmail({
      to: email,
      template: 'welcome_trial',
      variables: {
        companyName,
        trialDays: 14,
        firstQueryLink: `${process.env.APP_URL}/demo?cnpj=33000167000101`,
      },
    });

    return { tenantId: tenant.id, trialToken: tenant.id };
  }

  // Seq automática: Trial → Upgrade → VIP
  async checkTrialStatus() {
    const expiringTrials = await db.tenants.findMany({
      where: {
        status: 'trialing',
        trialEndsAt: { $lte: addDays(new Date(), 3) },
      },
    });

    for (const tenant of expiringTrials) {
      await sendEmail({
        to: tenant.email,
        template: 'trial_ending_soon',
        variables: {
          daysLeft: differenceInDays(tenant.trialEndsAt, new Date()),
          upgradeUrl: `${process.env.APP_URL}/plans`,
        },
      });
    }
  }
}
```

#### B. Página de Landing + Pricing

```
Criar: /marketing/landing.tsx
- Hero: "Validar empresas em 0.5 segundos"
- Features: 3 colunas com ícones
- Pricing: Cards de planos com CTAs
- Testimonials: Logos de clientes (mock)
- FAQ: Perguntas comuns
- Trial CTA: "Teste grátis por 14 dias"
```

#### C. Integração com Zapier / Make.com

```typescript
// src/features/integrations/zapier.controller.ts
export class ZapierController {
  // Webhook para Zapier
  async queryWebhook(req: Request, res: Response) {
    const { cnpj } = req.body;
    const apiKey = req.headers['x-api-key'];

    // Validar chave de API
    const account = await db.api_keys.findByKey(apiKey);
    if (!account) return res.status(401).json({ error: 'Invalid API key' });

    // Executar consulta
    const result = await this.cnpjService.query(cnpj);

    return res.json({
      success: true,
      data: result,
      webhookId: generateId(),
    });
  }
}

// Permitir em Zapier que usuários façam coisas como:
// "Quando receber CNPJ no Webhook → Consultar CNPJ SaaS → Enviar resultado no Slack"
```

### 3.3 Programa de Referência

```typescript
// src/features/referral/referral.service.ts
export class ReferralService {
  async generateReferralCode(tenantId: string) {
    const code = generateCode(); // ex: ATENDO-A1B2C3
    
    await db.referral_codes.create({
      code,
      tenantId,
      rewardPerReferral: 50, // R$ 50 crédito por cliente novo
      maxRewards: null, // Ilimitado
    });

    return {
      code,
      shareUrl: `${process.env.APP_URL}/signup?ref=${code}`,
      trackingLink: `${process.env.APP_URL}/r/${code}`,
    };
  }

  async claimReferralReward(referralCode: string) {
    const referral = await db.referral_codes.findByCode(referralCode);
    
    // Quando novo usuário faz primeiro pagamento
    await db.referral_rewards.create({
      fromTenantId: referral.tenantId,
      rewardAmount: referral.rewardPerReferral,
      claimedAt: new Date(),
    });

    // Notificar referee
    await sendEmail({
      to: referral.tenant.email,
      template: 'referral_reward',
      variables: {
        amount: referral.rewardPerReferral,
      },
    });
  }
}
```

---

## 📈 MÉTRICAS DE SUCESSO (Targets Year 1)

```
┌──────────────────────────────────────────────────┐
│ MÉTRICA              │ MÊS 3   │ MÊS 6   │ MÊS 12 │
├──────────────────────────────────────────────────┤
│ Clientes Ativos      │ 50      │ 200     │ 800    │
│ MRR                  │ R$5K    │ R$25K   │ R$100K │
│ Churn Rate           │ 5%      │ 3%      │ 2%     │
│ LTV / CAC            │ 8x      │ 12x     │ 15x    │
│ NPS Score            │ 30      │ 50      │ 65     │
│ Uptime               │ 99.5%   │ 99.9%   │ 99.95% │
└──────────────────────────────────────────────────┘
```

---

## 📚 PRÓXIMOS PASSOS IMEDIATOS

### Prioridade 1 (Esta semana)
- [ ] Criar conta Stripe e configurar plans
- [ ] Escrever Termos de Serviço + Política de Privacidade (LGPD)
- [ ] Configurar domínio principal (app.seu-dominio.com)
- [ ] Criar documentação de API (Swagger/OpenAPI)

### Prioridade 2 (Próximas 2 semanas)
- [ ] Implementar Stripe Webhook + billing service
- [ ] Build dashboard admin com uso/quotas
- [ ] Página de landing + pricing
- [ ] Email templates (onboarding, trial ending, invoice)

### Prioridade 3 (Semanas 3-4)
- [ ] Rate limiting por plano
- [ ] Analytics & reporting
- [ ] Suporte (ticketing + chat)
- [ ] Testes E2E do fluxo completo

### Prioridade 4 (Semanas 5+)
- [ ] Integração Zapier
- [ ] Program de referência
- [ ] Chat support em tempo real
- [ ] White-label customization

---

## 💰 ESTIMATIVA FINANCEIRA (Year 1)

```
Receita Projetada:     R$ 100K MRR × 12 = R$ 1.2M
Custos Fixos:          R$ 15K/mês (server, domains, tools)
Custos Variáveis:      ~10% da receita (Stripe fees, API)
Lucro Estimado:        R$ 50-80K/mês (10-15% margin)

ROI do Projeto: 400-600% no Year 1
```

---

✨ **Este é seu blueprint para um SaaS profissional e vendável. Vamos começar?**
