import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { Chamado, ChamadoHistoricoItem } from '../types';

interface EditarChamadoModalProps {
  chamado: Chamado;
  onClose: () => void;
  onUpdated: (updated: Chamado) => void;
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

const EditarChamadoModal: React.FC<EditarChamadoModalProps> = ({ chamado, onClose, onUpdated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const historico = useMemo(() => safeHistorico(chamado.historico), [chamado.historico]);

  const [formData, setFormData] = useState({
    titulo: chamado.titulo || '',
    descricao: chamado.descricao || '',
    tipo: chamado.tipo,
    modulo: chamado.modulo || '',
    prioridade: chamado.prioridade,
    categoria: chamado.categoria,
    status: chamado.status,
    prazo_estimado: chamado.prazo_estimado ? new Date(chamado.prazo_estimado).toISOString().slice(0, 16) : '',
  });

  useEffect(() => {
    setFormData({
      titulo: chamado.titulo || '',
      descricao: chamado.descricao || '',
      tipo: chamado.tipo,
      modulo: chamado.modulo || '',
      prioridade: chamado.prioridade,
      categoria: chamado.categoria,
      status: chamado.status,
      prazo_estimado: chamado.prazo_estimado ? new Date(chamado.prazo_estimado).toISOString().slice(0, 16) : '',
    });
  }, [chamado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.modulo.trim() || !formData.descricao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha Título, Módulo e Descrição.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const now = new Date().toISOString();
      const nextStatus = formData.status as Chamado['status'];
      const userMeta = getCurrentUserMeta();

      const patch: any = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        modulo: formData.modulo.trim(),
        prioridade: formData.prioridade,
        categoria: formData.categoria,
        status: nextStatus,
        prazo_estimado: formData.prazo_estimado ? new Date(formData.prazo_estimado).toISOString() : null,
        historico: [
          ...historico,
          {
            at: now,
            action: 'editar',
            ...userMeta,
          } satisfies ChamadoHistoricoItem,
        ],
      };

      // Ajustar timestamps conforme status
      if (chamado.status !== nextStatus) {
        patch.historico = [
          ...patch.historico,
          {
            at: now,
            action: 'status',
            from_status: chamado.status,
            to_status: nextStatus,
            ...userMeta,
          } satisfies ChamadoHistoricoItem,
        ];

        if (nextStatus === 'Fazendo' && !chamado.data_inicio) {
          patch.data_inicio = now;
        }
        if (nextStatus === 'Feito' && !chamado.data_conclusao) {
          patch.data_conclusao = now;
        }
        if (chamado.status === 'Feito' && nextStatus !== 'Feito') {
          patch.data_conclusao = null;
        }
      }

      const { data, error } = await supabase
        .from('ti_chamados')
        .update(patch)
        .eq('id', chamado.id)
        .select('*')
        .maybeSingle();

      if (error || !data) throw error || new Error('Falha ao atualizar chamado');

      onUpdated(data as Chamado);
      toast({ title: 'Salvo', description: 'Chamado atualizado com sucesso.' });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o chamado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Estrutural':
        return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'Melhoria':
        return 'border-green-500 bg-green-50 text-green-700';
      case 'Correção':
        return 'border-orange-500 bg-orange-50 text-orange-700';
      default:
        return 'border-gray-300 bg-white text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 break-words">Editar Chamado #{chamado.chamado_numero}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {(['Estrutural', 'Melhoria', 'Correção'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: t })}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    formData.tipo === t
                      ? getTipoColor(t)
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Módulo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.modulo}
              onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="A fazer">A fazer</option>
                <option value="Fazendo">Fazendo</option>
                <option value="Feito">Feito</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Rede">Rede</option>
                <option value="Acesso">Acesso</option>
                <option value="Email">Email</option>
                <option value="Telefonia">Telefonia</option>
                <option value="Impressora">Impressora</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prazo de entrega</label>
              <input
                type="datetime-local"
                value={formData.prazo_estimado}
                onChange={(e) => setFormData({ ...formData, prazo_estimado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full min-h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarChamadoModal;
