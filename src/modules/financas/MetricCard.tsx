
import React from 'react';
import { Info } from 'lucide-react';
import { formatCurrency } from './utils';

interface MetricCardProps {
    title: string;
    value: number;
    subtitle?: string;
    icon: any;
    type?: 'neutral' | 'success' | 'danger' | 'warning' | 'info';
    onInfoClick?: () => void;
    disableCurrencyFormat?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, type = 'neutral', onInfoClick, disableCurrencyFormat = false }) => {
  const getStyle = () => {
    switch(type) {
      case 'success': return { 
          iconBg: 'bg-emerald-50', 
          iconText: 'text-emerald-500',
          valueText: 'text-emerald-600',
      };
      case 'danger': return { 
          iconBg: 'bg-rose-50', 
          iconText: 'text-rose-500',
          valueText: 'text-slate-900', 
      };
      case 'warning': return { 
          iconBg: 'bg-amber-50', 
          iconText: 'text-amber-500',
          valueText: 'text-slate-900',
      };
      case 'info': return { 
          iconBg: 'bg-blue-50', 
          iconText: 'text-blue-500',
          valueText: 'text-slate-900',
      };
      default: return { 
          iconBg: 'bg-slate-50', 
          iconText: 'text-slate-500',
          valueText: 'text-slate-900',
      };
    }
  };

  const style = getStyle();

  return (
    <div className={`bg-white p-7 rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all hover:scale-105 relative group overflow-hidden`}>
      <div className="flex justify-between items-center mb-4">
        <div className={`p-3.5 rounded-xl ${style.iconBg} ${style.iconText} group-hover:scale-110 transition-transform shadow-md`}>
          <Icon className="w-6 h-6" />
        </div>
        {subtitle && (
            <span className="px-3 py-1 rounded-full bg-slate-50 text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
              {subtitle}
            </span>
          )}
        {onInfoClick && (
            <button 
                onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
                className="absolute top-7 right-7 p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                title="Ver detalhes"
            >
                <Info className="w-5 h-5" />
            </button>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <h3 className={`text-3xl font-bold tracking-tight ${value < 0 ? 'text-rose-600' : 'text-brand-dark'}`}>
          {disableCurrencyFormat ? value : formatCurrency(value)}
        </h3>
      </div>
    </div>
  );
};

export default MetricCard;
