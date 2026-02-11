import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import { ContractTableRow } from '@/types/database';
import { DashboardService } from '@/services/dashboardService';

interface ContractTableProps {
  data: ContractTableRow[];
  months: { monthYm: string; monthLabel: string }[];
  onSave: (data: ContractTableRow[]) => Promise<void>;
  loading: boolean;
  showInactive?: boolean;
  onToggleInactive?: () => void;
  onEditManualContract?: (contractId: string) => void;
  onDeleteManualContract?: (contractId: string) => void;
}

export function ContractTable({
  data,
  months,
  onSave,
  loading,
  showInactive,
  onToggleInactive,
  onEditManualContract,
  onDeleteManualContract,
}: ContractTableProps) {
  const [tableData, setTableData] = useState<ContractTableRow[]>(data);
  const [startMonthIndex, setStartMonthIndex] = useState(Math.max(0, months.length - 2));
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<string[]>([]);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await DashboardService.getClients();
        setClients(data.map(c => c.name));
      } catch (error) {
        console.error('Failed to load clients:', error);
      }
    };
    loadClients();
  }, []);

  const visibleMonths = months.slice(startMonthIndex, startMonthIndex + 2);

  const handlePrevious = () => {
    if (startMonthIndex > 0) {
      setStartMonthIndex(startMonthIndex - 1);
    }
  };

  const handleNext = () => {
    if (startMonthIndex < months.length - 2) {
      setStartMonthIndex(startMonthIndex + 1);
    }
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...tableData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [key]: key === 'company' || key === 'contract_name' ? value : Number(value) || 0,
    };
    setTableData(newData);
  };

  const handleAddRow = () => {
    setTableData([
      ...tableData,
      {
        company: 'WWS',
        contract_name: '',
        contract_qty: 0,
      },
    ]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tableData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevious}
            disabled={startMonthIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {visibleMonths[0]?.monthLabel} - {visibleMonths[visibleMonths.length - 1]?.monthLabel}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={startMonthIndex >= months.length - 2}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {onToggleInactive && (
            <Button
              size="sm"
              variant={showInactive ? "default" : "outline"}
              onClick={onToggleInactive}
            >
              {showInactive ? 'Mostrar Ativos' : 'Mostrar Inativos'}
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving || loading}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Ações</TableHead>
              <TableHead className="w-[400px]">Contrato</TableHead>
              <TableHead className="w-[120px] text-center">Contrato (Qtd)</TableHead>
              {visibleMonths.map((month) => (
                <TableHead key={month.monthYm} colSpan={4} className="text-center border-l">
                  {month.monthLabel}
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
              {visibleMonths.map((month) => (
                <Fragment key={month.monthYm}>
                  <TableHead className="text-center border-l w-[120px]">
                    Fixos
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    Férias
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    Feiristas
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    Afastados
                  </TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={row.isManual ? 'bg-red-50 hover:bg-red-100' : ''}
              >
                <TableCell>
                  {row.isManual && row.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditManualContract?.(row.id!)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar contrato manual"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteManualContract?.(row.id!)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir contrato manual"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="px-2 py-1 text-sm">
                    {row.contract_name}
                    {row.isManual && (
                      <span className="ml-2 text-xs text-red-600 font-medium">
                        (Manual)
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="px-2 py-1 text-sm font-medium text-center">
                    {row.contract_qty || 0}
                  </div>
                </TableCell>
                {visibleMonths.map((month) => (
                  <Fragment key={month.monthYm}>
                    <TableCell className="border-l p-0">
                      <input
                        type="number"
                        value={row[`${month.monthYm}_fixos`] || 0}
                        onChange={(e) =>
                          handleCellChange(rowIndex, `${month.monthYm}_fixos`, e.target.value)
                        }
                        className="w-full h-full px-3 py-2 text-center text-sm border-0 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-0">
                      <input
                        type="number"
                        value={row[`${month.monthYm}_ferias`] || 0}
                        onChange={(e) =>
                          handleCellChange(rowIndex, `${month.monthYm}_ferias`, e.target.value)
                        }
                        className="w-full h-full px-3 py-2 text-center text-sm border-0 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-0">
                      <input
                        type="number"
                        value={row[`${month.monthYm}_feiristas`] || 0}
                        onChange={(e) =>
                          handleCellChange(rowIndex, `${month.monthYm}_feiristas`, e.target.value)
                        }
                        className="w-full h-full px-3 py-2 text-center text-sm border-0 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="p-0">
                      <input
                        type="number"
                        value={row[`${month.monthYm}_afastados`] || 0}
                        onChange={(e) =>
                          handleCellChange(rowIndex, `${month.monthYm}_afastados`, e.target.value)
                        }
                        className="w-full h-full px-3 py-2 text-center text-sm border-0 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-inset"
                        min="0"
                      />
                    </TableCell>
                  </Fragment>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
