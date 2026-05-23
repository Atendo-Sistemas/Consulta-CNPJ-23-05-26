/**
 * App - Roteamento principal
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { QueryPage } from '@/pages/QueryPage';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminResellers from '@/pages/admin/AdminResellers';
import AdminLicenses from '@/pages/admin/AdminLicenses';
import AdminReports from '@/pages/admin/AdminReports';
import AdminSettings from '@/pages/admin/AdminSettings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  return token && user?.role === 'admin' ? (
    <AdminLayout>{children}</AdminLayout>
  ) : (
    <Navigate to="/login" />
  );
}

export default function App() {
  const { hydrate } = useAuthStore();
  const { tenant, setTenant } = useTenantStore();

  useEffect(() => {
    // Hidratar autenticação do localStorage
    hydrate();

    // Aplicar cores do tenant
    if (tenant) {
      document.documentElement.style.setProperty('--color-primary', tenant.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', tenant.secondaryColor);
    }
  }, [hydrate, tenant]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/query"
          element={
            <ProtectedRoute>
              <QueryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminOverview />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/resellers"
          element={
            <AdminRoute>
              <AdminResellers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/licenses"
          element={
            <AdminRoute>
              <AdminLicenses />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
