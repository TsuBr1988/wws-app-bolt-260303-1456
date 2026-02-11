import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, X, History, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Politica {
  id: string;
  titulo: string;
  conteudo: string;
  versao: string;
  data_aprovacao: string;
  aprovado_por: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const PoliticaTab: React.FC = () => {
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingPolitica, setEditingPolitica] = useState<Politica | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    aprovado_por: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPoliticas();
  }, []);

  const loadPoliticas = async () => {
    try {
      const { data, error } = await supabase
        .from('qualidade_politica')
        .select('*')
        .order('data_aprovacao', { ascending: false });

      if (error) throw error;
      setPoliticas(data || []);
    } catch (error) {
      console.error('Erro ao carregar políticas:', error);
      toast({
        title: 'Erro ao carregar políticas',
        description: 'Não foi possível carregar as políticas da qualidade.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const incrementVersion = (currentVersion: string): string => {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0]) || 1;
    const minor = parseInt(parts[1]) || 0;
    return `${major}.${minor + 1}`;
  };

  const handleEdit = (politica: Politica) => {
    setEditingPolitica(politica);
    setFormData({
      titulo: politica.titulo,
      conteudo: politica.conteudo,
      aprovado_por: politica.aprovado_por
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPolitica(null);
    setFormData({
      titulo: '',
      conteudo: '',
      aprovado_por: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.conteudo || !formData.aprovado_por) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingPolitica) {
        const newVersion = incrementVersion(editingPolitica.versao);

        await supabase
          .from('qualidade_politica')
          .update({ ativo: false })
          .eq('ativo', true);

        const { error } = await supabase
          .from('qualidade_politica')
          .insert({
            titulo: formData.titulo,
            conteudo: formData.conteudo,
            aprovado_por: formData.aprovado_por,
            versao: newVersion,
            ativo: true
          });

        if (error) throw error;

        toast({
          title: 'Política atualizada',
          description: `Nova versão ${newVersion} criada com sucesso!`,
        });
      } else {
        const { error } = await supabase
          .from('qualidade_politica')
          .insert({
            titulo: formData.titulo,
            conteudo: formData.conteudo,
            aprovado_por: formData.aprovado_por,
            versao: '1.0',
            ativo: true
          });

        if (error) throw error;

        toast({
          title: 'Política criada',
          description: 'Política criada com sucesso!',
        });
      }

      setIsModalOpen(false);
      loadPoliticas();
    } catch (error) {
      console.error('Erro ao salvar política:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a política.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta política?')) return;

    try {
      const { error } = await supabase
        .from('qualidade_politica')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Política excluída',
        description: 'Política excluída com sucesso!',
      });
      loadPoliticas();
    } catch (error) {
      console.error('Erro ao excluir política:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a política.',
        variant: 'destructive',
      });
    }
  };

  const activePolitica = politicas.find(p => p.ativo);
  const historicPoliticas = politicas.filter(p => !p.ativo);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark mb-2">Política da Qualidade</h2>
          <p className="text-gray-600">Defina e mantenha a política da qualidade da organização</p>
        </div>
        <div className="flex gap-2">
          {historicPoliticas.length > 0 && (
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all shadow-sm hover:shadow-md"
            >
              <History className="w-5 h-5" />
              Histórico
            </button>
          )}
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nova Política
          </button>
        </div>
      </div>

      {activePolitica ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-6">
            <div className="p-4 gradient-seguranca rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-brand-dark mb-1">{activePolitica.titulo}</h3>
                  <p className="text-sm text-gray-500">
                    Versão {activePolitica.versao} | Aprovada em{' '}
                    {format(new Date(activePolitica.data_aprovacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {' '}por {activePolitica.aprovado_por}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(activePolitica)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(activePolitica.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="prose prose-slate max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {activePolitica.conteudo}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border-2 border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma política cadastrada</h3>
          <p className="text-gray-500 mb-6">Clique em "Nova Política" para criar a primeira política da qualidade.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-brand-dark">
                {editingPolitica ? 'Editar Política' : 'Nova Política'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {editingPolitica && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Ao salvar, será criada automaticamente a versão {incrementVersion(editingPolitica.versao)}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      A versão anterior será mantida no histórico
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Título da Política
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="Ex: Política da Qualidade 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Conteúdo da Política
                </label>
                <textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                  placeholder="Digite o conteúdo completo da política da qualidade..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Aprovado por
                </label>
                <input
                  type="text"
                  value={formData.aprovado_por}
                  onChange={(e) => setFormData({ ...formData, aprovado_por: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="Nome do aprovador"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-primary/90 transition-colors"
              >
                <Save className="w-5 h-5" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-brand-dark">Histórico de Versões</h3>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {historicPoliticas.map((politica) => (
                <div
                  key={politica.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-brand-dark">{politica.titulo}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Versão {politica.versao} | Aprovada em{' '}
                        {format(new Date(politica.data_aprovacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {' '}por {politica.aprovado_por}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                      HISTÓRICO
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 line-clamp-3">
                    {politica.conteudo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliticaTab;
