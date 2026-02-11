import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ContractSheet,
  Transaction,
  CoaViewMode,
  CashSubView,
  CoaNode
} from '../../../types';
import { startOfMonth } from '../../../utils';
import { SheetAddendumForm } from './SheetAddendumForm';
import { SheetAddendumViewModal } from './SheetAddendumViewModal';
import { TerminateSheetModal } from './TerminateSheetModal';
import { SheetPrintModal } from './SheetPrintModal';
import { SheetDetailHeader } from './SheetDetailHeader';
import { SheetDetailControls } from './SheetDetailControls';
import { SheetDetailChart } from './SheetDetailChart';
import { SheetDetailTable } from './SheetDetailTable';
import { useSheetDetailData } from './useSheetDetailData';
import { getRowKey } from './sheetDetailUtils';

interface SheetDetailViewProps {
  sheet: ContractSheet;
  transactions: Transaction[];
  chartOfAccountsTree: CoaNode[];
  supabaseClient: SupabaseClient | null;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  viewMode?: CoaViewMode;
  cashSubView?: CashSubView;
  excludedSheetCodes: Set<string>;
  onToggleSheetExclusion: (code: string) => void;
}

const SheetDetailView: React.FC<SheetDetailViewProps> = ({
  sheet,
  transactions,
  chartOfAccountsTree,
  supabaseClient,
  onClose,
  startDate,
  endDate,
  excludedSheetCodes,
  onToggleSheetExclusion
}) => {
  const [localViewMode, setLocalViewMode] = useState<CoaViewMode>('accrual');
  const [localCashSubView, setLocalCashSubView] = useState<CashSubView>('all');

  // Usar o mês atual como padrão ao abrir um contrato, mas nunca antes da data de início da ficha
  const currentMonth = startOfMonth(new Date());
  const sheetStartMonth = startOfMonth(new Date(sheet.start_date));
  const initialMonth = currentMonth >= sheetStartMonth ? currentMonth : sheetStartMonth;
  const [startMonthSel, setStartMonthSel] = useState<Date>(initialMonth);
  const [endMonthSel, setEndMonthSel] = useState<Date>(initialMonth);

  const [showChart, setShowChart] = useState(false);
  const [showAddendumForm, setShowAddendumForm] = useState(false);
  const [showAddendumHistory, setShowAddendumHistory] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingAddendum, setEditingAddendum] = useState<any>(null);

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const {
    rangeMonths,
    rangeCount,
    categoryData,
    totalsRange,
    chartData,
    rangeLabel
  } = useSheetDetailData({
    sheet,
    transactions,
    chartOfAccountsTree,
    supabaseClient,
    startDate,
    endDate,
    startMonthSel,
    endMonthSel,
    localViewMode,
    localCashSubView,
    excludedSheetCodes
  });

  useEffect(() => {
    setExpandedMap((prev) => {
      const next = { ...prev };
      categoryData.forEach((r) => {
        const key = r.codigo || `${r.nome}-${r.ordem}`;
        if (next[key] === undefined && r.level === 1) {
          next[key] = true;
        }
      });
      return next;
    });
  }, [categoryData]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-7xl max-h-[95vh] bg-white rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <SheetDetailHeader
            sheet={sheet}
            totalsRange={totalsRange}
            rangeLabel={rangeLabel}
            onClose={onClose}
            onCreateAddendum={() => setShowAddendumForm(true)}
            onShowHistory={() => setShowAddendumHistory(true)}
            onTerminate={() => setShowTerminateModal(true)}
            onPrint={() => setShowPrintModal(true)}
          />

          <div className="px-8">
            <SheetDetailControls
              localViewMode={localViewMode}
              setLocalViewMode={setLocalViewMode}
              localCashSubView={localCashSubView}
              setLocalCashSubView={setLocalCashSubView}
              startMonthSel={startMonthSel}
              setStartMonthSel={setStartMonthSel}
              endMonthSel={endMonthSel}
              setEndMonthSel={setEndMonthSel}
              showChart={showChart}
              setShowChart={setShowChart}
              rangeLabel={rangeLabel}
              rangeCount={rangeCount}
              minStartDate={startOfMonth(new Date(sheet.start_date))}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {showChart ? (
              <SheetDetailChart chartData={chartData} />
            ) : (
              <SheetDetailTable
                categoryData={categoryData}
                rangeMonths={rangeMonths}
                rangeCount={rangeCount}
                expandedMap={expandedMap}
                setExpandedMap={setExpandedMap}
                totalsRange={totalsRange}
                transactions={transactions}
                clientName={sheet.client_name}
                viewMode={localViewMode}
                cashSubView={localCashSubView}
                excludedSheetCodes={excludedSheetCodes}
                onToggleSheetExclusion={onToggleSheetExclusion}
              />
            )}
          </div>
        </div>
      </div>

      {showAddendumForm && (
        <SheetAddendumForm
          sheet={sheet}
          supabaseClient={supabaseClient}
          chartOfAccountsTree={chartOfAccountsTree}
          existingAddendum={editingAddendum}
          onClose={() => {
            setShowAddendumForm(false);
            setEditingAddendum(null);
          }}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
            setShowAddendumForm(false);
            setEditingAddendum(null);
          }}
        />
      )}

      {showAddendumHistory && (
        <SheetAddendumViewModal
          key={refreshKey}
          sheet={sheet}
          supabaseClient={supabaseClient}
          onClose={() => setShowAddendumHistory(false)}
          onEdit={(addendum) => {
            setEditingAddendum(addendum);
            setShowAddendumHistory(false);
            setShowAddendumForm(true);
          }}
        />
      )}

      {showTerminateModal && (
        <TerminateSheetModal
          sheet={sheet}
          supabaseClient={supabaseClient}
          onClose={() => setShowTerminateModal(false)}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
            setShowTerminateModal(false);
            onClose();
          }}
        />
      )}

      {showPrintModal && (
        <SheetPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          sheet={sheet}
          supabaseClient={supabaseClient}
        />
      )}
    </>
  );
};

export default SheetDetailView;
