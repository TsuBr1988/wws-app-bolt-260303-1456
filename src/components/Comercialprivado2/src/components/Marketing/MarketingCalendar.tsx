import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, List } from 'lucide-react';
import { MarketingPlanningPost, marketingPlanningService } from '../../services/marketingPlanningService';
import { AddPostModal } from './AddPostModal';
import { PostCard } from './PostCard';
import { PostDetailModal } from './PostDetailModal';
import { PostListView } from './PostListView';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type ViewMode = 'calendar' | 'list';

export const MarketingCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<MarketingPlanningPost[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<MarketingPlanningPost | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    loadPosts();
  }, [year, month]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await marketingPlanningService.getPostsByMonth(year, month);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleAddPost = (date?: string) => {
    if (date) {
      setSelectedDate(date);
    } else {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setSelectedDate(dateStr);
    }
    setIsModalOpen(true);
  };

  const handleSubmitPost = async (post: {
    name: string;
    platforms: string[];
    post_date: string;
    idea: string;
  }) => {
    try {
      await marketingPlanningService.createPost(post);
      await loadPosts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erro ao criar postagem. Verifique o console para mais detalhes.');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta postagem?')) return;

    try {
      await marketingPlanningService.deletePost(id);
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleViewDetails = (post: MarketingPlanningPost) => {
    setSelectedPost(post);
    setIsDetailModalOpen(true);
  };

  const handleUpdatePost = async (id: string, updates: { name: string; platforms: string[]; idea: string }) => {
    try {
      await marketingPlanningService.updatePost(id, updates);
      await loadPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getPostsForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(post => post.post_date === dateStr);
  };

  const days = getDaysInMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendário
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <PostListView
          posts={posts}
          onDelete={handleDeletePost}
          onViewDetails={handleViewDetails}
          onAddPost={() => handleAddPost()}
          currentYear={year}
          currentMonth={month}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {MONTHS[month - 1]} {year}
            </h2>
          </div>

        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[120px]" />;
            }

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayPosts = getPostsForDay(day);
            const isToday = isCurrentMonth && today.getDate() === day;

            return (
              <div
                key={day}
                className={`min-h-[120px] border rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors ${
                  isToday ? 'border-blue-500 border-2' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      isToday
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                        : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </span>
                  <button
                    onClick={() => handleAddPost(dateStr)}
                    className="p-1 hover:bg-blue-50 rounded transition-colors"
                    title="Adicionar postagem"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  {dayPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDelete={handleDeletePost}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      <AddPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitPost}
        selectedDate={selectedDate}
      />

      {selectedPost && (
        <PostDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          onUpdate={handleUpdatePost}
        />
      )}
    </div>
  );
};
