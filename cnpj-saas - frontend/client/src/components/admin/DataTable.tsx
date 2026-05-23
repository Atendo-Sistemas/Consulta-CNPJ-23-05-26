import React, { useState } from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  onRowClick?: (row: any) => void;
  actions?: Array<{
    label: string;
    onClick: (row: any) => void;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
}

export default function DataTable({
  columns,
  data,
  loading = false,
  onRowClick,
  actions,
  pagination,
  onPageChange,
}: DataTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getActionButtonClass = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return 'text-red-600 hover:text-red-800 text-sm font-medium';
      case 'secondary':
        return 'text-gray-600 hover:text-gray-800 text-sm font-medium';
      default:
        return 'text-blue-600 hover:text-blue-800 text-sm font-medium';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                Nenhum registro encontrado
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-900">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-3">
                      {actions.map((action, actionIdx) => (
                        <button
                          key={actionIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className={getActionButtonClass(action.variant)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.pages} ({pagination.total} registros)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
