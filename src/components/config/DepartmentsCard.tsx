import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardService } from '@/services/dashboardService';
import { Department } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function DepartmentsCard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    level: 0,
    description: '',
  });

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await DashboardService.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar departamentos',
        description: 'Não foi possível carregar a lista de departamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        parent_id: department.parent_id || '',
        level: department.level,
        description: department.description || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        parent_id: '',
        level: 0,
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do departamento é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const record: Omit<Department, 'created_at' | 'updated_at'> = {
        id: editingDepartment?.id || crypto.randomUUID(),
        name: formData.name,
        parent_id: formData.parent_id || null,
        level: Number(formData.level),
        description: formData.description || null,
      };

      await DashboardService.upsertDepartment(record);
      await loadDepartments();
      setIsDialogOpen(false);

      toast({
        title: 'Sucesso',
        description: editingDepartment ? 'Departamento atualizado com sucesso.' : 'Departamento adicionado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o departamento.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este departamento? Todos os subdepartamentos também serão removidos.')) {
      return;
    }

    try {
      await DashboardService.deleteDepartment(id);
      await loadDepartments();

      toast({
        title: 'Sucesso',
        description: 'Departamento excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o departamento.',
        variant: 'destructive',
      });
    }
  };

  const getDepartmentHierarchy = (dept: Department): string => {
    const parent = departments.find(d => d.id === dept.parent_id);
    if (parent) {
      return `${getDepartmentHierarchy(parent)} > ${dept.name}`;
    }
    return dept.name;
  };

  return (
    <Card className="p-6 bg-gray-50 border-gray-200">
      <div className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Departamentos</h3>
            <p className="text-sm text-gray-600 mt-1">
              {departments.length} {departments.length === 1 ? 'departamento cadastrado' : 'departamentos cadastrados'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-2">
            <Button onClick={() => handleOpenDialog()} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Departamento
            </Button>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando departamentos...</div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum departamento cadastrado
              </div>
            ) : (
              <div className="space-y-2">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{getDepartmentHierarchy(dept)}</div>
                      {dept.description && (
                        <div className="text-sm text-gray-600">{dept.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">Nível: {dept.level}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(dept)}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Editar Departamento' : 'Adicionar Departamento'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Departamento *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Recursos Humanos, Financeiro"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Departamento Superior</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">Nenhum (Departamento Raiz)</option>
                  {departments
                    .filter(dept => dept.id !== editingDepartment?.id)
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {getDepartmentHierarchy(dept)}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Nível Hierárquico</label>
                <Input
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                  placeholder="0 = Diretoria, 1 = Departamento, etc"
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição breve do departamento"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
