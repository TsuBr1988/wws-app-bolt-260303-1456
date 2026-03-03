import { useState, useEffect } from 'react';
import { Edit2, Save, X, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { getDatabase } from '@/lib/databaseResolver';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const supabase = getDatabase('CULTURA');

interface FlywheelData {
  id: string;
  cover_image_url: string | null;
  pdf_url: string | null;
  content: string | null;
}

export default function FlywheelView() {
  const [data, setData] = useState<FlywheelData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { canEditIndicator } = useAuth();

  const canEdit = canEditIndicator('cultura', 'Organograma Estratégico');

  const [formData, setFormData] = useState({
    cover_image_url: '',
    pdf_url: '',
    content: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Clean up previous blob URL
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
    }

    // Create new blob URL from base64 if available
    if (formData.pdf_url && formData.pdf_url.startsWith('data:')) {
      try {
        // Convert base64 to blob
        const base64Data = formData.pdf_url.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (error) {
        console.error('Error creating blob URL:', error);
        setPdfBlobUrl(null);
      }
    } else {
      setPdfBlobUrl(null);
    }

    // Cleanup function
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [formData.pdf_url]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('flywheel')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (result) {
        setData(result);
        setFormData({
          cover_image_url: result.cover_image_url || '',
          pdf_url: result.pdf_url || '',
          content: result.content || '',
        });
      }
    } catch (error) {
      console.error('Error loading flywheel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        cover_image_url: formData.cover_image_url || null,
        pdf_url: formData.pdf_url || null,
        content: formData.content || null,
        updated_at: new Date().toISOString(),
      };

      if (data?.id) {
        const { error } = await supabase
          .from('flywheel')
          .update(dataToSave)
          .eq('id', data.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('flywheel')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await loadData();
      setEditMode(false);

      toast({
        title: 'Sucesso',
        description: 'Flywheel salvo com sucesso.',
      });
    } catch (error) {
      console.error('Error saving flywheel:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o flywheel.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      setFormData({
        cover_image_url: data.cover_image_url || '',
        pdf_url: data.pdf_url || '',
        content: data.content || '',
      });
    }
    setEditMode(false);
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        cover_image_url: base64String,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        pdf_url: base64String,
      }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Flywheel</h2>
          <p className="text-gray-600 mt-1">Volante de crescimento da empresa</p>
        </div>
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

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-brand-dark">Imagem de Capa</h3>
          </div>
          {editMode ? (
            <div className="space-y-3">
              {formData.cover_image_url ? (
                <div className="relative">
                  <img
                    src={formData.cover_image_url}
                    alt="Preview"
                    className="w-full h-64 object-contain rounded-lg border border-gray-200"
                  />
                  <div className="flex gap-2 mt-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">Trocar Imagem</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm font-medium">Clique para fazer upload</p>
                    <p className="text-gray-400 text-xs mt-1">PNG, JPG ou GIF</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          ) : (
            <div>
              {formData.cover_image_url ? (
                <img
                  src={formData.cover_image_url}
                  alt="Flywheel Cover"
                  className="w-full h-auto rounded-lg border border-gray-200"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Upload className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma imagem adicionada</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-brand-dark">Documento PDF</h3>
          </div>
          {editMode ? (
            <div className="space-y-3">
              {formData.pdf_url ? (
                <div className="relative">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-8 w-8 text-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">PDF Carregado</p>
                        <p className="text-xs text-gray-500">Clique em "Ver PDF" para visualizar</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-50 transition-colors border border-red-300">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm font-medium">Trocar PDF</span>
                        </div>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handlePdfUpload(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={() => setFormData({ ...formData, pdf_url: '' })}
                        className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-50 transition-colors border border-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {pdfBlobUrl && (
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full h-[300px] rounded-lg border border-gray-200 mt-3"
                      title="PDF Preview"
                    />
                  )}
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50/30 transition-colors">
                    <FileText className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm font-medium">Clique para fazer upload</p>
                    <p className="text-gray-400 text-xs mt-1">Apenas arquivos PDF</p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePdfUpload(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          ) : (
            <div>
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-[400px] rounded-lg border border-gray-200"
                  title="Flywheel PDF"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">Nenhum PDF adicionado</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
        <h3 className="text-lg font-semibold text-brand-dark mb-4">Descrição</h3>
        {editMode ? (
          <textarea
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Cole o texto descritivo do flywheel aqui..."
          />
        ) : (
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {formData.content || 'Nenhum texto adicionado. Clique em "Editar" para adicionar uma descrição.'}
          </div>
        )}
      </div>
    </div>
  );
}
