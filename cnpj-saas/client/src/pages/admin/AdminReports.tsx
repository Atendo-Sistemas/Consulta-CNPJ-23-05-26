import React, { useEffect, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import { apiClient } from '../../lib/api';

export default function AdminReports() {
  const [resellerReport, setResellerReport] = useState<any[]>([]);
  const [revenueReport, setRevenueReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);

        // Calcular datas
        const endDate = new Date();
        const startDate = new Date();
        
        if (dateRange === '7days') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === '30days') {
          startDate.setDate(startDate.getDate() - 30);
        } else if (dateRange === '90days') {
          startDate.setDate(startDate.getDate() - 90);
        }

        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        // Buscar relatórios
        const [resellerRes, revenueRes] = await Promise.all([
          apiClient.get(`/api/admin/reports/resellers?${params}`),
          apiClient.get(`/api/admin/reports/revenue?${params}`),
        ]);

        setResellerReport(resellerRes.data.data);
        setRevenueReport(revenueRes.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const resellerColumns = [
    {
      key: 'resellerName',
      label: 'Reseller',
      width: '25%',
    },
    {
      key: 'totalQueries',
      label: 'Consultas',
      width: '15%',
      render: (value: number) => <span className="font-semibold">{value}</span>,
    },
    {
      key: 'successQueries',
      label: 'Sucesso',
      width: '15%',
      render: (value: number) => <span className="text-green-600 font-medium">{value}</span>,
    },
    {
      key: 'errorQueries',
      label: 'Erros',
      width: '15%',
      render: (value: number) => <span className="text-red-600 font-medium">{value}</span>,
    },
    {
      key: 'successRate',
      label: 'Taxa de Sucesso',
      width: '15%',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${Math.min(parseFloat(value), 100)}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      ),
    },
    {
      key: 'activeUsers',
      label: 'Usuários Ativos',
      width: '15%',
    },
  ];

  const revenueColumns = [
    {
      key: 'date',
      label: 'Data',
      width: '20%',
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      key: 'newLicenses',
      label: 'Novas Licenças',
      width: '20%',
      render: (value: number) => <span className="font-semibold text-blue-600">{value}</span>,
    },
    {
      key: 'activeLicenses',
      label: 'Licenças Ativas',
      width: '20%',
      render: (value: number) => <span className="font-semibold text-green-600">{value}</span>,
    },
    {
      key: 'totalQueriesLimit',
      label: 'Limite de Consultas',
      width: '20%',
      render: (value: number) => <span className="font-semibold">{value.toLocaleString('pt-BR')}</span>,
    },
    {
      key: 'estimatedRevenue',
      label: 'Receita Estimada',
      width: '20%',
      render: (value: string) => (
        <span className="font-semibold text-purple-600">R$ {parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Análise de uso e receita do sistema</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7days">Últimos 7 dias</option>
          <option value="30days">Últimos 30 dias</option>
          <option value="90days">Últimos 90 dias</option>
        </select>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uso por Reseller</h2>
          <DataTable
            columns={resellerColumns}
            data={resellerReport}
            loading={loading}
          />
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Receita Diária</h2>
          <DataTable
            columns={revenueColumns}
            data={revenueReport}
            loading={loading}
          />
        </div>
      </div>

      {revenueReport.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Receita Total do Período</h3>
          <p className="text-4xl font-bold text-purple-600">
            R$ {revenueReport
              .reduce((sum, item) => sum + parseFloat(item.estimatedRevenue), 0)
              .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}
    </div>
  );
}
