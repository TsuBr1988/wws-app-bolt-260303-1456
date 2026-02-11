import React, { useState } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { useSupabaseUpdate } from '../../hooks/useSupabase';
import { clearQueryCache } from '../../hooks/useSupabase';
import { ContractWithAddendums } from '../../types/contracts';
import { supabase } from '../../lib/supabase';

interface EditContractFormProps {
  contract: ContractWithAddendums;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditContractForm: React.FC<EditContractFormProps> = ({
  contract,
  onClose,
  onSuccess
}) => {
  const { update: updateContract, loading } = useSupabaseUpdate('contracts');

  // Log completo do contrato recebido
  console.log('🔍 [EditContractForm] Contrato recebido:', contract);
  console.log('🔍 [EditContractForm] Campos de reequilíbrio no contrato:', {
    reequilibrio_dissidio: contract.reequilibrio_dissidio,
    reequilibrio_ipca: contract.reequilibrio_ipca,
    hasReequilibrioFields: 'reequilibrio_dissidio' in contract,
    contractKeys: Object.keys(contract)
  });

  const [formData, setFormData] = useState({
    client_name: contract.client_name,
    city: contract.city || '',
    numero_pregao: contract.numero_pregao || '',
    numero_contrato: contract.numero_contrato || '',
    monthly_value: contract.monthly_value,
    start_date: contract.start_date,
    end_date: contract.end_date,
    contract_object: contract.contract_object,
    empresa: (contract as any).empresa || 'WWS',
    reequilibrio_dissidio: contract.reequilibrio_dissidio,
    reequilibrio_ipca: contract.reequilibrio_ipca,
    nao_gera_comissao: (contract as any).nao_gera_comissao || false,
    nao_conta_meta_comercial: (contract as any).nao_conta_meta_comercial || false
  });

  console.log('🔍 [EditContractForm] Estado inicial do formulário:', {
    reequilibrio_dissidio: formData.reequilibrio_dissidio,
    reequilibrio_ipca: formData.reequilibrio_ipca
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name.trim() || !formData.contract_object.trim()) {
      alert('Nome do cliente e objeto do contrato são obrigatórios');
      return;
    }

    if (formData.monthly_value <= 0) {
      alert('Valor mensal deve ser maior que zero');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      alert('Datas de início e fim são obrigatórias');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      alert('Data de término deve ser posterior à data de início');
      return;
    }

    try {
      console.log('🔄 Dados do formulário para atualização:', formData);
      console.log('📊 Contrato original:', contract);
      console.log('🎯 ID do contrato a ser atualizado:', contract.id);
      
      // Preparar dados de atualização com conversão explícita
      const updateData = {
        client_name: formData.client_name,
        city: formData.city || null, // Garantir que cidade vazia vire null
        numero_pregao: formData.numero_pregao || null,
        numero_contrato: formData.numero_contrato || null,
        monthly_value: formData.monthly_value,
        start_date: formData.start_date,
        end_date: formData.end_date,
        contract_object: formData.contract_object,
        empresa: formData.empresa,
        reequilibrio_dissidio: formData.reequilibrio_dissidio,
        reequilibrio_ipca: formData.reequilibrio_ipca
      };
      
      console.log('📝 Dados que serão enviados para o Supabase:', updateData);
      console.log('🏙️ Cidade específica sendo salva:', updateData.city);
      console.log('💰 Valor específico sendo salvo:', updateData.monthly_value);
      console.log('✅ Reequilíbrio Dissídio:', updateData.reequilibrio_dissidio);
      console.log('✅ Reequilíbrio IPCA:', updateData.reequilibrio_ipca);

      // Executar atualização com await explícito
      console.log('⏳ Iniciando atualização no Supabase...');
      const result = await updateContract(contract.id, updateData);

      console.log('✅ Contrato atualizado com sucesso no banco:', result);

      // Atualizar proposta vinculada se existir
      if (contract.proposal_id) {
        console.log('🔄 Atualizando proposta vinculada:', contract.proposal_id);
        const { error: proposalError } = await supabase
          .from('proposals')
          .update({
            nao_gera_comissao: formData.nao_gera_comissao,
            nao_conta_meta_comercial: formData.nao_conta_meta_comercial
          })
          .eq('id', contract.proposal_id);

        if (proposalError) {
          console.error('❌ Erro ao atualizar proposta:', proposalError);
        } else {
          console.log('✅ Proposta atualizada com sucesso');
        }
      }
      console.log('✅ Verificando campos de reequilíbrio salvos:', {
        reequilibrio_dissidio: result?.reequilibrio_dissidio,
        reequilibrio_ipca: result?.reequilibrio_ipca
      });

      // VERIFICAÇÃO ADICIONAL: Buscar dados diretamente do banco
      console.log('🔍 VERIFICAÇÃO IMEDIATA: Buscando dados do contrato recém-atualizado...');
      const { data: immediateCheck, error: immediateError } = await supabase
        .from('contracts')
        .select('reequilibrio_dissidio, reequilibrio_ipca')
        .eq('id', contract.id)
        .maybeSingle();

      if (immediateError) {
        console.error('❌ Erro na verificação imediata:', immediateError);
      } else {
        console.log('📋 Valores IMEDIATAMENTE após atualização:', immediateCheck);
        if (immediateCheck) {
          if (immediateCheck.reequilibrio_dissidio !== updateData.reequilibrio_dissidio) {
            console.error('🚨 PROBLEMA: reequilibrio_dissidio NÃO foi salvo!', {
              enviado: updateData.reequilibrio_dissidio,
              salvo: immediateCheck.reequilibrio_dissidio
            });
          }
          if (immediateCheck.reequilibrio_ipca !== updateData.reequilibrio_ipca) {
            console.error('🚨 PROBLEMA: reequilibrio_ipca NÃO foi salvo!', {
              enviado: updateData.reequilibrio_ipca,
              salvo: immediateCheck.reequilibrio_ipca
            });
          }
        }
      }
      
      // Verificar se dados foram realmente salvos
      if (result) {
        console.log('✅ Dados retornados pelo Supabase:', {
          id: result.id,
          client_name: result.client_name,
          city: result.city,
          monthly_value: result.monthly_value,
          start_date: result.start_date,
          end_date: result.end_date
        });
        
        // Verificar se a cidade foi realmente salva
        if (updateData.city && result.city !== updateData.city) {
          console.error('❌ PROBLEMA: Cidade não foi salva corretamente!', {
            enviadaCity: updateData.city,
            recebidaCity: result.city
          });
        } else {
          console.log('✅ Cidade salva corretamente:', result.city);
        }
      } else {
        console.error('❌ Nenhum dado retornado pelo Supabase!');
      }

      // Limpar cache para garantir dados atualizados
      console.log('🧹 Limpando cache...');
      clearQueryCache('contracts');
      clearQueryCache('contract_addendums');
      
      // Aguardar um pouco e verificar se dados foram persistidos
      console.log('⏳ Aguardando 2 segundos para verificar persistência...');
      setTimeout(async () => {
        try {
          // Verificar se os dados foram realmente salvos fazendo uma query direta
          console.log('🔍 Verificando se dados foram persistidos no banco...');
          
          // Força busca direta no Supabase
          const { data: verificationData, error: verificationError } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', contract.id)
            .single();
            
          if (verificationError) {
            console.error('❌ Erro ao verificar dados salvos:', verificationError);
          } else {
            console.log('🔍 Dados verificados no banco:', {
              id: verificationData.id,
              client_name: verificationData.client_name,
              city: verificationData.city,
              monthly_value: verificationData.monthly_value,
              updated_at: verificationData.updated_at
            });
            
            if (updateData.city && verificationData.city !== updateData.city) {
              console.error('🚨 GRAVE: Dados não foram persistidos corretamente no banco!');
              alert('❌ Erro: Os dados não foram salvos corretamente. Entre em contato com o suporte.');
            } else {
              console.log('✅ SUCESSO: Todos os dados foram persistidos corretamente!');
            }
          }
        } catch (err) {
          console.error('❌ Erro na verificação:', err);
        }
        
        // Recarregar página após verificação
        console.log('🔄 Recarregando página...');
        window.location.reload();
      }, 2000);

      alert('✅ Contrato atualizado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('💥 Erro detalhado ao atualizar contrato:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        errorStack: error instanceof Error ? error.stack : undefined,
        contractId: contract.id,
        formData,
        updateData: updateData || 'não criado'
      });
      alert(`❌ Erro ao atualizar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Calcular se houve mudanças
  const hasChanges =
    formData.client_name !== contract.client_name ||
    formData.city !== (contract.city || '') ||
    formData.monthly_value !== contract.monthly_value ||
    formData.start_date !== contract.start_date ||
    formData.end_date !== contract.end_date ||
    formData.contract_object !== contract.contract_object ||
    formData.empresa !== ((contract as any).empresa || 'WWS') ||
    formData.reequilibrio_dissidio !== contract.reequilibrio_dissidio ||
    formData.reequilibrio_ipca !== contract.reequilibrio_ipca;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Contrato</h2>
              <p className="text-sm text-gray-600">{contract.client_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Ministério da Educação"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <select
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="WWS">WWS</option>
                <option value="Worldwide">Worldwide</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade (Opcional)
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: São Paulo, Rio de Janeiro, Brasília..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Pregão (Opcional)
              </label>
              <input
                type="text"
                value={formData.numero_pregao}
                onChange={(e) => setFormData({ ...formData, numero_pregao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 001/2025, PE-001/2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Contrato (Opcional)
              </label>
              <input
                type="text"
                value={formData.numero_contrato}
                onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 123/2025, CT-456/2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mensal *
              </label>
              <input
                type="number"
                value={formData.monthly_value || ''}
                onChange={(e) => setFormData({ ...formData, monthly_value: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Término *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={formData.start_date}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objeto do Contrato *
            </label>
            <textarea
              value={formData.contract_object}
              onChange={(e) => setFormData({ ...formData, contract_object: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o objeto/serviço do contrato..."
              required
            />
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Lembretes de Reequilíbrio</h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reequilibrio_dissidio}
                  onChange={(e) => setFormData({ ...formData, reequilibrio_dissidio: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Reequilíbrio Dissídio</span>
                  <p className="text-xs text-gray-500 mt-0.5">Lembrete anual todo dia 10 de janeiro</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reequilibrio_ipca}
                  onChange={(e) => setFormData({ ...formData, reequilibrio_ipca: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Reequilíbrio IPCA 12 meses</span>
                  <p className="text-xs text-gray-500 mt-0.5">Lembrete 10 meses após o início, depois anualmente</p>
                </div>
              </label>
            </div>
          </div>

          {/* Configurações de Meta Comercial */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Configurações de Meta Comercial</h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer bg-orange-50 border border-orange-200 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={formData.nao_gera_comissao}
                  onChange={(e) => setFormData({ ...formData, nao_gera_comissao: e.target.checked })}
                  className="mt-1 w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-orange-900">Não gera comissão nem conta para meta comercial</span>
                  <p className="text-xs text-orange-700 mt-0.5">Para contratos especiais que não devem gerar comissão nem contribuir para as metas comerciais</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={formData.nao_conta_meta_comercial}
                  onChange={(e) => setFormData({ ...formData, nao_conta_meta_comercial: e.target.checked })}
                  className="mt-1 w-4 h-4 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-yellow-900">Não conta para meta comercial</span>
                  <p className="text-xs text-yellow-700 mt-0.5">Gera comissão normalmente, mas não conta para as metas comerciais do dashboard</p>
                </div>
              </label>
            </div>
          </div>

          {/* Resumo do Contrato */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Resumo das Alterações</h3>
            <div className="text-sm text-blue-600 space-y-1">
              <p><strong>Cliente:</strong> {formData.client_name || 'Não informado'}</p>
              <p><strong>Cidade:</strong> {formData.city || 'Não informada'}</p>
              <p><strong>Valor Mensal:</strong> {formData.monthly_value > 0 ? `R$ ${formData.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}</p>
              <p><strong>Período:</strong> {formData.start_date ? new Date(formData.start_date).toLocaleDateString('pt-BR') : '?'} até {formData.end_date ? new Date(formData.end_date).toLocaleDateString('pt-BR') : '?'}</p>
              {formData.start_date && formData.end_date && (
                <p><strong>Duração:</strong> {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44))} meses aproximadamente</p>
              )}
            </div>
          </div>

          {/* Informações sobre Aditivos */}
          {contract.addendums.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Informação Importante</h3>
              <p className="text-sm text-yellow-700">
                Este contrato possui <strong>{contract.addendums.length} aditivo{contract.addendums.length > 1 ? 's' : ''}</strong>. 
                As alterações aqui afetam apenas o contrato original. O valor e data de término atuais continuarão sendo do aditivo mais recente.
              </p>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};