// AegisMed AI - Accessible SVG Icon System
// Lucide-compatible stroke and viewBox specifications (24x24, 2px stroke, round caps)

import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  title?: string;
}

const defaultProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const Activity: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const ShieldCheck: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Pill: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

export const Database: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </svg>
);

export const AlertTriangle: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const AlertCircle: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const CheckCircle2: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Info: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export const Search: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const Filter: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

export const Stethoscope: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

export const User: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const Lock: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const Sparkles: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
  </svg>
);

export const X: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const ArrowRight: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const ChevronRight: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ChevronDown: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const RefreshCw: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export const Menu: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

export const FileText: React.FC<IconProps> = ({ size = 20, className = '', title, ...props }) => (
  <svg width={size} height={size} className={className} aria-hidden={!title} role={title ? 'img' : 'presentation'} {...defaultProps} {...props}>
    {title && <title>{title}</title>}
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

