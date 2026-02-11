import React, { useState } from 'react';
import { Plus, Calendar, Clock, User, FileText, Check, AlertCircle, ArrowRight, Edit, Save, X, Trash2, CheckSquare, RotateCcw } from 'lucide-react';
import { TarefaCard } from './TarefaCard';
import { TarefaForm } from './TarefaForm';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { useDepartment } from '../../contexts/DepartmentContext';
import { getDaysUntil, formatDateBR } from '../../utils/dateUtils';
import { clearQueryCache } from '../../hooks/useSupabase';

interface Tarefa {
  id: string;
  nome: string;
  descricao?: string;
  status: 'A fazer' | 'Fazendo' | 'Feito';
  data_inclusao: string;
  data_prazo: string;
  criado_por: string;
  responsavel: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export const Tarefas: React.FC = () => {
  const { selectedDepartment } = useDepartment();
  const canEditTarefas = true; // Permitir edição para todos
  
  const [showForm, setShowForm] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Tarefa>>({});

  // Buscar tarefas do banco
  const { data: tarefasData = [], loading, refetch } = useSupabaseQuery('tarefas', {
    orderBy: { column: 'data_prazo', ascending: true },
    includeDepartmentFilter: true
  });

  const { insert: insertTarefa, loading: insertLoading } = useSupabaseInsert('tarefas');
  const { update: updateTarefa, loading: updateLoading } = useSupabaseUpdate('tarefas');
  const { deleteRecord: deleteTarefa, loading: deleteLoading } = useSupabaseDelete('tarefas');

  // Buscar funcionários para o dropdown de responsável
  const { data: employees = [] } = useSupabaseQuery('employees');

  // Filtrar apenas tarefas não concluídas
  const tarefasPendentes = tarefasData.filter((tarefa: Tarefa) => tarefa.status !== 'Feito');

  // Filtrar apenas tarefas concluídas
  const tarefasFeitas = tarefasData.filter((tarefa: Tarefa) => tarefa.status === 'Feito');

  // Obter lista única de responsáveis
  const responsaveis = [...new Set(tarefasPendentes.map((tarefa: Tarefa) => tarefa.responsavel))];

  // Calcular estatísticas
  const stats = {
    total: tarefasPendentes.length,
    aFazer: tarefasPendentes.filter((t: Tarefa) => t.status === 'A fazer').length,
    fazendo: tarefasPendentes.filter((t: Tarefa) => t.status === 'Fazendo').length,
    vencidas: tarefasPendentes.filter((t: Tarefa) => {
      const diasRestantes = getDaysUntil(t.data_prazo);
      return diasRestantes < 0;
    }).length,
    vencendoHoje: tarefasPendentes.filter((t: Tarefa) => {
      const diasRestantes = getDaysUntil(t.data_prazo);
      return diasRestantes === 0;
    }).length
  };

  const handleCreateTarefa = async (formData: Omit<Tarefa, 'id' | 'created_at' | 'updated_at' | 'data_inclusao'>) => {
    try {
      await insertTarefa({
        ...formData,
        department: selectedDepartment
      });
      
      alert('✅ Tarefa criada com sucesso!');
      setShowForm(false);
      await refetch();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      alert(`❌ Erro ao criar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleUpdateStatus = async (tarefaId: string, newStatus: 'A fazer' | 'Fazendo' | 'Feito') => {
    try {
      console.log('🔄 Atualizando status da tarefa:', { tarefaId, newStatus });
      await updateTarefa(tarefaId, { status: newStatus });
      
      if (newStatus === 'Feito') {
        console.log('🎉 Tarefa marcada como concluída');
      }
      
      // Recarregar dados
      await refetch();
      
      if (newStatus === 'Feito') {
        alert('🎉 Tarefa concluída com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert(`❌ Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleEditStart = (tarefa: Tarefa) => {
    console.log('✏️ Iniciando edição da tarefa:', tarefa.nome);
    setEditingTask(tarefa.id);
    setEditFormData({
      nome: tarefa.nome,
      descricao: tarefa.descricao || '',
      data_prazo: tarefa.data_prazo.split('T')[0], // Converter para formato date
      responsavel: tarefa.responsavel
    });
    console.log('📋 Dados carregados para edição:', {
      nome: tarefa.nome,
      descricao: tarefa.descricao || '',
      data_prazo: tarefa.data_prazo.split('T')[0],
      responsavel: tarefa.responsavel
    });
  };

  const handleEditSave = async (tarefaId: string) => {
    // Verificar se ID é válido
    if (!tarefaId || tarefaId.trim() === '') {
      alert('❌ ID da tarefa inválido');
      return;
    }
    
    // Validações antes de salvar
    if (!editFormData.nome?.trim()) {
      alert('❌ Nome da tarefa é obrigatório');
      return;
    }
    
    if (!editFormData.responsavel?.trim()) {
      alert('❌ Responsável é obrigatório');
      return;
    }
    
    if (!editFormData.data_prazo) {
      alert('❌ Data de prazo é obrigatória');
      return;
    }
    
    console.log('💾 [Tarefas] Iniciando salvamento da tarefa:', {
      tarefaId,
      dadosAtuais: editFormData,
      camposObrigatorios: {
        nome: !!editFormData.nome?.trim(),
        responsavel: !!editFormData.responsavel?.trim(),
        data_prazo: !!editFormData.data_prazo
      }
    });

    // PASSO 1: Verificar se o registro existe antes de tentar atualizar
    console.log('🔍 [Tarefas] Verificando se tarefa existe no banco...');
    const { data: existingTask, error: checkError } = await supabase
      .from('tarefas')
      .select('*')
      .eq('id', tarefaId)
      .single();
    
    console.log('📋 [Tarefas] Resultado da verificação:', {
      existingTask,
      checkError,
      taskExists: !!existingTask,
      errorCode: checkError?.code,
      errorMessage: checkError?.message
    });
    
    if (checkError && checkError.code !== 'PGRST116') {
      alert(`❌ Erro ao verificar tarefa: ${checkError.message}`);
      return;
    }
    
    if (!existingTask) {
      alert(`❌ Tarefa não encontrada no banco de dados (ID: ${tarefaId})`);
      return;
    }
    
    console.log('✅ [Tarefas] Tarefa encontrada no banco:', existingTask);
    // Preparar dados para atualização (mapeamento correto das colunas)
    const updateData: any = {
      nome: editFormData.nome?.trim(),
      descricao: editFormData.descricao?.trim() || null,
      responsavel: editFormData.responsavel?.trim(),
      data_prazo: editFormData.data_prazo + 'T23:59:59.999Z'
    };

    console.log('📝 [Tarefas] Dados preparados para Supabase:', updateData);

    try {
      // PASSO 2: Executar atualização com verificação de resultado
      console.log('💾 [Tarefas] Executando atualização direta no Supabase...');
      const { data: result, error: updateError } = await supabase
        .from('tarefas')
        .update(updateData)
        .eq('id', tarefaId)
        .select('*');

      console.log('📊 [Tarefas] Resultado da atualização:', {
        data: result,
        error: updateError,
        hasData: !!result,
        recordsAffected: result?.length || 0,
        fullResult: result
      });

      if (updateError) {
        console.error('❌ [Tarefas] Erro do Supabase na atualização:', updateError);
        throw new Error(updateError.message || 'Erro desconhecido na atualização');
      }

      // PASSO 3: Verificar se a atualização foi bem-sucedida
      if (!result || result.length === 0) {
        console.error('❌ [Tarefas] UPDATE não retornou dados - possível problema de RLS ou dados inalterados');
        
        // Verificar se os dados realmente mudaram
        const hasChanges = 
          existingTask.nome !== updateData.nome ||
          existingTask.descricao !== updateData.descricao ||
          existingTask.responsavel !== updateData.responsavel ||
          existingTask.data_prazo !== updateData.data_prazo;
        
        if (!hasChanges) {
          console.log('ℹ️ [Tarefas] Nenhuma mudança detectada - dados já estão atualizados');
          alert('ℹ️ Nenhuma alteração foi feita. Os dados já estão atualizados!');
          setEditingTask(null);
          setEditFormData({});
          return;
        }
        
        // Se há mudanças mas não foi atualizado, é problema de RLS ou permissões
        throw new Error('Erro: Não foi possível atualizar. Verifique as permissões da tabela ou contate o administrador.');
      }

      console.log(`✅ [Tarefas] ${result.length} tarefa(s) atualizada(s) com sucesso`);
      alert('✅ Tarefa atualizada com sucesso!');
      
      // Limpar cache e atualizar dados
      clearQueryCache('tarefas');
      await refetch();
      
      // Resetar modo de edição
      setEditingTask(null);
      setEditFormData({});
      
    } catch (error) {
      console.error('💥 [Tarefas] Erro ao salvar tarefa:', error);
      alert(`❌ Erro ao salvar tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Manter dados de edição em caso de erro para o usuário tentar novamente
      console.log('🔄 [Tarefas] Mantendo dados de edição para nova tentativa');
    }
  };

  const handleEditCancel = () => {
    console.log('🚫 Cancelando edição da tarefa');
    setEditingTask(null);
    setEditFormData({});
  };

  const handleDelete = async (tarefaId: string) => {
    const tarefa = tarefasData.find((t: Tarefa) => t.id === tarefaId);
    const confirmMessage = `⚠️ CONFIRMAR EXCLUSÃO\n\nTem certeza que deseja excluir a tarefa "${tarefa?.nome}"?\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR') {
      try {
        // Verificar se ID é válido
        if (!tarefaId || tarefaId.trim() === '') {
          alert('❌ ID da tarefa inválido');
          return;
        }
        
        console.log('🗑️ [Tarefas] Iniciando exclusão da tarefa:', {
          tarefaId,
          nome: tarefa?.nome
        });
        
        // PASSO 1: Verificar se o registro existe
        console.log('🔍 [Tarefas] Verificando se tarefa existe antes de excluir...');
        const { data: existingTask, error: checkError } = await supabase
          .from('tarefas')
          .select('*')
          .eq('id', tarefaId)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ [Tarefas] Erro ao verificar existência:', checkError);
          throw new Error(`Erro ao verificar tarefa: ${checkError.message}`);
        }
        
        if (!existingTask) {
          console.error('❌ [Tarefas] Tarefa não encontrada para exclusão');
          throw new Error(`Tarefa não encontrada no banco de dados (ID: ${tarefaId})`);
        }
        
        console.log('✅ [Tarefas] Tarefa encontrada para exclusão:', existingTask.nome);
        
        // Usar exclusão direta do Supabase para melhor controle
        console.log('🗑️ [Tarefas] Executando exclusão no Supabase...');
        const { data: deletedResult, error: deleteError } = await supabase
          .from('tarefas')
          .delete()
          .eq('id', tarefaId)
          .select('*');
        
        console.log('📊 [Tarefas] Resultado da exclusão:', {
          data: deletedResult,
          error: deleteError,
          recordsAffected: deletedResult?.length || 0
        });
        
        if (deleteError) {
          console.error('❌ [Tarefas] Erro do Supabase na exclusão:', deleteError);
          throw new Error(deleteError.message || 'Erro desconhecido na exclusão');
        }
        
        if (!deletedResult || deletedResult.length === 0) {
          console.error('❌ [Tarefas] Nenhum registro foi excluído');
          throw new Error('Erro: Não foi possível excluir a tarefa. Verifique as permissões ou contate o administrador.');
        }
        
        console.log(`✅ [Tarefas] ${deletedResult.length} tarefa(s) excluída(s) com sucesso`);
        
        alert('✅ Tarefa excluída com sucesso!');
        clearQueryCache('tarefas');
        await refetch();
      } catch (error) {
        console.error('💥 [Tarefas] Erro na exclusão:', error);
        alert(`❌ Erro ao excluir tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const handleReopenTask = async (tarefaId: string) => {
    const tarefa = tarefasData.find((t: Tarefa) => t.id === tarefaId);
    const confirmMessage = `🔄 REABRIR TAREFA\n\nDeseja reabrir a tarefa "${tarefa?.nome}"?\n\nEla será marcada como "A fazer" novamente.\n\nConfirmar?`;
    
    if (confirm(confirmMessage)) {
      try {
        console.log('🔄 [Tarefas] Reabrindo tarefa:', { tarefaId, nome: tarefa?.nome });
        
        await updateTarefa(tarefaId, { status: 'A fazer' });
        
        console.log('✅ [Tarefas] Tarefa reaberta com sucesso');
        alert('✅ Tarefa reaberta com sucesso!');
        
        clearQueryCache('tarefas');
        await refetch();
      } catch (error) {
        console.error('💥 [Tarefas] Erro ao reabrir tarefa:', error);
        alert(`❌ Erro ao reabrir tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-gray-600">Gerencie suas tarefas e acompanhe o progresso</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Botão Tarefas Feitas */}
          <button
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showCompletedTasks 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span>Tarefas Feitas ({tarefasFeitas.length})</span>
          </button>
          
          {/* Botão Nova Tarefa */}
          {canEditTarefas && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Tarefa</span>
            </button>
          )}
        </div>
      </div>

      {/* Seção de Tarefas Feitas */}
      {showCompletedTasks && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-green-900 flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  <span>Tarefas Concluídas</span>
                </h2>
                <p className="text-sm text-green-700">
                  {tarefasFeitas.length} tarefa{tarefasFeitas.length !== 1 ? 's' : ''} concluída{tarefasFeitas.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowCompletedTasks(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar lista de tarefas feitas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {tarefasFeitas.length > 0 ? (
            <div className="space-y-4">
              {tarefasFeitas
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) // Mais recentes primeiro
                .map((tarefa: Tarefa) => (
                <div
                  key={tarefa.id}
                  className="border-l-4 border-l-green-600 bg-green-50 border-green-200 rounded-lg shadow-sm p-6 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex-1">{tarefa.nome}</h3>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">CONCLUÍDA</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span><strong>Responsável:</strong> {tarefa.responsavel}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span><strong>Prazo era:</strong> {formatDateBR(tarefa.data_prazo)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span><strong>Criado por:</strong> {tarefa.criado_por}</span>
                        </div>
                      </div>
                      
                      {tarefa.descricao && (
                        <div className="mt-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <strong className="text-sm text-gray-700">Descrição:</strong>
                          </div>
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-700">
                              {tarefa.descricao}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações para tarefas feitas */}
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t border-green-200">
                    <button
                      onClick={() => handleReopenTask(tarefa.id)}
                      disabled={updateLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{updateLoading ? 'Reabrindo...' : 'Reabrir'}</span>
                    </button>
                    
                    <button
                      onClick={() => handleDelete(tarefa.id)}
                      disabled={updateLoading || deleteLoading}
                      className="flex items-center space-x-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{deleteLoading ? 'Excluindo...' : 'Excluir'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa concluída</h3>
              <p className="text-gray-500">
                As tarefas marcadas como "Feito" aparecerão aqui
              </p>
            </div>
          )}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">A Fazer</p>
              <p className="text-2xl font-bold text-gray-900">{stats.aFazer}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fazendo</p>
              <p className="text-2xl font-bold text-blue-600">{stats.fazendo}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">{tarefasFeitas.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencendo Hoje</p>
              <p className="text-2xl font-bold text-orange-600">{stats.vencendoHoje}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board por Responsável */}
      {/* Lista de Tarefas - Layout Largo */}
      {!showCompletedTasks && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Tarefas Pendentes</h2>
            <p className="text-sm text-gray-600">
              Todas as tarefas pendentes organizadas por urgência
            </p>
          </div>
          
          {tarefasPendentes.length > 0 ? (
            <div className="space-y-4">
              {tarefasPendentes.map((tarefa: Tarefa) => (
                <div
                  key={tarefa.id}
                  className={`w-full border-l-4 rounded-lg shadow-sm p-6 transition-all ${
                    getDaysUntil(tarefa.data_prazo) < 0
                      ? 'border-l-red-600 bg-red-50 border-red-200'
                      : getDaysUntil(tarefa.data_prazo) === 0
                      ? 'border-l-orange-600 bg-orange-50 border-orange-200'
                      : getDaysUntil(tarefa.data_prazo) <= 2
                      ? 'border-l-yellow-600 bg-yellow-50 border-yellow-200'
                      : tarefa.status === 'Fazendo'
                      ? 'border-l-blue-600 bg-blue-50 border-blue-200'
                      : 'border-l-gray-400 bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Nome da Tarefa - Editável */}
                        {editingTask === tarefa.id ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editFormData.nome || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                              className="flex-1 text-lg font-bold bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Nome da tarefa"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <h3 className="text-lg font-bold text-gray-900 flex-1">{tarefa.nome}</h3>
                        )}
                        
                        {(() => {
                          const dias = getDaysUntil(tarefa.data_prazo);
                          if (dias < 0) return <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">VENCIDA</span>;
                          if (dias === 0) return <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">HOJE</span>;
                          if (dias === 1) return <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold">AMANHÃ</span>;
                          if (dias <= 3) return <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">URGENTE</span>;
                          return null;
                        })()}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 mb-4">
                        {/* Responsável - Editável */}
                        {editingTask === tarefa.id ? (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <strong>Responsável:</strong>
                            <select
                              value={editFormData.responsavel || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, responsavel: e.target.value })}
                              className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Selecione</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.name}>
                                  {emp.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span><strong>Responsável:</strong> {tarefa.responsavel}</span>
                          </div>
                        )}
                        
                        {/* Prazo - Editável */}
                        {editingTask === tarefa.id ? (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <strong>Prazo:</strong>
                            <input
                              type="date"
                              value={editFormData.data_prazo || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, data_prazo: e.target.value })}
                              className="bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span><strong>Prazo:</strong> {formatDateBR(tarefa.data_prazo)}</span>
                          </div>
                        )}
                        
                        {/* Criado por - Não editável */}
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span><strong>Criado por:</strong> {tarefa.criado_por}</span>
                        </div>
                      </div>
                      
                      {/* Descrição - Editável */}
                      <div className="mt-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <strong className="text-sm text-gray-700">Descrição:</strong>
                        </div>
                        {editingTask === tarefa.id ? (
                          <textarea
                            value={editFormData.descricao || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, descricao: e.target.value })}
                            rows={3}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Descrição da tarefa (opcional)"
                          />
                        ) : (
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-700">
                              {tarefa.descricao || 'Sem descrição'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          getDaysUntil(tarefa.data_prazo) < 0 ? 'text-red-600' :
                          getDaysUntil(tarefa.data_prazo) === 0 ? 'text-orange-600' :
                          getDaysUntil(tarefa.data_prazo) <= 2 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {(() => {
                            const dias = getDaysUntil(tarefa.data_prazo);
                            if (dias < 0) return `${Math.abs(dias)} dias`;
                            if (dias === 0) return 'Hoje';
                            if (dias === 1) return 'Amanhã';
                            return `${dias} dias`;
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getDaysUntil(tarefa.data_prazo) < 0 ? 'atrasada' : 'restantes'}
                        </div>
                      </div>
                      
                      {/* Status Dropdown */}
                      {editingTask !== tarefa.id && (
                        <div>
                          <select
                            value={tarefa.status}
                            onChange={(e) => handleUpdateStatus(tarefa.id, e.target.value as any)}
                            disabled={updateLoading}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              tarefa.status === 'A fazer' ? 'bg-gray-100 text-gray-700' :
                              tarefa.status === 'Fazendo' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            <option value="A fazer">A fazer</option>
                            <option value="Fazendo">Fazendo</option>
                            <option value="Feito">Feito</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                    {editingTask === tarefa.id ? (
                      <>
                        <button
                          onClick={() => handleEditSave(tarefa.id)}
                          disabled={updateLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{updateLoading ? 'Salvando...' : 'Salvar'}</span>
                        </button>
                        <button
                          onClick={handleEditCancel}
                          disabled={updateLoading}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Botão de editar */}
                        <button
                          onClick={() => handleEditStart(tarefa)}
                          disabled={updateLoading || deleteLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                        
                        {/* Botão de excluir */}
                        <button
                          onClick={() => handleDelete(tarefa.id)}
                          disabled={updateLoading || deleteLoading}
                          className="flex items-center space-x-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Excluir tarefa"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">{deleteLoading ? 'Excluindo...' : 'Excluir'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Status quando não está editando - movido para baixo dos botões */}
                  {editingTask === tarefa.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Status atual:</span>
                        <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          tarefa.status === 'A fazer' ? 'bg-gray-100 text-gray-700' :
                          tarefa.status === 'Fazendo' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {tarefa.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa cadastrada</h3>
              <p className="text-gray-500">
                {canEditTarefas 
                  ? 'Clique em "Nova Tarefa" para começar a organizar suas atividades'
                  : 'Não há tarefas cadastradas no sistema'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && canEditTarefas && (
        <TarefaForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateTarefa}
        />
      )}
    </div>
  );
};