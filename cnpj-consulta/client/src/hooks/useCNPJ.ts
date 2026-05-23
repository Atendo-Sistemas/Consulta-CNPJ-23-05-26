/**
 * Hook useCNPJ — Consulta CNPJ
 * Gerencia estado de busca, carregamento e erros para a API de CNPJ
 * Estrutura real: dados principais em `estabelecimento`, sócios em `socios`, etc.
 */

import { useState, useCallback } from "react";

export interface CNPJEstabelecimento {
  cnpj?: string;
  cnpj_raiz?: string;
  cnpj_ordem?: string;
  cnpj_digito_verificador?: string;
  tipo?: string;
  nome_fantasia?: string;
  situacao_cadastral?: string;
  data_situacao_cadastral?: string;
  data_inicio_atividade?: string;
  tipo_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  ddd1?: string;
  telefone1?: string;
  ddd2?: string;
  telefone2?: string;
  ddd_fax?: string;
  fax?: string;
  email?: string;
  situacao_especial?: string;
  data_situacao_especial?: string;
  atualizado_em?: string;
  atividade_principal?: {
    id?: string;
    secao?: string;
    divisao?: string;
    grupo?: string;
    classe?: string;
    subclasse?: string;
    descricao?: string;
  };
  atividades_secundarias?: Array<{
    id?: string;
    descricao?: string;
    [key: string]: unknown;
  }>;
  pais?: { id?: string; iso2?: string; iso3?: string; nome?: string };
  estado?: { id?: string; nome?: string; sigla?: string; ibge_id?: string };
  cidade?: { id?: string; nome?: string; ibge_id?: string; siafi_id?: string };
  motivo_situacao_cadastral?: { id?: number; descricao?: string } | null;
  inscricoes_estaduais?: Array<{
    inscricao_estadual?: string;
    ativo?: boolean;
    atualizado_em?: string;
    estado?: { id?: string; nome?: string; sigla?: string };
    [key: string]: unknown;
  }>;
  nome_cidade_exterior?: string | null;
  [key: string]: unknown;
}

export interface CNPJData {
  cnpj_raiz?: string;
  razao_social?: string;
  capital_social?: string | number;
  responsavel_federativo?: string;
  atualizado_em?: string;
  porte?: { id?: string; descricao?: string };
  natureza_juridica?: { id?: string; descricao?: string };
  qualificacao_do_responsavel?: { id?: number; descricao?: string };
  socios?: Array<{
    cpf_cnpj_socio?: string;
    nome?: string;
    tipo?: string;
    data_entrada?: string;
    faixa_etaria?: string;
    qualificacao_socio?: { id?: number; descricao?: string };
    pais?: { id?: string; nome?: string; iso2?: string };
    [key: string]: unknown;
  }>;
  simples?: {
    simples?: string;
    data_opcao_simples?: string;
    data_exclusao_simples?: string;
    mei?: string;
    data_opcao_mei?: string;
    data_exclusao_mei?: string;
    [key: string]: unknown;
  } | null;
  estabelecimento?: CNPJEstabelecimento;
  [key: string]: unknown;
}

export interface CNPJError {
  message: string;
  status?: number;
}

export interface UseCNPJReturn {
  data: CNPJData | null;
  loading: boolean;
  error: CNPJError | null;
  query: (cnpj: string) => Promise<void>;
  clear: () => void;
}

export function useCNPJ(): UseCNPJReturn {
  const [data, setData] = useState<CNPJData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CNPJError | null>(null);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  const query = useCallback(async (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, "");

    if (digits.length !== 14) {
      setError({ message: "CNPJ deve conter 14 dígitos." });
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        `https://publica.cnpj.ws/cnpj/${digits}`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (response.status === 404) {
        throw { message: "CNPJ não encontrado na base de dados.", status: 404 };
      }
      if (response.status === 429) {
        throw {
          message:
            "Limite de consultas atingido. Aguarde alguns instantes e tente novamente.",
          status: 429,
        };
      }
      if (!response.ok) {
        throw {
          message: `Erro ao consultar CNPJ (código ${response.status}).`,
          status: response.status,
        };
      }

      const json = await response.json();
      setData(json);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError(err as CNPJError);
      } else {
        setError({
          message:
            "Não foi possível conectar à API. Verifique sua conexão e tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, query, clear };
}
