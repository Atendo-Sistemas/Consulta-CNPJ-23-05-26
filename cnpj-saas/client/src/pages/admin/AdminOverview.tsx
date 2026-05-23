import React, { useEffect, useState } from 'react';
import StatsCard from '../../components/admin/StatsCard';
import { apiClient } from '../../lib/api';

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/admin/stats');
        setStats(response.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
        <p className="text-gray-600">Visão geral do sistema SaaS de Consulta CNPJ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Resellers Ativos"
          value={stats?.totalResellers || 0}
          color="blue"
          icon="🏢"
        />
        <StatsCard
          title="Licenças Ativas"
          value={stats?.activeLicenses || 0}
          color="green"
          icon="🔑"
        />
        <StatsCard
          title="Licenças Expiradas"
          value={stats?.expiredLicenses || 0}
          color="red"
          icon="⏰"
        />
        <StatsCard
          title="Usuários Totais"
          value={stats?.totalUsers || 0}
          color="purple"
          icon="👥"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultas Processadas</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold text-gray-900">{stats?.totalQueries || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      ((stats?.queriesProcessed || 0) / (stats?.totalQueries || 1)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Processadas: <span className="font-semibold">{stats?.queriesProcessed || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Média de Uso</h2>
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {(stats?.avgQueriesPerLicense || 0).toFixed(0)}
              </div>
              <p className="text-sm text-gray-600 mt-2">Consultas por licença</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Resellers</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalResellers || 0}</p>
          <p className="text-xs text-blue-700 mt-2">Ativos no sistema</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-2">Licenças</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.activeLicenses || 0}</p>
          <p className="text-xs text-green-700 mt-2">Licenças válidas</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-900 mb-2">Receita Estimada</h3>
          <p className="text-3xl font-bold text-purple-600">
            R$ {((stats?.activeLicenses || 0) * 50).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-purple-700 mt-2">Mensal (R$ 50/licença)</p>
        </div>
      </div>
    </div>
  );
}
