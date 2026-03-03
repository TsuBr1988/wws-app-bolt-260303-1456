import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/databaseResolver';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Upload, Save, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ImageViewerModal from './ImageViewerModal';

const supabase = getDatabase('CULTURA');

interface StrategicPlan {
  id: string;
  image1_url: string | null;
  image2_url: string | null;
  image3_url: string | null;
  description: string | null;
}

export default function PlanoEstrategicoView() {
  const { canEditIndicator } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);
  const { toast } = useToast();

  const canEdit = canEditIndicator('cultura', 'Organograma Estratégico');

  const [formData, setFormData] = useState({
    image1_url: '',
    image2_url: '',
    image3_url: '',
    description: '',
  });

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('strategic_plan')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPlan(data);
        setFormData({
          image1_url: data.image1_url || '',
          image2_url: data.image2_url || '',
          image3_url: data.image3_url || '',
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Error loading strategic plan:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar o plano estratégico.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (imageNumber: 1 | 2 | 3, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        [`image${imageNumber}_url`]: base64String,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        image1_url: formData.image1_url || null,
        image2_url: formData.image2_url || null,
        image3_url: formData.image3_url || null,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      };

      if (plan?.id) {
        const { error } = await supabase
          .from('strategic_plan')
          .update(dataToSave)
          .eq('id', plan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('strategic_plan')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await loadPlan();
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
    if (plan) {
      setFormData({
        image1_url: plan.image1_url || '',
        image2_url: plan.image2_url || '',
        image3_url: plan.image3_url || '',
        description: plan.description || '',
      });
    }
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Plano Estratégico</h3>
        {canEdit && !editMode && (
          <Button onClick={() => setEditMode(true)} size="sm">
            Editar
          </Button>
        )}
      </div>

      {editMode ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Imagem {num}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  {formData[`image${num}_url` as keyof typeof formData] ? (
                    <div className="relative">
                      <img
                        src={formData[`image${num}_url` as keyof typeof formData]}
                        alt={`Imagem ${num}`}
                        className="w-full h-48 object-contain rounded"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            [`image${num}_url`]: '',
                          }))
                        }
                        className="mt-2 w-full"
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center h-48">
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Clique para fazer upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(num as 1 | 2 | 3, file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[200px]"
              value={formData.description}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Digite a descrição do plano estratégico..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {plan && (plan.image1_url || plan.image2_url || plan.image3_url) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((num) => {
                const imageUrl = plan[`image${num}_url` as keyof StrategicPlan] as string | null;
                return imageUrl ? (
                  <div key={num} className="border border-gray-200 rounded-lg p-4 relative group">
                    <div
                      className="relative cursor-pointer overflow-hidden rounded"
                      onClick={() => setViewingImage({ url: imageUrl, title: `Imagem ${num}` })}
                    >
                      <img
                        src={imageUrl}
                        alt={`Imagem ${num}`}
                        className="w-full h-64 object-contain rounded transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Maximize2 className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Clique para ampliar
                    </p>
                  </div>
                ) : (
                  <div key={num} className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center h-64">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <span className="text-sm">Imagem não definida</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma imagem adicionada ainda.</p>
              {canEdit && (
                <p className="text-sm mt-2">Clique em &quot;Editar&quot; para adicionar imagens.</p>
              )}
            </div>
          )}

          {plan?.description && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Descrição</h4>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {plan.description}
              </div>
            </div>
          )}

          {!plan?.description && (plan?.image1_url || plan?.image2_url || plan?.image3_url) && (
            <div className="border-t border-gray-200 pt-6 text-center text-gray-500">
              <p className="text-sm">Nenhuma descrição adicionada.</p>
            </div>
          )}
        </div>
      )}

      {viewingImage && (
        <ImageViewerModal
          imageUrl={viewingImage.url}
          imageTitle={viewingImage.title}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
}
