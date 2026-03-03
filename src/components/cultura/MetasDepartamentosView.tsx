import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/databaseResolver';

const supabase = getDatabase('CULTURA');
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Save, X, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DepartmentGoal {
  id: string;
  department_name: string;
  goal_text: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function MetasDepartamentosView() {
  const { canEditIndicator } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<DepartmentGoal[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingGoals, setEditingGoals] = useState<DepartmentGoal[]>([]);
  const { toast } = useToast();

  const canEdit = canEditIndicator('cultura', 'Organograma Estratégico');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('department_goals')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setGoals(data || []);
      setEditingGoals(data || []);
    } catch (error) {
      console.error('Error loading department goals:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as metas dos departamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = () => {
    const newGoal: DepartmentGoal = {
      id: `temp-${Date.now()}`,
      department_name: '',
      goal_text: '',
      display_order: editingGoals.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEditingGoals([...editingGoals, newGoal]);
  };

  const handleUpdateGoal = (id: string, field: 'department_name' | 'goal_text', value: string) => {
    setEditingGoals(editingGoals.map(goal =>
      goal.id === id ? { ...goal, [field]: value } : goal
    ));
  };

  const handleRemoveGoal = (id: string) => {
    setEditingGoals(editingGoals.filter(goal => goal.id !== id));
  };

  const handleSave = async () => {
    try {
      const validGoals = editingGoals.filter(
        goal => goal.department_name.trim() && goal.goal_text.trim()
      );

      const goalsToDelete = goals.filter(
        goal => !editingGoals.find(eg => eg.id === goal.id)
      );

      for (const goal of goalsToDelete) {
        if (!goal.id.startsWith('temp-')) {
          const { error } = await supabase
            .from('department_goals')
            .delete()
            .eq('id', goal.id);
          if (error) throw error;
        }
      }

      for (let i = 0; i < validGoals.length; i++) {
        const goal = validGoals[i];
        const goalData = {
          department_name: goal.department_name,
          goal_text: goal.goal_text,
          display_order: i,
          updated_at: new Date().toISOString(),
        };

        if (goal.id.startsWith('temp-')) {
          const { error } = await supabase
            .from('department_goals')
            .insert([goalData]);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('department_goals')
            .update(goalData)
            .eq('id', goal.id);
          if (error) throw error;
        }
      }

      await loadGoals();
      setEditMode(false);

      toast({
        title: 'Sucesso',
        description: 'Metas dos departamentos salvas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving department goals:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as metas dos departamentos.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditingGoals(goals);
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Metas dos Departamentos</h3>
        {canEdit && !editMode && (
          <Button onClick={() => setEditMode(true)} size="sm">
            Editar
          </Button>
        )}
      </div>

      {editMode ? (
        <div className="space-y-6">
          <div className="space-y-4">
            {editingGoals.map((goal, index) => (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="pt-2 cursor-move">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Departamento
                      </label>
                      <input
                        type="text"
                        value={goal.department_name}
                        onChange={(e) => handleUpdateGoal(goal.id, 'department_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Ex: Comercial, RH, Operações..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta/Descrição
                      </label>
                      <textarea
                        value={goal.goal_text}
                        onChange={(e) => handleUpdateGoal(goal.id, 'goal_text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                        placeholder="Descreva a meta ou objetivo do departamento..."
                      />
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveGoal(goal.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleAddGoal}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Meta de Departamento
          </Button>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div key={goal.id} className="border border-gray-200 rounded-lg p-5 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  {goal.department_name}
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {goal.goal_text}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p>Nenhuma meta de departamento adicionada ainda.</p>
              {canEdit && (
                <p className="text-sm mt-2">Clique em &quot;Editar&quot; para adicionar metas.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
