/**
 * Formatters — Consulta CNPJ
 * Funções de formatação automática para dados retornados pela API pública de CNPJ
 */

/** Formata CNPJ: 00.000.000/0000-00 */
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/** Aplica máscara de CNPJ durante digitação */
export function maskCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return digits.replace(/^(\d{2})(\d+)$/, "$1.$2");
  if (digits.length <= 8)
    return digits.replace(/^(\d{2})(\d{3})(\d+)$/, "$1.$2.$3");
  if (digits.length <= 12)
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1.$2.$3/$4");
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)$/,
    "$1.$2.$3/$4-$5"
  );
}

/** Formata CEP: 00000-000 */
export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return value;
  return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/** Formata telefone: (00) 0000-0000 ou (00) 00000-0000 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10)
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  if (digits.length === 11)
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  return value;
}

/** Formata data ISO (AAAA-MM-DD) para DD/MM/AAAA */
export function formatDate(value: string): string {
  if (!value) return value;
  // AAAA-MM-DD
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  // AAAA-MM-DD HH:MM:SS
  const isoDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T?(\d{2}:\d{2})/);
  if (isoDateTimeMatch)
    return `${isoDateTimeMatch[3]}/${isoDateTimeMatch[2]}/${isoDateTimeMatch[1]} ${isoDateTimeMatch[4]}`;
  // YYYYMMDD
  const compactMatch = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) return `${compactMatch[3]}/${compactMatch[2]}/${compactMatch[1]}`;
  return value;
}

/** Formata capital social em BRL */
export function formatCapital(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(num);
}

/** Formata booleano em texto legível */
export function formatBoolean(value: boolean): string {
  return value ? "Sim" : "Não";
}

/** Detecta e formata automaticamente um valor baseado em seu tipo e nome do campo */
export function autoFormat(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return formatBoolean(value);

  const k = key.toLowerCase();
  const str = String(value);

  // Capital social
  if (k.includes("capital") && typeof value === "number") {
    return formatCapital(value);
  }

  // CNPJ
  if (k === "cnpj" || k.includes("cnpj")) {
    const digits = str.replace(/\D/g, "");
    if (digits.length === 14) return formatCNPJ(digits);
  }

  // CEP
  if (k === "cep" || k.includes("cep")) {
    const digits = str.replace(/\D/g, "");
    if (digits.length === 8) return formatCEP(digits);
  }

  // Telefone / DDD
  if (k.includes("telefone") || k.includes("fone") || k.includes("ddd")) {
    const digits = str.replace(/\D/g, "");
    if (digits.length >= 10) return formatPhone(digits);
  }

  // Data
  if (
    k.includes("data") ||
    k.includes("date") ||
    k.includes("abertura") ||
    k.includes("situacao") && str.match(/^\d{4}-\d{2}-\d{2}/)
  ) {
    const formatted = formatDate(str);
    if (formatted !== str) return formatted;
  }

  // Detecta padrão de data automaticamente
  if (str.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/)) {
    const formatted = formatDate(str);
    if (formatted !== str) return formatted;
  }

  return str;
}

/** Conta campos preenchidos (não nulos, não vazios, não arrays/objects vazios) recursivamente */
export function countFilledFields(obj: unknown): number {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj === "boolean") return 1;
  if (typeof obj === "number") return 1;
  if (typeof obj === "string") return obj.trim() !== "" ? 1 : 0;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 0;
    return obj.reduce((acc: number, item) => acc + countFilledFields(item), 0);
  }
  if (typeof obj === "object") {
    return Object.values(obj as Record<string, unknown>).reduce(
      (acc: number, v) => acc + countFilledFields(v),
      0
    );
  }
  return 0;
}

/** Conta total de campos (incluindo vazios) */
export function countTotalFields(obj: unknown): number {
  if (obj === null || obj === undefined) return 1;
  if (typeof obj !== "object") return 1;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return 1;
    return obj.reduce((acc: number, item) => acc + countTotalFields(item), 0);
  }
  return Object.values(obj as Record<string, unknown>).reduce(
    (acc: number, v) => acc + countTotalFields(v),
    0
  );
}

/** Humaniza chave de campo (snake_case → Texto Legível) */
export function humanizeKey(key: string): string {
  const map: Record<string, string> = {
    cnpj: "CNPJ",
    razao_social: "Razão Social",
    nome_fantasia: "Nome Fantasia",
    capital_social: "Capital Social",
    natureza_juridica: "Natureza Jurídica",
    porte: "Porte",
    situacao_cadastral: "Situação Cadastral",
    data_situacao_cadastral: "Data da Situação",
    motivo_situacao_cadastral: "Motivo da Situação",
    data_abertura: "Data de Abertura",
    cnae_fiscal: "CNAE Fiscal",
    cnae_fiscal_descricao: "Descrição do CNAE",
    descricao_tipo_de_logradouro: "Tipo de Logradouro",
    logradouro: "Logradouro",
    numero: "Número",
    complemento: "Complemento",
    bairro: "Bairro",
    municipio: "Município",
    uf: "UF",
    cep: "CEP",
    ddd_telefone_1: "Telefone 1",
    ddd_telefone_2: "Telefone 2",
    ddd_fax: "Fax",
    email: "E-mail",
    opcao_pelo_simples: "Optante pelo Simples",
    data_opcao_pelo_simples: "Data Opção Simples",
    data_exclusao_do_simples: "Data Exclusão Simples",
    opcao_pelo_mei: "Optante pelo MEI",
    situacao_especial: "Situação Especial",
    data_situacao_especial: "Data Situação Especial",
    codigo_municipio: "Código Município",
    codigo_municipio_ibge: "Código IBGE",
    codigo_pais: "Código País",
    nome_pais: "País",
    codigo_natureza_juridica: "Código Natureza Jurídica",
    codigo_porte: "Código Porte",
    descricao_porte: "Descrição do Porte",
    identificador_matriz_filial: "Matriz/Filial",
    descricao_identificador_matriz_filial: "Tipo",
    tipo: "Tipo",
    nome: "Nome",
    codigo: "Código",
    descricao: "Descrição",
    data: "Data",
    pais: "País",
    qualificacao: "Qualificação",
    faixa_etaria: "Faixa Etária",
    cpf_representante_legal: "CPF Representante",
    nome_representante_legal: "Nome Representante",
    qualificacao_representante_legal: "Qualificação Representante",
    data_entrada_sociedade: "Data de Entrada",
    percentual_capital_social: "Percentual do Capital",
    numero_de_inscricao: "Número de Inscrição",
    estado: "Estado",
    ativo: "Ativo",
    inscricao: "Inscrição",
    nire: "NIRE",
    data_registro: "Data de Registro",
  };

  if (map[key]) return map[key];

  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
