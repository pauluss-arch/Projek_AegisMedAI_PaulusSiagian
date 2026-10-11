import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  id,
  helperText,
  className = '',
  required,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label htmlFor={id} className="text-xs font-semibold text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        className={`min-h-[42px] px-3.5 py-2 border rounded-xl text-sm text-white bg-slate-800/80 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
            : 'border-slate-700 hover:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="mt-0.5 text-xs font-medium text-rose-300">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${id}-helper`} className="mt-0.5 text-xs text-slate-500">
          {helperText}
        </span>
      )}
    </div>
  );
};