
import { format, isValid, addMonths } from 'date-fns';
import { BalancesByCompany, Company, FileType, Transaction, ClientMetadata } from './types';
import * as XLSX from 'xlsx';

const normalizeHeaderToken = (raw: unknown): string => {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export const COMPANIES: Company[] = ['Worldwide Segurança', 'WWS Services', '2WS'];

export const createEmptyBalances = (): BalancesByCompany => ({
  'Worldwide Segurança': 0,
  'WWS Services': 0,
  '2WS': 0,
});

export const sumBalances = (balances: Partial<BalancesByCompany>): number => {
  return COMPANIES.reduce((acc, c) => acc + (Number(balances[c]) || 0), 0);
};

export const getCompanyShortName = (company: Company): string => {
  if (company === 'WWS Services') return 'WWS';
  if (company === 'Worldwide Segurança') return 'Worldwide';
  return '2WS';
};

export const getCompanySubtitle = (company: Company): string => {
  if (company === 'WWS Services') return 'Prestação de Serviços';
  if (company === 'Worldwide Segurança') return 'Segurança Patrimonial';
  return '2WS';
};

export const getCompanyBadgeClass = (company: Company): string => {
  if (company === 'WWS Services') return 'text-emerald-600 bg-emerald-50';
  if (company === 'Worldwide Segurança') return 'text-blue-600 bg-blue-50';
  return 'text-indigo-600 bg-indigo-50';
};

export const getCompanyTextClass = (company: Company): string => {
  if (company === 'WWS Services') return 'text-emerald-600';
  if (company === 'Worldwide Segurança') return 'text-blue-600';
  return 'text-indigo-600';
};

export const FILE_SLOTS_CONFIG: { type: FileType; label: string; status: 'pending' | 'completed'; flow: 'pay' | 'receive'; description: string }[] = [
  { type: 'pagar', label: 'A Pagar (Abertas)', status: 'pending', flow: 'pay', description: 'Boletos e contas futuras' },
  { type: 'pagas', label: 'Pagas (Baixadas)', status: 'completed', flow: 'pay', description: 'Comprovantes e saídas' },
  { type: 'receber', label: 'A Receber (Abertas)', status: 'pending', flow: 'receive', description: 'Faturas emitidas' },
  { type: 'recebidas', label: 'Recebidas (Baixadas)', status: 'completed', flow: 'receive', description: 'Entradas confirmadas' },
];

export const PRELOADED_CLIENTS: Record<string, ClientMetadata> = {
  "0001/21 SAAE - SERVIÇO AUTONOMO DE AGUA E ESGOTO": { category: 'client', type: 'public', city: 'São Carlos', company: 'Worldwide Segurança' },
  "0001/25 MUNICIPIO DE RINCAO CONTROLADOR DE ACESSO": { category: 'client', type: 'public', city: 'Rincão', company: 'WWS Services' },
  "0003/25 CAMARA MUNICIPAL DE CAMPINAS RECEPCIONISTA": { category: 'client', type: 'public', city: 'Campinas', company: 'WWS Services' },
  "0005/21 PREF. S.J.R.P - ATENDENTES": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "0014/25 MUNICIPIO DE RINCAO RECEPCIONISTA": { category: 'client', type: 'public', city: 'Rincão', company: 'WWS Services' },
  "0024/21 PREF. S.J.R.P - SEC. EDUCAÇÃO": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "0025/22 MUNICIPIO CATANDUVA": { category: 'client', type: 'public', city: 'Catanduva', company: 'WWS Services' },
  "0026/24 MARIO GATTI": { category: 'client', type: 'public', city: 'Campinas', company: 'WWS Services' },
  "0037/22 PREF. SÃO CARLOS - PORTARIA": { category: 'client', type: 'public', city: 'São Carlos', company: 'WWS Services' },
  "0048/24 MUNICIPIO DE RINCAO LIMPEZA": { category: 'client', type: 'public', city: 'Rincão', company: 'WWS Services' },
  "0051/25 CRECI SP - MOTORISTA": { category: 'client', type: 'public', city: 'São Paulo', company: 'WWS Services' },
  "0063/19 PREFEITURA FRANCA": { category: 'client', type: 'public', city: 'Franca', company: 'Worldwide Segurança' },
  "0096/22 PREF. S.J.R.P - CONSTRUCAO CIVIL": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "0106/20 PREF. S.J.R.P - LIMPEZA": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "0112/23 PREF. PIRACICABA - ADMINISTRATIVO": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "0128/23 PREF. SÃO CARLOS - LIMPEZA": { category: 'client', type: 'public', city: 'São Carlos', company: 'WWS Services' },
  "0159/21 PREF. S.J.R.P - OBRAS": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "0160/17 BRAGA": { category: 'client', type: 'private', city: 'Hortolândia', company: 'WWS Services' },
  "0182/23 PREF. S.J.R.P - MOTORISTAS": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "0202/18 AZUD": { category: 'client', type: 'private', city: 'Americana', company: 'WWS Services' },
  "0264/21 PREF. SAO JOSE DOS CAMPOS": { category: 'client', type: 'public', city: 'São José dos Campos', company: 'Worldwide Segurança' },
  "0408/25 CONDOMINIO AQUARIUS - LIMPEZA": { category: 'client', type: 'private', city: 'Piracicaba', company: 'WWS Services' },
  "0435/25 PREF. PIRACICABA - SEMOZEL": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "0448/23 PREF. PIRACICABA - CEMITERIO": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "0565/25 PREF. SOROCABA CEMITERIO": { category: 'client', type: 'public', city: 'Sorocaba', company: 'WWS Services' },
  "0704/25 MBM LOGISTICA": { category: 'client', type: 'private', city: 'Americana', company: 'WWS Services' },
  "1003/25 PREF. PIRACICABA - SUPERVISAO PIRACICABA": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "1056/22 PREF. PIRACICABA - ZOOLOGICO": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "1813/22 PREF. PIRACICABA - SAUDE": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "2506/25 PREF. PIRACICABA - SUPERVISAO AMERICANA": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "2608/25 MULTIMALHAS IND. E COM.": { category: 'client', type: 'private', city: 'Americana', company: 'WWS Services' },
  "2807/25 - AIR SLAID - LIMPEZA": { category: 'client', type: 'private', city: 'Americana', company: 'WWS Services' },
  "0001/19 IFSP - CUBATAO": { category: 'client', type: 'public', city: 'Cubatão', company: 'WWS Services' },
  "0000/25 PREF. PIRACICABA - SEMAE VIGILANCIA": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "ENC. / CEAGESP - ARARAQUARA": { category: 'client', type: 'public', city: 'Araraquara', company: 'WWS Services' },
  "ENC. / CEAGESP - BAURU": { category: 'client', type: 'public', city: 'Bauru', company: 'WWS Services' },
  "ENC. / CEAGESP - FRANCA": { category: 'client', type: 'public', city: 'Franca', company: 'WWS Services' },
  "ENC. / CEAGESP - PIRACICABA": { category: 'client', type: 'public', city: 'Piracicaba', company: 'WWS Services' },
  "ENC. / CEAGESP - SOROCABA": { category: 'client', type: 'public', city: 'Sorocaba', company: 'WWS Services' },
  "ENC. / CEAGESP - SÃO JOSÉ DOS CAMPOS": { category: 'client', type: 'public', city: 'São José dos Campos', company: 'WWS Services' },
  "ENC. / LAGGO ARMAZENS": { category: 'client', type: 'private', city: 'Americana', company: 'WWS Services' },
  "ENC. / PREF. S.J.R.P - PORTARIA": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "ENC. / SETEC": { category: 'client', type: 'public', city: 'Campinas', company: 'WWS Services' },
  "ENC. / TRT - BRIGADISTA - RIBEIRÃO PRETO": { category: 'client', type: 'public', city: 'Ribeirão Preto', company: 'WWS Services' },
  "ENC. / TRT - BRIGADISTA - S.J.R.P.": { category: 'client', type: 'public', city: 'São José do Rio Preto', company: 'WWS Services' },
  "ENC. / TRT - SERTAOZINHO": { category: 'client', type: 'public', city: 'Sertãozinho', company: 'WWS Services' },
  "1 Corporativo - Americana": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "2 Corporativo - Piracicaba": { category: 'administrative', type: 'private', city: 'Piracicaba', company: 'WWS Services' },
  "3 Corporativo - SJRP": { category: 'administrative', type: 'private', city: 'São José do Rio Preto', company: 'WWS Services' },
  "Geral": { category: 'administrative', type: 'private', city: '', company: 'WWS Services' },
  "SETOR COMERCIAL PRIVADO - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR COMERCIAL PUBLICO - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR COMPRAS - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR DIRETORIA - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR FINANCEIRO - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR LICITAÇÃO - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR MESA DE OPERAÇÃO - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR OPERACIONAL - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR OPERACIONAL - PIRACICABA": { category: 'administrative', type: 'private', city: 'Piracicaba', company: 'WWS Services' },
  "SETOR OPERACIONAL - SJRP": { category: 'administrative', type: 'private', city: 'São José do Rio Preto', company: 'WWS Services' },
  "SETOR RH - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR RH - SJRP": { category: 'administrative', type: 'private', city: 'São José do Rio Preto', company: 'WWS Services' },
  "SETOR SINDICALIZADOS - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR SUPERVISÃO - AMERICANA": { category: 'administrative', type: 'private', city: 'Americana', company: 'WWS Services' },
  "SETOR SUPERVISÃO - PIRACICABA": { category: 'administrative', type: 'private', city: 'Piracicaba', company: 'WWS Services' },
  "SETOR SUPERVISÃO - SJRP": { category: 'administrative', type: 'private', city: 'São José do Rio Preto', company: 'WWS Services' },
  "0000/25 Classe I": { category: 'administrative', type: 'private', city: '', company: 'WWS Services' },
};

// UI & Formatting Constants
export const CAT_COL_WIDTH = 340;
export const MONTH_COL_WIDTH = 300;

export const formatCurrency = (value: number) => {
  if (isNaN(value) || value === null || value === undefined) {
    value = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencyNoSymbol = (value: number) => {
  if (isNaN(value) || value === null || value === undefined) {
    value = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const parseMoneyToNumber = (raw: unknown): number | null => {
  const t0 = String(raw ?? '').trim();
  if (!t0) return null;

  const isParenNeg = /^\(.*\)$/.test(t0);

  // Keep only digits, separators and minus after stripping common currency/space tokens
  let t = t0
    .replace(/[R$\s\u00A0]/g, '')
    .replace(/^\(/, '')
    .replace(/\)$/, '');

  let s = t.replace(/[^0-9,\.\-]/g, '');
  if (!s) return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Decide decimal separator by last occurrence
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const thousandSep = decimalSep === '.' ? ',' : '.';
    s = s.split(thousandSep).join('');
    if (decimalSep === ',') s = s.replace(/,/g, '.');
  } else if (hasComma) {
    // pt-BR style: 1.234,56
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else if (hasDot) {
    // Common in exports: dot as decimal separator (even with >2 decimals).
    // Only treat dots as thousand separators when there are multiple dots and
    // they match thousands grouping like 1.234.567.
    const parts = s.split('.');
    if (parts.length === 2) {
      // Single dot => decimal separator
      // keep as-is
    } else {
      const first = parts[0] ?? '';
      const rest = parts.slice(1);
      const looksLikeThousands = first.length >= 1 && first.length <= 3 && rest.every(p => p.length === 3);

      if (looksLikeThousands) {
        s = parts.join('');
      } else {
        const dec = parts[parts.length - 1] ?? '';
        const intPart = parts.slice(0, -1).join('');
        s = `${intPart}.${dec}`;
      }
    }
  }

  // Keep only leading minus, if any
  s = s.replace(/(?!^)-/g, '');

  const n = Number(s);
  if (!Number.isFinite(n)) return null;

  const negative = isParenNeg || s.startsWith('-');
  return negative ? -Math.abs(n) : n;
};

export const getValueColor = (val: number) => {
  if (isNaN(val) || val === null || val === undefined || val === 0) return 'text-slate-300';
  return val < 0 ? 'text-rose-600' : 'text-emerald-600';
};

// Date Helpers
const parseDateString = (dateVal: string | null | undefined): Date | null => {
  if (!dateVal) return null;
  const parts = String(dateVal).trim().split('/');
  if (parts.length === 3) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  const d = new Date(dateVal);
  return isValid(d) ? d : null;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const startOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

export const endOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
};

export const subMonths = (date: Date, amount: number): Date => {
  return addMonths(date, -amount);
};

export const subYears = (date: Date, amount: number): Date => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() - amount);
  return d;
};

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const getEffectiveDate = (t: Transaction) => {
  if (t.status === 'completed') {
    return t.paymentDate || t.dueDate;
  }
  return t.dueDate;
};

const isExcelFile = (filename: string): boolean => {
  const ext = filename.toLowerCase().split('.').pop();
  // ExcelJS supports modern Office Open XML formats in the browser.
  // Legacy .xls is not supported here.
  return ext === 'xlsx' || ext === 'xlsm';
};

const readExcelFileWithSheetJs = (arrayBuffer: ArrayBuffer): string[][] => {
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    raw: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  }) as unknown[];

  return rows.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? '')) : []));
};

