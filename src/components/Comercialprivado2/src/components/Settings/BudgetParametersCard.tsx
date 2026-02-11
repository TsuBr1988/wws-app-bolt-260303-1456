/**
 * Componente: BudgetParametersCard
 * 
 * Propósito: Configuração de parâmetros para o sistema de orçamentos
 * - Gerenciar cargos e seus salários base
 * - Configurar escalas de trabalho
 * - Dados utilizados na criação de orçamentos
 */

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, ClipboardList } from 'lucide-react';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';

export const BudgetParametersCard: React.FC = () => {
  const [editingJobRole, setEditingJobRole] = useState<string | null>(null);
  const [editingScale, setEditingScale] = useState<string | null>(null);
  const [showAddJobForm, setShowAddJobForm] = useState(false);
  const [showAddScaleForm, setShowAddScaleForm] = useState(false);
  
  const [newJobRole, setNewJobRole] = useState({ name: '', salary: '' });
  const [newScale, setNewScale] = useState({ name: '', people: '', days: '' });
  const [tempJobRole, setTempJobRole] = useState({ name: '', salary: '' });
  const [tempScale, setTempScale] = useState({ name: '', people: '', days: '' });

  // Queries para buscar dados
  const { data: jobRoles = [], loading: jobRolesLoading, refetch: refetchJobRoles } = useSupabaseQuery('budget_job_roles' as any, {
    filter: { is_active: true },
    orderBy: { column: 'role_name', ascending: true }
  });

  const { data: workScales = [], loading: scalesLoading, refetch: refetchScales } = useSupabaseQuery('budget_work_scales' as any, {
    filter: { is_active: true },
    orderBy: { column: 'scale_name', ascending: true }
  });

  // Hooks para operações CRUD
  const { insert: insertJobRole } = useSupabaseInsert('budget_job_roles' as any);
  const { update: updateJobRole } = useSupabaseUpdate('budget_job_roles' as any);
  const { deleteRecord: deleteJobRole } = useSupabaseDelete('budget_job_roles' as any);
  
  const { insert: insertScale } = useSupabaseInsert('budget_work_scales' as any);
  const { update: updateScale } = useSupabaseUpdate('budget_work_scales' as any);
  const { deleteRecord: deleteScale } = useSupabaseDelete('budget_work_scales' as any);

  // Funções para cargos
  const handleAddJobRole = async () => {
    if (!newJobRole.name.trim() || !newJobRole.salary) {
      alert('Preencha o nome do cargo e o salário base.');
      return;
    }

    try {
      await insertJobRole({
        role_name: newJobRole.name,
        base_salary: parseFloat(newJobRole.salary),
        is_active: true
      });

      setNewJobRole({ name: '', salary: '' });
      setShowAddJobForm(false);
      refetchJobRoles();
      alert('✅ Cargo adicionado com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao adicionar cargo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleEditJobRole = (jobRole: any) => {
    setEditingJobRole(jobRole.id);
    setTempJobRole({
      name: jobRole.role_name,
      salary: jobRole.base_salary.toString()
    });
  };

  const handleSaveJobRole = async (jobRoleId: string) => {
    try {
      await updateJobRole(jobRoleId, {
        role_name: tempJobRole.name,
        base_salary: parseFloat(tempJobRole.salary)
      });

      setEditingJobRole(null);
      refetchJobRoles();
      alert('✅ Cargo atualizado com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao atualizar cargo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeleteJobRole = async (jobRoleId: string, roleName: string) => {
    if (confirm(`Tem certeza que deseja excluir o cargo "${roleName}"?`)) {
      try {
        await deleteJobRole(jobRoleId);
        refetchJobRoles();
        alert('✅ Cargo excluído com sucesso!');
      } catch (error) {
        alert(`❌ Erro ao excluir cargo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  // Funções para escalas
  const handleAddScale = async () => {
    if (!newScale.name.trim() || !newScale.people || !newScale.days) {
      alert('Preencha todos os campos da escala.');
      return;
    }

    try {
      await insertScale({
        scale_name: newScale.name,
        people_quantity: parseFloat(newScale.people),
        working_days: parseFloat(newScale.days),
        is_active: true
      });

      setNewScale({ name: '', people: '', days: '' });
      setShowAddScaleForm(false);
      refetchScales();
      alert('✅ Escala adicionada com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao adicionar escala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleEditScale = (scale: any) => {
    setEditingScale(scale.id);
    setTempScale({
      name: scale.scale_name,
      people: scale.people_quantity.toString(),
      days: scale.working_days.toString()
    });
  };

  const handleSaveScale = async (scaleId: string) => {
    try {
      await updateScale(scaleId, {
        scale_name: tempScale.name,
        people_quantity: parseFloat(tempScale.people),
        working_days: parseFloat(tempScale.days)
      });

      setEditingScale(null);
      refetchScales();
      alert('✅ Escala atualizada com sucesso!');
    } catch (error) {
      alert(`❌ Erro ao atualizar escala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleDeleteScale = async (scaleId: string, scaleName: string) => {
    if (confirm(`Tem certeza que deseja excluir a escala "${scaleName}"?`)) {
      try {
        await deleteScale(scaleId);
        refetchScales();
        alert('✅ Escala excluída com sucesso!');
      } catch (error) {
        alert(`❌ Erro ao excluir escala: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  if (jobRolesLoading || scalesLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Parâmetros para Orçamentos</h2>
          <p className="text-sm text-gray-600">Configure cargos e escalas utilizados nos orçamentos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabela de Cargos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-900">Cargos e Salários Base</h3>
            <button
              onClick={() => setShowAddJobForm(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Cargo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Salário Base</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {showAddJobForm && (
                  <tr className="bg-blue-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={newJobRole.name}
                        onChange={(e) => setNewJobRole({ ...newJobRole, name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Nome do cargo"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newJobRole.salary}
                        onChange={(e) => setNewJobRole({ ...newJobRole, salary: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={handleAddJobRole}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddJobForm(false);
                            setNewJobRole({ name: '', salary: '' });
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {jobRoles.map((jobRole) => (
                  <tr key={jobRole.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editingJobRole === jobRole.id ? (
                        <input
                          type="text"
                          value={tempJobRole.name}
                          onChange={(e) => setTempJobRole({ ...tempJobRole, name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{jobRole.role_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingJobRole === jobRole.id ? (
                        <input
                          type="number"
                          value={tempJobRole.salary}
                          onChange={(e) => setTempJobRole({ ...tempJobRole, salary: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                          step="0.01"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{formatCurrency(jobRole.base_salary)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {editingJobRole === jobRole.id ? (
                          <>
                            <button
                              onClick={() => handleSaveJobRole(jobRole.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingJobRole(null)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditJobRole(jobRole)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteJobRole(jobRole.id, jobRole.role_name)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Escalas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-900">Escalas de Trabalho</h3>
            <button
              onClick={() => setShowAddScaleForm(true)}
              className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Escala</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Pessoas</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Dias</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {showAddScaleForm && (
                  <tr className="bg-green-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={newScale.name}
                        onChange={(e) => setNewScale({ ...newScale, name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Ex: 12h segunda a sexta"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newScale.people}
                        onChange={(e) => setNewScale({ ...newScale, people: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-center"
                        placeholder="1.37"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={newScale.days}
                        onChange={(e) => setNewScale({ ...newScale, days: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-center"
                        placeholder="21.00"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={handleAddScale}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddScaleForm(false);
                            setNewScale({ name: '', people: '', days: '' });
                          }}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {workScales.map((scale) => (
                  <tr key={scale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editingScale === scale.id ? (
                        <input
                          type="text"
                          value={tempScale.name}
                          onChange={(e) => setTempScale({ ...tempScale, name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{scale.scale_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingScale === scale.id ? (
                        <input
                          type="number"
                          value={tempScale.people}
                          onChange={(e) => setTempScale({ ...tempScale, people: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-center"
                          step="0.01"
                        />
                      ) : (
                        <span className="text-gray-900">{scale.people_quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingScale === scale.id ? (
                        <input
                          type="number"
                          value={tempScale.days}
                          onChange={(e) => setTempScale({ ...tempScale, days: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-center"
                          step="0.01"
                        />
                      ) : (
                        <span className="text-gray-900">{scale.working_days}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {editingScale === scale.id ? (
                          <>
                            <button
                              onClick={() => handleSaveScale(scale.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingScale(null)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditScale(scale)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteScale(scale.id, scale.scale_name)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            💡 <strong>Dica:</strong> Pessoas = quantos funcionários necessários para cobrir a escala. 
            Dias = total de dias trabalhados no mês.
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Como usar estes parâmetros</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Cargos:</strong> Definem o salário base para cada função nos orçamentos</p>
          <p>• <strong>Escalas:</strong> Determinam quantas pessoas e dias são necessários</p>
          <p>• <strong>Cálculos:</strong> Estes valores são usados automaticamente nos 8 blocos de cada posto</p>
        </div>
      </div>
    </div>
  );
};