import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { CHAMADO_ESTIMATIVAS, CHAMADO_MODULOS, type ChamadoEstimativa } from '../chamadosConstants';

interface AbrirChamadoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AbrirChamadoModal: React.FC<AbrirChamadoModalProps> = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Correção' as 'Estrutural' | 'Melhoria' | 'Correção',
    modulo: '' as string,
    descricao: '',
    prioridade: 'Média' as 'Baixa' | 'Média' | 'Alta' | 'Crítica',
    prazo_estimado: '',
    estimativa: 3 as ChamadoEstimativa,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.modulo.trim() || !formData.descricao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const storedUser = localStorage.getItem('app_user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      const { error } = await supabase
        .from('ti_chamados')
        .insert([
          {
            titulo: formData.titulo.trim(),
            tipo: formData.tipo,
            modulo: formData.modulo.trim(),
            descricao: formData.descricao.trim(),
            prioridade: formData.prioridade,
            // Compat: manter coluna existente sem expor no cadastro
            categoria: 'Software',
            status: 'A fazer',
            solicitante_nome: user?.name || 'Usuário',
            solicitante_email: user?.email || 'nao-informado@email.com',
            data_abertura: new Date().toISOString(),
            prazo_estimado: formData.prazo_estimado ? new Date(`${formData.prazo_estimado}T00:00:00`).toISOString() : null,
            estimativa: formData.estimativa,
          },
        ]);

      if (error) throw error;

      toast({
        title: 'Chamado aberto com sucesso!',
        description: 'O chamado foi registrado e está aguardando atendimento.',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      toast({
        title: 'Erro ao abrir chamado',
        description: 'Não foi possível registrar o chamado. Tente novamente.',
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
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Abrir Chamado</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Chamado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Erro ao acessar sistema de orçamentos"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Tipo - Botões estilo etiqueta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'Estrutural' })}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  formData.tipo === 'Estrutural'
                    ? getTipoColor('Estrutural')
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Estrutural
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'Melhoria' })}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  formData.tipo === 'Melhoria'
                    ? getTipoColor('Melhoria')
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Melhoria
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'Correção' })}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  formData.tipo === 'Correção'
                    ? getTipoColor('Correção')
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Correção
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.tipo === 'Estrutural' && 'Nova funcionalidade ou mudança grande no sistema'}
              {formData.tipo === 'Melhoria' && 'Aprimoramento de funcionalidade existente'}
              {formData.tipo === 'Correção' && 'Correção de problema ou bug existente'}
            </p>
          </div>

          {/* Módulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Módulo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.modulo}
              onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="" disabled>Selecione…</option>
              {CHAMADO_MODULOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
          </div>

          {/* Data de entrega + Estimativa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data de entrega</label>
              <input
                type="date"
                value={formData.prazo_estimado}
                onChange={(e) => setFormData({ ...formData, prazo_estimado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimativa</label>
              <div className="inline-flex w-full rounded-lg border border-gray-300 overflow-hidden">
                {CHAMADO_ESTIMATIVAS.map((v) => {
                  const active = formData.estimativa === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData({ ...formData, estimativa: v })}
                      className={`flex-1 px-3 py-2 text-sm font-semibold transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      aria-pressed={active}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">Opções: 1, 2, 3, 5, 8</p>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva detalhadamente o problema, melhoria ou nova funcionalidade..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Alerta informativo */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Dicas para um bom chamado:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Seja específico no título</li>
                <li>Descreva os passos para reproduzir o problema</li>
                <li>Inclua mensagens de erro, se houver</li>
                <li>Informe qual módulo está afetado</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
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
                'Abrir Chamado'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbrirChamadoModal;
