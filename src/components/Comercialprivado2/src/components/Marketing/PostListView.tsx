import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { MarketingPlanningPost } from '../../services/marketingPlanningService';
import { PostCard } from './PostCard';

interface PostListViewProps {
  posts: MarketingPlanningPost[];
  onDelete: (id: string) => void;
  onViewDetails: (post: MarketingPlanningPost) => void;
  onAddPost: () => void;
  currentYear: number;
  currentMonth: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const PostListView: React.FC<PostListViewProps> = ({
  posts,
  onDelete,
  onViewDetails,
  onAddPost,
  currentYear,
  currentMonth
}) => {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
    return `${dayName}, ${day}/${month}/${year}`;
  };

  const groupedPosts = posts.reduce((acc, post) => {
    const date = post.post_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(post);
    return acc;
  }, {} as Record<string, MarketingPlanningPost[]>);

  const sortedDates = Object.keys(groupedPosts).sort();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {MONTHS[currentMonth - 1]} {currentYear}
        </h2>
        <button
          onClick={onAddPost}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Postagem
        </button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            Nenhuma postagem planejada para este mês
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Clique em "Nova Postagem" para adicionar
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  {formatDate(date)}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {groupedPosts[date].length} {groupedPosts[date].length === 1 ? 'postagem' : 'postagens'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedPosts[date].map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={onDelete}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
