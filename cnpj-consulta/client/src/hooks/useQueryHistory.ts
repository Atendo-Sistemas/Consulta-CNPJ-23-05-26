/**
 * Hook useQueryHistory — Consulta CNPJ
 * Gerencia histórico de consultas com localStorage
 */

import { useState, useCallback, useEffect } from "react";

export interface QueryHistoryItem {
  cnpj: string;
  razaoSocial?: string;
  timestamp: number;
}

const STORAGE_KEY = "cnpj_query_history";
const MAX_HISTORY = 20;

export function useQueryHistory() {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as QueryHistoryItem[];
        setHistory(parsed);
      }
    } catch {
      // Ignorar erros de parsing
    }
    setIsLoaded(true);
  }, []);

  // Adicionar item ao histórico
  const add = useCallback(
    (cnpj: string, razaoSocial?: string) => {
      const digits = cnpj.replace(/\D/g, "");
      if (digits.length !== 14) return;

      setHistory((prev) => {
        // Remove duplicata se existir
        const filtered = prev.filter((item) => item.cnpj !== digits);

        // Adiciona no início
        const updated = [
          {
            cnpj: digits,
            razaoSocial,
            timestamp: Date.now(),
          },
          ...filtered,
        ].slice(0, MAX_HISTORY);

        // Salva no localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignorar erros de storage
        }

        return updated;
      });
    },
    []
  );

  // Limpar histórico
  const clear = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignorar erros
    }
  }, []);

  // Remover item específico
  const remove = useCallback((cnpj: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.cnpj !== cnpj);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar erros
      }
      return updated;
    });
  }, []);

  return { history, isLoaded, add, clear, remove };
}
