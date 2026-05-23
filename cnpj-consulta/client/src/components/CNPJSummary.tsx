/**
 * CNPJSummary — Consulta CNPJ
 * Resumo estruturado com os dados principais extraídos da estrutura real da API de CNPJ
 * Estrutura: dados de identificação na raiz, dados do estabelecimento em `estabelecimento`
 * Design: Data Dashboard Minimalista / Governo Digital
 */

import { CNPJData } from "@/hooks/useCNPJ";
import { formatCNPJ, formatCEP, formatDate, formatCapital } from "@/lib/formatters";

interface CNPJSummaryProps {
  data: CNPJData;
}

function InfoField({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: string | undefined | null;
  mono?: boolean;
  className?: string;
}) {
  if (!value || String(value).trim() === "") return null;
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const lower = status.toLowerCase();
  let badgeClass = "badge-pending";
  let dotColor = "bg-yellow-500";

  if (lower.includes("ativa") || lower.includes("regular")) {
    badgeClass = "badge-active";
    dotColor = "bg-green-500";
  } else if (
    lower.includes("baixada") ||
    lower.includes("inapta") ||
    lower.includes("suspensa") ||
    lower.includes("cancelada")
  ) {
    badgeClass = "badge-inactive";
    dotColor = "bg-red-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}

function SectionCard({
  title,
  children,
  animDelay = 0,
}: {
  title: string;
  children: React.ReactNode;
  animDelay?: number;
}) {
  return (
    <div
      className="bg-card rounded-xl border border-border p-5 shadow-sm animate-slide-up card-hover"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-primary inline-block" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export function CNPJSummary({ data }: CNPJSummaryProps) {
  const est = data.estabelecimento || {};

  // Identificação
  const razaoSocial = data.razao_social;
  const nomeFantasia = est.nome_fantasia;
  const cnpj = est.cnpj || data.cnpj_raiz;
  const tipo = est.tipo; // Matriz / Filial

  // Situação
  const situacao = est.situacao_cadastral;
  const dataSituacao = est.data_situacao_cadastral;

  // Porte e natureza
  const porteDesc = data.porte?.descricao;
  const naturezaDesc = data.natureza_juridica?.descricao;

  // Simples / MEI
  const simples = data.simples;
  const isSimples = simples?.simples === "Sim";
  const isMei = simples?.mei === "Sim";

  // Datas
  const dataAbertura = est.data_inicio_atividade;

  // Capital social
  const capitalSocial = data.capital_social;

  // Endereço
  const tipoLogradouro = est.tipo_logradouro || "";
  const logradouro = est.logradouro || "";
  const numero = est.numero || "";
  const complemento = est.complemento || "";
  const bairro = est.bairro || "";
  const cidadeNome = est.cidade?.nome || "";
  const estadoSigla = est.estado?.sigla || est.estado?.nome || "";
  const cepRaw = est.cep || "";
  const cep = cepRaw ? formatCEP(cepRaw.replace(/\D/g, "")) : "";

  const enderecoLinha1 = [
    [tipoLogradouro, logradouro].filter(Boolean).join(" "),
    numero,
    complemento,
  ]
    .filter(Boolean)
    .join(", ");

  const enderecoLinha2 = [bairro, [cidadeNome, estadoSigla].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(" — ");

  // CNAE principal
  const atividadePrincipal = est.atividade_principal;
  const cnaeDescricao = atividadePrincipal?.descricao;
  const cnaeCodigo = atividadePrincipal?.subclasse || atividadePrincipal?.id;

  // Contato
  const tel1 =
    est.ddd1 && est.telefone1
      ? `(${est.ddd1}) ${est.telefone1.replace(/(\d{4,5})(\d{4})$/, "$1-$2")}`
      : undefined;
  const tel2 =
    est.ddd2 && est.telefone2
      ? `(${est.ddd2}) ${est.telefone2.replace(/(\d{4,5})(\d{4})$/, "$1-$2")}`
      : undefined;
  const email = est.email;

  // Inscrições estaduais
  const inscricoes = est.inscricoes_estaduais || [];

  // Capital formatado
  const capitalFormatado =
    capitalSocial !== undefined && capitalSocial !== null && capitalSocial !== ""
      ? formatCapital(parseFloat(String(capitalSocial)))
      : undefined;

  // CNPJ formatado
  const cnpjFormatado = cnpj
    ? formatCNPJ(String(cnpj).replace(/\D/g, ""))
    : undefined;

  const metrics = [
    {
      label: "Abertura",
      value: dataAbertura ? formatDate(dataAbertura) : undefined,
      mono: true,
    },
    {
      label: "Capital Social",
      value: capitalFormatado,
      mono: true,
    },
    {
      label: "Situação em",
      value: dataSituacao ? formatDate(dataSituacao) : undefined,
      mono: true,
    },
    {
      label: "Natureza Jurídica",
      value: naturezaDesc,
      mono: false,
    },
  ].filter((m) => m.value);

  return (
    <div className="space-y-4">
      {/* Card principal — Identificação */}
      <div
        className="bg-card rounded-xl border border-border p-6 shadow-sm animate-slide-up"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {razaoSocial || "—"}
            </h2>
            {nomeFantasia && nomeFantasia !== razaoSocial && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {nomeFantasia}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <StatusBadge status={situacao} />
              {tipo && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                  {tipo}
                </span>
              )}
              {porteDesc && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                  {porteDesc}
                </span>
              )}
              {isMei && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  MEI
                </span>
              )}
              {isSimples && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Simples Nacional
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CNPJ em destaque */}
        <div className="mt-5 pt-4 border-t border-border">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            CNPJ
          </span>
          <p className="text-2xl font-mono font-bold text-primary mt-0.5 tracking-wider">
            {cnpjFormatado || "—"}
          </p>
        </div>
      </div>

      {/* Grid de métricas rápidas */}
      {metrics.length > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up"
          style={{ animationDelay: "40ms" }}
        >
          {metrics.map((metric, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border p-4 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                {metric.label}
              </span>
              <span
                className={`text-sm font-semibold text-foreground mt-1 block leading-snug ${
                  metric.mono ? "font-mono" : ""
                }`}
              >
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Endereço */}
      {(enderecoLinha1 || enderecoLinha2 || cep) && (
        <SectionCard title="Endereço" animDelay={80}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enderecoLinha1 && (
              <InfoField
                label="Logradouro"
                value={enderecoLinha1}
                className="sm:col-span-2"
              />
            )}
            {enderecoLinha2 && (
              <InfoField label="Cidade / UF" value={enderecoLinha2} />
            )}
            {cep && <InfoField label="CEP" value={cep} mono />}
          </div>
        </SectionCard>
      )}

      {/* CNAE Principal */}
      {(cnaeDescricao || cnaeCodigo) && (
        <SectionCard title="Atividade Principal (CNAE)" animDelay={120}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cnaeCodigo && <InfoField label="Código" value={String(cnaeCodigo)} mono />}
            {cnaeDescricao && (
              <InfoField
                label="Descrição"
                value={cnaeDescricao}
                className={cnaeCodigo ? "sm:col-span-1" : ""}
              />
            )}
            {atividadePrincipal?.secao && (
              <InfoField label="Seção" value={atividadePrincipal.secao} />
            )}
          </div>
        </SectionCard>
      )}

      {/* Contato */}
      {(tel1 || tel2 || email) && (
        <SectionCard title="Contato" animDelay={160}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tel1 && <InfoField label="Telefone 1" value={tel1} mono />}
            {tel2 && <InfoField label="Telefone 2" value={tel2} mono />}
            {email && (
              <InfoField
                label="E-mail"
                value={email.toLowerCase()}
                className={tel1 || tel2 ? "sm:col-span-2" : ""}
              />
            )}
          </div>
        </SectionCard>
      )}

      {/* Inscrições Estaduais */}
      {inscricoes.length > 0 && (
        <SectionCard title="Inscrições Estaduais" animDelay={200}>
          <div className="space-y-2">
            {inscricoes.map((ie, idx) => {
              const estadoSigla =
                (ie.estado as { sigla?: string } | undefined)?.sigla ||
                (ie.estado as { nome?: string } | undefined)?.nome ||
                "—";
              const inscricao =
                ie.inscricao_estadual ||
                ie.numero_de_inscricao ||
                (ie.inscricao as string) ||
                "—";
              const ativo = ie.ativo;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                      {estadoSigla}
                    </span>
                    <span className="text-sm font-mono text-foreground">
                      {String(inscricao)}
                    </span>
                  </div>
                  {ativo !== undefined && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        ativo ? "badge-active" : "badge-inactive"
                      }`}
                    >
                      {ativo ? "Ativa" : "Inativa"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
