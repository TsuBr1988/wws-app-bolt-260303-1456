import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { SupervisorVisitsTableRow } from '@/types/database';

interface SupervisorVisitsTableProps {
  data: SupervisorVisitsTableRow[];
  months: { monthYm: string; monthLabel: string }[];
  onSave: (data: SupervisorVisitsTableRow[], deletedRows: SupervisorVisitsTableRow[]) => Promise<void>;
  loading: boolean;
}

export function SupervisorVisitsTable({ data, months, onSave, loading }: SupervisorVisitsTableProps) {
  const [tableData, setTableData] = useState<SupervisorVisitsTableRow[]>(data);
  const [deletedRows, setDeletedRows] = useState<SupervisorVisitsTableRow[]>([]);
  const [startMonthIndex, setStartMonthIndex] = useState(Math.max(0, months.length - 6));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTableData(data);
    setDeletedRows([]);
  }, [data]);

  const visibleMonths = months.slice(startMonthIndex, startMonthIndex + 6);

  const handlePrevious = () => {
    if (startMonthIndex > 0) {
      setStartMonthIndex(startMonthIndex - 1);
    }
  };

  const handleNext = () => {
    if (startMonthIndex < months.length - 6) {
      setStartMonthIndex(startMonthIndex + 1);
    }
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...tableData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [key]: key === 'company' || key === 'supervisor_name' ? value : Number(value) || 0,
    };
    setTableData(newData);
  };

  const handleAddRow = () => {
    setTableData([
      ...tableData,
      {
        company: 'WWS',
        supervisor_name: '',
      },
    ]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const rowToDelete = tableData[rowIndex];
    if (rowToDelete.supervisor_name && rowToDelete.supervisor_name.trim() !== '') {
      setDeletedRows([...deletedRows, rowToDelete]);
    }
    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tableData, deletedRows);
      setDeletedRows([]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Visitas Supervisor
          </h3>
          <span className="text-sm text-gray-500">
            {tableData.length} registros
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevious}
              disabled={startMonthIndex === 0}
              className="h-7 w-7 p-0 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </Button>
            <span className="text-xs text-gray-600 font-medium min-w-[140px] text-center">
              {visibleMonths[0]?.monthLabel} - {visibleMonths[visibleMonths.length - 1]?.monthLabel}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNext}
              disabled={startMonthIndex >= months.length - 6}
              className="h-7 w-7 p-0 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddRow}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Supervisor
                </th>
                {visibleMonths.map((month) => (
                  <th key={month.monthYm} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {month.monthLabel}
                  </th>
                ))}
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <select
                      value={row.company}
                      onChange={(e) => handleCellChange(rowIndex, 'company', e.target.value)}
                      className="text-sm font-medium bg-transparent border-0 focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    >
                      <option value="WWS">WWS</option>
                      <option value="Worldwide">Worldwide</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <Input
                      type="text"
                      value={row.supervisor_name}
                      onChange={(e) => handleCellChange(rowIndex, 'supervisor_name', e.target.value)}
                      className="text-sm text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Nome do supervisor"
                    />
                  </td>
                  {visibleMonths.map((month) => (
                    <td key={month.monthYm} className="px-4 py-4 text-right">
                      <Input
                        type="number"
                        value={row[month.monthYm] || 0}
                        onChange={(e) => handleCellChange(rowIndex, month.monthYm, e.target.value)}
                        className="text-sm text-right font-medium text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        min="0"
                        step="1"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
