import React, { useState } from 'react';
import { X, Save, Calendar, User } from 'lucide-react';
import { Notificacao, SituacaoNotificacao } from '../../types/notificacao';
import { isoToLocalDateTime, localDateTimeToISO } from '../../utils/datetime';

interface NotificacaoFormProps {
  initial?: Partial<Notificacao>;
  onSubmit: (values: {
    cliente: string;
    assunto: string;
    detalhes?: string | null;
    data_recebimento: string;
    data_limite: string;
    situacao: SituacaoNotificacao;
  }) => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
}

export const NotificacaoForm: React.FC<NotificacaoFormProps> = ({ 
  initial, 
  onSubmit, 
  onCancel,
  title = 'Nova Notificação'
}) => {
  const [formData, setFormData] = useState({
    cliente: initial?.cliente ?? '',
    assunto: initial?.assunto ?? '',
    detalhes: initial?.detalhes ?? '',
    data_recebimento: initial?.data_recebimento ? isoToLocalDateTime(initial.data_recebimento) : '',
    data_limite: initial?.data_limite ? isoToLocalDateTime(initial.data_limite) : '',
    situacao: (initial?.situacao ?? 'A fazer') as SituacaoNotificacao
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente.trim() || !formData.assunto.trim()) {
      alert('Cliente e assunto são obrigatórios');
      return;
    }
    
    if (!formData.data_recebimento || !formData.data_limite) {
      alert('Datas de recebimento e limite são obrigatórias');
      return;
    }
    
    const dataRecebimento = new Date(formData.data_recebimento);
    const dataLimite = new Date(formData.data_limite);
    
    if (dataLimite <= dataRecebimento) {
      alert('Data limite deve ser posterior à data de recebimento');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        cliente: formData.cliente.trim(),
        assunto: formData.assunto.trim(),
        detalhes: formData.detalhes.trim() || null,
        data_recebimento: localDateTimeToISO(formData.data_recebimento),
        data_limite: localDateTimeToISO(formData.data_limite),
        situacao: formData.situacao
      });
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      alert('❌ Erro ao salvar notificação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">Controle de notificações e ofícios</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Ministério da Educação"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assunto *
              </label>
              <input
                type="text"
                value={formData.assunto}
                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Notificação para esclarecimentos"
                disabled={saving}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Recebimento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.data_recebimento}
                  onChange={(e) => setFormData({ ...formData, data_recebimento: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Limite para Resposta *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.data_limite}
                  onChange={(e) => setFormData({ ...formData, data_limite: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={formData.data_recebimento}
                  disabled={saving}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Data e hora limite para envio da resposta
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detalhes (Opcional)
            </label>
            <textarea
              value={formData.detalhes}
              onChange={(e) => setFormData({ ...formData, detalhes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes sobre a notificação, documentos necessários, observações..."
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Situação
            </label>
            <select
              value={formData.situacao}
              onChange={(e) => setFormData({ ...formData, situacao: e.target.value as SituacaoNotificacao })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              <option value="A fazer">A fazer</option>
              <option value="Feito">Feito</option>
              <option value="Não iremos responder">Não iremos responder</option>
            </select>
          </div>

          {/* Preview */}
          {formData.cliente && formData.assunto && formData.data_limite && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Preview da Notificação</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Cliente:</strong> {formData.cliente}</p>
                <p><strong>Assunto:</strong> {formData.assunto}</p>
                <p><strong>Recebido:</strong> {formData.data_recebimento ? new Date(formData.data_recebimento).toLocaleString('pt-BR') : 'Não informado'}</p>
                <p><strong>Limite:</strong> {formData.data_limite ? new Date(formData.data_limite).toLocaleString('pt-BR') : 'Não informado'}</p>
                <p><strong>Situação:</strong> {formData.situacao}</p>
                {formData.detalhes && (
                  <p><strong>Detalhes:</strong> {formData.detalhes.substring(0, 100)}...</p>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Notificação'}</span>
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};