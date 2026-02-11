import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { Reward } from '../../types';

interface RewardCardProps {
  reward: Reward;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-w-16 aspect-h-9">
        <img
          src={reward.image}
          alt={reward.name}
          className="w-full h-48 object-cover"
        />
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {reward.category}
          </span>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Package className="w-4 h-4" />
            <span>{reward.stock} disponíveis</span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{reward.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            {reward.points.toLocaleString()} pts
          </div>
          <button 
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              reward.isAvailable 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!reward.isAvailable}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{reward.isAvailable ? 'Resgatar' : 'Indisponível'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};