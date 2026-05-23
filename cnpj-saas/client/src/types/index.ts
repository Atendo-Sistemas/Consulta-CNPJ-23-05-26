/**
 * Types - Frontend
 */

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
}

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
}

export interface License {
  id: string;
  licenseKey: string;
  ipAddress: string;
  plan: string;
  queriesLimit: number;
  queriesUsed: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CNPJData {
  cnpj_raiz?: string;
  razao_social?: string;
  capital_social?: number | string;
  atualizado_em?: string;
  socios?: any[];
  estabelecimento?: any;
  [key: string]: any;
}

export interface QueryResult {
  data: CNPJData;
  history: any;
}

export interface DashboardStats {
  totalQueries: number;
  queriesThisMonth: number;
  queriesRemaining: number;
  activeUsers: number;
  successRate: number;
  lastQueryDate?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
