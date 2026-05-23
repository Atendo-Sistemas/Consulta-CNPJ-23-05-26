import React, { useEffect, useState } from 'react';
import DataTable from '../../components/admin/DataTable';
import { apiClient } from '../../lib/api';

export default function AdminResellers() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchResellers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(search && { search }),
          ...(status && { status }),
        });

        const response = await apiClient.get(`/api/admin/resellers?${params}`);
        setResellers(response.data.data.data);
        setPagination(response.data.data.pagination);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar resellers');
      } finally {
        setLoading(false);
      }
    };

    fetchResellers();
  }, [page, search, status]);

  const handleToggleStatus = async (reseller: any) => {
    try {
      await apiClient.put(`/api/admin/resellers/${reseller.id}`, {
        isActive: !reseller.isActive,
      });

      // Atualizar lista
      setResellers((prev) =>
        prev.map((r) => (r.id === reseller.id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch (err: any) {
      alert('Erro ao atualizar reseller: ' + (err.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nome',
      width: '25%',
    },
    {
      key: 'email',
      label: 'Email',
      width: '25%',
    },
    {
      key: 'activeLicenses',
      label: 'Licenças Ativas',
      render: (value: any) => <span className="font-semibold">{value}</span>,
      width: '15%',
    },
    {
      key: 'totalUsers',
      label: 'Usuários',
      width: '15%',
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Ativo' : 'Inativo'}
        </span>
      ),
      width: '15%',
    },
  ];

  const actions = [
    {
      label: 'Detalhes',
      onClick: (row: any) => {
        alert(`Detalhes de ${row.name} - ID: ${row.id}`);
      },
      variant: 'primary' as const,
    },
    {
      label: (row: any) => row.isActive ? 'Desativar' : 'Ativar',
      onClick: handleToggleStatus,
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Resellers</h1>
        <p className="text-gray-600">Gerencie todos os resellers e suas licenças</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={resellers}
          loading={loading}
          actions={actions}
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