const readExcelFile = (file: File): Promise<string[][]> => {
  return (async () => {
    const arrayBuffer = await file.arrayBuffer();
    return readExcelFileWithSheetJs(arrayBuffer);
  })();
};

const readTextFile = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        // Detect separator (TSV, ;, ,) from the first non-empty line.
        const first = lines[0] ?? '';
        const semicolons = (first.match(/;/g) || []).length;
        const commas = (first.match(/,/g) || []).length;
        const tabs = (first.match(/\t/g) || []).length;
        const sep = tabs >= semicolons && tabs >= commas ? '\t' : (semicolons >= commas ? ';' : ',');

        const rows = lines.map(line => line.split(sep));
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsText(file, 'windows-1252');
  });
};

export const parseFinanceFile = async (file: File, company: Company, slotType: FileType): Promise<Transaction[]> => {
  try {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'xls') {
      console.error(`Formato .xls não é suportado no navegador (${file.name}). Salve como .xlsx e tente novamente.`);
      return [];
    }

    const isExcel = isExcelFile(file.name);
    let rows: string[][] = [];

    if (isExcel) {
      try {
        rows = await readExcelFile(file);
      } catch (err) {
        console.warn(`Erro ao ler como Excel (${file.name}), tentando fallback para texto/csv...`, err);
        rows = await readTextFile(file);
      }
    } else {
      rows = await readTextFile(file);
    }

    if (rows.length < 2) {
      return [];
    }

    // Some exports include a title row, blank rows, or multiple header blocks.
    // Scan the first ~30 rows to find the best candidate header row.
    const headerScanLimit = Math.min(rows.length, 30);
    const headerCandidates = Array.from({ length: headerScanLimit }, (_, idx) => {
      const r = rows[idx] ?? [];
      const normalized = r.map(normalizeHeaderToken);

      const nonEmpty = normalized.filter(Boolean).length;
      const hasAmount = normalized.some(h => h.includes('valor') || h.includes('total') || h.includes('liquido') || h.includes('montante'));
      const hasDate = normalized.some(h => h.includes('venc') || h.includes('pag') || h === 'data' || h.includes('emiss') || h.includes('compet'));
      const hasDesc = normalized.some(h => h.includes('desc') || h.includes('hist') || h.includes('fornecedor') || h.includes('cliente') || h.includes('nome'));

      // Prefer rows that look like a header: multiple columns + key tokens.
      const score = (hasAmount ? 5 : 0) + (hasDate ? 2 : 0) + (hasDesc ? 1 : 0) + Math.min(nonEmpty, 10) / 10;
      return { idx, normalized, score, nonEmpty, hasAmount };
    });

    const best = headerCandidates
      .filter(c => c.nonEmpty >= 2)
      .sort((a, b) => b.score - a.score)[0];

    const headerRowIndex = best?.hasAmount ? best.idx : 0;
    const headers = (rows[headerRowIndex] ?? []).map(normalizeHeaderToken);
    console.log(`[Financas] Header detectado em ${file.name} (linha ${headerRowIndex + 1}):`, rows[headerRowIndex] ?? []);

    const dueDateIdx = headers.findIndex((h) => h.includes('vencimento') || h.includes('vencto') || h.includes('venc'));
    const payDateIdx = headers.findIndex((h) => h.includes('pagamento') || h.includes('recebimento') || h.includes('baixa') || h.includes('liquidacao') || h.includes('liquidac'));
    const compDateIdx = headers.findIndex((h) => h.includes('competencia') || h.includes('compet') || h === 'comp');

    const genericDateIdx = headers.findIndex((h) => h === 'data' || h.includes('emissao') || h.includes('emiss') || h.includes('dia'));

    const amountIdx = headers.findIndex((h) => {
      const compact = h.replace(/\s+/g, '');
      return (
        h.includes('valor') ||
        h.includes('total') ||
        h.includes('liquido') ||
        h.includes('montante') ||
        h.includes('vlr') ||
        compact.includes('r$') ||
        h.includes('$')
      );
    });

    let descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('hist'));
    if (descIdx === -1) {
      descIdx = headers.findIndex((h) => h.includes('fornecedor') || h.includes('cliente') || h.includes('nome'));
    }

    const catIdx = headers.findIndex((h) => h.includes('cat') || h.includes('class') || h.includes('grupo') || h.includes('conta') || h.includes('plano'));
    const ccIdx = headers.findIndex((h) => h.includes('centro') || h.includes('custo') || h.includes('dep') || h.includes('cc') || h.includes('projeto'));
    const nomeIdx = headers.findIndex((h) => h === 'nome' || h.includes('fornecedor') || h.includes('cliente'));

    if (amountIdx === -1) {
      console.warn(`Coluna de valor não encontrada em ${file.name}`);
      return [];
    }

    const transactions: Transaction[] = [];
    const config = FILE_SLOTS_CONFIG.find(c => c.type === slotType)!;
    const baseTimestamp = Date.now();

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];

      let rawDueDate = (dueDateIdx !== -1) ? row[dueDateIdx] : row[genericDateIdx];
      let dueDate = parseDateString(rawDueDate);

      let rawPayDate = (payDateIdx !== -1) ? row[payDateIdx] : null;
      let paymentDate = parseDateString(rawPayDate);

      let rawCompDate = (compDateIdx !== -1) ? row[compDateIdx] : null;
      let competencyDate = parseDateString(rawCompDate);

      if (config.status === 'completed' && !paymentDate && dueDate) {
        paymentDate = dueDate;
      }
      if (!dueDate && paymentDate) {
        dueDate = paymentDate;
      }
      if (!competencyDate && dueDate) {
        competencyDate = dueDate;
      }

      if (!dueDate) continue;

      const amountVal = row[amountIdx];
      const parsedAmount = parseMoneyToNumber(amountVal) ?? 0;

      let category = 'Geral';
      if (catIdx !== -1 && row[catIdx]) {
        category = String(row[catIdx]).trim();
      } else {
        category = config.flow === 'receive' ? '1. Receitas' : '3. Despesas';
      }

      let costCenter = 'Geral';
      if (ccIdx !== -1 && row[ccIdx]) {
        costCenter = String(row[ccIdx]).trim();
      }

      const description = row[descIdx] ? String(row[descIdx]).trim() : 'Sem descrição';
      const nome = (nomeIdx !== -1 && row[nomeIdx]) ? String(row[nomeIdx]).trim() : '';

      const lineIndex = i - 1;
      const id = `${crypto.randomUUID()}-${baseTimestamp}-${lineIndex}`;

      transactions.push({
        id: id,
        company,
        type: config.flow,
        status: config.status,
        dueDate: dueDate!,
        paymentDate: paymentDate || undefined,
        competencyDate: competencyDate || undefined,
        amount: parsedAmount,
        description: description,
        category: category,
        costCenter: costCenter,
        originalFile: file.name,
        nome: nome
      });
    }

    return transactions;
  } catch (err) {
    console.error('Erro ao processar arquivo:', err);
    throw err;
  }
};
