import { useState, useEffect } from 'react';
import { DashboardService } from '@/services/dashboardService';
import { BscItem } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface BscNode extends BscItem {
  children: BscNode[];
}

export default function BSCView() {
  const { canEditIndicator } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BscItem[]>([]);
  const [treeData, setTreeData] = useState<BscNode[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<BscItem | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const canEdit = canEditIndicator('BSC', 'Itens BSC');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    parent_id: '',
    level: 0,
    order_position: 0,
    is_kpi: false,
    meta: '',
    iniciativas: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const itemsResult = await DashboardService.getBscItems();
      setData(itemsResult);
      buildTree(itemsResult);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar o BSC.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (nodes: BscItem[]) => {
    const nodeMap = new Map<string, BscNode>();

    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    const roots: BscNode[] = [];

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

    roots.forEach(root => {
      sortChildren(root);
    });

    setTreeData(roots.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')));
  };

  const sortChildren = (node: BscNode) => {
    node.children.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    node.children.forEach(child => sortChildren(child));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const collectNodesWithChildren = (nodes: BscNode[]): string[] => {
      const nodeIds: string[] = [];
      nodes.forEach(node => {
        if (node.children.length > 0) {
          nodeIds.push(node.id);
          nodeIds.push(...collectNodesWithChildren(node.children));
        }
      });
      return nodeIds;
    };

    if (treeData.length > 0) {
      const nodesWithChildren = collectNodesWithChildren(treeData);
      setCollapsedNodes(new Set(nodesWithChildren));
    }
  }, [treeData]);

  const handleOpenDialog = (node?: BscItem, parentNode?: BscItem) => {
    if (node) {
      setEditingNode(node);
      setFormData({
        title: node.title,
        description: node.description || '',
        parent_id: node.parent_id || '',
        level: node.level,
        order_position: node.order_position,
        is_kpi: node.is_kpi || false,
        meta: node.meta || '',
        iniciativas: node.iniciativas || '',
      });
    } else if (parentNode) {
      setEditingNode(null);
      const childrenCount = data.filter(item => item.parent_id === parentNode.id).length;
      setFormData({
        title: '',
        description: '',
        parent_id: parentNode.id,
        level: parentNode.level + 1,
        order_position: childrenCount,
        is_kpi: false,
        meta: '',
        iniciativas: '',
      });
    } else {
      setEditingNode(null);
      setFormData({
        title: '',
        description: '',
        parent_id: '',
        level: 0,
        order_position: 0,
        is_kpi: false,
        meta: '',
        iniciativas: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Erro',
        description: 'O título é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const record: Omit<BscItem, 'created_at' | 'updated_at'> = {
        id: editingNode?.id || crypto.randomUUID(),
        title: formData.title,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        level: Number(formData.level),
        order_position: Number(formData.order_position),
        is_kpi: formData.is_kpi,
        meta: formData.is_kpi ? formData.meta || null : null,
        iniciativas: formData.is_kpi ? formData.iniciativas || null : null,
      };

      await DashboardService.upsertBscItem(record);
      await loadData();
      setIsDialogOpen(false);

      toast({
        title: 'Sucesso',
        description: editingNode ? 'Item atualizado com sucesso.' : 'Item adicionado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o item.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item? Todos os itens subordinados também serão removidos.')) {
      return;
    }

    try {
      await DashboardService.deleteBscItem(id);
      await loadData();

      toast({
        title: 'Sucesso',
        description: 'Item excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o item.',
        variant: 'destructive',
      });
    }
  };

  const getLevelColor = (level: number): string => {
    const colors = [
      'from-blue-50 to-blue-100 border-blue-400',
      'from-emerald-50 to-emerald-100 border-emerald-400',
      'from-amber-50 to-amber-100 border-amber-400',
      'from-rose-50 to-rose-100 border-rose-400',
      'from-cyan-50 to-cyan-100 border-cyan-400',
      'from-violet-50 to-violet-100 border-violet-400',
    ];
    return colors[level % colors.length];
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

  const renderNode = (node: BscNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);
    const leftOffset = depth * 40;
    const colorClass = getLevelColor(depth);

    return (
      <div key={node.id} className="relative">
        <div
          className={`mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-r ${colorClass} border-2 rounded-lg shadow-sm hover:shadow-md transition-shadow`}
          style={{ marginLeft: `${leftOffset}px` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
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
                <FileText className="h-3.5 w-3.5 md:h-5 md:w-5 text-gray-700 flex-shrink-0" />
                <h3 className="font-semibold text-sm md:text-lg text-gray-900">{node.title}</h3>
                {node.is_kpi && (
                  <span className="px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-semibold bg-blue-600 text-white rounded">
                    KPI
                  </span>
                )}
                {hasChildren && (
                  <span className="text-[10px] md:text-xs text-gray-500">
                    ({node.children.length} {node.children.length === 1 ? 'subitem' : 'subitens'})
                  </span>
                )}
              </div>

              {node.description && (
                <div className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap mt-1.5 md:mt-2">
                  {node.description}
                </div>
              )}

              {node.is_kpi && (
                <div className="mt-2 md:mt-3 space-y-1.5 md:space-y-2">
                  {node.meta && (
                    <div className="p-1.5 md:p-2 bg-white/50 rounded border border-gray-300">
                      <div className="text-[10px] md:text-xs font-semibold text-gray-700 mb-0.5 md:mb-1">Meta:</div>
                      <div className="text-xs md:text-sm text-gray-800 whitespace-pre-wrap">{node.meta}</div>
                    </div>
                  )}
                  {node.iniciativas && (
                    <div className="p-1.5 md:p-2 bg-white/50 rounded border border-gray-300">
                      <div className="text-[10px] md:text-xs font-semibold text-gray-700 mb-0.5 md:mb-1">Iniciativas:</div>
                      <div className="text-xs md:text-sm text-gray-800 whitespace-pre-wrap">{node.iniciativas}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-3 text-[10px] md:text-xs text-gray-500">
                <span>Nível: {node.level}</span>
                <span>Ordem: {node.order_position}</span>
              </div>
            </div>

            {canEdit && (
              <div className="flex gap-1 md:gap-2 ml-2 md:ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(undefined, node)}
                  title="Adicionar item filho"
                  className="h-7 w-7 md:h-9 md:w-9 p-0"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDialog(node)}
                  title="Editar item"
                  className="h-7 w-7 md:h-9 md:w-9 p-0"
                >
                  <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(node.id)}
                  title="Excluir item"
                  className="h-7 w-7 md:h-9 md:w-9 p-0"
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="border-l-2 border-gray-300 ml-4 md:ml-6 pl-2 md:pl-4">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">BSC - Balanced Scorecard</h3>
          {canEdit && (
            <Button
              onClick={() => handleOpenDialog()}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando BSC...</div>
        ) : treeData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum item cadastrado. Clique em &quot;Adicionar Item&quot; para começar a construir seu BSC.
          </div>
        ) : (
          <div className="space-y-4 overflow-x-auto">
            {treeData.map((node) => renderNode(node))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Editar Item' : 'Adicionar Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Perspectiva Financeira, Meta de Crescimento"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição/Conteúdo</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada, objetivos, métricas, etc."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Item Superior (Hierarquia)</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              >
                <option value="">Nenhum (Item Raiz)</option>
                {data
                  .filter(node => node.id !== editingNode?.id)
                  .map(node => (
                    <option key={node.id} value={node.id}>
                      {node.title} (Nível {node.level})
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
                placeholder="0 = Topo, 1 = Segundo nível, etc"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Níveis diferentes terão cores diferentes no BSC
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Ordem de Exibição</label>
              <Input
                type="number"
                value={formData.order_position}
                onChange={(e) => setFormData({ ...formData, order_position: Number(e.target.value) })}
                placeholder="0, 1, 2, etc"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Itens com ordem menor aparecem primeiro
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="is_kpi"
                  checked={formData.is_kpi}
                  onChange={(e) => setFormData({ ...formData, is_kpi: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_kpi" className="text-sm font-medium cursor-pointer">
                  Este item é um KPI (Indicador Chave de Performance)
                </label>
              </div>

              {formData.is_kpi && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-300">
                  <div>
                    <label className="text-sm font-medium">Meta</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[80px]"
                      value={formData.meta}
                      onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                      placeholder="Descreva a meta do KPI..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Iniciativas</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[80px]"
                      value={formData.iniciativas}
                      onChange={(e) => setFormData({ ...formData, iniciativas: e.target.value })}
                      placeholder="Descreva as iniciativas para alcançar a meta..."
                    />
                  </div>
                </div>
              )}
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
    </>
  );
}
