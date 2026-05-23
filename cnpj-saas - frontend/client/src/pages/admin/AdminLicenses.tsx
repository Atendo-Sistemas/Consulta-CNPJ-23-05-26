import React, { useEffect, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import LicenseForm from '../../components/admin/LicenseForm';
import { apiClient } from '../../lib/api';

export default function AdminLicenses() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(status && { status }),
        });

        const response = await apiClient.get(`/api/admin/licenses?${params}`);
        setLicenses(response.data.data.data);
        setPagination(response.data.data.pagination);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar licenças');
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, [page, status]);

  const handleCreateLicense = async (data: any) => {
    try {
      setFormLoading(true);
      await apiClient.post('/api/admin/licenses/create', data);
      setShowForm(false);
      setPage(1);
      // Recarregar lista
      const response = await apiClient.get('/api/admin/licenses?page=1&limit=20');
      setLicenses(response.data.data.data);
      setPagination(response.data.data.pagination);
    } catch (err: any) {
      alert('Erro ao criar licença: ' + (err.response?.data?.message || 'Erro desconhecido'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleRevokeLicense = async (license: any) => {
    if (!confirm(`Tem certeza que deseja revogar a licença ${license.licenseKey}?`)) return;

    try {
      await apiClient.delete(`/api/admin/licenses/${license.id}`);
      setLicenses((prev) => prev.filter((l) => l.id !== license.id));
    } catch (err: any) {
      alert('Erro ao revogar licença: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const handleRenewLicense = async (license: any) => {
    try {
      await apiClient.put(`/api/admin/licenses/${license.id}/renew`, { days: 30 });
      // Recarregar lista
      const response = await apiClient.get(`/api/admin/licenses?page=${page}&limit=20`);
      setLicenses(response.data.data.data);
    } catch (err: any) {
      alert('Erro ao renovar licença: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const columns = [
    {
      key: 'licenseKey',
      label: 'Chave de Licença',
      width: '20%',
      render: (value: string) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value}</code>,
    },
    {
      key: 'tenantName',
      label: 'Reseller',
      width: '20%',
    },
    {
      key: 'ipAddress',
      label: 'IP',
      width: '15%',
    },
    {
      key: 'queriesUsed',
      label: 'Consultas',
      width: '15%',
      render: (value: number, row: any) => (
        <div>
          <div className="text-sm font-medium">{value} / {row.queriesLimit}</div>
          <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min((value / row.queriesLimit) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      key: 'validUntil',
      label: 'Válida até',
      width: '15%',
      render: (value: string) => {
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <span className={isExpired ? 'text-red-600 font-medium' : 'text-green-600'}>
            {formatDate(value)}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      width: '15%',
      render: (value: boolean) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Renovar',
      onClick: handleRenewLicense,
      variant: 'primary' as const,
    },
    {
      label: 'Revogar',
      onClick: handleRevokeLicense,
      variant: 'danger' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Licenças</h1>
          <p className="text-gray-600">Crie, renove e gerencie licenças de resellers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {showForm ? 'Cancelar' : '+ Nova Licença'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Criar Nova Licença</h2>
          <LicenseForm
            onSubmit={handleCreateLicense}
            onCancel={() => setShowForm(false)}
            loading={formLoading}
          />
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as licenças</option>
            <option value="active">Ativas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={licenses}
          loading={loading}
          actions={actions}
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
