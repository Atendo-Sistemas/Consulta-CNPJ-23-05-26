import React, { useState } from 'react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    resellerPrice: 50,
    userPrice: 10,
    queryPrice: 0.01,
    defaultQueriesLimit: 1000,
    licenseValidityDays: 30,
    maxFailedValidations: 3,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      // Aqui você faria a chamada à API para salvar as configurações
      console.log('Salvando configurações:', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-gray-600">Gerencie os preços e limites do sistema</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preços */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Preços</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço por Licença de Reseller (mensal)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-700">R$</span>
              <input
                type="number"
                name="resellerPrice"
                value={settings.resellerPrice}
                onChange={handleChange}
                step="0.01"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Preço cobrado de cada reseller por mês</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço por Usuário Adicional (mensal)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-700">R$</span>
              <input
                type="number"
                name="userPrice"
                value={settings.userPrice}
                onChange={handleChange}
                step="0.01"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Preço cobrado por usuário adicional</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço por Consulta Extra
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-700">R$</span>
              <input
                type="number"
                name="queryPrice"
                value={settings.queryPrice}
                onChange={handleChange}
                step="0.001"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Preço cobrado por consulta além do limite</p>
          </div>
        </div>

        {/* Limites */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Limites Padrão</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limite Padrão de Consultas
            </label>
            <input
              type="number"
              name="defaultQueriesLimit"
              value={settings.defaultQueriesLimit}
              onChange={handleChange}
              step="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">Limite padrão ao criar uma nova licença</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validade Padrão da Licença (dias)
            </label>
            <input
              type="number"
              name="licenseValidityDays"
              value={settings.licenseValidityDays}
              onChange={handleChange}
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">Número de dias até a licença expirar</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Validações Falhadas
            </label>
            <input
              type="number"
              name="maxFailedValidations"
              value={settings.maxFailedValidations}
              onChange={handleChange}
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">Número de validações falhadas antes de bloquear</p>
          </div>
        </div>
      </div>

      {/* Resumo de Receita */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Resumo de Receita Estimada</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Por Licença (mensal)</p>
            <p className="text-2xl font-bold text-blue-600">R$ {settings.resellerPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Por Usuário (mensal)</p>
            <p className="text-2xl font-bold text-blue-600">R$ {settings.userPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Por Consulta</p>
            <p className="text-2xl font-bold text-blue-600">R$ {settings.queryPrice.toFixed(3)}</p>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Salvar Configurações
        </button>
        <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
          Cancelar
        </button>
      </div>
    </div>
  );
}
