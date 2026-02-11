import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Calendar, Briefcase, Upload, X } from 'lucide-react';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '../../hooks/useSupabase';

interface EmployeeFormData {
  name: string;
  email: string;
  role: 'ADL' | 'Licitante' | 'Admin' | 'Promotor' | 'Orcamentista';
  department: string;
  hireDate: string;
  avatar: string;
  participaFundo: boolean;
}

export const EmployeeManagement: React.FC = () => {
  const { data: employees = [], loading, refetch } = useSupabaseQuery('employees', {
    orderBy: { column: 'name', ascending: true }
  });
  const { insert: insertEmployee, loading: insertLoading } = useSupabaseInsert('employees');
  const { update: updateEmployee, loading: updateLoading } = useSupabaseUpdate('employees');
  const { deleteRecord: deleteEmployee, loading: deleteLoading } = useSupabaseDelete('employees');
  
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    role: 'SDR',
    department: 'Vendas',
    hireDate: '',
    avatar: '',
    participaFundo: true
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Nome e email são obrigatórios');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Por favor, insira um email válido');
      return;
    }

    try {
      console.log('🚀 Iniciando salvamento do funcionário:', formData);
      
      const employeeData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        avatar: formData.avatar || generateDefaultAvatar(formData.name),
        hire_date: formData.hireDate || new Date().toISOString().split('T')[0],
        participa_fundo: formData.participaFundo,
        points: 0,
        level: 1
      };

      console.log('📊 Dados preparados para inserção:', employeeData);

      if (editingEmployee) {
        // Update existing employee
        console.log('✏️ Atualizando funcionário existente:', editingEmployee.id);
        await updateEmployee(editingEmployee.id, employeeData);
        console.log('Employee updated successfully');
        alert('Funcionário atualizado com sucesso!');
      } else {
        // Add new employee
        console.log('➕ Criando novo funcionário...');
        await insertEmployee(employeeData);
        console.log('Employee added successfully');
        alert('Funcionário adicionado com sucesso!');
      }
      
      // Refresh the employee list
      console.log('🔄 Atualizando lista de funcionários...');
      refetch();
      resetForm();
      
    } catch (error) {
      console.error('Error saving employee:', error);
      
      let errorMessage = 'Erro desconhecido ao salvar funcionário.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message;
        
        if (message.includes('duplicate key') || message.includes('unique constraint')) {
          errorMessage = 'Este email já está cadastrado. Use um email diferente.';
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = `Erro: ${message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      // Garantir que o loading sempre seja resetado
      console.log('🏁 Finalizando processo de salvamento');
    }
  };

  const resetForm = () => {
    console.log('🔄 Resetando formulário...');
    setFormData({
      name: '',
      email: '',
      role: 'SDR',
      department: 'Vendas',
      hireDate: '',
      avatar: '',
      participaFundo: true
    });
    setShowForm(false);
    setEditingEmployee(null);
    setUploadingPhoto(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create a data URL from the file
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData(prev => ({ ...prev, avatar: dataUrl }));
        setUploadingPhoto(false);
      };
      reader.onerror = () => {
        alert('Erro ao carregar a imagem. Tente novamente.');
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao carregar a imagem. Tente novamente.');
      setUploadingPhoto(false);
    }
  };

  const handleEdit = (employee: any) => {
    console.log('✏️ Editando funcionário:', employee.name);
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      hireDate: employee.hire_date || new Date().toISOString().split('T')[0],
      avatar: employee.avatar,
      participaFundo: employee.participa_fundo ?? true
    });
    setShowForm(true);
  };

  const handleDelete = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const confirmMessage = `Tem certeza que deseja remover "${employee?.name}"?\n\nEsta ação não pode ser desfeita e removerá:\n- O funcionário do sistema\n- Todas as propostas associadas\n- Dados de performance\n\nDigite "CONFIRMAR" para prosseguir:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'CONFIRMAR') {
      try {
        console.log('🗑️ Deletando funcionário:', employee?.name);
        await deleteEmployee(employeeId);
        console.log('Employee deleted successfully');
        
        // Refresh the employee list
        await refetch();
        alert('Funcionário removido com sucesso!');
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert(`Erro ao excluir funcionário: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "CONFIRMAR" para remover o funcionário.');
    }
  };

  // Função para gerar avatar padrão baseado no nome
  const generateDefaultAvatar = (name: string) => {
    const avatars = [
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    ];
    
    // Usar o comprimento do nome para escolher um avatar
    const index = name.length % avatars.length;
    return avatars[index];
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Closer': return 'bg-blue-100 text-blue-800';
      case 'SDR': return 'bg-green-100 text-green-800';
      case 'Admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMonthsWorked = (hireDate: string) => {
    if (!hireDate) return 0;
    
    const hire = new Date(hireDate);
    const now = new Date();
    
    // Calcular diferença em anos e meses
    let months = (now.getFullYear() - hire.getFullYear()) * 12;
    months += now.getMonth() - hire.getMonth();
    
    // Ajustar se o dia atual for menor que o dia de admissão
    if (now.getDate() < hire.getDate()) {
      months--;
    }
    
    return Math.max(1, months);
  };

  const formatWorkTime = (hireDate: string) => {
    if (!hireDate) return 'Data não informada';
    
    const months = calculateMonthsWorked(hireDate);
    
    if (months < 12) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      
      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`;
      } else {
        return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Funcionários</h1>
          <p className="text-gray-600">Adicione, edite e gerencie SDRs e Closers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Funcionário</label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {formData.avatar ? (
                      <div className="relative">
                        <img
                          src={formData.avatar}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={uploadingPhoto}
                    />
                    <label
                      htmlFor="photo-upload"
                      className={`inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                        uploadingPhoto 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploadingPhoto ? 'Carregando...' : 'Escolher Foto'}</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG ou GIF até 5MB
                    </p>
                  </div>
                </div>
              </div>

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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SDR">SDR (Auxiliar de Licitação)</option>
                  <option value="Closer">Closer (Licitante)</option>
                  <option value="Promotor">Promotor</option>
                  <option value="Orcamentista">Orçamentista</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Contratação</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para usar a data atual
                </p>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="participaFundo"
                  checked={formData.participaFundo}
                  onChange={(e) => setFormData({ ...formData, participaFundo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="participaFundo" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Participa do Fundo de Bonificação
                  </label>
                  <p className="text-xs text-blue-700 mt-1">
                    Marque esta opção se o funcionário deve receber bonificação proporcional
                  </p>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={insertLoading || updateLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(insertLoading || updateLoading) ? 'Salvando...' : (editingEmployee ? 'Atualizar' : 'Adicionar')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={insertLoading || updateLoading}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Funcionários Cadastrados</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {employees.map((employee) => (
            <div key={employee.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                        {employee.role}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Briefcase className="w-3 h-3" />
                        <span>{employee.department}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{formatWorkTime(employee.hire_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      employee.participa_fundo ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      employee.participa_fundo ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {employee.participa_fundo ? 'Participa do Fundo' : 'Não participa do Fundo'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right mr-4">
                    <div className="text-lg font-bold text-blue-600">{employee.points.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">pontos</div>
                  </div>
                  <button
                    onClick={() => handleEdit(employee)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
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
    </div>
  );
};