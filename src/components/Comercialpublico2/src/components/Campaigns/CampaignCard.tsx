import React from 'react';
import { Calendar, Users, Target } from 'lucide-react';
import { Campaign } from '../../types';

interface CampaignCardProps {
  campaign: Campaign;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'completed': return 'Concluída';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
          {getStatusText(campaign.status)}
        </span>
      </div>
      
      <p className="text-gray-600 mb-4">{campaign.description}</p>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mb-2 mx-auto">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500">Término</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(campaign.endDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mb-2 mx-auto">
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs text-gray-500">Participantes</p>
          <p className="text-sm font-medium text-gray-900">{campaign.participants}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mb-2 mx-auto">
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500">Meta</p>
          <p className="text-sm font-medium text-gray-900">{campaign.targetPoints.toLocaleString()} pts</p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Ver Detalhes
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Editar
        </button>
      </div>
    </div>
  );
};