import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { SeveranceTableRow } from '@/types/database';
import { DashboardService } from '@/services/dashboardService';

interface SeveranceTableProps {
  data: SeveranceTableRow[];
  months: { monthYm: string; monthLabel: string }[];
  onSave: (data: SeveranceTableRow[], deletedRows: { company: string; contract_name: string }[]) => Promise<void>;
  loading: boolean;
}

export function SeveranceTable({ data, months, onSave, loading }: SeveranceTableProps) {
  const [tableData, setTableData] = useState<SeveranceTableRow[]>(data);
  const [deletedRows, setDeletedRows] = useState<{ company: string; contract_name: string }[]>([]);
  const [startMonthIndex, setStartMonthIndex] = useState(Math.max(0, months.length - 2));
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<{ name: string; company: string; tipo: string; cidade: string }[]>([]);

  useEffect(() => {
    setTableData(data);
    setDeletedRows([]);
  }, [data]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await DashboardService.getClients();
        setClients(clientsData.map(c => ({
          name: c.name,
          company: c.company || 'WWS',
          tipo: c.tipo || 'Privado',
          cidade: c.cidade || ''
        })));
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

    if (key === 'contract_name') {
      const selectedClient = clients.find(c => c.name === value);
      newData[rowIndex] = {
        ...newData[rowIndex],
        contract_name: value,
        company: selectedClient?.company || 'WWS',
        tipo: selectedClient?.tipo || 'Privado',
        cidade: selectedClient?.cidade || ''
      };
    } else {
      newData[rowIndex] = {
        ...newData[rowIndex],
        [key]: key === 'company' || key === 'tipo' || key === 'cidade' ? value : Number(value) || 0,
      };
    }

    setTableData(newData);
  };

  const handleAddRow = () => {
    setTableData([
      ...tableData,
      {
        company: 'WWS',
        contract_name: '',
        tipo: 'Privado',
        cidade: ''
      },
    ]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const rowToDelete = tableData[rowIndex];
    if (rowToDelete.company && rowToDelete.contract_name) {
      setDeletedRows([...deletedRows, {
        company: rowToDelete.company,
        contract_name: rowToDelete.contract_name
      }]);
    }
    const newData = tableData.filter((_, index) => index !== rowIndex);
    setTableData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tableData, deletedRows);
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
              <TableHead className="w-[300px]">Contrato</TableHead>
              {visibleMonths.map((month) => (
                <TableHead key={month.monthYm} colSpan={2} className="text-center border-l">
                  {month.monthLabel}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
            <TableRow>
              <TableHead></TableHead>
              {visibleMonths.map((month) => (
                <Fragment key={month.monthYm}>
                  <TableHead className="text-center border-l w-[150px]">
                    Rescisão R$
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    Quantidade
                  </TableHead>
                </Fragment>
              ))}
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <select
                    value={row.contract_name}
                    onChange={(e) => handleCellChange(rowIndex, 'contract_name', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.name} value={client.name}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </TableCell>
                {visibleMonths.map((month) => (
                  <Fragment key={month.monthYm}>
                    <TableCell className="border-l">
                      <Input
                        type="number"
                        value={row[`${month.monthYm}_amount`] || 0}
                        onChange={(e) =>
                          handleCellChange(rowIndex, `${month.monthYm}_amount`, e.target.value)
                        }
                        className="w-full"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row[`${month.monthYm}_qty`] || 0}
                        onChange={(e) =>
                          handleCellChange(rowIndex, `${month.monthYm}_qty`, e.target.value)
                        }
                        className="w-full"
                        min="0"
                      />
                    </TableCell>
                  </Fragment>
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
