import React, { useEffect, useMemo, useState, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs/dist/exceljs.min.js';
import { Plus, Upload, AlertTriangle, FileText, CheckCircle2, ChevronDown, ChevronRight, TrendingUp, BarChart3 } from 'lucide-react';
import { eachMonthOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';

import { Company, Transaction } from '../../../types';
import { formatCurrency, parseMoneyToNumber, CAT_COL_WIDTH } from '../../../utils';

const VALUE_COL_WIDTH = 160;
const HEADER_BG = '#f8fafc';
const FOOTER_BG = '#0f172a';
const BORDER_LIGHT = 'rgba(226, 232, 240, 1)';
const BORDER_DARK = 'rgba(30, 41, 59, 1)';

type BudgetVersionType = 'initial' | 'forecast';

type BudgetVersionRow = {
    id: string;
    name: string;
    year: number;
    type: BudgetVersionType;
    start_month: number | null;
    company: Company | 'all';
    created_at: string;
};

type ImportLayout = 'rows' | 'month_columns';

type BudgetLineInsert = {
    version_id: string;
    company: Company;
    cost_center: string;
    coa_code: string;
    year: number;
    month: number;
    amount: number;
};

const isMissingBudgetTablesError = (err: unknown): boolean => {
    const msg = String((err as any)?.message ?? err ?? '');
    return msg.includes("Could not find the table 'public.budget_versions'")
        || msg.includes("Could not find the table 'public.budget_lines'")
        || msg.includes('budget_versions') && msg.includes('Could not find the table')
        || msg.includes('budget_lines') && msg.includes('Could not find the table');
};

const missingBudgetTablesMessage =
    'As tabelas do Controle Orçamentário não existem nesse Supabase. ' +
    'Crie as tabelas `budget_versions` e `budget_lines` no schema `public` (SQL disponível em `supabase/migrations/20260206200000_add_financas_budget_tables.sql`). ' +
    'Depois, recarregue o schema do PostgREST (Dashboard: Settings → API → Reload schema / Restart API).';

const normalizeToken = (raw: string): string => {
    return String(raw ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
};

const monthNameToNumber = (raw: string): number | null => {
    const normalized = normalizeToken(raw);
    if (!normalized) return null;

    const prefix = normalized.slice(0, 3);
    const map: Record<string, number> = {
        jan: 1,
        fev: 2,
        mar: 3,
        abr: 4,
        mai: 5,
        jun: 6,
        jul: 7,
        ago: 8,
        set: 9,
        out: 10,
        nov: 11,
        dez: 12,
    };
    if (prefix in map) return map[prefix];
    return null;
};

const parseCompanyFromCell = (raw: string): Company | null => {
    const normalized = normalizeToken(raw);
    if (!normalized) return null;

    // Accept: Worldwide, Worldwide Segurança, WWS, WWS Services, 2WS
    if (normalized.includes('worldwide')) return 'Worldwide Segurança';
    if (normalized === 'wws' || normalized.includes('wwsservices') || normalized.includes('services')) return 'WWS Services';
    if (normalized.includes('2ws')) return '2WS';

    return null;
};

const parseAmount = (raw: string): number | null => {
    return parseMoneyToNumber(raw);
};

const parseMonthFromCell = (raw: string): number | null => {
    const t = String(raw ?? '').trim();
    if (!t) return null;

    const direct = Number(t.replace(',', '.'));
    if (Number.isFinite(direct) && direct >= 1 && direct <= 12) return Math.trunc(direct);

    const monthName = monthNameToNumber(t);
    if (monthName) return monthName;

    // Try patterns like 01/2026, 2026-01, 01-2026
    const m1 = t.match(/^(\d{1,2})\D+(\d{4})$/);
    if (m1) {
        const mm = Number(m1[1]);
        if (mm >= 1 && mm <= 12) return mm;
    }

    const m2 = t.match(/^(\d{4})\D+(\d{1,2})$/);
    if (m2) {
        const mm = Number(m2[2]);
        if (mm >= 1 && mm <= 12) return mm;
    }

    return null;
};

const roundMoney2 = (value: number): number => {
    // Round to 2 decimals (currency) with safer float handling
    return Math.round((value + Number.EPSILON) * 100) / 100;
};

const readExcelRows = async (file: File): Promise<string[][]> => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'xlsm') {
        throw new Error('Formato inválido. Use .xlsx ou .xlsm.');
    }

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(buffer) as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const colCount = Math.max(worksheet.columnCount || 0, 1);
    const processed: string[][] = [];

    worksheet.eachRow({ includeEmpty: true }, (row) => {
        const rowValues: string[] = [];
        for (let col = 1; col <= colCount; col++) {
            const cell = row.getCell(col);
            let value: unknown = cell.value;
            if (value && typeof value === 'object' && 'result' in (value as any)) {
                value = (value as any).result;
            }
            if (value instanceof Date) {
                rowValues.push(value.toISOString().slice(0, 10));
            } else {
                rowValues.push(String(value ?? cell.text ?? ''));
            }
        }
        processed.push(rowValues);
    });

    // Trim empty trailing rows
    while (processed.length > 0 && processed[processed.length - 1].every(c => String(c ?? '').trim() === '')) {
        processed.pop();
    }

    return processed;
};

const readCsvRows = async (file: File): Promise<string[][]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];

    const first = lines[0];
    const semicolons = (first.match(/;/g) || []).length;
    const commas = (first.match(/,/g) || []).length;
    const tabs = (first.match(/\t/g) || []).length;
    const sep = semicolons >= commas && semicolons >= tabs ? ';' : (commas >= tabs ? ',' : '\t');

    return lines.map(line => line.split(sep).map(c => String(c ?? '')));
};

const readBudgetFileRows = async (file: File): Promise<string[][]> => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'csv') return readCsvRows(file);
    return readExcelRows(file);
};

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

interface BudgetTabProps {
    supabaseClient: SupabaseClient | null;
    isConnected: boolean;
    selectedCompany: Company | 'all';
    startDate: Date;
    endDate: Date;
    data: Transaction[];
    selectedCostCenters: string[];
    categoryRenames: Record<string, string>;
}

