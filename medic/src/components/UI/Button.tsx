import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet' | 'glowing';
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  loadingText,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center min-h-[42px] px-4 py-2 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variants = {
    primary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus:ring-cyan-300',
    secondary: 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-700 focus:ring-cyan-400',
    danger: 'bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 border border-rose-400/30 focus:ring-rose-400',
    quiet: 'text-slate-300 hover:bg-slate-800 focus:ring-cyan-400',
    glowing: 'bg-cyan-400 text-[#06101c] shadow-[0_0_24px_rgba(6,182,212,0.25)] hover:bg-cyan-300 focus:ring-cyan-300',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText || children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};