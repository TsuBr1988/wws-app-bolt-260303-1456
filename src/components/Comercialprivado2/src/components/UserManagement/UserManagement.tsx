import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Mail, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabaseQuery, useSupabaseUpdate } from '../../hooks/useSupabase';
import { displayDateTime } from '../../utils/dateUtils';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export const UserManagement: React.FC = () => {
  const { data: users = [], loading, refetch } = useSupabaseQuery('user_profiles', {
    orderBy: { column: 'created_at', ascending: false }
  });
  const { update: updateUserProfile } = useSupabaseUpdate('user_profiles');
  
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'sdr' as 'admin' | 'closer' | 'sdr'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Criar usuário diretamente na tabela user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          email: formData.email,
          name: formData.name
        })
        .select()
        .single();

      if (error) throw error;

      alert('Usuário criado com sucesso!');
      setShowForm(false);
      setFormData({ email: '', password: '', name: '', role: 'sdr' });
      refetch();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert(`Erro ao criar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name || '',
      role: 'sdr' // Default role
    });
    setShowForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setCreating(true);
    try {
      await updateUserProfile(editingUser.id, {
        name: formData.name
      });

      alert('Usuário atualizado com sucesso!');
      setShowForm(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', name: '', role: 'sdr' });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert(`Erro ao atualizar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmation = prompt(
      `Para excluir o usuário "${email}", digite "EXCLUIR":`
    );

    if (confirmation === 'EXCLUIR') {
      try {
        // Deletar perfil
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', userId);
          
        if (error) throw error;
        
        alert('Usuário excluído com sucesso!');
        refetch();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert(`Erro ao excluir usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const formatDate = (dateString: string) => {
    return displayDateTime(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600">Controle de acesso e permissões do sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Create User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
              </h2>
            </div>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingUser}
                  required
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? (editingUser ? 'Atualizando...' : 'Criando...') : (editingUser ? 'Atualizar' : 'Criar Usuário')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({ email: '', password: '', name: '', role: 'sdr' });
                  }}
                  disabled={creating}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Usuários do Sistema</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{user.name || user.email}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        <span>Criado em {formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Informações do Sistema</h3>
        <div className="space-y-2 text-blue-800">
          <p>• <strong>Usuários ativos:</strong> {users.length}</p>
          <p>• <strong>Autenticação:</strong> Desativada - Acesso livre</p>
          <p>• <strong>Segurança:</strong> Sem restrições de acesso</p>
        </div>
      </div>
    </div>
  );
};