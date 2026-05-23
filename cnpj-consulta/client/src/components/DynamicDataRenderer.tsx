/**
 * DynamicDataRenderer — Consulta CNPJ
 * Renderiza automaticamente qualquer estrutura JSON: primitivos, objetos, arrays e arrays de objetos.
 * Adaptado à estrutura real da API de CNPJ
 * Design: Data Dashboard Minimalista / Governo Digital
 */

import { autoFormat, humanizeKey } from "@/lib/formatters";

interface DynamicDataRendererProps {
  data: unknown;
  keyName?: string;
  depth?: number;
  skipKeys?: string[];
}

/** Verifica se um valor é "vazio" para fins de exibição */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  )
    return true;
  return false;
}

/** Verifica se um objeto é "plano" (todos os valores são primitivos ou null) */
function isFlat(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(
    (v) =>
      v === null ||
      v === undefined ||
      typeof v !== "object" ||
      (Array.isArray(v) && v.length === 0)
  );
}

/** Renderiza um valor primitivo formatado */
function PrimitiveValue({
  keyName,
  value,
}: {
  keyName: string;
  value: unknown;
}) {
  const formatted = autoFormat(keyName, value);
  const k = keyName.toLowerCase();
  const isMono =
    k.includes("cnpj") ||
    k.includes("cep") ||
    k.includes("codigo") ||
    k.includes("code") ||
    k.includes("data") ||
    k.includes("date") ||
    k === "email" ||
    k.includes("telefone") ||
    k.includes("capital") ||
    k === "id" ||
    k.includes("subclasse") ||
    k.includes("inscricao");

  const isStatus =
    k.includes("situacao") ||
    k.includes("status") ||
    k === "ativo" ||
    k === "tipo";

  const getBadgeClass = (val: string) => {
    const lower = val.toLowerCase();
    if (lower === "sim" || lower === "ativa" || lower === "ativo" || lower.includes("regular"))
      return "badge-active";
    if (lower === "não" || lower === "inativa" || lower === "inativo" || lower.includes("baixada") || lower.includes("inapta"))
      return "badge-inactive";
    return null;
  };

  if (isStatus && typeof value === "boolean") {
    const badgeClass = value ? "badge-active" : "badge-inactive";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
        {formatted}
      </span>
    );
  }

  if (isStatus && typeof value === "string") {
    const badgeClass = getBadgeClass(value);
    if (badgeClass) {
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
          {formatted}
        </span>
      );
    }
  }

  return (
    <span className={`text-sm text-foreground ${isMono ? "font-mono" : ""}`}>
      {formatted}
    </span>
  );
}

/** Renderiza um objeto plano como grade de campos */
function FlatObjectGrid({
  obj,
  skipKeys = [],
}: {
  obj: Record<string, unknown>;
  skipKeys?: string[];
}) {
  const entries = Object.entries(obj).filter(
    ([k, v]) => !skipKeys.includes(k) && !isEmpty(v)
  );
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {humanizeKey(k)}
          </span>
          <PrimitiveValue keyName={k} value={v} />
        </div>
      ))}
    </div>
  );
}

