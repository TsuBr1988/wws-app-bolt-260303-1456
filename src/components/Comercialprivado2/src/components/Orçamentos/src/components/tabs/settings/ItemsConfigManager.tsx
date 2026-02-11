import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Trash2, Edit2, Check, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface ConfigItem {
  id: string;
  name: string;
  brand: string;
  default_quantity: number;
  unit_value: number;
  default_amortization: number;
  is_active: boolean;
}

type ItemCategory = 'equipments' | 'materials' | 'capex' | 'uniforms';

const categoryLabels: Record<ItemCategory, string> = {
  equipments: 'Equipamentos',
  materials: 'Materiais',
  capex: 'Capex',
  uniforms: 'Uniformes'
};

const categoryTables: Record<ItemCategory, string> = {
  equipments: 'config_equipments',
  materials: 'config_materials',
  capex: 'config_capex',
  uniforms: 'config_uniforms'
};

export function ItemsConfigManager() {
  const [items, setItems] = useState<Record<ItemCategory, ConfigItem[]>>({
    equipments: [],
    materials: [],
    capex: [],
    uniforms: []
  });
  const [expandedSections, setExpandedSections] = useState<Record<ItemCategory, boolean>>({
    equipments: true,
    materials: false,
    capex: false,
    uniforms: false
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<ItemCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<ConfigItem>>({});

  useEffect(() => {
    loadAllItems();
  }, []);

  const loadAllItems = async () => {
    setLoading(true);
    try {
      const categories: ItemCategory[] = ['equipments', 'materials', 'capex', 'uniforms'];
      const newItems: Record<ItemCategory, ConfigItem[]> = {
        equipments: [],
        materials: [],
        capex: [],
        uniforms: []
      };

      for (const category of categories) {
        const { data, error } = await supabase
          .from(categoryTables[category])
          .select('*')
          .order('name');

        if (error) throw error;
        newItems[category] = data || [];
      }

      setItems(newItems);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (category: ItemCategory) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const startAdding = (category: ItemCategory) => {
    setAddingCategory(category);
    setFormData({
      name: '',
      brand: '',
      default_quantity: 1,
      unit_value: 0,
      default_amortization: 12,
      is_active: true
    });
  };

  const startEditing = (item: ConfigItem) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingCategory(null);
    setFormData({});
  };

  const saveItem = async (category: ItemCategory) => {
    if (!formData.name || !formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    if ((formData.default_quantity || 0) <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    if ((formData.unit_value || 0) <= 0) {
      alert('Valor unitário deve ser maior que zero');
      return;
    }

    if ((formData.default_amortization || 0) <= 0) {
      alert('Amortização deve ser maior que zero');
      return;
    }

    try {
      const table = categoryTables[category];

      if (editingId) {
        const { error } = await supabase
          .from(table)
          .update({
            name: formData.name,
            brand: formData.brand || '',
            default_quantity: formData.default_quantity,
            unit_value: formData.unit_value,
            default_amortization: formData.default_amortization,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert([{
            name: formData.name,
            brand: formData.brand || '',
            default_quantity: formData.default_quantity,
            unit_value: formData.unit_value,
            default_amortization: formData.default_amortization,
            is_active: formData.is_active
          }]);

        if (error) throw error;
      }

      await loadAllItems();
      cancelEdit();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Erro ao salvar item');
    }
  };

  const deleteItem = async (category: ItemCategory, id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from(categoryTables[category])
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAllItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Erro ao excluir item');
    }
  };

  const toggleActive = async (category: ItemCategory, item: ConfigItem) => {
    try {
      const { error } = await supabase
        .from(categoryTables[category])
        .update({
          is_active: !item.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;
      await loadAllItems();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const renderTableRow = (category: ItemCategory, item: ConfigItem) => {
    const isEditing = editingId === item.id;

    if (isEditing) {
      return (
        <tr key={item.id} className="bg-blue-50">
          <td className="px-4 py-2">
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1 border rounded"
              placeholder="Nome do item"
            />
          </td>
          <td className="px-4 py-2">
            <input
              type="text"
              value={formData.brand || ''}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-2 py-1 border rounded"
              placeholder="Marca"
            />
          </td>
          <td className="px-4 py-2">
            <input
              type="number"
              value={formData.default_quantity || 1}
              onChange={(e) => setFormData({ ...formData, default_quantity: parseFloat(e.target.value) })}
              className="w-full px-2 py-1 border rounded"
              step="0.01"
              min="0.01"
            />
          </td>
          <td className="px-4 py-2">
            <input
              type="number"
              value={formData.unit_value || 0}
              onChange={(e) => setFormData({ ...formData, unit_value: parseFloat(e.target.value) })}
              className="w-full px-2 py-1 border rounded"
              step="0.01"
              min="0.01"
            />
          </td>
          <td className="px-4 py-2">
            <input
              type="number"
              value={formData.default_amortization || 12}
              onChange={(e) => setFormData({ ...formData, default_amortization: parseInt(e.target.value) })}
              className="w-full px-2 py-1 border rounded"
              min="1"
            />
          </td>
          <td className="px-4 py-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active || false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">{formData.is_active ? 'Ativo' : 'Inativo'}</span>
            </label>
          </td>
          <td className="px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => saveItem(category)}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Salvar"
              >
                <Check size={18} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Cancelar"
              >
                <X size={18} />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id} className={!item.is_active ? 'bg-gray-100 opacity-60' : ''}>
        <td className="px-4 py-2">{item.name}</td>
        <td className="px-4 py-2">{item.brand}</td>
        <td className="px-4 py-2">{item.default_quantity}</td>
        <td className="px-4 py-2">R$ {item.unit_value.toFixed(2)}</td>
        <td className="px-4 py-2">{item.default_amortization} meses</td>
        <td className="px-4 py-2">
          <button
            onClick={() => toggleActive(category, item)}
            className={`px-3 py-1 rounded text-sm ${
              item.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {item.is_active ? 'Ativo' : 'Inativo'}
          </button>
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => startEditing(item)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Editar"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => deleteItem(category, item.id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Excluir"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderAddRow = (category: ItemCategory) => {
    if (addingCategory !== category) return null;

    return (
      <tr className="bg-green-50">
        <td className="px-4 py-2">
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-2 py-1 border rounded"
            placeholder="Nome do item"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            value={formData.brand || ''}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full px-2 py-1 border rounded"
            placeholder="Marca"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={formData.default_quantity || 1}
            onChange={(e) => setFormData({ ...formData, default_quantity: parseFloat(e.target.value) })}
            className="w-full px-2 py-1 border rounded"
            step="0.01"
            min="0.01"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={formData.unit_value || 0}
            onChange={(e) => setFormData({ ...formData, unit_value: parseFloat(e.target.value) })}
            className="w-full px-2 py-1 border rounded"
            step="0.01"
            min="0.01"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={formData.default_amortization || 12}
            onChange={(e) => setFormData({ ...formData, default_amortization: parseInt(e.target.value) })}
            className="w-full px-2 py-1 border rounded"
            min="1"
          />
        </td>
        <td className="px-4 py-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active !== false}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Ativo</span>
          </label>
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => saveItem(category)}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="Salvar"
            >
              <Check size={18} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Cancelar"
            >
              <X size={18} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCategorySection = (category: ItemCategory) => {
    const isExpanded = expandedSections[category];
    const categoryItems = items[category] || [];

    return (
      <div key={category} className="mb-6 border rounded-lg">
        <div
          className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection(category)}
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {categoryLabels[category]}
            <span className="text-sm font-normal text-gray-600">
              ({categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'})
            </span>
          </h3>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {isExpanded && (
          <div className="p-4">
            <div className="mb-3">
              <button
                onClick={() => startAdding(category)}
                disabled={addingCategory !== null}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Plus size={18} />
                Adicionar {categoryLabels[category]}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Marca</th>
                    <th className="px-4 py-2 text-left">Qtd. Padrão</th>
                    <th className="px-4 py-2 text-left">Valor Unitário</th>
                    <th className="px-4 py-2 text-left">Amortização</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {renderAddRow(category)}
                  {categoryItems.map(item => renderTableRow(category, item))}
                  {categoryItems.length === 0 && addingCategory !== category && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Nenhum item cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando itens...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Equipamentos, Uniformes, Capex e Materiais</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure itens padrão que podem ser rapidamente selecionados ao criar orçamentos
        </p>
      </div>

      {(['equipments', 'uniforms', 'capex', 'materials'] as ItemCategory[]).map(renderCategorySection)}
    </div>
  );
}