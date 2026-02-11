import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Calendar, DollarSign, User, Plus, Edit, Trash2 } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useDepartment } from '../../contexts/DepartmentContext';

interface BlocoItem {
  id: string;
  descricao: string;
  quantidade: number;
  valor: number;
}

interface BlocoOrcamento {
  id: string;
  nome: string;
  itens: BlocoItem[];
  total: number;
}

interface OrcamentoItem {
  id: string;
  titulo: string;
  turno: 'Diurno' | 'Noturno';
  escala: string;
  blocos: BlocoOrcamento[];
  totalGeral: number;
}

interface Orcamento {
  id: string;
  numero: string;
  cliente: string;
  itens: OrcamentoItem[];
  valor_total: number;
  data_criacao: string;
  data_validade: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'revisao';
  observacoes?: string;
  criado_por: string;
  department: string;
}

interface OrcamentoFormProps {
  onClose: () => void;
  onSubmit: (orcamento: Omit<Orcamento, 'id' | 'created_at' | 'updated_at'>) => void;
  editingOrcamento?: Orcamento | null;
}

const ESCALAS_TRABALHO = [
  '12x36 segunda à domingo',
  '12x36 segunda à sexta',
  '5x2 44 horas semanais',
  '8 horas diárias de segunda à domingo',
  '6x1 44 horas semanais'
];

const BLOCOS_ORCAMENTO = [
  'Composição do salário',
  'Encargos sociais',
  'Benefícios',
  'EPIS e uniformes',
  'Materiais',
  'Total antes dos encargos',
  'Custo de intrajornada',
  'BDI',
  'Total do posto'
];

