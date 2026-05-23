/**
 * Query Page - Consulta CNPJ
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { apiClient } from '@/lib/api';
import { formatCNPJ } from '@/lib/formatters';
import { CNPJData } from '@/types';

export function QueryPage() {
  const [cnpj, setCnpj] = useState('');
  const [result, setResult] = useState<CNPJData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnpj.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.queryCNPJ(cnpj);
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao consultar CNPJ');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSON = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Erro ao copiar');
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultar CNPJ</h1>
          <p className="text-gray-600 mt-1">Busque informações de empresas brasileiras</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </form>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {result.razao_social || result.estabelecimento?.nome_fantasia || 'Empresa'}
              </h2>
              <button
                onClick={handleCopyJSON}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                {copied ? '✓ Copiado' : 'Copiar JSON'}
              </button>
            </div>

            {/* Dados principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.cnpj_raiz && (
                <div>
                  <p className="text-gray-600 text-sm font-medium">CNPJ Raiz</p>
                  <p className="text-gray-900 font-mono text-lg mt-1">{formatCNPJ(result.cnpj_raiz)}</p>
                </div>
              )}

              {result.capital_social && (
                <div>
                  <p className="text-gray-600 text-sm font-medium">Capital Social</p>
                  <p className="text-gray-900 font-mono text-lg mt-1">
                    R$ {Number(result.capital_social).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {result.estabelecimento?.situacao_cadastral && (
                <div>
                  <p className="text-gray-600 text-sm font-medium">Situação Cadastral</p>
                  <p className="text-gray-900 font-mono text-lg mt-1">
                    {result.estabelecimento.situacao_cadastral}
                  </p>
                </div>
              )}

              {result.atualizado_em && (
                <div>
                  <p className="text-gray-600 text-sm font-medium">Atualizado em</p>
                  <p className="text-gray-900 font-mono text-lg mt-1">
                    {new Date(result.atualizado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* JSON completo */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Completos (JSON)</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
