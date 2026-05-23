/**
 * Layout - Componente principal de layout
 */

import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';
import { getInitials } from '@/lib/formatters';

interface LayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function Layout({ children, sidebar }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const { tenant } = useTenantStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: tenant?.primaryColor || '#4F46E5' }}
            >
              {tenant?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{tenant?.name || 'CNPJ SaaS'}</h1>
              <p className="text-xs text-gray-500">{tenant?.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: tenant?.secondaryColor || '#10B981' }}
                >
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <button
                  onClick={logout}
                  className="ml-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          {sidebar && (
            <aside className="lg:col-span-1">
              {sidebar}
            </aside>
          )}

          {/* Main content */}
          <main className={sidebar ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
