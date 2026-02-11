import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key, Shield, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { PermissionsMatrix, IndicatorPermission } from './PermissionsMatrix';

interface AppUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_active: boolean;
  comercial_publico_access_type?: 'comercial' | 'administrativo' | 'interno' | null;
}


interface UserFormData {
  email: string;
  password: string;
  name: string;
  is_admin: boolean;
}

export function UsersManagementCard() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    is_admin: false,
  });
  const [isActive, setIsActive] = useState(true);
  const [comercialPublicoAccessType, setComercialPublicoAccessType] = useState<'comercial' | 'administrativo' | 'interno' | ''>('');
  const [permissions, setPermissions] = useState<IndicatorPermission[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email || !formData.password) {
        toast({
          title: 'Preencha email e senha',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('app_users').insert([formData]);

      if (error) throw error;

      toast({ title: 'Usuário criado com sucesso!' });
      setShowForm(false);
      setFormData({ email: '', password: '', name: '', is_admin: false });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.from('app_users').delete().eq('id', userId);

      if (error) throw error;

      toast({ title: 'Usuário excluído com sucesso!' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name || '',
      is_admin: user.is_admin,
    });
    setIsActive(user.is_active);
    setComercialPublicoAccessType(user.comercial_publico_access_type || '');
    setEditMode(true);
    setShowForm(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      if (!formData.email) {
        toast({
          title: 'Email é obrigatório',
          variant: 'destructive',
        });
        return;
      }

      const updateData: any = {
        email: formData.email,
        name: formData.name,
        is_admin: formData.is_admin,
        is_active: isActive,
        comercial_publico_access_type: comercialPublicoAccessType || null,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({ title: 'Usuário atualizado com sucesso!' });
      setShowForm(false);
      setEditMode(false);
      setSelectedUser(null);
      setFormData({ email: '', password: '', name: '', is_admin: false });
      setIsActive(true);
      setComercialPublicoAccessType('');
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadUserPermissions = async (user: AppUser) => {
    try {
      const { data: indicatorPerms } = await supabase
        .from('user_indicator_permissions')
        .select('*')
        .eq('user_id', user.id);

      const perms: IndicatorPermission[] = (indicatorPerms || []).map(i => ({
        page: i.page,
        indicator_name: i.indicator_name,
        permission_level: i.permission_level as 'none' | 'view' | 'edit',
      }));

      setPermissions(perms);
      setSelectedUser(user);
      setShowPermissions(true);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      console.log('🔄 Saving permissions for user:', selectedUser.email);
      console.log('📝 Current permissions state:', permissions);

      const { data: existingIndicators } = await supabase
        .from('user_indicator_permissions')
        .select('*')
        .eq('user_id', selectedUser.id);

      console.log('📋 Existing indicator permissions:', existingIndicators);

      const newPermissionsMap = new Map(
        permissions
          .filter(p => p.permission_level !== 'none')
          .map(p => [`${p.page}:${p.indicator_name}`, p])
      );

      const toDelete = (existingIndicators || []).filter(
        existing => !newPermissionsMap.has(`${existing.page}:${existing.indicator_name}`)
      );

      const toUpsert = permissions
        .filter(p => p.permission_level !== 'none')
        .map(p => ({
          user_id: selectedUser.id,
          page: p.page,
          indicator_name: p.indicator_name,
          permission_level: p.permission_level,
        }));

      console.log('🗑️ Permissions to delete:', toDelete.length);
      console.log('💾 Permissions to upsert:', toUpsert.length);

      if (toDelete.length > 0) {
        const deleteIds = toDelete.map(d => d.id);
        const { error: deleteError } = await supabase
          .from('user_indicator_permissions')
          .delete()
          .in('id', deleteIds);

        if (deleteError) {
          console.error('❌ Error deleting permissions:', deleteError);
          throw deleteError;
        }
        console.log('✅ Deleted old permissions');
      }

      if (toUpsert.length > 0) {
        const { data: upsertData, error: upsertError } = await supabase
          .from('user_indicator_permissions')
          .upsert(toUpsert, {
            onConflict: 'user_id, page, indicator_name'
          });

        if (upsertError) {
          console.error('❌ Error upserting permissions:', upsertError);
          console.error('❌ Upsert error details:', JSON.stringify(upsertError, null, 2));
          throw upsertError;
        }
        console.log('✅ Upserted permissions:', upsertData);
      }

      if (toDelete.length === (existingIndicators || []).length && toUpsert.length === 0) {
        const { error: deleteAllError } = await supabase
          .from('user_indicator_permissions')
          .delete()
          .eq('user_id', selectedUser.id);

        if (deleteAllError) {
          console.error('❌ Error deleting all permissions:', deleteAllError);
          throw deleteAllError;
        }
        console.log('✅ Deleted all permissions (user has no access)');
      }

      const uniquePages = [...new Set(permissions.filter(p => p.permission_level !== 'none').map(p => p.page))];
      console.log('📄 Unique pages with permissions:', uniquePages);

      const { data: existingPages } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', selectedUser.id);

      const existingPageNames = new Set((existingPages || []).map(p => p.page));
      const pagesToDelete = (existingPages || []).filter(p => !uniquePages.includes(p.page));
      const pagesToInsert = uniquePages.filter(p => !existingPageNames.has(p));

      if (pagesToDelete.length > 0) {
        const { error: deletePageError } = await supabase
          .from('user_permissions')
          .delete()
          .in('id', pagesToDelete.map(p => p.id));

        if (deletePageError) {
          console.error('❌ Error deleting page permissions:', deletePageError);
          throw deletePageError;
        }
        console.log('✅ Deleted old page permissions');
      }

      if (pagesToInsert.length > 0) {
        const pagePermissions = pagesToInsert.map(page => ({
          user_id: selectedUser.id,
          page,
          can_view: true,
        }));

        const { error: insertPageError } = await supabase
          .from('user_permissions')
          .insert(pagePermissions);

        if (insertPageError) {
          console.error('❌ Error inserting page permissions:', insertPageError);
          throw insertPageError;
        }
        console.log('✅ Inserted new page permissions');
      }

      console.log('✅ All permissions saved successfully');
      toast({ title: 'Permissões atualizadas com sucesso!' });
      setShowPermissions(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('❌ Error in handleSavePermissions:', error);
      toast({
        title: 'Erro ao salvar permissões',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">Carregando usuários...</p>
      </div>
    );
  }

  if (showPermissions && selectedUser) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h3 className="text-lg font-semibold">Gerenciar Permissões: {selectedUser.name || selectedUser.email}</h3>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Instruções:</strong> Para cada indicador, selecione o nível de permissão desejado:
            </p>
            <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
              <li><strong>Não Visualizar:</strong> O usuário não verá este indicador</li>
              <li><strong>Observar:</strong> O usuário pode apenas visualizar os dados</li>
              <li><strong>Editar:</strong> O usuário pode visualizar e editar os dados</li>
            </ul>
          </div>
          <PermissionsMatrix
            permissions={permissions}
            onChange={setPermissions}
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => {
            setShowPermissions(false);
            setSelectedUser(null);
          }}>
            Cancelar
          </Button>
          <Button onClick={handleSavePermissions}>
            Salvar Permissões
          </Button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h3 className="text-lg font-semibold">
            {editMode ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha {editMode ? '(deixe em branco para manter a atual)' : '*'}
            </label>
            <Input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editMode ? 'Nova senha (opcional)' : 'Senha do usuário'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do usuário"
            />
          </div>
          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_admin}
                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Administrador (acesso total)</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Acesso - Comercial Público
            </label>
            <select
              value={comercialPublicoAccessType}
              onChange={(e) => setComercialPublicoAccessType(e.target.value as 'comercial' | 'administrativo' | 'interno' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhum acesso específico</option>
              <option value="comercial">Acesso Comercial</option>
              <option value="administrativo">Acesso Administrativo</option>
              <option value="interno">Acesso Interno</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Define o nível de acesso ao módulo Comercial Público (apenas se usuário tiver permissão para esta página)
            </p>
          </div>
          {editMode && (
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Usuário ativo</span>
              </label>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => {
            setShowForm(false);
            setEditMode(false);
            setSelectedUser(null);
            setFormData({ email: '', password: '', name: '', is_admin: false });
            setIsActive(true);
            setComercialPublicoAccessType('');
          }}>
            Cancelar
          </Button>
          <Button onClick={editMode ? handleUpdateUser : handleCreateUser}>
            {editMode ? 'Salvar Alterações' : 'Criar Usuário'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gerenciamento de Usuários</h3>
            <p className="text-sm text-gray-600 mt-1">
              {users.length} {users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
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
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>

            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 ${
                    !user.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{user.name || user.email}</p>
                        {user.is_admin && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-md font-medium">
                            Admin
                          </span>
                        )}
                        {!user.is_active && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-md font-medium">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!user.is_admin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadUserPermissions(user)}
                        title="Gerenciar permissões"
                      >
                        <Key className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditUser(user)}
                      title="Editar usuário"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário cadastrado
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