export const OrcamentoForm: React.FC<OrcamentoFormProps> = ({
  onClose,
  onSubmit,
  editingOrcamento
}) => {
  const { selectedDepartment } = useDepartment();
  const { data: employees = [] } = useSupabaseQuery('employees');
  
  const [formData, setFormData] = useState({
    numero: '',
    cliente: '',
    itens: [] as OrcamentoItem[],
    data_criacao: new Date().toISOString().split('T')[0],
    data_validade: '',
    status: 'rascunho' as const,
    observacoes: '',
    criado_por: ''
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OrcamentoItem | null>(null);
  const [showBlocoModal, setShowBlocoModal] = useState(false);
  const [selectedBloco, setSelectedBloco] = useState<{ blocoIndex: number; blocoNome: string } | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // Debug state para verificar se o botão está funcionando
  console.log('showItemModal state:', showItemModal);

  // Estados do modal de item
  const [itemForm, setItemForm] = useState({
    titulo: '',
    turno: 'Diurno' as 'Diurno' | 'Noturno',
    escala: ESCALAS_TRABALHO[0],
    blocos: BLOCOS_ORCAMENTO.map((nome, index) => ({
      id: index.toString(),
      nome,
      itens: [] as BlocoItem[],
      total: 0
    }))
  });

  // Estados do modal de bloco
  const [blocoItemForm, setBlocoItemForm] = useState({
    descricao: '',
    quantidade: 1,
    valor: 0
  });

  // Carregar dados do orçamento para edição
  useEffect(() => {
    if (editingOrcamento) {
      setFormData({
        numero: editingOrcamento.numero,
        cliente: editingOrcamento.cliente,
        itens: editingOrcamento.itens || [],
        data_criacao: editingOrcamento.data_criacao,
        data_validade: editingOrcamento.data_validade,
        status: editingOrcamento.status,
        observacoes: editingOrcamento.observacoes || '',
        criado_por: editingOrcamento.criado_por
      });
    } else {
      // Gerar número automático para novo orçamento
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-4);
      const numeroGerado = `${selectedDepartment === 'Petrobras' ? 'PB' : 'CP'}-${currentYear}${currentMonth}-${timestamp}`;
      
      // Data de validade padrão: 30 dias a partir de hoje
      const validadeDate = new Date();
      validadeDate.setDate(validadeDate.getDate() + 30);
      
      setFormData(prev => ({
        ...prev,
        numero: numeroGerado,
        data_validade: validadeDate.toISOString().split('T')[0]
      }));
    }
  }, [editingOrcamento, selectedDepartment]);

  // Calcular valor total baseado nos itens
  const calcularValorTotal = (itens: OrcamentoItem[]) => {
    return itens.reduce((sum, item) => sum + item.totalGeral, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.numero.trim()) {
      alert('Número do orçamento é obrigatório');
      return;
    }
    
    if (!formData.cliente.trim()) {
      alert('Nome do cliente é obrigatório');
      return;
    }
    
    if (formData.itens.length === 0) {
      alert('Adicione pelo menos um item ao orçamento');
      return;
    }
    
    if (!formData.data_validade) {
      alert('Data de validade é obrigatória');
      return;
    }
    
    if (!formData.criado_por) {
      alert('Selecione quem criou o orçamento');
      return;
    }
    
    // Verificar se data de validade é futura
    const today = new Date();
    const validadeDate = new Date(formData.data_validade);
    if (validadeDate <= today) {
      alert('Data de validade deve ser futura');
      return;
    }

    // Enviar dados
    onSubmit({
      numero: formData.numero,
      cliente: formData.cliente,
      itens: formData.itens,
      valor_total: calcularValorTotal(formData.itens),
      data_criacao: formData.data_criacao,
      data_validade: formData.data_validade,
      status: formData.status,
      observacoes: formData.observacoes || undefined,
      criado_por: formData.criado_por,
      department: selectedDepartment
    });
  };

  // Funções do modal de item
  const openItemModal = (item?: OrcamentoItem) => {
    console.log('openItemModal called', { item, showItemModal });
    if (item) {
      setEditingItem(item);
      setItemForm({
        titulo: item.titulo,
        turno: item.turno,
        escala: item.escala,
        blocos: [...item.blocos]
      });
    } else {
      setEditingItem(null);
      setItemForm({
        titulo: '',
        turno: 'Diurno',
        escala: ESCALAS_TRABALHO[0],
        blocos: BLOCOS_ORCAMENTO.map((nome, index) => ({
          id: index.toString(),
          nome,
          itens: [],
          total: 0
        }))
      });
    }
    setShowItemModal(true);
    console.log('setShowItemModal(true) called');
  };

  const openBlocoModal = (blocoIndex: number, blocoNome: string) => {
    setSelectedBloco({ blocoIndex, blocoNome });
    setBlocoItemForm({ descricao: '', quantidade: 1, valor: 0 });
    setIsAddingItem(false);
    setShowBlocoModal(true);
  };

  const addBlocoItem = async () => {
    if (!selectedBloco) return;
    if (isAddingItem) return; // Prevenir dupla submissão
    
    if (!blocoItemForm.descricao.trim() || blocoItemForm.quantidade <= 0 || blocoItemForm.valor <= 0) {
      alert('Descrição, quantidade e valor são obrigatórios');
      return;
    }

    setIsAddingItem(true);

    const newBlocoItem: BlocoItem = {
      id: Date.now().toString(),
      descricao: blocoItemForm.descricao,
      quantidade: blocoItemForm.quantidade,
      valor: blocoItemForm.valor
    };

    setItemForm(prev => {
      const updatedBlocos = [...prev.blocos];
      updatedBlocos[selectedBloco.blocoIndex].itens.push(newBlocoItem);
      updatedBlocos[selectedBloco.blocoIndex].total = updatedBlocos[selectedBloco.blocoIndex].itens.reduce((sum, item) => sum + (item.quantidade * item.valor), 0);
      return { ...prev, blocos: updatedBlocos };
    });

    // Pequeno delay para garantir que o estado foi atualizado
    await new Promise(resolve => setTimeout(resolve, 100));

    setBlocoItemForm({ descricao: '', quantidade: 1, valor: 0 });
    setIsAddingItem(false);
    setShowBlocoModal(false);
  };

  const removeBlocoItem = (blocoIndex: number, itemId: string) => {
    setItemForm(prev => {
      const updatedBlocos = [...prev.blocos];
      updatedBlocos[blocoIndex].itens = updatedBlocos[blocoIndex].itens.filter(item => item.id !== itemId);
      updatedBlocos[blocoIndex].total = updatedBlocos[blocoIndex].itens.reduce((sum, item) => sum + (item.quantidade * item.valor), 0);
      return { ...prev, blocos: updatedBlocos };
    });
  };

  const saveItem = () => {
    if (!itemForm.titulo.trim()) {
      alert('Título do item é obrigatório');
      return;
    }

    const totalGeral = itemForm.blocos.reduce((sum, bloco) => sum + bloco.total, 0);

    const newItem: OrcamentoItem = {
      id: editingItem?.id || Date.now().toString(),
      titulo: itemForm.titulo,
      turno: itemForm.turno,
      escala: itemForm.escala,
      blocos: itemForm.blocos,
      totalGeral
    };

    if (editingItem) {
      // Editar item existente
      setFormData(prev => ({
        ...prev,
        itens: prev.itens.map(item => item.id === editingItem.id ? newItem : item)
      }));
    } else {
      // Adicionar novo item
      setFormData(prev => ({
        ...prev,
        itens: [...prev.itens, newItem]
      }));
    }

    setShowItemModal(false);
    setEditingItem(null);
  };

  const removeItem = (itemId: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      setFormData(prev => ({
        ...prev,
        itens: prev.itens.filter(item => item.id !== itemId)
      }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Modal de Bloco
  const BlocoModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">
            {selectedBloco?.blocoNome}
          </h4>
          <button
            onClick={() => setShowBlocoModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={blocoItemForm.descricao}
              onChange={(e) => setBlocoItemForm({ ...blocoItemForm, descricao: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Salário base, Vale transporte..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor *
            </label>
            <input
              type="number"
              value={blocoItemForm.valor || ''}
              onChange={(e) => setBlocoItemForm({ ...blocoItemForm, valor: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              placeholder="0,00"
            />
            {blocoItemForm.valor > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {formatCurrency(blocoItemForm.valor)}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={addBlocoItem}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setShowBlocoModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal de Item
  const ItemModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingItem ? 'Editar Item' : 'Adicionar Item'}
          </h3>
          <button
            onClick={() => setShowItemModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Título do Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Item *
            </label>
            <input
              type="text"
              value={itemForm.titulo}
              onChange={(e) => setItemForm({ ...itemForm, titulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Vigilante, Porteiro, Recepcionista..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turno *
              </label>
              <select
                value={itemForm.turno}
                onChange={(e) => setItemForm({ ...itemForm, turno: e.target.value as 'Diurno' | 'Noturno' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Diurno">Diurno</option>
                <option value="Noturno">Noturno</option>
              </select>
            </div>

            {/* Escala */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escala *
              </label>
              <select
                value={itemForm.escala}
                onChange={(e) => setItemForm({ ...itemForm, escala: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ESCALAS_TRABALHO.map(escala => (
                  <option key={escala} value={escala}>
                    {escala}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Blocos do Orçamento */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Blocos do Orçamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemForm.blocos.map((bloco, index) => (
                <div key={bloco.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900">{bloco.nome}</h5>
                    <button
                      type="button"
                      onClick={() => openBlocoModal(index, bloco.nome)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bloco.itens.length > 0 ? (
                      bloco.itens.map((item) => (
                        <div key={item.id} className="bg-white rounded p-2 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{item.descricao}</p>
                              <p className="text-xs text-green-600 font-bold">{formatCurrency(item.valor)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBlocoItem(index, item.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-xs text-gray-500">Nenhum item</p>
                        <p className="text-xs text-gray-400">Clique em "Add" para incluir</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">Total:</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(bloco.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Geral do Item */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-900 font-medium">Total Geral do Item:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(itemForm.blocos.reduce((sum, bloco) => sum + bloco.total, 0))}
              </span>
            </div>
            <div className="text-sm text-blue-700 mt-2 grid grid-cols-2 gap-2">
              <div><strong>Título:</strong> {itemForm.titulo || 'Não definido'}</div>
              <div><strong>Turno:</strong> {itemForm.turno}</div>
              <div className="col-span-2"><strong>Escala:</strong> {itemForm.escala}</div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={saveItem}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {editingItem ? 'Atualizar Item' : 'Adicionar Item'}
            </button>
            <button
              type="button"
              onClick={() => setShowItemModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <React.Fragment>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingOrcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedDepartment} • Planilha orçamentária
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Orçamento *
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: CP-202501-1234"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identificação única do orçamento
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Ministério da Educação"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Criação *
                </label>
                <input
                  type="date"
                  value={formData.data_criacao}
                  onChange={(e) => setFormData({ ...formData, data_criacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Validade *
                </label>
                <input
                  type="date"
                  value={formData.data_validade}
                  onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Até quando este orçamento é válido
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                  <option value="revisao">Em Revisão</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Criado por *
                </label>
                <select
                  value={formData.criado_por}
                  onChange={(e) => setFormData({ ...formData, criado_por: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.name}>
                      {employee.name} - {employee.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seção de Itens do Orçamento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Itens do Orçamento</h3>
                <button
                  type="button"
                  onClick={() => openItemModal()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Item</span>
                </button>
              </div>

              {formData.itens.length > 0 ? (
                <div className="space-y-3">
                  {formData.itens.map((item) => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{item.titulo}</h4>
                          <p className="text-sm text-gray-600">
                            {item.turno} • {item.escala}
                          </p>
                          <p className="text-sm text-blue-600">
                            {item.blocos.filter(b => b.itens.length > 0).length} bloco{item.blocos.filter(b => b.itens.length > 0).length !== 1 ? 's' : ''} preenchido{item.blocos.filter(b => b.itens.length > 0).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right mr-4">
                            <div className="text-xl font-bold text-green-600">{formatCurrency(item.totalGeral)}</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openItemModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Preview dos blocos com itens */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {item.blocos.filter(bloco => bloco.itens.length > 0).map((bloco) => (
                          <div key={bloco.id} className="bg-white rounded p-2 border border-gray-200">
                            <div className="text-xs font-medium text-gray-900 mb-1">{bloco.nome}</div>
                            <div className="text-xs text-gray-600">
                              {bloco.itens.length} item{bloco.itens.length !== 1 ? 'ns' : ''}
                            </div>
                            <div className="text-sm font-bold text-green-600">{formatCurrency(bloco.total)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item adicionado</h3>
                  <p className="text-gray-500 mb-4">
                    Clique em "Adicionar Item" para começar a compor seu orçamento
                  </p>
                  <button
                    type="button"
                    onClick={() => openItemModal()}
                    onMouseDown={(e) => {
                      console.log('Button clicked!');
                      e.preventDefault();
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Adicionar Primeiro Item
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (Opcional)
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações adicionais sobre este orçamento..."
              />
            </div>

            {/* Preview do Orçamento */}
            {formData.itens.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Resumo do Orçamento</h3>
                <div className="text-sm text-blue-600 space-y-1">
                  <div className="flex justify-between">
                    <span><strong>Número:</strong> {formData.numero}</span>
                    <span><strong>Cliente:</strong> {formData.cliente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><strong>Itens:</strong> {formData.itens.length} item{formData.itens.length > 1 ? 'ns' : ''}</span>
                    <span><strong>Valor Total:</strong> {formatCurrency(calcularValorTotal(formData.itens))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><strong>Validade:</strong> {formData.data_validade ? new Date(formData.data_validade).toLocaleDateString('pt-BR') : 'Não informada'}</span>
                    <span><strong>Departamento:</strong> {selectedDepartment}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={formData.itens.length === 0}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingOrcamento ? 'Atualizar Orçamento' : 'Criar Orçamento'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Editar Item' : 'Adicionar Item'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Título do Item */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Item *
                </label>
                <input
                  type="text"
                  value={itemForm.titulo}
                  onChange={(e) => setItemForm({ ...itemForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Vigilante, Porteiro, Recepcionista..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Turno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Turno *
                  </label>
                  <select
                    value={itemForm.turno}
                    onChange={(e) => setItemForm({ ...itemForm, turno: e.target.value as 'Diurno' | 'Noturno' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Diurno">Diurno</option>
                    <option value="Noturno">Noturno</option>
                  </select>
                </div>
                {/* Escala */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escala *
                  </label>
                  <select
                    value={itemForm.escala}
                    onChange={(e) => setItemForm({ ...itemForm, escala: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ESCALAS_TRABALHO.map(escala => (
                      <option key={escala} value={escala}>
                        {escala}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Blocos do Orçamento */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Blocos do Orçamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {itemForm.blocos.map((bloco, index) => (
                    <div key={bloco.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-900">{bloco.nome}</h5>
                        <button
                          type="button"
                          onClick={() => openBlocoModal(index, bloco.nome)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {bloco.itens.length > 0 ? (
                          bloco.itens.map((item) => (
                            <div key={item.id} className="bg-white rounded p-2 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {item.quantidade}x {item.descricao}
                                  </p>
                                  <p className="text-xs text-green-600 font-bold">
                                    {formatCurrency(item.quantidade * item.valor)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatCurrency(item.valor)} cada
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeBlocoItem(index, item.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-3">
                            <p className="text-xs text-gray-500">Nenhum item</p>
                            <p className="text-xs text-gray-400">Clique em "Add" para incluir</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Total:</span>
                          <span className="text-sm font-bold text-blue-600">{formatCurrency(bloco.total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Total Geral do Item */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-900 font-medium">Total Geral do Item:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(itemForm.blocos.reduce((sum, bloco) => sum + bloco.total, 0))}
                  </span>
                </div>
                <div className="text-sm text-blue-700 mt-2 grid grid-cols-2 gap-2">
                  <div><strong>Título:</strong> {itemForm.titulo || 'Não definido'}</div>
                  <div><strong>Turno:</strong> {itemForm.turno}</div>
                  <div className="col-span-2"><strong>Escala:</strong> {itemForm.escala}</div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={saveItem}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Atualizar Item' : 'Adicionar Item'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Bloco */}
      {showBlocoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">
                {selectedBloco?.blocoNome}
              </h4>
              <button
                onClick={() => setShowBlocoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={blocoItemForm.descricao}
                  onChange={(e) => setBlocoItemForm({ ...blocoItemForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Salário base, Vale transporte..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade *
                </label>
                <input
                  type="number"
                  value={blocoItemForm.quantidade || ''}
                  onChange={(e) => setBlocoItemForm({ ...blocoItemForm, quantidade: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  step="1"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantidade de unidades deste item
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor *
                </label>
                <input
                  type="number"
                  value={blocoItemForm.valor || ''}
                  onChange={(e) => setBlocoItemForm({ ...blocoItemForm, valor: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor unitário de cada item
                </p>
                {blocoItemForm.valor > 0 && blocoItemForm.quantidade > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {blocoItemForm.quantidade}x {formatCurrency(blocoItemForm.valor)} = {formatCurrency(blocoItemForm.quantidade * blocoItemForm.valor)}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={addBlocoItem}
                  disabled={isAddingItem}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingItem ? 'Adicionando...' : 'Adicionar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlocoModal(false);
                    setBlocoItemForm({ descricao: '', quantidade: 1, valor: 0 });
                    setIsAddingItem(false);
                  }}
                  disabled={isAddingItem}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};