import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Save, Trash2, X, Plus } from 'lucide-react';
import { formatMonthLabel } from '@/lib/months';

interface AdminExpenseRow {
  id: string;
  company: 'WWS' | 'Worldwide';
  department: string;
  [key: string]: string | number;
}

interface AdministrativeExpensesTableProps {
  data: AdminExpenseRow[];
  onSave: (data: AdminExpenseRow[]) => void;
  months: { monthYm: string; monthLabel: string }[];
}

export function AdministrativeExpensesTable({ data, onSave, months }: AdministrativeExpensesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminExpenseRow[]>(data);
  const [editedRow, setEditedRow] = useState<AdminExpenseRow | null>(null);

  useEffect(() => {
    setRows(data);
  }, [data]);

  const handleEdit = (row: AdminExpenseRow) => {
    setEditingId(row.id);
    setEditedRow({ ...row });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedRow(null);
  };

  const handleSave = () => {
    if (editedRow) {
      const newRows = rows.map((row) => (row.id === editingId ? editedRow : row));
      setRows(newRows);
      setEditingId(null);
      setEditedRow(null);
    }
  };

  const handleDelete = (id: string) => {
    const newRows = rows.filter((row) => row.id !== id);
    setRows(newRows);
  };

  const handleAddRow = () => {
    const newRow: AdminExpenseRow = {
      id: `new-${Date.now()}`,
      company: 'WWS',
      department: '',
      ...months.reduce((acc, month) => ({ ...acc, [month.monthYm]: 0 }), {}),
    };
    setRows([...rows, newRow]);
    setEditingId(newRow.id);
    setEditedRow(newRow);
  };

  const handleChange = (field: string, value: string | number) => {
    if (editedRow) {
      setEditedRow({ ...editedRow, [field]: value });
    }
  };

  const handleSaveAll = () => {
    onSave(rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={handleAddRow} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Linha
        </Button>
        <Button onClick={handleSaveAll} size="sm">
          <Save className="w-4 h-4 mr-2" />
          Salvar Todos
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Empresa</TableHead>
              <TableHead className="min-w-[200px]">Departamento</TableHead>
              {months.map((month) => (
                <TableHead key={month.monthYm} className="text-right min-w-[120px]">
                  {formatMonthLabel(month.monthYm)}
                </TableHead>
              ))}
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isEditing = editingId === row.id;
              const displayRow = isEditing && editedRow ? editedRow : row;

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {isEditing ? (
                      <select
                        value={displayRow.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="WWS">WWS</option>
                        <option value="Worldwide">Worldwide</option>
                      </select>
                    ) : (
                      displayRow.company
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={displayRow.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        placeholder="Nome do departamento"
                      />
                    ) : (
                      displayRow.department
                    )}
                  </TableCell>
                  {months.map((month) => (
                    <TableCell key={month.monthYm} className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={displayRow[month.monthYm] || 0}
                          onChange={(e) => handleChange(month.monthYm, parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      ) : (
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(displayRow[month.monthYm]) || 0)
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={handleSave}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
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
