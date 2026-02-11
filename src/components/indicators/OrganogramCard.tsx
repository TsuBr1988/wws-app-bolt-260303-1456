import { useState, useEffect } from 'react';
import { IndicatorCard } from '@/components/dashboard/IndicatorCard';
import { DashboardService } from '@/services/dashboardService';
import { HrOrganogram, Department } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, User, Mail, Phone, Building2, Users, ChevronDown, ChevronRight, Network } from 'lucide-react';

interface OrganogramNode extends HrOrganogram {
  children: OrganogramNode[];
}

interface DepartmentNode extends Department {
  children: DepartmentNode[];
  employeeCount: number;
}

export function OrganogramCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HrOrganogram[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [treeData, setTreeData] = useState<OrganogramNode[]>([]);
  const [departmentTree, setDepartmentTree] = useState<DepartmentNode[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<HrOrganogram | null>(null);
  const [viewMode, setViewMode] = useState<'people' | 'department' | 'tree'>('people');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee_name: '',
    position: '',
    parent_id: '',
    level: 0,
    department_id: '',
    email: '',
    phone: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [peopleData, deptData] = await Promise.all([
        DashboardService.getHrOrganogram(),
        DashboardService.getDepartments()
      ]);
      setData(peopleData);
      setDepartments(deptData);
      buildTree(peopleData);
      buildDepartmentTree(deptData, peopleData);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar o organograma.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (nodes: HrOrganogram[]) => {
    const nodeMap = new Map<string, OrganogramNode>();

    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    const roots: OrganogramNode[] = [];

    nodes.forEach(node => {
      const currentNode = nodeMap.get(node.id)!;

      if (node.parent_id) {
        const parent = nodeMap.get(node.parent_id);
        if (parent) {
          parent.children.push(currentNode);
        } else {
          roots.push(currentNode);
        }
      } else {
        roots.push(currentNode);
      }
    });

    setTreeData(roots);
  };

  const buildDepartmentTree = (depts: Department[], people: HrOrganogram[]) => {
    const deptMap = new Map<string, DepartmentNode>();

    depts.forEach(dept => {
      const employeeCount = people.filter(p => p.department_id === dept.id).length;
      deptMap.set(dept.id, { ...dept, children: [], employeeCount });
    });

    const roots: DepartmentNode[] = [];

    depts.forEach(dept => {
      const currentNode = deptMap.get(dept.id)!;

      if (dept.parent_id) {
        const parent = deptMap.get(dept.parent_id);
        if (parent) {
          parent.children.push(currentNode);
        } else {
          roots.push(currentNode);
        }
      } else {
        roots.push(currentNode);
      }
    });

    setDepartmentTree(roots);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (node?: HrOrganogram, parentNode?: HrOrganogram) => {
    if (node) {
      setEditingNode(node);
      setFormData({
        employee_name: node.employee_name,
        position: node.position,
        parent_id: node.parent_id || '',
        level: node.level,
        department_id: node.department_id || '',
        email: node.email || '',
        phone: node.phone || '',
      });
    } else if (parentNode) {
      setEditingNode(null);
      setFormData({
        employee_name: '',
        position: '',
        parent_id: parentNode.id,
        level: parentNode.level + 1,
        department_id: parentNode.department_id || '',
        email: '',
        phone: '',
      });
    } else {
      setEditingNode(null);
      setFormData({
        employee_name: '',
        position: '',
        parent_id: '',
        level: 0,
        department_id: '',
        email: '',
        phone: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const record: Omit<HrOrganogram, 'created_at' | 'updated_at'> = {
        id: editingNode?.id || crypto.randomUUID(),
        employee_name: formData.employee_name,
        position: formData.position,
        parent_id: formData.parent_id || null,
        level: Number(formData.level),
        department: departments.find(d => d.id === formData.department_id)?.name || null,
        department_id: formData.department_id || null,
        email: formData.email || null,
        phone: formData.phone || null,
      };

      await DashboardService.upsertHrOrganogram(record);
      await loadData();
      setIsDialogOpen(false);

      toast({
        title: 'Sucesso',
        description: editingNode ? 'Registro atualizado com sucesso.' : 'Registro adicionado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o registro.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item? Todos os subordinados também serão removidos.')) {
      return;
    }

    try {
      await DashboardService.deleteHrOrganogram(id);
      await loadData();

      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      });
    }
  };

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderPersonNode = (node: OrganogramNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const leftOffset = depth * 40;

    return (
      <div key={node.id} className="relative">
        <div
          className="mb-3 md:mb-4 p-2 md:p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          style={{ marginLeft: `${leftOffset}px` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 flex-wrap">
                {hasChildren && (
                  <button
                    onClick={() => toggleCollapse(node.id)}
                    className="p-0.5 md:p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                    )}
                  </button>
                )}
                <User className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                <h3 className="font-semibold text-xs md:text-lg text-gray-900">{node.employee_name}</h3>
                {hasChildren && (
                  <span className="text-[10px] md:text-xs text-gray-500">
                    ({node.children.length} {node.children.length === 1 ? 'subordinado' : 'subordinados'})
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm font-medium text-blue-600 mb-1 md:mb-2">{node.position}</p>

              {node.department && (
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                  <Building2 className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span>{node.department}</span>
                </div>
              )}

              {node.email && (
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                  <Mail className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="break-all">{node.email}</span>
                </div>
              )}

              {node.phone && (
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600">
                  <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span>{node.phone}</span>
                </div>
              )}
            </div>

            <div className="flex gap-1 md:gap-2 ml-2 md:ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDialog(undefined, node)}
                title="Adicionar subordinado"
                className="h-7 w-7 md:h-9 md:w-9 p-0"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDialog(node)}
                title="Editar"
                className="h-7 w-7 md:h-9 md:w-9 p-0"
              >
                <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(node.id)}
                title="Excluir"
                className="h-7 w-7 md:h-9 md:w-9 p-0"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="border-l-2 border-gray-300 ml-4 md:ml-6 pl-2 md:pl-4">
            {node.children.map((child) => renderPersonNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderDepartmentNode = (node: DepartmentNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const leftOffset = depth * 40;

    return (
      <div key={node.id} className="relative">
        <div
          className="mb-3 md:mb-4 p-2 md:p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          style={{ marginLeft: `${leftOffset}px` }}
          onClick={() => setSelectedDepartmentId(node.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <Building2 className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-700 flex-shrink-0" />
                <h3 className="font-semibold text-xs md:text-lg text-gray-900">{node.name}</h3>
              </div>

              {node.description && (
                <p className="text-xs md:text-sm text-gray-700 mb-1 md:mb-2">{node.description}</p>
              )}

              <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600">
                <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span>{node.employeeCount} funcionários</span>
              </div>

              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">Nível: {node.level}</div>
            </div>
          </div>
        </div>

        {hasChildren && (
          <div className="border-l-2 border-blue-300 ml-4 md:ml-6 pl-2 md:pl-4">
            {node.children.map((child) => renderDepartmentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTreeNodeCard = (node: OrganogramNode): JSX.Element => {
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-52 p-3 bg-white border-2 border-blue-300 rounded-lg shadow-md hover:shadow-xl transition-all hover:border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <h3 className="font-semibold text-sm text-gray-900 leading-tight truncate">
                {node.employee_name}
              </h3>
            </div>
            <p className="text-xs font-medium text-blue-600 mb-2 truncate">
              {node.position}
            </p>

            {node.department && (
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{node.department}</span>
              </div>
            )}

            {hasChildren && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                <Users className="h-3 w-3" />
                <span>{node.children.length} subordinado{node.children.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="flex gap-1 mt-2 pt-2 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDialog(undefined, node)}
                title="Adicionar subordinado"
                className="flex-1 h-7 text-xs"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDialog(node)}
                title="Editar"
                className="h-7 w-7 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(node.id)}
                title="Excluir"
                className="h-7 w-7 p-0"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>

          {hasChildren && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-8 bg-blue-300"></div>
          )}
        </div>

        {hasChildren && (
          <div className="relative mt-8">
            <div className="flex gap-8 justify-center items-start">
              {node.children.map((child, index) => (
                <div key={child.id} className="relative">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-blue-300"></div>
                  {node.children.length > 1 && (
                    <>
                      {index === 0 && (
                        <div
                          className="absolute bottom-full left-1/2 w-full h-0.5 bg-blue-300"
                          style={{
                            right: '50%',
                            left: '50%',
                            width: `${(node.children.length - 1) * 4}rem`
                          }}
                        ></div>
                      )}
                    </>
                  )}
                  {renderTreeNodeCard(child)}
                </div>
              ))}
            </div>
            {node.children.length > 1 && (
              <div
                className="absolute bottom-full left-0 right-0 h-0.5 bg-blue-300"
                style={{
                  top: '-32px',
                  left: `calc(${(1 / node.children.length / 2) * 100}%)`,
                  right: `calc(${(1 / node.children.length / 2) * 100}%)`,
                }}
              ></div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTreeView = () => {
    if (treeData.length === 0) {
      return (
        <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-500">
          Nenhuma posição cadastrada.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto pb-8">
        <div className="inline-flex flex-col items-center min-w-full p-8">
          {treeData.map(node => renderTreeNodeCard(node))}
        </div>
      </div>
    );
  };

  const renderDepartmentDetail = () => {
    if (!selectedDepartmentId) return null;

    const department = departments.find(d => d.id === selectedDepartmentId);
    if (!department) return null;

    const deptEmployees = data.filter(p => p.department_id === selectedDepartmentId);
    const employeeMap = new Map<string, OrganogramNode>();

    deptEmployees.forEach(emp => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    const roots: OrganogramNode[] = [];

    deptEmployees.forEach(emp => {
      const currentNode = employeeMap.get(emp.id)!;

      if (emp.parent_id && employeeMap.has(emp.parent_id)) {
        const parent = employeeMap.get(emp.parent_id)!;
        parent.children.push(currentNode);
      } else {
        roots.push(currentNode);
      }
    });

    return (
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-xl font-semibold text-gray-900">{department.name}</h3>
            {department.description && (
              <p className="text-xs md:text-sm text-gray-600">{department.description}</p>
            )}
          </div>
          <Button variant="outline" onClick={() => setSelectedDepartmentId(null)} size="sm">
            Voltar
          </Button>
        </div>

        {roots.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-500">
            Nenhum funcionário neste departamento.
          </div>
        ) : (
          <div className="space-y-2 md:space-y-4">
            {roots.map((node) => renderPersonNode(node))}
          </div>
        )}
      </div>
    );
  };

  return (
    <IndicatorCard
        title="Organograma"
        subtitle="Estrutura organizacional da empresa"
        accentColor="#9B59B6"
        defaultExpanded={true}
      >
      <div className="space-y-3 md:space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'people' | 'department' | 'tree')}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="people" className="text-xs md:text-sm">Lista</TabsTrigger>
              <TabsTrigger value="tree" className="text-xs md:text-sm">Árvore</TabsTrigger>
              <TabsTrigger value="department" className="text-xs md:text-sm">Departamentos</TabsTrigger>
            </TabsList>
          </Tabs>

          {(viewMode === 'people' || viewMode === 'tree') && (
            <Button onClick={() => handleOpenDialog()} size="sm" className="text-xs md:text-sm">
              <Plus className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Adicionar Posição</span>
            </Button>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingNode ? 'Editar Posição' : 'Adicionar Posição'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Funcionário</label>
                <Input
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cargo</label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Diretor, Gerente, Coordenador"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Superior Hierárquico</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">Nenhum (Posição Raiz)</option>
                  {data
                    .filter(node => node.id !== editingNode?.id)
                    .map(node => (
                      <option key={node.id} value={node.id}>
                        {node.employee_name} - {node.position}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Departamento</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Selecione um departamento</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
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
                  placeholder="0 = CEO, 1 = Diretoria, etc"
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
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

        {loading ? (
          <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-500">Carregando organograma...</div>
        ) : (
          <>
            {viewMode === 'people' && (
              treeData.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-500">
                  Nenhuma posição cadastrada. Clique em &quot;Adicionar Posição&quot; para começar.
                </div>
              ) : (
                <div className="space-y-2 md:space-y-4 overflow-x-auto">
                  {treeData.map((node) => renderPersonNode(node))}
                </div>
              )
            )}

            {viewMode === 'tree' && renderTreeView()}

            {viewMode === 'department' && (
              selectedDepartmentId ? (
                renderDepartmentDetail()
              ) : departmentTree.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-sm md:text-base text-gray-500">
                  Nenhum departamento cadastrado. Vá em Configurações para cadastrar departamentos.
                </div>
              ) : (
                <div className="space-y-2 md:space-y-4 overflow-x-auto">
                  <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
                    Clique em um departamento para ver seu organograma
                  </p>
                  {departmentTree.map((node) => renderDepartmentNode(node))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </IndicatorCard>
  );
}
