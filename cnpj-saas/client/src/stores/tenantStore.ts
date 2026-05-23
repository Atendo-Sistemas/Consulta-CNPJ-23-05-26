/**
 * Tenant Store - Zustand
 * Gerenciamento de configurações do tenant (White Label)
 */

import { create } from 'zustand';
import { Tenant } from '@/types';

interface TenantStore {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  updateColors: (primary: string, secondary: string) => void;
}

const DEFAULT_TENANT: Tenant = {
  id: 'default',
  name: 'CNPJ SaaS',
  slug: 'cnpj-saas',
  email: 'contact@cnpj-saas.local',
  primaryColor: '#4F46E5',
  secondaryColor: '#10B981',
  isActive: true,
  isWhiteLabel: false,
};

export const useTenantStore = create<TenantStore>((set) => ({
  tenant: DEFAULT_TENANT,

  setTenant: (tenant) => {
    set({ tenant: tenant || DEFAULT_TENANT });
    if (tenant) {
      // Aplicar cores CSS
      document.documentElement.style.setProperty('--color-primary', tenant.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', tenant.secondaryColor);
    }
  },

  updateColors: (primary, secondary) => {
    set((state) => ({
      tenant: state.tenant
        ? { ...state.tenant, primaryColor: primary, secondaryColor: secondary }
        : null,
    }));
    document.documentElement.style.setProperty('--color-primary', primary);
    document.documentElement.style.setProperty('--color-secondary', secondary);
  },
}));
