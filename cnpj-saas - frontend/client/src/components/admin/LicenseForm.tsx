import React, { useState } from 'react';

interface LicenseFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  initialData?: any;
}

export default function LicenseForm({ onSubmit, onCancel, loading = false, initialData }: LicenseFormProps) {
  const [formData, setFormData] = useState({
    tenantId: initialData?.tenantId || '',
    ipAddress: initialData?.ipAddress || '',
    queriesLimit: initialData?.queriesLimit || 1000,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'queriesLimit' ? parseInt(value) : value,
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenantId) newErrors.tenantId = 'Reseller é obrigatório';
    if (!formData.ipAddress) newErrors.ipAddress = 'IP é obrigatório';
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(formData.ipAddress)) {
      newErrors.ipAddress = 'IP inválido';
    }
    if (formData.queriesLimit < 1) newErrors.queriesLimit = 'Limite deve ser maior que 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reseller</label>
        <input
          type="text"
          name="tenantId"
          value={formData.tenantId}
          onChange={handleChange}
          placeholder="ID do reseller"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.tenantId ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading || !!initialData}
        />
        {errors.tenantId && <p className="text-red-600 text-sm mt-1">{errors.tenantId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço IP</label>
        <input
          type="text"
          name="ipAddress"
          value={formData.ipAddress}
          onChange={handleChange}
          placeholder="192.168.1.1"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.ipAddress ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {errors.ipAddress && <p className="text-red-600 text-sm mt-1">{errors.ipAddress}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Consultas</label>
        <input
          type="number"
          name="queriesLimit"
          value={formData.queriesLimit}
          onChange={handleChange}
          min="1"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.queriesLimit ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {errors.queriesLimit && <p className="text-red-600 text-sm mt-1">{errors.queriesLimit}</p>}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Salvando...' : 'Criar Licença'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
