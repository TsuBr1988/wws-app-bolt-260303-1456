import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getDatabase } from '../../lib/databaseResolver';
import type { Action } from '../../pages/AtasAcoesPage';

const supabase = getDatabase('ATAS');

interface ActionFormProps {
  action?: Action | null;
  onClose: () => void;
  onSubmit: (data: Omit<Action, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export function ActionForm({ action, onClose, onSubmit }: ActionFormProps) {
  const [formData, setFormData] = useState({
    descricao: '',
    responsavel: '',
    data_prazo: '',
    status: 'a_fazer' as 'a_fazer' | 'fazendo' | 'feito',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (action) {
      setFormData({
        descricao: action.descricao,
        responsavel: action.responsavel,
        data_prazo: action.data_prazo,
        status: action.status,
      });
    }
  }, [action]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {action ? 'Editar Ação' : 'Nova Ação'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição da Ação *
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva a ação a ser realizada..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável *
              </label>
              {loadingUsers ? (
                <div className="px-3 py-2 text-gray-400">Carregando usuários...</div>
              ) : (
                <select
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um responsável</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo *
              </label>
              <Input
                type="date"
                value={formData.data_prazo}
                onChange={(e) => setFormData({ ...formData, data_prazo: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="a_fazer">A Fazer</option>
                <option value="fazendo">Fazendo</option>
                <option value="feito">Feito</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancelar
            </Button>
            <Button type="submit">
              {action ? 'Salvar Alterações' : 'Criar Ação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
