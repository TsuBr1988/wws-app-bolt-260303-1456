
import React, { useState, useEffect, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { format, getMonth, getYear, isBefore, addMonths, endOfMonth, isSameDay, compareAsc, eachMonthOfInterval, differenceInCalendarMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useAuth } from '../../hooks/useAuth';
import { getDatabase } from '../../lib/databaseResolver';

// Types and Utils
import { BalancesByCompany, Company, ViewState, CoaViewMode, CashSubView, Transaction, MonthlyValues, CoaNode, ClientMetadata, ClientCategoryFilter, ClientStatusFilter, ClientTypeFilter, ContractSheet, ContractSheetItem } from './types';
import { createEmptyBalances, startOfDay, startOfMonth, subMonths, addDays, getEffectiveDate, PRELOADED_CLIENTS, sumBalances } from './utils';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Feature Tabs
import FilesTab from './components/Features/files/FilesTab';
import DashboardTab from './components/Features/dashboard/DashboardTab';
import StatementTab from './components/Features/statement/StatementTab';
import DelinquentTab from './components/Features/delinquent/DelinquentTab';
import LoansTab from './components/Features/loans/LoansTab';
import SimulationsTab from './components/Features/simulations/SimulationsTab';
import ContractAnalysisTab from './components/Features/contract_analysis/ContractAnalysisTab';
import CoaTab from './components/Features/CoaTab';
import BudgetTab from './components/Features/budget/BudgetTab';
import KpisTab from './components/Features/kpis/KpisTab';
import SettingsTab from './components/Features/settings/SettingsTab';
import ContractSheetsTab from './components/Features/contract_sheets/ContractSheetsTab';

const App = () => {
    // --- Auth ---
    const { hasIndicatorAccess } = useAuth();

    // Map tab IDs to indicator names
    const tabToIndicator: Record<string, string> = {
        'dashboard': 'Visão Geral',
        'statement': 'Extrato',
        'delinquent': 'Inadimplentes',
        'loans': 'Empréstimos',
        'simulations': 'Simulações',
        'coa': 'Plano de Contas',
        'budget': 'Controle Orçamentário',
        'kpis': 'KPIs',
        'contract_sheets': 'Fichas de Contratos',
        'files': 'Importação',
        'settings': 'Ajustes'
    };

    const canViewTab = (tab: ViewState): boolean => {
        const indicatorName = tabToIndicator[tab];
        if (!indicatorName) return true;
        return hasIndicatorAccess('financas', indicatorName);
    };

    // --- Global State ---
    const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
    const [data, setData] = useState<Transaction[]>([]);
    const [clientMetadata, setClientMetadata] = useState<Record<string, ClientMetadata>>(PRELOADED_CLIENTS);
    const [initialBalances, setInitialBalances] = useState<BalancesByCompany>(createEmptyBalances());
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // --- Filters State (Managed here to coordinate TopBar and Tabs) ---
    const [selectedCompany, setSelectedCompany] = useState<Company | 'all'>('all');
    const [selectedCostCenters, setSelectedCostCenters] = useState<string[]>([]);
    const [selectedClientCategory, setSelectedClientCategory] = useState<ClientCategoryFilter>('all');
    const [selectedClientStatus, setSelectedClientStatus] = useState<ClientStatusFilter>('all');
    const [selectedClientType, setSelectedClientType] = useState<ClientTypeFilter>('all');
    const [selectedCities, setSelectedCities] = useState<string[]>([]);

    // Tab-Specific View States (Hoisted for TopBar access)
    const [coaViewMode, setCoaViewMode] = useState<CoaViewMode>('cash');
    const [cashSubView, setCashSubView] = useState<CashSubView>('all');
    const [statementViewMode, setStatementViewMode] = useState<CoaViewMode>('cash');
    const [statementCashSubView, setStatementCashSubView] = useState<CashSubView>('all');
    const [simViewMode, setSimViewMode] = useState<CoaViewMode>('cash');
    const [simCashSubView, setSimCashSubView] = useState<CashSubView>('all');
    const [caViewMode, setCaViewMode] = useState<CoaViewMode>('cash');
    const [caCashSubView, setCaCashSubView] = useState<CashSubView>('all');
    const [kpiViewMode, setKpiViewMode] = useState<CoaViewMode>('cash');
    const [kpiCashSubView, setKpiCashSubView] = useState<CashSubView>('all');
    const [csViewMode, setCsViewMode] = useState<CoaViewMode>('cash');
    const [csCashSubView, setCsCashSubView] = useState<CashSubView>('all');

    // Date Ranges
    const [coaStartDate, setCoaStartDate] = useState(subMonths(startOfMonth(new Date()), 2));
    const [coaEndDate, setCoaEndDate] = useState(startOfMonth(new Date()));
    const [statementStartDate, setStatementStartDate] = useState(addDays(startOfDay(new Date()), -1));
    const [statementEndDate, setStatementEndDate] = useState(addDays(startOfDay(new Date()), 1));
    const [simStartDate, setSimStartDate] = useState(addDays(startOfDay(new Date()), -1));
    const [simEndDate, setSimEndDate] = useState(endOfMonth(new Date()));
    const [caStartDate, setCaStartDate] = useState(subMonths(startOfMonth(new Date()), 2));
    const [caEndDate, setCaEndDate] = useState(addMonths(startOfMonth(new Date()), 3));
    const [kpiStartDate, setKpiStartDate] = useState(startOfMonth(new Date()));
    const [kpiEndDate, setKpiEndDate] = useState(endOfMonth(new Date()));
    const [budgetStartDate, setBudgetStartDate] = useState(startOfMonth(new Date()));
    const [budgetEndDate, setBudgetEndDate] = useState(endOfMonth(new Date()));
    const [csStartDate, setCsStartDate] = useState(startOfMonth(new Date()));
    const [csEndDate, setCsEndDate] = useState(endOfMonth(new Date()));

    // Settings / Metadata
    const [categoryRenames, setCategoryRenames] = useState<Record<string, string>>({});
    const [excludedCoaCodes, setExcludedCoaCodes] = useState<Set<string>>(new Set());
    const [excludedSheetCodes, setExcludedSheetCodes] = useState<Set<string>>(new Set());
    const [ignoredTransactionIds, setIgnoredTransactionIds] = useState<Set<string>>(new Set());
    const [simulationDates, setSimulationDates] = useState<Map<string, Date>>(new Map());
    const [simulatedTransactions, setSimulatedTransactions] = useState<Transaction[]>([]);

    // Contract Sheets State
    const [contractSheets, setContractSheets] = useState<ContractSheet[]>([]);
    const [sheetsLoading, setSheetsLoading] = useState(false);

    // Supabase
    const [supabaseUrl, setSupabaseUrl] = useState(() => import.meta.env.VITE_SUPABASE_FINANCAS_URL || '');
    const [supabaseKey, setSupabaseKey] = useState(() => import.meta.env.VITE_SUPABASE_FINANCAS_ANON || '');
    const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [dbLoading, setDbLoading] = useState(false);
    const financasDb = useMemo(() => getDatabase('FINANCAS') as SupabaseClient, []);

    // --- Effects & Data Loading ---

    useEffect(() => {
        if (supabaseUrl && supabaseKey) {
            try {
                const client = financasDb;
                setSupabaseClient(client);
                setIsConnected(true);
                fetchFromSupabase(client);
            } catch (e) {
                console.error("Failed to init supabase", e);
                setIsConnected(false);
            }
        }
    }, [financasDb, supabaseKey, supabaseUrl]);

    const saveSupabaseConfig = () => {
        try {
            const fixedUrl = import.meta.env.VITE_SUPABASE_FINANCAS_URL || '';
            const fixedKey = import.meta.env.VITE_SUPABASE_FINANCAS_ANON || '';
            setSupabaseUrl(fixedUrl);
            setSupabaseKey(fixedKey);

            const client = financasDb;
            setSupabaseClient(client);
            setIsConnected(true);
            fetchFromSupabase(client);
            alert("Conexão validada no banco de Finanças.");
        } catch (e) {
            alert("Erro ao conectar. Verifique as credenciais.");
        }
    };

    const fetchFromSupabase = async (client: SupabaseClient) => {
        setDbLoading(true);
        try {
            // Fetch Transactions
            const { data: txData, error: txError } = await client.from('transactions').select('*');
            if (txError) throw txError;

            if (txData) {
                const formattedTx: Transaction[] = txData.map((t: any) => ({
                    ...t,
                    dueDate: new Date(t.due_date),
                    paymentDate: t.payment_date ? new Date(t.payment_date) : undefined,
                    competencyDate: t.competency_date ? new Date(t.competency_date) : undefined,
                    amount: Number(t.amount),
                    costCenter: t.cost_center,
                    originalFile: t.original_file,
                    nome: t.nome
                }));
                setData(formattedTx);
            }

            // Fetch Metadata
            const { data: metaData, error: metaError } = await client.from('client_metadata').select('*');
            if (!metaError && metaData) {
                const metaMap: Record<string, ClientMetadata> = {};
                metaData.forEach((m: any) => {
                    metaMap[m.cost_center] = {
                        category: m.category,
                        type: m.type,
                        city: m.city,
                        company: m.company,
                        status: m.status
                    };
                });
                setClientMetadata(prev => ({ ...prev, ...metaMap }));
            }

            // Fetch Settings
            const { data: settingsData, error: settingsError } = await client.from('app_settings').select('*');
            if (!settingsError && settingsData) {
                settingsData.forEach((s: any) => {
                    if (s.key === 'ignored_transactions') setIgnoredTransactionIds(new Set(s.value));
                    if (s.key === 'excluded_coa_codes') setExcludedCoaCodes(new Set(s.value));
                    if (s.key === 'category_renames') setCategoryRenames(s.value);
                });
            }

            // Fetch Daily Balances
            const { data: dailyBalancesData, error: dailyBalancesError } = await client.from('daily_balances').select('*');
            if (!dailyBalancesError && dailyBalancesData) {
                const nextBalances: BalancesByCompany = createEmptyBalances();
                dailyBalancesData.forEach((row: any) => {
                    if (row.company && row.company in nextBalances) {
                        (nextBalances as any)[row.company] = Number(row.balance) || 0;
                    }
                });
                setInitialBalances(nextBalances);
            }

            // Fetch Contract Sheets
            const { data: sheetsData, error: sheetsError } = await client.from('contract_sheets').select('*');
            if (!sheetsError && sheetsData) {
                const sheets: ContractSheet[] = await Promise.all(sheetsData.map(async (sheet: any) => {
                    const { data: itemsData } = await client.from('contract_sheet_items').select('*').eq('sheet_id', sheet.id);
                    return {
                        id: sheet.id,
                        client_name: sheet.client_name,
                        start_date: sheet.start_date,
                        end_date: sheet.end_date,
                        created_at: sheet.created_at,
                        updated_at: sheet.updated_at,
                        items: itemsData?.map((item: any) => ({
                            id: item.id,
                            sheet_id: item.sheet_id,
                            category_code: item.category_code,
                            category_name: item.category_name,
                            budgeted_amount: Number(item.budgeted_amount)
                        })) || []
                    };
                }));
                setContractSheets(sheets);
            }

            setLastUpdated(new Date());

        } catch (e) {
            console.error("=== ERROR in fetchFromSupabase ===", e);
        } finally {
            setDbLoading(false);
        }
    };

    // --- Handlers ---

    const handleFinishProcessing = (transactions: Transaction[], balances: BalancesByCompany) => {
        setData(transactions);
        setInitialBalances(balances);
        setLastUpdated(new Date());
        setActiveTab('dashboard');
    };

    const updateClientMetadata = async (cc: string, field: keyof ClientMetadata, value: string) => {
        // 1. Calculate new state based on current available state
        const currentMeta = clientMetadata[cc] || { category: 'administrative', type: 'private', city: '', company: 'WWS Services', status: 'active' };

        const updatedMeta: ClientMetadata = {
            ...currentMeta,
            [field]: value
        };

        // 2. Optimistic UI Update
        setClientMetadata(prev => ({
            ...prev,
            [cc]: updatedMeta
        }));

        // 3. Persist to Supabase
        if (isConnected && supabaseClient) {
            const payload = {
                cost_center: cc,
                category: updatedMeta.category,
                type: updatedMeta.type,
                city: updatedMeta.city,
                company: updatedMeta.company,
                status: updatedMeta.status || 'active'
            };

            let { error } = await supabaseClient.from('client_metadata').upsert(payload);

            // Fallback: If 'status' column is missing, try without it
            if (error && (error.message.includes('status') || error.message.includes('column'))) {
                console.warn("Column 'status' missing in DB (Schema mismatch). Retrying update without status field.");
                const { status, ...fallbackPayload } = payload;
                const retry = await supabaseClient.from('client_metadata').upsert(fallbackPayload);
                error = retry.error;
            }

            if (error) {
                console.error("Error updating client metadata in Supabase:", error.message || error);
            }
        }
    };

    const addManualClient = async () => {
        const newId = `Novo Cliente ${Date.now()}`;
        const defaultMeta: ClientMetadata = {
            category: 'client',
            type: 'private',
            city: '',
            company: 'WWS Services',
            status: 'active'
        };

        // 1. Optimistic UI Update
        setClientMetadata(prev => ({
            [newId]: defaultMeta,
            ...prev
        }));

        // 2. Persist to Supabase
        if (isConnected && supabaseClient) {
            const payload = {
                cost_center: newId,
                ...defaultMeta
            };

            let { error } = await supabaseClient.from('client_metadata').insert(payload);

            // Fallback for missing column 'status'
            if (error && (error.message.includes('status') || error.message.includes('column'))) {
                console.warn("Column 'status' missing in DB. Retrying insert without status field.");
                const { status, ...fallbackPayload } = payload;
                const retry = await supabaseClient.from('client_metadata').insert(fallbackPayload);
                error = retry.error;
            }

            if (error) {
                console.error("Error creating manual client in Supabase:", error.message || error);
            }
        }
    };

    const toggleIgnoreTransaction = async (id: string) => {
        setIgnoredTransactionIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);

            if (isConnected && supabaseClient) {
                supabaseClient.from('app_settings').upsert({
                    key: 'ignored_transactions',
                    value: Array.from(next)
                }).then(({ error }) => { if (error) console.error(error); });
            }
            return next;
        });
    };

    const toggleBulkIgnoreTransaction = async (ids: string[], shouldIgnore: boolean) => {
        setIgnoredTransactionIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => {
                if (shouldIgnore) next.add(id);
                else next.delete(id);
            });

            if (isConnected && supabaseClient) {
                supabaseClient.from('app_settings').upsert({
                    key: 'ignored_transactions',
                    value: Array.from(next)
                }).then(({ error }) => { if (error) console.error(error); });
            }
            return next;
        });
    };

    const setSimulationDate = (id: string, date: Date | null) => {
        setSimulationDates(prev => {
            const next = new Map(prev);
            if (date) {
                next.set(id, date);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    const addSimulatedTransaction = (date: Date, description: string, amount: number) => {
        const newTransaction: Transaction = {
            id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            company: selectedCompany === 'all' ? 'Worldwide Segurança' : selectedCompany,
            type: amount >= 0 ? 'receive' : 'pay',
            status: 'pending',
            dueDate: date,
            amount: amount,
            description: description,
            category: '9.99 Simulação',
            costCenter: 'Simulação',
            originalFile: 'simulacao'
        };
        setSimulatedTransactions(prev => [...prev, newTransaction]);
    };

    const removeSimulatedTransaction = (id: string) => {
        setSimulatedTransactions(prev => prev.filter(t => t.id !== id));
    };

    const toggleCoaExclusion = async (code: string) => {
        setExcludedCoaCodes(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code); else next.add(code);
            if (isConnected && supabaseClient) {
                supabaseClient.from('app_settings').upsert({
                    key: 'excluded_coa_codes',
                    value: Array.from(next)
                }).then(({ error }) => { if (error) console.error(error); });
            }
            return next;
        });
    };

    const toggleSheetExclusion = async (code: string) => {
        setExcludedSheetCodes(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code); else next.add(code);
            if (isConnected && supabaseClient) {
                supabaseClient.from('app_settings').upsert({
                    key: 'excluded_sheet_codes',
                    value: Array.from(next)
                }).then(({ error }) => { if (error) console.error(error); });
            }
            return next;
        });
    };

    const handleRenameCategory = async (code: string, newName: string) => {
        setCategoryRenames(prev => {
            const next = { ...prev, [code]: newName };
            if (isConnected && supabaseClient) {
                supabaseClient.from('app_settings').upsert({ key: 'category_renames', value: next }).then(({ error }) => { if (error) console.error(error); });
            }
            return next;
        });
    };

    // --- Contract Sheets Handlers ---

    const handleCreateContractSheet = async (data: {
        client_name: string;
        start_date: string;
        end_date: string;
        items: Array<{ category_code: string; category_name: string; budgeted_amount: number }>;
    }) => {
        if (!isConnected || !supabaseClient) {
            alert('ERRO: Não conectado ao banco de dados!\n\nPor favor, verifique a conexão nas configurações.');
            console.error('Supabase não conectado:', { isConnected, hasClient: !!supabaseClient });
            return;
        }

        console.log('Iniciando criação de ficha:', data);

        // Helper to find category name from chartOfAccountsTree
        const findCategoryName = (code: string): string => {
            const searchTree = (nodes: CoaNode[]): string | null => {
                for (const node of nodes) {
                    if (node.code === code) return node.name;
                    const found = searchTree(node.children);
                    if (found) return found;
                }
                return null;
            };
            return searchTree(chartOfAccountsTree) || `${code} (Categoria)`;
        };

        setSheetsLoading(true);
        try {
            console.log('Inserindo ficha no banco...');
            const { data: sheetData, error: sheetError } = await supabaseClient
                .from('contract_sheets')
                .insert({
                    client_name: data.client_name,
                    start_date: data.start_date,
                    end_date: data.end_date
                })
                .select()
                .single();

            if (sheetError) {
                console.error('Erro ao inserir ficha:', sheetError);
                throw sheetError;
            }

            console.log('Ficha criada com sucesso:', sheetData);

            if (data.items.length > 0) {
                console.log(`Inserindo ${data.items.length} itens da ficha...`);
                const items = data.items.map(item => ({
                    sheet_id: sheetData.id,
                    category_code: item.category_code,
                    category_name: findCategoryName(item.category_code),
                    budgeted_amount: item.budgeted_amount,
                    client_name: data.client_name
                }));

                const { error: itemsError } = await supabaseClient
                    .from('contract_sheet_items')
                    .insert(items);

                if (itemsError) {
                    console.error('Erro ao inserir itens:', itemsError);
                    throw itemsError;
                }

                console.log('Itens inseridos com sucesso');
            }

            console.log('Recarregando dados do banco...');
            if (supabaseClient) {
                await fetchFromSupabase(supabaseClient);
            }

            alert(`Ficha "${data.client_name}" criada com sucesso!`);
            console.log('Criação de ficha concluída');
        } catch (error: any) {
            console.error('Erro ao criar ficha:', error);
            alert('Erro ao criar ficha: ' + (error.message || JSON.stringify(error)));

            // Log detalhado para debug
            console.error('Detalhes do erro:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        } finally {
            setSheetsLoading(false);
        }
    };

    const handleDeleteContractSheet = async (id: string) => {
        if (!isConnected || !supabaseClient) {
            alert('Não conectado ao banco de dados');
            return;
        }

        setSheetsLoading(true);
        try {
            const { error } = await supabaseClient
                .from('contract_sheets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setContractSheets(prev => prev.filter(sheet => sheet.id !== id));
        } catch (error: any) {
            console.error('Erro ao deletar ficha:', error);
            alert('Erro ao deletar ficha: ' + error.message);
        } finally {
            setSheetsLoading(false);
        }
    };

    // --- Derived State needed for TopBar or Multiple Tabs ---

    const availableCostCenters = useMemo(() => {
        const s = new Set<string>();
        data.forEach(t => s.add(t.costCenter));
        return Array.from(s).sort();
    }, [data]);

    const allConfiguredCostCenters = useMemo(() => {
        const fromFiles = new Set(availableCostCenters);
        const fromConfig = Object.keys(clientMetadata);
        return Array.from(new Set([...fromFiles, ...fromConfig])).sort();
    }, [availableCostCenters, clientMetadata]);

    const availableCities = useMemo(() => {
        const cities = new Set<string>();
        Object.values(clientMetadata).forEach(meta => {
            if (meta.city && meta.city.trim() !== '') {
                cities.add(meta.city);
            }
        });
        return Array.from(cities).sort();
    }, [clientMetadata]);

    const dashboardFilteredData = useMemo(() => {
        return data.filter(t => {
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const monthMatch = getMonth(t.dueDate) === new Date().getMonth(); // Default to current month for dashboard stats if not controlled
            const yearMatch = getYear(t.dueDate) === new Date().getFullYear();
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            return companyMatch && monthMatch && yearMatch && ccMatch;
        });
    }, [data, selectedCompany, selectedCostCenters]);

    const stats = useMemo(() => {
        const s = { realizedIn: 0, realizedOut: 0, projectedIn: 0, projectedOut: 0 };
        dashboardFilteredData.forEach(t => {
            if (t.status === 'completed') {
                if (t.type === 'receive') s.realizedIn += t.amount; else s.realizedOut += t.amount;
            } else {
                if (t.type === 'receive') s.projectedIn += t.amount; else s.projectedOut += t.amount;
            }
        });
        return s;
    }, [dashboardFilteredData]);

    const kpiSaldoStats = useMemo(() => {
        const today = startOfDay(new Date());
        const allRelevant = [...data].filter(t => {
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!companyMatch || !ccMatch) return false;
            if (selectedClientCategory !== 'all') {
                const meta = clientMetadata[t.costCenter];
                const cat = meta ? meta.category : 'administrative';
                if (cat !== selectedClientCategory) return false;
            }
            return true;
        }).sort((a, b) => compareAsc(getEffectiveDate(a), getEffectiveDate(b)));

        let baseBalance = (selectedCompany === 'all')
            ? sumBalances(initialBalances)
            : (initialBalances[selectedCompany as Company] ?? 0);

        const realizedBeforeToday = allRelevant.reduce((acc, t) => {
            const effectiveDate = getEffectiveDate(t);
            if (t.status === 'completed' && isBefore(effectiveDate, today)) {
                return acc + t.amount;
            }
            return acc;
        }, 0);

        let currentBalance = baseBalance - realizedBeforeToday;
        const endOfCurrentMonth = endOfMonth(today);
        const endOfNextMonth = endOfMonth(addMonths(today, 1));

        let saldoFimMes = currentBalance;
        let saldoFimProxMes = currentBalance;

        for (const t of allRelevant) {
            const date = getEffectiveDate(t);
            const isPast = isBefore(date, today);
            let amountToAdd = 0;
            if (t.status === 'completed') amountToAdd = t.amount;
            else if (t.status === 'pending' && !isPast) amountToAdd = t.amount;

            if (amountToAdd !== 0) {
                if (isBefore(date, addDays(endOfNextMonth, 1))) {
                    if (isBefore(date, addDays(endOfCurrentMonth, 1))) {
                        saldoFimMes += amountToAdd;
                    }
                    saldoFimProxMes += amountToAdd;
                }
            }
        }

        let strictTodayBalance = (selectedCompany === 'all')
            ? sumBalances(initialBalances)
            : (initialBalances[selectedCompany as Company] ?? 0);
        const todayMoves = allRelevant.filter(t => isSameDay(getEffectiveDate(t), today) && t.status === 'completed');
        strictTodayBalance += todayMoves.reduce((acc, t) => acc + t.amount, 0);

        return { current: strictTodayBalance, endMonth: saldoFimMes, endNextMonth: saldoFimProxMes };
    }, [data, selectedCompany, selectedCostCenters, initialBalances, clientMetadata, selectedClientCategory]);

    const monthlyChartData = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => i);
        const selectedYear = new Date().getFullYear();
        const allRelevant = [...data].filter(t => {
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!companyMatch || !ccMatch) return false;
            if (selectedClientCategory !== 'all') {
                const meta = clientMetadata[t.costCenter];
                const cat = meta ? meta.category : 'administrative';
                if (cat !== selectedClientCategory) return false;
            }
            return true;
        }).sort((a, b) => compareAsc(getEffectiveDate(a), getEffectiveDate(b)));

        const today = startOfDay(new Date());
        let runningBalance = (selectedCompany === 'all') ? sumBalances(initialBalances) : (initialBalances[selectedCompany as Company] ?? 0);
        const realizedBeforeToday = allRelevant.reduce((acc, t) => {
            const effectiveDate = getEffectiveDate(t);
            if (t.status === 'completed' && isBefore(effectiveDate, today)) return acc + t.amount;
            return acc;
        }, 0);
        runningBalance = runningBalance - realizedBeforeToday;

        const balancesByMonth: Record<number, { realized: number | null, projected: number }> = {};
        months.forEach(m => balancesByMonth[m] = { realized: null, projected: 0 });

        let currentSimBalance = runningBalance;
        let currentRealBalance = runningBalance;
        let txIndex = 0;

        for (const m of months) {
            const endOfThisMonth = endOfMonth(new Date(selectedYear, m, 1));
            while (txIndex < allRelevant.length) {
                const t = allRelevant[txIndex];
                const date = getEffectiveDate(t);
                if (date > endOfThisMonth) break;
                const isPast = isBefore(date, today);
                let affectsSim = false;
                if (t.status === 'completed') affectsSim = true;
                else if (t.status === 'pending' && !isPast) affectsSim = true;
                if (affectsSim) currentSimBalance += t.amount;
                if (t.status === 'completed') currentRealBalance += t.amount;
                txIndex++;
            }
            balancesByMonth[m].projected = currentSimBalance;
            if (isBefore(startOfMonth(new Date(selectedYear, m, 1)), startOfMonth(addMonths(today, 1)))) {
                balancesByMonth[m].realized = currentRealBalance;
            }
        }

        return months.map(m => {
            const monthData = allRelevant.filter(t => getMonth(t.dueDate) === m && getYear(t.dueDate) === selectedYear);
            const received = monthData.filter(t => t.type === 'receive' && t.status === 'completed').reduce((acc, c) => acc + c.amount, 0);
            const paid = monthData.filter(t => t.type === 'pay' && t.status === 'completed').reduce((acc, c) => acc + Math.abs(c.amount), 0);
            const receivedPending = monthData.filter(t => t.type === 'receive' && t.status === 'pending').reduce((acc, c) => acc + c.amount, 0);
            const paidPending = monthData.filter(t => t.type === 'pay' && t.status === 'pending').reduce((acc, c) => acc + Math.abs(c.amount), 0);
            return {
                name: format(new Date(selectedYear, m, 1), 'MMM', { locale: ptBR }).toUpperCase(),
                Recebido: received,
                RecebidoPrevisto: receivedPending,
                Pago: paid,
                PagoPrevisto: paidPending,
                SaldoReal: balancesByMonth[m].realized,
                SaldoProj: balancesByMonth[m].projected
            };
        });
    }, [data, selectedCompany, selectedCostCenters, initialBalances, clientMetadata, selectedClientCategory]);

    const categoryData = useMemo(() => {
        const cats: Record<string, number> = {};
        dashboardFilteredData.filter(t => t.type === 'pay').forEach(t => { cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount); });
        return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [dashboardFilteredData]);

    // COA & KPI Data
    const kpiData = useMemo(() => {
        const filtered = data.filter(t => {
            const meta = clientMetadata[t.costCenter];
            const category = meta ? meta.category : 'administrative';
            const status = meta ? meta.status : 'active';
            const type = meta ? meta.type : 'private';

            // Basic Filters
            if (category === 'administrative') return false;
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            if (!companyMatch || !ccMatch) return false;

            // Status Filter Logic
            if (selectedClientStatus === 'active' && status === 'inactive') return false;
            if (selectedClientStatus === 'inactive' && status !== 'inactive') return false;

            // Type Filter Logic (Public/Private)
            if (selectedClientType === 'public' && type !== 'public') return false;
            if (selectedClientType === 'private' && type !== 'private') return false;

            // City Filter Logic
            if (selectedCities.length > 0) {
                const city = meta ? meta.city : '';
                if (!selectedCities.includes(city)) return false;
            }

            // Date & View Mode Filter
            if (kpiViewMode === 'cash') {
                const inRange = (d?: Date) => d && d >= kpiStartDate && d <= kpiEndDate;
                const isRealizedInRange = t.status === 'completed' && inRange(t.paymentDate);
                const isProjectedInRange = t.status === 'pending' && inRange(t.dueDate);
                const matchesSubView = (kpiCashSubView === 'all') || (kpiCashSubView === 'realized' && isRealizedInRange) || (kpiCashSubView === 'projected' && isProjectedInRange);
                return matchesSubView && (isRealizedInRange || isProjectedInRange);
            } else {
                const d = t.competencyDate || t.dueDate;
                const inRange = d >= kpiStartDate && d <= kpiEndDate;
                const matchesSubView = (kpiCashSubView === 'all') || (kpiCashSubView === 'realized' && t.status === 'completed') || (kpiCashSubView === 'projected' && t.status === 'pending');
                return inRange && matchesSubView;
            }
        });

        let totalRev = 0; let revWWS = 0; let revWorldwide = 0; let rev2WS = 0;
        const marginByCC: Record<string, { rev: number, exp: number, margin: number, count: number, revMonths: Set<string>, expMonths: Set<string> }> = {};
        const totalRevClients: { name: string, value: number }[] = [];
        const wwsClients: { name: string, value: number }[] = [];
        const worldwideClients: { name: string, value: number }[] = [];
        const twoWsClients: { name: string, value: number }[] = [];
        const publicClients: { name: string, value: number }[] = [];
        const privateClients: { name: string, value: number }[] = [];
        const clientRevenueMap = new Map<string, number>();
        const clientFolhaMap = new Map<string, number>();
        const clientDecimoTerceiroMap = new Map<string, number>();
        const clientFeriasMap = new Map<string, number>();
        const clientFolhaCltAdmMap = new Map<string, number>();
        const clientFolhaPjAdmMap = new Map<string, number>();
        const clientDecimoTerceiroAdmMap = new Map<string, number>();

        // Track months with revenue/expense globally
        const globalRevMonths = new Set<string>();
        const globalWWSMonths = new Set<string>();
        const globalWorldwideMonths = new Set<string>();
        const global2WSMonths = new Set<string>();

        filtered.forEach(t => {
            if (!marginByCC[t.costCenter]) marginByCC[t.costCenter] = { rev: 0, exp: 0, margin: 0, count: 0, revMonths: new Set(), expMonths: new Set() };
            marginByCC[t.costCenter].count++;

            // Get month key for tracking
            const monthKey = format(t.competencyDate || t.dueDate || new Date(), 'yyyy-MM');

            if (t.type === 'receive') {
                totalRev += t.amount;
                if (t.company === 'WWS Services') revWWS += t.amount;
                if (t.company === 'Worldwide Segurança') revWorldwide += t.amount;
                if (t.company === '2WS') rev2WS += t.amount;
                marginByCC[t.costCenter].rev += t.amount;
                marginByCC[t.costCenter].margin += t.amount;
                marginByCC[t.costCenter].revMonths.add(monthKey);
                clientRevenueMap.set(t.costCenter, (clientRevenueMap.get(t.costCenter) || 0) + t.amount);

                // Track global months
                globalRevMonths.add(monthKey);
                if (t.company === 'WWS Services') globalWWSMonths.add(monthKey);
                if (t.company === 'Worldwide Segurança') globalWorldwideMonths.add(monthKey);
                if (t.company === '2WS') global2WSMonths.add(monthKey);
            } else {
                marginByCC[t.costCenter].exp += Math.abs(t.amount);
                marginByCC[t.costCenter].margin -= Math.abs(t.amount);
                marginByCC[t.costCenter].expMonths.add(monthKey);

                const match = t.category.match(/^([\d\.]+)\s*(.*)/);
                const code = match ? match[1] : '';
                const name = match ? match[2].toLowerCase() : t.category.toLowerCase();

                if (code === '2.1.1' && name.includes('folha')) {
                    clientFolhaMap.set(t.costCenter, (clientFolhaMap.get(t.costCenter) || 0) + t.amount);
                } else if ((name.includes('13º salário') || name.includes('13° salário') || name.includes('decimo terceiro')) && code.startsWith('2.1')) {
                    clientDecimoTerceiroMap.set(t.costCenter, (clientDecimoTerceiroMap.get(t.costCenter) || 0) + t.amount);
                } else if ((name.includes('férias') || name.includes('ferias')) && code.startsWith('2.1')) {
                    clientFeriasMap.set(t.costCenter, (clientFeriasMap.get(t.costCenter) || 0) + t.amount);
                } else if (name.includes('folha clt - adm') && code.startsWith('3.1')) {
                    clientFolhaCltAdmMap.set(t.costCenter, (clientFolhaCltAdmMap.get(t.costCenter) || 0) + t.amount);
                } else if (name.includes('folha pj - adm') && code.startsWith('3.1')) {
                    clientFolhaPjAdmMap.set(t.costCenter, (clientFolhaPjAdmMap.get(t.costCenter) || 0) + t.amount);
                } else if ((name.includes('13º salário') || name.includes('13° salário') || name.includes('decimo terceiro')) && code.startsWith('3.1')) {
                    clientDecimoTerceiroAdmMap.set(t.costCenter, (clientDecimoTerceiroAdmMap.get(t.costCenter) || 0) + t.amount);
                }
            }
        });

        if (kpiViewMode === 'accrual') {
            Object.keys(marginByCC).forEach(cc => {
                const folha_value = clientFolhaMap.get(cc) || 0;
                const decimo_terceiro_value = clientDecimoTerceiroMap.get(cc) || 0;
                const ferias_value = clientFeriasMap.get(cc) || 0;

                const provision_13 = (folha_value / 8.7912) - decimo_terceiro_value;
                const provision_ferias = (folha_value / 6.595055) - ferias_value;

                const folha_clt_adm_value = clientFolhaCltAdmMap.get(cc) || 0;
                const folha_pj_adm_value = clientFolhaPjAdmMap.get(cc) || 0;
                const folha_adm_total = folha_clt_adm_value + folha_pj_adm_value;
                const decimo_terceiro_adm_value = clientDecimoTerceiroAdmMap.get(cc) || 0;
                const provision_13_adm = (folha_adm_total / 8.7912) - decimo_terceiro_adm_value;

                marginByCC[cc].margin += provision_13 + provision_ferias + provision_13_adm;
                marginByCC[cc].exp += Math.abs(provision_13) + Math.abs(provision_ferias) + Math.abs(provision_13_adm);
            });
        }

        const monthsCount = Math.max(1, differenceInCalendarMonths(kpiEndDate, kpiStartDate) + 1);

        // Calculate averages based on actual months with values
        const totalRevMonthCount = Math.max(1, globalRevMonths.size);
        const wwsMonthCount = Math.max(1, globalWWSMonths.size);
        const worldwideMonthCount = Math.max(1, globalWorldwideMonths.size);
        const twoWsMonthCount = Math.max(1, global2WSMonths.size);

        if (totalRevMonthCount > 1) totalRev /= totalRevMonthCount;
        if (wwsMonthCount > 1) revWWS /= wwsMonthCount;
        if (worldwideMonthCount > 1) revWorldwide /= worldwideMonthCount;
        if (twoWsMonthCount > 1) rev2WS /= twoWsMonthCount;

        Object.keys(marginByCC).forEach(cc => {
            const ccData = marginByCC[cc];
            const revMonthCount = Math.max(1, ccData.revMonths.size);
            const expMonthCount = Math.max(1, ccData.expMonths.size);

            // Calculate average for revenue and expenses separately based on their actual month counts
            if (revMonthCount > 1) ccData.rev /= revMonthCount;
            if (expMonthCount > 1) ccData.exp /= expMonthCount;

            // For margin, use the maximum of both counts to be conservative
            const marginMonthCount = Math.max(revMonthCount, expMonthCount);
            if (marginMonthCount > 1) ccData.margin /= marginMonthCount;
        });

        clientRevenueMap.forEach((val, key) => {
            const meta = clientMetadata[key];
            const ccData = marginByCC[key];
            const avgVal = ccData && ccData.revMonths.size > 1 ? val / ccData.revMonths.size : val;

            totalRevClients.push({ name: key, value: avgVal });
            if (meta?.company === 'WWS Services') wwsClients.push({ name: key, value: avgVal });
            if (meta?.company === 'Worldwide Segurança') worldwideClients.push({ name: key, value: avgVal });
            if (meta?.company === '2WS') twoWsClients.push({ name: key, value: avgVal });
            if (meta?.type === 'public') publicClients.push({ name: key, value: avgVal });
            else privateClients.push({ name: key, value: avgVal });
        });

        let revPublic = 0; let revPrivate = 0;
        Object.keys(marginByCC).forEach(cc => {
            const meta = clientMetadata[cc];
            const revenue = marginByCC[cc].rev;
            const type = meta ? meta.type : 'private';
            if (type === 'public') revPublic += revenue; else revPrivate += revenue;
        });

        const allMargins = Object.entries(marginByCC).map(([name, data]) => ({ name, ...data }));
        const sortedMargins = [...allMargins].sort((a, b) => b.margin - a.margin);
        const top3Positive = sortedMargins.filter(m => m.margin > 0).slice(0, 3);
        const top3Negative = sortedMargins.filter(m => m.margin < 0).sort((a, b) => a.margin - b.margin).slice(0, 3);
        const totalPositiveMargin = allMargins.filter(m => m.margin > 0).reduce((acc, c) => acc + c.margin, 0);
        const countPositive = allMargins.filter(m => m.margin > 0).length;
        const totalNegativeMargin = allMargins.filter(m => m.margin < 0).reduce((acc, c) => acc + c.margin, 0);
        const countNegative = allMargins.filter(m => m.margin < 0).length;

        return {
            totalRev, revWWS, revWorldwide, rev2WS, revPublic, revPrivate,
            top3Positive, top3Negative, totalPositiveMargin, totalNegativeMargin, countPositive, countNegative,
            totalMargin: totalPositiveMargin + totalNegativeMargin, allMargins,
            charts: { total: totalRevClients, wws: wwsClients, worldwide: worldwideClients, twoWs: twoWsClients, public: publicClients, private: privateClients, monthsCount }
        };
    }, [data, selectedCompany, selectedCostCenters, kpiStartDate, kpiEndDate, kpiViewMode, kpiCashSubView, clientMetadata, selectedClientStatus, selectedClientType, selectedCities]);

    // COA Tree Calculation
    const chartOfAccountsTree = useMemo(() => {
        const companyData = data.filter(t => {
            const companyMatch = selectedCompany === 'all' || t.company === selectedCompany;
            const ccMatch = selectedCostCenters.length === 0 || selectedCostCenters.includes(t.costCenter);
            let catMatch = true;
            if (selectedClientCategory !== 'all') {
                const meta = clientMetadata[t.costCenter];
                const cat = meta ? meta.category : 'administrative';
                if (cat !== selectedClientCategory) catMatch = false;
            }

            // Client Status Filter
            let statusMatch = true;
            const meta = clientMetadata[t.costCenter];
            const status = meta ? meta.status : 'active';
            if (selectedClientStatus === 'active' && status === 'inactive') statusMatch = false;
            if (selectedClientStatus === 'inactive' && status !== 'inactive') statusMatch = false;

            // City Filter Logic
            let cityMatch = true;
            if (selectedCities.length > 0) {
                const city = meta ? meta.city : '';
                cityMatch = selectedCities.includes(city);
            }

            return companyMatch && ccMatch && catMatch && statusMatch && cityMatch;
        });

        const nodesMap = new Map<string, { name: string, monthlyData: Record<string, MonthlyValues> }>();
        companyData.forEach(t => {
            const match = t.category.match(/^([\d\.]+)\s*(.*)/);
            let code = '';
            let name = t.category;
            if (match) { code = match[1]; name = t.category; }
            else { code = t.type === 'receive' ? '1.99' : '3.99'; name = `${code} ${t.category}`; }

            if (!nodesMap.has(code)) { nodesMap.set(code, { name, monthlyData: {} }); }
            const node = nodesMap.get(code)!;

            const dueKey = format(t.dueDate, 'yyyy-MM');
            if (!node.monthlyData[dueKey]) node.monthlyData[dueKey] = { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
            node.monthlyData[dueKey].projected += t.amount;

            if (t.paymentDate && t.status === 'completed') {
                const payKey = format(t.paymentDate, 'yyyy-MM');
                if (!node.monthlyData[payKey]) node.monthlyData[payKey] = { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
                node.monthlyData[payKey].realized += t.amount;
            } else {
                node.monthlyData[dueKey].unrealized += t.amount;
            }

            const compDate = t.competencyDate || t.dueDate;
            const compKey = format(compDate, 'yyyy-MM');
            if (!node.monthlyData[compKey]) node.monthlyData[compKey] = { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
            node.monthlyData[compKey].accrual += t.amount;
        });

        const treeMap = new Map<string, CoaNode>();
        const getOrCreateNode = (code: string): CoaNode => {
            if (treeMap.has(code)) return treeMap.get(code)!;
            const leafData = nodesMap.get(code);
            let name = leafData ? leafData.name : '';
            if (!name) {
                if (code === '1') name = '1. RECEITAS OPERACIONAIS';
                else if (code === '2') name = '2. CUSTOS OPERACIONAIS';
                else if (code === '3') name = '3. DESPESAS OPERACIONAIS';
                else if (code === '4') name = '4. ATIVIDADES DE INVESTIMENTO';
                else if (code === '5') name = '5. ATIVIDADES DE FINANCIAMENTO';
                else name = `${code} (Grupo)`;
            }
            if (categoryRenames[code]) name = categoryRenames[code];
            const newNode: CoaNode = { code, name, monthlyData: leafData ? leafData.monthlyData : {}, children: [], level: code.split('.').length, isLeaf: !!leafData };
            treeMap.set(code, newNode);
            return newNode;
        };

        Array.from(nodesMap.keys()).forEach(code => {
            let currentCode = code;
            while (currentCode) {
                getOrCreateNode(currentCode);
                const parts = currentCode.split('.');
                if (parts.length > 1) { parts.pop(); currentCode = parts.join('.'); } else { currentCode = ''; }
            }
        });

        const rootNodes: CoaNode[] = [];
        const allCodes = Array.from(treeMap.keys()).sort();
        allCodes.forEach(code => {
            const node = treeMap.get(code)!;
            const parts = code.split('.');
            if (parts.length > 1) {
                const parentCode = parts.slice(0, -1).join('.');
                const parent = treeMap.get(parentCode);
                if (parent) { if (!parent.children.find(c => c.code === code)) parent.children.push(node); }
            } else { if (!rootNodes.find(n => n.code === code)) rootNodes.push(node); }
        });

        const calculateTotals = (node: CoaNode) => {
            node.children.forEach(calculateTotals);
            node.children.forEach(child => {
                Object.entries(child.monthlyData).forEach(([mKey, vals]) => {
                    if (!node.monthlyData[mKey]) node.monthlyData[mKey] = { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
                    const values = vals as MonthlyValues;
                    node.monthlyData[mKey].projected += values.projected;
                    node.monthlyData[mKey].realized += values.realized;
                    node.monthlyData[mKey].unrealized += values.unrealized;
                    node.monthlyData[mKey].accrual += values.accrual;
                });
            });
        };
        rootNodes.forEach(calculateTotals);
        const sortChildren = (node: CoaNode) => {
            node.children.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
            node.children.forEach(sortChildren);
        };
        rootNodes.forEach(sortChildren);
        rootNodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

        // Add provision lines (2.1.14.1 and 2.1.15.1)
        const findNode = (code: string): CoaNode | null => {
            const search = (nodes: CoaNode[]): CoaNode | null => {
                for (const node of nodes) {
                    if (node.code === code) return node;
                    const found = search(node.children);
                    if (found) return found;
                }
                return null;
            };
            return search(rootNodes);
        };

        const node_2_1 = findNode('2.1');
        const node_2_1_1 = findNode('2.1.1'); // folha - postos
        const node_2_1_14 = findNode('2.1.14'); // 13º salário - postos
        const node_2_1_15 = findNode('2.1.15'); // férias + 1/3 férias - postos

        if (node_2_1 && node_2_1_1 && node_2_1_14) {
            // Create 2.1.14.1 - Provisionamento 13° salário
            // Collect all unique months from involved nodes
            const allMonths = new Set<string>();
            Object.keys(node_2_1_1.monthlyData).forEach(m => allMonths.add(m));
            Object.keys(node_2_1_14.monthlyData).forEach(m => allMonths.add(m));

            const provision_13_monthlyData: Record<string, MonthlyValues> = {};
            allMonths.forEach(monthKey => {
                const folha_value = node_2_1_1.monthlyData[monthKey]?.accrual || 0;
                const decimo_terceiro_value = node_2_1_14.monthlyData[monthKey]?.accrual || 0;
                const provision_value = (folha_value / 8.7912) - decimo_terceiro_value;

                provision_13_monthlyData[monthKey] = {
                    projected: 0,
                    realized: 0,
                    unrealized: 0,
                    accrual: provision_value
                };
            });

            const provision_13_node: CoaNode = {
                code: '2.1.14.1',
                name: categoryRenames['2.1.14.1'] || '2.1.14.1 Provisionamento 13° salário',
                monthlyData: provision_13_monthlyData,
                children: [],
                level: 4,
                isLeaf: true,
                isProvisionLine: true
            };

            treeMap.set('2.1.14.1', provision_13_node);
            const parent_2_1 = node_2_1;
            const index_2_1_14 = parent_2_1.children.findIndex(c => c.code === '2.1.14');
            if (index_2_1_14 !== -1) {
                parent_2_1.children.splice(index_2_1_14 + 1, 0, provision_13_node);
            }
        }

        if (node_2_1 && node_2_1_1 && node_2_1_15) {
            // Create 2.1.15.1 - Provisionamento Férias
            // Collect all unique months from involved nodes
            const allMonths = new Set<string>();
            Object.keys(node_2_1_1.monthlyData).forEach(m => allMonths.add(m));
            Object.keys(node_2_1_15.monthlyData).forEach(m => allMonths.add(m));

            const provision_ferias_monthlyData: Record<string, MonthlyValues> = {};
            allMonths.forEach(monthKey => {
                const folha_value = node_2_1_1.monthlyData[monthKey]?.accrual || 0;
                const ferias_value = node_2_1_15.monthlyData[monthKey]?.accrual || 0;
                const provision_value = (folha_value / 6.595055) - ferias_value;

                provision_ferias_monthlyData[monthKey] = {
                    projected: 0,
                    realized: 0,
                    unrealized: 0,
                    accrual: provision_value
                };
            });

            const provision_ferias_node: CoaNode = {
                code: '2.1.15.1',
                name: categoryRenames['2.1.15.1'] || '2.1.15.1 Provisionamento Férias',
                monthlyData: provision_ferias_monthlyData,
                children: [],
                level: 4,
                isLeaf: true,
                isProvisionLine: true
            };

            treeMap.set('2.1.15.1', provision_ferias_node);
            const parent_2_1 = node_2_1;
            const index_2_1_15 = parent_2_1.children.findIndex(c => c.code === '2.1.15');
            if (index_2_1_15 !== -1) {
                parent_2_1.children.splice(index_2_1_15 + 1, 0, provision_ferias_node);
            }
        }

        // Recalculate totals after adding provision lines
        const recalculateTotals = (node: CoaNode) => {
            if (node.isLeaf) return;

            // Reset monthly data
            node.monthlyData = {};

            // Recalculate from children
            node.children.forEach(child => {
                recalculateTotals(child);
                Object.entries(child.monthlyData).forEach(([mKey, vals]) => {
                    if (!node.monthlyData[mKey]) node.monthlyData[mKey] = { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
                    const values = vals as MonthlyValues;
                    node.monthlyData[mKey].projected += values.projected;
                    node.monthlyData[mKey].realized += values.realized;
                    node.monthlyData[mKey].unrealized += values.unrealized;
                    node.monthlyData[mKey].accrual += values.accrual;
                });
            });
        };
        rootNodes.forEach(recalculateTotals);

        return rootNodes;
    }, [data, selectedCompany, selectedCostCenters, categoryRenames, selectedClientCategory, clientMetadata, selectedClientStatus, selectedCities]);

    const coaMonths = useMemo(() => eachMonthOfInterval({ start: coaStartDate, end: coaEndDate }), [coaStartDate, coaEndDate]);

    const grandTotals = useMemo(() => {
        const totals: Record<string, MonthlyValues> = {};
        coaMonths.forEach(m => { totals[format(m, 'yyyy-MM')] = { projected: 0, realized: 0, unrealized: 0, accrual: 0 }; });
        const traverseAndSum = (nodes: CoaNode[]) => {
            nodes.forEach(node => {
                if (excludedCoaCodes.has(node.code)) return;
                if (node.isLeaf) {
                    Object.keys(node.monthlyData).forEach(key => {
                        if (!totals[key]) totals[key] = { projected: 0, realized: 0, unrealized: 0, accrual: 0 };
                        const val = node.monthlyData[key] as MonthlyValues;
                        if (val) {
                            totals[key].projected += val.projected;
                            totals[key].realized += val.realized;
                            totals[key].unrealized += val.unrealized;
                            totals[key].accrual += val.accrual;
                        }
                    });
                } else { traverseAndSum(node.children); }
            });
        };
        traverseAndSum(chartOfAccountsTree);
        return totals;
    }, [chartOfAccountsTree, coaMonths, excludedCoaCodes]);

    const topBarProps = {
        activeTab, isConnected,
        startDate: activeTab === 'coa' ? coaStartDate : (activeTab === 'kpis' ? kpiStartDate : (activeTab === 'budget' ? budgetStartDate : (activeTab === 'simulations' ? simStartDate : (activeTab === 'contract_analysis' ? caStartDate : (activeTab === 'contract_sheets' ? csStartDate : statementStartDate))))),
        endDate: activeTab === 'coa' ? coaEndDate : (activeTab === 'kpis' ? kpiEndDate : (activeTab === 'budget' ? budgetEndDate : (activeTab === 'simulations' ? simEndDate : (activeTab === 'contract_analysis' ? caEndDate : (activeTab === 'contract_sheets' ? csEndDate : statementEndDate))))),
        setStart: activeTab === 'coa' ? setCoaStartDate : (activeTab === 'kpis' ? setKpiStartDate : (activeTab === 'budget' ? setBudgetStartDate : (activeTab === 'simulations' ? setSimStartDate : (activeTab === 'contract_analysis' ? setCaStartDate : (activeTab === 'contract_sheets' ? setCsStartDate : setStatementStartDate))))),
        setEnd: activeTab === 'coa' ? setCoaEndDate : (activeTab === 'kpis' ? setKpiEndDate : (activeTab === 'budget' ? setBudgetEndDate : (activeTab === 'simulations' ? setSimEndDate : (activeTab === 'contract_analysis' ? setCaEndDate : (activeTab === 'contract_sheets' ? setCsEndDate : setStatementEndDate))))),
        selectedCompany, setSelectedCompany,
        selectedCostCenters, setSelectedCostCenters, availableCostCenters,
        activeViewMode: activeTab === 'coa' ? coaViewMode : (activeTab === 'kpis' ? kpiViewMode : (activeTab === 'simulations' ? simViewMode : (activeTab === 'contract_analysis' ? caViewMode : (activeTab === 'contract_sheets' ? csViewMode : statementViewMode)))),
        setActiveViewMode: activeTab === 'coa' ? setCoaViewMode : (activeTab === 'kpis' ? setKpiViewMode : (activeTab === 'simulations' ? setSimViewMode : (activeTab === 'contract_analysis' ? setCaViewMode : (activeTab === 'contract_sheets' ? setCsViewMode : setStatementViewMode)))),
        activeSubView: activeTab === 'coa' ? cashSubView : (activeTab === 'kpis' ? kpiCashSubView : (activeTab === 'simulations' ? simCashSubView : (activeTab === 'contract_analysis' ? caCashSubView : (activeTab === 'contract_sheets' ? csCashSubView : statementCashSubView)))),
        setActiveSubView: activeTab === 'coa' ? setCashSubView : (activeTab === 'kpis' ? setKpiCashSubView : (activeTab === 'simulations' ? setSimCashSubView : (activeTab === 'contract_analysis' ? setCaCashSubView : (activeTab === 'contract_sheets' ? setCsCashSubView : setStatementCashSubView)))),
        selectedClientCategory, setSelectedClientCategory,
        selectedClientStatus, setSelectedClientStatus,
        selectedClientType, setSelectedClientType,
        selectedCities, setSelectedCities, availableCities,
        clientMetadata
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white flex text-slate-900 font-sans min-h-[calc(100vh-80px)]">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} hasIndicatorAccess={hasIndicatorAccess} />

            <main className="flex-1 ml-48 flex flex-col">
                <TopBar {...topBarProps} />

                {activeTab === 'files' && canViewTab('files') && (
                    <FilesTab
                        onFinishProcessing={handleFinishProcessing}
                        isConnected={isConnected}
                        supabaseClient={supabaseClient}
                    />
                )}

                {activeTab === 'dashboard' && canViewTab('dashboard') && (
                    <DashboardTab
                        kpiSaldoStats={kpiSaldoStats}
                        stats={stats}
                        monthlyChartData={monthlyChartData}
                        categoryData={categoryData}
                        data={data}
                        clientMetadata={clientMetadata}
                        selectedCompany={selectedCompany}
                        selectedCostCenters={selectedCostCenters}
                        startDate={kpiStartDate}
                        endDate={kpiEndDate}
                    />
                )}

                {activeTab === 'statement' && canViewTab('statement') && (
                    <StatementTab
                        data={data}
                        startDate={statementStartDate}
                        endDate={statementEndDate}
                        viewMode={statementViewMode}
                        cashSubView={statementCashSubView}
                        selectedCompany={selectedCompany}
                        selectedCostCenters={selectedCostCenters}
                        clientMetadata={clientMetadata}
                        selectedClientCategory={selectedClientCategory}
                        initialBalances={initialBalances}
                    />
                )}

                {activeTab === 'delinquent' && canViewTab('delinquent') && (
                    <DelinquentTab
                        data={data}
                        selectedCompany={selectedCompany}
                        selectedCostCenters={selectedCostCenters}
                        clientMetadata={clientMetadata}
                        selectedClientCategory={selectedClientCategory}
                    />
                )}

                {activeTab === 'loans' && canViewTab('loans') && (
                    <LoansTab
                        selectedCompany={selectedCompany}
                        supabaseClient={supabaseClient}
                    />
                )}

                {activeTab === 'simulations' && canViewTab('simulations') && (
                    <SimulationsTab
                        data={[...data, ...simulatedTransactions]}
                        startDate={simStartDate}
                        endDate={simEndDate}
                        viewMode={simViewMode}
                        cashSubView={simCashSubView}
                        selectedCompany={selectedCompany}
                        selectedCostCenters={selectedCostCenters}
                        clientMetadata={clientMetadata}
                        selectedClientCategory={selectedClientCategory}
                        initialBalances={initialBalances}
                        ignoredTransactionIds={ignoredTransactionIds}
                        onToggleIgnore={toggleIgnoreTransaction}
                        onBulkIgnore={toggleBulkIgnoreTransaction}
                        simulationDates={simulationDates}
                        onSetSimulationDate={setSimulationDate}
                        onAddSimulation={addSimulatedTransaction}
                        onRemoveSimulation={removeSimulatedTransaction}
                    />
                )}

                {activeTab === 'contract_analysis' && (
                    <ContractAnalysisTab
                        chartOfAccountsTree={chartOfAccountsTree}
                        startDate={caStartDate}
                        endDate={caEndDate}
                        viewMode={caViewMode}
                        cashSubView={caCashSubView}
                    />
                )}

                {activeTab === 'coa' && canViewTab('coa') && (
                    <CoaTab
                        chartOfAccountsTree={chartOfAccountsTree}
                        months={coaMonths}
                        grandTotals={grandTotals}
                        viewMode={coaViewMode}
                        cashSubView={cashSubView}
                        onRename={handleRenameCategory}
                        excludedCodes={excludedCoaCodes}
                        onToggleExclusion={toggleCoaExclusion}
                        data={data}
                        selectedCompany={selectedCompany}
                        selectedCostCenters={selectedCostCenters}
                        selectedClientStatus={selectedClientStatus}
                        clientMetadata={clientMetadata}
                        selectedCities={selectedCities}
                    />
                )}

                {activeTab === 'budget' && canViewTab('budget') && (
                    <BudgetTab
                        supabaseClient={supabaseClient}
                        isConnected={isConnected}
                        selectedCompany={selectedCompany}
                        startDate={budgetStartDate}
                        endDate={budgetEndDate}
                        data={data}
                        selectedCostCenters={selectedCostCenters}
                        categoryRenames={categoryRenames}
                    />
                )}

                {activeTab === 'kpis' && canViewTab('kpis') && (
                    <KpisTab
                        kpiData={kpiData}
                        data={data}
                        startDate={kpiStartDate}
                        endDate={kpiEndDate}
                        viewMode={kpiViewMode}
                        cashSubView={kpiCashSubView}
                        categoryRenames={categoryRenames}
                        selectedCities={selectedCities}
                        clientMetadata={clientMetadata}
                        selectedCompany={selectedCompany}
                        selectedCostCenters={selectedCostCenters}
                        selectedClientCategory={selectedClientCategory}
                        selectedClientStatus={selectedClientStatus}
                        selectedClientType={selectedClientType}
                    />
                )}

                {activeTab === 'contract_sheets' && canViewTab('contract_sheets') && (
                    <ContractSheetsTab
                        sheets={contractSheets}
                        transactions={data}
                        chartOfAccountsTree={chartOfAccountsTree}
                        availableClients={allConfiguredCostCenters}
                        clientMetadata={clientMetadata}
                        supabaseClient={supabaseClient}
                        onCreateSheet={handleCreateContractSheet}
                        onDeleteSheet={handleDeleteContractSheet}
                        isLoading={sheetsLoading}
                        startDate={csStartDate}
                        endDate={csEndDate}
                        viewMode={csViewMode}
                        cashSubView={csCashSubView}
                        excludedSheetCodes={excludedSheetCodes}
                        onToggleSheetExclusion={toggleSheetExclusion}
                    />
                )}

                {activeTab === 'settings' && canViewTab('settings') && (
                    <SettingsTab
                        supabaseUrl={supabaseUrl}
                        setSupabaseUrl={setSupabaseUrl}
                        supabaseKey={supabaseKey}
                        setSupabaseKey={setSupabaseKey}
                        isConnected={isConnected}
                        dbLoading={dbLoading}
                        fetchFromSupabase={fetchFromSupabase}
                        saveSupabaseConfig={saveSupabaseConfig}
                        supabaseClient={supabaseClient}
                        allConfiguredCostCenters={allConfiguredCostCenters}
                        clientMetadata={clientMetadata}
                        updateClientMetadata={updateClientMetadata}
                        addManualClient={addManualClient}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
