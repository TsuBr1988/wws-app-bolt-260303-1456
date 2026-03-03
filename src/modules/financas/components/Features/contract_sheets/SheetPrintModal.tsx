import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ContractSheet, ContractSheetItem } from '../../../types';
import { formatCurrency } from '../../../utils';
import { SupabaseClient } from '@supabase/supabase-js';

interface SheetAddendum {
  id: string;
  sheet_id: string;
  addendum_number: number;
  effective_date: string;
  created_at: string;
  created_by: string | null;
  description: string | null;
}

interface SheetAddendumItem {
  id: string;
  addendum_id: string;
  category_code: string;
  category_name: string;
  budgeted_amount: number;
  client_name: string;
}

interface SheetPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: ContractSheet;
  supabaseClient: SupabaseClient | null;
}

interface CategoryRowData {
  categoryCode: string;
  categoryName: string;
  initialBudget: number;
  addendumValues: Record<number, number>;
}

export const SheetPrintModal: React.FC<SheetPrintModalProps> = ({
  isOpen,
  onClose,
  sheet,
  supabaseClient
}) => {
  const [addendums, setAddendums] = useState<SheetAddendum[]>([]);
  const [addendumItems, setAddendumItems] = useState<SheetAddendumItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !supabaseClient) return;
    loadAddendums();
  }, [isOpen, sheet.id, supabaseClient]);

  const loadAddendums = async () => {
    if (!supabaseClient) return;

    setLoading(true);
    try {
      const { data: addendumsData, error: addError } = await supabaseClient
        .from('contract_sheet_addendums')
        .select('*')
        .eq('sheet_id', sheet.id)
        .order('addendum_number', { ascending: true });

      if (addError) throw addError;

      const addendumIds = (addendumsData || []).map((a: any) => a.id);

      if (addendumIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabaseClient
          .from('contract_sheet_addendum_items')
          .select('*')
          .in('addendum_id', addendumIds);

        if (itemsError) throw itemsError;
        setAddendumItems(itemsData || []);
      } else {
        setAddendumItems([]);
      }

      setAddendums(addendumsData || []);
    } catch (error) {
      console.error('Error loading addendums:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTableData = (): CategoryRowData[] => {
    const categoryMap = new Map<string, CategoryRowData>();

    // Add initial budget items
    (sheet.items || []).forEach((item) => {
      if (item.budgeted_amount !== 0) {
        categoryMap.set(item.category_code, {
          categoryCode: item.category_code,
          categoryName: item.category_name,
          initialBudget: item.budgeted_amount,
          addendumValues: {}
        });
      }
    });

    // Add addendum values
    addendums.forEach((addendum) => {
      const items = addendumItems.filter(
        (item) => item.addendum_id === addendum.id
      );

      items.forEach((item) => {
        if (item.budgeted_amount !== 0) {
          if (!categoryMap.has(item.category_code)) {
            categoryMap.set(item.category_code, {
              categoryCode: item.category_code,
              categoryName: item.category_name,
              initialBudget: 0,
              addendumValues: {}
            });
          }

          const row = categoryMap.get(item.category_code)!;
          row.addendumValues[addendum.addendum_number] = item.budgeted_amount;
        }
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.categoryCode.localeCompare(b.categoryCode)
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const tableData = buildTableData();

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-table {
            page-break-inside: auto;
          }
          .print-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .print-table thead {
            display: table-header-group;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity no-print"
          onClick={onClose}
        />
        <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20 flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white no-print">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Imprimir Ficha de Contrato
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {sheet.client_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div id="print-content" className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Ficha de Contrato
              </h1>
              <h2 className="text-xl font-semibold text-slate-700 mb-4">
                {sheet.client_name}
              </h2>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div>
                  <span className="font-semibold">Início:</span>{' '}
                  {format(new Date(sheet.start_date), 'dd/MM/yyyy', {
                    locale: ptBR
                  })}
                </div>
                <div>
                  <span className="font-semibold">Fim:</span>{' '}
                  {format(new Date(sheet.end_date), 'dd/MM/yyyy', {
                    locale: ptBR
                  })}
                </div>
                {sheet.termination_date && (
                  <div className="text-rose-600 font-bold">
                    ENCERRADO em{' '}
                    {format(new Date(sheet.termination_date), 'dd/MM/yyyy', {
                      locale: ptBR
                    })}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">
                Carregando dados...
              </div>
            ) : tableData.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhuma categoria orçada encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="print-table w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-700">
                        Código
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-left font-bold text-slate-700">
                        Categoria
                      </th>
                      <th className="border border-slate-300 px-4 py-3 text-right font-bold text-slate-700">
                        Orçamento Inicial
                      </th>
                      {addendums.map((addendum) => (
                        <th
                          key={addendum.id}
                          className="border border-slate-300 px-4 py-3 text-right font-bold text-slate-700"
                        >
                          Aditivo {addendum.addendum_number}
                          <div className="text-xs font-normal text-slate-500 mt-1">
                            {format(
                              new Date(addendum.effective_date),
                              'dd/MM/yyyy',
                              { locale: ptBR }
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="border border-slate-300 px-4 py-3 text-right font-bold text-slate-700 bg-blue-50">
                        Total Atual
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => {
                      const currentValue = addendums.length > 0
                        ? (row.addendumValues[addendums[addendums.length - 1].addendum_number] || row.initialBudget)
                        : row.initialBudget;

                      return (
                        <tr
                          key={row.categoryCode}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                        >
                          <td className="border border-slate-300 px-4 py-2 font-mono text-xs text-slate-600">
                            {row.categoryCode}
                          </td>
                          <td className="border border-slate-300 px-4 py-2 text-slate-800">
                            {row.categoryName}
                          </td>
                          <td className="border border-slate-300 px-4 py-2 text-right font-semibold text-slate-900">
                            {formatCurrency(row.initialBudget)}
                          </td>
                          {addendums.map((addendum) => (
                            <td
                              key={addendum.id}
                              className="border border-slate-300 px-4 py-2 text-right font-semibold text-slate-900"
                            >
                              {row.addendumValues[addendum.addendum_number] !==
                              undefined
                                ? formatCurrency(
                                    row.addendumValues[addendum.addendum_number]
                                  )
                                : '-'}
                            </td>
                          ))}
                          <td className="border border-slate-300 px-4 py-2 text-right font-bold text-blue-900 bg-blue-50">
                            {formatCurrency(currentValue)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-200 font-bold">
                      <td
                        colSpan={2}
                        className="border border-slate-300 px-4 py-3 text-right text-slate-900"
                      >
                        TOTAL
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-right text-slate-900">
                        {formatCurrency(
                          tableData.reduce((sum, row) => sum + row.initialBudget, 0)
                        )}
                      </td>
                      {addendums.map((addendum) => {
                        const addendumTotal = tableData.reduce((sum, row) => {
                          const value = row.addendumValues[addendum.addendum_number];
                          return value !== undefined ? sum + value : sum;
                        }, 0);
                        return (
                          <td
                            key={addendum.id}
                            className="border border-slate-300 px-4 py-3 text-right text-slate-900"
                          >
                            {addendumTotal > 0 ? formatCurrency(addendumTotal) : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-slate-300 px-4 py-3 text-right text-blue-900 bg-blue-100">
                        {formatCurrency(
                          tableData.reduce((sum, row) => {
                            const currentValue = addendums.length > 0
                              ? (row.addendumValues[addendums[addendums.length - 1].addendum_number] || row.initialBudget)
                              : row.initialBudget;
                            return sum + currentValue;
                          }, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {addendums.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Histórico de Aditivos
                </h3>
                <div className="space-y-3">
                  {addendums.map((addendum) => (
                    <div
                      key={addendum.id}
                      className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900">
                          Aditivo {addendum.addendum_number}
                        </span>
                        <span className="text-sm text-slate-600">
                          Vigência:{' '}
                          {format(
                            new Date(addendum.effective_date),
                            'dd/MM/yyyy',
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      {addendum.description && (
                        <p className="text-sm text-slate-700">
                          {addendum.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 text-center">
              Impresso em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
