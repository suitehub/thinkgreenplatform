import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'purple' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'purple',
  onClick,
  className = '',
}) => {
  const colorStyles = {
    purple: {
      bg: 'bg-purple-50/80',
      icon: 'text-purple-600',
      border: 'hover:border-purple-200',
      glow: 'group-hover:bg-purple-100',
    },
    emerald: {
      bg: 'bg-emerald-50/80',
      icon: 'text-emerald-600',
      border: 'hover:border-emerald-200',
      glow: 'group-hover:bg-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50/80',
      icon: 'text-amber-600',
      border: 'hover:border-amber-200',
      glow: 'group-hover:bg-amber-100',
    },
    rose: {
      bg: 'bg-rose-50/80',
      icon: 'text-rose-600',
      border: 'hover:border-rose-200',
      glow: 'group-hover:bg-rose-100',
    },
    sky: {
      bg: 'bg-sky-50/80',
      icon: 'text-sky-600',
      border: 'hover:border-sky-200',
      glow: 'group-hover:bg-sky-100',
    },
    slate: {
      bg: 'bg-slate-50',
      icon: 'text-slate-600',
      border: 'hover:border-slate-300',
      glow: 'group-hover:bg-slate-100',
    },
  };

  const scheme = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 ' + scheme.border : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>}

          {trend && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span
                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-[11px] text-slate-400">vs. mês anterior</span>
            </div>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${scheme.bg} ${scheme.glow} ${scheme.icon}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
