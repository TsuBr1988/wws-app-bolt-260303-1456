import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { Chamado, ChamadoHistoricoItem } from '../types';

interface VerChamadoModalProps {
  chamado: Chamado;
  onClose: () => void;
  onUpdated: (updated: Chamado) => void;
  onArchived: (id: string) => void;
  initialReopenMode?: boolean;
}

function safeHistorico(value: unknown): ChamadoHistoricoItem[] {
  if (!Array.isArray(value)) return [];
  return value as ChamadoHistoricoItem[];
}

function getCurrentUserMeta() {
  try {
    const storedUser = localStorage.getItem('app_user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    return {
      by_name: user?.name as string | undefined,
      by_email: user?.email as string | undefined,
    };
  } catch {
    return { by_name: undefined, by_email: undefined };
  }
}

const VerChamadoModal: React.FC<VerChamadoModalProps> = ({ chamado, onClose, onUpdated, onArchived, initialReopenMode }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [reopenMode, setReopenMode] = useState(!!initialReopenMode);

  const isArchived = !!chamado.arquivado;

  const historico = useMemo(() => safeHistorico(chamado.historico), [chamado.historico]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleString('pt-BR');
    } catch {
      return '-';
    }
  };

  const pushHistorico = (item: ChamadoHistoricoItem) => {
    return [...historico, item];
  };

  const updateChamado = async (patch: Partial<Chamado>) => {
    const { data, error } = await supabase
      .from('ti_chamados')
      .update(patch)
      .eq('id', chamado.id)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      throw error || new Error('Falha ao atualizar chamado');
    }

    onUpdated(data as Chamado);
  };

  const handleFazer = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const item: ChamadoHistoricoItem = {
        at: now,
        action: 'fazer',
        from_status: chamado.status,
        to_status: 'Fazendo',
        ...userMeta,
      };
      if (comment.trim()) item.comment = comment.trim();

      await updateChamado({
        status: 'Fazendo',
        data_inicio: chamado.data_inicio || now,
        historico: pushHistorico(item),
      });
      toast({ title: 'Status atualizado', description: 'Chamado movido para "Fazendo".' });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o chamado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeito = async () => {
    if (!comment.trim()) {
      toast({
        title: 'Comentário obrigatório',
        description: 'Informe um comentário antes de marcar como feito.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();
      await updateChamado({
        status: 'Feito',
        data_conclusao: chamado.data_conclusao || now,
        historico: pushHistorico({
          at: now,
          action: 'feito',
          from_status: chamado.status,
          to_status: 'Feito',
          comment: comment.trim(),
          ...userMeta,
        }),
      });
      toast({ title: 'Concluído', description: 'Chamado marcado como "Feito".' });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como feito.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefazer = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const item: ChamadoHistoricoItem = {
        at: now,
        action: 'refazer',
        from_status: chamado.status,
        to_status: 'A fazer',
        ...userMeta,
      };
      if (comment.trim()) item.comment = comment.trim();

      await updateChamado({
        status: 'A fazer',
        data_conclusao: null as any,
        historico: pushHistorico(item),
      });

      toast({ title: 'Status atualizado', description: 'Chamado movido para "A fazer".' });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível refazer o chamado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConcluir = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const item: ChamadoHistoricoItem = {
        at: now,
        action: 'concluir',
        from_status: chamado.status,
        to_status: chamado.status,
        ...userMeta,
      };
      if (comment.trim()) item.comment = comment.trim();

      const { error } = await supabase
        .from('ti_chamados')
        .update({
          arquivado: true,
          data_arquivamento: now,
          historico: pushHistorico(item),
        })
        .eq('id', chamado.id);

      if (error) throw error;

      toast({ title: 'Arquivado', description: 'Chamado arquivado com sucesso.' });
      onArchived(chamado.id);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível arquivar o chamado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarComentario = async () => {
    if (!comment.trim()) {
      toast({
        title: 'Comentário vazio',
        description: 'Digite um comentário antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();
      await updateChamado({
        historico: pushHistorico({
          at: now,
          action: 'comentario',
          comment: comment.trim(),
          from_status: chamado.status,
          to_status: chamado.status,
          ...userMeta,
        }),
      });
      setComment('');
      toast({ title: 'Comentário salvo', description: 'Comentário adicionado ao histórico.' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReabrir = async () => {
    if (!comment.trim()) {
      toast({
        title: 'Comentário obrigatório',
        description: 'Informe um comentário para reabrir o chamado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      await updateChamado({
        arquivado: false,
        data_arquivamento: null as any,
        status: 'A fazer',
        data_inicio: null as any,
        data_conclusao: null as any,
        historico: pushHistorico({
          at: now,
          action: 'reabrir',
          from_status: chamado.status,
          to_status: 'A fazer',
          comment: comment.trim(),
          ...userMeta,
        }),
      });

      toast({ title: 'Reaberto', description: 'Chamado reaberto e movido para "A fazer".' });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reabrir o chamado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 break-words">Chamado #{chamado.chamado_numero}</h2>
            <p className="text-sm text-gray-600 whitespace-normal break-words">{chamado.titulo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isArchived && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-800 font-medium">Este chamado está arquivado.</p>
              <p className="text-xs text-gray-600 mt-1">Você pode reabrir com comentário, ou apenas consultar o histórico.</p>

              {!reopenMode ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setReopenMode(true)}
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reabrir
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-gray-600">Informe um comentário e salve para reabrir.</p>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-medium text-gray-900">{chamado.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prioridade</p>
              <p className="text-sm font-medium text-gray-900">{chamado.prioridade}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prazo de entrega</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(chamado.prazo_estimado)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Criado em</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(chamado.data_abertura)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Entregue em</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(chamado.data_conclusao)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Módulo</p>
              <p className="text-sm font-medium text-gray-900 whitespace-normal break-words">{chamado.modulo}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Descrição</p>
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words bg-gray-50 border border-gray-200 rounded-lg p-4">
              {chamado.descricao}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Comentário</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                chamado.status === 'Fazendo'
                  ? 'Descreva o que foi feito...'
                  : chamado.status === 'Feito'
                    ? 'Adicionar comentário (opcional)'
                    : 'Adicionar comentário (opcional)'
              }
              className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {historico.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Histórico</p>
              <div className="space-y-2">
                {historico
                  .slice()
                  .reverse()
                  .map((h, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className="text-sm font-medium text-gray-900">{h.action}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(h.at)}</p>
                      </div>
                      {(h.action === 'comentario' || !!h.comment) && (h.by_name || h.by_email) && (
                        <p className="text-xs text-gray-600 mt-1">Por: {h.by_name || h.by_email}</p>
                      )}
                      {(h.from_status || h.to_status) && (
                        <p className="text-xs text-gray-600 mt-1">
                          {h.from_status || '-'} → {h.to_status || '-'}
                        </p>
                      )}
                      {h.comment && (
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mt-2">{h.comment}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleSalvarComentario}
              disabled={loading || !comment.trim()}
              className="w-full sm:w-auto bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar comentário
            </button>

            {isArchived && reopenMode && (
              <button
                onClick={handleReabrir}
                disabled={loading || !comment.trim()}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar e reabrir
              </button>
            )}

            {!isArchived && chamado.status === 'A fazer' && (
              <button
                onClick={handleFazer}
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fazer
              </button>
            )}

            {!isArchived && chamado.status === 'Fazendo' && (
              <button
                onClick={handleFeito}
                disabled={loading}
                className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Feito
              </button>
            )}

            {!isArchived && chamado.status === 'Feito' && (
              <>
                <button
                  onClick={handleRefazer}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Refazer
                </button>
                <button
                  onClick={handleConcluir}
                  disabled={loading}
                  className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Concluir
                </button>
              </>
            )}

            <button
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerChamadoModal;
