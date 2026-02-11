import React, { useState, useEffect } from 'react';
import { X, Save, Instagram, Linkedin, Facebook, FileText, Edit2 } from 'lucide-react';
import { MarketingPlanningPost } from '../../services/marketingPlanningService';

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: MarketingPlanningPost;
  onUpdate: (id: string, updates: { name: string; platforms: string[]; idea: string }) => Promise<void>;
}

const platformOptions = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-700' },
  { value: 'blog', label: 'Blog', icon: FileText, color: 'text-gray-700' }
];

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  isOpen,
  onClose,
  post,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: post.name,
    platforms: post.platforms,
    idea: post.idea || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: post.name,
        platforms: post.platforms,
        idea: post.idea || ''
      });
      setIsEditing(false);
    }
  }, [isOpen, post]);

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('O título é obrigatório');
      return;
    }

    if (formData.platforms.length === 0) {
      alert('Selecione pelo menos uma plataforma');
      return;
    }

    try {
      setIsSaving(true);
      await onUpdate(post.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Erro ao atualizar postagem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: post.name,
      platforms: post.platforms,
      idea: post.idea || ''
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Detalhes da Postagem</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data da Postagem
            </label>
            <div className="bg-gray-50 rounded-lg p-3 text-gray-900 font-medium">
              {formatDate(post.post_date)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Título *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Postagem sobre serviços de limpeza"
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 text-gray-900 font-medium">
                {post.name}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Plataformas *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {platformOptions.map(platform => {
                const Icon = platform.icon;
                const isSelected = isEditing
                  ? formData.platforms.includes(platform.value)
                  : post.platforms.includes(platform.value);

                return (
                  <button
                    key={platform.value}
                    onClick={() => isEditing && handlePlatformToggle(platform.value)}
                    disabled={!isEditing}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : platform.color}`} />
                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                      {platform.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ideia / Descrição
            </label>
            {isEditing ? (
              <textarea
                value={formData.idea}
                onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Descreva a ideia da postagem, conteúdo, objetivo, etc..."
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-[120px]">
                {post.idea || 'Nenhuma descrição adicionada'}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
