import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Calendar as CalendarIcon } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { formatDateBR } from '../../lib/contractUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';

interface ContractEmployee {
  id: string;
  position: string;
  quantities: { [addendumNumber: number]: number };
}

interface AddendumInfo {
  number: number;
  date: string;
  isCurrent: boolean;
}

interface EmployeePosition {
  id: string;
  name: string;
}

interface ContractEmployeesProps {
  contractId: string;
  supabaseClient: SupabaseClient;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ContractEmployees({ contractId, supabaseClient, isExpanded = true, onToggleExpand }: ContractEmployeesProps) {
  const [employees, setEmployees] = useState<ContractEmployee[]>([]);
  const [addendums, setAddendums] = useState<AddendumInfo[]>([]);
  const [contractStartDate, setContractStartDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmployees, setEditedEmployees] = useState<ContractEmployee[]>([]);
  const [editedAddendums, setEditedAddendums] = useState<AddendumInfo[]>([]);
  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [showNewPositionModal, setShowNewPositionModal] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    loadPositions();
  }, [contractId]);

  const loadPositions = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('employee_positions')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      console.error('Error loading positions:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      setIsLoading(true);

      const { data: contractData, error: contractError } = await supabaseClient
        .from('contracts')
        .select('start_date')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;
      setContractStartDate(contractData.start_date);

      const { data: employeesData, error: employeesError } = await supabaseClient
        .from('contract_employees')
        .select('id, position')
        .eq('contract_id', contractId)
        .order('position');

      if (employeesError) throw employeesError;

      if (!employeesData || employeesData.length === 0) {
        setEmployees([]);
        setAddendums([{ number: 0, date: contractData.start_date, isCurrent: true }]);
        setIsLoading(false);
        return;
      }

      const employeeIds = employeesData.map(e => e.id);

      const { data: quantitiesData, error: quantitiesError } = await supabaseClient
        .from('contract_employee_quantities')
        .select('contract_employee_id, addendum_number, quantity, effective_date')
        .in('contract_employee_id', employeeIds);

      if (quantitiesError) throw quantitiesError;

      const addendumMap = new Map<number, string>();
      if (quantitiesData) {
        quantitiesData.forEach(q => {
          if (q.effective_date && !addendumMap.has(q.addendum_number)) {
            addendumMap.set(q.addendum_number, q.effective_date);
          }
        });
      }

      if (!addendumMap.has(0)) {
        addendumMap.set(0, contractData.start_date);
      }

      const addendumsList: AddendumInfo[] = Array.from(addendumMap.entries())
        .map(([number, date]) => ({ number, date, isCurrent: false }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (addendumsList.length > 0) {
        addendumsList[addendumsList.length - 1].isCurrent = true;
      }

      const employeesList: ContractEmployee[] = employeesData.map(emp => {
        const quantities: { [key: number]: number } = {};
        const empQuantities = quantitiesData?.filter(q => q.contract_employee_id === emp.id) || [];
        empQuantities.forEach(q => {
          quantities[q.addendum_number] = q.quantity;
        });
        return {
          id: emp.id,
          position: emp.position,
          quantities
        };
      });

      setEmployees(employeesList);
      setAddendums(addendumsList);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar colaboradores',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = () => {
    setEditedEmployees(JSON.parse(JSON.stringify(employees)));
    setEditedAddendums(JSON.parse(JSON.stringify(addendums)));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedEmployees([]);
    setEditedAddendums([]);
    setIsEditing(false);
  };

  const addEmployee = () => {
    const newEmployee: ContractEmployee = {
      id: `temp-${Date.now()}`,
      position: '',
      quantities: {}
    };
    editedAddendums.forEach(add => {
      newEmployee.quantities[add.number] = 0;
    });
    setEditedEmployees([...editedEmployees, newEmployee]);
  };

  const addAddendum = () => {
    const maxNumber = Math.max(...editedAddendums.map(a => a.number));
    const nextNumber = maxNumber + 1;
    const today = new Date().toISOString().split('T')[0];

    const updatedAddendums = editedAddendums.map(a => ({ ...a, isCurrent: false }));
    updatedAddendums.push({ number: nextNumber, date: today, isCurrent: true });
    updatedAddendums.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const updatedEmployees = editedEmployees.map(emp => ({
      ...emp,
      quantities: { ...emp.quantities, [nextNumber]: 0 }
    }));

    setEditedAddendums(updatedAddendums);
    setEditedEmployees(updatedEmployees);
  };

  const removeAddendum = (addendumNumber: number) => {
    if (addendumNumber === 0) {
      toast({
        title: 'Erro',
        description: 'Não é possível remover o aditivo Base',
        variant: 'destructive'
      });
      return;
    }

    const updatedAddendums = editedAddendums.filter(a => a.number !== addendumNumber);

    if (updatedAddendums.length > 0) {
      updatedAddendums.forEach((add, idx) => {
        add.isCurrent = idx === updatedAddendums.length - 1;
      });
    }

    const updatedEmployees = editedEmployees.map(emp => {
      const newQuantities = { ...emp.quantities };
      delete newQuantities[addendumNumber];
      return { ...emp, quantities: newQuantities };
    });

    setEditedAddendums(updatedAddendums);
    setEditedEmployees(updatedEmployees);
  };

  const removeEmployee = (index: number) => {
    const updated = [...editedEmployees];
    updated.splice(index, 1);
    setEditedEmployees(updated);
  };

  const updatePosition = (index: number, position: string) => {
    const updated = [...editedEmployees];
    updated[index].position = position;
    setEditedEmployees(updated);
  };

  const updateQuantity = (index: number, addendumNumber: number, quantity: number) => {
    const updated = [...editedEmployees];
    updated[index].quantities[addendumNumber] = quantity;
    setEditedEmployees(updated);
  };

  const addNewPosition = async () => {
    if (!newPositionName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome da função',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employee_positions')
        .insert({ name: newPositionName.trim() })
        .select()
        .single();

      if (error) throw error;

      setPositions([...positions, data]);
      setNewPositionName('');
      setShowNewPositionModal(false);

      toast({
        title: 'Sucesso',
        description: 'Função adicionada com sucesso'
      });
    } catch (error: any) {
      console.error('Error adding position:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar função',
        variant: 'destructive'
      });
    }
  };

  const updateAddendumDate = (addendumNumber: number, newDate: string) => {
    const updated = editedAddendums.map(add =>
      add.number === addendumNumber ? { ...add, date: newDate } : add
    );
    updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    updated.forEach((add, idx) => {
      add.isCurrent = idx === updated.length - 1;
    });

    setEditedAddendums(updated);
  };

  const saveChanges = async () => {
    try {
      for (const emp of editedEmployees) {
        if (!emp.position.trim()) {
          toast({
            title: 'Erro',
            description: 'Todas as funções devem ter um nome',
            variant: 'destructive'
          });
          return;
        }
      }

      for (const add of editedAddendums) {
        if (add.number > 0 && !add.date) {
          toast({
            title: 'Erro',
            description: 'Todos os aditivos devem ter uma data',
            variant: 'destructive'
          });
          return;
        }
      }

      const employeesToDelete = employees.filter(
        emp => !editedEmployees.find(e => e.id === emp.id)
      );

      for (const emp of employeesToDelete) {
        if (!emp.id.startsWith('temp-')) {
          await supabase
            .from('contract_employees')
            .delete()
            .eq('id', emp.id);
        }
      }

      for (const emp of editedEmployees) {
        let employeeId = emp.id;

        if (emp.id.startsWith('temp-')) {
          const { data, error } = await supabase
            .from('contract_employees')
            .insert({
              contract_id: contractId,
              position: emp.position
            })
            .select()
            .single();

          if (error) throw error;
          employeeId = data.id;
        } else {
          await supabase
            .from('contract_employees')
            .update({ position: emp.position })
            .eq('id', employeeId);
        }

        for (const [addendumNum, quantity] of Object.entries(emp.quantities)) {
          const addendumNumber = parseInt(addendumNum);
          const addendumInfo = editedAddendums.find(a => a.number === addendumNumber);
          const effectiveDate = addendumInfo?.date || contractStartDate;

          const { error } = await supabase
            .from('contract_employee_quantities')
            .upsert({
              contract_employee_id: employeeId,
              addendum_number: addendumNumber,
              quantity: quantity,
              effective_date: effectiveDate
            }, {
              onConflict: 'contract_employee_id,addendum_number'
            });

          if (error) throw error;
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Colaboradores salvos com sucesso'
      });

      setIsEditing(false);
      await loadEmployees();

      if (onToggleExpand) {
        onToggleExpand();
      }
    } catch (error: any) {
      console.error('Error saving employees:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar colaboradores',
        variant: 'destructive'
      });
    }
  };

  const calculateTotal = (addendumNumber: number) => {
    const list = isEditing ? editedEmployees : employees;
    return list.reduce((sum, emp) => sum + (emp.quantities[addendumNumber] || 0), 0);
  };

  const calculateCumulativeTotal = (addendumNumber: number) => {
    const list = isEditing ? editedEmployees : employees;
    const addendumList = isEditing ? editedAddendums : addendums;

    const relevantAddendums = addendumList
      .filter(a => a.number <= addendumNumber)
      .map(a => a.number);

    const totals: { [position: string]: number } = {};

    list.forEach(emp => {
      let lastQuantity = 0;
      relevantAddendums.forEach(addNum => {
        const qty = emp.quantities[addNum];
        if (qty !== undefined) {
          lastQuantity = qty;
        }
      });
      totals[emp.position] = lastQuantity;
    });

    return Object.values(totals).reduce((sum, qty) => sum + qty, 0);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  const displayEmployees = isEditing ? editedEmployees : employees;
  const displayAddendums = isEditing ? editedAddendums : addendums;

  const currentTotal = (() => {
    const currentAddendum = displayAddendums.find(a => a.isCurrent);
    return currentAddendum ? calculateCumulativeTotal(currentAddendum.number) : 0;
  })();

  if (!isExpanded && !isEditing) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900">Colaboradores</h4>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              {employees.length === 0 ? (
                <Button onClick={startEditing} size="sm" className="text-xs h-8">
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              ) : (
                <Button onClick={startEditing} size="sm" variant="outline" className="text-xs h-8">
                  Editar
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={addEmployee} size="sm" variant="outline" className="text-xs h-8">
                <Plus className="w-3 h-3 mr-1" />
                Função
              </Button>
              <Button onClick={addAddendum} size="sm" variant="outline" className="text-xs h-8">
                <Plus className="w-3 h-3 mr-1" />
                Aditivo
              </Button>
              <Button onClick={saveChanges} size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700">
                <Save className="w-3 h-3 mr-1" />
                Salvar
              </Button>
              <Button onClick={cancelEditing} size="sm" variant="outline" className="text-xs h-8">
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      {displayEmployees.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          Nenhum colaborador cadastrado. Clique em "Adicionar" para começar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {isEditing && <th className="px-3 py-2 text-left w-10"></th>}
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Função</th>
                {displayAddendums.map((addendum) => (
                  <th
                    key={addendum.number}
                    className={`px-3 py-2 text-center font-semibold w-32 ${
                      addendum.isCurrent ? 'bg-green-100 text-green-800' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 justify-center">
                        <span className="flex items-center gap-1">
                          {addendum.number === 0 ? 'Base' : `Aditivo ${addendum.number}`}
                          {addendum.isCurrent && <span className="text-xs">(Atual)</span>}
                        </span>
                        {isEditing && addendum.number > 0 && (
                          <button
                            onClick={() => removeAddendum(addendum.number)}
                            className="ml-1 text-red-600 hover:text-red-800"
                            title="Remover aditivo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {isEditing && addendum.number > 0 ? (
                        <input
                          type="date"
                          value={addendum.date}
                          onChange={(e) => updateAddendumDate(addendum.number, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs bg-white text-gray-700"
                        />
                      ) : (
                        <span className="text-xs flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {formatDateBR(addendum.date)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-semibold text-gray-700 w-24 bg-blue-50">Total Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayEmployees.map((emp, index) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  {isEditing && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeEmployee(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <select
                          value={emp.position}
                          onChange={(e) => updatePosition(index, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                        >
                          <option value="">Selecione uma função</option>
                          {[...positions].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map(pos => (
                            <option key={pos.id} value={pos.name}>{pos.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowNewPositionModal(true)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 flex items-center justify-center"
                          title="Adicionar nova função"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-medium">{emp.position}</span>
                    )}
                  </td>
                  {displayAddendums.map((addendum) => (
                    <td
                      key={addendum.number}
                      className={`px-3 py-2 text-center ${
                        addendum.isCurrent ? 'bg-green-50' : ''
                      }`}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          value={emp.quantities[addendum.number] ?? 0}
                          onChange={(e) => updateQuantity(index, addendum.number, parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        />
                      ) : (
                        <span className={`${addendum.isCurrent ? 'font-semibold text-green-700' : 'text-gray-700'}`}>
                          {emp.quantities[addendum.number] ?? 0}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center bg-blue-50">
                    <span className="font-bold text-blue-700">
                      {(() => {
                        const currentAddendum = displayAddendums.find(a => a.isCurrent);
                        if (!currentAddendum) return 0;

                        let lastQty = 0;
                        displayAddendums
                          .filter(a => a.number <= currentAddendum.number)
                          .forEach(a => {
                            const qty = emp.quantities[a.number];
                            if (qty !== undefined) lastQty = qty;
                          });
                        return lastQty;
                      })()}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                {isEditing && <td className="px-3 py-2"></td>}
                <td className="px-3 py-2 text-gray-900">Total por Momento</td>
                {displayAddendums.map((addendum) => (
                  <td
                    key={addendum.number}
                    className={`px-3 py-2 text-center ${
                      addendum.isCurrent ? 'bg-green-100 text-green-800' : 'text-gray-900'
                    }`}
                  >
                    {calculateTotal(addendum.number)}
                  </td>
                ))}
                <td className="px-3 py-2 text-center bg-blue-50">
                  <span className="font-bold text-blue-700">
                    {(() => {
                      const currentAddendum = displayAddendums.find(a => a.isCurrent);
                      return currentAddendum ? calculateCumulativeTotal(currentAddendum.number) : 0;
                    })()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showNewPositionModal} onOpenChange={setShowNewPositionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Função
              </label>
              <Input
                type="text"
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                placeholder="Ex: Vigilante desarmado 12x36 diurno"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addNewPosition();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewPositionModal(false);
                  setNewPositionName('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={addNewPosition}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
