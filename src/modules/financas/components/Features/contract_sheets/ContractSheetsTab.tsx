import React, { useMemo, useState, useCallback } from 'react';
import { Plus, Search, Loader2, ArrowUpDown } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ContractSheet,
  Transaction,
  CoaNode,
  ClientMetadata,
  CoaViewMode,
  CashSubView,
} from '../../../types';
import ContractSheetCard from './ContractSheetCard';
import CreateSheetModal from './CreateSheetModal';
import SheetDetailView from './SheetDetailView';

type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'value-highest' | 'value-lowest';

interface ContractSheetsTabProps {
  sheets: ContractSheet[];
  transactions: Transaction[];
  chartOfAccountsTree: CoaNode[];
  availableClients: string[];
  clientMetadata: Record<string, ClientMetadata>;
  supabaseClient: SupabaseClient | null;
  onCreateSheet: (data: {
    client_name: string;
    start_date: string;
    end_date: string;
    items: Array<{ category_code: string; category_name: string; budgeted_amount: number }>;
  }) => void;
  onDeleteSheet: (id: string) => void;
  isLoading?: boolean;
  startDate: Date;
  endDate: Date;
  viewMode: CoaViewMode;
  cashSubView: CashSubView;
  excludedSheetCodes: Set<string>;
  onToggleSheetExclusion: (code: string) => void;
}

const ContractSheetsTab: React.FC<ContractSheetsTabProps> = ({
  sheets,
  transactions,
  chartOfAccountsTree,
  availableClients,
  clientMetadata,
  supabaseClient,
  onCreateSheet,
  onDeleteSheet,
  isLoading = false,
  startDate,
  endDate,
  viewMode,
  cashSubView,
  excludedSheetCodes,
  onToggleSheetExclusion,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Mantém o selectedSheet sempre sincronizado com a lista atual (evita objeto "stale")
  const selectedSheet = useMemo(
    () => sheets.find((s) => s.id === selectedSheetId) ?? null,
    [sheets, selectedSheetId]
  );

  const filteredSheets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let filtered = term
      ? sheets.filter((sheet) => sheet.client_name.toLowerCase().includes(term))
      : [...sheets];

    const normalizeString = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return normalizeString(a.client_name).localeCompare(normalizeString(b.client_name));
        case 'name-desc':
          return normalizeString(b.client_name).localeCompare(normalizeString(a.client_name));
        case 'date-newest': {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateB - dateA;
        }
        case 'date-oldest': {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        }
        case 'value-highest': {
          const sumA = a.items?.reduce((sum, item) => sum + (Number(item?.budgeted_amount) || 0), 0) ?? 0;
          const sumB = b.items?.reduce((sum, item) => sum + (Number(item?.budgeted_amount) || 0), 0) ?? 0;
          return sumB - sumA;
        }
        case 'value-lowest': {
          const sumA = a.items?.reduce((sum, item) => sum + (Number(item?.budgeted_amount) || 0), 0) ?? 0;
          const sumB = b.items?.reduce((sum, item) => sum + (Number(item?.budgeted_amount) || 0), 0) ?? 0;
          return sumA - sumB;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [sheets, searchTerm, sortBy]);

  const handleCreateSheet = useCallback(
    (data: any) => {
      onCreateSheet(data);
      setIsCreateModalOpen(false);
    },
    [onCreateSheet]
  );

  const handleView = useCallback((sheet: ContractSheet) => {
    setSelectedSheetId(sheet.id);
  }, []);

  const handleCloseDetail = useCallback(() => setSelectedSheetId(null), []);

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fichas de Contratos</h1>
            <p className="text-slate-500 mt-1">Acompanhe valores orçados vs realizados por cliente</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Incluir Nova Ficha
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ficha por cliente..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 shadow-sm"
            />
          </div>

          <div className="relative sm:w-64">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 shadow-sm appearance-none cursor-pointer"
            >
              <option value="name-asc">Nome: A-Z</option>
              <option value="name-desc">Nome: Z-A</option>
              <option value="date-newest">Data: Mais Recente</option>
              <option value="date-oldest">Data: Mais Antiga</option>
              <option value="value-highest">Valor: Maior</option>
              <option value="value-lowest">Valor: Menor</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Carregando fichas...</p>
        </div>
      ) : filteredSheets.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchTerm ? 'Nenhuma ficha encontrada' : 'Nenhuma ficha cadastrada'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm
              ? 'Tente buscar com outros termos'
              : 'Crie sua primeira ficha para começar a acompanhar os orçamentos'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
            >
              <Plus className="w-5 h-5" />
              Criar Primeira Ficha
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSheets.map((sheet) => (
            <ContractSheetCard
              key={sheet.id}
              sheet={sheet}
              onView={handleView}
              onDelete={onDeleteSheet}
            />
          ))}
        </div>
      )}

      <CreateSheetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSheet}
        availableClients={availableClients}
        clientMetadata={clientMetadata}
        chartOfAccountsTree={chartOfAccountsTree}
      />

      {selectedSheet && (
        <SheetDetailView
          sheet={selectedSheet}
          transactions={transactions}
          chartOfAccountsTree={chartOfAccountsTree}
          supabaseClient={supabaseClient}
          onClose={handleCloseDetail}
          startDate={startDate}
          endDate={endDate}
          viewMode={viewMode}
          cashSubView={cashSubView}
          excludedSheetCodes={excludedSheetCodes}
          onToggleSheetExclusion={onToggleSheetExclusion}
        />
      )}
    </div>
  );
};

export default ContractSheetsTab;
