/**
 * StatsCard — professional gradient icon, shadow, trend indicator
 */

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const VARIANT_STYLES: Record<string, { icon: string; badge: string; text: string; border: string }> = {
  default:  { icon: 'from-slate-500  to-slate-600',   badge: 'bg-slate-100  text-slate-600',   text: 'text-slate-600',   border: 'border-slate-100' },
  primary:  { icon: 'from-indigo-500 to-purple-600',  badge: 'bg-indigo-50  text-indigo-600',  text: 'text-indigo-600',  border: 'border-indigo-100' },
  success:  { icon: 'from-emerald-500 to-teal-600',   badge: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600', border: 'border-emerald-100' },
  warning:  { icon: 'from-amber-400  to-orange-500',  badge: 'bg-amber-50   text-amber-600',   text: 'text-amber-600',   border: 'border-amber-100' },
  danger:   { icon: 'from-rose-500   to-red-600',     badge: 'bg-rose-50    text-rose-600',    text: 'text-rose-600',    border: 'border-rose-100' },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title, value, subtitle, icon, trend, variant = 'default',
}) => {
  const s = VARIANT_STYLES[variant];

  return (
    <div className={`bg-white rounded-2xl border ${s.border} p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 animate-fade-in`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-slate-800 leading-none truncate">{value}</p>

          {subtitle && (
            <p className="text-xs text-slate-400 mt-1.5 truncate">{subtitle}</p>
          )}

          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full
                ${trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d={trend.isPositive ? 'M7 17l9.2-9.2M17 17V7H7' : 'M17 7l-9.2 9.2M7 7v10h10'} />
                </svg>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-[10px] text-slate-400">vs last month</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.icon} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
