import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface City {
  id: string;
  name: string;
  iss_rate: number;
}

export const CityManager = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCity, setNewCity] = useState({ name: '', iss_rate: 3.0 });
  const [editCity, setEditCity] = useState({ name: '', iss_rate: 3.0 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao carregar cidades:', error);
      return;
    }

    setCities(data || []);
  };

  const handleAddCity = async () => {
    if (!newCity.name.trim()) {
      alert('Por favor, preencha o nome da cidade');
      return;
    }

    const { error } = await supabase
      .from('cities')
      .insert({
        name: newCity.name.trim().toUpperCase(),
        iss_rate: newCity.iss_rate,
      });

    if (error) {
      if (error.code === '23505') {
        alert('Esta cidade já existe no sistema');
      } else {
        console.error('Erro ao adicionar cidade:', error);
        alert('Erro ao adicionar cidade');
      }
      return;
    }

    setNewCity({ name: '', iss_rate: 3.0 });
    setIsAdding(false);
    loadCities();
  };

  const handleStartEdit = (city: City) => {
    setEditingId(city.id);
    setEditCity({ name: city.name, iss_rate: city.iss_rate });
  };

  const handleUpdateCity = async (id: string) => {
    if (!editCity.name.trim()) {
      alert('Por favor, preencha o nome da cidade');
      return;
    }

    const { error } = await supabase
      .from('cities')
      .update({
        name: editCity.name.trim().toUpperCase(),
        iss_rate: editCity.iss_rate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar cidade:', error);
      alert('Erro ao atualizar cidade');
      return;
    }

    setEditingId(null);
    loadCities();
  };

  const handleDeleteCity = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a cidade ${name}?`)) {
      return;
    }

    const { error } = await supabase.from('cities').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir cidade:', error);
      alert('Erro ao excluir cidade');
      return;
    }

    loadCities();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCity({ name: '', iss_rate: 3.0 });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewCity({ name: '', iss_rate: 3.0 });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">
          Gerenciar Cidades e ISSQN
        </h3>
        <div className="flex items-center gap-3">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors"
            >
              <Plus size={18} />
              Nova Cidade
            </button>
          )}
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
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2 text-left">
                    Cidade
                  </th>
                  <th className="border border-slate-300 px-4 py-2 text-center">
                    Taxa ISSQN (%)
                  </th>
                  <th className="border border-slate-300 px-4 py-2 text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
            {isAdding && (
              <tr className="bg-green-50">
                <td className="border border-slate-300 px-4 py-2">
                  <input
                    type="text"
                    value={newCity.name}
                    onChange={(e) =>
                      setNewCity({ ...newCity, name: e.target.value })
                    }
                    placeholder="Nome da cidade"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </td>
                <td className="border border-slate-300 px-4 py-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newCity.iss_rate}
                    onChange={(e) =>
                      setNewCity({
                        ...newCity,
                        iss_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                  />
                </td>
                <td className="border border-slate-300 px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleAddCity}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                      title="Salvar"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={handleCancelAdd}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                      title="Cancelar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {cities.map((city) => (
              <tr key={city.id} className="hover:bg-slate-50">
                {editingId === city.id ? (
                  <>
                    <td className="border border-slate-300 px-4 py-2">
                      <input
                        type="text"
                        value={editCity.name}
                        onChange={(e) =>
                          setEditCity({ ...editCity, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editCity.iss_rate}
                        onChange={(e) =>
                          setEditCity({
                            ...editCity,
                            iss_rate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateCity(city.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title="Salvar"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                          title="Cancelar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-slate-300 px-4 py-2 font-medium">
                      {city.name}
                    </td>
                    <td className="border border-slate-300 px-4 py-2 text-center">
                      {city.iss_rate.toFixed(1)}%
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStartEdit(city)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCity(city.id, city.name)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                          title="Excluir"
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

          {cities.length === 0 && !isAdding && (
            <div className="text-center py-8 text-slate-600">
              <p>Nenhuma cidade cadastrada. Clique em "Nova Cidade" para começar.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
