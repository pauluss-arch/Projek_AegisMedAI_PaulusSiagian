import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'High Risk'
  | 'Rare Disease'
  | 'Normal'
  | 'Warning';
export type BadgeTone = 'cyan' | 'green' | 'amber' | 'rose' | 'purple' | 'slate';

export interface BadgeProps {
  variant?: BadgeVariant | BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children, className = '' }) => {
  const styles: Record<string, string> = {
    success: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/25',
    green: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/25',
    Normal: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/25',
    warning: 'bg-amber-400/10 text-amber-200 border-amber-400/25',
    amber: 'bg-amber-400/10 text-amber-200 border-amber-400/25',
    Warning: 'bg-amber-400/10 text-amber-200 border-amber-400/25',
    'Rare Disease': 'bg-purple-400/10 text-purple-200 border-purple-400/25',
    purple: 'bg-purple-400/10 text-purple-200 border-purple-400/25',
    danger: 'bg-rose-400/10 text-rose-200 border-rose-400/25',
    rose: 'bg-rose-400/10 text-rose-200 border-rose-400/25',
    'High Risk': 'bg-rose-400/10 text-rose-200 border-rose-400/25',
    info: 'bg-cyan-400/10 text-cyan-200 border-cyan-400/25',
    cyan: 'bg-cyan-400/10 text-cyan-200 border-cyan-400/25',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const currentStyle = styles[variant] || styles.info;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${currentStyle} ${className}`}
    >
      {children}
    </span>
  );
};