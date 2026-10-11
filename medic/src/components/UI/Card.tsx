import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  badge,
  children,
  className = '',
}) => {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 ${className}`}>
      {(title || subtitle || badge) && (
        <div className="mb-4 flex flex-col gap-2 border-b border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
      {children}
    </section>
  );
};