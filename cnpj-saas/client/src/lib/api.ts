/**
 * API Client - Axios
 * Configuração centralizada de requisições HTTP
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor de requisição
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor de resposta
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(email: string, password: string, tenantId: string, firstName?: string, lastName?: string) {
    return this.client.post('/auth/register', {
      email,
      password,
      tenantId,
      firstName,
      lastName,
    });
  }

  async login(email: string, password: string, tenantId: string) {
    return this.client.post('/auth/login', {
      email,
      password,
      tenantId,
    });
  }

  async getMe() {
    return this.client.get('/auth/me');
  }

  async updateMe(firstName?: string, lastName?: string, password?: string) {
    return this.client.put('/auth/me', {
      firstName,
      lastName,
      password,
    });
  }

  // CNPJ
  async queryCNPJ(cnpj: string) {
    return this.client.post('/cnpj/query', { cnpj });
  }

  async getQueryHistory(page = 1, limit = 20, filters?: any) {
    return this.client.get('/cnpj/history', {
      params: { page, limit, ...filters },
    });
  }

  async getQueryStats(days = 30) {
    return this.client.get('/cnpj/stats', {
      params: { days },
    });
  }

  async getDashboard() {
    return this.client.get('/cnpj/dashboard');
  }

  // Licenses
  async validateLicense(licenseKey: string, ipAddress: string, hostname?: string) {
    return this.client.post('/licenses/validate', {
      licenseKey,
      ipAddress,
      hostname,
    });
  }

  async getMyLicenses(page = 1, limit = 20) {
    return this.client.get('/licenses/me', {
      params: { page, limit },
    });
  }

  async getLicenseStats(licenseId: string) {
    return this.client.get(`/licenses/${licenseId}/stats`);
  }

  async renewLicense(licenseId: string, validDays = 30) {
    return this.client.post(`/licenses/${licenseId}/renew`, {
      validDays,
    });
  }

  // Admin
  async getAdminStats() {
    return this.client.get('/admin/stats');
  }

  async getAdminTenants(page = 1, limit = 20) {
    return this.client.get('/admin/tenants', {
      params: { page, limit },
    });
  }

  async getAdminLicenses(page = 1, limit = 20) {
    return this.client.get('/admin/licenses', {
      params: { page, limit },
    });
  }

  async createLicense(tenantId: string, ipAddress: string, plan: string, validDays = 30, hostname?: string) {
    return this.client.post('/admin/licenses/create', {
      tenantId,
      ipAddress,
      plan,
      validDays,
      hostname,
    });
  }
}

export const apiClient = new ApiClient();
