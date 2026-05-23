/**
 * Página Inicial — Consulta CNPJ
 * Layout assimétrico: formulário fixo à esquerda, resultados à direita.
 * Adaptado à estrutura real da API de CNPJ
 * Design: Painel de Dados Minimalista / Governo Digital
 * Paleta: Azul-índigo institucional + cinza-pedra
 * Tipografia: Plus Jakarta Sans + JetBrains Mono
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useCNPJ, CNPJData } from "@/hooks/useCNPJ";
import { useQueryHistory } from "@/hooks/useQueryHistory";
import { maskCNPJ, countFilledFields, countTotalFields } from "@/lib/formatters";
import { CNPJSummary } from "@/components/CNPJSummary";
import { QueryHistory } from "@/components/QueryHistory";
import { DynamicSection } from "@/components/DynamicDataRenderer";
import { JSONViewer } from "@/components/JSONViewer";
import { SkeletonLoader } from "@/components/SkeletonLoader";

// Chaves já tratadas pelo CNPJSummary ou que são sub-objetos do estabelecimento
const HANDLED_KEYS = new Set([
  "cnpj_raiz",
  "razao_social",
  "capital_social",
  "responsavel_federativo",
  "atualizado_em",
  "porte",
  "natureza_juridica",
  "qualificacao_do_responsavel",
  "socios",
  "simples",
  "estabelecimento",
]);

function FieldCounter({ data }: { data: CNPJData }) {
  const filled = countFilledFields(data);
  const total = countTotalFields(data);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border shadow-sm animate-fade-in">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Campos preenchidos
          </span>
          <span className="text-xs font-mono font-bold text-primary">
            {filled} / {total}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: "var(--color-primary)",
            }}
          />
        </div>
      </div>
      <span className="text-sm font-bold font-mono text-foreground w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

export default function Home() {
  const [cnpjInput, setCnpjInput] = useState("");
  const [showJSON, setShowJSON] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, query, clear } = useCNPJ();
  const { history, isLoaded, add: addToHistory, clear: clearHistory, remove: removeFromHistory } = useQueryHistory();

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCnpjInput(maskCNPJ(e.target.value));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!cnpjInput.trim()) return;
      query(cnpjInput);
    },
    [cnpjInput, query]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        query(cnpjInput);
      }
    },
    [cnpjInput, query]
  );

  const handleClear = useCallback(() => {
    setCnpjInput("");
    clear();
    inputRef.current?.focus();
  }, [clear]);

  const handleHistorySelect = useCallback(
    (cnpj: string) => {
      const masked = maskCNPJ(cnpj);
      setCnpjInput(masked);
      query(cnpj);
      setShowHistory(false);
    },
    [query]
  );

  const handleCopyJSON = useCallback(async () => {
    if (!data) return;
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  // Adicionar ao histórico quando conseguir dados
  useEffect(() => {
    if (data && isLoaded) {
      const razaoSocial = data.razao_social;
      const cnpj = data.estabelecimento?.cnpj || data.cnpj_raiz;
      if (cnpj) {
        addToHistory(cnpj, razaoSocial);
      }
    }
  }, [data, isLoaded, addToHistory]);

  // Rolar para resultados no celular
  useEffect(() => {
    if ((data || error) && window.innerWidth < 1024) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data, error]);

  // Seções dinâmicas do estabelecimento
  const est = data?.estabelecimento || {};
  const estSections = [
    { key: "atividades_secundarias", title: "CNAEs Secundários" },
    { key: "inscricoes_estaduais", title: "Inscrições Estaduais (Detalhado)" },
  ];

  // Campos extras do estabelecimento não mapeados no resumo
  const estHandledKeys = new Set([
    "cnpj", "cnpj_raiz", "cnpj_ordem", "cnpj_digito_verificador",
    "tipo", "nome_fantasia", "situacao_cadastral", "data_situacao_cadastral",
    "data_inicio_atividade", "tipo_logradouro", "logradouro", "numero",
    "complemento", "bairro", "cep", "ddd1", "telefone1", "ddd2", "telefone2",
    "ddd_fax", "fax", "email", "situacao_especial", "data_situacao_especial",
    "atualizado_em", "atividade_principal", "atividades_secundarias",
    "pais", "estado", "cidade", "motivo_situacao_cadastral",
    "inscricoes_estaduais", "nome_cidade_exterior",
  ]);

  const estExtras = Object.entries(est).filter(
    ([k, v]) => !estHandledKeys.has(k) && v !== null && v !== undefined && v !== ""
  );

  // Campos extras da raiz não mapeados
  const rootExtras = data
    ? Object.entries(data).filter(
        ([k, v]) => !HANDLED_KEYS.has(k) && v !== null && v !== undefined && v !== ""
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <span className="font-bold text-foreground text-sm tracking-tight">
              Consulta CNPJ
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
              API Pública
            </span>
          </div>

        </div>
      </header>

      {/* Layout principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-8 lg:items-start">

          {/* Coluna esquerda — Formulário fixo */}
          <aside className="lg:sticky lg:top-[4.5rem] space-y-4 mb-8 lg:mb-0">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground leading-tight">
                Consulta de CNPJ
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dados completos de empresas brasileiras em tempo real.
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="cnpj-input"
                  className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5"
                >
                  CNPJ
                </label>
                <div className="relative">
                  <input
                    id="cnpj-input"
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={cnpjInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    autoComplete="off"
                    className="w-full h-12 pl-4 pr-10 rounded-xl border-2 border-border bg-card text-foreground font-mono text-base placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors duration-150"
                    aria-label="Digite o CNPJ"
                  />
                  {cnpjInput && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Limpar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cnpjInput.replace(/\D/g, "").length !== 14}
                className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                }}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Consultando...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Consultar CNPJ
                  </>
                )}
              </button>
            </form>

            {/* Histórico de consultas */}
            {isLoaded && (
              <div className="rounded-xl border border-border bg-card p-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between mb-3 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <span className="flex items-center gap-2 uppercase tracking-wide">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Histórico
                    {history.length > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        {history.length}
                      </span>
                    )}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${showHistory ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showHistory && (
                  <QueryHistory
                    history={history}
                    onSelect={handleHistorySelect}
                    onRemove={removeFromHistory}
                    onClear={clearHistory}
                  />
                )}
              </div>
            )}

            {/* Exemplos rápidos */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Exemplos para testar:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Petrobras", cnpj: "33000167000101" },
                  { label: "Embraer", cnpj: "07689002000189" },
                  { label: "Nubank", cnpj: "18236120000158" },
                ].map(({ label, cnpj }) => (
                  <button
                    key={cnpj}
                    type="button"
                    onClick={() => {
                      const masked = maskCNPJ(cnpj);
                      setCnpjInput(masked);
                      query(cnpj);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors font-medium border border-border"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info sobre a API */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Sobre a API
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dados da Receita Federal. Gratuita, sem autenticação, com limite de requisições por minuto.
              </p>
            </div>

            {/* Resultado da consulta anterior */}
            {data && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Última consulta
                </p>
                <p className="text-xs font-mono text-foreground truncate">
                  {cnpjInput}
                </p>
                {data.atualizado_em && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualizado: {new Date(data.atualizado_em).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            )}
          </aside>

          {/* Coluna direita — Resultados */}
          <main ref={resultsRef} className="min-w-0">
            {/* Estado inicial */}
            {!data && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Comece a consultar</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Digite um CNPJ no campo ao lado para obter informações completas da empresa.
                </p>
              </div>
            )}

            {/* Carregamento */}
            {loading && <SkeletonLoader />}

            {/* Erro */}
            {error && !loading && (
              <div className="animate-slide-up">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-destructive"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      {error.status === 404
                        ? "CNPJ não encontrado"
                        : error.status === 429
                        ? "Limite de requisições atingido"
                        : "Erro na consulta"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {error.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resultado */}
            {data && !loading && (
              <div className="space-y-4">
                {/* Barra de ações */}
                <div className="flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex-1 min-w-0">
                    <FieldCounter data={data} />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={handleCopyJSON}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted transition-all duration-150 active:scale-95"
                      title="Copiar JSON"
                    >
                      {copied ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-green-600">Copiado</span>
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copiar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowJSON(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted transition-all duration-150 active:scale-95"
                      title="Ver JSON bruto"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                      JSON Bruto
                    </button>
                  </div>
                </div>

                {/* Resumo estruturado */}
                <CNPJSummary data={data} />

                {/* Sócios */}
                {data.socios && data.socios.length > 0 && (
                  <DynamicSection
                    title="Quadro Societário"
                    data={data.socios}
                    animDelay={240}
                  />
                )}

                {/* CNAEs Secundários */}
                {est.atividades_secundarias && (est.atividades_secundarias as unknown[]).length > 0 && (
                  <DynamicSection
                    title="CNAEs Secundários"
                    data={est.atividades_secundarias}
                    animDelay={280}
                  />
                )}

                {/* Simples Nacional */}
                {data.simples && (
                  <DynamicSection
                    title="Simples Nacional / MEI"
                    data={data.simples}
                    animDelay={320}
                  />
                )}

                {/* Campos extras do estabelecimento */}
                {estExtras.length > 0 && (
                  <DynamicSection
                    title="Dados do Estabelecimento"
                    data={Object.fromEntries(estExtras)}
                    animDelay={360}
                  />
                )}

                {/* Campos extras da raiz */}
                {rootExtras.length > 0 && (
                  <DynamicSection
                    title="Dados Adicionais"
                    data={Object.fromEntries(rootExtras)}
                    animDelay={400}
                  />
                )}

                {/* Rodapé */}
                <div className="text-center py-4 animate-fade-in">
                  <p className="text-xs text-muted-foreground">
                    Dados obtidos da Receita Federal do Brasil
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal JSON */}
      {showJSON && data && (
        <JSONViewer data={data} onClose={() => setShowJSON(false)} />
      )}
    </div>
  );
}
