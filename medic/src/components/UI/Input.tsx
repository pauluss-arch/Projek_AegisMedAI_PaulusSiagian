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
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        className={`min-h-[42px] px-3.5 py-2 border rounded-lg text-sm text-slate-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error
            ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-red-500'
            : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600 mt-0.5">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${id}-helper`} className="text-xs text-slate-500 mt-0.5">
          {helperText}
        </span>
      )}
    </div>
  );
};