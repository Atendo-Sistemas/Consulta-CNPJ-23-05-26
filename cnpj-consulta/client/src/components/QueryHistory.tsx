/**
 * QueryHistory — Consulta CNPJ
 * Componente para exibir e gerenciar histórico de consultas
 * Design: Data Dashboard Minimalista / Governo Digital
 */

import { QueryHistoryItem } from "@/hooks/useQueryHistory";
import { formatCNPJ } from "@/lib/formatters";

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelect: (cnpj: string) => void;
  onRemove: (cnpj: string) => void;
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  // Menos de 1 minuto
  if (diff < 60000) return "Agora";

  // Menos de 1 hora
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}m atrás`;
  }

  // Menos de 24 horas
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h atrás`;
  }

  // Menos de 7 dias
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d atrás`;
  }

  // Data completa
  const date = new Date(timestamp);
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
  });
}

export function QueryHistory({
  history,
  onSelect,
  onRemove,
  onClear,
}: QueryHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-6">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto text-muted-foreground mb-2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p className="text-xs text-muted-foreground">Nenhuma consulta realizada</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Lista de histórico */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.cnpj}
            onClick={() => onSelect(item.cnpj)}
            className="w-full text-left group cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(item.cnpj);
              }
            }}
          >
            <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-semibold text-foreground truncate">
                  {formatCNPJ(item.cnpj)}
                </p>
                {item.razaoSocial && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.razaoSocial}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {formatTime(item.timestamp)}
                </p>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.cnpj);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(item.cnpj);
                  }
                }}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Remover do histórico"
                role="button"
                tabIndex={0}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botão limpar histórico */}
      {history.length > 0 && (
        <button
          onClick={onClear}
          className="w-full text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors py-2 px-3 rounded-lg border border-border hover:border-destructive/30 hover:bg-destructive/5"
        >
          Limpar histórico
        </button>
      )}
    </div>
  );
}
