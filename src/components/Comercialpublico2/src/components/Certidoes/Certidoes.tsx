import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Calendar, FileText } from 'lucide-react';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from '../../hooks/useSupabase';
import { clearQueryCache } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { formatDateBR } from '../../utils/dateUtils';
import { useSystemVersion } from '../../contexts/SystemVersionContext';

interface Certidao {
  id: string;
  nome: string;
  data_vencimento_wws: string | null;
  data_vencimento_worldwide: string | null;
  created_at: string;
  updated_at: string;
}

export const Certidoes: React.FC = () => {
  const { canEdit } = useSystemVersion();
  const canEditCertidoes = canEdit('settings') || canEdit('proposals');
  
  const { data: certidoes = [], loading, refetch } = useSupabaseQuery('certidoes', {
    orderBy: { column: 'nome', ascending: true }
  });
  
  const { insert: insertCertidao, loading: insertLoading } = useSupabaseInsert('certidoes');
  const { update: updateCertidao, loading: updateLoading } = useSupabaseUpdate('certidoes');
  const { deleteRecord: deleteCertidao, loading: deleteLoading } = useSupabaseDelete('certidoes');
  
  const [showForm, setShowForm] = useState(false);
  const [editingCertidao, setEditingCertidao] = useState<Certidao | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    data_vencimento_wws: '',
    data_vencimento_worldwide: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      alert('Nome da certidão é obrigatório');
      return;
    }

    try {
      // Preparar dados para envio (converter strings vazias para null)
      const certidaoData = {
        nome: formData.nome.trim(),
        data_vencimento_wws: formData.data_vencimento_wws.trim() || null,
        data_vencimento_worldwide: formData.data_vencimento_worldwide.trim() || null
      };

      if (editingCertidao) {
        // **EDITAR CERTIDÃO EXISTENTE**
        console.log('✏️ [Certidões] Editando certidão:', {
          id: editingCertidao.id,
          nome: editingCertidao.nome,
          dadosAtuais: {
            nome: editingCertidao.nome,
            wws: editingCertidao.data_vencimento_wws,
            worldwide: editingCertidao.data_vencimento_worldwide
          },
          novosDados: certidaoData
        });
        
        // Verificar se houve mudança real nos dados
        const hasChanges = 
          certidaoData.nome !== editingCertidao.nome ||
          certidaoData.data_vencimento_wws !== editingCertidao.data_vencimento_wws ||
          certidaoData.data_vencimento_worldwide !== editingCertidao.data_vencimento_worldwide;
        
        console.log('🔍 [Certidões] Verificando mudanças:', {
          hasChanges,
          changes: {
            nome: certidaoData.nome !== editingCertidao.nome ? `${editingCertidao.nome} → ${certidaoData.nome}` : 'sem mudança',
            wws: certidaoData.data_vencimento_wws !== editingCertidao.data_vencimento_wws ? `${editingCertidao.data_vencimento_wws} → ${certidaoData.data_vencimento_wws}` : 'sem mudança',
            worldwide: certidaoData.data_vencimento_worldwide !== editingCertidao.data_vencimento_worldwide ? `${editingCertidao.data_vencimento_worldwide} → ${certidaoData.data_vencimento_worldwide}` : 'sem mudança'
          }
        });
        
        if (!hasChanges) {
          console.log('ℹ️ [Certidões] Nenhuma alteração detectada - dados são idênticos');
          alert('ℹ️ Nenhuma alteração foi feita. Os dados já estão atualizados!');
          resetForm();
          return;
        }
        
        // Verificar se o registro existe antes de tentar atualizar
        console.log('🔍 [Certidões] Verificando se o registro existe no Supabase...');
        const { data: existingRecord, error: checkError } = await supabase
          .from('certidoes')
          .select('*')
          .eq('id', editingCertidao.id)
          .single();
        
        if (checkError || !existingRecord) {
          console.error('❌ [Certidões] Registro não encontrado no Supabase:', {
            id: editingCertidao.id,
            checkError,
            existingRecord
          });
          alert(`❌ Erro: Registro não encontrado no banco de dados (ID: ${editingCertidao.id})`);
          return;
        }
        
        console.log('✅ [Certidões] Registro encontrado no Supabase:', existingRecord);
        
        // Tentar atualização via UPSERT para contornar possíveis problemas de RLS
        console.log('💾 [Certidões] Executando upsert no Supabase...');
        console.log('📊 [Certidões] Dados que serão enviados:', certidaoData);
        
        const { data: upsertResult, error: upsertError, count: upsertCount } = await supabase
          .from('certidoes')
          .upsert({ id: editingCertidao.id, ...certidaoData }, { onConflict: 'id' })
          .select('*');
        
        console.log('📊 [Certidões] Resultado do upsert:', {
          data: upsertResult,
          error: upsertError,
          count: upsertCount,
          hasData: !!upsertResult,
          dataLength: upsertResult ? upsertResult.length : 0
        });
        
        if (upsertError) {
          console.error('❌ [Certidões] Erro no upsert:', upsertError);
          throw upsertError;
        }
        
        if (!upsertResult || upsertResult.length === 0) {
          console.error('❌ [Certidões] Upsert não retornou dados');
          
          // Tentar UPDATE tradicional como fallback
          console.log('🔄 [Certidões] Tentando UPDATE tradicional como fallback...');
          const { data: updateResult, error: updateError, count } = await supabase
            .from('certidoes')
            .update(certidaoData)
            .eq('id', editingCertidao.id)
            .select('*');
          
          console.log('📊 [Certidões] Resultado do UPDATE fallback:', {
            data: updateResult,
            error: updateError,
            count,
            hasData: !!updateResult,
            dataLength: updateResult ? updateResult.length : 0
          });
          
          if (updateError) {
            console.error('❌ [Certidões] Erro no UPDATE fallback:', updateError);
            throw updateError;
          }
          
          if (count === 0) {
            console.error('❌ [Certidões] UPDATE fallback não afetou nenhum registro - possível problema de RLS');
          }
        }
      } else {
        // **CRIAR NOVA CERTIDÃO**
        console.log('🆕 [Certidões] Criando nova certidão:', certidaoData);
        
        // Tentar criação direta via Supabase (sem o hook)
        const { data: insertResult, error: insertError } = await supabase
          .from('certidoes')
          .insert(certidaoData)
          .select('*');
        
        if (insertError) {
          console.error('❌ [Certidões] Erro na criação direta:', insertError);
          throw insertError;
        }
        
        console.log('✅ [Certidões] Criação direta bem-sucedida:', insertResult);
        alert('✅ Certidão criada com sucesso!');
      }
      
      // **ATUALIZAR INTERFACE**
      console.log('🔄 [Certidões] Atualizando interface...');
      
      // Limpar cache e recarregar dados
      clearQueryCache('certidoes');
      await refetch();
      
      // Resetar formulário
      resetForm();
      
      console.log('🎉 [Certidões] Processo concluído com sucesso!');
    } catch (error) {
      console.error('❌ [Certidões] Erro ao salvar certidão:', error);
      alert(`❌ Erro ao salvar certidão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const resetForm = () => {
    console.log('🔄 [Certidões] Resetando formulário');
    setFormData({
      nome: '',
      data_vencimento_wws: '',
      data_vencimento_worldwide: ''
    });
    setShowForm(false);
    setEditingCertidao(null);
  };

  const handleEdit = (certidao: Certidao) => {
    console.log('✏️ [Certidões] Iniciando edição da certidão:', {
      id: certidao.id,
      nome: certidao.nome,
      wws: certidao.data_vencimento_wws,
      worldwide: certidao.data_vencimento_worldwide
    });
    
    setEditingCertidao(certidao);
    setFormData({
      nome: certidao.nome,
      data_vencimento_wws: certidao.data_vencimento_wws || '',
      data_vencimento_worldwide: certidao.data_vencimento_worldwide || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (certidaoId: string) => {
    const certidao = certidoes.find(c => c.id === certidaoId);
    const confirmMessage = `⚠️ CONFIRMAR EXCLUSÃO\n\nTem certeza que deseja excluir a certidão "${certidao?.nome}"?\n\nEsta ação não pode ser desfeita.\n\nDigite "EXCLUIR" para confirmar:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation === 'EXCLUIR') {
      try {
        console.log('🗑️ [Certidões] Iniciando exclusão:', {
          certidaoId,
          nome: certidao?.nome,
          confirmacao: confirmation
        });
        
        // Verificar se o ID existe antes de tentar excluir
        if (!certidaoId || certidaoId.trim() === '') {
          throw new Error('ID da certidão não encontrado ou inválido');
        }
        
        // Tentar exclusão direta no Supabase para diagnóstico
        console.log('🔍 [Certidões] Verificando se registro existe no banco...');
        const { data: existingRecord, error: checkError } = await supabase
          .from('certidoes')
          .select('*')
          .eq('id', certidaoId)
          .single();
        
        if (checkError || !existingRecord) {
          console.error('❌ [Certidões] Registro não encontrado no banco:', {
            id: certidaoId,
            checkError,
            existingRecord
          });
          throw new Error(`Certidão não encontrada no banco de dados (ID: ${certidaoId})`);
        }
        
        console.log('✅ [Certidões] Registro encontrado no banco:', existingRecord);
        
        // Excluir usando exclusão direta do Supabase para melhor controle de erro
        console.log('💾 [Certidões] Executando exclusão no Supabase...');
        const { error: deleteError, count } = await supabase
          .from('certidoes')
          .delete()
          .eq('id', certidaoId);
        
        console.log('📊 [Certidões] Resultado da exclusão:', {
          error: deleteError,
          count,
          hasError: !!deleteError,
          recordsAffected: count
        });
        
        if (deleteError) {
          console.error('❌ [Certidões] Erro do Supabase na exclusão:', {
            error: deleteError,
            errorMessage: deleteError.message,
            errorCode: deleteError.code,
            errorDetails: deleteError.details,
            errorHint: deleteError.hint,
            certidaoId
          });
          
          // Log específico para problemas de permissão ou RLS
          if (deleteError.message?.includes('permission') || deleteError.message?.includes('policy')) {
            console.error('🚫 [Certidões] Possível problema de RLS/Permissão na exclusão');
            throw new Error(`Erro de permissão: ${deleteError.message}. Verifique as políticas RLS da tabela certidoes.`);
          }
          
          throw new Error(deleteError.message || 'Erro desconhecido na exclusão');
        }
        
        // Verificar se a exclusão realmente afetou algum registro
        if (count === 0) {
          console.warn('⚠️ [Certidões] Nenhum registro foi excluído');
          throw new Error('Nenhum registro foi afetado pela exclusão. A certidão pode já ter sido removida.');
        }
        
        console.log(`✅ [Certidões] ${count} registro(s) excluído(s) com sucesso`);
        alert('✅ Certidão excluída com sucesso!');
        
        // Limpar cache e atualizar interface
        console.log('🧹 [Certidões] Limpando cache...');
        clearQueryCache('certidoes');
        
        console.log('🔄 [Certidões] Atualizando lista...');
        await refetch();
        
        console.log('🎉 [Certidões] Exclusão concluída com sucesso');
      } catch (error) {
        console.error('💥 [Certidões] Erro completo na exclusão:', {
          error,
          errorType: typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          certidaoId,
          nomeOriginal: certidao?.nome
        });
        
        let errorMessage = 'Erro desconhecido ao excluir certidão.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          const errorObj = error as any;
          if (errorObj.message) {
            errorMessage = errorObj.message;
          } else {
            errorMessage = JSON.stringify(error);
          }
        } else {
          errorMessage = String(error);
        }
        
        alert(`❌ Erro ao excluir certidão: ${errorMessage}\n\n🔍 Verifique o console do navegador (F12 > Console) para mais detalhes técnicos.`);
      }
    } else if (confirmation !== null) {
      alert('Exclusão cancelada. Digite exatamente "EXCLUIR" para confirmar.');
    }
  };

  const getDaysUntilExpiry = (date: string | null): number | null => {
    if (!date) return null;
    const today = new Date();
    const expiryDate = new Date(date);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (date: string | null) => {
    if (!date) return { color: 'text-gray-400', bg: 'bg-gray-50', status: 'Não definida' };
    
    const days = getDaysUntilExpiry(date);
    if (days === null) return { color: 'text-gray-400', bg: 'bg-gray-50', status: 'Não definida' };
    
    if (days < 0) return { color: 'text-red-600', bg: 'bg-red-50', status: `Vencida há ${Math.abs(days)} dias` };
    if (days === 0) return { color: 'text-red-600', bg: 'bg-red-50', status: 'Vence hoje!' };
    if (days <= 30) return { color: 'text-yellow-600', bg: 'bg-yellow-50', status: `${days} dias restantes` };
    if (days <= 60) return { color: 'text-blue-600', bg: 'bg-blue-50', status: `${days} dias restantes` };
    return { color: 'text-green-600', bg: 'bg-green-50', status: `${days} dias restantes` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Certidões...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Certidões</h1>
          <p className="text-gray-600">
            Gerencie os vencimentos das certidões para WWS e Worldwide
          </p>
        </div>
        {canEditCertidoes ? (
          <button
            onClick={() => setShowForm(true)}
            disabled={insertLoading || updateLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{insertLoading ? 'Criando...' : 'Nova Certidão'}</span>
          </button>
        ) : (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Modo Somente Leitura</span>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Certidões</p>
              <p className="text-2xl font-bold text-blue-600">{certidoes.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencendo em 30 dias (WWS)</p>
              <p className="text-2xl font-bold text-yellow-600">
                {certidoes.filter(c => {
                  const days = getDaysUntilExpiry(c.data_vencimento_wws);
                  return days !== null && days >= 0 && days <= 30;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencendo em 30 dias (Worldwide)</p>
              <p className="text-2xl font-bold text-yellow-600">
                {certidoes.filter(c => {
                  const days = getDaysUntilExpiry(c.data_vencimento_worldwide);
                  return days !== null && days >= 0 && days <= 30;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">
                {certidoes.filter(c => {
                  const daysWWS = getDaysUntilExpiry(c.data_vencimento_wws);
                  const daysWorldwide = getDaysUntilExpiry(c.data_vencimento_worldwide);
                  return (daysWWS !== null && daysWWS < 0) || (daysWorldwide !== null && daysWorldwide < 0);
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Certidões */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Vencimentos das Certidões</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700 border-b border-gray-200">
                  Nome da Certidão
                </th>
                <th className="text-center py-4 px-6 font-medium text-gray-700 border-b border-gray-200">
                  WWS
                </th>
                <th className="text-center py-4 px-6 font-medium text-gray-700 border-b border-gray-200">
                  Worldwide
                </th>
                {canEditCertidoes && (
                  <th className="text-center py-4 px-6 font-medium text-gray-700 border-b border-gray-200">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {certidoes.length > 0 ? (
                certidoes.map((certidao) => {
                  const wwsStatus = getExpiryStatus(certidao.data_vencimento_wws);
                  const worldwideStatus = getExpiryStatus(certidao.data_vencimento_worldwide);
                  
                  return (
                    <tr key={certidao.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 border-b border-gray-100">
                        <div className="font-medium text-gray-900">{certidao.nome}</div>
                      </td>
                      
                      <td className="py-4 px-6 border-b border-gray-100 text-center">
                        <div className={`${wwsStatus.bg} ${wwsStatus.color} px-3 py-2 rounded-lg inline-block min-w-[120px]`}>
                          {certidao.data_vencimento_wws ? (
                            <div>
                              <div className="font-medium">
                                {formatDateBR(certidao.data_vencimento_wws)}
                              </div>
                              <div className="text-xs">
                                {wwsStatus.status}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">Não definida</div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-4 px-6 border-b border-gray-100 text-center">
                        <div className={`${worldwideStatus.bg} ${worldwideStatus.color} px-3 py-2 rounded-lg inline-block min-w-[120px]`}>
                          {certidao.data_vencimento_worldwide ? (
                            <div>
                              <div className="font-medium">
                                {formatDateBR(certidao.data_vencimento_worldwide)}
                              </div>
                              <div className="text-xs">
                                {worldwideStatus.status}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm">Não definida</div>
                          )}
                        </div>
                      </td>
                      
                      {canEditCertidoes && (
                        <td className="py-4 px-6 border-b border-gray-100 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(certidao)}
                              disabled={updateLoading || insertLoading}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Editar certidão"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(certidao.id)}
                              disabled={deleteLoading || updateLoading || insertLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Excluir certidão"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canEditCertidoes ? 4 : 3} className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma certidão cadastrada</h3>
                    <p className="text-gray-500">
                      {canEditCertidoes 
                        ? 'Clique em "Nova Certidão" para começar a controlar os vencimentos'
                        : 'Não há certidões cadastradas no sistema'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal do Formulário */}
      {showForm && canEditCertidoes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCertidao ? 'Editar Certidão' : 'Nova Certidão'}
              </h2>
              <button
                onClick={resetForm}
                disabled={insertLoading || updateLoading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Certidão *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Certidão Negativa de Débitos Federais"
                  required
                  disabled={insertLoading || updateLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento - WWS
                </label>
                <input
                  type="date"
                  value={formData.data_vencimento_wws}
                  onChange={(e) => {
                    console.log('📅 [Formulário] Alterando data WWS:', e.target.value);
                    setFormData({ ...formData, data_vencimento_wws: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={insertLoading || updateLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento - Worldwide
                </label>
                <input
                  type="date"
                  value={formData.data_vencimento_worldwide}
                  onChange={(e) => {
                    console.log('📅 [Formulário] Alterando data Worldwide:', e.target.value);
                    setFormData({ ...formData, data_vencimento_worldwide: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={insertLoading || updateLoading}
                />
              </div>

              {/* Preview dos dados que serão salvos */}
              {(formData.data_vencimento_wws || formData.data_vencimento_worldwide) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Dados que serão salvos:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Nome:</strong> {formData.nome || 'Não informado'}</p>
                    {formData.data_vencimento_wws && (
                      <p><strong>WWS:</strong> {new Date(formData.data_vencimento_wws).toLocaleDateString('pt-BR')}</p>
                    )}
                    {formData.data_vencimento_worldwide && (
                      <p><strong>Worldwide:</strong> {new Date(formData.data_vencimento_worldwide).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={insertLoading || updateLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {insertLoading || updateLoading ? 'Salvando...' : (editingCertidao ? 'Atualizar' : 'Criar')}
                  </span>
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
    </div>
  );
};