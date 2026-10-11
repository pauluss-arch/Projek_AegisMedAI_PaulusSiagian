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

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children, className = '' }) => {
  const styles: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    Normal: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    Warning: 'bg-amber-50 text-amber-900 border-amber-300',
    'Rare Disease': 'bg-purple-50 text-purple-900 border-purple-300',
    danger: 'bg-rose-50 text-rose-900 border-rose-300',
    'High Risk': 'bg-rose-50 text-rose-900 border-rose-300',
    info: 'bg-sky-50 text-sky-900 border-sky-300',
  };

  const currentStyle = styles[variant] || styles.info;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle} ${className}`}
    >
      {children}
    </span>
  );
};