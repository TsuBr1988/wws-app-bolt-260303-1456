import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useToast } from '../../../../../../../components/ui/use-toast';
import { supabase } from '../../../../lib/supabase';
import {
  SOLICITACAO_DEPARTAMENTOS,
  SOLICITACAO_PONTOS,
  SOLICITACAO_PRIORIDADES,
  SOLICITACAO_TIPOS,
} from '../solicitacoesConstants';
import type {
  MarketingSolicitacaoDepartamento,
  MarketingSolicitacaoPontos,
  MarketingSolicitacaoPrioridade,
  MarketingSolicitacaoTipo,
} from '../types';

interface AbrirSolicitacaoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AbrirSolicitacaoModal: React.FC<AbrirSolicitacaoModalProps> = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Postagens' as MarketingSolicitacaoTipo,
    departamento: '' as MarketingSolicitacaoDepartamento | '',
    prioridade: 'Média' as MarketingSolicitacaoPrioridade,
    pontos: null as MarketingSolicitacaoPontos | null,
    descricao: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.departamento || !formData.descricao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha Título, Departamento solicitante e Descrição.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const sb = supabase as any;

      const storedUser = localStorage.getItem('app_user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      const { error } = await sb
        .from('marketing_solicitacoes' as any)
        .insert([
          {
            titulo: formData.titulo.trim(),
            tipo: formData.tipo,
            departamento: formData.departamento,
            descricao: formData.descricao.trim(),
            prioridade: formData.prioridade,
            pontos: formData.pontos,
            status: 'A fazer',
            solicitante_nome: user?.name || 'Usuário',
            solicitante_email: user?.email || 'nao-informado@email.com',
            data_abertura: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      toast({
        title: 'Solicitação aberta com sucesso!',
        description: 'A solicitação foi registrada e está aguardando atendimento.',
        variant: 'success',
      });

      onSuccess();
      onClose();
    } catch (error) {
      const err = error as any;
      console.error('Erro ao criar solicitação:', err);

      const code = err?.code as string | undefined;
      const message = (err?.message as string | undefined) ?? '';
      const isMissingTable = code === '42P01' || message.includes('marketing_solicitacoes') || message.includes('does not exist');

      toast({
        title: 'Erro ao abrir solicitação',
        description: isMissingTable
          ? 'A tabela marketing_solicitacoes não existe no Supabase. Aplique a migration supabase/migrations/20260220120000_create_marketing_solicitacoes.sql e tente novamente.'
          : 'Não foi possível registrar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Postagens':
        return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'Materiais Físicos':
        return 'border-orange-500 bg-orange-50 text-orange-700';
      case 'Materiais Digitais':
        return 'border-purple-500 bg-purple-50 text-purple-700';
      default:
        return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Nova Solicitação</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Arte para post de campanha X"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SOLICITACAO_TIPOS.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo })}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                    formData.tipo === tipo
                      ? getTipoColor(tipo)
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  disabled={loading}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Departamento solicitante *</label>
              <select
                required
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value as MarketingSolicitacaoDepartamento })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Selecione...</option>
                {SOLICITACAO_DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as MarketingSolicitacaoPrioridade })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                {SOLICITACAO_PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pontuação Scrum</label>
            <div className="flex flex-wrap gap-2">
              {SOLICITACAO_PONTOS.map((ponto) => (
                <button
                  key={ponto}
                  type="button"
                  onClick={() => setFormData({ ...formData, pontos: ponto })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.pontos === ponto
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={loading}
                >
                  {ponto}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pontos: null })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.pontos == null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                N/A
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
            <textarea
              required
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              placeholder="Descreva o que precisa ser feito, referências, formatos, etc."
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Dicas para uma boa solicitação:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Seja específico no título</li>
                <li>Informe público-alvo e objetivo</li>
                <li>Inclua referências (link/arquivo) quando houver</li>
                <li>Explique o contexto e a urgência</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Abrindo...
                </>
              ) : (
                'Abrir Solicitação'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbrirSolicitacaoModal;
