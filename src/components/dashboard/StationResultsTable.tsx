import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { StationResultsTableRow } from '@/types/database';
import { DashboardService } from '@/services/dashboardService';

interface StationResultsTableProps {
  data: StationResultsTableRow[];
  months: { monthYm: string; monthLabel: string }[];
  onSave: (data: StationResultsTableRow[]) => Promise<void>;
  loading: boolean;
  selectedContracts: string[];
  companyFilter: 'todas' | 'WWS' | 'Worldwide';
  tipoFilter: 'todos' | 'Público' | 'Privado';
  cidadeFilter: string;
}

export function StationResultsTable({ data, months, onSave, loading, selectedContracts, companyFilter, tipoFilter, cidadeFilter }: StationResultsTableProps) {
  const [tableData, setTableData] = useState<StationResultsTableRow[]>(data);
  const [startMonthIndex, setStartMonthIndex] = useState(Math.max(0, months.length - 1));
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<{ name: string; company?: string; tipo?: string; cidade?: string }[]>([]);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await DashboardService.getClients();
        setClients(data);
      } catch (error) {
        console.error('Failed to load clients:', error);
      }
    };
    loadClients();
  }, []);

  const visibleMonths = months.slice(startMonthIndex, startMonthIndex + 1);

  const filteredTableData = tableData.filter((row) => {
    const client = clients.find(c => c.name === row.contract_name);

    if (companyFilter !== 'todas' && (!client || client.company !== companyFilter)) {
      return false;
    }

    if (tipoFilter !== 'todos' && (!client || client.tipo !== tipoFilter)) {
      return false;
    }

    if (cidadeFilter !== 'todas' && (!client || client.cidade !== cidadeFilter)) {
      return false;
    }

    const contractMatch = selectedContracts.length === 0 || selectedContracts.includes(row.contract_name);
    return contractMatch;
  });

  const handlePrevious = () => {
    if (startMonthIndex > 0) {
      setStartMonthIndex(startMonthIndex - 1);
    }
  };

  const handleNext = () => {
    if (startMonthIndex < months.length - 1) {
      setStartMonthIndex(startMonthIndex + 1);
    }
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...tableData];

    if (key === 'contract_name') {
      newData[rowIndex] = {
        ...newData[rowIndex],
        [key]: value,
      };
    } else {
      newData[rowIndex] = {
        ...newData[rowIndex],
        [key]: value,
      };
    }

    setTableData(newData);
  };

  const handleCellBlur = (rowIndex: number, key: string) => {
    const newData = [...tableData];
    const value = newData[rowIndex][key];

    if (typeof value === 'string' && key !== 'contract_name') {
      const cleanValue = value.replace(/\./g, '').replace(',', '.');
      const numValue = parseFloat(cleanValue) || 0;
      newData[rowIndex] = {
        ...newData[rowIndex],
        [key]: numValue,
      };
      setTableData(newData);
    }

    setEditingCell(null);
  };

  const getCellValue = (row: StationResultsTableRow, key: string) => {
    const cellId = `${tableData.indexOf(row)}-${key}`;
    const value = row[key];

    if (editingCell === cellId) {
      return typeof value === 'number' ? value.toString().replace('.', ',') : (value || '');
    }

    return typeof value === 'number' ? formatNumber(value) : (value || '0,00');
  };

  const formatNumber = (value: number | string | undefined) => {
    if (!value) return '0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAddRow = () => {
    setTableData([
      ...tableData,
      {
        contract_name: '',
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
      const normalizedData = tableData.map(row => {
        const normalizedRow = { ...row };

        Object.keys(normalizedRow).forEach(key => {
          if (key !== 'contract_name' && key !== 'id') {
            const value = normalizedRow[key];
            if (typeof value === 'string') {
              const cleanValue = value.replace(/\./g, '').replace(',', '.');
              normalizedRow[key] = parseFloat(cleanValue) || 0;
            }
          }
        });

        return normalizedRow;
      });

      await onSave(normalizedData);
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
            {visibleMonths[0]?.monthLabel}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={startMonthIndex >= months.length - 1}
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
              <TableHead className="w-[250px]" rowSpan={3}>Contrato</TableHead>
              {visibleMonths.map((month) => (
                <TableHead key={month.monthYm} colSpan={10} className="text-center border-l bg-gray-50">
                  {month.monthLabel}
                </TableHead>
              ))}
              <TableHead className="w-[50px]" rowSpan={3}></TableHead>
            </TableRow>
            <TableRow>
              {visibleMonths.map((month) => (
                <>
                  <TableHead key={`${month.monthYm}-revenue-group`} colSpan={2} className="text-center border-l bg-blue-50">
                    Faturamento Bruto
                  </TableHead>
                  <TableHead key={`${month.monthYm}-net-revenue-group`} colSpan={2} className="text-center bg-purple-50">
                    Faturamento Líquido
                  </TableHead>
                  <TableHead key={`${month.monthYm}-payroll-group`} colSpan={2} className="text-center bg-orange-50">
                    Folha + FT
                  </TableHead>
                  <TableHead key={`${month.monthYm}-csv-group`} colSpan={2} className="text-center bg-yellow-50">
                    CSV + Reversão Impostos
                  </TableHead>
                  <TableHead key={`${month.monthYm}-margin-group`} colSpan={2} className="text-center bg-green-50">
                    Margem Contrib.
                  </TableHead>
                </>
              ))}
            </TableRow>
            <TableRow>
              {visibleMonths.map((month) => (
                <>
                  <TableHead key={`${month.monthYm}-forecast-revenue`} className="text-center w-[120px] border-l text-xs bg-blue-50">
                    Previsto
                  </TableHead>
                  <TableHead key={`${month.monthYm}-actual-revenue`} className="text-center w-[120px] text-xs bg-blue-50">
                    Realizado
                  </TableHead>
                  <TableHead key={`${month.monthYm}-forecast-net-revenue`} className="text-center w-[120px] text-xs bg-purple-50">
                    Previsto
                  </TableHead>
                  <TableHead key={`${month.monthYm}-actual-net-revenue`} className="text-center w-[120px] text-xs bg-purple-50">
                    Realizado
                  </TableHead>
                  <TableHead key={`${month.monthYm}-forecast-payroll`} className="text-center w-[120px] text-xs bg-orange-50">
                    Previsto
                  </TableHead>
                  <TableHead key={`${month.monthYm}-actual-payroll`} className="text-center w-[120px] text-xs bg-orange-50">
                    Realizado
                  </TableHead>
                  <TableHead key={`${month.monthYm}-forecast-csv`} className="text-center w-[120px] text-xs bg-yellow-50">
                    Previsto
                  </TableHead>
                  <TableHead key={`${month.monthYm}-actual-csv`} className="text-center w-[120px] text-xs bg-yellow-50">
                    Realizado
                  </TableHead>
                  <TableHead key={`${month.monthYm}-forecast-margin`} className="text-center w-[120px] text-xs bg-green-50">
                    Previsto
                  </TableHead>
                  <TableHead key={`${month.monthYm}-actual-margin`} className="text-center w-[120px] text-xs bg-green-50">
                    Realizado
                  </TableHead>
                </>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTableData.map((row, rowIndex) => {
              const actualIndex = tableData.findIndex(
                r => r.contract_name === row.contract_name
              );
              return (
              <TableRow key={rowIndex}>
                <TableCell className="font-medium">
                  <select
                    value={row.contract_name}
                    onChange={(e) => handleCellChange(actualIndex, 'contract_name', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
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
                  <>
                    <TableCell key={`${month.monthYm}-forecast-revenue`} className="border-l bg-blue-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_forecast_revenue`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_forecast_revenue`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_forecast_revenue`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_forecast_revenue`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-actual-revenue`} className="bg-blue-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_revenue`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_revenue`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_revenue`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_revenue`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-forecast-net-revenue`} className="bg-purple-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_forecast_net_revenue`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_forecast_net_revenue`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_forecast_net_revenue`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_forecast_net_revenue`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-actual-net-revenue`} className="bg-purple-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_net_revenue`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_net_revenue`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_net_revenue`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_net_revenue`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-forecast-payroll`} className="bg-orange-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_forecast_payroll_ft`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_forecast_payroll_ft`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_forecast_payroll_ft`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_forecast_payroll_ft`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-actual-payroll`} className="bg-orange-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_payroll_ft`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_payroll_ft`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_payroll_ft`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_payroll_ft`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-forecast-csv`} className="bg-yellow-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_forecast_csv_total`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_forecast_csv_total`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_forecast_csv_total`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_forecast_csv_total`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-actual-csv`} className="bg-yellow-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_csv_total`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_csv_total`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_csv_total`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_csv_total`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-forecast-margin`} className="bg-green-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_forecast_contribution_margin`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_forecast_contribution_margin`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_forecast_contribution_margin`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_forecast_contribution_margin`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                    <TableCell key={`${month.monthYm}-actual-margin`} className="bg-green-50/30">
                      <Input
                        type="text"
                        value={getCellValue(row, `${month.monthYm}_contribution_margin`)}
                        onChange={(e) => handleCellChange(actualIndex, `${month.monthYm}_contribution_margin`, e.target.value)}
                        onFocus={() => setEditingCell(`${actualIndex}-${month.monthYm}_contribution_margin`)}
                        onBlur={() => handleCellBlur(actualIndex, `${month.monthYm}_contribution_margin`)}
                        className="w-full text-right text-sm"
                        placeholder="0,00"
                      />
                    </TableCell>
                  </>
                ))}
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRow(actualIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
