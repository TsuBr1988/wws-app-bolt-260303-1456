import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

type SortKey =
  | 'client'
  | 'value'
  | 'margin'
  | 'faixa'
  | 'empresa'
  | 'frente'
  | 'familia'
  | 'closingDate';

type SortDir = 'asc' | 'desc';

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeText(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function getProposalYear(p: any): number {
  const d = p?.closing_date || p?.closingDate || p?.created_at || p?.createdAt;
  const date = d ? new Date(d) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getFullYear() : 0;
}

function getClosingDate(p: any): Date | null {
  const d = p?.closing_date || p?.closingDate;
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getContractAnnualValue(p: any): number {
  // Mesma lógica da meta comercial (CommercialGoalCard): valor mensal * 12
  const monthlyValue = toNumber(p?.monthly_value ?? p?.monthlyValue);
  return monthlyValue * 12;
}

function getMarginPercent(p: any): number {
  // margem_percentual é armazenada como % (ex: 10 = 10%)
  return toNumber(p?.margem_percentual ?? p?.margemPercentual);
}

function getFaixa(marginPercent: number): 1 | 2 | 3 {
  if (marginPercent > 10) return 1;
  if (marginPercent >= 8 && marginPercent <= 10) return 2;
  return 3;
}

export const StrategicKPICard: React.FC = () => {
  const { selectedYear } = useYear();
  const { data: proposals = [], loading } = useSupabaseQuery('proposals');
  const { getAnnualGoal, loading: goalsLoading } = useMonthlyGoals();
  const targetAnnualRevenue = getAnnualGoal();

  const EMPRESA_OPTIONS = ['WWS', 'Worldwide', '2WS'] as const;

  const [isExpanded, setIsExpanded] = useState(false);
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [frenteFilter, setFrenteFilter] = useState<string>('all');
  const [familiaFilter, setFamiliaFilter] = useState<string>('all');
  const [margemAlvoPercent, setMargemAlvoPercent] = useState<number>(10);
  const [sortKey, setSortKey] = useState<SortKey>('closingDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const closedContracts = useMemo(() => {
    const isClosedStatus = (status: any) => {
      const s = normalizeText(status);
      return s === 'Fechado' || s === 'Contratado' || s === 'Contratada';
    };

    return (proposals as any[])
      .filter(p => isClosedStatus(p?.status))
      // Para contratos fechados/contratados, usar a data de fechamento como fonte do ano
      .filter(p => {
        const closingDate = getClosingDate(p);
        if (!closingDate) return false;
        return closingDate.getFullYear() === selectedYear;
      });
  }, [proposals, selectedYear]);

  const filterOptions = useMemo(() => {
    const frentes = new Set<string>();
    const familias = new Set<string>();

    closedContracts.forEach(p => {
      const frente = normalizeText(p?.frente);
      const familia = normalizeText(p?.familia);
      if (frente) frentes.add(frente);
      if (familia) familias.add(familia);
    });

    const toSortedArray = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b));

    return {
      empresas: [...EMPRESA_OPTIONS],
      frentes: toSortedArray(frentes),
      familias: toSortedArray(familias),
    };
  }, [closedContracts]);

  const filteredContracts = useMemo(() => {
    return closedContracts.filter(p => {
      const empresa = normalizeText(p?.empresa);
      const frente = normalizeText(p?.frente);
      const familia = normalizeText(p?.familia);

      const empresaOk = empresaFilter === 'all' || empresa === empresaFilter;
      const frenteOk = frenteFilter === 'all' || frente === frenteFilter;
      const familiaOk = familiaFilter === 'all' || familia === familiaFilter;

      return empresaOk && frenteOk && familiaOk;
    });
  }, [closedContracts, empresaFilter, frenteFilter, familiaFilter]);

  const computed = useMemo(() => {
    const contracts = filteredContracts.map(p => {
      const annualValue = getContractAnnualValue(p);
      const marginPercent = getMarginPercent(p);
      const faixa = getFaixa(marginPercent);
      const closingDate = getClosingDate(p);

      return {
        raw: p,
        client: normalizeText(p?.client) || '—',
        annualValue,
        marginPercent,
        faixa,
        empresa: normalizeText(p?.empresa) || '—',
        frente: normalizeText(p?.frente) || '—',
        familia: normalizeText(p?.familia) || '—',
        closingDate,
      };
    });

    const faturamentoAtual = contracts.reduce((sum, c) => sum + c.annualValue, 0);
    const margemTotalAtual = contracts.reduce((sum, c) => sum + (c.annualValue * (c.marginPercent / 100)), 0);
    const margemAtual = faturamentoAtual > 0 ? (margemTotalAtual / faturamentoAtual) : 0;

    const faixa1 = contracts.filter(c => c.faixa === 1);
    const faixa2 = contracts.filter(c => c.faixa === 2);
    const faixa3 = contracts.filter(c => c.faixa === 3);

    const sumValue = (arr: typeof contracts) => arr.reduce((sum, c) => sum + c.annualValue, 0);

    const margemDesejadaTotal = 0.10 * faturamentoAtual;
    const gapMargem = margemDesejadaTotal - margemTotalAtual;

    const margemAlvo = Math.max(0, margemAlvoPercent) / 100;
    const faturamentoAdicionalNecessario = margemAlvo > 0 ? (Math.max(0, gapMargem) / margemAlvo) : 0;

    return {
      contracts,
      faturamentoAtual,
      margemAtual,
      margemTotalAtual,
      gapMargem,
      faturamentoAdicionalNecessario,
      faixas: {
        f1: { count: faixa1.length, total: sumValue(faixa1) },
        f2: { count: faixa2.length, total: sumValue(faixa2) },
        f3: { count: faixa3.length, total: sumValue(faixa3) },
      }
    };
  }, [filteredContracts, margemAlvoPercent]);

  const sortedContracts = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;

    const getValue = (c: any): any => {
      switch (sortKey) {
        case 'client': return c.client.toLowerCase();
        case 'empresa': return c.empresa.toLowerCase();
        case 'frente': return c.frente.toLowerCase();
        case 'familia': return c.familia.toLowerCase();
        case 'value': return c.annualValue;
        case 'margin': return c.marginPercent;
        case 'faixa': return c.faixa;
        case 'closingDate': return c.closingDate ? c.closingDate.getTime() : 0;
        default: return 0;
      }
    };

    return computed.contracts
      .slice()
      .sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (av > bv) return 1 * dir;
        if (av < bv) return -1 * dir;
        return 0;
      });
  }, [computed.contracts, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      }
      setSortDir('desc');
      return key;
    });
  };

  const formatPercent = (valueFraction: number) => `${(valueFraction * 100).toFixed(1)}%`;

  if (loading || goalsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 my-6">
      <div
        className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-xl font-bold text-gray-900">KPI Estratégico</h2>
          <p className="text-sm text-gray-500">
            {isExpanded ? 'Clique para recolher os indicadores' : 'Clique para expandir e ver detalhes estratégicos'}
          </p>
        </div>
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isExpanded ? 'Recolher KPI Estratégico' : 'Expandir KPI Estratégico'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {isExpanded && (
          <div className="px-6 pb-6 space-y-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Empresa</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                  value={empresaFilter}
                  onChange={(e) => setEmpresaFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {filterOptions.empresas.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Frente</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                  value={frenteFilter}
                  onChange={(e) => setFrenteFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {filterOptions.frentes.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Família</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                  value={familiaFilter}
                  onChange={(e) => setFamiliaFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {filterOptions.familias.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Margem alvo (%)</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                  value={margemAlvoPercent}
                  onChange={(e) => setMargemAlvoPercent(toNumber(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            {/* Indicadores principais (topo do detalhe) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="p-4 border rounded-xl shadow bg-white lg:col-span-2">
                <div className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-1">Margem média (ponderada)</div>
                <div className="text-3xl font-bold text-gray-900">{formatPercent(computed.margemAtual)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Base: {computed.contracts.length} contratos • {formatCurrency(computed.faturamentoAtual)}
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  Meta de margem média: <strong>10%</strong> • Meta faturamento anual: <strong>{formatCurrency(targetAnnualRevenue)}</strong>
                </div>
              </div>

              <div className="p-4 border rounded-xl shadow bg-white">
                <div className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-1">Faixa 1 (&gt;10%)</div>
                <div className="text-2xl font-bold text-green-700">{computed.faixas.f1.count}</div>
                <div className="text-xs text-gray-500">Total: {formatCurrency(computed.faixas.f1.total)}</div>
              </div>

              <div className="p-4 border rounded-xl shadow bg-white">
                <div className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-1">Faixa 2 (8% a 10%)</div>
                <div className="text-2xl font-bold text-orange-600">{computed.faixas.f2.count}</div>
                <div className="text-xs text-gray-500">Total: {formatCurrency(computed.faixas.f2.total)}</div>
              </div>

              <div className="p-4 border rounded-xl shadow bg-white">
                <div className="text-xs uppercase tracking-wide font-medium text-gray-500 mb-1">Faixa 3 (&lt;8%)</div>
                <div className="text-2xl font-bold text-red-600">{computed.faixas.f3.count}</div>
                <div className="text-xs text-gray-500">Total: {formatCurrency(computed.faixas.f3.total)}</div>
              </div>
            </div>

            {/* Gap de margem */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              {computed.gapMargem <= 0 ? (
                <div className="text-sm text-gray-700">
                  <strong>Meta atingida:</strong> a média ponderada já está em <strong>10%</strong> ou mais para os contratos filtrados.
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-sm text-gray-700">
                    Falta <strong>{formatCurrency(computed.gapMargem)}</strong> de margem para atingir média de <strong>10%</strong>.
                  </div>
                  <div className="text-sm text-gray-700">
                    Se os próximos contratos vierem com margem alvo de <strong>{margemAlvoPercent.toFixed(1)}%</strong>,
                    seria necessário aproximadamente <strong>{formatCurrency(computed.faturamentoAdicionalNecessario)}</strong> de faturamento adicional.
                  </div>
                </div>
              )}
            </div>

            {/* Tabela detalhada */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contratos fechados em {selectedYear}</h3>
                  <p className="text-sm text-gray-500">Ordene por margem, valor, data, etc.</p>
                </div>
                <div className="text-sm text-gray-600">Total: <strong>{sortedContracts.length}</strong></div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium text-gray-700">
                        <button className="flex items-center gap-2" onClick={() => onSort('client')}>
                          Cliente / contrato <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                        <button className="flex items-center gap-2" onClick={() => onSort('value')}>
                          Valor (anual) <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                        <button className="flex items-center gap-2" onClick={() => onSort('margin')}>
                          Margem % <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                        <button className="flex items-center gap-2" onClick={() => onSort('faixa')}>
                          Faixa <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700">
                        <button className="flex items-center gap-2" onClick={() => onSort('empresa')}>
                          Empresa <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700">
                        <button className="flex items-center gap-2" onClick={() => onSort('frente')}>
                          Frente <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700">
                        <button className="flex items-center gap-2" onClick={() => onSort('familia')}>
                          Família <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                        <button className="flex items-center gap-2" onClick={() => onSort('closingDate')}>
                          Data de fechamento <ArrowUpDown className="w-4 h-4 text-gray-400" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedContracts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          Nenhum contrato fechado encontrado com os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      sortedContracts.map((c, idx) => (
                        <tr key={c.raw?.id ?? idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{c.client}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(c.annualValue)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{c.marginPercent.toFixed(1)}%</td>
                          <td className="px-4 py-3 whitespace-nowrap">{c.faixa}</td>
                          <td className="px-4 py-3">{c.empresa}</td>
                          <td className="px-4 py-3">{c.frente}</td>
                          <td className="px-4 py-3">{c.familia}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {c.raw?.closing_date || c.raw?.closingDate ? displayDate(c.raw?.closing_date ?? c.raw?.closingDate) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
