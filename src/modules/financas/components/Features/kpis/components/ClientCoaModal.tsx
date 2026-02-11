
import React, { useState, useMemo } from 'react';
import { Briefcase, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Transaction, CoaViewMode, CashSubView } from '../../../../types';
import { formatCurrency, getValueColor } from '../../../../utils';
import { differenceInMonths } from 'date-fns';

const ClientCoaModal = ({ 
    clientName, 
    data, 
    startDate, 
    endDate, 
    viewMode, 
    cashSubView, 
    onClose,
    categoryRenames
}: { 
    clientName: string;
    data: Transaction[];
    startDate: Date;
    endDate: Date;
    viewMode: CoaViewMode;
    cashSubView: CashSubView;
    onClose: () => void;
    categoryRenames: Record<string, string>;
}) => {
    const clientTree = useMemo(() => {
        const transactions = data.filter(t => {
            if (t.costCenter !== clientName) return false;

            if (viewMode === 'cash') {
                const inRange = (d?: Date) => d && d >= startDate && d <= endDate;
                const isRealizedInRange = t.status === 'completed' && inRange(t.paymentDate);
                const isProjectedInRange = t.status === 'pending' && inRange(t.dueDate);
                return isRealizedInRange || isProjectedInRange;
            } else {
                const d = t.competencyDate || t.dueDate;
                return d >= startDate && d <= endDate;
            }
        });

        const nodesMap = new Map<string, { name: string, total: number, projected: number, realized: number }>();

        transactions.forEach(t => {
            const match = t.category.match(/^([\d\.]+)\s*(.*)/);
            let code = '';
            let name = t.category;
            if (match) { code = match[1]; name = t.category; }
            else { code = t.type === 'receive' ? '1.99' : '3.99'; name = `${code} ${t.category}`; }

            if (!nodesMap.has(code)) { nodesMap.set(code, { name, total: 0, projected: 0, realized: 0 }); }
            const node = nodesMap.get(code)!;

            let val = 0;
            let projectedVal = 0;
            let realizedVal = 0;

            if (viewMode === 'accrual') {
                val = t.amount;
                if (t.status === 'completed') realizedVal = t.amount;
                else projectedVal = t.amount;
            } else {
                if (cashSubView === 'all') {
                    val = t.amount;
                    if (t.status === 'completed') realizedVal = t.amount;
                    else projectedVal = t.amount;
                } else if (cashSubView === 'realized' && t.status === 'completed') {
                    val = t.amount;
                    realizedVal = t.amount;
                } else if (cashSubView === 'projected' && t.status === 'pending') {
                    val = t.amount;
                    projectedVal = t.amount;
                }
            }

            node.total += val;
            node.projected += projectedVal;
            node.realized += realizedVal;
        });

        const treeMap = new Map<string, any>();
        const getOrCreateNode = (code: string) => {
            if (treeMap.has(code)) return treeMap.get(code);

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

            const newNode = {
                code,
                name,
                total: leafData ? leafData.total : 0,
                projected: leafData ? leafData.projected : 0,
                realized: leafData ? leafData.realized : 0,
                children: [],
                level: code.split('.').length,
                isLeaf: !!leafData
            };
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

        const rootNodes: any[] = [];
        const allCodes = Array.from(treeMap.keys()).sort(); 
        allCodes.forEach(code => {
            const node = treeMap.get(code);
            const parts = code.split('.');
            if (parts.length > 1) {
                const parentCode = parts.slice(0, -1).join('.');
                const parent = treeMap.get(parentCode);
                if (parent && !parent.children.find((c: any) => c.code === code)) parent.children.push(node);
            } else { 
                if (!rootNodes.find(n => n.code === code)) rootNodes.push(node); 
            }
        });

        const calculateTotals = (node: any) => {
            node.children.forEach(calculateTotals);
            if (node.children.length > 0) {
                node.total = node.children.reduce((acc: number, c: any) => acc + c.total, 0);
                node.projected = node.children.reduce((acc: number, c: any) => acc + c.projected, 0);
                node.realized = node.children.reduce((acc: number, c: any) => acc + c.realized, 0);
            }
        };
        rootNodes.forEach(calculateTotals);

        if (viewMode === 'accrual') {
            const findNode = (code: string) => treeMap.get(code);
            const findNodeByName = (parentCode: string, searchTerm: string) => {
                const parent = findNode(parentCode);
                if (!parent) return null;
                return parent.children.find((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
            };

            let node_2_1 = findNode('2.1');
            const node_2_1_1 = findNode('2.1.1');
            let node_13_salario = findNodeByName('2.1', '13º salário') || findNodeByName('2.1', '13° salário') || findNodeByName('2.1', 'decimo terceiro');
            let node_ferias = findNodeByName('2.1', 'férias') || findNodeByName('2.1', 'ferias');

            if (node_2_1 && node_2_1_1) {
                if (!node_13_salario) {
                    node_13_salario = {
                        code: '2.1.14',
                        name: categoryRenames['2.1.14'] || '2.1.14 13º salário - postos',
                        total: 0,
                        projected: 0,
                        realized: 0,
                        children: [],
                        level: 3,
                        isLeaf: true
                    };
                    treeMap.set('2.1.14', node_13_salario);
                    node_2_1.children.push(node_13_salario);
                }

                if (!node_ferias) {
                    node_ferias = {
                        code: '2.1.15',
                        name: categoryRenames['2.1.15'] || '2.1.15 férias + 1/3 férias - postos',
                        total: 0,
                        projected: 0,
                        realized: 0,
                        children: [],
                        level: 3,
                        isLeaf: true
                    };
                    treeMap.set('2.1.15', node_ferias);
                    node_2_1.children.push(node_ferias);
                }

                node_2_1.children.sort((a: any, b: any) => {
                    const aCode = a.code.split('.').map((n: string) => parseInt(n));
                    const bCode = b.code.split('.').map((n: string) => parseInt(n));
                    for (let i = 0; i < Math.max(aCode.length, bCode.length); i++) {
                        if ((aCode[i] || 0) !== (bCode[i] || 0)) {
                            return (aCode[i] || 0) - (bCode[i] || 0);
                        }
                    }
                    return 0;
                });

                const folha_value = node_2_1_1.total || 0;
                const decimo_terceiro_value = node_13_salario.total || 0;
                const provision_13_value = (folha_value / 8.7912) - decimo_terceiro_value;

                const provision_13_code = node_13_salario.code + '.1';
                const provision_13_node = {
                    code: provision_13_code,
                    name: categoryRenames[provision_13_code] || `${provision_13_code} Provisionamento 13° salário`,
                    total: provision_13_value,
                    projected: 0,
                    realized: provision_13_value,
                    children: [],
                    level: 4,
                    isLeaf: true,
                    isProvisionLine: true
                };

                treeMap.set(provision_13_code, provision_13_node);
                const index_13 = node_2_1.children.findIndex((c: any) => c.code === node_13_salario.code);
                if (index_13 !== -1) {
                    node_2_1.children.splice(index_13 + 1, 0, provision_13_node);
                }

                const ferias_value = node_ferias.total || 0;
                const provision_ferias_value = (folha_value / 6.595055 ) - ferias_value;

                const provision_ferias_code = node_ferias.code + '.1';
                const provision_ferias_node = {
                    code: provision_ferias_code,
                    name: categoryRenames[provision_ferias_code] || `${provision_ferias_code} Provisionamento Férias`,
                    total: provision_ferias_value,
                    projected: 0,
                    realized: provision_ferias_value,
                    children: [],
                    level: 4,
                    isLeaf: true,
                    isProvisionLine: true
                };

                treeMap.set(provision_ferias_code, provision_ferias_node);
                const index_ferias = node_2_1.children.findIndex((c: any) => c.code === node_ferias.code);
                if (index_ferias !== -1) {
                    node_2_1.children.splice(index_ferias + 1, 0, provision_ferias_node);
                }
            }

            let node_3_1 = findNode('3.1');
            const node_folha_clt_adm = findNodeByName('3.1', 'folha clt - adm');
            const node_folha_pj_adm = findNodeByName('3.1', 'folha pj - adm');
            let node_13_salario_adm = findNodeByName('3.1', '13º salário') || findNodeByName('3.1', '13° salário') || findNodeByName('3.1', 'decimo terceiro');

            if (node_3_1 && (node_folha_clt_adm || node_folha_pj_adm)) {
                if (!node_13_salario_adm) {
                    node_13_salario_adm = {
                        code: '3.1.11',
                        name: categoryRenames['3.1.11'] || '3.1.11 13º salário - adm',
                        total: 0,
                        projected: 0,
                        realized: 0,
                        children: [],
                        level: 3,
                        isLeaf: true
                    };
                    treeMap.set('3.1.11', node_13_salario_adm);
                    node_3_1.children.push(node_13_salario_adm);
                }

                node_3_1.children.sort((a: any, b: any) => {
                    const aCode = a.code.split('.').map((n: string) => parseInt(n));
                    const bCode = b.code.split('.').map((n: string) => parseInt(n));
                    for (let i = 0; i < Math.max(aCode.length, bCode.length); i++) {
                        if ((aCode[i] || 0) !== (bCode[i] || 0)) {
                            return (aCode[i] || 0) - (bCode[i] || 0);
                        }
                    }
                    return 0;
                });

                const folha_clt_adm_value = node_folha_clt_adm ? (node_folha_clt_adm.total || 0) : 0;
                const folha_pj_adm_value = node_folha_pj_adm ? (node_folha_pj_adm.total || 0) : 0;
                const folha_adm_total = folha_clt_adm_value + folha_pj_adm_value;
                const decimo_terceiro_adm_value = node_13_salario_adm.total || 0;
                const provision_13_adm_value = (folha_adm_total / 8.791209) - decimo_terceiro_adm_value;

                const provision_13_adm_code = node_13_salario_adm.code + '.1';
                const provision_13_adm_node = {
                    code: provision_13_adm_code,
                    name: categoryRenames[provision_13_adm_code] || `${provision_13_adm_code} Provisionamento 13° salário - adm`,
                    total: provision_13_adm_value,
                    projected: 0,
                    realized: provision_13_adm_value,
                    children: [],
                    level: 4,
                    isLeaf: true,
                    isProvisionLine: true
                };

                treeMap.set(provision_13_adm_code, provision_13_adm_node);
                const index_13_adm = node_3_1.children.findIndex((c: any) => c.code === node_13_salario_adm.code);
                if (index_13_adm !== -1) {
                    node_3_1.children.splice(index_13_adm + 1, 0, provision_13_adm_node);
                }
            }

            rootNodes.forEach(calculateTotals);
        }

        const filterTree = (nodes: any[]): any[] => {
            return nodes.filter(node => {
                if (node.children.length > 0) {
                    node.children = filterTree(node.children);
                }
                const is13Salario = node.name.toLowerCase().includes('13º salário') || node.name.toLowerCase().includes('13° salário') || node.name.toLowerCase().includes('decimo terceiro');
                const isFerias = node.name.toLowerCase().includes('férias') || node.name.toLowerCase().includes('ferias');
                const shouldAlwaysShow = node.isProvisionLine || (is13Salario && node.level === 3) || (isFerias && node.level === 3);
                return Math.abs(node.total) > 0.001 || node.children.length > 0 || shouldAlwaysShow;
            });
        };

        const filteredRoots = filterTree(rootNodes);
        return filteredRoots;

    }, [clientName, data, startDate, endDate, viewMode, cashSubView, categoryRenames]);

    const monthsCount = useMemo(() => {
        const transactions = data.filter(t => {
            if (t.costCenter !== clientName) return false;

            if (viewMode === 'cash') {
                const inRange = (d?: Date) => d && d >= startDate && d <= endDate;
                const isRealizedInRange = t.status === 'completed' && inRange(t.paymentDate);
                const isProjectedInRange = t.status === 'pending' && inRange(t.dueDate);
                return isRealizedInRange || isProjectedInRange;
            } else {
                const d = t.competencyDate || t.dueDate;
                return d >= startDate && d <= endDate;
            }
        });

        const uniqueMonths = new Set<string>();
        transactions.forEach(t => {
            const date = viewMode === 'cash'
                ? (t.status === 'completed' ? t.paymentDate : t.dueDate)
                : (t.competencyDate || t.dueDate);

            if (date) {
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                uniqueMonths.add(monthKey);
            }
        });

        return Math.max(1, uniqueMonths.size);
    }, [clientName, data, startDate, endDate, viewMode]);

    const ClientCoaRow: React.FC<{ node: any }> = ({ node }) => {
        const [expanded, setExpanded] = useState(true);
        const isGroup = node.children.length > 0;
        const accumulated = node.total;
        const average = node.total / monthsCount;
        const isProvisionLine = node.isProvisionLine || false;

        return (
            <div className="flex flex-col">
                <div
                    className={`flex items-center justify-between py-2 px-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${isGroup ? 'bg-slate-50/50 font-bold' : ''} ${isProvisionLine ? 'bg-red-50/50' : ''}`}
                    style={{ paddingLeft: `${node.level * 16}px` }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isGroup && (
                            <div className="text-slate-400">
                                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </div>
                        )}
                        <span className={`text-xs ${isGroup ? 'text-slate-800 uppercase tracking-wide' : 'text-slate-600'} truncate`}>
                            {node.name}
                        </span>
                    </div>
                    <div className="flex gap-4 flex-shrink-0">
                        <div className="flex items-center justify-end w-28">
                            <span className={`text-xs font-bold ${getValueColor(accumulated)}`}>
                                {formatCurrency(accumulated)}
                            </span>
                        </div>
                        <div className="flex items-center justify-end w-28">
                            <span className={`text-xs font-bold ${getValueColor(average)}`}>
                                {formatCurrency(average)}
                            </span>
                        </div>
                    </div>
                </div>
                {expanded && node.children.map((child: any) => <ClientCoaRow key={child.code} node={child} />)}
            </div>
        );
    };

    const totalAccumulated = clientTree.reduce((acc, n) => acc + n.total, 0);
    const totalAverage = totalAccumulated / monthsCount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Demonstrativo do Cliente</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{clientName}</h3>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex justify-end gap-4 px-4">
                        <div className="w-28 text-right">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Acumulado</span>
                        </div>
                        <div className="w-28 text-right">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Médio</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {clientTree.length > 0 ? (
                        clientTree.map((node: any) => <ClientCoaRow key={node.code} node={node} />)
                    ) : (
                        <div className="text-center py-10 text-slate-400">Nenhum dado encontrado para este período.</div>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Resultado do Período</span>
                        <div className="flex gap-4">
                            <div className="flex items-center justify-end w-28">
                                <span className={`text-sm font-bold ${getValueColor(totalAccumulated)}`}>
                                    {formatCurrency(totalAccumulated)}
                                </span>
                            </div>
                            <div className="flex items-center justify-end w-28">
                                <span className={`text-sm font-bold ${getValueColor(totalAverage)}`}>
                                    {formatCurrency(totalAverage)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientCoaModal;
