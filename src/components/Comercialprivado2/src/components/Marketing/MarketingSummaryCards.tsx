import React from 'react';
import { Users, Eye, Share2, Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { InstagramMetrics, LinkedInMetrics } from '../../services/marketingService';

interface MarketingSummaryCardsProps {
  instagramData: InstagramMetrics[];
  linkedinData: LinkedInMetrics[];
}

export const MarketingSummaryCards: React.FC<MarketingSummaryCardsProps> = ({
  instagramData,
  linkedinData
}) => {
  const getCurrentMonthData = (data: any[], key: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return data
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + (item[key] || 0), 0);
  };

  const getPreviousMonthData = (data: any[], key: string) => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    return data
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear;
      })
      .reduce((sum, item) => sum + (item[key] || 0), 0);
  };

  const getLatestValue = (data: any[], key: string) => {
    if (data.length === 0) return 0;
    return data[0][key] || 0;
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const igFollowersCurrent = getLatestValue(instagramData, 'followers');
  const liFollowersCurrent = getLatestValue(linkedinData, 'followers');
  const igFollowersPrev = instagramData.length > 1 ? instagramData[1].followers : 0;
  const liFollowersPrev = linkedinData.length > 1 ? linkedinData[1].followers : 0;

  const igViewsCurrent = getCurrentMonthData(instagramData, 'photo_views') +
                         getCurrentMonthData(instagramData, 'video_views') +
                         getCurrentMonthData(instagramData, 'story_views');
  const liViewsCurrent = getCurrentMonthData(linkedinData, 'views');
  const igViewsPrev = getPreviousMonthData(instagramData, 'photo_views') +
                      getPreviousMonthData(instagramData, 'video_views') +
                      getPreviousMonthData(instagramData, 'story_views');
  const liViewsPrev = getPreviousMonthData(linkedinData, 'views');

  const igSharesCurrent = getCurrentMonthData(instagramData, 'shares');
  const liSharesCurrent = getCurrentMonthData(linkedinData, 'shares');
  const igSharesPrev = getPreviousMonthData(instagramData, 'shares');
  const liSharesPrev = getPreviousMonthData(linkedinData, 'shares');

  const igReactionsCurrent = getCurrentMonthData(instagramData, 'likes');
  const liReactionsCurrent = getCurrentMonthData(linkedinData, 'comments');
  const igReactionsPrev = getPreviousMonthData(instagramData, 'likes');
  const liReactionsPrev = getPreviousMonthData(linkedinData, 'comments');

  const followersChange = calculateChange(
    igFollowersCurrent + liFollowersCurrent,
    igFollowersPrev + liFollowersPrev
  );
  const viewsChange = calculateChange(
    igViewsCurrent + liViewsCurrent,
    igViewsPrev + liViewsPrev
  );
  const sharesChange = calculateChange(
    igSharesCurrent + liSharesCurrent,
    igSharesPrev + liSharesPrev
  );
  const reactionsChange = calculateChange(
    igReactionsCurrent + liReactionsCurrent,
    igReactionsPrev + liReactionsPrev
  );

  const cards = [
    {
      title: 'Seguidores',
      icon: Users,
      instagram: igFollowersCurrent,
      linkedin: liFollowersCurrent,
      change: followersChange,
      color: 'blue'
    },
    {
      title: 'Visualizações',
      icon: Eye,
      instagram: igViewsCurrent,
      linkedin: liViewsCurrent,
      change: viewsChange,
      color: 'purple'
    },
    {
      title: 'Compartilhamentos',
      icon: Share2,
      instagram: igSharesCurrent,
      linkedin: liSharesCurrent,
      change: sharesChange,
      color: 'green'
    },
    {
      title: 'Reações',
      icon: Heart,
      instagram: igReactionsCurrent,
      linkedin: liReactionsCurrent,
      change: reactionsChange,
      color: 'red'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.change >= 0;

        return (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <div className={`p-2 bg-${card.color}-100 rounded-lg`}>
                <Icon className={`w-5 h-5 text-${card.color}-600`} />
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Instagram</span>
                <span className="text-sm font-semibold text-gray-900">
                  {card.instagram.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">LinkedIn</span>
                <span className="text-sm font-semibold text-gray-900">
                  {card.linkedin.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="font-medium">
                {Math.abs(card.change).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">vs mês anterior</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
