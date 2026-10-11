import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ id, label, error, helperText, className = '', ...props }: TextareaProps) {
  const describedBy = [error ? `${id}-error` : null, helperText ? `${id}-helper` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-300">{label}</label>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`min-h-28 w-full resize-y rounded-xl border bg-slate-800/80 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${error ? 'border-rose-400' : 'border-slate-700 hover:border-slate-600'} ${className}`}
        {...props}
      />
      {error && <span id={`${id}-error`} role="alert" className="text-xs font-medium text-rose-300">{error}</span>}
      {!error && helperText && <span id={`${id}-helper`} className="text-[10px] text-slate-500">{helperText}</span>}
    </div>
  );
}
