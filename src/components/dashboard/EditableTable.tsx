import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Save, RotateCcw } from 'lucide-react';
import { EditableRowData } from '@/types/database';

interface Column {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'calculated';
  readonly?: boolean;
}

interface EditableTableProps {
  data: EditableRowData[];
  columns: Column[];
  onSave: (data: EditableRowData[]) => Promise<void>;
  loading?: boolean;
}

export function EditableTable({ data, columns, onSave, loading = false }: EditableTableProps) {
  const [editedData, setEditedData] = useState<EditableRowData[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditedData([...data]);
  }, [data]);

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...editedData];
    const column = columns.find(col => col.key === field);
    
    if (column?.type === 'number' || column?.type === 'currency') {
      // Allow empty string, validate on save
      const numericValue = value === '' ? '' : parseFloat(value.replace(',', '.'));
      newData[rowIndex] = {
        ...newData[rowIndex],
        [field]: isNaN(numericValue as number) ? 0 : numericValue
      };
    } else {
      newData[rowIndex] = {
        ...newData[rowIndex],
        [field]: value
      };
    }
    
    setEditedData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedData);
      toast({
        title: "Dados salvos",
        description: "Os dados foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = () => {
    setEditedData([...data]);
    toast({
      title: "Alterações revertidas",
      description: "Os dados foram restaurados para o estado original.",
    });
  };

  const hasChanges = JSON.stringify(data) !== JSON.stringify(editedData);

  const formatCellValue = (value: any, column: Column) => {
    if (column.type === 'currency' && typeof value === 'number') {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    if ((column.type === 'percentage' || column.type === 'calculated') && typeof value === 'number') {
      return (value * 100).toFixed(2) + '%';
    }
    return value?.toString() || '';
  };

  const parseCellValue = (value: string, column: Column) => {
    if (column.type === 'currency' || column.type === 'number') {
      return value.replace(/\./g, '').replace(',', '.');
    }
    return value;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-12 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end space-x-1.5 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRevert}
          disabled={!hasChanges || saving}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
        >
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Reverter</span>
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
        >
          <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar'}</span>
          <span className="sm:hidden">{saving ? '...' : 'OK'}</span>
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="bg-gray-50 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {editedData.map((row, rowIndex) => (
              <TableRow key={row.monthYm} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                {columns.map((column) => (
                  <TableCell key={column.key} className="px-2 sm:px-4 py-1.5 sm:py-2">
                    {column.readonly ? (
                      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                        {formatCellValue(row[column.key], column)}
                      </span>
                    ) : (
                      <Input
                        value={formatCellValue(row[column.key], column)}
                        onChange={(e) => {
                          const parsedValue = parseCellValue(e.target.value, column);
                          handleCellChange(rowIndex, column.key, parsedValue);
                        }}
                        type={column.type === 'number' || column.type === 'currency' ? 'text' : 'text'}
                        className="h-7 sm:h-8 text-xs sm:text-sm border-none bg-transparent focus:bg-white focus:border-blue-300 px-1 sm:px-2"
                        min={column.type === 'number' || column.type === 'currency' ? '0' : undefined}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}