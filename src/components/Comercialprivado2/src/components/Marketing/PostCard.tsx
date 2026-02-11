import React from 'react';
import { Instagram, Linkedin, Facebook, FileText, Trash2, Eye } from 'lucide-react';
import { MarketingPlanningPost } from '../../services/marketingPlanningService';

interface PostCardProps {
  post: MarketingPlanningPost;
  onDelete: (id: string) => void;
  onViewDetails: (post: MarketingPlanningPost) => void;
}

const platformIcons: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  instagram: {
    icon: Instagram,
    color: 'text-pink-600',
    bg: 'bg-pink-50'
  },
  linkedin: {
    icon: Linkedin,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  facebook: {
    icon: Facebook,
    color: 'text-blue-700',
    bg: 'bg-blue-50'
  },
  blog: {
    icon: FileText,
    color: 'text-gray-700',
    bg: 'bg-gray-50'
  }
};

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete, onViewDetails }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 flex-1 line-clamp-2">
          {post.name}
        </h4>
        <button
          onClick={() => onDelete(post.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
          title="Excluir postagem"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-600" />
        </button>
      </div>

      {post.idea && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {post.idea}
        </p>
      )}

      <div className="flex items-center gap-1 mb-2">
        {post.platforms.map(platform => {
          const config = platformIcons[platform];
          if (!config) return null;
          const Icon = config.icon;

          return (
            <div
              key={platform}
              className={`flex items-center gap-1 px-2 py-1 rounded ${config.bg}`}
              title={platform}
            >
              <Icon className={`w-3 h-3 ${config.color}`} />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onViewDetails(post)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Ver mais detalhes"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver mais
        </button>
      </div>
    </div>
  );
};
