import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
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
  Solicitacao,
  SolicitacaoHistoricoItem,
} from '../types';
import { getCurrentUserMeta } from '../permissions';

interface EditarSolicitacaoModalProps {
  solicitacao: Solicitacao;
  onClose: () => void;
  onUpdated: (updated: Solicitacao) => void;
}

function safeHistorico(value: unknown): SolicitacaoHistoricoItem[] {
  if (!Array.isArray(value)) return [];
  return value as SolicitacaoHistoricoItem[];
}

const EditarSolicitacaoModal: React.FC<EditarSolicitacaoModalProps> = ({ solicitacao, onClose, onUpdated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const historico = useMemo(() => safeHistorico(solicitacao.historico), [solicitacao.historico]);

  const [formData, setFormData] = useState({
    titulo: solicitacao.titulo,
    tipo: solicitacao.tipo as MarketingSolicitacaoTipo,
    departamento: solicitacao.departamento as MarketingSolicitacaoDepartamento,
    prioridade: solicitacao.prioridade as MarketingSolicitacaoPrioridade,
    pontos: (solicitacao.pontos ?? null) as MarketingSolicitacaoPontos | null,
    descricao: solicitacao.descricao,
  });

  useEffect(() => {
    setFormData({
      titulo: solicitacao.titulo,
      tipo: solicitacao.tipo,
      departamento: solicitacao.departamento,
      prioridade: solicitacao.prioridade,
      pontos: solicitacao.pontos ?? null,
      descricao: solicitacao.descricao,
    });
  }, [solicitacao]);

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
      const nowIso = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const patch: Partial<Solicitacao> & { historico?: any } = {
        titulo: formData.titulo.trim(),
        tipo: formData.tipo,
        departamento: formData.departamento,
        prioridade: formData.prioridade,
        pontos: formData.pontos,
        descricao: formData.descricao.trim(),
      };

      patch.historico = [
        ...historico,
        {
          at: nowIso,
          action: 'editar',
          from_status: solicitacao.status,
          to_status: solicitacao.status,
          ...userMeta,
        },
      ];

      const { data, error } = await sb
        .from('marketing_solicitacoes' as any)
        .update(patch)
        .eq('id', solicitacao.id)
        .select('*')
        .maybeSingle();

      if (error || !data) throw error || new Error('Falha ao atualizar');

      toast({ title: 'Atualizado', description: 'Solicitação atualizada com sucesso.', variant: 'success' });
      onUpdated(data as Solicitacao);
      onClose();
    } catch (error) {
      console.error('Erro ao editar solicitação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Editar Solicitação</h2>
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
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
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
              rows={6}
              disabled={loading}
            />
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarSolicitacaoModal;
