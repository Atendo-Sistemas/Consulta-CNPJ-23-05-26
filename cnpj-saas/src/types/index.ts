/**
 * Types - CNPJ SaaS
 * Definições de tipos TypeScript para toda a aplicação
 */

// ============================================
// Tenants (Clientes/Resellers)
// ============================================
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string;
  isActive: boolean;
  isWhiteLabel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantRequest {
  name: string;
  email: string;
  slug: string;
  plan: string;
}

// ============================================
// Licenças
// ============================================
export interface License {
  id: string;
  tenantId: string;
  licenseKey: string;
  ipAddress: string;
  hostname?: string;
  plan: string;
  queriesLimit: number;
  queriesUsed: number;
  additionalUsers: number;
  validFrom: Date;
  validUntil: Date;
  lastValidation?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseValidationRequest {
  licenseKey: string;
  ipAddress: string;
  hostname?: string;
}

export interface LicenseValidationResponse {
  isValid: boolean;
  tenant?: Tenant;
  license?: License;
  message: string;
  expiresIn?: number; // segundos até expiração
}

// ============================================
// Usuários
// ============================================
export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

// ============================================
// Consultas CNPJ
// ============================================
export interface CNPJQueryRequest {
  cnpj: string;
}

export interface CNPJData {
  cnpj_raiz?: string;
  razao_social?: string;
  capital_social?: number | string;
  porte?: {
    id?: string;
    descricao?: string;
  };
  natureza_juridica?: {
    id?: string;
    descricao?: string;
  };
  qualificacao_do_responsavel?: {
    id?: string;
    descricao?: string;
  };
  responsavel_federativo?: {
    id?: string;
    nome?: string;
  };
  atualizado_em?: string;
  socios?: Array<{
    nome?: string;
    cpf?: string;
    qualificacao?: string;
    data_entrada?: string;
    [key: string]: any;
  }>;
  simples?: {
    simples?: string;
    mei?: string;
    data_opcao?: string;
    data_exclusao?: string;
    [key: string]: any;
  };
  estabelecimento?: {
    cnpj?: string;
    cnpj_raiz?: string;
    tipo?: string;
    nome_fantasia?: string;
    situacao_cadastral?: string;
    data_situacao_cadastral?: string;
    data_inicio_atividade?: string;
    tipo_logradouro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    ddd1?: string;
    telefone1?: string;
    ddd2?: string;
    telefone2?: string;
    email?: string;
    atividade_principal?: {
      id?: string;
      subclasse?: string;
      descricao?: string;
      secao?: string;
    };
    atividades_secundarias?: Array<{
      id?: string;
      subclasse?: string;
      descricao?: string;
    }>;
    inscricoes_estaduais?: Array<{
      estado?: { sigla?: string; nome?: string };
      inscricao_estadual?: string;
      ativo?: boolean;
    }>;
    estado?: { sigla?: string; nome?: string };
    cidade?: { nome?: string };
    pais?: { nome?: string };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface QueryHistory {
  id: string;
  tenantId: string;
  userId: string;
  cnpj: string;
  companyName?: string;
  status: 'success' | 'not_found' | 'error';
  errorMessage?: string;
  responseData?: CNPJData;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================
// Estatísticas de Uso
// ============================================
export interface UsageStats {
  id: string;
  tenantId: string;
  date: Date;
  queriesCount: number;
  activeUsers: number;
  errorsCount: number;
  createdAt: Date;
}

export interface DashboardStats {
  totalQueries: number;
  queriesThisMonth: number;
  queriesRemaining: number;
  activeUsers: number;
  successRate: number;
  lastQueryDate?: Date;
}

// ============================================
// Planos
// ============================================
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  queriesLimit?: number;
  maxUsers?: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Assinaturas
// ============================================
export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Pagamentos
// ============================================
export interface Payment {
  id: string;
  subscriptionId?: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  stripePaymentId?: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Auditoria
// ============================================
export interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress: string;
  createdAt: Date;
}

// ============================================
// Respostas de API
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// JWT Payload
// ============================================
export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ============================================
// Contexto de Requisição
// ============================================
export interface RequestContext {
  userId?: string;
  tenantId?: string;
  user?: User;
  tenant?: Tenant;
  license?: License;
  ipAddress: string;
  userAgent?: string;
}

// ============================================
// Erros
// ============================================
export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_LICENSE: 'INVALID_LICENSE',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  QUERY_LIMIT_EXCEEDED: 'QUERY_LIMIT_EXCEEDED',
  INVALID_CNPJ: 'INVALID_CNPJ',
  CNPJ_NOT_FOUND: 'CNPJ_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;
