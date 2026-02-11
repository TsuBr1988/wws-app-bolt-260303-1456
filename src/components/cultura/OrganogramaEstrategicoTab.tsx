import { useState, useEffect } from 'react';
import { Target, FileImage, ArrowLeft, Crosshair, ListChecks, Sparkles, Edit2, Save, X, Settings } from 'lucide-react';
import BSCView from './BSCView';
import PlanoEstrategicoView from './PlanoEstrategicoView';
import OKRView from './OKRView';
import MetasDepartamentosView from './MetasDepartamentosView';
import FlywheelView from './FlywheelView';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'menu' | 'bsc' | 'flywheel' | 'plano-estrategico' | 'okr' | 'metas-departamentos';

interface StrategicPlanData {
  id: string;
  main_title: string | null;
  main_text: string | null;
  pilar1: string | null;
  pilar2: string | null;
  pilar3: string | null;
  pilar4: string | null;
  pilar5: string | null;
  pilar1_description: string | null;
  pilar2_description: string | null;
  pilar3_description: string | null;
  pilar4_description: string | null;
  pilar5_description: string | null;
}

export default function OrganogramaEstrategicoTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planData, setPlanData] = useState<StrategicPlanData | null>(null);
  const { toast } = useToast();
  const { canEditIndicator } = useAuth();

  const canEdit = canEditIndicator('cultura', 'Organograma Estratégico');

  const [formData, setFormData] = useState({
    main_title: 'Texto Principal',
    main_text: '',
    pilar1: 'Pilar 1',
    pilar2: 'Pilar 2',
    pilar3: 'Pilar 3',
    pilar4: 'Pilar 4',
    pilar5: 'Pilar 5',
    pilar1_description: '',
    pilar2_description: '',
    pilar3_description: '',
    pilar4_description: '',
    pilar5_description: '',
  });

  useEffect(() => {
    if (viewMode === 'menu') {
      loadPlanData();
    }
  }, [viewMode]);

  const loadPlanData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('strategic_plan')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPlanData(data);
        setFormData({
          main_title: data.main_title || 'Texto Principal',
          main_text: data.main_text || '',
          pilar1: data.pilar1 || 'Pilar 1',
          pilar2: data.pilar2 || 'Pilar 2',
          pilar3: data.pilar3 || 'Pilar 3',
          pilar4: data.pilar4 || 'Pilar 4',
          pilar5: data.pilar5 || 'Pilar 5',
          pilar1_description: data.pilar1_description || '',
          pilar2_description: data.pilar2_description || '',
          pilar3_description: data.pilar3_description || '',
          pilar4_description: data.pilar4_description || '',
          pilar5_description: data.pilar5_description || '',
        });
      }
    } catch (error) {
      console.error('Error loading strategic plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        main_title: formData.main_title || null,
        main_text: formData.main_text || null,
        pilar1: formData.pilar1 || null,
        pilar2: formData.pilar2 || null,
        pilar3: formData.pilar3 || null,
        pilar4: formData.pilar4 || null,
        pilar5: formData.pilar5 || null,
        pilar1_description: formData.pilar1_description || null,
        pilar2_description: formData.pilar2_description || null,
        pilar3_description: formData.pilar3_description || null,
        pilar4_description: formData.pilar4_description || null,
        pilar5_description: formData.pilar5_description || null,
        updated_at: new Date().toISOString(),
      };

      if (planData?.id) {
        const { error } = await supabase
          .from('strategic_plan')
          .update(dataToSave)
          .eq('id', planData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('strategic_plan')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await loadPlanData();
      setEditMode(false);

      toast({
        title: 'Sucesso',
        description: 'Plano estratégico salvo com sucesso.',
      });
    } catch (error) {
      console.error('Error saving strategic plan:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o plano estratégico.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (planData) {
      setFormData({
        main_title: planData.main_title || 'Texto Principal',
        main_text: planData.main_text || '',
        pilar1: planData.pilar1 || 'Pilar 1',
        pilar2: planData.pilar2 || 'Pilar 2',
        pilar3: planData.pilar3 || 'Pilar 3',
        pilar4: planData.pilar4 || 'Pilar 4',
        pilar5: planData.pilar5 || 'Pilar 5',
        pilar1_description: planData.pilar1_description || '',
        pilar2_description: planData.pilar2_description || '',
        pilar3_description: planData.pilar3_description || '',
        pilar4_description: planData.pilar4_description || '',
        pilar5_description: planData.pilar5_description || '',
      });
    }
    setEditMode(false);
  };

  if (viewMode === 'bsc') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all text-brand-dark font-medium bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao menu
        </button>
        <BSCView />
      </div>
    );
  }

  if (viewMode === 'flywheel') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all text-brand-dark font-medium bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao menu
        </button>
        <FlywheelView />
      </div>
    );
  }

  if (viewMode === 'plano-estrategico') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all text-brand-dark font-medium bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao menu
        </button>
        <PlanoEstrategicoView />
      </div>
    );
  }

  if (viewMode === 'okr') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all text-brand-dark font-medium bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao menu
        </button>
        <OKRView />
      </div>
    );
  }

  if (viewMode === 'metas-departamentos') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:shadow-md transition-all text-brand-dark font-medium bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao menu
        </button>
        <MetasDepartamentosView />
      </div>
    );
  }

  if (loading && viewMode === 'menu') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4 relative mb-8">
        <div className="absolute inset-0 gradient-2ws opacity-10 rounded-2xl blur-3xl"></div>
        <h2 className="text-3xl font-bold text-brand-dark mb-2 relative">Plano Estratégico</h2>
        <p className="text-gray-600 font-medium relative">Selecione uma opção para visualizar</p>
      </div>

      <div className="flex gap-6">
        <div className="w-2/3">
          <div className="bg-white rounded-xl p-8 border-2 border-gray-200 shadow-lg h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              {editMode ? (
                <input
                  type="text"
                  className="text-2xl font-bold text-brand-dark bg-transparent border-b-2 border-blue-500 focus:outline-none flex-1 mr-4"
                  value={formData.main_title}
                  onChange={(e) => setFormData({ ...formData, main_title: e.target.value })}
                  placeholder="Digite o título..."
                />
              ) : (
                <h3 className="text-2xl font-bold text-brand-dark">{formData.main_title}</h3>
              )}
              {canEdit && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
              )}
              {editMode && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 mb-6">
              {editMode ? (
                <textarea
                  className="w-full h-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={formData.main_text}
                  onChange={(e) => setFormData({ ...formData, main_text: e.target.value })}
                  placeholder="Digite o texto principal do plano estratégico..."
                />
              ) : (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {formData.main_text || 'Nenhum texto adicionado ainda. Clique em "Editar" para adicionar.'}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-brand-dark mb-4">Pilares Estratégicos</h4>
              <div className="space-y-4">
                {[
                  { key: 'pilar1', descKey: 'pilar1_description', bgClass: 'bg-gradient-to-r from-blue-50 to-blue-100', borderClass: 'border-blue-200', circleClass: 'bg-blue-500' },
                  { key: 'pilar2', descKey: 'pilar2_description', bgClass: 'bg-gradient-to-r from-green-50 to-green-100', borderClass: 'border-green-200', circleClass: 'bg-green-500' },
                  { key: 'pilar3', descKey: 'pilar3_description', bgClass: 'bg-gradient-to-r from-purple-50 to-purple-100', borderClass: 'border-purple-200', circleClass: 'bg-purple-500' },
                  { key: 'pilar4', descKey: 'pilar4_description', bgClass: 'bg-gradient-to-r from-orange-50 to-orange-100', borderClass: 'border-orange-200', circleClass: 'bg-orange-500' },
                  { key: 'pilar5', descKey: 'pilar5_description', bgClass: 'bg-gradient-to-r from-red-50 to-red-100', borderClass: 'border-red-200', circleClass: 'bg-red-500' },
                ].map((pilar, index) => (
                  <div
                    key={pilar.key}
                    className={`${pilar.bgClass} rounded-lg p-4 border ${pilar.borderClass} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 ${pilar.circleClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        {editMode ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              className="w-full font-semibold text-gray-800 bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={formData[pilar.key as keyof typeof formData]}
                              onChange={(e) =>
                                setFormData({ ...formData, [pilar.key]: e.target.value })
                              }
                              placeholder="Nome do pilar..."
                            />
                            <textarea
                              className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={3}
                              value={formData[pilar.descKey as keyof typeof formData]}
                              onChange={(e) =>
                                setFormData({ ...formData, [pilar.descKey]: e.target.value })
                              }
                              placeholder="Descrição do pilar..."
                            />
                          </div>
                        ) : (
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-1">
                              {formData[pilar.key as keyof typeof formData]}
                            </h5>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {formData[pilar.descKey as keyof typeof formData] || 'Sem descrição.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/3 flex flex-col gap-4">
          <button
            onClick={() => setViewMode('bsc')}
            className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 text-center group overflow-hidden relative"
          >
            <div className="absolute inset-0 gradient-tecnologia opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center gap-3 relative">
              <div className="gradient-tecnologia p-3 rounded-lg group-hover:scale-110 transition-transform shadow-md flex-shrink-0">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-md text-brand-dark">BSC</h3>
                <p className="text-xs text-gray-600 leading-tight">
                  Balanced Scorecard
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setViewMode('flywheel')}
            className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 text-center group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center gap-3 relative">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-lg group-hover:scale-110 transition-transform shadow-md flex-shrink-0">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-md text-brand-dark">Flywheel</h3>
                <p className="text-xs text-gray-600 leading-tight">
                  Volante de crescimento
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setViewMode('plano-estrategico')}
            className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 text-center group overflow-hidden relative"
          >
            <div className="absolute inset-0 gradient-ambiental opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center gap-3 relative">
              <div className="gradient-ambiental p-3 rounded-lg group-hover:scale-110 transition-transform shadow-md flex-shrink-0">
                <FileImage className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-md text-brand-dark">Planejamento</h3>
                <p className="text-xs text-gray-600 leading-tight">
                  Visualização estratégica
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setViewMode('okr')}
            className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 text-center group overflow-hidden relative"
          >
            <div className="absolute inset-0 gradient-facilities opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center gap-3 relative">
              <div className="gradient-facilities p-3 rounded-lg group-hover:scale-110 transition-transform shadow-md flex-shrink-0">
                <Crosshair className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-md text-brand-dark">OKR</h3>
                <p className="text-xs text-gray-600 leading-tight">
                  Objectives and Key Results
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setViewMode('metas-departamentos')}
            className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 text-center group overflow-hidden relative"
          >
            <div className="absolute inset-0 gradient-parking opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center gap-3 relative">
              <div className="gradient-parking p-3 rounded-lg group-hover:scale-110 transition-transform shadow-md flex-shrink-0">
                <ListChecks className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-md text-brand-dark">Metas dos Departamentos</h3>
                <p className="text-xs text-gray-600 leading-tight">
                  Objetivos departamentais
                </p>
              </div>
            </div>
          </button>

          <a
            href="https://notebooklm.google.com/notebook/9992fbb4-1269-4b65-81be-33b2462a3e47"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all transform hover:scale-105 text-center group overflow-hidden relative"
          >
            <div className="absolute inset-0 gradient-seguranca opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center gap-3 relative">
              <div className="gradient-seguranca p-3 rounded-lg group-hover:scale-110 transition-transform shadow-md flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-md text-brand-dark">Estratégia Interativa</h3>
                <p className="text-xs text-gray-600 leading-tight">
                  Explore com IA
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