const BudgetTab: React.FC<BudgetTabProps> = ({
    supabaseClient,
    isConnected,
    selectedCompany,
    startDate,
    endDate,
    data,
    selectedCostCenters,
    categoryRenames,
}) => {
    const activeYear = startDate.getFullYear();

    const [versions, setVersions] = useState<BudgetVersionRow[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [versionsError, setVersionsError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newName, setNewName] = useState('');
    const [newYear, setNewYear] = useState<number>(activeYear);
    const [newType, setNewType] = useState<BudgetVersionType>('initial');
    const [newStartMonth, setNewStartMonth] = useState<number>(1);

    // Import Wizard
    const [importOpen, setImportOpen] = useState(false);
    const [importStep, setImportStep] = useState<1 | 2>(1);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importRows, setImportRows] = useState<string[][]>([]);
    const [importReading, setImportReading] = useState(false);
    const [hasHeader, setHasHeader] = useState(true);
    const [dataStartRow, setDataStartRow] = useState<number>(2);
    const [layout, setLayout] = useState<ImportLayout>('rows');

    const [targetVersionId, setTargetVersionId] = useState<string>('');
    const [companyCol, setCompanyCol] = useState<number>(-1);
    const [ccCol, setCcCol] = useState<number>(-1);
    const [coaCol, setCoaCol] = useState<number>(-1);
    const [monthCol, setMonthCol] = useState<number>(-1);
    const [amountCol, setAmountCol] = useState<number>(-1);
    const [monthCols, setMonthCols] = useState<number[]>([]);

    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ inserted: number; skipped: number } | null>(null);

    // Comparativo (Arquivo x Importação)
    const [compareVersionId, setCompareVersionId] = useState<string>('');
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState<string | null>(null);
    const [budgetLines, setBudgetLines] = useState<Array<{ coa_code: string; cost_center: string; year: number; month: number; amount: number; company: Company }>>([]);

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [showChart, setShowChart] = useState(false);

    const headerScrollRef = useRef<HTMLDivElement>(null);
    const bodyScrollRef = useRef<HTMLDivElement>(null);
    const footerScrollRef = useRef<HTMLDivElement>(null);
    const categoryBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setNewYear(activeYear);
    }, [activeYear]);

    const canQuery = useMemo(() => {
        return Boolean(supabaseClient) && isConnected;
    }, [supabaseClient, isConnected]);

    const loadVersions = async () => {
        if (!supabaseClient || !isConnected) return;

        setVersionsLoading(true);
        setVersionsError(null);
        try {
            let query = supabaseClient.from('budget_versions').select('*').eq('year', activeYear);

            if (selectedCompany === 'all') {
                query = query.eq('company', 'all');
            } else {
                query = query.eq('company', selectedCompany);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            setVersions((data ?? []) as BudgetVersionRow[]);
        } catch (e: any) {
            if (isMissingBudgetTablesError(e)) {
                setVersionsError(missingBudgetTablesMessage);
            } else {
                setVersionsError(e?.message || 'Erro ao carregar versões do orçamento.');
            }
            setVersions([]);
        } finally {
            setVersionsLoading(false);
        }
    };

    useEffect(() => {
        if (!canQuery) {
            setVersions([]);
            return;
        }
        loadVersions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canQuery, selectedCompany, activeYear]);

    useEffect(() => {
        if (versions.length > 0 && !targetVersionId) {
            setTargetVersionId(versions[0].id);
        }
    }, [versions, targetVersionId]);

    useEffect(() => {
        if (versions.length > 0 && !compareVersionId) {
            setCompareVersionId(versions[0].id);
        }
    }, [versions, compareVersionId]);

    const rangeMonthKeys = useMemo(() => {
        const start = startOfMonth(startDate);
        const end = startOfMonth(endDate);
        const months = eachMonthOfInterval({ start, end });
        return new Set(months.map((d) => format(d, 'yyyy-MM')));
    }, [startDate, endDate]);

    const loadBudgetLinesForCompare = async () => {
        if (!supabaseClient) return;
        if (!compareVersionId) return;

        setCompareLoading(true);
        setCompareError(null);
        try {
            let query = supabaseClient
                .from('budget_lines')
                .select('coa_code,cost_center,year,month,amount,company')
                .eq('version_id', compareVersionId);

            if (selectedCompany !== 'all') {
                query = query.eq('company', selectedCompany);
            }

            if (selectedCostCenters.length > 0) {
                query = query.in('cost_center', selectedCostCenters);
            }

            const { data: rows, error } = await query;
            if (error) throw error;

            setBudgetLines((rows ?? []) as any);
        } catch (e: any) {
            if (isMissingBudgetTablesError(e)) {
                setCompareError(missingBudgetTablesMessage);
            } else {
                setCompareError(e?.message || 'Erro ao carregar linhas do orçamento.');
            }
            setBudgetLines([]);
        } finally {
            setCompareLoading(false);
        }
    };

    useEffect(() => {
        if (!canQuery) {
            setBudgetLines([]);
            return;
        }
        if (!compareVersionId) return;
        loadBudgetLinesForCompare();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canQuery, compareVersionId, startDate, endDate, selectedCostCenters.join('|')]);

    const plannedByCode = useMemo(() => {
        const out: Record<string, number> = {};
        for (const line of budgetLines) {
            const monthKey = `${String(line.year).padStart(4, '0')}-${String(line.month).padStart(2, '0')}`;
            if (!rangeMonthKeys.has(monthKey)) continue;
            const code = String(line.coa_code || '').trim();
            if (!code) continue;
            out[code] = (out[code] ?? 0) + Math.abs(Number(line.amount) || 0);
        }
        return out;
    }, [budgetLines, rangeMonthKeys]);

    const actualByCode = useMemo(() => {
        const out: Record<string, number> = {};
        const start = startOfMonth(startDate);
        const end = endOfMonth(endDate);

        for (const t of data) {
            if (selectedCompany !== 'all' && t.company !== selectedCompany) continue;
            if (selectedCostCenters.length > 0 && !selectedCostCenters.includes(t.costCenter)) continue;

            const comp = t.competencyDate;
            if (!comp) continue;
            if (comp < start || comp > end) continue;

            const match = t.category.match(/^([\d\.]+)\s*(.*)/);
            const code = match ? match[1] : (t.type === 'receive' ? '1.99' : '3.99');
            out[code] = (out[code] ?? 0) + Math.abs(Number(t.amount) || 0);
        }

        return out;
    }, [data, selectedCompany, selectedCostCenters, startDate, endDate]);

    const nameByCodeFromTransactions = useMemo(() => {
        const out: Record<string, string> = {};
        for (const t of data) {
            const raw = String((t as any)?.category ?? '').trim();
            const m = raw.match(/^([\d\.]+)\s*(.*)$/);
            if (!m) continue;

            const code = String(m[1] ?? '').trim();
            const name = String(m[2] ?? '').trim();
            if (!code || !name) continue;

            if (!out[code] || name.length > out[code].length) {
                out[code] = name;
            }
        }
        return out;
    }, [data]);

    const compareRows = useMemo(() => {
        const codes = new Set<string>([...Object.keys(plannedByCode), ...Object.keys(actualByCode)]);
        const arr = Array.from(codes);
        arr.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        return arr.map((code) => {
            const planned = plannedByCode[code] ?? 0;
            const actual = actualByCode[code] ?? 0;
            const diff = planned - actual;
            const rename = categoryRenames[code];
            const fallbackName = nameByCodeFromTransactions[code];
            const label = rename
                ? (rename.startsWith(code) ? rename : `${code} ${rename}`)
                : (fallbackName ? `${code} ${fallbackName}` : code);
            return { code, label, planned, actual, diff };
        });
    }, [plannedByCode, actualByCode, categoryRenames, nameByCodeFromTransactions]);

    const compareTree = useMemo(() => {
        type Node = {
            code: string;
            title: string;
            level: number;
            children: Set<string>;
            ownPlanned: number;
            ownActual: number;
            planned: number;
            actual: number;
            diff: number;
        };

        const buildTitle = (code: string): string => {
            const rename = categoryRenames[code];
            if (rename) return rename.startsWith(code) ? rename : `${code} ${rename}`;

            const fallbackName = nameByCodeFromTransactions[code];
            return fallbackName ? `${code} ${fallbackName}` : code;
        };

        const nodes = new Map<string, Node>();

        const ensureNode = (code: string): Node => {
            const existing = nodes.get(code);
            if (existing) return existing;
            const created: Node = {
                code,
                title: buildTitle(code),
                level: String(code).split('.').filter(Boolean).length || 1,
                children: new Set<string>(),
                ownPlanned: 0,
                ownActual: 0,
                planned: 0,
                actual: 0,
                diff: 0,
            };
            nodes.set(code, created);
            return created;
        };

        // Seed leaf nodes (codes present in either planned/actual)
        for (const r of compareRows) {
            const code = String(r.code ?? '').trim();
            if (!code) continue;
            const node = ensureNode(code);
            node.title = r.label;
            node.ownPlanned += r.planned ?? 0;
            node.ownActual += r.actual ?? 0;
        }

        // Ensure all prefix nodes exist and connect parent -> child
        for (const code of nodes.keys()) {
            const parts = String(code).split('.').filter(Boolean);
            for (let i = 1; i < parts.length; i++) {
                const parentCode = parts.slice(0, i).join('.');
                const childCode = parts.slice(0, i + 1).join('.');
                const parent = ensureNode(parentCode);
                ensureNode(childCode);
                parent.children.add(childCode);
            }
        }

        // Compute totals bottom-up (children already computed because deeper level)
        const nodeList = Array.from(nodes.values()).sort((a, b) => b.level - a.level);
        for (const node of nodeList) {
            let planned = node.ownPlanned;
            let actual = node.ownActual;
            for (const childCode of node.children) {
                const child = nodes.get(childCode);
                if (!child) continue;
                planned += child.planned;
                actual += child.actual;
            }
            node.planned = planned;
            node.actual = actual;
            node.diff = planned - actual;
        }

        const roots = Array.from(nodes.values())
            .filter((n) => n.level === 1)
            .map((n) => n.code)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        const sortedChildren = (code: string): string[] => {
            const node = nodes.get(code);
            if (!node) return [];
            return Array.from(node.children).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        };

        return { nodes, roots, sortedChildren };
    }, [compareRows, categoryRenames, nameByCodeFromTransactions]);

    const handleHorizontalScroll = (source: HTMLDivElement) => {
        const scrollLeft = source.scrollLeft;
        if (headerScrollRef.current && headerScrollRef.current !== source) {
            headerScrollRef.current.scrollLeft = scrollLeft;
        }
        if (bodyScrollRef.current && bodyScrollRef.current !== source) {
            bodyScrollRef.current.scrollLeft = scrollLeft;
        }
        if (footerScrollRef.current && footerScrollRef.current !== source) {
            footerScrollRef.current.scrollLeft = scrollLeft;
        }
    };

    const handleBodyVerticalScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (categoryBodyRef.current) {
            categoryBodyRef.current.style.transform = `translateY(-${target.scrollTop}px)`;
        }
    };

    const visibleCompareRows = useMemo(() => {
        const out: Array<{
            code: string;
            title: string;
            level: number;
            planned: number;
            actual: number;
            diff: number;
            childCount: number;
            expanded: boolean;
            isLeaf: boolean;
        }> = [];

        const { nodes, roots, sortedChildren } = compareTree;

        const flatten = (code: string) => {
            const node = nodes.get(code);
            if (!node) return;
            const children = sortedChildren(code);
            const expanded = expandedGroups[code] ?? true;
            const isLeaf = children.length === 0;

            out.push({
                code: node.code,
                title: node.title,
                level: node.level,
                planned: node.planned,
                actual: node.actual,
                diff: node.diff,
                childCount: children.length,
                expanded,
                isLeaf,
            });

            if (!isLeaf && expanded) {
                for (const child of children) flatten(child);
            }
        };

        for (const root of roots) flatten(root);
        return out;
    }, [compareTree, expandedGroups]);

    const headerOptions = useMemo(() => {
        const rows = importRows;
        const maxCols = Math.max(0, ...rows.map(r => r.length));

        const headerRow = hasHeader && rows.length > 0 ? rows[0] : [];
        const opts = Array.from({ length: maxCols }, (_, idx) => {
            const labelBase = hasHeader ? String(headerRow[idx] ?? '').trim() : '';
            const label = labelBase ? `${idx + 1} — ${labelBase}` : `${idx + 1}`;
            return { idx, label };
        });

        return opts;
    }, [importRows, hasHeader]);

    const previewMonthColsSet = useMemo(() => {
        if (layout !== 'month_columns') return new Set<number>();
        return new Set(monthCols);
    }, [layout, monthCols]);

    useEffect(() => {
        if (layout !== 'month_columns') return;
        if (importRows.length === 0) return;
        if (monthCols.length > 0) return;

        const header = importRows[0] ?? [];
        const autoMonthCols: number[] = [];
        for (let i = 0; i < header.length; i++) {
            if (monthNameToNumber(String(header[i] ?? '')) != null) autoMonthCols.push(i);
        }
        setMonthCols(autoMonthCols);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout, importRows]);

    const resetImportWizard = () => {
        setImportStep(1);
        setImportFile(null);
        setImportRows([]);
        setImportReading(false);
        setHasHeader(true);
        setDataStartRow(2);
        setLayout('rows');
        setCompanyCol(-1);
        setCcCol(-1);
        setCoaCol(-1);
        setMonthCol(-1);
        setAmountCol(-1);
        setMonthCols([]);
        setImportResult(null);
    };

    const handlePickImportFile = async (file: File) => {
        setImportFile(file);
        setImportResult(null);
        setImportReading(true);
        try {
            const rows = await readBudgetFileRows(file);
            if (rows.length === 0) {
                alert('A planilha está vazia.');
                setImportRows([]);
                return;
            }
            setImportRows(rows);
            setHasHeader(true);
            setDataStartRow(2);

            const header = (rows[0] ?? []).map(h => String(h ?? ''));
            const normalizedHeaders = header.map(h => normalizeToken(h));

            const findHeaderIdx = (candidates: string[]) => {
                const normalizedCandidates = candidates.map(c => normalizeToken(c));
                return normalizedHeaders.findIndex(h => normalizedCandidates.some(c => h.includes(c) || h === c));
            };

            const autoCompany = findHeaderIdx(['empresa', 'companhia']);
            const autoCc = findHeaderIdx(['centro de custo', 'centrodecusto', 'cc', 'c.c']);
            const autoCoa = findHeaderIdx(['categoria', 'coa', 'conta', 'classificacao']);

            const autoMonthCols: number[] = [];
            for (let i = 0; i < header.length; i++) {
                if (monthNameToNumber(header[i]) != null) autoMonthCols.push(i);
            }

            setCompanyCol(autoCompany);
            setCcCol(autoCc);
            setCoaCol(autoCoa);
            setMonthCols(autoMonthCols);

            if (autoMonthCols.length >= 6) {
                setLayout('month_columns');
                setMonthCol(-1);
                setAmountCol(-1);
            }

            setImportStep(2);
        } catch (e: any) {
            alert(e?.message || 'Erro ao ler o arquivo.');
            setImportRows([]);
        } finally {
            setImportReading(false);
        }
    };

    const buildBudgetLines = (version: BudgetVersionRow): { lines: BudgetLineInsert[]; skipped: number } => {
        const rows = importRows;
        if (rows.length === 0) return { lines: [], skipped: 0 };

        const startIdx = Math.max(0, (dataStartRow || 1) - 1);

        let skipped = 0;
        const out: BudgetLineInsert[] = [];

        if (layout === 'rows') {
            for (let r = startIdx; r < rows.length; r++) {
                const row = rows[r] || [];
                const rawCompany = String(row[companyCol] ?? '').trim();
                const rawCc = String(row[ccCol] ?? '').trim();
                const rawCoa = String(row[coaCol] ?? '').trim();
                const rawMonth = String(row[monthCol] ?? '').trim();
                const rawAmount = String(row[amountCol] ?? '').trim();

                if (!rawCc || !rawCoa || !rawMonth || !rawAmount) {
                    skipped++;
                    continue;
                }

                const company = version.company === 'all' ? parseCompanyFromCell(rawCompany) : (version.company as Company);
                if (!company) {
                    skipped++;
                    continue;
                }

                const month = parseMonthFromCell(rawMonth);
                const amount = parseAmount(rawAmount);

                if (!month || amount === null) {
                    skipped++;
                    continue;
                }

                const normalizedAmount = Math.abs(roundMoney2(amount));

                out.push({
                    version_id: version.id,
                    company,
                    cost_center: rawCc,
                    coa_code: rawCoa,
                    year: version.year,
                    month,
                    amount: normalizedAmount,
                });
            }
        }

        if (layout === 'month_columns') {
            const header = rows[0] ?? [];
            const monthMap = new Map<number, number>();
            for (const idx of monthCols) {
                const m = monthNameToNumber(String(header[idx] ?? ''));
                if (m) monthMap.set(idx, m);
            }

            for (let r = startIdx; r < rows.length; r++) {
                const row = rows[r] || [];
                const rawCompany = String(row[companyCol] ?? '').trim();
                const rawCc = String(row[ccCol] ?? '').trim();
                const rawCoa = String(row[coaCol] ?? '').trim();

                if (!rawCc || !rawCoa) {
                    skipped++;
                    continue;
                }

                const company = version.company === 'all' ? parseCompanyFromCell(rawCompany) : (version.company as Company);
                if (!company) {
                    skipped++;
                    continue;
                }

                for (const [colIdx, month] of monthMap.entries()) {
                    const rawAmount = String(row[colIdx] ?? '').trim();
                    if (!rawAmount || rawAmount === '-') continue;
                    const amount = parseAmount(rawAmount);
                    if (amount === null) continue;

                    const normalizedAmount = Math.abs(roundMoney2(amount));

                    out.push({
                        version_id: version.id,
                        company,
                        cost_center: rawCc,
                        coa_code: rawCoa,
                        year: version.year,
                        month,
                        amount: normalizedAmount,
                    });
                }
            }
        }

        return { lines: out, skipped };
    };

    const handleImport = async () => {
        if (!supabaseClient) return;
        if (!importFile || importRows.length === 0) {
            alert('Selecione um arquivo (Excel ou CSV).');
            return;
        }
        if (!targetVersionId) {
            alert('Selecione uma versão de destino.');
            return;
        }
        const version = versions.find(v => v.id === targetVersionId);
        if (!version) {
            alert('Versão inválida.');
            return;
        }
        if (version.company === 'all' && companyCol < 0) {
            alert('Para versões do tipo “Todas”, selecione a coluna Empresa.');
            return;
        }

        if (layout === 'rows') {
            if (ccCol < 0 || coaCol < 0 || monthCol < 0 || amountCol < 0) {
                alert('Preencha o mapeamento das colunas (CC, CoA, Mês, Valor).');
                return;
            }
        }

        if (layout === 'month_columns') {
            if (!hasHeader) {
                alert('Para “Meses em colunas”, marque “1ª linha é cabeçalho”.');
                return;
            }
            if (ccCol < 0 || coaCol < 0) {
                alert('Preencha o mapeamento das colunas (CC, Categoria/CoA).');
                return;
            }
            if (monthCols.length === 0) {
                alert('Nenhuma coluna de mês foi detectada/selecionada.');
                return;
            }
        }

        setImporting(true);
        setImportResult(null);
        try {
            const { lines, skipped } = buildBudgetLines(version);
            if (lines.length === 0) {
                alert('Nenhuma linha válida encontrada com o mapeamento atual.');
                return;
            }

            let inserted = 0;
            const chunks = chunkArray(lines, 500);
            for (const chunk of chunks) {
                const { error } = await supabaseClient
                    .from('budget_lines')
                    .upsert(chunk, {
                        onConflict: 'version_id,company,cost_center,coa_code,year,month',
                    });
                if (error) throw error;
                inserted += chunk.length;
            }

            setImportResult({ inserted, skipped });

            setCompareVersionId(targetVersionId);
            await loadBudgetLinesForCompare();
        } catch (e: any) {
            if (isMissingBudgetTablesError(e)) {
                alert(missingBudgetTablesMessage);
            } else {
                alert(e?.message || 'Erro ao importar linhas.');
            }
        } finally {
            setImporting(false);
        }
    };

    const handleCreateVersion = async () => {
        if (!supabaseClient) return;

        const trimmed = newName.trim();
        if (!trimmed) {
            alert('Informe um nome para a versão.');
            return;
        }

        if (!Number.isFinite(newYear) || newYear < 2000 || newYear > 2100) {
            alert('Ano inválido.');
            return;
        }

        if (newType === 'forecast' && (newStartMonth < 1 || newStartMonth > 12)) {
            alert('Mês inicial do forecast inválido.');
            return;
        }

        setCreating(true);
        try {
            const payload: any = {
                name: trimmed,
                year: newYear,
                type: newType,
                start_month: newType === 'forecast' ? newStartMonth : null,
                company: selectedCompany === 'all' ? 'all' : selectedCompany,
            };

            const { error } = await supabaseClient.from('budget_versions').insert(payload);
            if (error) throw error;

            setCreateOpen(false);
            setNewName('');
            setNewType('initial');
            setNewStartMonth(1);
            await loadVersions();
        } catch (e: any) {
            if (isMissingBudgetTablesError(e)) {
                alert(missingBudgetTablesMessage);
            } else {
                alert(e?.message || 'Erro ao criar versão.');
            }
        } finally {
            setCreating(false);
        }
    };

    if (!isConnected || !supabaseClient) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Conexão Supabase necessária</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Conecte o Supabase em “Ajustes” para carregar/salvar versões do orçamento.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Versões ({activeYear})</h3>
                    <p className="text-xs text-slate-500">Crie e gerencie versões (Initial / Forecast) para comparar Orçado x Realizado.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setImportOpen(true);
                            resetImportWizard();
                        }}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Importar Arquivo
                    </Button>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Versão
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Lista de versões</span>
                    {versionsLoading && <span className="text-xs text-slate-400">Carregando…</span>}
                </div>

                {versionsError && (
                    <div className="p-4 text-xs text-rose-600">{versionsError}</div>
                )}

                {!versionsLoading && !versionsError && versions.length === 0 && (
                    <div className="p-6">
                        <div className="text-xs text-slate-500">
                            Nenhuma versão cadastrada para {activeYear}. Clique em “Nova Versão”.
                        </div>
                    </div>
                )}

                {versions.length > 0 && (
                    <div className="divide-y divide-slate-100">
                        {versions.map(v => (
                            <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800">{v.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {v.type === 'initial' ? 'Initial' : `Forecast (a partir de ${String(v.start_month ?? 1).padStart(2, '0')}/${v.year})`}
                                    </div>
                                </div>
                                <div className="text-[11px] text-slate-400">{new Date(v.created_at).toLocaleString('pt-BR')}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <div className="text-xs font-bold text-slate-600">Controle Orçamentário (Competência)</div>
                        <div className="text-[11px] text-slate-400">Orçado • Previsto • Realizado • Diferença</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="flex h-9 sm:h-10 rounded-md border border-input bg-background px-3 text-xs sm:text-sm"
                            value={compareVersionId}
                            onChange={(e) => setCompareVersionId(e.target.value)}
                            disabled={versions.length === 0}
                            aria-label="Versão para comparação"
                        >
                            {versions.length === 0 ? (
                                <option value="">Nenhuma versão</option>
                            ) : (
                                versions.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))
                            )}
                        </select>
                        <Button variant="outline" onClick={loadBudgetLinesForCompare} disabled={!compareVersionId || compareLoading}>
                            {compareLoading ? 'Atualizando…' : 'Atualizar'}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowChart(true)} 
                            disabled={visibleCompareRows.length === 0}
                            className="gap-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Gráfico
                        </Button>
                    </div>
                </div>

                {compareError && (
                    <div className="p-4 text-xs text-rose-600 bg-rose-50 rounded-lg border border-rose-200">{compareError}</div>
                )}

                {!compareError && versions.length === 0 && (
                    <div className="p-6 text-center">
                        <div className="text-xs text-slate-500">Crie uma versão e importe um arquivo para ver o comparativo.</div>
                    </div>
                )}

                {!compareError && versions.length > 0 && (
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col" style={{ overflow: 'hidden', maxWidth: '100%', height: '600px' }}>
                        {/* =================== HEADER (FIXO) =================== */}
                        <div className="flex shrink-0">
                            <div
                                className="px-4 flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider h-12 border-b border-r shrink-0"
                                style={{
                                    width: `${CAT_COL_WIDTH}px`,
                                    minWidth: `${CAT_COL_WIDTH}px`,
                                    background: HEADER_BG,
                                    borderColor: BORDER_LIGHT,
                                    boxShadow: '2px 0 8px -2px rgba(0,0,0,0.1)',
                                    zIndex: 30,
                                    position: 'sticky',
                                    left: 0,
                                }}
                            >
                                Categoria
                            </div>
                            <div
                                ref={headerScrollRef}
                                onScroll={(e) => handleHorizontalScroll(e.currentTarget)}
                                className="flex-1"
                                style={{ overflow: 'auto', overflowY: 'hidden' }}
                            >
                                <div className="flex h-12 border-b" style={{ minWidth: 'max-content' }}>
                                    <div
                                        className="flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase tracking-wider border-r"
                                        style={{
                                            width: `${VALUE_COL_WIDTH}px`,
                                            minWidth: `${VALUE_COL_WIDTH}px`,
                                            background: 'rgba(238, 242, 255, 0.5)',
                                            borderColor: BORDER_LIGHT,
                                        }}
                                    >
                                        Orçado
                                    </div>
                                    <div
                                        className="flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase tracking-wider border-r"
                                        style={{
                                            width: `${VALUE_COL_WIDTH}px`,
                                            minWidth: `${VALUE_COL_WIDTH}px`,
                                            background: 'rgba(219, 234, 254, 0.3)',
                                            borderColor: BORDER_LIGHT,
                                        }}
                                    >
                                        Previsto
                                    </div>
                                    <div
                                        className="flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase tracking-wider border-r"
                                        style={{
                                            width: `${VALUE_COL_WIDTH}px`,
                                            minWidth: `${VALUE_COL_WIDTH}px`,
                                            background: HEADER_BG,
                                            borderColor: BORDER_LIGHT,
                                        }}
                                    >
                                        Realizado
                                    </div>
                                    <div
                                        className="flex items-center justify-center text-[10px] font-bold text-emerald-600 uppercase tracking-wider"
                                        style={{
                                            width: `${VALUE_COL_WIDTH}px`,
                                            minWidth: `${VALUE_COL_WIDTH}px`,
                                            background: 'rgba(236, 253, 245, 0.5)',
                                            borderColor: BORDER_LIGHT,
                                        }}
                                    >
                                        Diferença
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =================== BODY (ROLÁVEL) =================== */}
                        <div className="flex flex-1 overflow-hidden">
                            <div
                                className="flex flex-col overflow-hidden relative shrink-0"
                                style={{
                                    width: `${CAT_COL_WIDTH}px`,
                                    minWidth: `${CAT_COL_WIDTH}px`,
                                    borderRight: `1px solid ${BORDER_LIGHT}`,
                                    boxShadow: '2px 0 8px -2px rgba(0,0,0,0.1)',
                                    zIndex: 20,
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'white',
                                }}
                            >
                                <div className="flex-1 overflow-hidden relative">
                                    <div ref={categoryBodyRef}>
                                        {visibleCompareRows.length === 0 ? (
                                            <div className="px-4 py-10 text-center text-xs text-slate-500">
                                                Nenhum dado no período selecionado.
                                            </div>
                                        ) : (
                                            visibleCompareRows.map((r) => {
                                                const hasChildren = r.childCount > 0;
                                                const isGroup = hasChildren || r.level === 1;
                                                const m = String(r.title ?? '').match(/^([\d\.]+)\s*(.*)$/);
                                                const codePart = (m?.[1] ?? r.code).trim();
                                                const namePart = (m?.[2] ?? '').trim();

                                                return (
                                                    <div
                                                        key={`cat:${r.code}`}
                                                        className={`px-4 border-b border-slate-100 ${isGroup ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'}`}
                                                        style={{ height: '48px', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        {hasChildren ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setExpandedGroups(prev => ({ ...prev, [r.code]: !prev[r.code] }));
                                                                }}
                                                                className="w-full flex items-center gap-2 text-left"
                                                                aria-label={r.expanded ? 'Recolher grupo' : 'Expandir grupo'}
                                                            >
                                                                <span className="text-slate-500 shrink-0" style={{ marginLeft: (r.level - 1) * 14 }}>
                                                                    {r.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                                </span>

                                                                <div className="flex-1 overflow-hidden leading-tight">
                                                                    <div className="text-[10px] font-semibold text-slate-500 whitespace-nowrap truncate" title={codePart}>
                                                                        {codePart}
                                                                    </div>
                                                                    {namePart && (
                                                                        <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide truncate" title={namePart}>
                                                                            {namePart}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap shrink-0">({r.childCount})</span>
                                                            </button>
                                                        ) : (
                                                            <div className="w-full flex items-center gap-2" style={{ paddingLeft: (r.level - 1) * 14 + 16 }}>
                                                                <div className="flex-1 overflow-hidden leading-tight">
                                                                    <div className="text-[10px] font-semibold text-slate-400 whitespace-nowrap truncate" title={codePart}>
                                                                        {codePart}
                                                                    </div>
                                                                    {namePart && (
                                                                        <div className="text-[11px] font-medium text-slate-700 truncate" title={namePart}>
                                                                            {namePart}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div
                                ref={bodyScrollRef}
                                onScroll={(e) => {
                                    handleHorizontalScroll(e.currentTarget);
                                    handleBodyVerticalScroll(e);
                                }}
                                className="flex-1"
                                style={{ overflow: 'auto' }}
                            >
                                <div style={{ minWidth: 'max-content' }}>
                                    {visibleCompareRows.length === 0 ? (
                                        <div className="py-10"></div>
                                    ) : (
                                        visibleCompareRows.map((r) => {
                                            const isGroup = r.childCount > 0 || r.level === 1;
                                            const planned = r.planned;
                                            const actual = r.actual;
                                            const diff = r.diff;
                                            const budgeted = planned;

                                            return (
                                                <div
                                                    key={`data:${r.code}`}
                                                    className={`flex border-b border-slate-100 ${isGroup ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'}`}
                                                    style={{ height: '48px' }}
                                                >
                                                    <div
                                                        className="flex items-center justify-end px-4 py-3 border-r border-slate-100"
                                                        style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px` }}
                                                    >
                                                        <span className={isGroup ? 'text-[11px] font-bold text-indigo-700' : 'text-[11px] font-medium text-indigo-600'}>
                                                            {formatCurrency(budgeted)}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="flex items-center justify-end px-4 py-3 border-r border-slate-100"
                                                        style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px` }}
                                                    >
                                                        <span className={isGroup ? 'text-[11px] font-bold text-blue-700' : 'text-[11px] font-medium text-blue-600'}>
                                                            {formatCurrency(planned)}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="flex items-center justify-end px-4 py-3 border-r border-slate-100"
                                                        style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px` }}
                                                    >
                                                        <span className={isGroup ? 'text-[11px] font-bold text-slate-700' : 'text-[11px] font-medium text-slate-700'}>
                                                            {formatCurrency(actual)}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="flex items-center justify-end px-4 py-3"
                                                        style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px` }}
                                                    >
                                                        <span className={`${isGroup ? 'text-[11px] font-extrabold' : 'text-[11px] font-semibold'} ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {formatCurrency(diff)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* =================== FOOTER (FIXO) =================== */}
                        <div className="flex shrink-0">
                            <div
                                className="px-6 flex items-center justify-between text-white h-14 shrink-0 border-r"
                                style={{
                                    width: `${CAT_COL_WIDTH}px`,
                                    minWidth: `${CAT_COL_WIDTH}px`,
                                    background: FOOTER_BG,
                                    borderTop: `1px solid ${BORDER_DARK}`,
                                    borderRight: `1px solid ${BORDER_LIGHT}`,
                                    boxShadow: '2px 0 8px -2px rgba(0,0,0,0.1)',
                                    zIndex: 30,
                                    position: 'sticky',
                                    left: 0,
                                }}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">Total Geral</span>
                                <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div
                                ref={footerScrollRef}
                                onScroll={(e) => handleHorizontalScroll(e.currentTarget)}
                                className="flex-1"
                                style={{ overflow: 'auto', overflowY: 'hidden' }}
                            >
                                <div className="flex h-14" style={{ minWidth: 'max-content', borderTop: `1px solid ${BORDER_DARK}` }}>
                                    {(() => {
                                        const rootRows = visibleCompareRows.filter(r => r.level === 1);
                                        const totalBudgeted = rootRows.reduce((sum, r) => sum + (r.planned ?? 0), 0);
                                        const totalPlanned = rootRows.reduce((sum, r) => sum + (r.planned ?? 0), 0);
                                        const totalActual = rootRows.reduce((sum, r) => sum + (r.actual ?? 0), 0);
                                        const totalDiff = totalPlanned - totalActual;
                                        return (
                                            <>
                                                <div
                                                    className="flex items-center justify-end px-4 border-r"
                                                    style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px`, background: FOOTER_BG, borderColor: BORDER_DARK }}
                                                >
                                                    <span className="text-[11px] font-bold text-indigo-400">{formatCurrency(totalBudgeted)}</span>
                                                </div>
                                                <div
                                                    className="flex items-center justify-end px-4 border-r"
                                                    style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px`, background: FOOTER_BG, borderColor: BORDER_DARK }}
                                                >
                                                    <span className="text-[11px] font-bold text-blue-400">{formatCurrency(totalPlanned)}</span>
                                                </div>
                                                <div
                                                    className="flex items-center justify-end px-4 border-r"
                                                    style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px`, background: FOOTER_BG, borderColor: BORDER_DARK }}
                                                >
                                                    <span className="text-[11px] font-bold text-slate-300">{formatCurrency(totalActual)}</span>
                                                </div>
                                                <div
                                                    className="flex items-center justify-end px-4"
                                                    style={{ width: `${VALUE_COL_WIDTH}px`, minWidth: `${VALUE_COL_WIDTH}px`, background: FOOTER_BG }}
                                                >
                                                    <span className={`text-[11px] font-extrabold ${totalDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(totalDiff)}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent onClose={() => setCreateOpen(false)}>
                    <DialogHeader>
                        <DialogTitle>Criar versão do orçamento</DialogTitle>
                        <DialogDescription>
                            “Initial” vale para o ano todo. “Forecast” vale a partir do mês inicial e substitui os meses seguintes.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">Nome</label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: Orçamento 2026 (Initial)" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Ano</label>
                                <Input
                                    type="number"
                                    value={newYear}
                                    onChange={(e) => setNewYear(Number(e.target.value))}
                                    min={2000}
                                    max={2100}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Tipo</label>
                                <select
                                    className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 text-xs sm:text-sm"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as BudgetVersionType)}
                                >
                                    <option value="initial">Initial</option>
                                    <option value="forecast">Forecast</option>
                                </select>
                            </div>
                        </div>

                        {newType === 'forecast' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Mês inicial do forecast</label>
                                <select
                                    className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 text-xs sm:text-sm"
                                    value={newStartMonth}
                                    onChange={(e) => setNewStartMonth(Number(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>Cancelar</Button>
                            <Button onClick={handleCreateVersion} disabled={creating}>
                                {creating ? 'Criando…' : 'Criar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={importOpen} onOpenChange={(open) => {
                setImportOpen(open);
                if (!open) resetImportWizard();
            }}>
                <DialogContent onClose={() => setImportOpen(false)} className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Importar orçamento</DialogTitle>
                        <DialogDescription>
                            Faça o upload e mapeie as colunas. A importação salva na versão escolhida para o ano {activeYear}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Versão destino</label>
                                <select
                                    className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 text-xs sm:text-sm"
                                    value={targetVersionId}
                                    onChange={(e) => setTargetVersionId(e.target.value)}
                                >
                                    <option value="" disabled>Selecione…</option>
                                    {versions.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} — {v.type === 'initial' ? 'Initial' : `Forecast (${String(v.start_month ?? 1).padStart(2, '0')}/${v.year})`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Arquivo (.xlsx / .xlsm / .csv)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xlsm,.csv"
                                        className="block w-full text-xs text-slate-600"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handlePickImportFile(f);
                                        }}
                                    />
                                </div>
                                {importFile && (
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="truncate" title={importFile.name}>{importFile.name}</span>
                                    </div>
                                )}
                                {importReading && <div className="text-[11px] text-slate-400">Lendo arquivo…</div>}
                            </div>
                        </div>

                        {importRows.length > 0 && (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 text-xs text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={hasHeader}
                                                onChange={(e) => {
                                                    const next = e.target.checked;
                                                    setHasHeader(next);
                                                    setDataStartRow(next ? 2 : 1);
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            1ª linha é cabeçalho
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-600">Dados começam na linha</span>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={dataStartRow}
                                                onChange={(e) => setDataStartRow(Number(e.target.value))}
                                                className="w-24"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-600">Layout</span>
                                        <select
                                            className="flex h-9 sm:h-10 rounded-md border border-input bg-background px-3 text-xs sm:text-sm"
                                            value={layout}
                                            onChange={(e) => setLayout(e.target.value as ImportLayout)}
                                        >
                                            <option value="rows">Linhas (CC/CoA/Mês/Valor)</option>
                                            <option value="month_columns">Meses em colunas (jan…dez)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={layout === 'rows' ? 'mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3' : 'mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600">Coluna Empresa</label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                            value={companyCol}
                                            onChange={(e) => setCompanyCol(Number(e.target.value))}
                                        >
                                            <option value={-1}>Selecione…</option>
                                            {headerOptions.map(o => <option key={o.idx} value={o.idx}>{o.label}</option>)}
                                        </select>
                                        <div className="text-[10px] text-slate-400">Obrigatório apenas para versões “Todas”.</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600">Coluna CC</label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                            value={ccCol}
                                            onChange={(e) => setCcCol(Number(e.target.value))}
                                        >
                                            <option value={-1}>Selecione…</option>
                                            {headerOptions.map(o => <option key={o.idx} value={o.idx}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600">Coluna CoA (código)</label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                            value={coaCol}
                                            onChange={(e) => setCoaCol(Number(e.target.value))}
                                        >
                                            <option value={-1}>Selecione…</option>
                                            {headerOptions.map(o => <option key={o.idx} value={o.idx}>{o.label}</option>)}
                                        </select>
                                    </div>

                                    {layout === 'rows' && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-600">Coluna Mês</label>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                                    value={monthCol}
                                                    onChange={(e) => setMonthCol(Number(e.target.value))}
                                                >
                                                    <option value={-1}>Selecione…</option>
                                                    {headerOptions.map(o => <option key={o.idx} value={o.idx}>{o.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-600">Coluna Valor</label>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                                    value={amountCol}
                                                    onChange={(e) => setAmountCol(Number(e.target.value))}
                                                >
                                                    <option value={-1}>Selecione…</option>
                                                    {headerOptions.map(o => <option key={o.idx} value={o.idx}>{o.label}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {layout === 'month_columns' && (
                                    <div className="mt-3 text-[11px] text-slate-600">
                                        <span className="font-bold">Meses detectados:</span>{' '}
                                        {monthCols.length === 0
                                            ? <span className="text-slate-400">nenhum (verifique o cabeçalho)</span>
                                            : monthCols
                                                .map(idx => String((importRows[0] ?? [])[idx] ?? '').trim())
                                                .filter(Boolean)
                                                .join(', ')}
                                    </div>
                                )}

                                <div className="mt-3">
                                    <div className="text-[11px] font-bold text-slate-600 mb-2">Preview</div>
                                    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                                        <table className="min-w-full text-xs">
                                            <tbody>
                                                {importRows.slice(0, 8).map((row, idx) => (
                                                    <tr key={idx} className={idx === 0 && hasHeader ? 'bg-slate-50 border-b border-slate-100' : 'border-b border-slate-100'}>
                                                        {row.slice(0, 10).map((cell, cIdx) => (
                                                            <td key={cIdx} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[240px] truncate" title={cell}>
                                                                {(() => {
                                                                    const isHeaderRow = idx === 0 && hasHeader;
                                                                    if (!isHeaderRow && previewMonthColsSet.has(cIdx)) {
                                                                        const n = parseMoneyToNumber(cell);
                                                                        if (n !== null) return formatCurrency(Math.abs(roundMoney2(n)));
                                                                    }
                                                                    return cell;
                                                                })()}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-1">Mostrando até 8 linhas e 10 colunas.</div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2">
                            <div className="text-[11px] text-slate-500">
                                {importResult
                                    ? (
                                        <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Importado: {importResult.inserted} | Ignorados: {importResult.skipped}
                                        </span>
                                    )
                                    : 'Dica: mês pode ser 1-12, Jan/Fev… ou 01/2026.'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={() => setImportOpen(false)} disabled={importing}>Fechar</Button>
                                <Button onClick={handleImport} disabled={importing || importRows.length === 0}>
                                    {importing ? 'Importando…' : 'Importar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Gráfico Comparativo */}
            <Dialog open={showChart} onOpenChange={setShowChart}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Gráfico Comparativo: Previsto vs Realizado</DialogTitle>
                        <DialogDescription>
                            Comparação visual entre valores previstos e realizados por categoria principal
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <ResponsiveContainer width="100%" height={500}>
                            <BarChart
                                data={visibleCompareRows
                                    .filter(r => r.level === 1)
                                    .map(r => ({
                                        categoria: r.title.length > 25 ? r.title.substring(0, 25) + '...' : r.title,
                                        Previsto: r.planned,
                                        Realizado: r.actual,
                                        Diferença: r.diff,
                                    }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="categoria" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={100}
                                    tick={{ fontSize: 11, fill: '#475569' }}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11, fill: '#475569' }}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                        return value.toFixed(0);
                                    }}
                                />
                                <Tooltip 
                                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                />
                                <Legend 
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                                />
                                <Bar dataKey="Previsto" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Realizado" fill="#64748b" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Diferença" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BudgetTab;