/** Renderiza um array de objetos como tabela */
function ObjectTable({
  items,
  keyName,
}: {
  items: Record<string, unknown>[];
  keyName: string;
}) {
  if (items.length === 0) return null;

  // Coleta todas as chaves únicas, filtrando as que têm apenas valores vazios
  const allKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item)))
  ).filter((k) => {
    return items.some((item) => !isEmpty(item[k]) && typeof item[k] !== "object");
  });

  // Chaves de objetos aninhados (para expandir inline)
  const nestedKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item)))
  ).filter((k) => {
    return items.some(
      (item) =>
        item[k] !== null &&
        typeof item[k] === "object" &&
        !Array.isArray(item[k])
    );
  });

  if (allKeys.length === 0 && nestedKeys.length === 0) return null;

  // Se poucos itens e muitas colunas, usar cards em vez de tabela
  if (items.length <= 3 && allKeys.length + nestedKeys.length > 6) {
    return (
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-border p-4 bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allKeys.filter((k) => !isEmpty(item[k])).map((k) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {humanizeKey(k)}
                  </span>
                  <PrimitiveValue keyName={k} value={item[k]} />
                </div>
              ))}
              {nestedKeys.filter((k) => !isEmpty(item[k])).map((k) => {
                const nested = item[k] as Record<string, unknown>;
                const flatEntries = Object.entries(nested).filter(
                  ([, v]) => !isEmpty(v) && typeof v !== "object"
                );
                if (flatEntries.length === 0) return null;
                return (
                  <div key={k} className="sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                      {humanizeKey(k)}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {flatEntries.map(([nk, nv]) => (
                        <span key={nk} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                          <span className="text-muted-foreground">{humanizeKey(nk)}: </span>
                          {autoFormat(nk, nv)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {allKeys.map((k) => (
              <th
                key={k}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap"
              >
                {humanizeKey(k)}
              </th>
            ))}
            {nestedKeys.map((k) => (
              <th
                key={k}
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap"
              >
                {humanizeKey(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={idx}
              className="border-t border-border hover:bg-muted/30 transition-colors"
            >
              {allKeys.map((k) => (
                <td key={k} className="px-3 py-2">
                  {isEmpty(item[k]) ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : (
                    <PrimitiveValue keyName={k} value={item[k]} />
                  )}
                </td>
              ))}
              {nestedKeys.map((k) => (
                <td key={k} className="px-3 py-2">
                  {isEmpty(item[k]) ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {Object.entries(item[k] as Record<string, unknown>)
                        .filter(([, v]) => !isEmpty(v) && typeof v !== "object")
                        .map(([nk, nv]) => autoFormat(nk, nv))
                        .join(" · ")}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Renderiza um array de primitivos como lista de pills */
function PrimitiveList({
  items,
  keyName,
}: {
  items: unknown[];
  keyName: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-mono"
        >
          {autoFormat(keyName, item)}
        </span>
      ))}
    </div>
  );
}

/** Componente principal de renderização dinâmica */
export function DynamicDataRenderer({
  data,
  keyName = "",
  depth = 0,
  skipKeys = [],
}: DynamicDataRendererProps) {
  if (isEmpty(data)) return null;

  // Primitivo
  if (typeof data !== "object") {
    return <PrimitiveValue keyName={keyName} value={data} />;
  }

  // Array
  if (Array.isArray(data)) {
    if (data.length === 0) return null;

    // Array de objetos → tabela ou cards
    if (typeof data[0] === "object" && data[0] !== null && !Array.isArray(data[0])) {
      return (
        <ObjectTable
          items={data as Record<string, unknown>[]}
          keyName={keyName}
        />
      );
    }

    // Array de primitivos → pills
    return <PrimitiveList items={data} keyName={keyName} />;
  }

  // Objeto
  const obj = data as Record<string, unknown>;
  const entries = Object.entries(obj).filter(
    ([k, v]) => !skipKeys.includes(k) && !isEmpty(v)
  );

  if (entries.length === 0) return null;

  // Objeto plano → grade
  if (isFlat(obj)) {
    return <FlatObjectGrid obj={obj} skipKeys={skipKeys} />;
  }

  // Objeto misto
  if (depth === 0) {
    return (
      <div className="space-y-4">
        {entries.map(([k, v]) => {
          if (typeof v !== "object" || v === null) {
            return (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {humanizeKey(k)}
                </span>
                <PrimitiveValue keyName={k} value={v} />
              </div>
            );
          }
          return (
            <div key={k}>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
                {humanizeKey(k)}
              </span>
              <DynamicDataRenderer data={v} keyName={k} depth={depth + 1} />
            </div>
          );
        })}
      </div>
    );
  }

  // Objeto aninhado mais profundo → grade compacta
  return <FlatObjectGrid obj={obj} skipKeys={skipKeys} />;
}

/** Seção dinâmica completa com título e card */
export function DynamicSection({
  title,
  data,
  skipKeys = [],
  className = "",
  animDelay = 0,
}: {
  title: string;
  data: unknown;
  skipKeys?: string[];
  className?: string;
  animDelay?: number;
}) {
  if (isEmpty(data)) return null;

  return (
    <div
      className={`bg-card rounded-xl border border-border p-5 shadow-sm animate-slide-up card-hover ${className}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-primary inline-block" />
        {title}
      </h3>
      <DynamicDataRenderer data={data} skipKeys={skipKeys} />
    </div>
  );
}
