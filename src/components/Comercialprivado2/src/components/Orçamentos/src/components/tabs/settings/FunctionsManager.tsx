import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ConfigFunction } from '../../../types';

export const FunctionsManager = () => {
  const [functions, setFunctions] = useState<ConfigFunction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<ConfigFunction>({
    code: '',
    name: '',
    base_salary: 0,
    service_type: 'facilities',
    is_active: true,
  });

  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('config_functions')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao carregar funções:', error);
    } else {
      setFunctions(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      code: '',
      name: '',
      base_salary: 0,
      service_type: 'facilities',
      is_active: true,
    });
  };

  const handleEdit = (func: ConfigFunction) => {
    setEditingId(func.id!);
    setFormData(func);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || formData.base_salary <= 0) {
      alert('Preencha todos os campos corretamente');
      return;
    }

    if (isAdding) {
      const { error } = await supabase.from('config_functions').insert({
        code: formData.code.toUpperCase(),
        name: formData.name,
        base_salary: formData.base_salary,
        service_type: formData.service_type,
        is_active: formData.is_active,
      });

      if (error) {
        console.error('Erro ao adicionar função:', error);
        alert('Erro ao adicionar função. Verifique se o código já existe.');
        return;
      }
    } else if (editingId) {
      const { error } = await supabase
        .from('config_functions')
        .update({
          name: formData.name,
          base_salary: formData.base_salary,
          service_type: formData.service_type,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        console.error('Erro ao atualizar função:', error);
        alert('Erro ao atualizar função');
        return;
      }
    }

    setIsAdding(false);
    setEditingId(null);
    loadFunctions();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta função?')) {
      return;
    }

    const { error } = await supabase.from('config_functions').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir função:', error);
      alert('Erro ao excluir função');
      return;
    }

    loadFunctions();
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">Funções</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAdd}
            disabled={isAdding || editingId !== null}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors shadow-md disabled:bg-slate-400"
          >
            <Plus size={20} />
            Nova Função
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-600 hover:text-slate-800 transition-colors p-1"
            title={isExpanded ? 'Recolher' : 'Expandir'}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-md">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-right">Salário Base</th>
                <th className="px-4 py-3 text-center">Tipo de Serviço</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
            {isAdding && (
              <tr className="bg-green-50 border-b border-slate-200">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: PORTEIRO"
                    className="w-full px-2 py-1 border border-slate-300 rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full px-2 py-1 border border-slate-300 rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_salary}
                    onChange={(e) =>
                      setFormData({ ...formData, base_salary: parseFloat(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={formData.service_type}
                    onChange={(e) =>
                      setFormData({ ...formData, service_type: e.target.value as 'facilities' | 'vigilancia' })
                    }
                    className="px-2 py-1 border border-slate-300 rounded"
                  >
                    <option value="facilities">Facilities</option>
                    <option value="vigilancia">Vigilância</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.value === 'true' })
                    }
                    className="px-2 py-1 border border-slate-300 rounded"
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleSave}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {functions.map((func) => (
              <tr
                key={func.id}
                className={`border-b border-slate-200 hover:bg-slate-50 ${
                  editingId === func.id ? 'bg-blue-50' : ''
                }`}
              >
                {editingId === func.id ? (
                  <>
                    <td className="px-4 py-3 text-slate-600">{func.code}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.base_salary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            base_salary: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={formData.service_type}
                        onChange={(e) =>
                          setFormData({ ...formData, service_type: e.target.value as 'facilities' | 'vigilancia' })
                        }
                        className="px-2 py-1 border border-slate-300 rounded"
                      >
                        <option value="facilities">Facilities</option>
                        <option value="vigilancia">Vigilância</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={formData.is_active ? 'true' : 'false'}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.value === 'true' })
                        }
                        className="px-2 py-1 border border-slate-300 rounded"
                      >
                        <option value="true">Ativa</option>
                        <option value="false">Inativa</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleSave}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-mono text-sm text-slate-600">
                      {func.code}
                    </td>
                    <td className="px-4 py-3 font-medium">{func.name}</td>
                    <td className="px-4 py-3 text-right">
                      {func.base_salary.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          func.service_type === 'vigilancia'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {func.service_type === 'vigilancia' ? 'Vigilância' : 'Facilities'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          func.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {func.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(func)}
                          disabled={isAdding || editingId !== null}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:text-slate-400"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(func.id!)}
                          disabled={isAdding || editingId !== null}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:text-slate-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
