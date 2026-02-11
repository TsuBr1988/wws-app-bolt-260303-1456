import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { FinRevenueTableRow } from '@/types/database';
import { DashboardService } from '@/services/dashboardService';

interface FinRevenueTableProps {
  data: FinRevenueTableRow[];
  months: { monthYm: string; monthLabel: string }[];
  onSave: (data: FinRevenueTableRow[]) => Promise<void>;
  loading: boolean;
}

export function FinRevenueTable({ data, months, onSave, loading }: FinRevenueTableProps) {
  const [tableData, setTableData] = useState<FinRevenueTableRow[]>(data);
  const [startMonthIndex, setStartMonthIndex] = useState(Math.max(0, months.length - 6));
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
      [key]: key === 'company' || key === 'contract_name' || key === 'type' ? value : Number(value) || 0,
    };
    setTableData(newData);
  };

  const handleAddRow = () => {
    setTableData([
      ...tableData,
      {
        company: 'WWS',
        contract_name: '',
        type: 'publico',
        budget_2025: 0,
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
            disabled={startMonthIndex >= months.length - 6}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleAddRow}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Contrato
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || loading}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Empresa</TableHead>
              <TableHead className="w-[200px]">Contrato</TableHead>
              <TableHead className="w-[120px]">Tipo</TableHead>
              <TableHead className="w-[180px]">Valor Orçado Total 2025</TableHead>
              {visibleMonths.map((month) => (
                <TableHead key={month.monthYm} className="text-center w-[150px]">
                  {month.monthLabel}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <select
                    value={row.company}
                    onChange={(e) => handleCellChange(rowIndex, 'company', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="WWS">WWS</option>
                    <option value="Worldwide">Worldwide</option>
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    value={row.contract_name}
                    onChange={(e) => handleCellChange(rowIndex, 'contract_name', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    value={row.type || 'publico'}
                    onChange={(e) => handleCellChange(rowIndex, 'type', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="publico">Público</option>
                    <option value="privado">Privado</option>
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.budget_2025 || 0}
                    onChange={(e) => handleCellChange(rowIndex, 'budget_2025', e.target.value)}
                    className="w-full"
                    min="0"
                    step="0.01"
                    placeholder="R$ 0,00"
                  />
                </TableCell>
                {visibleMonths.map((month) => (
                  <TableCell key={month.monthYm}>
                    <Input
                      type="number"
                      value={row[month.monthYm] || 0}
                      onChange={(e) => handleCellChange(rowIndex, month.monthYm, e.target.value)}
                      className="w-full"
                      min="0"
                      step="0.01"
                      placeholder="R$ 0,00"
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRow(rowIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
