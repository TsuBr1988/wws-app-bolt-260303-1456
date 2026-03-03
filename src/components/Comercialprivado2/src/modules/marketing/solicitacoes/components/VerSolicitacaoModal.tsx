import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../../../../../../components/ui/use-toast';
import { supabase } from '../../../../lib/supabase';
import type { Solicitacao, SolicitacaoHistoricoItem } from '../types';
import { canRequestEditMarketingRequestWhenDone, getCurrentUserMeta } from '../permissions';

interface VerSolicitacaoModalProps {
  solicitacao: Solicitacao;
  canManage: boolean;
  onClose: () => void;
  onUpdated: (updated: Solicitacao) => void;
  onArchived: (id: string) => void;
  onReopened: (updated: Solicitacao) => void;
}

function safeHistorico(value: unknown): SolicitacaoHistoricoItem[] {
  if (!Array.isArray(value)) return [];
  return value as SolicitacaoHistoricoItem[];
}

const VerSolicitacaoModal: React.FC<VerSolicitacaoModalProps> = ({
  solicitacao,
  canManage,
  onClose,
  onUpdated,
  onArchived,
  onReopened,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  const isArchived = !!solicitacao.arquivado;

  const historico = useMemo(() => safeHistorico(solicitacao.historico), [solicitacao.historico]);

  const comentarios = useMemo(
    () => historico.filter((item) => !!item.comment?.trim()),
    [historico]
  );

  const historicoEventos = useMemo(
    () => historico.filter((item) => !item.comment?.trim() && item.action !== 'comentario'),
    [historico]
  );

  const canRequestEditWhenDone = useMemo(() => {
    if (isArchived) return false;
    if (solicitacao.status !== 'Feito') return false;
    return canRequestEditMarketingRequestWhenDone(solicitacao.departamento);
  }, [isArchived, solicitacao.departamento, solicitacao.status]);

  const canWriteComment = canManage || canRequestEditWhenDone;

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '-';
    }
  };

  const pushHistorico = (item: SolicitacaoHistoricoItem) => {
    return [...historico, item];
  };

  const updateSolicitacao = async (patch: Partial<Solicitacao>) => {
    const sb = supabase as any;
    const { data, error } = await sb
      .from('marketing_solicitacoes' as any)
      .update(patch)
      .eq('id', solicitacao.id)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      throw error || new Error('Falha ao atualizar solicitação');
    }

    onUpdated(data as Solicitacao);
  };

  const handleFazer = async () => {
    if (!canManage) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const item: SolicitacaoHistoricoItem = {
        at: now,
        action: 'fazer',
        from_status: solicitacao.status,
        to_status: 'Fazendo',
        by_name: userMeta.by_name,
        by_email: userMeta.by_email,
      };
      if (comment.trim()) item.comment = comment.trim();

      await updateSolicitacao({
        status: 'Fazendo',
        data_inicio: solicitacao.data_inicio || now,
        historico: pushHistorico(item),
      });
      toast({
        title: 'Status atualizado',
        description: 'Solicitação movida para "Fazendo".',
        variant: 'success',
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeito = async () => {
    if (!canManage) return;

    if (!comment.trim()) {
      toast({
        title: 'Comentário obrigatório',
        description: 'Informe um comentário antes de marcar como feito.',
        variant: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      await updateSolicitacao({
        status: 'Feito',
        data_conclusao: solicitacao.data_conclusao || now,
        historico: pushHistorico({
          at: now,
          action: 'feito',
          from_status: solicitacao.status,
          to_status: 'Feito',
          comment: comment.trim(),
          by_name: userMeta.by_name,
          by_email: userMeta.by_email,
        }),
      });

      toast({ title: 'Concluído', description: 'Solicitação marcada como "Feito".', variant: 'success' });
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
    if (!canManage) return;

    if (!comment.trim()) {
      toast({
        title: 'Comentário obrigatório',
        description: 'Informe um comentário antes de enviar para "Refação".',
        variant: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const item: SolicitacaoHistoricoItem = {
        at: now,
        action: 'refazer',
        from_status: solicitacao.status,
        to_status: 'Refação',
        by_name: userMeta.by_name,
        by_email: userMeta.by_email,
      };
      item.comment = comment.trim();

      await updateSolicitacao({
        status: 'Refação',
        data_conclusao: null,
        historico: pushHistorico(item),
      });

      toast({
        title: 'Status atualizado',
        description: 'Solicitação movida para "Refação".',
        variant: 'success',
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a solicitação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePedirEdicao = async () => {
    if (!canRequestEditWhenDone) return;

    if (!comment.trim()) {
      toast({
        title: 'Comentário obrigatório',
        description: 'Descreva o que precisa ser ajustado antes de pedir edição.',
        variant: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const item: SolicitacaoHistoricoItem = {
        at: now,
        action: 'refazer',
        from_status: solicitacao.status,
        to_status: 'Refação',
        by_name: userMeta.by_name,
        by_email: userMeta.by_email,
        comment: comment.trim(),
      };

      await updateSolicitacao({
        status: 'Refação',
        data_conclusao: null,
        historico: pushHistorico(item),
      });

      toast({
        title: 'Pedido enviado',
        description: 'Solicitação enviada para "Refação" para ajustes.',
        variant: 'success',
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro',
        description: 'Não foi possível pedir edição.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArquivar = async () => {
    if (!canManage) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const sb = supabase as any;
      const { error } = await sb
        .from('marketing_solicitacoes' as any)
        .update({
          arquivado: true,
          data_arquivamento: now,
          historico: pushHistorico({
            at: now,
            action: 'arquivar',
            from_status: solicitacao.status,
            to_status: solicitacao.status,
            comment: comment.trim() || undefined,
            by_name: userMeta.by_name,
            by_email: userMeta.by_email,
          }),
        })
        .eq('id', solicitacao.id);

      if (error) throw error;

      toast({
        title: 'Arquivado',
        description: 'Solicitação arquivada com sucesso.',
        variant: 'success',
      });
      onArchived(solicitacao.id);
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível arquivar.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReabrir = async () => {
    if (!canManage) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      const sb = supabase as any;
      const { data, error } = await sb
        .from('marketing_solicitacoes' as any)
        .update({
          arquivado: false,
          data_arquivamento: null,
          historico: pushHistorico({
            at: now,
            action: 'reabrir',
            from_status: solicitacao.status,
            to_status: solicitacao.status,
            comment: comment.trim() || undefined,
            by_name: userMeta.by_name,
            by_email: userMeta.by_email,
          }),
        })
        .eq('id', solicitacao.id)
        .select('*')
        .maybeSingle();

      if (error || !data) throw error || new Error('Falha ao reabrir');

      toast({ title: 'Reaberto', description: 'Solicitação reaberta.', variant: 'success' });
      onReopened(data as Solicitacao);
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível reabrir.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarComentario = async () => {
    if (!canManage) return;

    if (!comment.trim()) {
      toast({ title: 'Comentário vazio', description: 'Digite um comentário antes de salvar.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const userMeta = getCurrentUserMeta();

      await updateSolicitacao({
        historico: pushHistorico({
          at: now,
          action: 'comentario',
          from_status: solicitacao.status,
          to_status: solicitacao.status,
          comment: comment.trim(),
          by_name: userMeta.by_name,
          by_email: userMeta.by_email,
        }),
      });

      toast({ title: 'Comentário salvo', variant: 'success' });
      setComment('');
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro', description: 'Não foi possível salvar comentário.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Solicitação #{solicitacao.solicitacao_numero}</h2>
            <p className="text-gray-600 mt-1">{solicitacao.titulo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Detalhes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Tipo:</span><span className="font-medium">{solicitacao.tipo}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Departamento:</span><span className="font-medium">{solicitacao.departamento}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Prioridade:</span><span className="font-medium">{solicitacao.prioridade}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Pontos:</span><span className="font-medium">{solicitacao.pontos ?? 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className="font-medium">{solicitacao.status}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Abertura:</span><span className="font-medium">{formatDateTime(solicitacao.data_abertura)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Início:</span><span className="font-medium">{formatDateTime(solicitacao.data_inicio)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Conclusão:</span><span className="font-medium">{formatDateTime(solicitacao.data_conclusao)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Arquivado:</span><span className="font-medium">{isArchived ? formatDateTime(solicitacao.data_arquivamento) : '-'}</span></div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {solicitacao.descricao}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Solicitante</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-800">
              <div className="font-medium">{solicitacao.solicitante_nome}</div>
              <div className="text-gray-600">{solicitacao.solicitante_email}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Comentário</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={
                canManage
                  ? 'Adicionar comentário (obrigatório para Refação/Feito)'
                  : canRequestEditWhenDone
                    ? 'Explique o que precisa ser ajustado (obrigatório para pedir edição)'
                    : 'Apenas Marketing/Admin pode comentar'
              }
              disabled={!canWriteComment || loading}
            />
            {canManage && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleSalvarComentario}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Salvar comentário
                </button>
              </div>
            )}
            {!canManage && canRequestEditWhenDone && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handlePedirEdicao}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  Pedir edição
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Comentários</h3>
            <div className="space-y-2">
              {comentarios.length === 0 ? (
                <div className="text-sm text-gray-600">Sem comentários ainda.</div>
              ) : (
                [...comentarios].reverse().map((item, idx) => (
                  <div key={`${item.at}-${idx}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-600">
                      <small>
                        Por <b>{item.by_name ?? item.by_email ?? '-'}</b> às {formatDateTime(item.at)}
                        {item.from_status && item.to_status && item.from_status !== item.to_status ? (
                          <> <b>{item.from_status} → {item.to_status}</b></>
                        ) : null}
                      </small>
                    </div>
                    <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{item.comment}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Histórico</h3>
            <div className="space-y-2">
              {historicoEventos.length === 0 ? (
                <div className="text-sm text-gray-600">Sem histórico ainda.</div>
              ) : (
                [...historicoEventos].reverse().map((item, idx) => (
                  <div key={`${item.at}-${idx}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-600">
                      <small>
                        Por <b>{item.by_name ?? item.by_email ?? '-'}</b> às {formatDateTime(item.at)}{' '}
                        <b>
                          {(item.from_status ?? '-') + ' → ' + (item.to_status ?? '-')}
                        </b>
                      </small>
                    </div>
                    {item.comment && (
                      <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{item.comment}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
              {!isArchived && solicitacao.status === 'A fazer' && (
                <button
                  type="button"
                  onClick={handleFazer}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Marcar como Fazendo
                </button>
              )}

              {!isArchived && (solicitacao.status === 'Fazendo' || solicitacao.status === 'Refação') && (
                <button
                  type="button"
                  onClick={handleFeito}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Marcar como Feito
                </button>
              )}

              {!isArchived && solicitacao.status === 'Feito' && (
                <button
                  type="button"
                  onClick={handleRefazer}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  Refação
                </button>
              )}

              {!isArchived && solicitacao.status !== 'Refação' && (
                <button
                  type="button"
                  onClick={handleArquivar}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Arquivar
                </button>
              )}

              {isArchived && (
                <button
                  type="button"
                  onClick={handleReabrir}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Reabrir
                </button>
              )}
            </div>
          )}

          {!canManage && (
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
              Apenas usuários do Marketing (ou admin) podem mudar status/arquivar/comentar.
              {canRequestEditWhenDone && (
                <span> Para solicitações em "Feito", o Admin e o departamento solicitante podem pedir edição.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerSolicitacaoModal;
